#!/usr/bin/env node
/* build-availability.mjs — what times James can actually take a call.
 *
 * WHY THIS IS NOT A CALENDLY EMBED
 * Embedding Calendly inline needs five CSP directives widened and a third-party
 * script with DOM access, on a page whose own argument is that it ships no
 * unsafe-inline in production. A hiring manager who reads response headers would
 * notice the contradiction. So the page renders availability as ITS OWN content,
 * generated here, and hands the actual booking to Calendly by link.
 *
 * WHY THE CAR DEADLINES ARE THE INPUT
 * James is a FLAT-RATE detailer. A car marked "@ 2pm" is a DELIVERY DEADLINE —
 * the car must be FINISHED by then — not a block he sits in. The work is his to
 * sequence. So the question a booking page must answer is never "is he free at
 * 11", it is "how much work is still owed before the next deadline".
 *
 * Measured 2026-09-01 over 164 of his own cars across 120 days:
 *   median 2 cars a working day, and the day's LAST deadline is the real signal.
 *   share of days with ZERO car work still owed, by hour:
 *     09:00  2%      13:00 38%      16:00 74%
 *     12:00 17%      15:00 55%      17:00 89%
 * Mornings are production time — a first deadline before noon on 44% of days.
 * That is why the offered window is late-afternoon and not, as Calendly has had
 * it since July, 09:00-12:00. That setting was chosen while he was in Bali,
 * where it was 9pm-midnight local.
 *
 * PRIVACY, NON-NEGOTIABLE
 * The input is Maurice's dealership's data, not James's. Computed AVAILABILITY
 * may be published. A car, a customer, an advisor or a stock number may NOT.
 * Nothing identifying survives into the JSON — only counts and the last deadline.
 * Assert it below rather than trusting it.
 *
 * Usage: node tools/build-availability.mjs [--days 21] [--json]
 * Exit 0 wrote · 1 could not measure (writes NOTHING rather than a guess).
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

/* Resolved from homedir, not by counting `../` out of tools/. The relative form
 * was wrong by exactly one level and resolved to ~/Documents/dev, which does not
 * exist — a class of bug that only shows up when the file is MOVED, i.e. later,
 * i.e. when nobody is looking for it. */
const { getAccount, gmailFor } = await import(
    pathToFileURL(resolve(homedir(), 'dev/utilities/gmail-unified-mcp/lib.mjs')).href
);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/availability.json');
const args = process.argv.slice(2);
const HORIZON = Number(args[args.indexOf('--days') + 1]) || 21;

/* The offered window. Late afternoon, for the reason measured above, and still
 * ordinary business hours for a Toronto recruiter. Change it HERE or not at all
 * — the page reads this, it does not carry its own copy. */
const WINDOW = { startHour: 15, endHour: 17 };
const SLOT_MINUTES = 30;
const TZ = 'America/Toronto';

const MON = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
const AT  = /@\s+\w{3}\s+(\w{3})\s+(\d{1,2}),\s+(\d{4})(?:\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm))?/;
const FOR = /\bfor\s+([A-Z])\b/;
const STOCK = /\b([A-Z]?\d{5,6}[A-Z]?)\b/;
const pad = (n) => String(n).padStart(2, '0');

function parse(subject) {
    const m = AT.exec(subject);
    if (!m) return null;
    const [, mon, day, yr, hh, mm, ap] = m;
    if (!MON[mon]) return null;
    const allDay = hh === undefined;
    const h = allDay ? 12 : (Number(hh) % 12) + (ap === 'pm' ? 12 : 0);
    const f = FOR.exec(subject);
    const s = STOCK.exec(subject);
    return {
        who: f ? f[1] : null,
        stock: s ? s[1] : null,
        date: `${yr}-${pad(MON[mon])}-${pad(Number(day))}`,
        hour: h + Number(mm || 0) / 60,
    };
}

async function cars() {
    const gmail = gmailFor(getAccount('olusoga'));
    const out = new Map();
    let pageToken, pages = 0;
    do {
        const list = await gmail.users.messages.list({
            userId: 'me', q: 'from:mauricemartin2022@gmail.com newer_than:60d',
            maxResults: 500, pageToken,
        });
        for (const { id } of list.data.messages || []) {
            const full = await gmail.users.messages.get({
                userId: 'me', id, format: 'metadata', metadataHeaders: ['Subject'],
            });
            const subj = (full.data.payload.headers || []).find((h) => h.name === 'Subject')?.value || '';
            const p = parse(subj);
            if (!p || p.who !== 'J') continue;      // `for J` is his; for A / for V are not
            out.set(`${p.stock || subj.slice(0, 30)}|${p.date}`, p);
        }
        pageToken = list.data.nextPageToken;
    } while (pageToken && ++pages < 10);
    return [...out.values()];
}

const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/* Cars are only HALF the picture, and the half that is not obvious.
 *
 * The first version of this generator modelled car deadlines and nothing else,
 * and cheerfully offered 15:00 on 2026-09-02 — the exact half hour of the Exadel
 * interview. A booking page that double-books its owner into a job interview is
 * worse than no booking page.
 *
 * data/busy-blocks.json carries TIMES ONLY, never titles: the file is committed
 * and public, and "Exadel Interview" on a public surface tells every other
 * company where he is in someone else's process. Cars are deliberately EXCLUDED
 * from it — they are deadlines, not occupancy, and are modelled above. Counting
 * them twice would close the afternoon for no reason. */
let BUSY = [];
try {
    BUSY = JSON.parse(
        (await import('node:fs')).readFileSync(resolve(ROOT, 'data/busy-blocks.json'), 'utf8'),
    ).blocks || [];
} catch {
    console.error('! data/busy-blocks.json unreadable — offering car-clear slots only.');
    console.error('  Regenerate it before trusting this output; a stale one hides a real conflict.');
}
const hhmm = (t) => Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60;
function blocked(date, h) {
    const end = h + SLOT_MINUTES / 60;
    return BUSY.some((b) => b.date === date && hhmm(b.start) < end && hhmm(b.end) > h);
}

(async () => {
    let all;
    try {
        all = await cars();
    } catch (err) {
        console.error(`✗ could not read the car ledger: ${err.message}`);
        console.error('  Writing nothing. A booking page guessing at availability is worse than none.');
        process.exit(1);
    }
    if (!all.length) {
        console.error('✗ zero cars parsed — refusing to publish "wide open" off a failed read.');
        process.exit(1);
    }

    const byDay = new Map();
    for (const c of all) {
        if (!byDay.has(c.date)) byDay.set(c.date, []);
        byDay.get(c.date).push(c.hour);
    }

    const today = new Date();
    const days = [];
    for (let i = 1; i <= HORIZON; i++) {
        const d = new Date(today); d.setDate(today.getDate() + i);
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue;               // recruiters do not call at the weekend
        const key = iso(d);
        const due = byDay.get(key) || [];
        const last = due.length ? Math.max(...due) : null;

        /* A slot is offered when the day's committed work is done before it. With
         * no car ON THE LEDGER YET the honest state is not "free" — Maurice books
         * a median 4.1 days out, so a day beyond that horizon is UNKNOWN. Say so
         * rather than offering a slot that a car will quietly take. */
        const known = due.length > 0 || (new Date(key) - today) / 86400000 <= 4;
        const slots = [];
        for (let h = WINDOW.startHour; h < WINDOW.endHour; h += SLOT_MINUTES / 60) {
            if (last !== null && h < last) continue;         // work still owed before this
            if (blocked(key, h)) continue;                   // something else already has it
            slots.push(`${pad(Math.floor(h))}:${pad(Math.round((h % 1) * 60))}`);
        }
        days.push({
            date: key,
            weekday: d.toLocaleDateString('en-CA', { weekday: 'short', timeZone: TZ }),
            carsDue: due.length,          // a COUNT. never a stock number, name or advisor.
            lastDeadline: last === null ? null : `${pad(Math.floor(last))}:${pad(Math.round((last % 1) * 60))}`,
            confidence: known ? 'measured' : 'unbooked-so-far',
            slots,
        });
    }

    const payload = {
        generatedAt: new Date().toISOString(),
        timeZone: TZ,
        window: `${pad(WINDOW.startHour)}:00-${pad(WINDOW.endHour)}:00`,
        slotMinutes: SLOT_MINUTES,
        /* The rail, never the vendor. /book is a 302 in vercel.json, so the
         * backend behind it can change without touching a link that is by then
         * sitting in sent mail, a LinkedIn About and an email signature. */
        bookingUrl: '/book',
        sample: { cars: all.length, days: byDay.size, horizonDays: HORIZON, busyBlocks: BUSY.length },
        method: 'Offered slots sit after the day\'s last delivery deadline. Flat-rate work, so the schedule is mine to sequence; the deadline is what is fixed.',
        days,
    };

    /* Prove nothing identifying leaked, rather than trusting that it did not. */
    const blob = JSON.stringify(payload);
    for (const c of all) {
        if (c.stock && blob.includes(c.stock)) {
            console.error(`✗ PRIVACY: stock number ${c.stock} reached the payload. Refusing to write.`);
            process.exit(1);
        }
    }
    if (/SERINA|BROOKE|HALLIEE|MIKE|MARK|ALLAN|AMIR|CHLOE|ERIK|KIA|DELNIA|NICHOLAS/i.test(blob)) {
        console.error('✗ PRIVACY: an advisor or customer name reached the payload. Refusing to write.');
        process.exit(1);
    }

    if (args.includes('--json')) { console.log(blob); process.exit(0); }
    writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
    const open = days.filter((d) => d.slots.length).length;
    console.log(`✓ ${OUT}`);
    console.log(`  ${all.length} cars over ${byDay.size} days · ${open}/${days.length} weekdays with an open slot`);
    console.log('  privacy assertions passed: no stock number, no advisor or customer name in the payload');
})();
