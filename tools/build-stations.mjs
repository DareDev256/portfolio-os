#!/usr/bin/env node
// build-stations.mjs: count each /studio station's takes from git (4.68.0).
//
// WHY. The studio's claim is that the crew really works: a live control room,
// not a diorama. Until 4.68.0 every station screen carried a fixed date from
// the Monitor ("21 AUG 26"), true once and frozen since. This reads the
// station's repositories and reports what git knows: how many takes (commits)
// it has, how many landed on each of the last 14 days in Toronto time, and
// when the newest one landed. No commit message leaves this machine: the
// numbers are facts git keeps, the station-to-repo map (data/station-repos.json)
// is one a human wrote, and nothing here guesses what a commit meant.
//
// WHAT COUNTS AS A TAKE. A commit on a branch, local or pushed. Tags do not
// count, because the nightly snapshot job (dirty-repo-snapshot) tags every
// dirty repo's work-in-progress as wip-nightly, and `git log --all` would read
// each of those as a take landed today in a repo nobody touched for weeks.
// Worktrees and clones of one repo share commits, so takes are counted by hash.
//
// It refuses (exit 2, nothing written) when the projects folder is missing or no
// station could be read: a page with no strip is honest, a strip of zeros is not.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/stations.json');

/** The git log arguments for one repo entry. HEAD, branches and remotes only: never --all (tags are snapshots, not takes). */
export function gitLogArgs(entry, sinceDays = null) {
    const args = ['log', 'HEAD', '--branches', '--remotes', '--format=%H %ct'];
    if (sinceDays) args.push(`--since=${sinceDays}.days.ago`);
    if (entry.paths?.length) args.push('--', ...entry.paths);
    return args;
}

/** 'YYYY-MM-DD' of an instant in a time zone. */
export function dayKey(ms, tz) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}

const dayNum = (key) => Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)) / 864e5;

/** Takes per local day, oldest first; the last slot is the day of `nowMs`. Times are ms. */
export function bucketDays(times, nowMs, tz, n) {
    const days = new Array(n).fill(0);
    const today = dayNum(dayKey(nowMs, tz));
    for (const t of times) {
        const back = today - dayNum(dayKey(t, tz));
        if (back >= 0 && back < n) days[n - 1 - back] += 1;
    }
    return days;
}

/** Parse `%H %ct` lines into a Map hash -> ms, dropping anything dated after now (a skewed clock is not a take). */
export function parseLog(text, nowMs, into = new Map()) {
    for (const line of text.split('\n')) {
        const m = /^([0-9a-f]{7,64}) (\d+)$/.exec(line.trim());
        if (!m) continue;
        const ms = Number(m[2]) * 1000;
        if (ms > nowMs + 5 * 60e3) continue;
        into.set(m[1], ms);
    }
    return into;
}

/** One station's numbers from its deduplicated commits. */
export function summarize(commits, repos, nowMs, tz, n) {
    const times = [...commits.values()];
    const days = bucketDays(times, nowMs, tz, n);
    const last = times.length ? Math.max(...times) : null;
    return { repos, takes: times.length, inWindow: days.reduce((a, b) => a + b, 0), days, lastAt: last ? new Date(last).toISOString() : null };
}

/** A repo is his when it has no origin (local work) or its origin lives under one of his GitHub owners. A clone of someone else's project is their takes, not his. */
export function ownRepo(origin, dir, owners = []) {
    if (!origin || origin === dir) return true;
    const m = /github\.com[:/]([^/]+)\//i.exec(origin);
    if (!m) return false;
    return owners.some((o) => o.toLowerCase() === m[1].toLowerCase());
}

const expand = (p) => p.replace(/^~/, homedir());
const isRepo = (dir) => existsSync(join(dir, '.git'));
function git(dir, args) {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
}

function main() {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, 'data/station-repos.json'), 'utf8'));
    const root = expand(cfg.root);
    const n = cfg.windowDays ?? 14;
    const tz = cfg.tz ?? 'America/Toronto';
    if (!existsSync(root)) {
        console.error(`build-stations: REFUSED, ${root} does not exist (this runs on the Mac that holds the repos)`);
        process.exit(2);
    }
    const now = Date.now();
    const stations = {};
    const skipped = [];
    for (const [id, entries] of Object.entries(cfg.stations)) {
        const commits = new Map();
        let repos = 0;
        for (const e of entries) {
            const dir = join(root, e.repo);
            if (!isRepo(dir)) { skipped.push({ station: id, repo: e.repo, why: 'not a git repository' }); continue; }
            try {
                parseLog(git(dir, gitLogArgs(e)), now, commits);
                repos += 1;
            } catch {
                skipped.push({ station: id, repo: e.repo, why: 'git log failed' });
            }
        }
        if (repos) stations[id] = summarize(commits, repos, now, tz, n);
    }
    if (!Object.keys(stations).length) {
        console.error('build-stations: REFUSED, no station repository could be read');
        process.exit(2);
    }

    // The Registry station: every repo one level under each category folder, inside the window.
    // Worktrees and clones of one repo are one repo: identity is the origin URL, or the folder when there is none.
    const all = new Map();
    const seen = new Set();
    const busy = new Set();
    for (const cat of cfg.categories || []) {
        const base = join(root, cat);
        if (!existsSync(base)) continue;
        for (const name of readdirSync(base)) {
            const dir = join(base, name);
            if (!isRepo(dir)) continue;
            let who = dir;
            try { who = git(dir, ['remote', 'get-url', 'origin']).trim() || dir; } catch { /* no origin: the folder is the repo */ }
            if (!ownRepo(who, dir, cfg.owners)) continue;
            seen.add(who);
            try {
                const mine = parseLog(git(dir, gitLogArgs({}, n + 1)), now);
                for (const [h, t] of mine) all.set(h, t);
                if (bucketDays([...mine.values()], now, tz, n).some(Boolean)) busy.add(who);
            } catch { /* an unreadable repo is not a take */ }
        }
    }
    const scanned = seen.size;
    const active = busy.size;
    const allDays = bucketDays([...all.values()], now, tz, n);

    const out = {
        generatedAt: new Date(now).toISOString(),
        windowDays: n,
        tz,
        stations,
        all: { scanned, active, inWindow: allDays.reduce((a, b) => a + b, 0), days: allDays },
        skipped,
        definitions: {
            take: 'one commit on a branch, local or pushed, counted once by hash; tags and snapshots are not takes',
            days: `takes per day in ${tz} time, oldest first; the last entry is the day this file was written`,
            lastAt: 'commit time of the newest take seen when this file was written',
            all: 'every git repository of his one level under each category folder (no origin, or an origin under his GitHub); clones of other people\'s projects are left out; active = repos with a take in the window',
        },
    };
    const tmp = `${OUT}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(out, null, 2)}\n`);
    renameSync(tmp, OUT);
    const s = Object.entries(stations).map(([id, v]) => `${id} ${v.inWindow}/${v.takes}`).join(' · ');
    console.log(`build-stations: ${Object.keys(stations).length} stations (${s}); all ${out.all.inWindow} takes in ${n}d across ${active}/${scanned} repos; skipped ${skipped.length}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
