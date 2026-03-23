import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dom-helpers — calculator only uses el()
vi.mock('../js/dom-helpers.js', () => ({
    el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text) e.textContent = text;
        return e;
    },
}));

const { renderCalculator } = await import('../js/calculator.js');

function clickKey(container, label) {
    const buttons = container.querySelectorAll('button');
    for (const btn of buttons) {
        if (btn.textContent === label) { btn.click(); return; }
    }
    throw new Error(`Key "${label}" not found`);
}

function readout(container) {
    return container.querySelector('.calc-readout').textContent;
}

describe('Calculator', () => {
    let container;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);
        renderCalculator(container);
    });

    it('displays 0 on init', () => {
        expect(readout(container)).toBe('0');
    });

    it('performs basic addition', () => {
        clickKey(container, '3');
        clickKey(container, '+');
        clickKey(container, '7');
        clickKey(container, '=');
        expect(readout(container)).toBe('10');
    });

    it('performs subtraction', () => {
        clickKey(container, '9');
        clickKey(container, '−');
        clickKey(container, '4');
        clickKey(container, '=');
        expect(readout(container)).toBe('5');
    });

    it('performs multiplication', () => {
        clickKey(container, '6');
        clickKey(container, '×');
        clickKey(container, '8');
        clickKey(container, '=');
        expect(readout(container)).toBe('48');
    });

    it('handles division by zero → ERR', () => {
        clickKey(container, '5');
        clickKey(container, '÷');
        clickKey(container, '0');
        clickKey(container, '=');
        expect(readout(container)).toBe('ERR');
    });

    it('locks input after ERR until Clear', () => {
        clickKey(container, '5');
        clickKey(container, '÷');
        clickKey(container, '0');
        clickKey(container, '=');
        // Pressing digits should do nothing
        clickKey(container, '9');
        expect(readout(container)).toBe('ERR');
        // Clear resets
        clickKey(container, 'C');
        expect(readout(container)).toBe('0');
    });

    it('handles decimal input', () => {
        clickKey(container, '3');
        clickKey(container, '.');
        clickKey(container, '1');
        clickKey(container, '4');
        expect(readout(container)).toBe('3.14');
    });

    it('prevents double decimal', () => {
        clickKey(container, '1');
        clickKey(container, '.');
        clickKey(container, '.');
        clickKey(container, '5');
        expect(readout(container)).toBe('1.5');
    });

    it('toggles sign with ±', () => {
        clickKey(container, '7');
        clickKey(container, '±');
        expect(readout(container)).toBe('-7');
        clickKey(container, '±');
        expect(readout(container)).toBe('7');
    });

    it('calculates percentage', () => {
        clickKey(container, '5');
        clickKey(container, '0');
        clickKey(container, '%');
        expect(readout(container)).toBe('0.5');
    });

    it('backspace removes last digit', () => {
        clickKey(container, '1');
        clickKey(container, '2');
        clickKey(container, '3');
        clickKey(container, '⌫');
        expect(readout(container)).toBe('12');
    });

    it('backspace on single digit yields 0', () => {
        clickKey(container, '5');
        clickKey(container, '⌫');
        expect(readout(container)).toBe('0');
    });

    it('chains operations without pressing =', () => {
        clickKey(container, '2');
        clickKey(container, '+');
        clickKey(container, '3');
        clickKey(container, '×');
        // Should compute 2+3=5 implicitly, then chain ×
        clickKey(container, '4');
        clickKey(container, '=');
        expect(readout(container)).toBe('20');
    });

    it('clears everything with C', () => {
        clickKey(container, '9');
        clickKey(container, '+');
        clickKey(container, '1');
        clickKey(container, 'C');
        expect(readout(container)).toBe('0');
    });

    it('returns cleanup function that removes keydown listener', () => {
        const cleanup = renderCalculator(container);
        expect(typeof cleanup).toBe('function');
        expect(() => cleanup()).not.toThrow();
    });
});
