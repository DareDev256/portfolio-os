/**
 * Phantom Keys — Unit tests for keystroke projection logic
 *
 * Tests the pure logic: spawn position jitter bounds, cooldown gating,
 * pool limiting, typing target detection, and palette selection.
 */
import { describe, it, expect } from 'vitest';

/* ── Constants (mirrored from phantom-keys.js) ── */
const MAX_ACTIVE  = 6;
const COOLDOWN_MS = 60;
const FONT_SIZE   = 28;

const PALETTE = [
    '#d4af37',
    '#f5d76e',
    '#8b5cf6',
    'rgba(139,92,246,.7)',
];

/* ── Re-implemented pure logic ── */

function pickColor() {
    return PALETTE[(Math.random() * PALETTE.length) | 0];
}

function spawnPosition(viewW = 1920, viewH = 1080) {
    const cx = viewW / 2;
    const jitterX = (Math.random() - 0.5) * 320;
    const jitterY = (Math.random() - 0.5) * 40;
    return { x: cx + jitterX, y: viewH - 80 + jitterY };
}

function isTypingTarget(tagName, isEditable = false) {
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return true;
    if (isEditable) return true;
    return false;
}

function shouldSpawn(activeCount, lastSpawn, now) {
    if (now - lastSpawn < COOLDOWN_MS) return false;
    if (activeCount >= MAX_ACTIVE) return false;
    return true;
}

/* ── Tests ── */

describe('Phantom Keys', () => {
    describe('spawnPosition', () => {
        it('stays within horizontal jitter bounds', () => {
            for (let i = 0; i < 200; i++) {
                const { x } = spawnPosition(1920, 1080);
                expect(x).toBeGreaterThanOrEqual(1920 / 2 - 160);
                expect(x).toBeLessThanOrEqual(1920 / 2 + 160);
            }
        });

        it('stays near bottom of viewport', () => {
            for (let i = 0; i < 200; i++) {
                const { y } = spawnPosition(1920, 1080);
                expect(y).toBeGreaterThanOrEqual(1080 - 100);
                expect(y).toBeLessThanOrEqual(1080 - 60);
            }
        });

        it('adapts to different viewport sizes', () => {
            const { x } = spawnPosition(800, 600);
            expect(x).toBeGreaterThanOrEqual(800 / 2 - 160);
            expect(x).toBeLessThanOrEqual(800 / 2 + 160);
        });
    });

    describe('pickColor', () => {
        it('always returns a palette color', () => {
            for (let i = 0; i < 100; i++) {
                expect(PALETTE).toContain(pickColor());
            }
        });
    });

    describe('isTypingTarget', () => {
        it('blocks INPUT elements', () => {
            expect(isTypingTarget('INPUT')).toBe(true);
        });

        it('blocks TEXTAREA elements', () => {
            expect(isTypingTarget('TEXTAREA')).toBe(true);
        });

        it('blocks SELECT elements', () => {
            expect(isTypingTarget('SELECT')).toBe(true);
        });

        it('blocks contentEditable elements', () => {
            expect(isTypingTarget('DIV', true)).toBe(true);
        });

        it('allows regular DIV elements', () => {
            expect(isTypingTarget('DIV', false)).toBe(false);
        });

        it('allows BODY element', () => {
            expect(isTypingTarget('BODY', false)).toBe(false);
        });
    });

    describe('shouldSpawn', () => {
        it('blocks when pool is full', () => {
            expect(shouldSpawn(MAX_ACTIVE, 0, 1000)).toBe(false);
        });

        it('blocks during cooldown', () => {
            expect(shouldSpawn(0, 1000, 1000 + COOLDOWN_MS - 1)).toBe(false);
        });

        it('allows when pool has room and cooldown elapsed', () => {
            expect(shouldSpawn(0, 0, COOLDOWN_MS + 1)).toBe(true);
        });

        it('allows at exactly MAX_ACTIVE - 1', () => {
            expect(shouldSpawn(MAX_ACTIVE - 1, 0, COOLDOWN_MS + 1)).toBe(true);
        });
    });
});
