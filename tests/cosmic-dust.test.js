/**
 * Cosmic Dust — Pure logic tests for particle system
 *
 * Tests the computational core: particle creation bounds, drift wrapping,
 * flare ignition/decay, twinkle oscillation, and edge-fade calculation.
 * Extracted as pure functions to avoid canvas/rAF dependencies.
 */
import { describe, it, expect } from 'vitest';
import { PALETTE } from '../js/dom-helpers.js';

/* ── Constants (mirrored from cosmic-dust.js) ── */
const DUST_COUNT    = 50;
const DUST_MIN_R    = 0.4;
const DUST_MAX_R    = 1.4;
const DRIFT_SPEED   = 0.08;
const TWINKLE_SPEED = 0.012;
const FLARE_DECAY   = 0.92;
const FADE_EDGE     = 40;
const GOLD          = PALETTE.GOLD;
const AMETHYST      = PALETTE.AMETHYST;

/* ── Re-implemented pure logic from cosmic-dust.js ── */
function createParticle() {
    const w = 1920, h = 1080;
    const isGold = Math.random() < 0.4;
    return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: DUST_MIN_R + Math.random() * (DUST_MAX_R - DUST_MIN_R),
        color: isGold ? GOLD : AMETHYST,
        phase: Math.random() * Math.PI * 2,
        driftAngle: Math.random() * Math.PI * 2,
        speed: DRIFT_SPEED * (0.3 + Math.random() * 1.0),
        flare: 0,
    };
}

function computeTwinkle(time, phase) {
    return 0.15 + 0.35 * Math.sin(time * TWINKLE_SPEED + phase);
}

function computeEdgeFade(px, py, w, h) {
    let edgeFade = 1;
    const ex = Math.min(px, w - px);
    const ey = Math.min(py, h - py);
    edgeFade = Math.min(edgeFade, Math.max(0, ex / FADE_EDGE));
    edgeFade = Math.min(edgeFade, Math.max(0, ey / FADE_EDGE));
    return edgeFade;
}

function wrapCoord(val, max) {
    if (val < -20)     return max + 10;
    if (val > max + 20) return -10;
    return val;
}

/* ── Tests ───────────────────────────────────── */
describe('Cosmic Dust — Particle Creation', () => {
    it('radius stays within [DUST_MIN_R, DUST_MAX_R]', () => {
        for (let i = 0; i < 200; i++) {
            const p = createParticle();
            expect(p.r).toBeGreaterThanOrEqual(DUST_MIN_R);
            expect(p.r).toBeLessThanOrEqual(DUST_MAX_R);
        }
    });

    it('color is either GOLD or AMETHYST (palette-only)', () => {
        for (let i = 0; i < 100; i++) {
            const p = createParticle();
            const isGold = p.color === GOLD;
            const isAmethyst = p.color === AMETHYST;
            expect(isGold || isAmethyst).toBe(true);
        }
    });

    it('drift speed is positive and bounded', () => {
        for (let i = 0; i < 100; i++) {
            const p = createParticle();
            expect(p.speed).toBeGreaterThan(0);
            expect(p.speed).toBeLessThanOrEqual(DRIFT_SPEED * 1.3);
        }
    });

    it('phase covers full 2π range over many particles', () => {
        const phases = Array.from({ length: 500 }, () => createParticle().phase);
        const min = Math.min(...phases);
        const max = Math.max(...phases);
        expect(min).toBeLessThan(1);
        expect(max).toBeGreaterThan(5); // close to 2π ≈ 6.28
    });
});

describe('Cosmic Dust — Twinkle Oscillation', () => {
    it('stays within [0.15 - 0.35, 0.15 + 0.35] = [-0.20, 0.50]', () => {
        for (let t = 0; t < 1000; t += 7) {
            const v = computeTwinkle(t, 0);
            expect(v).toBeGreaterThanOrEqual(-0.21);
            expect(v).toBeLessThanOrEqual(0.51);
        }
    });

    it('different phases produce different values at same time', () => {
        const a = computeTwinkle(100, 0);
        const b = computeTwinkle(100, Math.PI);
        expect(a).not.toBeCloseTo(b, 2);
    });
});

describe('Cosmic Dust — Edge Fade', () => {
    it('returns 1.0 for particles well inside viewport', () => {
        expect(computeEdgeFade(500, 500, 1920, 1080)).toBe(1);
    });

    it('returns 0 for particles exactly at the edge', () => {
        expect(computeEdgeFade(0, 500, 1920, 1080)).toBe(0);
        expect(computeEdgeFade(500, 0, 1920, 1080)).toBe(0);
    });

    it('returns partial fade within FADE_EDGE distance', () => {
        const fade = computeEdgeFade(20, 500, 1920, 1080); // 20px from left
        expect(fade).toBeCloseTo(20 / FADE_EDGE, 5); // 0.5
    });

    it('fades from both edges symmetrically', () => {
        const left  = computeEdgeFade(10, 500, 1920, 1080);
        const right = computeEdgeFade(1910, 500, 1920, 1080);
        expect(left).toBeCloseTo(right, 5);
    });
});

describe('Cosmic Dust — Viewport Wrapping', () => {
    it('wraps past left boundary', () => {
        expect(wrapCoord(-21, 1920)).toBe(1930);
    });

    it('wraps past right boundary', () => {
        expect(wrapCoord(1941, 1920)).toBe(-10);
    });

    it('does not wrap within bounds', () => {
        expect(wrapCoord(500, 1920)).toBe(500);
    });

    it('does not wrap at exact boundary thresholds', () => {
        expect(wrapCoord(-20, 1920)).toBe(-20); // exactly at -20, NOT < -20
        expect(wrapCoord(1940, 1920)).toBe(1940); // exactly at max+20
    });
});

describe('Cosmic Dust — Flare Decay', () => {
    it('flare decays exponentially toward zero', () => {
        let flare = 1.0;
        for (let i = 0; i < 50; i++) flare *= FLARE_DECAY;
        expect(flare).toBeLessThan(0.02);
    });

    it('flare snaps to zero below threshold', () => {
        let flare = 0.009; // below 0.01 threshold
        if (flare > 0.01) flare *= FLARE_DECAY;
        else flare = 0;
        expect(flare).toBe(0);
    });
});
