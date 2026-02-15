import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { openExternal, animateCounter, loadJSON, saveJSON, downloadJSON } from '../js/dom-helpers.js';

describe('openExternal()', () => {
    let openSpy;

    beforeEach(() => {
        openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('opens URL in a new tab with noopener,noreferrer', () => {
        openExternal('https://example.com');
        expect(openSpy).toHaveBeenCalledWith(
            'https://example.com',
            '_blank',
            'noopener,noreferrer'
        );
    });

    it('passes through any URL string unchanged', () => {
        openExternal('https://github.com/user/repo?tab=stars#anchor');
        expect(openSpy).toHaveBeenCalledWith(
            'https://github.com/user/repo?tab=stars#anchor',
            '_blank',
            'noopener,noreferrer'
        );
    });

    it('blocks javascript: URLs', () => {
        openExternal('javascript:alert(1)');
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('blocks data: URLs', () => {
        openExternal('data:text/html,<script>alert(1)</script>');
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('blocks vbscript: URLs', () => {
        openExternal('vbscript:MsgBox("XSS")');
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('blocks null/undefined/empty inputs', () => {
        openExternal(null);
        openExternal(undefined);
        openExternal('');
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('blocks tab-obfuscated protocols', () => {
        openExternal('\tjavascript:alert(1)');
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('allows http:// URLs', () => {
        openExternal('http://example.com');
        expect(openSpy).toHaveBeenCalledWith(
            'http://example.com',
            '_blank',
            'noopener,noreferrer'
        );
    });
});

describe('animateCounter()', () => {
    let element;

    beforeEach(() => {
        element = document.createElement('span');
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns a clearable interval handle', () => {
        const timer = animateCounter(element, 100);
        expect(timer).toBeDefined();
        // jsdom returns a Timeout object; browsers return a number — both are clearable
        clearInterval(timer);
    });

    it('sets element text to target value when animation completes', () => {
        animateCounter(element, 50, 160);
        // 160ms duration / 16ms per tick = 10 ticks. Run enough ticks to finish.
        vi.advanceTimersByTime(200);
        expect(element.textContent).toBe('50');
    });

    it('shows intermediate floored values during animation', () => {
        animateCounter(element, 100, 320);
        // Advance a single tick (16ms)
        vi.advanceTimersByTime(16);
        // increment = 100 / (320/16) = 5 per tick → first tick should show 5
        expect(Number(element.textContent)).toBe(5);
    });

    it('handles target of 1 without hanging', () => {
        animateCounter(element, 1, 32);
        vi.advanceTimersByTime(100);
        expect(element.textContent).toBe('1');
    });

    it('can be cancelled by clearing the returned interval', () => {
        const timer = animateCounter(element, 1000, 5000);
        vi.advanceTimersByTime(16);
        clearInterval(timer);
        const frozen = element.textContent;
        vi.advanceTimersByTime(5000);
        // Value should stay frozen after cancellation
        expect(element.textContent).toBe(frozen);
    });
});

describe('loadJSON()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns parsed object from localStorage', () => {
        localStorage.setItem('test_key', JSON.stringify({ a: 1 }));
        expect(loadJSON('test_key')).toEqual({ a: 1 });
    });

    it('returns fallback when key is missing', () => {
        expect(loadJSON('missing', {})).toEqual({});
    });

    it('returns fallback on corrupted JSON', () => {
        localStorage.setItem('bad', '{not json');
        expect(loadJSON('bad', [])).toEqual([]);
    });

    it('returns null as default fallback', () => {
        expect(loadJSON('nope')).toBeNull();
    });
});

describe('downloadJSON()', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('creates a blob anchor and triggers download', () => {
        const clickSpy = vi.fn();
        const createSpy = vi.spyOn(document, 'createElement').mockReturnValue({
            set href(v) { this._href = v; },
            get href() { return this._href; },
            download: '',
            click: clickSpy,
        });
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

        downloadJSON({ a: 1 }, 'test.json');

        expect(createSpy).toHaveBeenCalledWith('a');
        expect(clickSpy).toHaveBeenCalled();
        expect(revokeSpy).toHaveBeenCalledWith('blob:mock');
    });

    it('sets the correct download filename', () => {
        const anchor = { href: '', download: '', click: vi.fn() };
        vi.spyOn(document, 'createElement').mockReturnValue(anchor);
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        downloadJSON([1, 2], 'my-data.json');
        expect(anchor.download).toBe('my-data.json');
    });
});

describe('saveJSON()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('serializes and persists value', () => {
        saveJSON('key', { x: 42 });
        expect(JSON.parse(localStorage.getItem('key'))).toEqual({ x: 42 });
    });

    it('overwrites existing key', () => {
        saveJSON('key', 'old');
        saveJSON('key', 'new');
        expect(JSON.parse(localStorage.getItem('key'))).toBe('new');
    });
});
