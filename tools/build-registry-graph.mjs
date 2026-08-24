#!/usr/bin/env node
/* build-registry-graph.mjs — turn the live GitHub registry into graph data.
 *
 *   node tools/build-registry-graph.mjs
 *
 * Writes public/data/registry-graph.json, read by js/registry-graph.js.
 *
 * WHY THIS EXISTS: the #system graph used to be ~40 hand-placed SVG coordinates.
 * It looked like a system diagram but encoded nothing — node size, position and
 * count were all arbitrary, and the eight labels were a guess frozen in markup.
 * A portfolio surface that claims "97 modules across a 91-repository registry"
 * and then draws a decorative picture next to the claim is the exact failure the
 * provenance rule exists to prevent. Every value in the output below traces to a
 * live `gh` call, and `definitions` states in plain language what each one means,
 * so a reader can check the claim rather than take it.
 *
 * Rerun this whenever the registry moves. Stale is fine — `generatedAt` renders
 * on the page — but invented is not, so this file has no fallback data and will
 * exit non-zero rather than write a graph it could not source.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/registry-graph.json');

/* How many repos become labelled nodes. The rest are still counted and still
 * drawn as unlabelled registry entries — the graph must not imply the registry
 * is only as big as the part that fits on screen. */
const NAMED = 14;

function gh(args) {
    try {
        return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    } catch (err) {
        console.error('`gh ' + args.join(' ') + '` failed. Is gh installed and authenticated?');
        console.error(String(err.stderr || err.message).trim());
        process.exit(1);
    }
}

const repos = JSON.parse(
    gh([
        'repo', 'list', 'DareDev256',
        '--limit', '300',
        '--json', 'name,pushedAt,primaryLanguage,isPrivate,diskUsage,description,isArchived',
    ])
);

if (!Array.isArray(repos) || !repos.length) {
    console.error('gh returned no repositories — refusing to write an empty graph.');
    process.exit(1);
}

const now = Date.now();
const DAY = 86_400_000;

/* The core is the thing that manages the rest, not merely the biggest repo.
 * Named explicitly so a future big repo cannot silently take the centre. */
const CORE_NAME = 'passion-agent';

/* PRIVATE REPOSITORIES ARE NEVER LABELLED.
 *
 * `gh repo list` returns all visibilities, and the first version of this file
 * put every one of them on the page by name. Nine private repos shipped to
 * production, including four client repositories — the same class of client
 * disclosure the dashboard's demo mode exists to prevent, reintroduced through
 * the portfolio's own generator.
 *
 * They still COUNT. A private repo is a real repo and dropping it would
 * understate the registry. It joins the unlabelled field instead: the number is
 * true, the name is his to disclose, and a name is what identifies a client. */
const publicRepos = repos.filter((r) => !r.isArchived && !r.isPrivate);
const privateCount = repos.filter((r) => !r.isArchived && r.isPrivate).length;

const enriched = publicRepos
    .filter((r) => !r.isArchived)
    .map((r) => ({
        name: r.name,
        // Rounded to whole days: the hour a push landed is noise at this scale,
        // and a value that changes every render makes the diff unreadable.
        ageDays: Math.max(0, Math.floor((now - Date.parse(r.pushedAt)) / DAY)),
        pushedAt: r.pushedAt.slice(0, 10),
        kb: r.diskUsage ?? 0,
        lang: r.primaryLanguage?.name ?? null,
        private: r.isPrivate,
        // Descriptions are author-written and may be empty; never synthesise one.
        blurb: (r.description || '').trim() || null,
    }))
    .sort((a, b) => a.ageDays - b.ageDays || b.kb - a.kb);

let core = enriched.find((r) => r.name === CORE_NAME);
if (!core) {
    // The core is named on the page in prose already, so labelling it is not a
    // new disclosure even when the repo itself is private. Everything else is.
    const raw = repos.find((r) => r.name === CORE_NAME);
    if (!raw) {
        console.error(`Core repo "${CORE_NAME}" not found in the registry — refusing to guess a centre.`);
        process.exit(1);
    }
    core = {
        name: raw.name,
        ageDays: Math.max(0, Math.floor((now - Date.parse(raw.pushedAt)) / DAY)),
        pushedAt: raw.pushedAt.slice(0, 10),
        kb: raw.diskUsage ?? 0,
        lang: raw.primaryLanguage?.name ?? null,
        private: raw.isPrivate,
        blurb: (raw.description || '').trim() || null,
    };
}

const named = enriched.filter((r) => r.name !== CORE_NAME).slice(0, NAMED);

/* Node radius from disk usage. sqrt, not linear: area is what the eye reads as
 * quantity, so a linear radius makes a 4x repo look 16x. Clamped at both ends
 * so a 10KB repo is still clickable and betmetrics does not eat the canvas. */
const kbs = named.map((r) => r.kb).filter((k) => k > 0);
const maxKb = Math.max(...kbs, 1);
const radius = (kb) => {
    const t = Math.sqrt(Math.max(kb, 1) / maxKb);
    return Number((7 + t * 15).toFixed(2));
};

const out = {
    generatedAt: new Date(now).toISOString(),
    source: 'gh repo list DareDev256 --limit 300 (all visibilities, archived excluded)',
    totals: {
        repos: repos.length,
        active: repos.filter((r) => !r.isArchived).length,
        archived: repos.filter((r) => r.isArchived).length,
        namedOnGraph: named.length,
    },
    definitions: {
        radius: 'sqrt of repository disk usage, normalised to the largest named repo',
        heat: '0 to 1 by recency of last push — 1 is today, 0 is 90 days or older',
        unnamed: 'registry entries drawn but not labelled — every private repository plus the public ones past the display cap; the count is real, the placement is not',
        private: 'private repositories are counted and never named',
        archived: 'excluded from the graph but still counted in totals.repos',
    },
    core: {
        id: core.name,
        label: 'CORE',
        r: 26,
        blurb: core.blurb,
        pushedAt: core.pushedAt,
    },
    nodes: named.map((r) => ({
        id: r.name,
        r: radius(r.kb),
        // Linear ramp over a 90-day window. Beyond that everything reads as cold;
        // a log scale here made a 6-month-old repo look recently touched.
        heat: Number(Math.max(0, 1 - r.ageDays / 90).toFixed(3)),
        ageDays: r.ageDays,
        pushedAt: r.pushedAt,
        lang: r.lang,
        private: r.private,
        blurb: r.blurb,
    })),
    // Drawn as anonymous dots. Deliberately just a count — inventing positions
    // for named repos we chose not to label would be a fabricated relationship.
    // Private repos land here: counted, never named.
    unnamed: Math.max(0, enriched.length - named.length - 1) + privateCount,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

console.log(
    `wrote ${OUT}\n` +
        `  ${out.totals.repos} repos (${out.totals.archived} archived) · ` +
        `${named.length} named · ${out.unnamed} unnamed\n` +
        `  hottest: ${named[0]?.name} (${named[0]?.ageDays}d) · ` +
        `largest: ${[...named].sort((a, b) => b.kb - a.kb)[0]?.name}`
);
