// Gate 08 (Bodies In Boxes): the cycler bails silently if templates and tabs
// differ, and every bib figure the markup reads must exist in figures.json.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const figs = JSON.parse(readFileSync(resolve(root, 'public/data/figures.json'), 'utf8'));

describe('Bodies In Boxes gate', () => {
    it('has one tab per template', () => {
        expect(html.match(/<template data-gate/g).length).toBe(html.match(/data-gate-tab/g).length);
    });
    it('reads only figures that figures.json generates, and stamps the read time', () => {
        const keys = [...new Set([...html.matchAll(/data-fig="(bib\w+)"/g)].map((m) => m[1]))];
        expect(keys.length).toBeGreaterThan(5);
        for (const k of keys) expect(figs.figures[k], k).toBeDefined();
        expect(Number.isFinite(Date.parse(figs.figures.bibReadAt))).toBe(true);
        expect(html).toContain('data-fig="bibAsOf"');
    });
    it('types no audience count into the markup', () => {
        const tpl = html.slice(html.indexOf('<template data-gate="bodies-in-boxes">'));
        const body = tpl.slice(0, tpl.indexOf('</template>'));
        expect(body).not.toMatch(/\b\d{1,3},\d{3}\b/);
    });
});
