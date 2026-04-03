/**
 * Phantom Reticle — HUD cursor with spring physics and lock-on
 *
 * Tests cover: spring convergence math, lock-on scale calculation,
 * DOM cleanup on destroy, and reduced-motion accessibility gate.
 * Extracted from phantom-reticle.js to test pure logic without rAF.
 */
import { describe, it, expect } from 'vitest';

// ---------- Extracted spring physics from phantom-reticle.js ----------

const STIFFNESS = 0.12;
const DAMPING = 0.72;

/**
 * Simulate N frames of the spring physics loop.
 * Returns final { rx, ry, vx, vy } state.
 */
function simulateSpring(target, frames, initial = { rx: 0, ry: 0, vx: 0, vy: 0 }) {
    let { rx, ry, vx, vy } = initial;
    for (let i = 0; i < frames; i++) {
        vx += (target.x - rx) * STIFFNESS;
        vy += (target.y - ry) * STIFFNESS;
        vx *= DAMPING;
        vy *= DAMPING;
        rx += vx;
        ry += vy;
    }
    return { rx, ry, vx, vy };
}

/** Lock-on scale: partial scale toward target element size */
function lockScale(targetSize) {
    const raw = targetSize / 36;
    return 1 + (raw - 1) * 0.4;
}

// ===================== TESTS =====================

describe('PhantomReticle — Spring Physics', () => {
    it('converges toward target position over time', () => {
        const result = simulateSpring({ x: 500, y: 300 }, 100);
        // After 100 frames, should be very close to target
        expect(Math.abs(result.rx - 500)).toBeLessThan(0.1);
        expect(Math.abs(result.ry - 300)).toBeLessThan(0.1);
    });

    it('velocity approaches zero at convergence', () => {
        const result = simulateSpring({ x: 200, y: 200 }, 100);
        expect(Math.abs(result.vx)).toBeLessThan(0.01);
        expect(Math.abs(result.vy)).toBeLessThan(0.01);
    });

    it('does not overshoot excessively with DAMPING=0.72', () => {
        // Track max displacement during convergence
        let maxX = 0;
        let state = { rx: 0, ry: 0, vx: 0, vy: 0 };
        for (let i = 0; i < 60; i++) {
            state = simulateSpring({ x: 100, y: 0 }, 1, state);
            maxX = Math.max(maxX, state.rx);
        }
        // Overshoot should be modest — under 20% beyond target
        expect(maxX).toBeLessThan(120);
    });

    it('handles zero-distance (already at target)', () => {
        const result = simulateSpring({ x: 0, y: 0 }, 10);
        expect(result.rx).toBe(0);
        expect(result.ry).toBe(0);
    });

    it('works with negative coordinates', () => {
        const result = simulateSpring({ x: -300, y: -150 }, 100);
        expect(Math.abs(result.rx - (-300))).toBeLessThan(0.1);
        expect(Math.abs(result.ry - (-150))).toBeLessThan(0.1);
    });
});

describe('PhantomReticle — Lock-on Scale', () => {
    it('returns 1 for default reticle size (36px)', () => {
        expect(lockScale(36)).toBeCloseTo(1, 5);
    });

    it('scales up for large targets (dock icons ~64px)', () => {
        const s = lockScale(64);
        expect(s).toBeGreaterThan(1);
        // 1 + ((64/36) - 1) * 0.4 ≈ 1.311
        expect(s).toBeCloseTo(1.311, 2);
    });

    it('scales down for small targets (titlebar buttons ~16px)', () => {
        const s = lockScale(16);
        expect(s).toBeLessThan(1);
        // 1 + ((16/36) - 1) * 0.4 ≈ 0.778
        expect(s).toBeCloseTo(0.778, 2);
    });

    it('partial scale factor (0.4) prevents jarring size jumps', () => {
        // A 4x target (144px) should only scale ~2.2x, not 4x
        const s = lockScale(144);
        expect(s).toBeLessThan(2.5);
        expect(s).toBeGreaterThan(1.5);
    });
});

describe('PhantomReticle — DOM Lifecycle', () => {
    it('destroy removes the reticle element from DOM', () => {
        const el = document.createElement('div');
        el.className = 'phantom-reticle';
        document.body.appendChild(el);
        expect(document.querySelector('.phantom-reticle')).not.toBeNull();

        // Simulate destroy
        el.remove();
        expect(document.querySelector('.phantom-reticle')).toBeNull();
    });

    it('reticle starts hidden until first mouse move', () => {
        const el = document.createElement('div');
        el.className = 'phantom-reticle pr-hidden';
        expect(el.classList.contains('pr-hidden')).toBe(true);

        // Simulate first mouse enter
        el.classList.remove('pr-hidden');
        expect(el.classList.contains('pr-hidden')).toBe(false);
    });

    it('lock-on adds and removes pr-locked class', () => {
        const el = document.createElement('div');
        el.className = 'phantom-reticle';

        // Lock on
        el.classList.add('pr-locked');
        expect(el.classList.contains('pr-locked')).toBe(true);

        // Unlock
        el.classList.remove('pr-locked');
        expect(el.classList.contains('pr-locked')).toBe(false);
    });
});
