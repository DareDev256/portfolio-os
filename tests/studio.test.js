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
        const pages = { '/': 'index.html', '/os': 'os/index.html', '/studio': 'studio/index.html' };
        for (const p of internal) {
            expect(pages[p], `${p} is not a known page`).toBeDefined();
            expect(vite).toContain(`'${pages[p]}'`);
        }
    });
});

describe('the way in and out', () => {
    it('builds /studio and routes it', () => {
        expect(read('vite.config.js')).toContain("studio: resolve(import.meta.dirname, 'studio/index.html')");
        const rw = JSON.parse(read('vercel.json')).rewrites;
        expect(rw).toContainEqual({ source: '/studio', destination: '/studio/index.html' });
    });

    it('keeps the studio out of search until it takes /', () => {
        expect(studio.querySelector('meta[name=robots]')?.getAttribute('content')).toBe('noindex');
    });

    it('points the /os exit at the studio only for visitors from it', () => {
        const os = () => parse(read('os/index.html'));
        const a = os();
        expect(applyStudioDoor(a, '?from=studio')).toBe(true);
        const exit = a.querySelector('.top-bar-exit');
        expect(exit.getAttribute('href')).toBe('/studio');
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
        const inline = [...studio.querySelectorAll('script')].filter((s) => !s.getAttribute('src'));
        expect(inline).toHaveLength(0);
    });
});
