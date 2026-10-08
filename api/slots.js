/* GET /api/slots → { slots: [ISO start, ...], complete, measuredAt }
 *
 * Live from Google on every call: what is shown is free right now. Start times only, never titles.
 * If any calendar can't be read, slots is [] and `complete` is false: an incomplete read must never be
 * offered to the public, because that is how an intro call lands on top of an interview.
 */
import { cors, readCalendar, slotsFrom, voiceOptions } from './_booking.js';
import { clientIp } from './_limit.js';

const hits = new Map();   // light per-IP throttle: slots is cheap but should not be scraped in a loop

export default async function handler(req, res) {
    const corsOk = cors(req, res, 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(corsOk ? 204 : 403).end();
    if (!corsOk) return res.status(403).json({ error: 'origin not allowed' });
    if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
    const ip = clientIp(req), now = Date.now();
    const h = (hits.get(ip) || []).filter((t) => now - t < 60e3);
    if (h.length >= 20) return res.status(429).json({ error: 'slow down' });
    hits.set(ip, [...h, now]);
    res.setHeader('Cache-Control', 'no-store');
    try {
        const cal = await readCalendar(now);
        if (!cal.complete) return res.status(200).json({ slots: [], complete: false, reason: 'calendar not fully readable right now', measuredAt: new Date(now).toISOString() });
        const slots = slotsFrom(cal.busy, now, cal.bookedPerDay);
        if (req.query?.voice) return res.status(200).json({ complete: true, options: voiceOptions(slots), note: 'Times are Toronto time. Offer two or three, then book the one the caller picks using its start value exactly.' });
        return res.status(200).json({ slots, complete: true, measuredAt: new Date(now).toISOString() });
    } catch (e) {
        console.error('slots', e.message);
        return res.status(503).json({ slots: [], complete: false, reason: 'booking is offline; use WhatsApp or email', measuredAt: new Date(now).toISOString() });
    }
}
