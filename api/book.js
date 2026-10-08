/* POST /api/book { name, email, note?, site: 'jamesdare'|'tdots', start: ISO, website: '' }
 *
 * Re-reads the calendar LIVE and only books if that exact start is still offered (no race with a
 * meeting added a minute ago, and the 3-per-day cap counted from the calendar itself). Creates the
 * event on James's calendar with the visitor as a guest, so Google emails them the invite + Meet link.
 * Per-IP: 3 bookings per 6 h. A hidden `website` field catches form-filling bots.
 */
import { cors, readCalendar, slotsFrom, validate, createBooking } from './_booking.js';
import { clientIp } from './_limit.js';

const recent = new Map();

export default async function handler(req, res) {
    const corsOk = cors(req, res, 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(corsOk ? 204 : 403).end();
    if (!corsOk) return res.status(403).json({ error: 'origin not allowed' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const ip = clientIp(req), now = Date.now();
    const mine = (recent.get(ip) || []).filter((t) => now - t < 6 * 3600e3);
    if (mine.length >= 3) return res.status(429).json({ error: 'That is a lot of bookings. Message James on WhatsApp instead.' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const v = validate(body);
    if (v.error === 'spam') return res.status(200).json({ ok: true });   // say nothing useful to a bot
    if (v.error) return res.status(400).json({ error: v.error });

    try {
        const cal = await readCalendar(now);
        if (!cal.complete) return res.status(503).json({ error: 'Booking is paused while the calendar re-syncs. Try WhatsApp.' });
        const offered = new Set(slotsFrom(cal.busy, now, cal.bookedPerDay));
        if (!offered.has(new Date(v.start).toISOString())) return res.status(409).json({ error: 'That time was just taken. Pick another.' });
        const made = await createBooking(cal.token, v);
        recent.set(ip, [...mine, now]);
        return res.status(200).json({ ok: true, start: new Date(v.start).toISOString(), meet: made.meet });
    } catch (e) {
        console.error('book', e.message);
        return res.status(503).json({ error: 'Booking failed on our side. Message James on WhatsApp.' });
    }
}
