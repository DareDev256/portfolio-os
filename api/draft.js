/* POST /api/draft — turn the chat into an email a person would actually send.
 *
 * Why this exists: the SEND IT TO JAMES button used to build a mailto: from the
 * visitor's raw text. Someone types "hey do u do sites for restaurants" and that
 * fragment is the entire email James receives, under a generic subject. The
 * whole pitch of the window is that it is useful, and handing back the user's
 * own half-sentence is the opposite.
 *
 * So this composes: a real subject line and a short, plain, signed-off body,
 * built from what the visitor actually asked. It never invents a name, a
 * company, a budget or a deadline — a fabricated detail in an email James has
 * to answer is worse than a thin one.
 *
 * It shares the limiter with /api/chat. It only fires on an explicit click, so
 * volume is a fraction of chat, but it spends, so it is gated identically.
 */

import Anthropic from '@anthropic-ai/sdk';
import { checkAndReserve, release, clientIp } from './_limit.js';
import { stripForeignLinks } from './_guard.js';

const MODEL = process.env.DRAFT_MODEL || process.env.CHAT_MODEL || 'claude-haiku-4-5';
const MAX_TOKENS = Number(process.env.DRAFT_MAX_TOKENS || 500);
const MAX_CHARS = 600;

const SYSTEM = `You turn a short chat into an email that a visitor to jamesdare.com is about to send to James Olusoga, an AI Solutions Engineer in Toronto.

Write it as the VISITOR, to James. First person, as the person who was asking.

Return exactly two lines and nothing else:
SUBJECT: <one short specific line, under 70 characters, no quotes>
BODY: <the email body>

BODY rules:
- 2 to 4 short sentences, then a blank line, then "— sent from jamesdare.com".
- Plain sentences. No markdown, no bullet points, no links, no emoji, no exclamation marks.
- Say what they are asking about and what they want back. That is all.
- NEVER invent a name, company, budget, timeline, phone number or any detail the visitor did not give. If they gave none, the email simply does not have one.
- If they said nothing substantive, write a plain note asking to get in touch.
- Do not thank James in advance, do not flatter, do not write "I hope this finds you well".`;

function parse(raw) {
    const subject = /SUBJECT:\s*(.+)/i.exec(raw)?.[1]?.trim() || '';
    const body = /BODY:\s*([\s\S]+)/i.exec(raw)?.[1]?.trim() || '';
    return { subject, body };
}

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
            return res.status(503).json({ error: 'Drafting is not wired up right now.' });
        }

        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
        const asked = history
            .filter((m) => m && m.role === 'user' && typeof m.content === 'string')
            .map((m) => m.content.slice(0, MAX_CHARS))
            .join('\n');
        const seed = (asked || String(body.message || '')).trim().slice(0, MAX_CHARS * 2);
        if (!seed) return res.status(400).json({ error: 'Nothing to draft from.' });

        const supportsEffort = /opus|sonnet-5|fable/.test(MODEL);
        const request = {
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: SYSTEM,
            messages: [{ role: 'user', content: `What the visitor asked in the window:\n${seed}` }],
        };
        if (supportsEffort) request.output_config = { effort: 'low' };

        const client = new Anthropic();
        const response = await client.messages.create(request);
        const raw = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');

        let { subject, body: text } = parse(raw);

        /* Deterministic floor. If the model returns something unusable the
         * button must still open a sane email — a dead mailto is worse than a
         * plain one. */
        if (!subject || subject.length > 90) subject = 'Enquiry from jamesdare.com';
        if (!text || text.length < 20) {
            text = `I was on jamesdare.com and wanted to get in touch.\n\n— sent from jamesdare.com`;
        }
        text = stripForeignLinks(text).slice(0, 1200);
        if (!/jamesdare\.com\s*$/.test(text)) text += '\n\n— sent from jamesdare.com';

        return res.status(200).json({ subject, body: text });
    } catch (error) {
        const status = error && error.status;
        return res.status(502).json({ error: 'Could not draft that.', code: status || 'unknown' });
    } finally {
        release();
    }
}
