#!/usr/bin/env node
/* link-audit.mjs — prove every link on the site resolves to something real.
 *
 *   node tools/link-audit.mjs              # build dir + offline resolution
 *   node tools/link-audit.mjs --external   # also hit the network for off-site links
 *   node tools/link-audit.mjs --json       # machine-readable
 *
 * WHY THIS CANNOT BE AN HTTP CRAWLER.
 *
 * vercel.json ends with a catch-all that rewrites everything not matching an
 * exception to /index.html. So `curl -o /dev/null -w %{http_code}` against ANY
 * internal path on this site returns 200 — including paths that ship no file at
 * all. `/work/second-opinion` 200s with the homepage. A crawler that trusts
 * status codes reports a perfectly healthy site while four case studies are
 * unreachable, which is precisely how a broken link survives a green audit.
 *
 * So internal links are resolved against the BUILD OUTPUT and the rewrite table,
 * not the network: a path is OK when a real file backs it, and BROKEN when the
 * only thing answering it is the catch-all. External links are the opposite —
 * nothing local can vouch for them, so those do go over the wire.
 *
 * Sources of links, because HTML alone under-counts on this site:
 *   1. every .html in the build (attributes: href, src, action, poster, srcset)
 *   2. public/data/*.json — the graph's `live`/`code` fields are real links that
 *      appear in no markup until the script builds a card
 *   3. js/*.js string literals — the OS desktop is one shell HTML whose entire
 *      UI, and therefore every link in it, is constructed at runtime
 */

import process from 'node:process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const ARGS = new Set(process.argv.slice(2));
const CHECK_EXTERNAL = ARGS.has('--external');
const AS_JSON = ARGS.has('--json');

if (!existsSync(DIST)) {
    console.error('\n  ✗ no dist/ — run `npm run build` first.\n');
    process.exit(1);
}

/* ---------- vercel rewrite table ---------- */

const vercel = JSON.parse(readFileSync(resolve(ROOT, 'vercel.json'), 'utf8'));

/* The catch-all is identified by structure, not by position: it is the rewrite
 * whose destination is the SPA shell. Hardcoding "the last one" would silently
 * start trusting a real route the day someone appends a rule. */
const rewrites = (vercel.rewrites || []).map((r) => ({
    ...r,
    isCatchAll: r.destination === '/index.html' && r.source.includes('(?!'),
    // Vercel sources are path-to-regexp-ish. Only the two shapes actually used
    // here are interpreted: a literal, and a literal + wildcard.
    re: new RegExp('^' + r.source.replace(/\(\.\*\)/g, '.*').replace(/:\w+\*/g, '.*') + '$'),
}));

function matchRewrite(pathname) {
    return rewrites.find((r) => {
        try {
            return r.re.test(pathname);
        } catch {
            return false;
        }
    });
}

/* REDIRECTS, which Vercel evaluates BEFORE rewrites.
 *
 * This auditor knew about `rewrites` and not `redirects`, so the day `/book`
 * was added as a redirect it reported a false failure: "no file ships for this
 * path — the catch-all serves index.html with a 200". True of a rewrite, wrong
 * of a redirect, because the redirect fires first and the request never reaches
 * the catch-all.
 *
 * A false failure is not harmless. It is the reading that gets a check switched
 * off, and this check exists to catch a genuinely invisible bug — a link to a
 * page that ships no file and returns 200 anyway. Teach it the rule rather than
 * suppress the finding. */
const redirects = (vercel.redirects || []).map((r) => ({
    ...r,
    re: new RegExp('^' + r.source.replace(/\(\.\*\)/g, '.*').replace(/:\w+\*/g, '.*') + '$'),
}));

function matchRedirect(pathname) {
    return redirects.find((r) => {
        try {
            return r.re.test(pathname);
        } catch {
            return false;
        }
    });
}

/* ---------- walk the build ---------- */

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) walk(p, out);
        else out.push(p);
    }
    return out;
}

const distFiles = new Set(walk(DIST).map((p) => '/' + relative(DIST, p).split(/[\\/]/).join('/')));

/* A path is backed by a real file if it IS one, or if it is a directory whose
 * index.html exists, or if adding .html finds one. */
function fileFor(pathname) {
    const clean = pathname.replace(/\/+$/, '') || '/';
    if (distFiles.has(clean)) return clean;
    if (distFiles.has(clean + '/index.html')) return clean + '/index.html';
    if (distFiles.has(clean + '.html')) return clean + '.html';
    if (clean === '/' && distFiles.has('/index.html')) return '/index.html';
    return null;
}

/* ---------- collect ---------- */

const links = []; // {url, from, kind}
function add(url, from, kind) {
    if (!url) return;
    const u = String(url).trim();
    if (!u || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('javascript:')) return;
    /* A template literal is a URL SHAPE, not a URL. `/assets/emotions/${emotion}.png`
     * cannot be resolved against the build without evaluating the program, and
     * reporting it BROKEN is a false positive that trains you to ignore the
     * report — the failure mode that kills an audit faster than missing a link. */
    if (u.includes('${') || u.includes('{{')) return;
    /* Ellipsis in a URL is documentation, not an address — `https://github.com/...`
     * is a placeholder in a code sample. */
    if (u.includes('...')) return;
    /* Reserved TLDs (RFC 2606 / 6761) are sentinels by definition. sanitize.js
     * parses against http://dummy-base.local precisely BECAUSE nothing answers
     * it; resolving one is a category error. */
    if (/\.(?:local|invalid|test|example|localhost)(?:[:/]|$)/i.test(u)) return;
    /* Attribute values are HTML-encoded. `?diff=prev&amp;oldid=21515` fetched
     * literally is a different URL than the one a browser requests, so a
     * mis-decoded link can fail for a reason the site does not have. */
    const decoded = u
        .replace(/&amp;/g, '&')
        .replace(/&#38;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    links.push({ url: decoded, from, kind });
}

const htmlFiles = [...distFiles].filter((f) => f.endsWith('.html'));
const docIds = new Map(); // html path -> Set of element ids

for (const rel of htmlFiles) {
    const html = readFileSync(join(DIST, rel), 'utf8');

    const ids = new Set();
    for (const m of html.matchAll(/\sid=["']([^"']+)["']/g)) ids.add(m[1]);
    docIds.set(rel, ids);

    /* <link rel="preconnect"> and dns-prefetch point at an ORIGIN, not a
     * resource. https://fonts.gstatic.com has no document at its root and
     * answers 404 by design; reporting that as a broken link is the measurer
     * being wrong about what it is measuring. Strip those tags first. */
    const scannable = html.replace(
        /<link\b[^>]*\brel=["'](?:preconnect|dns-prefetch)["'][^>]*>/gi,
        ''
    );

    for (const m of scannable.matchAll(/\s(?:href|src|action|poster)=["']([^"']*)["']/g)) add(m[1], rel, 'html');
    // srcset is a comma list of "url descriptor" pairs.
    for (const m of scannable.matchAll(/\ssrcset=["']([^"']*)["']/g)) {
        for (const part of m[1].split(',')) add(part.trim().split(/\s+/)[0], rel, 'html');
    }
}

// Data files: fields that are declared to be links.
for (const rel of [...distFiles].filter((f) => f.startsWith('/data/') && f.endsWith('.json'))) {
    let data;
    try {
        data = JSON.parse(readFileSync(join(DIST, rel), 'utf8'));
    } catch {
        continue;
    }
    (function scan(node) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach(scan);
        for (const [k, v] of Object.entries(node)) {
            if (typeof v === 'string' && /^(https?:\/\/|\/)/.test(v) && /url|href|link|code|live|src|poster|thumb/i.test(k)) {
                add(v, rel, 'data');
            } else scan(v);
        }
    })(data);
}

/* Source JS. The OS desktop ships one shell document and builds its whole UI at
 * runtime, so every link inside it exists only as a string literal. Absolute
 * URLs and root-relative paths with a file-ish shape are collected; a bare '/'
 * or an obvious API path is not a navigable link and would only add noise. */
const jsDirs = [resolve(ROOT, 'js'), resolve(ROOT, 'os'), resolve(ROOT, 'coldopen')];
for (const dir of jsDirs) {
    if (!existsSync(dir)) continue;
    for (const p of walk(dir).filter((f) => f.endsWith('.js'))) {
        const src = readFileSync(p, 'utf8');
        const from = relative(ROOT, p);
        for (const m of src.matchAll(/['"`](https?:\/\/[^'"`\s)]+)['"`]/g)) add(m[1], from, 'js');
        /* The extension list must include .js/.css/.webmanifest. It did not, and
         * that is exactly how `navigator.serviceWorker.register('/sw.js')` slipped
         * past a clean audit while /sw.js was serving the HTML shell in
         * production. A measurer that cannot see a whole file type reports zero
         * problems in it forever. */
        for (const m of src.matchAll(/['"`](\/[a-zA-Z0-9][^'"`\s)]*\.(?:html|pdf|png|jpe?g|webp|svg|mp4|webm|json|txt|xml|ico|js|mjs|css|webmanifest))['"`]/g))
            add(m[1], from, 'js');
    }
}

/* ---------- classify ---------- */

const results = [];
const seenExternal = new Map();

for (const l of links) {
    const { url, from, kind } = l;

    if (/^(mailto|tel):/i.test(url)) {
        const val = url.replace(/^(mailto|tel):/i, '').split('?')[0];
        const ok = url.toLowerCase().startsWith('mailto:')
            ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
            : /^\+?[0-9().\s-]{7,}$/.test(val);
        results.push({ url, from, kind, type: 'contact', status: ok ? 'OK' : 'BROKEN', note: ok ? '' : 'malformed' });
        continue;
    }

    if (url.startsWith('#')) {
        const id = decodeURIComponent(url.slice(1));
        if (!id) {
            results.push({ url, from, kind, type: 'anchor', status: 'OK', note: 'top of page' });
            continue;
        }
        const ids = docIds.get(from);
        // An id can legitimately be created by script (the graph nodes are), so a
        // miss inside a runtime-built page is UNKNOWN, never BROKEN.
        const ok = ids ? ids.has(id) : false;
        results.push({
            url,
            from,
            kind,
            type: 'anchor',
            status: ok ? 'OK' : ids ? 'BROKEN' : 'UNKNOWN',
            note: ok ? '' : 'no element with this id in the built HTML',
        });
        continue;
    }

    if (/^https?:\/\//i.test(url)) {
        results.push({ url, from, kind, type: 'external', status: 'PENDING', note: '' });
        continue;
    }

    if (url.startsWith('//')) {
        results.push({ url, from, kind, type: 'external', status: 'PENDING', note: 'protocol-relative' });
        continue;
    }

    // Internal. Resolve relative paths against the document that named them.
    let pathname;
    if (url.startsWith('/')) pathname = url.split('#')[0].split('?')[0];
    else {
        const base = kind === 'html' ? dirname(from) : '/';
        pathname = join(base, url.split('#')[0].split('?')[0]).split(/[\\/]/).join('/');
        if (!pathname.startsWith('/')) pathname = '/' + pathname;
    }

    const file = fileFor(pathname);
    if (file) {
        results.push({ url, from, kind, type: 'internal', status: 'OK', note: file });
        continue;
    }

    /* Vercel evaluates REDIRECTS before rewrites, so this check has to come
     * first — placing it inside the rewrite branch (as the first attempt did)
     * means it only fires for paths that already matched a rewrite, which a
     * redirect-only path never does.
     *
     * The destination is off-site by definition here, so there is no local file
     * to resolve; the network half of this audit (`npm run audit:links:net`) is
     * what checks the far end still answers. */
    const rd = matchRedirect(pathname);
    if (rd) {
        results.push({ url, from, kind, type: 'internal', status: 'OK', note: `redirect → ${rd.destination}` });
        continue;
    }

    const rw = matchRewrite(pathname);
    if (rw && !rw.isCatchAll) {
        // A real route rule. It is only OK if its destination exists — a rewrite
        // to a missing file is a 404 dressed as a route.
        if (/^https?:/i.test(rw.destination)) {
            results.push({ url, from, kind, type: 'internal', status: 'OK', note: `proxied → ${rw.destination}` });
        } else {
            const dest = fileFor(rw.destination);
            results.push({
                url,
                from,
                kind,
                type: 'internal',
                status: dest ? 'OK' : 'BROKEN',
                note: dest ? `rewrite → ${dest}` : `rewrite → ${rw.destination} WHICH DOES NOT EXIST`,
            });
        }
        continue;
    }

    /* Nothing but the catch-all answers this. It will return 200 and render the
     * homepage, which is why nobody notices. This is the finding the whole
     * script exists to produce. */
    results.push({
        url,
        from,
        kind,
        type: 'internal',
        status: 'BROKEN',
        note: 'no file ships for this path — the catch-all serves index.html with a 200',
    });
}

/* ---------- external, over the wire ---------- */

async function checkExternal() {
    const pending = results.filter((r) => r.status === 'PENDING');
    const unique = [...new Set(pending.map((r) => r.url))];

    if (!CHECK_EXTERNAL) {
        pending.forEach((r) => {
            r.status = 'SKIPPED';
            r.note = 'pass --external to check';
        });
        return unique.length;
    }

    const LIMIT = 8;
    let i = 0;

    async function one(url) {
        // HEAD first, GET on anything that is not a clean success: plenty of
        // hosts (PyPI, some CDNs) answer HEAD with 403 or 405 while GET is fine,
        // and reporting those as dead links would be a false positive.
        const attempt = async (method) => {
            const ctl = new AbortController();
            const t = setTimeout(() => ctl.abort(), 12_000);
            try {
                const res = await fetch(url, {
                    method,
                    redirect: 'follow',
                    signal: ctl.signal,
                    headers: { 'user-agent': 'jamesdare-link-audit/1.0' },
                });
                return { code: res.status, finalUrl: res.url };
            } finally {
                clearTimeout(t);
            }
        };

        try {
            let r = await attempt('HEAD');
            if (r.code >= 400) r = await attempt('GET');
            return r;
        } catch {
            // One retry before believing it. A single transient DNS or TLS
            // failure reported as a dead link is how an audit earns the
            // reputation that gets it ignored.
            try {
                return await attempt('GET');
            } catch (err) {
                return { code: 0, error: err.name === 'AbortError' ? 'timeout' : err.message };
            }
        }
    }

    async function worker() {
        while (i < unique.length) {
            const url = unique[i++];
            const r = await one(url);
            seenExternal.set(url, r);
        }
    }

    await Promise.all(Array.from({ length: Math.min(LIMIT, unique.length) }, worker));

    for (const r of pending) {
        const got = seenExternal.get(r.url);
        if (!got) continue;
        if (got.code === 0) {
            r.status = 'BROKEN';
            r.note = got.error || 'no response';
        } else if (got.code === 401 || got.code === 403 || got.code === 429) {
            /* Fandom, LinkedIn and Instagram refuse a non-browser user-agent.
             * That is the host declining to be audited, not the link being
             * dead — a browser follows it fine. Calling it BROKEN buries the
             * real findings under noise nobody can act on. */
            r.status = 'BLOCKED';
            r.note = `HTTP ${got.code} — host blocks automated requests, verify by hand`;
        } else if (got.code >= 400) {
            r.status = 'BROKEN';
            r.note = `HTTP ${got.code}`;
        } else {
            r.status = 'OK';
            const moved = got.finalUrl && got.finalUrl.replace(/\/$/, '') !== r.url.replace(/\/$/, '');
            r.note = moved ? `HTTP ${got.code} → ${got.finalUrl}` : `HTTP ${got.code}`;
        }
    }

    return unique.length;
}

const externalCount = await checkExternal();

/* ---------- report ---------- */

// Dedupe for display: the same URL in the same file is one link to fix.
const seen = new Set();
const uniq = results.filter((r) => {
    const k = `${r.type}|${r.url}|${r.from}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
});

const broken = uniq.filter((r) => r.status === 'BROKEN');
const unknown = uniq.filter((r) => r.status === 'UNKNOWN');
const blocked = uniq.filter((r) => r.status === 'BLOCKED');

/* /fandom-flow is a generated dashboard committed by another repo's daily job.
 * Its links are not hand-authored here, so they are reported apart rather than
 * drowning the surfaces James actually edits. */
const GENERATED = /^\/fandom-flow\//;
const mine = (r) => !GENERATED.test(r.from);

if (AS_JSON) {
    console.log(JSON.stringify({ checked: uniq.length, broken, unknown, blocked, all: uniq }, null, 2));
    process.exit(broken.filter(mine).length ? 1 : 0);
}

const by = (s) => uniq.filter((r) => r.status === s).length;

console.log(`\n  LINK AUDIT — ${uniq.length} unique links across ${htmlFiles.length} built pages, data and scripts`);
console.log(
    `  OK ${by('OK')} · BROKEN ${broken.length} (${broken.filter(mine).length} on hand-authored pages) · ` +
        `BLOCKED ${blocked.length} · UNKNOWN ${unknown.length} · ` +
        `external ${externalCount}${CHECK_EXTERNAL ? ' checked' : ' NOT checked (--external)'}\n`
);

const mineBroken = broken.filter(mine);
const genBroken = broken.filter((r) => !mine(r));

if (mineBroken.length) {
    console.log('  ✗ BROKEN');
    for (const r of mineBroken) console.log(`    ${r.type.padEnd(9)} ${r.url}\n      in ${r.from}\n      ${r.note}`);
    console.log('');
}

if (genBroken.length) {
    console.log(`  ✗ BROKEN in generated sub-apps (${genBroken.length}) — fix at the source repo`);
    const files = [...new Set(genBroken.map((r) => r.from))];
    for (const f of files) console.log(`    ${f}: ${genBroken.filter((r) => r.from === f).length}`);
    console.log('');
}

if (blocked.length) {
    console.log(`  ⃠ BLOCKED (${blocked.length}) — host refuses automated requests, not evidence of a dead link`);
    const hosts = {};
    for (const r of blocked) {
        const h = new URL(r.url).host;
        hosts[h] = (hosts[h] || 0) + 1;
    }
    for (const [h, n] of Object.entries(hosts)) console.log(`    ${h}  ×${n}`);
    console.log('');
}

if (unknown.length) {
    console.log('  ? UNKNOWN (target may be built at runtime)');
    for (const r of unknown) console.log(`    ${r.url}  in ${r.from}`);
    console.log('');
}

process.exit(mineBroken.length ? 1 : 0);
