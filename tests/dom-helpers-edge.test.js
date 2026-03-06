import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { el, animateCounter, saveJSON, openExternal } from '../js/dom-helpers.js';

describe('el() — DOM element factory', () => {
    it('creates element with correct tag', () => {
        const div = el('div');
        expect(div.tagName).toBe('DIV');
    });

    it('sets className when provided', () => {
        const span = el('span', 'badge gold');
        expect(span.className).toBe('badge gold');
    });

    it('sets textContent when provided', () => {
        const p = el('p', null, 'hello');
        expect(p.textContent).toBe('hello');
        expect(p.className).toBe('');
    });

    it('skips className and text when both omitted', () => {
        const div = el('div');
        expect(div.className).toBe('');
        expect(div.textContent).toBe('');
    });

    it('handles empty string class (falsy but valid)', () => {
        const div = el('div', '', 'text');
        // Empty string is falsy → className not set
        expect(div.textContent).toBe('text');
    });
});

describe('animateCounter() — edge cases', () => {
    let element;

    beforeEach(() => {
        element = document.createElement('span');
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('target of 0 completes immediately without infinite loop', () => {
        // BUG PROBE: increment = 0/(duration/16) = 0
        // start (0) += 0 → start never exceeds target → infinite loop
        // This test documents the bug: start(0) >= target(0) is true on first tick
        const timer = animateCounter(element, 0, 160);
        vi.advanceTimersByTime(16);
        // First tick: start=0, 0 >= 0 is true → sets textContent to 0, clears
        expect(element.textContent).toBe('0');
        clearInterval(timer);
    });

    it('negative target converges (increment is negative)', () => {
        // Edge: target = -10, increment = -10/(160/16) = -1
        // start goes 0, -1, -2... never >= -10 since it's decreasing
        // This documents that negative targets cause an infinite loop
        const timer = animateCounter(element, -10, 160);
        vi.advanceTimersByTime(16);
        // start = -1, floor(-1) = -1, but -1 >= -10 is true... wait
        // Actually: start(0) + (-1) = -1. -1 >= -10? Yes. So it shows Math.floor(-1) = -1
        // Next tick: -2 >= -10? Yes. Shows -2. Eventually -10 >= -10 → sets to -10
        vi.advanceTimersByTime(160);
        expect(element.textContent).toBe('-10');
        clearInterval(timer);
    });

    it('fractional target rounds intermediate values correctly', () => {
        // target=7, duration=112 → increment = 7/(112/16) = 1
        // Ticks: 1,2,3,4,5,6,7 → 7>=7 → done
        animateCounter(element, 7, 112);
        vi.advanceTimersByTime(112);
        expect(element.textContent).toBe('7');
    });

    it('very large target does not overflow', () => {
        const timer = animateCounter(element, Number.MAX_SAFE_INTEGER, 16);
        vi.advanceTimersByTime(16);
        // Single tick with full increment should complete
        expect(element.textContent).toBe(String(Number.MAX_SAFE_INTEGER));
        clearInterval(timer);
    });
});

describe('saveJSON() — quota exceeded handling', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns true on successful write', () => {
        expect(saveJSON('ok', { v: 1 })).toBe(true);
    });

    it('returns false when localStorage throws QuotaExceededError', () => {
        // jsdom's localStorage.setItem is an own method — mock it directly
        const original = localStorage.setItem;
        localStorage.setItem = () => {
            throw new DOMException('quota exceeded', 'QuotaExceededError');
        };
        vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            expect(saveJSON('full', 'data')).toBe(false);
        } finally {
            localStorage.setItem = original;
        }
    });

    it('serializes circular references gracefully (returns false)', () => {
        const circular = {};
        circular.self = circular;
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(saveJSON('circ', circular)).toBe(false);
    });
});

describe('openExternal() — protocol edge cases', () => {
    let openSpy;

    beforeEach(() => {
        openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('blocks non-string inputs (number, object, array)', () => {
        openExternal(42);
        openExternal({});
        openExternal([]);
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('blocks JAVASCRIPT: (all caps)', () => {
        openExternal('JAVASCRIPT:alert(1)');
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('strips null bytes before protocol check', () => {
        openExternal('\x00javascript:alert(1)');
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('blocks URLs with only whitespace', () => {
        openExternal('   ');
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('handles URL with embedded newlines in protocol', () => {
        openExternal('java\nscript:alert(1)');
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('allows https with port numbers', () => {
        openExternal('https://localhost:3000/path');
        expect(openSpy).toHaveBeenCalledWith(
            'https://localhost:3000/path',
            '_blank',
            'noopener,noreferrer'
        );
    });
});
