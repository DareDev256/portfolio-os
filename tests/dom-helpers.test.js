import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { openExternal, animateCounter } from '../js/dom-helpers.js';

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
