/**
 * Desktop Visual Effects — Pure Logic Tests
 *
 * Tests the computational cores of the 5 recently added features
 * (v3.59–v3.63): spectral-echo, cipher-decode, neural-link,
 * pulse-grid, and ambient-drift.
 *
 * Strategy: extract and verify pure math/logic without rAF or canvas.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    hexAlpha,
    createDecorativeEl,
    getElementCenter,
    shouldSkipDesktopEffects,
    createPointerTracker,
    PALETTE,
} from '../js/dom-helpers.js';

/* ── Re-implemented pure logic from effect modules ── */

// From pulse-grid.js
function lerp(a, b, t) { return a + (b - a) * t; }
const GOLD = PALETTE.GOLD;
const AMETHYST = PALETTE.AMETHYST;
function colorAt(t) {
    return {
        r: lerp(GOLD.r, AMETHYST.r, t),
        g: lerp(GOLD.g, AMETHYST.g, t),
        b: lerp(GOLD.b, AMETHYST.b, t),
    };
}

// From neural-link.js
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
const MAX_LINKS = 3;
const MAX_DISTANCE = 400;
function findNeighbors(origin, allIcons, currentIcon) {
    return allIcons
        .filter(ic => ic !== currentIcon)
        .map(ic => ({ el: ic, pt: ic.center, d: dist(origin, ic.center) }))
        .filter(n => n.d < MAX_DISTANCE)
        .sort((a, b) => a.d - b.d)
        .slice(0, MAX_LINKS);
}

// From ambient-drift.js — pseudo-noise
function noise2d(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
}
function smoothNoise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = noise2d(ix, iy), b = noise2d(ix + 1, iy);
    const c = noise2d(ix, iy + 1), d = noise2d(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// ===================== TESTS =====================

describe('PALETTE — shared color constants', () => {
    it('defines gold and amethyst RGB values', () => {
        expect(PALETTE.GOLD).toEqual({ r: 212, g: 175, b: 55 });
        expect(PALETTE.AMETHYST).toEqual({ r: 139, g: 92, b: 246 });
    });
});

describe('hexAlpha() — opacity to hex conversion', () => {
    it('converts 1.0 to "ff"', () => expect(hexAlpha(1)).toBe('ff'));
    it('converts 0 to "00"', () => expect(hexAlpha(0)).toBe('00'));
    it('converts 0.5 to ~"7f" or "80"', () => {
        const result = parseInt(hexAlpha(0.5), 16);
        expect(result).toBeGreaterThanOrEqual(127);
        expect(result).toBeLessThanOrEqual(128);
    });
    it('clamps values above 1', () => expect(hexAlpha(2.5)).toBe('ff'));
    it('clamps negative values to "00"', () => expect(hexAlpha(-0.5)).toBe('00'));
    it('always returns 2-char string', () => {
        expect(hexAlpha(0.01)).toHaveLength(2);
        expect(hexAlpha(0)).toHaveLength(2);
    });
});

describe('createDecorativeEl()', () => {
    it('creates element with aria-hidden', () => {
        const el = createDecorativeEl('div', 'spectral-echo');
        expect(el.tagName).toBe('DIV');
        expect(el.className).toBe('spectral-echo');
        expect(el.getAttribute('aria-hidden')).toBe('true');
    });

    it('creates SVG elements with namespace', () => {
        const svg = createDecorativeEl('svg', 'neural-link-layer', 'http://www.w3.org/2000/svg');
        expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    it('handles no className', () => {
        const el = createDecorativeEl('span');
        expect(el.tagName).toBe('SPAN');
        expect(el.className).toBe('');
    });
});

describe('getElementCenter()', () => {
    it('computes center from bounding rect', () => {
        const el = document.createElement('div');
        vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
            left: 100, top: 200, width: 60, height: 40,
            right: 160, bottom: 240, x: 100, y: 200, toJSON() {},
        });
        expect(getElementCenter(el)).toEqual({ x: 130, y: 220 });
    });

    it('handles zero-size elements', () => {
        const el = document.createElement('div');
        vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
            left: 50, top: 50, width: 0, height: 0,
            right: 50, bottom: 50, x: 50, y: 50, toJSON() {},
        });
        expect(getElementCenter(el)).toEqual({ x: 50, y: 50 });
    });
});

describe('shouldSkipDesktopEffects()', () => {
    const original = window.matchMedia;
    afterEach(() => { window.matchMedia = original; });

    it('returns true when prefers-reduced-motion is set', () => {
        window.matchMedia = (q) => ({
            matches: q.includes('reduced-motion'),
            media: q, addEventListener() {}, removeEventListener() {},
        });
        expect(shouldSkipDesktopEffects()).toBe(true);
    });

    it('returns true for coarse pointer (touch devices)', () => {
        window.matchMedia = (q) => ({
            matches: q.includes('coarse'),
            media: q, addEventListener() {}, removeEventListener() {},
        });
        expect(shouldSkipDesktopEffects()).toBe(true);
    });

    it('returns false for desktop with fine pointer and motion OK', () => {
        window.matchMedia = () => ({
            matches: false, media: '', addEventListener() {}, removeEventListener() {},
        });
        expect(shouldSkipDesktopEffects()).toBe(false);
    });
});

describe('createPointerTracker()', () => {
    it('initializes mouse at off-screen position', () => {
        const tracker = createPointerTracker();
        expect(tracker.mouse.x).toBe(-9999);
        expect(tracker.mouse.y).toBe(-9999);
        tracker.destroy();
    });

    it('updates position on pointermove', () => {
        const tracker = createPointerTracker();
        document.dispatchEvent(new MouseEvent('pointermove', { clientX: 200, clientY: 300 }));
        expect(tracker.mouse.x).toBe(200);
        expect(tracker.mouse.y).toBe(300);
        tracker.destroy();
    });

    it('resets on pointerleave', () => {
        const tracker = createPointerTracker();
        document.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, clientY: 100 }));
        document.dispatchEvent(new Event('pointerleave'));
        expect(tracker.mouse.x).toBe(-9999);
        tracker.destroy();
    });

    it('stops listening after destroy', () => {
        const tracker = createPointerTracker();
        tracker.destroy();
        document.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: 500 }));
        expect(tracker.mouse.x).toBe(-9999);
    });
});

describe('PulseGrid — lerp & colorAt', () => {
    it('lerp(0, 10, 0.5) = 5', () => expect(lerp(0, 10, 0.5)).toBe(5));
    it('lerp returns exact endpoints', () => {
        expect(lerp(3, 7, 0)).toBe(3);
        expect(lerp(3, 7, 1)).toBe(7);
    });

    it('colorAt(0) returns pure gold', () => {
        const c = colorAt(0);
        expect(c.r).toBe(GOLD.r);
        expect(c.g).toBe(GOLD.g);
        expect(c.b).toBe(GOLD.b);
    });

    it('colorAt(1) returns pure amethyst', () => {
        const c = colorAt(1);
        expect(c.r).toBe(AMETHYST.r);
        expect(c.g).toBe(AMETHYST.g);
        expect(c.b).toBe(AMETHYST.b);
    });
});

describe('NeuralLink — distance & neighbor selection', () => {
    it('computes euclidean distance correctly', () => {
        expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
        expect(dist({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
    });

    it('limits neighbors to MAX_LINKS (3)', () => {
        const origin = { x: 0, y: 0 };
        const icons = Array.from({ length: 6 }, (_, i) => ({
            id: i, center: { x: (i + 1) * 50, y: 0 },
        }));
        const result = findNeighbors(origin, icons, null);
        expect(result).toHaveLength(3);
    });

    it('excludes icons beyond MAX_DISTANCE', () => {
        const origin = { x: 0, y: 0 };
        const icons = [
            { id: 'near', center: { x: 100, y: 0 } },
            { id: 'far', center: { x: 500, y: 0 } },
        ];
        const result = findNeighbors(origin, icons, null);
        expect(result).toHaveLength(1);
        expect(result[0].el.id).toBe('near');
    });

    it('returns neighbors sorted by distance (nearest first)', () => {
        const origin = { x: 0, y: 0 };
        const icons = [
            { id: 'c', center: { x: 300, y: 0 } },
            { id: 'a', center: { x: 100, y: 0 } },
            { id: 'b', center: { x: 200, y: 0 } },
        ];
        const result = findNeighbors(origin, icons, null);
        expect(result.map(n => n.el.id)).toEqual(['a', 'b', 'c']);
    });
});

describe('AmbientDrift — pseudo-noise', () => {
    it('noise2d returns values in [0, 1)', () => {
        for (let i = 0; i < 100; i++) {
            const v = noise2d(i * 0.7, i * 1.3);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    it('noise2d is deterministic', () => {
        expect(noise2d(5, 10)).toBe(noise2d(5, 10));
        expect(noise2d(0, 0)).toBe(noise2d(0, 0));
    });

    it('smoothNoise returns values in [0, 1] range', () => {
        for (let i = 0; i < 50; i++) {
            const v = smoothNoise(i * 0.3, i * 0.7);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        }
    });

    it('smoothNoise interpolates smoothly (no discontinuities)', () => {
        const step = 0.01;
        let maxDelta = 0;
        for (let x = 0; x < 5; x += step) {
            const a = smoothNoise(x, 0);
            const b = smoothNoise(x + step, 0);
            maxDelta = Math.max(maxDelta, Math.abs(b - a));
        }
        // Smooth noise should not jump more than ~0.15 per 0.01 step
        expect(maxDelta).toBeLessThan(0.15);
    });
});
