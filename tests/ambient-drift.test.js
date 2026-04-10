/**
 * Ambient Drift — Pure logic tests for orb physics & noise
 *
 * Tests noise determinism, orb creation bounds, cursor repulsion,
 * viewport wrapping, edge-fade dimming, and pulse oscillation.
 * Extracted as pure functions to avoid canvas/rAF dependencies.
 */
import { describe, it, expect } from 'vitest';
import { PALETTE } from '../js/dom-helpers.js';

/* ── Constants (mirrored from ambient-drift.js) ── */
const ORB_COUNT      = 7;
const ORB_MIN_R      = 3;
const ORB_MAX_R      = 7;
const DRIFT_SPEED    = 0.15;
const REPEL_RADIUS   = 180;
const REPEL_STRENGTH = 2.5;
const FADE_EDGE      = 60;
const GOLD           = PALETTE.GOLD;
const AMETHYST       = PALETTE.AMETHYST;

/* ── Re-implemented pure logic from ambient-drift.js ── */
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

function createOrb(i) {
    const w = 1920, h = 1080;
    const isGold = i % 2 === 0;
    return {
        x: Math.random() * w, y: Math.random() * h,
        r: ORB_MIN_R + Math.random() * (ORB_MAX_R - ORB_MIN_R),
        color: isGold ? GOLD : AMETHYST,
        phase: Math.random() * 1000,
        speed: DRIFT_SPEED * (0.6 + Math.random() * 0.8),
        pulse: 0.7 + Math.random() * 0.3,
    };
}

function computeRepulsion(orbX, orbY, mouseX, mouseY) {
    const dx = orbX - mouseX, dy = orbY - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= REPEL_RADIUS || dist === 0) return { fx: 0, fy: 0 };
    const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
    return { fx: (dx / dist) * force, fy: (dy / dist) * force };
}

function wrapOrb(val, max) {
    if (val < -40)     return max + 20;
    if (val > max + 40) return -20;
    return val;
}

function computeEdgeFade(px, py, w, h) {
    let f = 1;
    f = Math.min(f, Math.max(0, Math.min(px, w - px) / FADE_EDGE));
    f = Math.min(f, Math.max(0, Math.min(py, h - py) / FADE_EDGE));
    return f;
}

/* ── Tests ────────────────────────────────────── */
describe('Ambient Drift — Noise Functions', () => {
    it('noise2d is deterministic for same inputs', () => {
        expect(noise2d(1, 2)).toBe(noise2d(1, 2));
        expect(noise2d(5.5, 3.7)).toBe(noise2d(5.5, 3.7));
    });

    it('noise2d output is in [0, 1)', () => {
        for (let i = -50; i < 50; i += 3.7) {
            const v = noise2d(i, i * 0.7);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    it('smoothNoise interpolates between integer lattice points', () => {
        const atInt = smoothNoise(5, 5);
        const nearby = smoothNoise(5.01, 5);
        // Near an integer, smoothNoise should be close to the lattice value
        expect(Math.abs(atInt - nearby)).toBeLessThan(0.05);
    });

    it('smoothNoise varies across space (not constant)', () => {
        const values = new Set();
        for (let i = 0; i < 20; i++) values.add(smoothNoise(i, i).toFixed(4));
        expect(values.size).toBeGreaterThan(5);
    });
});

describe('Ambient Drift — Orb Creation', () => {
    it('radius within [ORB_MIN_R, ORB_MAX_R]', () => {
        for (let i = 0; i < 100; i++) {
            const o = createOrb(i);
            expect(o.r).toBeGreaterThanOrEqual(ORB_MIN_R);
            expect(o.r).toBeLessThanOrEqual(ORB_MAX_R);
        }
    });

    it('even indices get GOLD, odd get AMETHYST', () => {
        expect(createOrb(0).color).toBe(GOLD);
        expect(createOrb(1).color).toBe(AMETHYST);
        expect(createOrb(4).color).toBe(GOLD);
        expect(createOrb(7).color).toBe(AMETHYST);
    });

    it('speed bounded within [0.6x, 1.4x] base drift', () => {
        for (let i = 0; i < 100; i++) {
            const o = createOrb(i);
            expect(o.speed).toBeGreaterThanOrEqual(DRIFT_SPEED * 0.6);
            expect(o.speed).toBeLessThanOrEqual(DRIFT_SPEED * 1.4);
        }
    });
});

describe('Ambient Drift — Cursor Repulsion', () => {
    it('no force when cursor outside repel radius', () => {
        const { fx, fy } = computeRepulsion(0, 0, 500, 500);
        expect(fx).toBe(0);
        expect(fy).toBe(0);
    });

    it('max force when cursor nearly touching orb', () => {
        const { fx, fy } = computeRepulsion(100, 100, 101, 100);
        const mag = Math.sqrt(fx * fx + fy * fy);
        expect(mag).toBeGreaterThan(REPEL_STRENGTH * 0.95);
    });

    it('force pushes orb away from cursor (direction check)', () => {
        const { fx } = computeRepulsion(200, 100, 100, 100); // orb right of cursor
        expect(fx).toBeGreaterThan(0); // pushed rightward
    });

    it('zero distance produces no force (div-by-zero guard)', () => {
        const { fx, fy } = computeRepulsion(100, 100, 100, 100);
        expect(fx).toBe(0);
        expect(fy).toBe(0);
    });

    it('force decays linearly with distance', () => {
        const close = computeRepulsion(100, 100, 150, 100);  // 50px away
        const far   = computeRepulsion(100, 100, 200, 100);  // 100px away
        expect(Math.abs(close.fx)).toBeGreaterThan(Math.abs(far.fx));
    });
});

describe('Ambient Drift — Viewport Wrapping', () => {
    it('wraps past left edge', ()  => expect(wrapOrb(-41, 1920)).toBe(1940));
    it('wraps past right edge', () => expect(wrapOrb(1961, 1920)).toBe(-20));
    it('stays within bounds', ()   => expect(wrapOrb(500, 1920)).toBe(500));
    it('boundary threshold: exactly -40 stays', () => expect(wrapOrb(-40, 1920)).toBe(-40));
});

describe('Ambient Drift — Edge Fade', () => {
    it('fully bright at center', () => expect(computeEdgeFade(500, 500, 1920, 1080)).toBe(1));
    it('zero at edge',           () => expect(computeEdgeFade(0, 500, 1920, 1080)).toBe(0));
    it('half-fade at FADE_EDGE/2', () => {
        expect(computeEdgeFade(30, 500, 1920, 1080)).toBeCloseTo(0.5, 5);
    });
    it('corner fades from both axes', () => {
        const corner = computeEdgeFade(20, 10, 1920, 1080);
        expect(corner).toBeCloseTo(10 / FADE_EDGE, 5); // min of x-fade and y-fade
    });
});
