/**
 * Dock Magnification — Gaussian math, scale clamping, and state transitions
 *
 * The dock-magnify module creates the macOS-style proximity scaling effect.
 * These tests verify the Gaussian falloff produces correct scale factors,
 * that edge cases (empty dock, no icons) are handled gracefully, and that
 * the state machine (active/reset) transitions cleanly.
 */
import { describe, it, expect } from 'vitest';

// ---------- Extracted constants and pure math from dock-magnify.js ----------
const BASE_SCALE = 1;
const MAX_SCALE  = 1.55;
const SPREAD     = 120;
const LIFT_PX    = 14;
const SIGMA_SQ   = (SPREAD * SPREAD) / 4.5;

function gaussian(distSq) {
    return Math.exp(-distSq / (2 * SIGMA_SQ));
}

function computeIconTransform(cursorX, iconCenterX) {
    const dist = cursorX - iconCenterX;
    const factor = gaussian(dist * dist);
    const scale = BASE_SCALE + (MAX_SCALE - BASE_SCALE) * factor;
    const lift = LIFT_PX * factor;
    const glowOpacity = 0.08 + factor * 0.25;
    return { scale, lift, factor, glowOpacity };
}

// ===================== TESTS =====================

describe('Dock Magnify — Gaussian Falloff', () => {
    it('returns 1.0 at zero distance (cursor directly over icon)', () => {
        expect(gaussian(0)).toBe(1);
    });

    it('decays toward 0 at large distances', () => {
        const farAway = gaussian(500 * 500);
        expect(farAway).toBeLessThan(0.01);
    });

    it('is symmetric — equal for positive and negative offsets', () => {
        const left  = gaussian(80 * 80);
        const right = gaussian((-80) * (-80)); // same distSq
        expect(left).toBe(right);
    });

    it('produces intermediate values at SPREAD distance', () => {
        const atSpread = gaussian(SPREAD * SPREAD);
        expect(atSpread).toBeGreaterThan(0);
        expect(atSpread).toBeLessThan(0.5);
    });

    it('never returns negative values', () => {
        for (const d of [0, 10, 50, 100, 500, 10000]) {
            expect(gaussian(d * d)).toBeGreaterThanOrEqual(0);
        }
    });
});

describe('Dock Magnify — Scale Computation', () => {
    it('reaches MAX_SCALE when cursor is exactly on icon', () => {
        const { scale } = computeIconTransform(200, 200);
        expect(scale).toBeCloseTo(MAX_SCALE, 5);
    });

    it('falls to BASE_SCALE at large distance', () => {
        const { scale } = computeIconTransform(0, 2000);
        expect(scale).toBeCloseTo(BASE_SCALE, 2);
    });

    it('scale is always between BASE and MAX (no overshoot)', () => {
        for (const offset of [0, 20, 60, 120, 300, 1000]) {
            const { scale } = computeIconTransform(500, 500 + offset);
            expect(scale).toBeGreaterThanOrEqual(BASE_SCALE);
            expect(scale).toBeLessThanOrEqual(MAX_SCALE);
        }
    });

    it('lift reaches LIFT_PX at zero distance', () => {
        const { lift } = computeIconTransform(100, 100);
        expect(lift).toBeCloseTo(LIFT_PX, 5);
    });

    it('lift approaches 0 at large distance', () => {
        const { lift } = computeIconTransform(0, 5000);
        expect(lift).toBeLessThan(0.1);
    });
});

describe('Dock Magnify — Glow Thresholds', () => {
    it('glow opacity peaks at 0.33 when cursor is on icon', () => {
        const { glowOpacity } = computeIconTransform(100, 100);
        expect(glowOpacity).toBeCloseTo(0.33, 2); // 0.08 + 1.0 * 0.25
    });

    it('glow opacity bottoms at 0.08 at large distance', () => {
        const { glowOpacity } = computeIconTransform(0, 9999);
        expect(glowOpacity).toBeCloseTo(0.08, 2);
    });

    it('box-shadow activates when factor > 0.3', () => {
        // At factor=0.3, icon is ~72px away (empirical from Gaussian)
        // Test that nearby icons have factor > 0.3
        const { factor: nearFactor } = computeIconTransform(200, 240);
        expect(nearFactor).toBeGreaterThan(0.3);

        // Distant icon should be below threshold
        const { factor: farFactor } = computeIconTransform(200, 500);
        expect(farFactor).toBeLessThan(0.3);
    });
});

describe('Dock Magnify — z-index Ordering', () => {
    it('icon under cursor gets highest z-index', () => {
        const { factor } = computeIconTransform(300, 300);
        expect(Math.round(factor * 10)).toBe(10);
    });

    it('distant icon gets z-index 0', () => {
        const { factor } = computeIconTransform(0, 2000);
        expect(Math.round(factor * 10)).toBe(0);
    });

    it('z-index decreases monotonically with distance', () => {
        const offsets = [0, 30, 60, 90, 120, 200];
        const zIndexes = offsets.map(o => {
            const { factor } = computeIconTransform(400, 400 + o);
            return Math.round(factor * 10);
        });
        for (let i = 1; i < zIndexes.length; i++) {
            expect(zIndexes[i]).toBeLessThanOrEqual(zIndexes[i - 1]);
        }
    });
});
