// Source 08 (Bodies In Boxes): every bib figure the take reads must exist in
// figures.json, the read time is stamped beside them, and no audience count is
// typed into the markup. Since 4.62.0 the case studies are switcher takes on the
// homepage monitor rather than <template> gates, so the take is the unit here.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const figs = JSON.parse(readFileSync(resolve(root, 'public/data/figures.json'), 'utf8'));

/* The markup of one take: from its opening tag to the next take (or the end of
 * the slate). Takes are siblings, so the next `class="take` bounds this one. */
function takeHtml(id) {
    const start = html.indexOf(`id="take-${id}"`);
    if (start === -1) return '';
    const next = html.indexOf('class="take', start + 1);
    return html.slice(start, next === -1 ? html.length : next);
}

describe('Bodies In Boxes take', () => {
    it('has one take per switcher source, and each source names its own take', () => {
        const sources = [...html.matchAll(/data-src="([\w-]+)"/g)].map((m) => m[1]);
        const takes = [...html.matchAll(/class="take[^"]*" id="take-([\w-]+)"/g)].map((m) => m[1]);
        expect(sources.length).toBeGreaterThan(10);
        expect(takes).toEqual(sources);
        for (const s of sources) expect(html, s).toContain(`aria-controls="take-${s}"`);
    });

    it('reads only figures that figures.json generates, and stamps the read time', () => {
        const body = takeHtml('bib');
        const keys = [...new Set([...body.matchAll(/data-fig="(bib\w+)"/g)].map((m) => m[1]))];
        expect(keys.length).toBeGreaterThan(5);
        for (const k of keys) expect(figs.figures[k], k).toBeDefined();
        expect(Number.isFinite(Date.parse(figs.figures.bibReadAt))).toBe(true);
        expect(body).toContain('data-fig="bibAsOf"');
    });

    it('types no audience count into the markup', () => {
        const body = takeHtml('bib');
        expect(body.length).toBeGreaterThan(200);
        expect(body).not.toMatch(/\b\d{1,3},\d{3}\b/);
    });
});
