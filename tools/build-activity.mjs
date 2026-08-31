#!/usr/bin/env node
// build-activity.mjs — report what actually ran unattended, from the jobs' own logs.
//
// WHY THIS EXISTS. The page's headline is "I build systems that run without me."
// Its strongest supporting evidence was the SNAPSHOT LOG — four rows reading
// "19:04 Published 20 wiki pages", "06:00 Morning brief compiled and sent" — and
// until 2026-08-31 every one of them was a hand-typed <div> with a frozen time.
// A visitor returning the next day saw the same four lines at the same four
// clock times. The thesis was the one thing on the page that was a mockup.
//
// The events were real. Eight launchd jobs write logs with real timestamps, and
// on the morning this was written six of them had already run while James was at
// work. This reads those logs and reports only what it can actually see.
//
// DESIGN NOTE — why mtime and not log parsing. Each of these scripts formats its
// output differently, and a parser that tries to extract semantics from eight
// shapes is eight chances to invent an event that did not happen. The file's
// modification time is a fact the filesystem keeps, and the label comes from a
// registry a human wrote. So the page can say WHAT ran and WHEN, both true,
// rather than guessing what the run meant.
//
// An empty result is a real answer: nothing ran in the window. It renders as
// that, never as an error and never as the last known good list.

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import process from 'node:process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/activity.json');

const expand = (p) => p.replace(/^~/, homedir());

const cfg = JSON.parse(readFileSync(resolve(ROOT, 'data/unattended-jobs.json'), 'utf8'));
const windowMs = (cfg.windowHours ?? 36) * 3600 * 1000;
const now = Date.now();

const events = [];
const skipped = [];

for (const job of cfg.jobs) {
    const path = expand(job.log);
    let st;
    try {
        st = statSync(path);
    } catch {
        skipped.push({ id: job.id, why: 'no log file' });
        continue;
    }
    if (st.size === 0) {
        skipped.push({ id: job.id, why: 'log is empty' });
        continue;
    }
    const age = now - st.mtimeMs;
    if (age > windowMs) {
        skipped.push({ id: job.id, why: `last ran ${Math.round(age / 3600000)}h ago` });
        continue;
    }
    const d = new Date(st.mtimeMs);
    events.push({
        id: job.id,
        label: job.label,
        source: job.source,
        at: d.toISOString(),
        // Local wall-clock, which is what the panel shows. Rendering UTC here
        // would put "10:46" next to a brief he watched arrive at 06:46.
        time: d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }),
        ageMinutes: Math.round(age / 60000),
    });
}

events.sort((a, b) => new Date(b.at) - new Date(a.at));

const out = {
    generatedAt: new Date().toISOString(),
    windowHours: cfg.windowHours ?? 36,
    // Counted BEFORE the display slice, so the headline number is the truth and
    // not "however many happened to fit in the panel".
    ranInWindow: events.length,
    jobsWatched: cfg.jobs.length,
    events: events.slice(0, 5),
    skipped,
    definitions: {
        ranInWindow: `launchd jobs that wrote to their own log in the last ${cfg.windowHours ?? 36} hours`,
        time: 'the log file\'s modification time, in local time — the moment the job last wrote',
        jobsWatched: 'jobs listed in data/unattended-jobs.json; a job that has not run recently is omitted, not faked',
    },
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${OUT}`);
console.log(`  ${out.ranInWindow} of ${out.jobsWatched} jobs ran in the last ${out.windowHours}h`);
for (const e of out.events) console.log(`    ${e.time}  ${e.label}  (${e.ageMinutes}m ago)`);
if (skipped.length) console.log(`  skipped: ${skipped.map((s) => `${s.id} (${s.why})`).join(', ')}`);
