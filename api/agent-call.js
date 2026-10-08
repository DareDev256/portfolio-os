/* POST /api/agent-call — ElevenLabs post-call webhook for the two website voice agents.
 *
 * Every website voice conversation, booked or not, lands in James's #inbox as a short summary, so a
 * visitor who talked but didn't book isn't lost. Signed by ElevenLabs: header
 * `ElevenLabs-Signature: t=<ts>,v0=<hmac>` = HMAC_SHA256(AGENT_WEBHOOK_SECRET, `${ts}.${rawBody}`),
 * 30-minute tolerance (same check as passion-callscreen). Unsigned or stale requests get 401.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { notify } from './_notify.js';

const AGENTS = { agent_8001m4e12p1dfz5rx4w7tr06a1xw: 'jamesdare.com', agent_0601m4e12qvqeegt2z2a9xg99x96: 'tdotssolutionsz.com' };

export function verify(raw, header, secret, now = Date.now()) {
    if (!secret || !header) return false;
    const parts = Object.fromEntries(String(header).split(',').map((p) => p.split('=')));
    if (!parts.t || !parts.v0 || Math.abs(now / 1000 - Number(parts.t)) > 30 * 60) return false;
    const want = Buffer.from(createHmac('sha256', secret).update(`${parts.t}.${raw}`).digest('hex'));
    const got = Buffer.from(parts.v0);
    return got.length === want.length && timingSafeEqual(got, want);
}

export function summarize(evt) {
    const d = evt?.data || {};
    const site = AGENTS[d.agent_id] || 'unknown site';
    const secs = d.metadata?.call_duration_secs ?? 0;
    const turns = (d.transcript || []).filter((t) => t.role === 'user' && (t.message || '').trim()).length;
    const booked = (d.transcript || []).some((t) => (t.tool_results || []).some((r) => r.tool_name === 'book_intro_call' && /"ok":\s*true/.test(String(r.result_value))));
    const summary = (d.analysis?.transcript_summary || '').trim() || '(no summary)';
    const head = booked ? '📞 **Voice chat → BOOKED**' : turns ? '🗣️ **Voice chat, no booking**' : '🔇 Voice chat, visitor said nothing';
    return { quiet: turns === 0, text: `${head} · ${site} · ${Math.round(secs)}s\n${summary}` };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const chunks = []; for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!verify(raw, req.headers['elevenlabs-signature'], process.env.AGENT_WEBHOOK_SECRET)) return res.status(401).json({ error: 'unauthorized' });
    let evt; try { evt = JSON.parse(raw); } catch { return res.status(400).json({ error: 'bad json' }); }
    if (evt.type !== 'post_call_transcription') return res.status(200).json({ ok: true, ignored: evt.type });
    const s = summarize(evt);
    if (!s.quiet) await notify(s.text);      // a silent open-and-close is noise, not a lead
    return res.status(200).json({ ok: true });
}
