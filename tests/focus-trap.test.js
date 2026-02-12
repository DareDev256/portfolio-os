import { describe, it, expect, beforeEach } from 'vitest';
import { trapFocus } from '../js/focus-trap.js';

function makeContainer(...elements) {
    const div = document.createElement('div');
    elements.forEach(el => div.appendChild(el));
    document.body.appendChild(div);
    return div;
}

function makeButton(label) {
    const btn = document.createElement('button');
    btn.textContent = label;
    return btn;
}

function pressTab(target, shiftKey = false) {
    const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
    });
    target.dispatchEvent(event);
    return event;
}

describe('trapFocus()', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('focuses the first focusable element on init', () => {
        const btn1 = makeButton('First');
        const btn2 = makeButton('Second');
        const container = makeContainer(btn1, btn2);

        trapFocus(container);
        expect(document.activeElement).toBe(btn1);
    });

    it('wraps Tab from last element to first', () => {
        const btn1 = makeButton('First');
        const btn2 = makeButton('Last');
        const container = makeContainer(btn1, btn2);

        trapFocus(container);
        btn2.focus();
        expect(document.activeElement).toBe(btn2);

        pressTab(container);
        expect(document.activeElement).toBe(btn1);
    });

    it('wraps Shift+Tab from first element to last', () => {
        const btn1 = makeButton('First');
        const btn2 = makeButton('Last');
        const container = makeContainer(btn1, btn2);

        trapFocus(container);
        btn1.focus();
        expect(document.activeElement).toBe(btn1);

        pressTab(container, true);
        expect(document.activeElement).toBe(btn2);
    });

    it('skips disabled elements', () => {
        const btn1 = makeButton('Active');
        const btn2 = makeButton('Disabled');
        btn2.disabled = true;
        const container = makeContainer(btn1, btn2);

        trapFocus(container);
        // Only btn1 is focusable — Tab should stay on btn1
        expect(document.activeElement).toBe(btn1);
    });

    it('returns cleanup function that removes listener', () => {
        const btn1 = makeButton('First');
        const btn2 = makeButton('Last');
        const container = makeContainer(btn1, btn2);

        const release = trapFocus(container);
        release();

        // After cleanup, Tab no longer traps — focus should not wrap
        btn2.focus();
        const event = pressTab(container);
        // The event should NOT have been prevented (trap is removed)
        expect(event.defaultPrevented).toBe(false);
    });

    it('handles container with no focusable children', () => {
        const container = makeContainer(document.createElement('div'));
        expect(() => trapFocus(container)).not.toThrow();
    });

    it('includes links and inputs as focusable', () => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = 'Link';
        const input = document.createElement('input');
        input.type = 'text';
        const container = makeContainer(link, input);

        trapFocus(container);
        expect(document.activeElement).toBe(link);

        // Tab from input (last) should wrap to link (first)
        input.focus();
        pressTab(container);
        expect(document.activeElement).toBe(link);
    });
});
