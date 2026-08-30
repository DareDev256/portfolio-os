#!/usr/bin/env node
/* build-registry-graph.mjs — merge James's curation with the live GitHub registry.
 *
 *   node tools/build-registry-graph.mjs
 *
 * Reads  data/registry-curation.json  (judgement: which repos, and why they matter)
 * Reads  gh repo list DareDev256      (facts: pushed, language, stars, forks, count)
 * Writes public/data/registry-graph.json, consumed by js/registry-graph.js.
 *
 * WHY CURATION AND NOT A SORT: the previous version ordered the registry by pushedAt
 * and labelled the top 14. Against 24 public active repos that named 58% of them —
 * a listing, not a selection. It put a bubble-pop game at the same visual weight as
 * a package with 95 stars and 19 forks, because both had been touched the same week.
 * Push recency is a fact about the last README typo. The curation file carries the
 * one thing `gh` cannot: what a repo PROVES.
 *
 * WHY RADIUS IS NO LONGER DISK USAGE: disk usage made a repo full of video assets
 * the largest node on the canvas. Radius is now the curated tier, which is a claim
 * the page states out loud in the legend and can therefore be argued with.
 *
 * This file has no fallback data. Every failure below exits non-zero rather than
 * write a graph it could not source.
 */

import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/registry-graph.json');
const CURATION = resolve(ROOT, 'data/registry-curation.json');

const OWNER = 'DareDev256';

function die(msg, detail) {
    console.error(`\n  ✗ ${msg}`);
    if (detail) console.error(`    ${detail}`);
    console.error('');
    process.exit(1);
}

function gh(args) {
    try {
        return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    } catch (err) {
        die(
            '`gh ' + args.join(' ') + '` failed. Is gh installed and authenticated?',
            String(err.stderr || err.message).trim()
        );
    }
}

/* ---------- inputs ---------- */

let curation;
try {
    curation = JSON.parse(readFileSync(CURATION, 'utf8'));
} catch (err) {
    die(`could not read ${CURATION}`, err.message);
}

const repos = JSON.parse(
    gh([
        'repo', 'list', OWNER,
        '--limit', '300',
        '--json', 'name,pushedAt,primaryLanguage,isPrivate,diskUsage,description,isArchived,stargazerCount,forkCount',
    ])
);

if (!Array.isArray(repos) || !repos.length) {
    die('gh returned no repositories — refusing to write an empty graph.');
}

const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
const now = Date.now();
const DAY = 86_400_000;

/* ---------- the guards ----------
 * Each of these was a real way the old generator could ship something false. */

function live(entry, where) {
    const raw = byName.get(String(entry.repo || '').toLowerCase());

    // A curated repo that vanished (renamed, deleted, transferred) used to be
    // impossible — the old generator only ever named what gh handed it. Now the
    // curation can outlive the repo, so an unresolvable name is a hard stop
    // rather than a node quietly missing from the graph.
    if (!raw) {
        die(
            `${where} names "${entry.repo}", which is not in the ${OWNER} registry.`,
            'Renamed, deleted, or a typo. Fix data/registry-curation.json.'
        );
    }

    if (raw.isArchived) {
        die(
            `${where} names "${entry.repo}", which is ARCHIVED.`,
            'An archived repo on a page about live systems is a claim you do not want to defend.'
        );
    }

    /* PRIVATE REPOSITORIES ARE NEVER LABELLED BY ACCIDENT.
     *
     * The first version of this generator put every visibility on the page by
     * name — nine private repos shipped to production, four of them client
     * repositories. A name is what identifies a client.
     *
     * Curation changes who decides, not whether it is decided: naming a private
     * repo now requires an explicit `disclosed` string saying WHERE it is already
     * public. That string is the author asserting the disclosure already happened,
     * and it renders nowhere — it exists to make the choice deliberate and
     * reviewable in a diff. A private repo still never gets a code link. */
    if (raw.isPrivate && !entry.disclosed) {
        die(
            `${where} names "${entry.repo}", which is PRIVATE.`,
            'Add "disclosed": "<where it is already public>" to that entry, or remove it.'
        );
    }

    return raw;
}

/* Live counts are substituted into `proves` rather than typed into it. A number
 * on the page that was hand-copied from GitHub in July is the exact failure the
 * provenance rule exists to prevent: advertising a source invites the check. */
function fill(text, raw, where) {
    if (!text) return null;
    const out = text
        .replace(/\{stars\}/g, String(raw.stargazerCount))
        .replace(/\{forks\}/g, String(raw.forkCount));
    const leftover = out.match(/\{(\w+)\}/);
    if (leftover) die(`${where} uses an unknown token {${leftover[1]}}.`, 'Supported: {stars}, {forks}.');
    return out;
}

function facts(raw) {
    return {
        ageDays: Math.max(0, Math.floor((now - Date.parse(raw.pushedAt)) / DAY)),
        pushedAt: raw.pushedAt.slice(0, 10),
        lang: raw.primaryLanguage?.name ?? null,
        stars: raw.stargazerCount,
        forks: raw.forkCount,
        private: raw.isPrivate,
    };
}

/* ---------- core ---------- */

const coreRaw = live(curation.core, 'curation.core');
const coreFacts = facts(coreRaw);

/* ---------- named nodes ---------- */

const tiers = curation.tiers || {};
const seen = new Set([curation.core.repo.toLowerCase()]);

const nodes = (curation.entries || []).map((entry, i) => {
    const where = `curation.entries[${i}]`;
    const raw = live(entry, where);

    const key = entry.repo.toLowerCase();
    if (seen.has(key)) die(`${where} repeats "${entry.repo}".`, 'A repo drawn twice is two nodes claiming to be one system.');
    seen.add(key);

    const tier = tiers[entry.tier];
    if (!tier) {
        die(`${where} has tier "${entry.tier}", which is not defined.`, `Known tiers: ${Object.keys(tiers).join(', ')}.`);
    }

    const f = facts(raw);

    return {
        id: entry.repo,
        tier: entry.tier,
        r: tier.r,
        // Heat stays recency — it is the one thing a viewer reads as "is this
        // alive". Linear over 90 days; a log ramp made a six-month-old repo
        // look recently touched.
        heat: Number(Math.max(0, 1 - f.ageDays / 90).toFixed(3)),
        ageDays: f.ageDays,
        pushedAt: f.pushedAt,
        lang: f.lang,
        stars: f.stars,
        forks: f.forks,
        private: f.private,
        what: fill(entry.what, raw, where),
        proves: fill(entry.proves, raw, where),
        stack: entry.stack || [],
        live: entry.live || null,
        // A private repo's code link would 404 for every visitor and confirm the
        // repo exists. Public repos link straight to the source.
        code: f.private ? null : `https://github.com/${OWNER}/${entry.repo}`,
    };
});

if (!nodes.length) die('curation.entries is empty — refusing to write a graph with no repos.');

const active = repos.filter((r) => !r.isArchived);

const out = {
    generatedAt: new Date(now).toISOString(),
    source: `gh repo list ${OWNER} --limit 300 (all visibilities, archived excluded) merged with data/registry-curation.json`,
    totals: {
        repos: repos.length,
        active: active.length,
        archived: repos.filter((r) => r.isArchived).length,
        public: active.filter((r) => !r.isPrivate).length,
        namedOnGraph: nodes.length + 1,
    },
    definitions: {
        selection: 'hand-picked in data/registry-curation.json — not the most recently pushed, and not everything that exists',
        radius: 'curated tier: flagship > shipped > tool. NOT repository size',
        heat: '0 to 1 by recency of last push — 1 is today, 0 is 90 days or older',
        unnamed: 'registry entries drawn but not labelled — the count is real, the placement is arrangement',
        private: 'private repositories are counted; a private repo is named only where it is already public elsewhere on the page, and never links to code',
        proves: 'star and fork counts are substituted from the live gh call at build time, never typed by hand',
        archived: 'excluded from the graph but still counted in totals.repos',
    },
    tiers: Object.fromEntries(Object.entries(tiers).map(([k, v]) => [k, { r: v.r, legend: v.legend }])),
    core: {
        id: curation.core.repo,
        label: 'CORE',
        r: 26,
        tier: 'core',
        what: curation.core.what,
        proves: fill(curation.core.proves, coreRaw, 'curation.core'),
        stack: curation.core.stack || [],
        live: curation.core.live || null,
        code: coreFacts.private ? null : `https://github.com/${OWNER}/${curation.core.repo}`,
        pushedAt: coreFacts.pushedAt,
        lang: coreFacts.lang,
        private: coreFacts.private,
    },
    nodes,
    // Anonymous dots. Deliberately a count and nothing more: inventing positions
    // for repos we chose not to label would draw a relationship never measured.
    unnamed: Math.max(0, active.length - nodes.length - 1),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

const byTier = nodes.reduce((m, n) => ((m[n.tier] = (m[n.tier] || 0) + 1), m), {});
console.log(
    `\n  ✓ wrote ${OUT}\n` +
        `    ${out.totals.repos} repos in the registry (${out.totals.archived} archived, ${out.totals.public} public)\n` +
        `    ${out.totals.namedOnGraph} named · ${out.unnamed} unlabelled\n` +
        `    ${Object.entries(byTier).map(([t, c]) => `${c} ${t}`).join(' · ')}\n` +
        `    ${nodes.filter((n) => n.private).length} private named (each carries an explicit "disclosed")\n`
);
