import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/* Gate panels are cloned from <template> long after system-figures.js runs its
 * one-shot pass over `document`. Twice now a fix for this shipped and did
 * nothing:
 *   - originally the clones were never observed at all, so their figures got a
 *     title and no focus, no readout, and were unreachable on touch;
 *   - then the observer was added but matched `[data-fig][data-explained]`,
 *     while `data-explained` is stamped by apply() AFTER insertion — so at the
 *     moment a clone lands it carries only `data-fig` and still never matched.
 *
 * Both times the figures VISIBLY FILLED, which is what made the miss survive a
 * manual check. This test asserts the thing filling does not prove: that a
 * figure inserted after load is actually wired.
 */

const SNAP = {
    generatedAt: '2026-08-31T00:00:00.000Z',
    figures: { directedFilms: 101 },
    manual: { directedArtists: { value: 54, asOf: '2026-08-24', note: 'counted by hand' } },
    definitions: { directedFilms: 'films directed' },
};

async function boot() {
    document.body.innerHTML = `
        <div class="panel-def" data-fig-readout>hover a figure to see how it is counted</div>
        <span data-fig="directedFilms">—</span>
        <div id="gate-cycler"></div>`;
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(SNAP) }));
    vi.resetModules();
    await import('../js/system-figures.js');
    for (let i = 0; i < 5; i++) await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
}

describe('figures inserted after load', () => {
    beforeEach(() => { document.body.innerHTML = ''; });
    afterEach(() => { vi.restoreAllMocks(); });

    it('wires a figure that lands after the one-shot pass', async () => {
        await boot();
        const cycler = document.getElementById('gate-cycler');
        const span = document.createElement('span');
        span.dataset.fig = 'directedArtists';
        span.textContent = '—';
        cycler.appendChild(span);
        // Let the MutationObserver microtask run.
        await new Promise((r) => setTimeout(r, 0));
        expect(span.dataset.readoutWired).toBe('1');
    });

    it('gives a late figure a tab stop when it is not inside a link', async () => {
        await boot();
        const span = document.createElement('span');
        span.dataset.fig = 'directedFilms';
        document.getElementById('gate-cycler').appendChild(span);
        await new Promise((r) => setTimeout(r, 0));
        expect(span.tabIndex).toBe(0);
    });

    it('does NOT give a tab stop to a figure inside a link', async () => {
        await boot();
        const a = document.createElement('a');
        a.href = 'https://example.com';
        const span = document.createElement('span');
        span.dataset.fig = 'directedFilms';
        a.appendChild(span);
        document.getElementById('gate-cycler').appendChild(a);
        await new Promise((r) => setTimeout(r, 0));
        expect(span.dataset.readoutWired).toBe('1');
        expect(span.tabIndex).toBe(-1);
    });
});
