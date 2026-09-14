#!/usr/bin/env node
// build-busy-blocks.mjs — PRODUCER for data/busy-blocks.json.
//
// Reads the primary Google calendar for the availability horizon and writes the
// TIMES of anything overlapping the offered window. Never titles: the file is
// committed and public. Cars are excluded by pattern (they are deadlines, not
// occupancy, and build-availability.mjs models them from the inbox).
//
// Until 2026-09-14 this file was hand-written once (2026-09-01) and no job
// refreshed it, so every interview booked after that date was invisible to the
// booking page. The generator that reads it refuses on a missing file; this
// producer refuses (exit 1) on any calendar failure rather than writing an
// empty block list that would read as "free all week".
//
// Usage: node tools/build-busy-blocks.mjs [account=tdot]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from '/Users/t./dev/utilities/gmail-unified-mcp/node_modules/googleapis/build/src/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'data/busy-blocks.json');
const ACCOUNT = process.argv[2] || 'tdot';
const TZ = 'America/Toronto';
const HORIZON_DAYS = 22;               // matches build-availability.mjs
const WINDOW = { start: '15:00', end: '17:00' }; // the offered booking window
// Events that are not occupancy. Cars: "(F/C for J" / "R/C for J" invites from the Audi inbox
// mirror. Windows: the calendar marks flexible blocks with "(window" in the title.
const EXCLUDE = [/\bfor J\b/i, /\(window/i, /F\/C|R\/C/];

const { getAccount, oauthClientFor } = await import('file:///Users/t./dev/utilities/gmail-unified-mcp/lib.mjs');

function fail(reason) { console.error(`✗ busy-blocks: ${reason}`); console.error('  Writing nothing. An empty busy list would offer every interview slot as free.'); process.exit(1); }

const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
function local(d) { // -> { date: 'YYYY-MM-DD', time: 'HH:MM' } in TZ
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
}

let acc; try { acc = getAccount(ACCOUNT); } catch (e) { fail(e.message); }
if (!existsSync(acc.credsPath)) fail(`no credentials for ${ACCOUNT}`);
const creds = JSON.parse(readFileSync(acc.credsPath, 'utf8'));
if (!String(creds.scope || '').includes('calendar')) fail(`no calendar scope on ${ACCOUNT}`);

const now = new Date();
const timeMin = new Date(now.getTime() - 864e5).toISOString();
const timeMax = new Date(now.getTime() + HORIZON_DAYS * 864e5).toISOString();
const cal = google.calendar({ version: 'v3', auth: oauthClientFor(acc) });
let items;
try {
  const r = await cal.events.list({ calendarId: 'primary', timeMin, timeMax, singleEvents: true, orderBy: 'startTime', maxResults: 2500, timeZone: TZ });
  items = r.data.items || [];
} catch (e) { fail(`calendar API: ${e.message}`); }

const blocks = [];
let considered = 0;
for (const ev of items) {
  if (!ev.start?.dateTime || !ev.end?.dateTime) continue;          // all-day events are not occupancy
  if (ev.status === 'cancelled') continue;
  if (ev.transparency === 'transparent') continue;                    // "free" events
  const title = ev.summary || '';
  if (EXCLUDE.some((re) => re.test(title))) continue;
  const self = (ev.attendees || []).find((a) => a.self);
  if (self && self.responseStatus === 'declined') continue;
  considered++;
  const s = local(new Date(ev.start.dateTime)), e = local(new Date(ev.end.dateTime));
  if (s.date !== e.date) continue;                                    // multi-day: not a slot problem
  if (e.time <= WINDOW.start || s.time >= WINDOW.end) continue;       // outside the offered window
  blocks.push({ date: s.date, start: s.time, end: e.time });
}
blocks.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

// Privacy assertion IN the generator: no titles, no attendees, no links.
for (const b of blocks) {
  const keys = Object.keys(b).sort().join(',');
  if (keys !== 'date,end,start') fail(`payload leaked a field: ${keys}`);
}

const payload = {
  note: 'Busy blocks overlapping the offered window. Cars excluded — they are deadlines, not occupancy, and the generator models them separately. Times only, never titles.',
  generatedAt: new Date().toISOString(),
  source: `google:${ACCOUNT}`,
  horizonDays: HORIZON_DAYS,
  window: WINDOW,
  sample: { events: items.length, considered, blocks: blocks.length },
  blocks,
};
writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
console.log(`✓ ${OUT}`);
console.log(`  ${items.length} events over ${HORIZON_DAYS} days · ${considered} occupancy · ${blocks.length} inside ${WINDOW.start}-${WINDOW.end}`);
