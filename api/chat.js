/* POST /api/chat — the live half of ASK THE SYSTEM.
 *
 * A public, unauthenticated endpoint that spends real money, so the spend cap is
 * the feature and the model call is the easy part. Order of operations matters:
 * the limiter reserves BEFORE the body is parsed, so a rejected caller never
 * costs a body buffer, and before any model call, so it never costs tokens.
 *
 * The limiter is in-memory, which means per-instance: the real ceiling is
 * roughly LIMIT x live instances, and a cold start resets counters. That
 * reliably stops one IP hammering, runaway concurrency, and a single instance
 * grinding all day. It is NOT a hard cross-instance wall — that needs Upstash or
 * KV, which is a follow-up, not something to add unprompted. It lives in
 * ./_limit.js because /api/draft spends too, and two endpoints with two
 * private counters would be two budgets.
 *
 * The account also has a hard $25/month spend limit set in the Anthropic console
 * with auto-reload OFF, which is the real backstop under all of this.
 */

import Anthropic from '@anthropic-ai/sdk';
import { guardReply } from './_guard.js';
import { checkAndReserve, release, clientIp, used, PER_IP_MAX } from './_limit.js';

/* Haiku by default. The task is a three-sentence answer from a fixed fact list —
 * there is no reasoning here for a larger model to do, and a visitor cannot tell
 * which model wrote three sentences. What they CAN tell is a dead chat box,
 * which is what happens when the month's budget goes in week two. Set
 * CHAT_MODEL=claude-opus-5 in Vercel to flip it; nothing else changes. */
const MODEL = process.env.CHAT_MODEL || 'claude-haiku-4-5';
const MAX_TOKENS = Number(process.env.CHAT_MAX_TOKENS || 400);

// Ceiling on any single message, inbound or replayed from history.
const MAX_CHARS = 600;

/* The fact list below used to hardcode "90 GitHub stars, 18 forks, about 1,928
 * installs" — all three wrong by the time anyone read them, and this endpoint
 * SPEAKS them to recruiters. A stale number on the page is a drift bug; a model
 * confidently reciting it in conversation is worse, because the visitor cannot
 * see it was written months ago.
 *
 * Read from the same generated file the page uses. If it cannot be read the
 * numbers are OMITTED rather than guessed — the model is told to send them to
 * the email instead, which is the honest failure. */
/* Personas live in ./_personas.js so both voices share ONE fact list built from
 * the generated figures.json. Two prompts with two copies of the facts is two
 * things to update, and one of them drifts — which is exactly how "90 stars"
 * survived in this file while the page said 94. */
import { resolvePersona } from './_personas.js';

/* passion.jamesdare.com calls this endpoint cross-origin. An explicit allowlist,
 * never a wildcard: this endpoint spends money, so anyone who can call it can
 * spend it. A '*' here would let any site on the internet bill his Anthropic
 * account through a browser. */
const ALLOWED_ORIGINS = new Set([
    'https://jamesdare.com',
    'https://www.jamesdare.com',
    'https://passion.jamesdare.com',
]);

function applyCors(req, res) {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Max-Age', '86400');
        return true;
    }
    return false;
}

export default async function handler(req, res) {
    const corsOk = applyCors(req, res);

    // Preflight is answered BEFORE the rate limiter — a browser's OPTIONS is not
    // a user message, and charging it against the visitor's ten-message budget
    // would halve every cross-origin conversation.
    if (req.method === 'OPTIONS') return res.status(corsOk ? 204 : 403).end();

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'POST only.' });
    }

    // A cross-origin POST from an origin not on the list is refused outright.
    if (req.headers.origin && !corsOk) {
        return res.status(403).json({ error: 'Origin not allowed.' });
    }

    // Reserve before parsing the body and before any model call.
    const guard = checkAndReserve(clientIp(req));
    if (!guard.ok) {
        if (guard.retryAfter) res.setHeader('Retry-After', String(guard.retryAfter));
        return res.status(guard.status).json({ error: guard.reason, limited: true });
    }

    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(503).json({ error: 'The live window is not wired up right now. Email dev@jamesdare.com.' });
        }

        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const message = String(body.message || '').trim().slice(0, MAX_CHARS);
        if (!message) return res.status(400).json({ error: 'Say something first.' });

        // Persona picks the VOICE only. Both share one fact list and one set of
        // hard rules, so an unknown value falling back to `system` is safe —
        // it is the stricter of the two.
        const persona = resolvePersona(body.persona);

        const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
        const messages = history
            .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
        messages.push({ role: 'user', content: message });

        /* effort is NOT universal. It errors on Haiku 4.5 and Sonnet 4.5 — only
         * the Opus 4.5+ / Sonnet 5 / Fable tier accepts it. Sending it to Haiku
         * returns a 400, which this handler was turning into an opaque 502.
         * Send it only where it is supported. */
        // Read the PERSONA's model, not the module default — Passion runs a
        // higher tier than THE SYSTEM, and the effort test has to follow the
        // model actually being sent or it goes back to 400ing on Haiku.
        const model = persona.model || MODEL;
        const supportsEffort = /opus|sonnet-5|fable/.test(model);
        const request = {
            model,
            max_tokens: MAX_TOKENS,
            system: persona.prompt,
            messages,
        };
        if (supportsEffort) request.output_config = { effort: 'low' };

        const client = new Anthropic();
        const response = await client.messages.create(request);

        if (response.stop_reason === 'refusal') {
            return res.status(200).json({ reply: 'That one is outside what this window covers. Email dev@jamesdare.com and James will answer it himself.' });
        }

        const raw = response.content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join(' ');

        // Runs regardless of what the model was persuaded to say.
        const { text, blocked } = guardReply(raw);

        return res.status(200).json({
            reply: text,
            guarded: blocked || undefined,
            remaining: Math.max(0, PER_IP_MAX - used(clientIp(req))),
        });
    } catch (error) {
        const status = error && error.status;
        if (status === 429) {
            return res.status(429).json({ error: 'Rate limited upstream. Try again shortly.', limited: true });
        }
        /* Never leak provider errors to a visitor, but do surface enough to
         * diagnose from outside — an opaque 502 cost a deploy cycle finding that
         * `effort` is rejected on Haiku. `code` carries the upstream status only. */
        return res.status(502).json({
            error: 'The live window failed. Email dev@jamesdare.com — that always works.',
            code: status || 'unknown',
        });
    } finally {
        release();
    }
}
