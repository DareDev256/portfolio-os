import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initGateRoster } from '../js/gate-roster.js';

/* A phone reader saw exactly ONE case study: the cycler auto-advances every 9s,
 * which suits a desktop reader and not a thumb that scrolls past in three.
 * The roster is the fix. These pin the two ways it can quietly fail — showing
 * a dash instead of a figure, and listing the gate already open above it. */

function markup() {
    document.body.innerHTML = `
      <section id="gates">
        <div id="gate-cycler">
          <div class="gate-tabs">
            <button data-gate-tab class="gate-tab on"><span class="nm">BetMetrics</span></button>
            <button data-gate-tab class="gate-tab"><span class="nm">fcp-mcp-server</span></button>
            <button data-gate-tab class="gate-tab"><span class="nm">Passion Agent</span></button>
          </div>
          <div class="roster" data-gate-roster hidden></div>
          <div data-gate-stage></div>
          <template data-gate="betmetrics">
            <div class="figs"><div><div class="n">0</div><div class="cap">PAYOUT INCIDENTS</div></div></div>
          </template>
          <template data-gate="fcp">
            <div class="figs"><div><div class="n" data-fig="stars">&#8212;</div><div class="cap">GITHUB STARS</div></div></div>
          </template>
          <template data-gate="passion">
            <div class="figs"><div><div class="n" data-fig="nope">&#8212;</div><div class="cap">MODULES</div></div></div>
          </template>
        </div>
      </section>`;
}

const mq = (matches) => ({ matches, addEventListener() {} });
const rows = () => [...document.querySelectorAll('.roster-btn')];

async function boot(matches = true, figures = { figures: { stars: 95 }, manual: {} }) {
    markup();
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: !!figures, json: () => Promise.resolve(figures) }));
    const repaint = initGateRoster(document, mq(matches));
    for (let i = 0; i < 6; i++) await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    return repaint;
}

describe('gate roster', () => {
    beforeEach(() => { document.body.innerHTML = ''; });
    afterEach(() => { vi.restoreAllMocks(); });

    it('lists every gate EXCEPT the one already open above it', async () => {
        await boot();
        expect(rows().map((b) => b.querySelector('.roster-nm').textContent))
            .toEqual(['fcp-mcp-server', 'Passion Agent']);
    });

    it('resolves a runtime figure instead of shipping the placeholder', async () => {
        // Figures inside a <template> are never rendered, so data-fig spans still
        // hold the em-dash. Reading naively produced "— GITHUB STARS", which
        // reads as broken rather than modest.
        await boot();
        const fcp = rows()[0].querySelector('.roster-fig');
        expect(fcp.textContent).toContain('95');
        expect(fcp.textContent).not.toContain('—');
    });

    it('drops the figure rather than printing a dash when it cannot resolve', async () => {
        await boot();
        // `data-fig="nope"` has no value in figures.json.
        const passion = rows()[1];
        expect(passion.querySelector('.roster-fig')).toBeNull();
        // The NAME still ships — six project names beats one case study.
        expect(passion.querySelector('.roster-nm').textContent).toBe('Passion Agent');
    });

    it('still renders names when figures.json never arrives', async () => {
        await boot(true, null);
        expect(rows()).toHaveLength(2);
        expect(rows()[0].querySelector('.roster-nm').textContent).toBe('fcp-mcp-server');
    });

    it('is mobile only — desktop keeps the cycler it was designed for', async () => {
        await boot(false);
        expect(document.querySelector('[data-gate-roster]').hidden).toBe(true);
        expect(rows()).toHaveLength(0);
    });

    it('drives the real cycler rather than duplicating its render', async () => {
        await boot();
        const tab = document.querySelectorAll('[data-gate-tab]')[1];
        const spy = vi.fn();
        tab.addEventListener('click', spy);
        rows()[0].click();
        expect(spy).toHaveBeenCalled();
    });
});
