#!/usr/bin/env node
/* build-figures.mjs — every number on jamesdare.com, generated.
 *
 *   node tools/build-figures.mjs
 *
 * Writes public/data/figures.json, read by js/system-figures.js.
 *
 * WHY THIS EXISTS: gate 02 tells the reader, verbatim, "the numbers on this page
 * come from the GitHub and PyPI APIs, not from a resume that has claimed this
 * same count as 50+, 70, 73 and 74." On 2026-08-24 all three numbers beside that
 * sentence were hardcoded and all three were wrong: 90 stars (94), 18 forks (19),
 * 1,928 installs (2,107). The staleness was small. The damage was not, because
 * the copy explicitly invites the reader to check — it converts a drift bug into
 * a credibility problem. A claim about provenance has to be structurally true,
 * not true on the day it was typed.
 *
 * RULES THIS FILE ENFORCES:
 *   1. No fallback values. If a source is unreachable this exits non-zero rather
 *      than writing a number it could not verify. A stale figure that renders
 *      looks correct; a missing one gets noticed and fixed.
 *   2. Every figure ships with a `definitions` entry saying exactly what it
 *      counts. "63 repos" and "91 repos" were both true and meant different
 *      things; the page never said which, so it read as a contradiction.
 *   3. Nothing here is hand-entered except figures no API can produce (client
 *      directed views), which are marked `manual` and dated so they are
 *      visibly a different KIND of claim.
 */

import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/figures.json');

/** The repo the adoption claim is about. Stars are per-REPO, not per-account:
 *  totalling the account gives a bigger, different, and wrong number. */
const OSS_REPO = 'DareDev256/fcp-mcp-server';
const PYPI_PACKAGE = 'fcp-mcp-server';

function die(msg) {
    console.error(`✗ ${msg}`);
    console.error('  Refusing to write figures.json — a partial file would ship unverified numbers.');
    process.exit(1);
}

function gh(args) {
    try {
        return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    } catch (err) {
        die(`gh ${args.join(' ')} failed: ${String(err.stderr || err.message).trim().split('\n')[0]}`);
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Retries on 429/5xx with backoff. pypistats rate-limits aggressively and its
 * window is short, so a single 429 is a transient condition, not a dead source
 * — failing the whole build on the first one would make this generator too
 * annoying to run, and a generator nobody runs is how the numbers drifted in
 * the first place. A persistent failure still exits non-zero; it never falls
 * back to a cached or invented value. */
async function fetchJSON(url, label, { tries = 4 } = {}) {
    let lastErr = '';
    for (let i = 0; i < tries; i += 1) {
        if (i) await sleep(1500 * 2 ** (i - 1));
        let res;
        try {
            res = await fetch(url, { headers: { 'user-agent': 'jamesdare.com figures builder' } });
        } catch (err) {
            lastErr = err.message;
            continue;
        }
        if (res.ok) return res.json();
        lastErr = `HTTP ${res.status}`;
        if (res.status !== 429 && res.status < 500) break; // 404 etc — retrying cannot help
        console.error(`  ${label}: ${lastErr}, retry ${i + 1}/${tries - 1}`);
    }
    die(`${label}: ${lastErr}`);
}

// ── 1. The OSS adoption figures — the ones gate 02 stakes its credibility on.
const repo = JSON.parse(gh(['api', `repos/${OSS_REPO}`]));
if (typeof repo.stargazers_count !== 'number') die('GitHub returned no star count');

// ── 2. PyPI. pypistats is the only public source for download counts; PyPI's
//       own JSON API has not exposed them since 2018.
const pypi = await fetchJSON(
    `https://pypistats.org/api/packages/${PYPI_PACKAGE}/recent`,
    'pypistats'
);
const installs = pypi?.data?.last_month;
if (typeof installs !== 'number') die('pypistats returned no last_month figure');

/* ── 2b. The wiki share. This is the strongest external-validation number the
 *       site has and it was the only headline claim on the page with no
 *       generator behind it — the copy asserted "roughly a third of every edit"
 *       in prose, which is precisely the shape of claim this file exists to
 *       retire. Now it is measured.
 *
 *       Fandom's CDN 403s a bare curl, so the UA below is required and its
 *       absence is not an outage. The bot edits as RawBOT; NinWikiBot is the
 *       Discord identity and resolves to `missing` here, which is the kind of
 *       near-miss that makes a wrong number look verified. */
const WIKI = { host: 'ninonline.fandom.com', bot: 'RawBOT', since: 2013 };
const WIKI_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

async function wikiJSON(query, label) {
    for (let i = 0; i < 4; i++) {
        try {
            const res = await fetch(`https://${WIKI.host}/api.php?${query}&format=json`, {
                headers: { 'user-agent': WIKI_UA },
            });
            if (res.ok) return await res.json();
        } catch {
            /* retry */
        }
        await sleep(400 * (i + 1));
    }
    die(`${label}: ${WIKI.host} did not answer`);
}

const wikiStats = await wikiJSON('action=query&meta=siteinfo&siprop=statistics', 'wiki siteinfo');
const wikiUser = await wikiJSON(
    `action=query&list=users&ususers=${WIKI.bot}&usprop=editcount`,
    'wiki user'
);
/* The revert rate. Gate 08 invited the reader to check it — "an on-wiki kill
 * switch any editor can pull, and a revert rate you can check" — and then gave
 * them nothing to check it against. It is also the strongest number on the site
 * for the sentence in the hero: an autonomous agent whose edits a volunteer
 * community of 43,000 accounts could undo at any time, and largely does not.
 *
 * MediaWiki tags a reverted revision `mw-reverted`, so this is the wiki's own
 * bookkeeping rather than a heuristic over edit summaries. uclimit maxes at 500
 * for a non-bot client, so this is an honest SAMPLE of the most recent edits and
 * is labelled as one — not an all-time rate it cannot see. */
const wikiContribs = await wikiJSON(
    `action=query&list=usercontribs&ucuser=${WIKI.bot}&uclimit=500&ucprop=ids|timestamp|tags`,
    'wiki usercontribs'
);
const contribs = wikiContribs?.query?.usercontribs;
if (!Array.isArray(contribs) || contribs.length === 0) {
    die(`no contributions returned for ${WIKI.bot} — is the account name still right?`);
}
const revertedCount = contribs.filter((c) => (c.tags ?? []).includes('mw-reverted')).length;
const revertSample = contribs.length;
const revertPct = (revertedCount / revertSample) * 100;

const wikiTotal = wikiStats?.query?.statistics?.edits;
const wikiBot = wikiUser?.query?.users?.[0]?.editcount;
if (typeof wikiTotal !== 'number' || typeof wikiBot !== 'number') {
    // A missing account returns {name, missing:""} with NO editcount, so an
    // undefined here means the username is wrong, not that the bot did nothing.
    die(`wiki counts unusable — total=${wikiTotal} bot=${wikiBot} (is ${WIKI.bot} still the account?)`);
}

/* ── 2c. The client roster. This number used to live in the `manual` block as
 *       a hand-counted 12 while Gate 05 named eleven sites underneath it — the
 *       ONLY hand-counted figure on the page, and the only wrong one, on a page
 *       that spends two gates arguing that counting by hand is the bug.
 *
 *       The count is now the length of the roster, so the sentence and the list
 *       cannot disagree. Liveness is probed and reported SEPARATELY: a site that
 *       is temporarily unreachable is not a site he did not build, and silently
 *       dropping the count on a network blip would be its own kind of lie. */
const roster = JSON.parse(readFileSync(resolve(ROOT, 'data/client-sites.json'), 'utf8')).sites;
if (!Array.isArray(roster) || roster.length === 0) die('data/client-sites.json holds no sites');

/* The definition tells a reader the roster lives at a URL, so it has to BE at a
 * URL. data/ is a build-time import and the SPA catch-all answers it with
 * index.html — a receipt that 404s in the only way this site cannot afford. */
writeFileSync(
    resolve(ROOT, 'public/data/client-sites.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), sites: roster }, null, 2) + '\n'
);

const clientStatus = [];
for (const site of roster) {
    let code = 0;
    for (let i = 0; i < 2 && !/^[23]\d\d$/.test(String(code)); i++) {
        try {
            const res = await fetch(site.url, { redirect: 'follow', signal: AbortSignal.timeout(12000) });
            code = res.status;
        } catch {
            code = 0;
        }
        if (!/^[23]\d\d$/.test(String(code))) await sleep(500);
    }
    clientStatus.push({ ...site, code, up: /^[23]\d\d$/.test(String(code)) });
}
const clientUp = clientStatus.filter((c) => c.up).length;

// ── 3. The agent-side figures, already generated by check-daily-rollup.
let snap;
try {
    snap = JSON.parse(readFileSync(resolve(ROOT, 'data/system-snapshot.json'), 'utf8'));
} catch (err) {
    die(`data/system-snapshot.json unreadable: ${err.message}`);
}

// ── 4. Registry counts, live.
const repos = JSON.parse(gh(['repo', 'list', 'DareDev256', '--limit', '300', '--json', 'name,isArchived,isPrivate']));


/* ── Service probe ────────────────────────────────────────────────────────
 * index.html carried three hand-written "UP" rows for the Mini's services with
 * a comment admitting nothing measured them: "Stamped as of a date until tools/
 * actually probes the ports." This is that. The services bind to loopback on the
 * Mini, so the only honest probe is over SSH.
 *
 * A service being DOWN is a MEASURED value, not a missing one, so it does not
 * trip Rule 1 — it renders. What Rule 1 forbids is claiming UP without looking,
 * which is exactly what the markup did. If the host itself cannot be reached the
 * answer is `unreachable`, which is the truth and is more informative than a
 * green row: a page that says "I build systems that run without me" is worth
 * more when it can admit one is not running.
 */
function probeServices() {
    const SVC = [
        { name: 'dashboard', port: 3000 },
        { name: 'brain', port: 7777 },
        { name: 'letstrade', port: 8420 },
    ];
    const checkedAt = new Date().toISOString();
    const SSH = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', 'macmini'];
    // SSH_AUTH_SOCK is cleared: the agent socket is not present under launchd and
    // its absence made an unrelated auth error look like a dead host.
    const env = { ...process.env, SSH_AUTH_SOCK: '' };

    try {
        execFileSync('ssh', [...SSH, 'true'], { encoding: 'utf8', env, stdio: 'pipe' });
    } catch {
        return { checkedAt, host: 'unreachable', services: SVC.map((s) => ({ ...s, state: 'unreachable' })) };
    }

    return {
        checkedAt,
        host: 'up',
        services: SVC.map((s) => {
            try {
                const code = execFileSync(
                    'ssh',
                    [...SSH, `curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1:${s.port}/ || echo 000`],
                    { encoding: 'utf8', env, stdio: 'pipe' },
                ).trim();
                return { ...s, state: /^[23]\d\d$/.test(code) ? 'up' : 'down', code };
            } catch {
                return { ...s, state: 'down' };
            }
        }),
    };
}

const out = {
    generatedAt: new Date().toISOString(),
    figures: {
        // OSS adoption — live, per-repo.
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        installs: installs.toLocaleString('en-US'),

        /* The roster is the count. See data/client-sites.json. */
        clientSites: roster.length,
        clientSitesUp: clientUp,

        /* Autonomy with an audience that could switch it off. */
        wikiShare: `${Math.round((wikiBot / wikiTotal) * 100)}%`,
        wikiEdits: wikiBot.toLocaleString('en-US'),
        wikiTotal: wikiTotal.toLocaleString('en-US'),
        wikiSince: WIKI.since,
        wikiReverted: revertedCount,
        wikiRevertSample: revertSample.toLocaleString('en-US'),
        wikiStood: (revertSample - revertedCount).toLocaleString('en-US'),
        /* Shown to one decimal only when it is under 1%, because "0%" would read
         * as a rounding flourish on a number whose whole job is to be checkable. */
        wikiRevertRate: revertPct < 1 ? `${revertPct.toFixed(1)}%` : `${Math.round(revertPct)}%`,

        // The agent system.
        repos: snap.repos,
        modules: snap.modules,
        loc: `${Math.round(snap.linesOfCode / 1000)}K`,
        jobs: snap.scheduledJobs?.total,

        // Registry breakdown — these two are why "63" and "91" both appeared and
        // looked like a contradiction. Naming both, with definitions, ends it.
        reposPublic: repos.filter((r) => !r.isPrivate && !r.isArchived).length,
        reposArchived: repos.filter((r) => r.isArchived).length,

        /* One date for every stamp on the page. Three different snapshot dates
         * used to render inside one viewport — 08*20 in the status panel,
         * 2026*08*23 in the aside, 2026-08-24 in the graph JSON — because each
         * was typed by hand at a different time. Same failure as the module
         * counts, same fix: the page reads the date, it does not carry one. */
        snapshotDate: snap.generatedAt.slice(0, 10).replace(/-/g, '\u2022').slice(2),
    },
    definitions: {
        /* NOT "live at build time". package.json's build script is `vite build`
         * and nothing else — these generators need gh auth and an SSH route to
         * the Mini, neither of which exists on Vercel, so they run locally and
         * their output is committed. The number is real; it is as fresh as the
         * last generator run, and `generatedAt` says when that was. Claiming
         * build-time freshness is the provenance failure this file exists to
         * prevent: it invites exactly the check it cannot survive. */
        stars: `GitHub stargazers on ${OSS_REPO}, read live when these figures were last generated`,
        forks: `GitHub forks of ${OSS_REPO}, read live when these figures were last generated`,
        installs: `PyPI downloads of ${PYPI_PACKAGE} in the last 30 days, via pypistats`,
        clientSites: 'client sites in the roster at /data/client-sites.json, each one named and linked on the page',
        clientSitesUp: 'how many of those answered a request when these figures were generated',
        wikiReverted: `edits by ${WIKI.bot} that MediaWiki tagged mw-reverted, in the most recent ${revertSample} sampled`,
        wikiRevertSample: `how many recent edits were examined — the API returns at most 500, so this is a sample and not an all-time rate`,
        wikiStood: `recent edits by ${WIKI.bot} that no editor reverted`,
        wikiRevertRate: `share of the sampled edits that were reverted, per MediaWiki's own mw-reverted tag`,
        wikiShare: `${WIKI.bot}'s share of every edit ever made on ${WIKI.host}, read live from the MediaWiki API`,
        wikiEdits: `edits made by ${WIKI.bot} on ${WIKI.host}, per the MediaWiki API`,
        wikiTotal: `every edit by every editor on ${WIKI.host} since ${WIKI.since}, per the MediaWiki API`,
        repos: snap.definitions?.repos ?? 'all repositories on the account',
        modules: snap.definitions?.modules ?? 'top-level modules in passion-agent',
        loc: snap.definitions?.linesOfCode ?? 'first-party lines of code',
        jobs: snap.definitions?.scheduledJobs ?? 'scheduled jobs across both machines',
        reposPublic: 'public, non-archived repositories',
        reposArchived: 'archived repositories, excluded from active counts',
        services: 'live SSH probe of the Mac Mini loopback ports at build time; unreachable means the host did not answer',
        snapshotDate: 'when data/system-snapshot.json was last generated — the date every stamp on this page reads from',
    },
    /* Figures no API can produce. Kept separate and dated on purpose: a reader
     * who checks the generated ones should be able to see at a glance which
     * claims are machine-verified and which are James's own count. */
    /* Measured, not asserted. `unreachable` means the Mini did not answer SSH —
     * the page says so rather than showing three green rows. */
    services: probeServices(),
    /* Hand-counted, dated, and kept in ONE place. The film figures previously
     * lived at three separate call sites — the status panel read directedViews
     * from here while Gate 06's prose and its stat block each carried their own
     * copy of the same numbers. That is the identical defect as the client-site
     * count: a figure with more than one home eventually disagrees with itself.
     * The short form is DERIVED rather than typed, so 25.3M cannot drift from
     * 25,332,774. */
    manual: {
        directedViews: { value: '25,332,774', asOf: '2026-08-24', note: 'sum of public view counts on directed films' },
        directedViewsShort: {
            value: `${(25332774 / 1e6).toFixed(1)}M`,
            asOf: '2026-08-24',
            note: 'the same view total, rounded for the stat block — derived from directedViews, never typed twice',
        },
        directedFilms: { value: 101, asOf: '2026-08-24', note: 'music videos directed, counted by hand' },
        directedArtists: { value: 54, asOf: '2026-08-24', note: 'distinct artists directed for, counted by hand' },
    },
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

/* ── /os live state ───────────────────────────────────────────────────────
 * js/passion-live.js polled https://passion-api.jamesdare.com/api/public every
 * 30 seconds. That host returns 404 and has for as long as anyone has checked,
 * so /os hammered a dead domain forever and fell back to canned copy.
 *
 * Same-origin generated file instead. ONLY fields with a real source are
 * written — cyclesTotal, tasksToday and uptime have no honest producer, so they
 * are omitted and passion-live.js's own sanitiser supplies its defaults. Filling
 * them with plausible numbers is exactly the drift this generator exists to end.
 */
const STATE_OUT = resolve(ROOT, 'public/data/passion-state.json');
const snapAgeH = snap.generatedAt
    ? (Date.now() - Date.parse(snap.generatedAt)) / 3_600_000
    : Infinity;

const state = snapAgeH <= 36 ? 'working' : snapAgeH <= 24 * 7 ? 'thinking' : 'sleeping';
writeFileSync(
    STATE_OUT,
    JSON.stringify(
        {
            generatedAt: new Date().toISOString(),
            source: 'data/system-snapshot.json — freshness of the agent\'s own rollup',
            status: snapAgeH <= 36 ? 'online' : 'offline',
            state,
            mood: snapAgeH <= 36 ? 'shipping' : 'resting',
            currentFocus: `${out.figures.repos}-repository registry`,
            lastActive: snap.generatedAt ? snap.generatedAt.slice(0, 10) : 'unknown',
            commentary:
                snapAgeH <= 36
                    ? 'Rollup written within the last day. The scheduled fleet is reporting.'
                    : 'No rollup in over a day. The fleet is quiet.',
        },
        null,
        2
    ) + '\n'
);
console.log(`wrote ${STATE_OUT}  (state=${state})`);

const f = out.figures;
console.log(
    `wrote ${OUT}\n` +
        `  ${OSS_REPO}: ${f.stars} stars · ${f.forks} forks · ${f.installs} installs/mo\n` +
        `  registry: ${f.repos} repos (${f.reposPublic} public, ${f.reposArchived} archived)\n` +
        `  agent: ${f.modules} modules · ${f.loc} LOC · ${f.jobs} jobs`
);
