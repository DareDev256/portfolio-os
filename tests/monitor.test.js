/* The homepage monitor (4.62.0).
 *
 * What these pin:
 *   - every figure on the page is one figures.json actually generates, and none
 *     carries a typed fallback (a stale literal reads as correct, a dash does not);
 *   - every clip, poster and still a source points at ships in public/;
 *   - a cut swaps the take, the HUD and the tally together, and the take counter
 *     only moves on a real cut;
 *   - the agent feed admits its age once the activity file is older than its window;
 *   - old anchors from the long page still land on the right view.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { initMonitor, routeFor, activitySummary, hudDate, agentFeedLabel } from '../js/monitor.js';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const figs = JSON.parse(readFileSync(resolve(root, 'public/data/figures.json'), 'utf8'));

describe('monitor markup', () => {
    it('reads only figures that figures.json generates or hand-counts with a note', () => {
        const keys = [...new Set([...html.matchAll(/data-fig="(\w+)"/g)].map((m) => m[1]))];
        expect(keys.length).toBeGreaterThan(20);
        const known = new Set([...Object.keys(figs.figures), ...Object.keys(figs.manual ?? {})]);
        const missing = keys.filter((k) => !known.has(k));
        expect(missing).toEqual([]);
    });

    it('carries no typed value inside any [data-fig]', () => {
        const typed = [...html.matchAll(/<(\w+)[^>]*data-fig="(\w+)"[^>]*>([^<]*)</g)]
            .filter((m) => m[3].trim() !== '&#8212;')
            .map((m) => `${m[2]}="${m[3]}"`);
        expect(typed).toEqual([]);
    });

    it('ships every clip, poster and still a source or the reel points at', () => {
        const paths = new Set();
        for (const m of html.matchAll(/data-clips="([^"]+)"/g)) m[1].split(/\s+/).forEach((p) => paths.add(p));
        for (const m of html.matchAll(/(?:data-poster|data-still|data-lazy|poster)="(\/assets\/[^"]+)"/g)) paths.add(m[1]);
        expect(paths.size).toBeGreaterThan(20);
        const absent = [...paths].filter((p) => !existsSync(resolve(root, 'public', p.slice(1))));
        expect(absent).toEqual([]);
    });

    it('labels every tag list one-to-one with its clips', () => {
        for (const m of html.matchAll(/data-clips="([^"]+)"[^>]*data-tags="([^"]+)"/g)) {
            expect(m[2].split('|').length).toBe(m[1].split(/\s+/).length);
        }
    });

    it('keeps the take panels and tabs that no-script readers fall back to', () => {
        expect(html).toContain('<noscript>');
        for (const v of ['monitor', 'crew', 'reel', 'call']) expect(html).toContain(`id="${v}"`);
        expect(html).toContain('data-book-intro');
        expect(html).toContain('id="system-chat"');
        expect(html).toContain('id="registry-graph"');
    });
});

describe('routeFor', () => {
    const ids = ['fcp', 'agent', 'registry', 'manyroads'];
    it('maps the four tabs', () => {
        for (const v of ['monitor', 'crew', 'reel', 'call']) expect(routeFor(`#${v}`, ids)).toEqual({ view: v, source: null });
    });
    it('lands old long-page anchors on the right view and source', () => {
        expect(routeFor('#gates', ids)).toEqual({ view: 'monitor', source: null });
        expect(routeFor('#system', ids)).toEqual({ view: 'monitor', source: 'registry' });
        expect(routeFor('#system/fcp-mcp-server', ids)).toEqual({ view: 'monitor', source: 'registry' });
        expect(routeFor('#play', ids)).toEqual({ view: 'monitor', source: 'manyroads' });
        expect(routeFor('#contact', ids)).toEqual({ view: 'call', source: null });
    });
    it('deep-links a source by its id, and falls back to the monitor', () => {
        expect(routeFor('#agent', ids)).toEqual({ view: 'monitor', source: 'agent' });
        expect(routeFor('#nope', ids)).toEqual({ view: 'monitor', source: null });
        expect(routeFor('', ids)).toEqual({ view: 'monitor', source: null });
    });
});

describe('agent feed age', () => {
    const data = { generatedAt: '2026-10-31T09:00:00Z', ranInWindow: 4, jobsWatched: 8, windowHours: 36 };
    it('states the measurement plainly while it is inside its window', () => {
        const s = activitySummary(data, Date.parse('2026-10-31T20:00:00Z'));
        expect(s.stale).toBe(false);
        expect(s.text).toBe('4 of 8 watched jobs wrote a log in 36 h');
    });
    it('says how old it is once the window has passed', () => {
        const s = activitySummary(data, Date.parse('2026-11-05T09:00:00Z'));
        expect(s.stale).toBe(true);
        expect(s.text).toContain('Read 5 days ago');
    });
    it('treats an unreadable timestamp as stale, never as current', () => {
        expect(activitySummary({ ...data, generatedAt: 'nope' }).stale).toBe(true);
    });
    it('formats the HUD date like a slate', () => {
        expect(hudDate('2026-10-31T12:00:00Z')).toBe('31 OCT 26');
        expect(hudDate('nope')).toBe('');
    });
});

describe('the filmed agent run', () => {
    const now = Date.parse('2026-10-31T20:00:00Z');
    it('dates a clean recent run like a slate', () => {
        expect(agentFeedLabel({ recordedAt: '2026-10-31T12:01:35Z', exitCode: 0 }, now)).toBe('31 OCT 26');
    });
    it('says how old the footage is once past the window', () => {
        expect(agentFeedLabel({ recordedAt: '2026-10-27T12:00:00Z', exitCode: 0 }, now)).toBe('27 OCT 26 · 4 DAYS OLD');
    });
    it('refuses a failed or undated run, so the log replay stays on air', () => {
        expect(agentFeedLabel({ recordedAt: '2026-10-31T12:00:00Z', exitCode: 1 }, now)).toBeNull();
        expect(agentFeedLabel({ recordedAt: 'nope', exitCode: 0 }, now)).toBeNull();
        expect(agentFeedLabel(null, now)).toBeNull();
    });
});

describe('the switcher in the page', () => {
    let api;
    beforeEach(() => {
        document.documentElement.innerHTML = html.replace(/^[\s\S]*?<html[^>]*>/, '').replace(/<\/html>\s*$/, '');
        window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
        window.HTMLMediaElement.prototype.pause = vi.fn();
        window.HTMLMediaElement.prototype.load = vi.fn();
        window.scrollTo = vi.fn();
        window.location.hash = '';
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ generatedAt: new Date().toISOString(), windowHours: 36, ranInWindow: 4, jobsWatched: 8, events: [{ time: '06:47', id: 'daily-brief', label: 'Morning brief compiled and sent' }] }),
        }));
        api = initMonitor(document, window);
    });

    const sel = (id) => document.getElementById(`src-${id}`);
    const take = (id) => document.getElementById(`take-${id}`);

    it('opens on the Final Cut feed with its take on the slate', () => {
        expect(api.current).toBe('fcp');
        expect(sel('fcp').getAttribute('aria-selected')).toBe('true');
        expect(take('fcp').hidden).toBe(false);
        expect(document.querySelectorAll('.take:not([hidden])').length).toBe(1);
        expect(document.getElementById('sTake').textContent).toBe('01');
    });

    it('cuts the take, HUD, tally and focus order together', () => {
        sel('betmetrics').click();
        expect(take('betmetrics').hidden).toBe(false);
        expect(take('fcp').hidden).toBe(true);
        expect(document.querySelectorAll('.take:not([hidden])').length).toBe(1);
        expect(document.getElementById('hudCam').textContent).toBe('1 · BETMETRICS');
        expect(document.getElementById('hudRec').textContent).toBe('REC 21 AUG 26');
        expect(document.getElementById('sTake').textContent).toBe('02');
        expect(sel('betmetrics').tabIndex).toBe(0);
        expect(sel('fcp').tabIndex).toBe(-1);
        expect(document.getElementById('pgm').getAttribute('src')).toContain('site-betmetrics.mp4');
    });

    it('does not count a tap on the source already on air as a new take', () => {
        sel('fcp').click();
        expect(document.getElementById('sTake').textContent).toBe('01');
    });

    it('shows the right layer for each kind of source', () => {
        sel('sixjutsu').click();
        expect(document.getElementById('nosignal').hidden).toBe(false);
        expect(document.getElementById('pgm').hidden).toBe(true);
        sel('registry').click();
        expect(document.getElementById('graphfeed').hidden).toBe(false);
        expect(document.getElementById('nosignal').hidden).toBe(true);
        sel('os').click();
        expect(document.getElementById('still').hidden).toBe(false);
        expect(document.getElementById('graphfeed').hidden).toBe(true);
    });

    it('replays the agent log from the activity file, with its age', async () => {
        sel('agent').click();
        await new Promise((r) => setTimeout(r, 0));
        const feed = document.getElementById('logfeed');
        expect(feed.hidden).toBe(false);
        expect(feed.textContent).toContain('daily-brief');
        expect(feed.textContent).toContain('4 of 8 watched jobs wrote a log in 36 h');
    });

    it('plays the filmed run once the feed file confirms it, dated from that file', async () => {
        document.documentElement.innerHTML = html.replace(/^[\s\S]*?<html[^>]*>/, '').replace(/<\/html>\s*$/, '');
        const at = new Date().toISOString();
        globalThis.fetch = vi.fn((url) => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(String(url).includes('agent-feed')
                ? { recordedAt: at, exitCode: 0 }
                : { generatedAt: at, windowHours: 36, ranInWindow: 4, jobsWatched: 8, events: [] }),
        }));
        api = initMonitor(document, window);
        await new Promise((r) => setTimeout(r, 0));
        document.getElementById('src-agent').click();
        expect(document.getElementById('pgm').getAttribute('src')).toContain('feed-agent.mp4');
        expect(document.getElementById('logfeed').hidden).toBe(true);
        expect(document.getElementById('hudRec').textContent).toBe(`REC ${hudDate(at)}`);
        expect(document.querySelector('[data-activity-line]').textContent).toBe('4 OF 8 WATCHED JOBS WROTE A LOG IN 36 H');
    });

    it('keeps the clip\'s HUD when a deep link opens on the agent before the feed file lands', async () => {
        document.documentElement.innerHTML = html.replace(/^[\s\S]*?<html[^>]*>/, '').replace(/<\/html>\s*$/, '');
        // replaceState, not location.hash: a hashchange would also drive the
        // monitors earlier tests left on this window.
        window.history.replaceState(null, '', '#agent');
        const at = new Date().toISOString();
        globalThis.fetch = vi.fn((url) => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(String(url).includes('agent-feed')
                ? { recordedAt: at, exitCode: 0 }
                : { generatedAt: at, windowHours: 36, ranInWindow: 4, jobsWatched: 8, events: [{ time: '06:47', id: 'daily-brief', label: 'x' }] }),
        }));
        api = initMonitor(document, window);
        for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0));
        expect(api.current).toBe('agent');
        expect(document.getElementById('hudRec').textContent).toBe(`REC ${hudDate(at)}`);
        expect(document.getElementById('logfeed').hidden).toBe(true);
        window.history.replaceState(null, '', window.location.pathname);
    });

    it('moves along the switcher with the arrow keys and cuts as it goes', () => {
        sel('fcp').focus();
        sel('fcp').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(api.current).toBe('second');
        expect(document.activeElement).toBe(sel('second'));
        sel('second').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        expect(api.current).toBe('registry');
    });

    it('holds and releases the program feed from the screen', () => {
        const hold = document.getElementById('hold');
        hold.click();
        expect(hold.getAttribute('aria-pressed')).toBe('true');
        expect(document.getElementById('bezelPgm').textContent).toBe('◼ HOLD');
        hold.click();
        expect(hold.getAttribute('aria-pressed')).toBe('false');
    });

    it('shows one view at a time and marks its tab', () => {
        window.location.hash = '#call';
        api.route();
        expect(document.getElementById('call').hidden).toBe(false);
        expect(document.getElementById('monitor').hidden).toBe(true);
        expect(document.querySelector('.tabs a[href="#call"]').getAttribute('aria-current')).toBe('page');
        expect(document.querySelectorAll('.tabs a[aria-current]').length).toBe(1);
    });
});
