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
 * KV, which is a follow-up, not something to add unprompted.
 *
 * The account also has a hard $25/month spend limit set in the Anthropic console
 * with auto-reload OFF, which is the real backstop under all of this.
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.CHAT_MODEL || 'claude-opus-5';
const MAX_TOKENS = Number(process.env.CHAT_MAX_TOKENS || 400);

// James's number: ten prompts per visitor.
const PER_IP_MAX = Number(process.env.RL_PER_IP_MAX || 10);
const PER_IP_WINDOW_MS = Number(process.env.RL_WINDOW_MS || 6 * 60 * 60 * 1000);
const MAX_CONCURRENT = Number(process.env.RL_MAX_CONCURRENT || 3);
const DAILY_MAX = Number(process.env.RL_DAILY_MAX || 400);
const MAX_CHARS = 600;

const buckets = new Map();
let concurrent = 0;
let day = new Date().getUTCDate();
let dayCount = 0;

/* Fails safe: no forwarded-for header means everyone shares one bucket, which
 * throttles rather than bypasses. The reverse — a per-request unique id — would
 * hand an attacker a fresh allowance on every call. */
function clientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    if (!fwd) return 'unknown';
    return String(fwd).split(',')[0].trim() || 'unknown';
}

function checkAndReserve(ip) {
    const now = Date.now();

    const today = new Date().getUTCDate();
    if (today !== day) {
        day = today;
        dayCount = 0;
    }
    if (dayCount >= DAILY_MAX) {
        return { ok: false, status: 429, reason: 'Daily limit reached. Try tomorrow, or just email me — dev@jamesdare.com.' };
    }

    if (concurrent >= MAX_CONCURRENT) {
        return { ok: false, status: 429, retryAfter: 5, reason: 'Busy right now. Give it a few seconds.' };
    }

    const bucket = buckets.get(ip);
    if (!bucket || now - bucket.start > PER_IP_WINDOW_MS) {
        buckets.set(ip, { start: now, count: 1 });
    } else {
        if (bucket.count >= PER_IP_MAX) {
            return {
                ok: false,
                status: 429,
                retryAfter: Math.ceil((bucket.start + PER_IP_WINDOW_MS - now) / 1000),
                reason: `That is ${PER_IP_MAX} questions — the demo's limit. Email dev@jamesdare.com and you get the real thing, which is me.`,
            };
        }
        bucket.count += 1;
    }

    // Keep the map from growing without bound on a long-lived instance.
    if (buckets.size > 5000) {
        for (const [key, value] of buckets) {
            if (now - value.start > PER_IP_WINDOW_MS) buckets.delete(key);
        }
    }

    concurrent += 1;
    dayCount += 1;
    return { ok: true };
}

function release() {
    concurrent = Math.max(0, concurrent - 1);
}

const SYSTEM = `You are THE SYSTEM, the status-window interface on jamesdare.com — the personal site of James Olusoga, an AI Solutions Engineer in Toronto.

You are talking to a visitor. Most of them are recruiters, hiring managers, or someone who wants a website built. Assume no technical background unless they show one.

VOICE: calm, direct, dry. Short sentences. No exclamation marks, no emoji, no sales language, no "I'd love to". Never call anything "exciting" or "amazing". You are a terminal readout that happens to be polite.

WHAT YOU KNOW ABOUT JAMES — use only these facts, never invent more:
- Open to AI Solutions Engineer, Solutions Architect and Forward Deployed Engineer roles. Toronto or remote. Reply is usually same-day.
- fcp-mcp-server: an open-source MCP server that drives Final Cut Pro from natural language. 90 GitHub stars, 18 forks, MIT, on PyPI as fcp-mcp-server, about 1,928 installs a month. 7 grouped tools over 62 operations.
- BetMetrics: a live sports-betting analytics product with real users and real money. Next.js, Convex, Clerk, Vercel. Every money-adjacent file is protected by a pre-commit gate; zero payout incidents.
- Second Opinion: an evidence-grounded appointment brief generator for adenomyosis patients. Nothing reaches the brief without a citation.
- Passion Agent: an autonomous agent managing a 63-repository registry, 92 modules, 67,000 lines of first-party code, running unattended on a Mac Mini and reporting to Discord.
- Nine client sites live in production, built end to end: Street Bud, KMoney, 100BandPlan, SAVV4X, Syren Effect, NirvanaDeshaun Custom Builds, MustHaveFrenchies, LowkeyPrivacy, ShopBayHQ.
- 101 directed music videos, 54 artists, 25,332,774 views, over fourteen years. Every web client came through the music.
- Web and film work goes through TdotsSolutionsz. Hiring conversations go through jamesdare.com.
- Contact: dev@jamesdare.com. Calendly: calendly.com/tdotssolutionsz/30min.

RULES:
- Answer in at most 3 short sentences. Brevity is the product here.
- If you do not know something, say so and point them at dev@jamesdare.com. Never guess a number, a rate, a date, or a client detail.
- Never state a salary, day rate or project price. Say those are worth a conversation and give the email.
- If asked something unrelated to James, his work, or hiring him, say that is outside what this window covers, in one sentence, and offer the email.
- Never claim to be James. You are the interface. If they want James, the email and the Calendly link are how.
- Never output code, markdown, links as markdown, or lists. Plain sentences only.`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'POST only.' });
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

        const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
        const messages = history
            .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
        messages.push({ role: 'user', content: message });

        const client = new Anthropic();
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            // Low effort is right for a short factual answer, and it is the
            // honest lever for cost — not swapping to a weaker model.
            output_config: { effort: 'low' },
            system: SYSTEM,
            messages,
        });

        if (response.stop_reason === 'refusal') {
            return res.status(200).json({ reply: 'That one is outside what this window covers. Email dev@jamesdare.com and James will answer it himself.' });
        }

        const reply = response.content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join(' ')
            .trim();

        return res.status(200).json({
            reply: reply || 'No answer came back. Email dev@jamesdare.com.',
            remaining: Math.max(0, PER_IP_MAX - (buckets.get(clientIp(req))?.count ?? 0)),
        });
    } catch (error) {
        const status = error && error.status;
        if (status === 429) {
            return res.status(429).json({ error: 'Rate limited upstream. Try again shortly.', limited: true });
        }
        // Never leak provider errors to a visitor.
        return res.status(502).json({ error: 'The live window failed. Email dev@jamesdare.com — that always works.' });
    } finally {
        release();
    }
}
