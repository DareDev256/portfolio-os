/**
 * DOM Helpers — Utility function tests
 *
 * Covers fetchWithTimeout, hexAlpha, loadBool/saveBool, and
 * createDecorativeEl — core utilities used by 15+ modules
 * that had zero test coverage.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    fetchWithTimeout,
    hexAlpha,
    loadBool,
    saveBool,
    createDecorativeEl,
    createPointerTracker,
} from '../js/dom-helpers.js';

describe('hexAlpha() — opacity to hex conversion', () => {
    it('converts 1.0 to "ff"',    () => expect(hexAlpha(1)).toBe('ff'));
    it('converts 0 to "00"',      () => expect(hexAlpha(0)).toBe('00'));
    it('converts 0.5 to ~"7f"',   () => expect(hexAlpha(0.5)).toBe('7f'));
    it('clamps above 1 to "ff"',  () => expect(hexAlpha(1.5)).toBe('ff'));
    it('clamps below 0 to "00"',  () => expect(hexAlpha(-0.3)).toBe('00'));
    it('pads single-digit hex',   () => expect(hexAlpha(0.01)).toBe('02'));
});

describe('loadBool() / saveBool() — localStorage boolean flags', () => {
    beforeEach(() => localStorage.clear());

    it('returns fallback when key is absent', () => {
        expect(loadBool('missing')).toBe(true);   // default fallback
        expect(loadBool('missing', false)).toBe(false);
    });

    it('reads "1" as true', () => {
        localStorage.setItem('flag', '1');
        expect(loadBool('flag')).toBe(true);
    });

    it('reads "0" as false', () => {
        localStorage.setItem('flag', '0');
        expect(loadBool('flag')).toBe(false);
    });

    it('reads any non-"1" string as false', () => {
        localStorage.setItem('flag', 'yes');
        expect(loadBool('flag')).toBe(false);
    });

    it('saveBool round-trips correctly', () => {
        saveBool('a', true);
        expect(loadBool('a')).toBe(true);
        saveBool('a', false);
        expect(loadBool('a')).toBe(false);
    });

    it('saveBool handles quota exceeded gracefully', () => {
        const orig = localStorage.setItem;
        localStorage.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
        expect(() => saveBool('full', true)).not.toThrow();
        localStorage.setItem = orig;
    });
});

describe('createDecorativeEl() — accessible decorative elements', () => {
    it('creates HTML element with aria-hidden', () => {
        const el = createDecorativeEl('div', 'sparkle');
        expect(el.tagName).toBe('DIV');
        expect(el.getAttribute('aria-hidden')).toBe('true');
        expect(el.getAttribute('class')).toBe('sparkle');
    });

    it('creates SVG element when namespace provided', () => {
        const el = createDecorativeEl('svg', 'overlay', 'http://www.w3.org/2000/svg');
        expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(el.getAttribute('class')).toBe('overlay');
    });

    it('omits class when className is undefined', () => {
        const el = createDecorativeEl('span');
        expect(el.getAttribute('class')).toBeNull();
        expect(el.getAttribute('aria-hidden')).toBe('true');
    });
});

describe('createPointerTracker() — reactive mouse position', () => {
    it('initializes mouse off-screen', () => {
        const tracker = createPointerTracker();
        expect(tracker.mouse.x).toBe(-9999);
        expect(tracker.mouse.y).toBe(-9999);
        tracker.destroy();
    });

    it('updates on pointermove', () => {
        const tracker = createPointerTracker();
        document.dispatchEvent(new MouseEvent('pointermove', { clientX: 42, clientY: 99 }));
        expect(tracker.mouse.x).toBe(42);
        expect(tracker.mouse.y).toBe(99);
        tracker.destroy();
    });

    it('resets on pointerleave', () => {
        const tracker = createPointerTracker();
        document.dispatchEvent(new MouseEvent('pointermove', { clientX: 50, clientY: 50 }));
        document.dispatchEvent(new MouseEvent('pointerleave'));
        expect(tracker.mouse.x).toBe(-9999);
        tracker.destroy();
    });

    it('stops tracking after destroy()', () => {
        const tracker = createPointerTracker();
        tracker.destroy();
        document.dispatchEvent(new MouseEvent('pointermove', { clientX: 77, clientY: 88 }));
        expect(tracker.mouse.x).toBe(-9999); // unchanged
    });
});

describe('fetchWithTimeout() — timeout & abort', () => {
    afterEach(() => vi.restoreAllMocks());

    it('aborts after timeout expires', async () => {
        // Use a real short timeout instead of fake timers — fetch internals
        // rely on real event-loop scheduling that fake timers can't drive
        vi.spyOn(globalThis, 'fetch').mockImplementation((_, opts) => {
            return new Promise((_, reject) => {
                opts.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
            });
        });

        await expect(
            fetchWithTimeout('https://slow.example.com', { timeout: 50 })
        ).rejects.toThrow();
    }, 10000);

    it('passes through signal from caller', async () => {
        const ctrl = new AbortController();
        let capturedSignal;
        vi.spyOn(globalThis, 'fetch').mockImplementation((_, opts) => {
            capturedSignal = opts.signal;
            return Promise.resolve(new Response('ok'));
        });

        await fetchWithTimeout('https://example.com', { signal: ctrl.signal });
        // The internal controller wraps the external signal
        expect(capturedSignal).toBeDefined();
        expect(capturedSignal.aborted).toBe(false);
    });
});
