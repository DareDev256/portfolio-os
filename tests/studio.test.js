/* THE STUDIO (4.65.0).
 *
 * What these pin:
 *   - the studio reads its crew from the Monitor's own markup: 16 sources, in
 *     switcher order, each with a role, a tool it can hold and a slate;
 *   - the text mirror for crawlers names the same crew in the same order;
 *   - no figure on the page is typed: every [data-fig] ships as a dash and is
 *     a key figures.json actually generates, and a missing key renders a dash;
 *   - every number carries its age, and an old file says how old;
 *   - the terminal escapes what a visitor types and its links land on real pages;
 *   - /os only points its exit at the studio when the visitor came from it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCrew, fillFigures, textOf, fig, asOfLabel, isNightShift, torontoHour, GATES, DASH } from '../js/studio/slates.js';
import { createTerminal, OPEN, LINKS } from '../js/studio/terminal.js';
import { TOOL_IDS, MOTION } from '../js/studio/tools3d.js';
import { TOOLS } from '../js/crew.js';
import { applyStudioDoor } from '../js/studio-door.js';
// existsSync comes from the node:fs import further down (imports hoist).
import { SERVED, promoteStudio } from '../tools/promote-studio.mjs';

const root = resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const parse = (html) => new DOMParser().parseFromString(html, 'text/html');
const home = parse(read('index.html'));
const studio = parse(read('studio/index.html'));
const figs = JSON.parse(read('public/data/figures.json'));
const crew = parseCrew(home);

describe('crew read from the Monitor', () => {
    it('finds all 16 sources in switcher order', () => {
        const ids = [...home.querySelectorAll('.src[data-src]')].map((b) => b.dataset.src);
        expect(crew).toHaveLength(16);
        expect(crew.map((c) => c.id)).toEqual(ids);
        expect(crew.map((c) => c.n)).toEqual(ids.map((_, i) => i + 1));
    });

    it('gives every crew member a role, a tint and a slate with a what line', () => {
        for (const c of crew) {
            expect(c.role, c.id).toMatch(/\S/);
            expect(c.tint, c.id).toMatch(/^#[0-9a-f]{6}$/i);
            expect(c.what, `${c.id} has no .what in its take`).not.toBeNull();
            expect(textOf(c.what, figs.figures).length, c.id).toBeGreaterThan(20);
        }
    });

    it('can put a 3D tool in every hand the Monitor draws', () => {
        for (const c of crew) expect(TOOL_IDS, `${c.id} holds ${c.tool}`).toContain(c.tool);
        expect([...TOOL_IDS].sort()).toEqual(Object.keys(TOOLS).sort());
        for (const id of TOOL_IDS) expect(MOTION[id], id).toBeDefined();
    });

    it('strips THE CALL label from the call line', () => {
        const c = crew.find((x) => x.id === 'fcp');
        expect(c.call.textContent).not.toMatch(/THE CALL/);
        expect(c.call.textContent).toMatch(/Strangers adopted it/);
    });

    it('returns no crew, not a guess, when the switcher is missing', () => {
        expect(parseCrew(parse('<main><p>moved</p></main>'))).toEqual([]);
    });
});

describe('the text mirror', () => {
    it('names the same crew, in the same order, as the Monitor', () => {
        const items = [...studio.querySelectorAll('#mirror li')].map((li) => [li.dataset.src, li.textContent.trim()]);
        expect(items).toEqual(crew.map((c) => [c.id, `${c.role}: ${c.scene}`]));
    });
});

describe('figures', () => {
    it('ships every studio figure as a dash, never a typed number', () => {
        const els = [...studio.querySelectorAll('[data-fig]')];
        expect(els.length).toBeGreaterThan(8);
        for (const el of els) expect(el.textContent.trim(), el.dataset.fig).toBe(DASH);
    });

    it('reads only keys figures.json generates', () => {
        const keys = new Set([...studio.querySelectorAll('[data-fig]')].map((el) => el.dataset.fig));
        for (const g of GATES) keys.add(g.big);
        ['stars', 'pypiVersion', 'wikiReverted', 'wikiRevertSample', 'bibRuns', 'bibVersion', 'siteVersion', 'passionVersion', 'repos', 'jobs', 'clientSites', 'clientSitesUp', 'installs'].forEach((k) => keys.add(k));
        for (const k of keys) expect(figs.figures, `figures.json has no "${k}"`).toHaveProperty(k);
    });

    it('fills what it has and dashes what it does not', () => {
        const d = parse('<p><span data-fig="repos">x</span> <span data-fig="nope">y</span></p>');
        const missing = fillFigures(d, { repos: '130' });
        expect(d.querySelector('[data-fig=repos]').textContent).toBe('130');
        expect(d.querySelector('[data-fig=nope]').textContent).toBe(DASH);
        expect(missing).toEqual(['nope']);
        expect(fig({}, 'repos')).toBe(DASH);
        expect(fig(null, 'repos')).toBe(DASH);
    });

    it('fills a stat whose own element carries the figure', () => {
        const fcp = crew.find((c) => c.id === 'fcp');
        const stars = fcp.stats.find((s) => s.label === 'stars');
        expect(textOf(stars.value, figs.figures)).toBe(String(figs.figures.stars));
        const d = parse('<dd data-fig="repos">x</dd>').body.firstChild;
        fillFigures(d, { repos: '130' });
        expect(d.textContent).toBe('130');
    });

    it('labels a source with no date by its kind, as the Monitor does', () => {
        expect(crew.find((c) => c.id === 'agent').date).toBe('LOG');
    });

    it('fills a slate from the live file', () => {
        const agent = crew.find((c) => c.id === 'agent');
        expect(textOf(agent.what, figs.figures)).toContain(`${figs.figures.repos}-repo`);
        expect(textOf(agent.what, {})).toContain(`${DASH}-repo`);
    });
});

describe('age', () => {
    const now = new Date('2026-11-13T05:00:00Z');
    it('stamps a fresh file with its Toronto time and no age', () => {
        expect(asOfLabel('2026-11-12T14:42:17Z', now)).toMatch(/^as of Nov 12, 9:42 AM ET$/);
    });
    it('says how old a stale file is', () => {
        expect(asOfLabel('2026-11-09T14:42:17Z', now)).toMatch(/3 days old$/);
    });
    it('admits a missing or broken stamp', () => {
        expect(asOfLabel(null, now)).toBe('figures unavailable');
        expect(asOfLabel('not a date', now)).toBe('figures unavailable');
    });
    it('runs the night shift from 20:00 to 06:00 Toronto', () => {
        expect([19, 20, 23, 0, 5, 6].map(isNightShift)).toEqual([false, true, true, true, true, false]);
        expect(torontoHour(new Date('2026-11-13T05:00:00Z'))).toBe(0);
    });
});

describe('terminal', () => {
    const t = () => createTerminal({ crew: () => crew, figures: () => figs.figures, asOf: () => 'as of test', now: () => new Date('2026-11-13T05:00:00Z') });

    it('escapes what the visitor typed', () => {
        const r = t().run('cat <img src=x onerror=alert(1)>');
        expect(r.html).not.toMatch(/<img/);
        expect(t().run('<script>').html).not.toMatch(/<script>/);
    });

    it('lists the crew and fills neofetch from figures.json', () => {
        expect(t().run('crew').html).toContain('fcp-mcp-server');
        expect(t().run('neofetch').html).toContain(String(figs.figures.repos));
        const empty = createTerminal({ crew: () => [], figures: () => ({}), asOf: () => '' });
        expect(empty.run('neofetch').html).toContain(DASH);
        expect(empty.run('crew').html).toMatch(/did not load/);
    });

    it('answers sudo hire james with the call sheet', () => {
        expect(t().run('sudo hire james').html).toContain('href="/#call"');
        expect(t().run('sudo rm -rf /').html).toMatch(/1st AD/);
    });

    it('opens /os through the studio door and exits on exit', () => {
        expect(t().run('open os').action).toEqual({ type: 'open', href: '/os?from=studio' });
        expect(t().run('exit').action).toEqual({ type: 'exit' });
        expect(t().run('clear').action).toEqual({ type: 'clear' });
    });

    it('completes commands and file names', () => {
        const term = t();
        expect(term.complete('neo').value).toBe('neofetch ');
        expect(term.complete('cat ab').value).toBe('cat about.txt');
        expect(term.complete('c').options).toEqual(['cat', 'crew', 'clear']);
    });

    it('links only to pages the build ships or the outside world', () => {
        const vite = read('vite.config.js');
        const internal = [...LINKS.map(([, u]) => u), ...Object.values(OPEN)].filter((u) => u.startsWith('/')).map((u) => u.split(/[?#]/)[0]);
        // Served path -> source file (4.69.0: the studio is /, the Monitor /monitor).
        const pages = { '/': 'studio/index.html', '/monitor': 'index.html', '/os': 'os/index.html' };
        for (const p of internal) {
            expect(pages[p], `${p} is not a known page`).toBeDefined();
            expect(vite).toContain(`'${pages[p]}'`);
        }
    });
});

describe('the way in and out', () => {
    it('builds the studio and serves it at /, the Monitor at /monitor (4.69.0)', () => {
        expect(read('vite.config.js')).toContain("studio: resolve(import.meta.dirname, 'studio/index.html')");
        expect(SERVED).toEqual({ 'studio/index.html': 'index.html', 'index.html': 'monitor/index.html' });
        const v = JSON.parse(read('vercel.json'));
        // Old /studio links land on the home page; nothing still rewrites to a /studio file the build no longer ships.
        expect(v.redirects).toContainEqual({ source: '/studio', destination: '/', permanent: true });
        expect(v.redirects).toContainEqual({ source: '/studio/:path*', destination: '/', permanent: true });
        expect(v.rewrites.filter((r) => r.destination.startsWith('/studio'))).toEqual([]);
        expect(v.rewrites).toContainEqual({ source: '/monitor', destination: '/monitor/index.html' });
        // The old Passion OS routes (/about, /work, /resume...) were always the content page: they stay on the Monitor.
        const legacy = v.rewrites.find((r) => r.source.includes('about|work'));
        expect(legacy.destination).toBe('/monitor/index.html');
    });

    it('swaps the two pages in the bundle, and refuses a bundle missing either', () => {
        const gen = promoteStudio().generateBundle.handler;
        const bundle = { 'index.html': { fileName: 'index.html', who: 'monitor' }, 'studio/index.html': { fileName: 'studio/index.html', who: 'studio' }, 'os/index.html': { fileName: 'os/index.html', who: 'os' } };
        gen.call({ error: (m) => { throw new Error(m); } }, {}, bundle);
        expect(Object.keys(bundle).sort()).toEqual(['index.html', 'monitor/index.html', 'os/index.html']);
        expect(bundle['index.html']).toMatchObject({ who: 'studio', fileName: 'index.html' });
        expect(bundle['monitor/index.html']).toMatchObject({ who: 'monitor', fileName: 'monitor/index.html' });
        const half = { 'index.html': { fileName: 'index.html' } };
        expect(() => gen.call({ error: (m) => { throw new Error(m); } }, {}, half)).toThrow(/must all be in the bundle/);
    });

    it('is the indexable home page, with the Monitor\'s identity and no typed figure', () => {
        expect(studio.querySelector('meta[name=robots]')).toBeNull();
        expect(studio.querySelector('link[rel=canonical]').getAttribute('href')).toBe('https://www.jamesdare.com');
        const ld = (doc) => JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
        const { name, ...rest } = ld(studio);
        const { name: legal, ...monitorRest } = ld(home);
        expect(name).toBe('James');
        expect(legal).not.toBe(name);
        expect(rest).toEqual(monitorRest);
        expect(studio.querySelector('meta[name=description]').getAttribute('content')).not.toMatch(/\d/);
        const og = studio.querySelector('meta[property="og:image"]').getAttribute('content');
        expect(og).toBe('https://www.jamesdare.com/thumbnails/og-studio.jpg');
        expect(existsSync(resolve(root, 'public', new URL(og).pathname.slice(1)))).toBe(true);
        // The Monitor moved: its canonical says where it lives now.
        expect(home.querySelector('link[rel=canonical]').getAttribute('href')).toBe('https://www.jamesdare.com/monitor');
    });

    it('says James, never a surname, in what a visitor reads', () => {
        const seen = [studio.querySelector('title'), studio.querySelector('#mast'), studio.querySelector('#mirror')].map((n) => n.textContent).join(' ');
        expect(seen).toMatch(/James/);
        expect(seen).not.toMatch(/Olusoga|\bDare\b/);
    });

    it('offers the hiring doors from the masthead: book, résumé, the Monitor', () => {
        const hrefs = [...studio.querySelectorAll('#mast .pills a')].map((a) => a.getAttribute('href'));
        expect(hrefs[0]).toBe('/book');
        expect(studio.querySelector('#mast .pills a.hot').getAttribute('href')).toBe('/book');
        expect(hrefs).toContain('/monitor');
        // The résumé opens through /cv: its file name carries the surname the page never shows.
        expect(hrefs).toContain('/cv');
        const cv = JSON.parse(read('vercel.json')).redirects.find((r) => r.source === '/cv');
        expect(cv.permanent).toBe(false);
        expect(existsSync(resolve(root, 'public', cv.destination.slice(1)))).toBe(true);
        expect(hrefs).not.toContain('/');
    });

    it('reads the crew from /monitor, never from / (which is this page now)', () => {
        const js = read('js/studio.js');
        expect(js).toMatch(/const MONITOR_URL = '\/monitor';/);
        expect(js).toMatch(/fetch\(MONITOR_URL,/);
        expect(js).not.toMatch(/fetch\('\/'/);
    });

    it('sends a device with no WebGL to the Monitor instead of a blank home page', () => {
        const js = read('js/studio.js');
        const fallback = js.slice(js.indexOf("throw new Error('no context')"), js.indexOf('const small ='));
        expect(fallback).toMatch(/location\.replace\(`\$\{MONITOR_URL\}/);
        expect(studio.querySelector('#nogl a').getAttribute('href')).toBe('/monitor');
    });

    it('paints the name and the way to book before the set: the loader sits under the masthead', () => {
        const css = read('css/studio.css');
        const z = (sel) => Number(new RegExp(`\\n\\${sel} \\{[^}]*z-index: (\\d+)`).exec(css)?.[1]);
        expect(z('.load')).toBeLessThan(z('.mast'));
        expect(z('.nogl')).toBeGreaterThan(z('.mast'));
    });

    it('lists /monitor in the sitemap', () => {
        expect(read('public/sitemap.xml')).toContain('<loc>https://www.jamesdare.com/monitor</loc>');
    });

    it('points the /os exit at the studio only for visitors from it', () => {
        const os = () => parse(read('os/index.html'));
        const a = os();
        expect(applyStudioDoor(a, '?from=studio')).toBe(true);
        const exit = a.querySelector('.top-bar-exit');
        expect(exit.getAttribute('href')).toBe('/');
        expect(exit.textContent).toMatch(/THE STUDIO/);
        const b = os();
        expect(applyStudioDoor(b, '')).toBe(false);
        expect(b.querySelector('.top-bar-exit').getAttribute('href')).toBe('/');
    });

    it('lets the hidden attribute beat the stylesheet, so the no-WebGL card stays hidden', () => {
        // 4.65.0 shipped locally with .nogl { display: grid } overriding [hidden]: the
        // fallback card covered a working scene. Only a rendered check caught it.
        expect(read('css/studio.css')).toMatch(/\[hidden\]\s*\{\s*display:\s*none\s*!important;?\s*\}/);
    });

    it('carries no inline script, which the site CSP would block', () => {
        // JSON-LD is data, never executed, so the CSP does not apply to it.
        const inline = [...studio.querySelectorAll('script')].filter((s) => !s.getAttribute('src') && s.getAttribute('type') !== 'application/ld+json');
        expect(inline).toHaveLength(0);
    });
});

/* ------------------------------------------------------------------ 4.66.0: the baked set, real screens, the cast */
import { setLayout, stationPose, RISER, CENTER, THRONE, LAB, POSTER, FLAT } from '../js/studio/layout.js';
import { setProblem, loadSet } from '../js/studio/set.js';
import { coverFit, screenKind, lowerThirds, feedFor } from '../js/studio/screens.js';
import { EXTRA_SLATES } from '../js/studio/cast.js';
import { existsSync, statSync, readdirSync } from 'node:fs';

const setJson = JSON.parse(read('public/assets/studio/set.json'));
const feeds = JSON.parse(read('public/assets/studio/feeds/manifest.json'));

describe('the baked set', () => {
    it('was baked for exactly the crew the Monitor has', () => {
        expect(setJson.stations).toBe(crew.length);
        expect(setJson.ids).toEqual(crew.map((c) => c.id));
        expect(setProblem(setJson, crew.length)).toBe('');
    });

    it('refuses a set baked for another crew size, or one that runs past its bin', () => {
        expect(setProblem(setJson, crew.length + 1)).toMatch(/baked for/);
        expect(setProblem(null, 16)).toBe('no manifest');
        const short = { ...setJson, bin: { ...setJson.bin, bytes: 100 } };
        expect(setProblem(short, crew.length)).toMatch(/runs past/);
    });

    it('ships every file set.json names, inside its size budget', () => {
        const bin = resolve(root, 'public/assets/studio', setJson.bin.file);
        expect(statSync(bin).size).toBe(setJson.bin.bytes);
        expect(setJson.bin.bytes).toBeLessThan(1_400_000);
        for (const t of Object.values(setJson.textures)) {
            const f = resolve(root, 'public/assets/studio', t.file);
            expect(existsSync(f), t.file).toBe(true);
            expect(statSync(f).size).toBeLessThan(1_200_000);
        }
    });

    it('decodes to the room it was modelled as (Int16 positions, three.js frame)', () => {
        const buf = readFileSync(resolve(root, 'public/assets/studio', setJson.bin.file));
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        const cyc = setJson.meshes.find((m) => m.name === 'cyc');
        const q = new Int16Array(ab, cyc.position, cyc.vertices * 3);
        const lo = [Infinity, Infinity, Infinity];
        const hi = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < q.length; i += 3) {
            for (let a = 0; a < 3; a++) {
                const v = cyc.center[a] + (cyc.half[a] * q[i + a]) / 32767;
                lo[a] = Math.min(lo[a], v);
                hi[a] = Math.max(hi[a], v);
            }
        }
        // floor at y 0 running to z 30 in front, the cove's wall at z -14 going up: Y is up, nothing rotated
        expect(lo[1]).toBeCloseTo(0, 2);
        expect(hi[1]).toBeGreaterThan(20);
        expect(hi[2]).toBeCloseTo(30, 1);
        expect(lo[2]).toBeCloseTo(-14, 1);
        expect(hi[0]).toBeCloseTo(46, 1);
        const idx = cyc.indexType === 'u32' ? new Uint32Array(ab, cyc.index, cyc.indices) : new Uint16Array(ab, cyc.index, cyc.indices);
        expect(Math.max(...idx)).toBeLessThan(cyc.vertices);
    });

    it('falls back to the hand-built set when the files are missing', async () => {
        const real = globalThis.fetch;
        globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => null });
        const warn = console.warn;
        console.warn = () => {};
        try {
            expect(await loadSet({}, {}, 16)).toBeNull();
        } finally {
            globalThis.fetch = real;
            console.warn = warn;
        }
    });
});

describe('the layout the bake and the page share', () => {
    it('puts half the crew on the floor and half on the riser, all facing the middle', () => {
        const L = setLayout(16);
        expect(L.stations).toHaveLength(16);
        expect(L.stations.filter((s) => s.back)).toHaveLength(8);
        for (const s of L.stations) {
            expect(s.y).toBe(s.back ? RISER.top : 0);
            const toC = Math.atan2(CENTER.x - s.x, CENTER.z - s.z);
            expect(s.ry).toBeCloseTo(toC, 6);
        }
    });

    it('keeps the throne, the lab and the inspo board clear of every station', () => {
        const poses = Array.from({ length: crew.length }, (_, i) => stationPose(i, crew.length));
        for (const p of [THRONE, LAB.robot, LAB.builder]) {
            for (const s of poses) expect(Math.hypot(p.x - s.x, p.z - s.z)).toBeGreaterThan(2);
        }
        const gateEdges = [-2.6 - 0.85, 2.6 + 0.85];
        expect(POSTER.x + POSTER.w / 2).toBeLessThan(gateEdges[0]);
        expect(POSTER.x - POSTER.w / 2).toBeGreaterThan(-FLAT.w / 2);
    });
});

describe('the station screens', () => {
    it('reads what the Monitor plays for each source', () => {
        const by = Object.fromEntries(crew.map((c) => [c.id, c]));
        expect(by.fcp.clips.length).toBeGreaterThan(0);
        expect(by.sites.clips.length).toBe(by.sites.tags.length);
        expect(by.bib.still).toMatch(/\.jpg$/);
        expect(screenKind(by.fcp)).toBe('clips');
        expect(screenKind(by.bib)).toBe('still');
        expect(screenKind(by.registry)).toBe('graph');
        expect(screenKind(by.sixjutsu)).toBe('none');
    });

    it('has a small station copy of every clip on the Monitor', () => {
        const clips = [...new Set(crew.flatMap((c) => c.clips))];
        expect(clips.length).toBeGreaterThan(10);
        for (const clip of clips) {
            const copy = feeds.clips[clip];
            expect(copy, `${clip} has no station copy: run node tools/studio/make-feeds.mjs`).toBeDefined();
            expect(statSync(resolve(root, 'public', copy.slice(1))).size).toBeLessThan(statSync(resolve(root, 'public', clip.slice(1))).size);
            expect(feedFor(clip, feeds)).toBe(copy);
        }
        expect(feedFor('/x.mp4', feeds)).toBe('/x.mp4');
    });

    it('crops footage to fill the screen without stretching it', () => {
        const wide = coverFit(1280, 720, 5 / 3);
        expect(wide.ry).toBe(1);
        expect(wide.rx).toBeCloseTo((5 / 3) / (16 / 9), 6);
        expect(wide.ox).toBeCloseTo((1 - wide.rx) / 2, 6);
        const tall = coverFit(640, 640, 5 / 3);
        expect(tall.rx).toBe(1);
        expect(tall.ry).toBeCloseTo(0.6, 6);
    });

    it('fills every lower third from figures.json, with a dash for what is missing', () => {
        const fcp = crew.find((c) => c.id === 'fcp');
        expect(lowerThirds(fcp, figs.figures).join(' ')).toContain(String(figs.figures.stars));
        expect(lowerThirds(fcp, {}).join(' ')).toContain(DASH);
        // a stat with no value node at all still prints a dash, never a guess
        expect(lowerThirds({ kind: 'rec', scene: 'x', what: null, stats: [{ value: null, label: 'stars' }] }, {})).toEqual([`${DASH} stars`]);
        const agent = crew.find((c) => c.id === 'agent');
        const activity = JSON.parse(read('public/data/activity.json'));
        const lines = lowerThirds(agent, figs.figures, { activity });
        expect(lines.some((l) => l.includes(activity.events[0].label))).toBe(true);
        const reg = crew.find((c) => c.id === 'registry');
        const registry = JSON.parse(read('public/data/registry-graph.json'));
        expect(lowerThirds(reg, figs.figures, { registry })[0]).toContain(`${registry.totals.repos} repos`);
    });
});

describe('the cast', () => {
    it('says "James" and never a surname, and keeps personal names off the set', () => {
        const copy = JSON.stringify(EXTRA_SLATES);
        expect(copy).not.toMatch(/\bDare\b|Olusoga|Sandra/);
        for (const f of ['studio/index.html', 'js/studio.js', 'js/studio/cast.js', 'js/studio/screens.js', 'js/studio/terminal.js', 'js/studio/monarch.js', 'tools/studio/build_monarch.py']) {
            expect(read(f), f).not.toMatch(/\bDare\b|Olusoga|dare-studio/);
        }
    });

    it('has a slate for every set piece you can tap', () => {
        for (const id of ['throne', 'claude', 'passion', 'robot', 'poster']) {
            expect(EXTRA_SLATES[id].what.length, id).toBeGreaterThan(30);
            expect(EXTRA_SLATES[id].role, id).toMatch(/\S/);
        }
    });
});

/* THE WALK-IN (4.67.0): on a first visit the camera flies the lab, the Vegapunk
 * board and the throne, then lands on the wide shot. Any input hands it back. */
import { WALKIN, SHOTS, walkinPose, shouldWalkIn, WALKIN_AGAIN_MS } from '../js/studio/walkin.js';

describe('the walk-in', () => {
    // a stand-in camera: every shot sits at its own point, distance on x
    const AT = { robot: [-8, 1, -4], poster: [-4, 3, -7], throne: [9, 2, -9], home: [0, 4.7, 12.3] };
    const shotFor = (name, dist = 0) => ({ pos: [AT[name][0] + dist, AT[name][1], AT[name][2]], look: AT[name] });

    it('opens on the lab, names the lab, the board and the throne in that order, and lands home', () => {
        expect(walkinPose(0, shotFor).pos).toEqual(shotFor('robot', WALKIN[0].dist).pos);
        expect(walkinPose(0, shotFor).cap).toMatch(/robot lab/);
        const end = walkinPose(WALKIN[WALKIN.length - 1].t + 1, shotFor);
        expect(end.done).toBe(true);
        expect(end.pos).toEqual(AT.home);
        expect(end.cap).toBeNull();
        const caps = [];
        for (let t = 0; t < 9; t += 0.05) {
            const c = walkinPose(t, shotFor).cap;
            if (caps[caps.length - 1] !== c) caps.push(c);
        }
        expect(caps).toEqual(['Stage left · the robot lab', 'Back wall · Dr. Vegapunk', 'Back right · the throne', null]);
    });

    it('only names shots the page can frame, in time order, and is short', () => {
        for (let i = 0; i < WALKIN.length; i += 1) {
            expect(SHOTS).toContain(WALKIN[i].shot);
            if (i) expect(WALKIN[i].t).toBeGreaterThan(WALKIN[i - 1].t);
        }
        expect(WALKIN[WALKIN.length - 1].shot).toBe('home');
        expect(WALKIN[WALKIN.length - 1].t).toBeLessThanOrEqual(10);
    });

    it('never jumps: one frame moves the camera a little, never a cut', () => {
        let prev = walkinPose(0, shotFor).pos;
        let most = 0;
        for (let t = 1 / 60; t < 9; t += 1 / 60) {
            const p = walkinPose(t, shotFor).pos;
            most = Math.max(most, Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]));
            prev = p;
        }
        expect(most).toBeGreaterThan(0);
        expect(most).toBeLessThan(0.5);
    });

    it('plays once a month, never under reduced motion, and always on ?walkin', () => {
        const now = 1_800_000_000_000;
        expect(shouldWalkIn({ reduce: false, now })).toBe(true);
        expect(shouldWalkIn({ reduce: false, seenAt: 'junk', now })).toBe(true);
        expect(shouldWalkIn({ reduce: false, seenAt: String(now - 864e5), now })).toBe(false);
        expect(shouldWalkIn({ reduce: false, seenAt: String(now - WALKIN_AGAIN_MS - 1), now })).toBe(true);
        expect(shouldWalkIn({ reduce: true, now })).toBe(false);
        expect(shouldWalkIn({ reduce: true, search: '?walkin', seenAt: String(now), now })).toBe(true);
        expect(shouldWalkIn({ reduce: false, search: '?walking', now: now, seenAt: String(now) })).toBe(false);
    });

    it('hands the camera back on any touch, wheel, key or tap target', () => {
        const src = read('js/studio.js');
        const body = (marker) => src.slice(src.indexOf(marker), src.indexOf('\n}', src.indexOf(marker)) + 2);
        expect(body("canvas.addEventListener('pointerdown'")).toContain('endWalkIn()');
        expect(body("canvas.addEventListener('wheel'")).toContain('endWalkIn()');
        expect(body("addEventListener('keydown', (e) => {\n    endWalkIn")).toContain('endWalkIn()');
        expect(body('function activate(h)')).toContain('endWalkIn()');
        // and the pass only runs in the wide shot, so a tap mid-pass is never fought
        expect(src).toMatch(/if \(walk && state\.mode === 'wide'\)/);
    });
});

/* 4.68.0: the takes. Each station screen reads its real commits from
 * public/data/stations.json (tools/build-stations.mjs). What these pin:
 *   - a take is a commit on a branch or HEAD: tags never count, because the
 *     nightly snapshot tags every dirty repo and would read as work done today;
 *   - days are Toronto days, and a commit after 7 pm ET does not leak into tomorrow;
 *   - someone else's project cloned onto this Mac is not his takes;
 *   - the published file carries numbers only, never a commit message;
 *   - a station the file does not carry keeps the Monitor's own label.
 */
import { gitLogArgs, bucketDays, parseLog, summarize, ownRepo, dayKey } from '../tools/build-stations.mjs';
import { takesFor, ageLabel, rolling, takesLine, takeDate, stripHeights, stripLabel, ROLLING_HOURS } from '../js/studio/takes.js';

describe('the takes', () => {
    const TZ = 'America/Toronto';
    const now = Date.parse('2026-11-13T15:00:00Z'); // 10:00 ET
    const stationsFile = JSON.parse(read('public/data/stations.json'));
    const map = JSON.parse(read('data/station-repos.json'));

    it('counts branches and HEAD, never tags', () => {
        const a = gitLogArgs({ repo: 'x' });
        expect(a).not.toContain('--all');
        expect(a).not.toContain('--tags');
        expect(a).toEqual(expect.arrayContaining(['HEAD', '--branches', '--remotes']));
        const p = gitLogArgs({ repo: 'x', paths: ['os', 'js/desktop.js'] });
        expect(p.slice(p.indexOf('--'))).toEqual(['--', 'os', 'js/desktop.js']);
        expect(gitLogArgs({}, 15)).toContain('--since=15.days.ago');
    });

    it('buckets by Toronto day, oldest first', () => {
        const lateYesterday = Date.parse('2026-11-13T04:30:00Z'); // 23:30 ET on the 12th
        const earlyToday = Date.parse('2026-11-13T05:30:00Z'); // 00:30 ET on the 13th
        const old = Date.parse('2026-10-01T12:00:00Z');
        expect(dayKey(lateYesterday, TZ)).toBe('2026-11-12');
        const d = bucketDays([lateYesterday, earlyToday, earlyToday, old], now, TZ, 14);
        expect(d).toHaveLength(14);
        expect(d[13]).toBe(2);
        expect(d[12]).toBe(1);
        expect(d.reduce((x, y) => x + y, 0)).toBe(3);
    });

    it('counts a commit once by hash and drops one dated in the future', () => {
        const t = Math.floor(now / 1000);
        const m = parseLog(`aaaaaaa ${t - 60}\naaaaaaa ${t - 60}\nbbbbbbb ${t + 86400}\nnot a line\n`, now);
        parseLog(`aaaaaaa ${t - 60}\nccccccc ${t - 3600}\n`, now, m);
        expect([...m.keys()].sort()).toEqual(['aaaaaaa', 'ccccccc']);
        const s = summarize(m, 2, now, TZ, 14);
        expect(s).toEqual({ repos: 2, takes: 2, inWindow: 2, days: [...new Array(13).fill(0), 2], lastAt: new Date((t - 60) * 1000).toISOString() });
    });

    it('leaves other people\'s projects out of the registry count', () => {
        expect(ownRepo('git@github.com:DareDev256/sixjutsu.git', '/x', ['DareDev256'])).toBe(true);
        expect(ownRepo('https://github.com/daredev256/coldopen', '/x', ['DareDev256'])).toBe(true);
        expect(ownRepo('https://github.com/hacksider/Deep-Live-Cam.git', '/x', ['DareDev256'])).toBe(false);
        expect(ownRepo('/x', '/x', ['DareDev256'])).toBe(true); // no origin: local work
        expect(ownRepo('https://gitlab.com/someone/thing.git', '/x', ['DareDev256'])).toBe(false);
    });

    it('publishes numbers only, for every mapped station, a fortnight long', () => {
        expect(stationsFile.windowDays).toBe(map.windowDays);
        for (const [id, s] of Object.entries(stationsFile.stations)) {
            expect(Object.keys(map.stations)).toContain(id);
            expect(Object.keys(s).sort()).toEqual(['days', 'inWindow', 'lastAt', 'repos', 'takes']);
            expect(s.days).toHaveLength(stationsFile.windowDays);
            expect(s.inWindow).toBe(s.days.reduce((a, b) => a + b, 0));
            expect(s.takes).toBeGreaterThanOrEqual(s.inWindow);
            if (s.lastAt) expect(Number.isNaN(Date.parse(s.lastAt))).toBe(false);
        }
        expect(Object.keys(stationsFile.all).sort()).toEqual(['active', 'days', 'inWindow', 'scanned']);
        // every station id in the map is a real source on the Monitor
        const ids = crew.map((c) => c.id);
        for (const id of Object.keys(map.stations)) expect(ids).toContain(id);
    });

    it('labels age, rolling and the strip from the file', () => {
        const at = (h) => new Date(now - h * 36e5).toISOString();
        expect(ageLabel(at(0.2), now)).toBe('12M AGO');
        expect(ageLabel(at(3), now)).toBe('3H AGO');
        expect(ageLabel(at(50), now)).toBe('2D AGO');
        expect(ageLabel(null, now)).toBeNull();
        expect(rolling({ lastAt: at(ROLLING_HOURS - 0.5) }, now)).toBe(true);
        expect(rolling({ lastAt: at(ROLLING_HOURS + 0.5) }, now)).toBe(false);
        expect(rolling(null, now)).toBe(false);
        expect(takeDate('2026-11-13T04:30:00Z')).toBe('12 NOV 26');
        expect(stripHeights([0, 2, 4])).toEqual([0, 0.5, 1]);
        expect(stripHeights([0, 0])).toEqual([0, 0]);
        const st = { repos: 1, takes: 40, inWindow: 3, days: [...new Array(13).fill(0), 3], lastAt: at(3) };
        expect(takesLine(st, 14, now)).toBe('3 takes in 14 days · last 3h ago');
        expect(takesLine({ all: true, repos: 54, inWindow: 1191, days: [] }, 14, now)).toBe('1,191 takes across 54 repos in 14 days');
        expect(stripLabel(st, 14, now)).toMatch(/^3 takes in the last 14 days, oldest day first: 0, .*3\. The newest landed 3h ago\.$/);
    });

    it('a station the file does not carry keeps its Monitor label', () => {
        const films = crew.find((c) => c.id === 'films');
        expect(takesFor(stationsFile, films)).toBeNull();
        expect(takesFor(null, films)).toBeNull();
        const reg = crew.find((c) => c.kind === 'graph');
        expect(takesFor(stationsFile, reg).all).toBe(true);
        const fcp = crew.find((c) => c.id === 'fcp');
        const lines = lowerThirds(fcp, figs.figures, { stations: stationsFile }, now);
        expect(lines[0]).toMatch(/^\d+ takes? in 14 days/);
        expect(lowerThirds(fcp, figs.figures, {}, now)[0]).not.toMatch(/takes/);
        // the registry keeps its repo totals first, the takes second
        const registry = JSON.parse(read('public/data/registry-graph.json'));
        const r = lowerThirds(reg, figs.figures, { registry, stations: stationsFile }, now);
        expect(r[0]).toContain('repos ·');
        expect(r[1]).toMatch(/takes across \d+ repos in 14 days/);
    });

    it('is wired: fetched by the page, built and published daily', () => {
        const src = read('js/studio.js');
        expect(src).toContain('json(STATIONS_URL)');
        expect(src).toMatch(/s\.rolling = rolling\(takesFor\(data\.stations, s\.c\)\)/);
        const pub = read('tools/publish-live-data.sh');
        expect(pub).toContain('node tools/build-stations.mjs');
        expect(pub).toMatch(/PATHS=\([^)]*public\/data\/stations\.json/);
        expect(pub).toMatch(/public\/data\/stations\.json\) jq -Sc/);
        expect(read('studio/index.html')).toContain('id="sTakes"');
    });
});

/* THE MONARCH (4.70.0): the figure on the throne is built to James's build in
 * Blender (tools/studio/build_monarch.py) and swapped in by cast.js; the
 * hand-built figure stays as the fallback. These decode the shipped bytes and
 * check the fit on their own, so a bad build cannot pass on the builder's word. */
import { monarchProblem, buildMonarch, loadMonarch, MONARCH_ZONES } from '../js/studio/monarch.js';

const monarchJson = JSON.parse(read('public/assets/studio/monarch.json'));
const monarchBin = (() => {
    const b = readFileSync(resolve(root, 'public/assets/studio', monarchJson.bin.file));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
})();
const FAKE3 = {
    Vector3: class { constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); } },
    BufferAttribute: class { constructor(array, itemSize, normalized = false) { Object.assign(this, { array, itemSize, normalized }); } },
    BufferGeometry: class {
        constructor() { this.attributes = {}; this.groups = []; }
        setAttribute(n, a) { this.attributes[n] = a; }
        setIndex(a) { this.index = a; }
        addGroup(start, count, materialIndex) { this.groups.push({ start, count, materialIndex }); }
        computeBoundingSphere() {}
    },
    Mesh: class { constructor(g, m) { this.geometry = g; this.material = m; } },
    Group: class {
        constructor() { this.children = []; const pos = { x: 0, y: 0, z: 0, fromArray: (a) => { [pos.x, pos.y, pos.z] = a; } }; this.position = pos; }
        add(c) { this.children.push(c); }
    },
};
const looks = Object.fromEntries(MONARCH_ZONES.map((z) => [z, { zone: z }]));
const built = buildMonarch(FAKE3, monarchJson, monarchBin, looks);
/** The points of one zone of one built part, in the Monarch's frame (y 0 = seat top, facing +Z). */
function zonePoints(part, zone) {
    const mesh = part === 'head' ? built.head.children[0] : built.body;
    const off = part === 'head' ? built.head.position : { x: 0, y: 0, z: 0 };
    const pos = mesh.geometry.attributes.position.array;
    const idx = mesh.geometry.index.array;
    const pts = [];
    for (const g of mesh.geometry.groups.filter((x) => MONARCH_ZONES[x.materialIndex] === zone)) {
        for (let i = g.start; i < g.start + g.count; i++) {
            const v = idx[i] * 3;
            pts.push([pos[v] + off.x, pos[v + 1] + off.y, pos[v + 2] + off.z]);
        }
    }
    return pts;
}

describe('the Monarch', () => {
    it('ships a usable monarch.json and a bin of exactly the size it names, inside budget', () => {
        expect(monarchProblem(monarchJson)).toBe('');
        expect(monarchBin.byteLength).toBe(monarchJson.bin.bytes);
        expect(monarchJson.bin.bytes).toBeLessThan(420_000);
        expect(monarchJson.fit.tris).toBeLessThanOrEqual(16000);
        expect(built.tris).toBe(monarchJson.fit.tris);
    });

    it('refuses a bin that is too short, a gap between zones, an unknown zone, or no eyes', () => {
        expect(monarchProblem(null)).toBe('no manifest');
        expect(monarchProblem({ ...monarchJson, bin: { ...monarchJson.bin, bytes: 100 } })).toMatch(/runs past/);
        const gap = structuredClone(monarchJson);
        gap.parts[0].groups[1].start += 3;
        expect(monarchProblem(gap)).toMatch(/not contiguous/);
        const odd = structuredClone(monarchJson);
        odd.parts[1].groups[0].zone = 'cape';
        expect(monarchProblem(odd)).toMatch(/unknown zone/);
        expect(monarchProblem({ ...monarchJson, eyes: [] })).toBe('no eyes');
    });

    it('sits on the throne: on the seat, soles on the dais, calves clear of the seat, inside the armrests', () => {
        const pants = zonePoints('body', 'pants');
        const soles = zonePoints('body', 'sole');
        const lowest = Math.min(...soles.map((p) => p[1]));
        expect(lowest).toBeGreaterThan(-0.535);
        expect(lowest).toBeLessThan(-0.465);
        // the seat's top is y 0, and the buttocks rest on it (joggers stand a centimetre off the skin)
        expect(Math.min(...pants.filter((p) => p[2] < 0.1).map((p) => p[1]))).toBeCloseTo(-0.011, 1);
        const shins = pants.filter((p) => p[1] < -0.12);
        expect(Math.min(...shins.map((p) => p[2]))).toBeGreaterThan(0.42);
        for (const part of ['body', 'head']) {
            for (const z of MONARCH_ZONES) {
                for (const p of zonePoints(part, z)) {
                    if (Math.abs(p[0]) > 0.54 && p[2] > -0.48 && p[2] < 0.48 && p[1] < 0.23) throw new Error(`${part} ${z} inside an armrest at ${p}`);
                }
            }
        }
    });

    it('faces the room, head up, left eye on his left: nothing mirrored or lying down', () => {
        const pivot = built.head.position;
        expect(pivot.y).toBeGreaterThan(0.3);
        const [l, r] = built.eyes;
        expect(l.z).toBeGreaterThan(0);
        expect(r.z).toBeGreaterThan(0);
        expect(l.y).toBeGreaterThan(0);
        expect(l.x).toBeGreaterThan(r.x);
        const cap = zonePoints('head', 'cap');
        const beard = zonePoints('head', 'beard');
        expect(Math.max(...cap.map((p) => p[1]))).toBeGreaterThan(Math.max(...beard.map((p) => p[1])));
        expect(Math.min(...soles(), Infinity)).toBeLessThan(pivot.y);
        function soles() { return zonePoints('body', 'sole').map((p) => p[1]); }
    });

    it('carries the look in zones and the palette in code: every zone has geometry and a material', () => {
        const zones = new Set();
        for (const mesh of [built.body, built.head.children[0]]) {
            expect(mesh.material).toHaveLength(MONARCH_ZONES.length);
            for (const g of mesh.geometry.groups) zones.add(MONARCH_ZONES[g.materialIndex]);
        }
        expect([...zones].sort()).toEqual([...MONARCH_ZONES].sort());
        expect(read('public/assets/studio/monarch.json')).not.toMatch(/color|#[0-9a-f]{6}/i);
    });

    it('keeps the hand-built figure when the files are missing', async () => {
        const real = globalThis.fetch;
        globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => null });
        const warn = console.warn;
        console.warn = () => {};
        try {
            expect(await loadMonarch(FAKE3, looks)).toBeNull();
        } finally {
            globalThis.fetch = real;
            console.warn = warn;
        }
    });

    it('is the one cast.js puts on the throne, and the throne shot frames him', () => {
        const cast = read('js/studio/cast.js');
        expect(cast).toMatch(/loadMonarch\(THREE, monarchLook\)/);
        expect(cast).toMatch(/monarch\.remove\(capsule\)/);
        expect(cast).toMatch(/monarch: \(\) => \(\{ built: fig\.built/);
        expect(cast).toMatch(/fig\.built \? monarch\.localToWorld/);
        expect(read('js/studio.js')).toMatch(/frameSpot\(spot, fwd, built \? 3\.3 : 4\.6, 0\.2, built \? 0\.6 : 0\)/);
    });

    it('keeps the photos it was matched to out of the repo', () => {
        for (const dir of ['tools/studio', 'public/assets/studio']) {
            const files = readdirSync(resolve(root, dir));
            expect(files.filter((f) => /\.(jpe?g|heic|png)$/i.test(f)), dir).toEqual([]);
        }
        expect(read('tools/studio/build_monarch.py')).toMatch(/no\s+photo is stored in this repo/);
    });
});
