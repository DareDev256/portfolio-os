/* Free 15-minute intro calls, booked straight onto James's calendar.
 *
 * One backend for both sites: jamesdare.com and tdotssolutionsz.com call /api/slots and /api/book.
 * Google is asked LIVE on every request (freebusy), so a slot shown is free right now, across every
 * calendar James has: tdot primary (Audi shift + cars live there) plus the dev and personal calendars,
 * which are shared to tdot as "free/busy only" and listed in BOOKING_BUSY_CALENDARS.
 *
 * The credential is calendar-only (BOOKING_GOOGLE_*): freebusy + create events on tdot. It cannot
 * read mail. Visitors only ever see start times, never a title.
 *
 * Refuses rather than guesses: if any listed calendar answers with an error, /api/slots returns no
 * slots and says why, and /api/book re-checks the exact slot before it writes anything.
 */

export const TZ = 'America/Toronto';
export const RULES = {
    slotMin: 15,
    bufferMin: 15,
    minNoticeH: 12,
    horizonDays: 14,
    // Audi Mon-Fri 7:30-16:30 is a busy event on the calendar; calls go after it, plus Saturday midday.
    hours: { 1: [16.75, 19], 2: [16.75, 19], 3: [16.75, 19], 4: [16.75, 19], 5: [16.75, 19], 6: [11, 14] },
    maxPerDay: 3,
};
export const MARK = '[intro-call]';   // in every booked event's description, so the day cap can count them

export const ALLOWED_ORIGINS = new Set([
    'https://jamesdare.com', 'https://www.jamesdare.com',
    'https://tdotssolutionsz.com', 'https://www.tdotssolutionsz.com',
    'http://localhost:5173', 'http://localhost:4173',
]);

export function cors(req, res, methods) {
    const origin = req.headers.origin;
    const ok = !origin || ALLOWED_ORIGINS.has(origin);
    if (origin && ok) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
        res.setHeader('Access-Control-Allow-Methods', methods);
        res.setHeader('Access-Control-Max-Age', '86400');
    }
    return ok;
}

function localParts(ms) {
    const p = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ, hour12: false, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(ms));
    const g = (t) => p.find((x) => x.type === t).value;
    const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[g('weekday')];
    return { day: `${g('year')}-${g('month')}-${g('day')}`, wd, h: +g('hour') % 24, m: +g('minute') };
}

export function localDay(ms) { return localParts(ms).day; }

/* Pure: busy intervals [[startMs, endMs]] + already-booked intro calls per local day → start times. */
export function slotsFrom(busy, now = Date.now(), bookedPerDay = {}, rules = RULES) {
    const step = 15 * 60e3, len = rules.slotMin * 60e3, buf = rules.bufferMin * 60e3;
    const start = Math.ceil((now + rules.minNoticeH * 3600e3) / step) * step;
    const end = now + rules.horizonDays * 864e5;
    const out = [];
    for (let t = start; t + len <= end; t += step) {
        const a = localParts(t), b = localParts(t + len - 1);
        const win = rules.hours[a.wd];
        if (!win || a.day !== b.day) continue;
        if (a.h + a.m / 60 < win[0] || b.h + (b.m + 1) / 60 > win[1]) continue;
        if ((bookedPerDay[a.day] || 0) >= rules.maxPerDay) continue;
        if (busy.some(([s, e]) => s < t + len + buf && e > t - buf)) continue;
        out.push(new Date(t).toISOString());
    }
    return out;
}

async function accessToken() {
    const { BOOKING_GOOGLE_CLIENT_ID: id, BOOKING_GOOGLE_CLIENT_SECRET: secret, BOOKING_GOOGLE_REFRESH_TOKEN: refresh } = process.env;
    if (!id || !secret || !refresh) throw new Error('booking credential not configured');
    const r = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: 'refresh_token' }),
    });
    const j = await r.json();
    if (!r.ok || !j.access_token) throw new Error(`token refresh failed (${j.error || r.status})`);
    return j.access_token;
}

export function busyCalendarIds() {
    return ['primary', ...(process.env.BOOKING_BUSY_CALENDARS || '').split(',').map((s) => s.trim()).filter(Boolean)];
}

/* Live read: busy intervals across every calendar, and how many intro calls each day already holds. */
export async function readCalendar(now = Date.now()) {
    const token = await accessToken();
    const timeMin = new Date(now).toISOString();
    const timeMax = new Date(now + RULES.horizonDays * 864e5).toISOString();
    const ids = busyCalendarIds();
    const fb = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ timeMin, timeMax, timeZone: TZ, items: ids.map((id) => ({ id })) }),
    }).then((r) => r.json());
    const busy = [], unread = [];
    for (const id of ids) {
        const c = fb.calendars?.[id];
        if (!c || c.errors?.length) { unread.push(c?.errors?.[0]?.reason || 'missing'); continue; }
        busy.push(...(c.busy || []).map((b) => [Date.parse(b.start), Date.parse(b.end)]));
    }
    const q = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', q: MARK, maxResults: '250' });
    const ev = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`, {
        headers: { authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    const bookedPerDay = {};
    for (const e of ev.items || []) {
        const s = Date.parse(e.start?.dateTime || '');
        if (Number.isFinite(s)) bookedPerDay[localDay(s)] = (bookedPerDay[localDay(s)] || 0) + 1;
    }
    return { token, busy, bookedPerDay, complete: unread.length === 0, unread };
}

export const PERSONAS = {
    jamesdare: { label: 'jamesdare.com', title: 'Intro call with James Dare', agenda: 'a role, a collaboration, or an AI build' },
    tdots: { label: 'tdotssolutionsz.com', title: 'Intro call: TdotsSolutionsz', agenda: 'a website, a video, or an AI tool for your business' },
};

const EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,255}\.[a-z]{2,24}$/i;
export function validate(body) {
    const b = body && typeof body === 'object' ? body : {};
    const name = String(b.name || '').trim().slice(0, 80);
    const email = String(b.email || '').trim().slice(0, 254);
    const note = String(b.note || '').trim().slice(0, 500);
    const site = PERSONAS[b.site] ? b.site : 'jamesdare';
    const start = Date.parse(b.start || '');
    if (b.website) return { error: 'spam' };                       // honeypot field, hidden from people
    if (name.length < 2) return { error: 'Please add your name.' };
    if (!EMAIL.test(email)) return { error: 'Please add a valid email.' };
    if (!Number.isFinite(start) || new Date(start).getUTCMinutes() % 15) return { error: 'Pick a time from the list.' };
    return { name, email, note, site, start };
}

export async function createBooking(token, { name, email, note, site, start }) {
    const p = PERSONAS[site];
    const end = start + RULES.slotMin * 60e3;
    const body = {
        summary: `📞 ${p.title} — ${name}`,
        description: `${MARK}\nBooked on ${p.label}: ${p.agenda}.\n\nFrom: ${name} <${email}>\n${note ? `Note: ${note}\n` : ''}\nJames calls or joins the Meet link at the time.`,
        start: { dateTime: new Date(start).toISOString(), timeZone: TZ },
        end: { dateTime: new Date(end).toISOString(), timeZone: TZ },
        attendees: [{ email, displayName: name }],
        conferenceData: { createRequest: { requestId: `intro-${start}-${email.length}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
        transparency: 'opaque',
    };
    const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all&conferenceDataVersion=1', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`calendar insert failed (${j.error?.status || r.status})`);
    return { id: j.id, meet: j.hangoutLink || null };
}
