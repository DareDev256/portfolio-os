/**
 * Neural Link — Pure logic tests for neighbor-finding algorithm
 *
 * Tests distance calculation, nearest-neighbor sorting, MAX_DISTANCE
 * filtering, MAX_LINKS capping, and deduplication edge cases.
 */
import { describe, it, expect } from 'vitest';

const MAX_LINKS    = 3;
const MAX_DISTANCE = 400;

/* ── Re-implemented pure logic from neural-link.js ── */
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function findNeighbors(origin, allIcons, selfIndex) {
    return allIcons
        .filter((_, i) => i !== selfIndex)
        .map(ic => ({ pt: ic, d: dist(origin, ic) }))
        .filter(n => n.d < MAX_DISTANCE)
        .sort((a, b) => a.d - b.d)
        .slice(0, MAX_LINKS);
}

/* ── Tests ────────────────────────────────────── */
describe('Neural Link — Distance', () => {
    it('zero for same point', () => expect(dist({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0));
    it('correct for 3-4-5 triangle', () => expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5));
    it('symmetric', () => {
        const a = { x: 10, y: 20 }, b = { x: 50, y: 80 };
        expect(dist(a, b)).toBe(dist(b, a));
    });
});

describe('Neural Link — Neighbor Finding', () => {
    const icons = [
        { x: 100, y: 100 }, // 0: origin
        { x: 150, y: 100 }, // 1: 50px
        { x: 200, y: 100 }, // 2: 100px
        { x: 300, y: 100 }, // 3: 200px
        { x: 500, y: 100 }, // 4: 400px — exactly at MAX_DISTANCE (excluded)
        { x: 900, y: 100 }, // 5: 800px — far beyond
        { x: 120, y: 100 }, // 6: 20px — closest
    ];
    const origin = icons[0];

    it('excludes self from results', () => {
        const result = findNeighbors(origin, icons, 0);
        expect(result.every(n => n.pt !== origin)).toBe(true);
    });

    it('returns at most MAX_LINKS neighbors', () => {
        const result = findNeighbors(origin, icons, 0);
        expect(result.length).toBeLessThanOrEqual(MAX_LINKS);
    });

    it('sorts by ascending distance', () => {
        const result = findNeighbors(origin, icons, 0);
        for (let i = 1; i < result.length; i++) {
            expect(result[i].d).toBeGreaterThanOrEqual(result[i - 1].d);
        }
    });

    it('excludes icons at exactly MAX_DISTANCE (strict <)', () => {
        const result = findNeighbors(origin, icons, 0);
        expect(result.every(n => n.d < MAX_DISTANCE)).toBe(true);
    });

    it('picks the 3 closest: 20px, 50px, 100px', () => {
        const result = findNeighbors(origin, icons, 0);
        expect(result.map(n => n.d)).toEqual([20, 50, 100]);
    });

    it('returns empty when all icons beyond MAX_DISTANCE', () => {
        const far = [{ x: 0, y: 0 }, { x: 9999, y: 9999 }];
        expect(findNeighbors(far[0], far, 0)).toEqual([]);
    });

    it('handles single icon (no neighbors)', () => {
        expect(findNeighbors({ x: 0, y: 0 }, [{ x: 0, y: 0 }], 0)).toEqual([]);
    });

    it('handles two icons (one neighbor)', () => {
        const pair = [{ x: 0, y: 0 }, { x: 50, y: 0 }];
        const result = findNeighbors(pair[0], pair, 0);
        expect(result).toHaveLength(1);
        expect(result[0].d).toBe(50);
    });
});
