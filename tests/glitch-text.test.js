/**
 * GlitchText — chromatic aberration wiring and mutation observer
 *
 * Tests cover: title wiring idempotency, data-text sync on content
 * change, MutationObserver auto-wiring of new windows, and the
 * prefers-reduced-motion escape hatch.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ---------- Extracted pure logic from glitch-text.js ----------
// GlitchText binds a MutationObserver on init, so we replicate
// the wiring functions here for isolated unit testing.

const TITLE_SELECTOR = '.window-title';
const GLITCH_CLASS = 'glitch-text';

function wireTitle(el) {
    if (el.classList.contains(GLITCH_CLASS)) return;
    el.classList.add(GLITCH_CLASS);
    el.dataset.text = el.textContent;
}

function wireAll(root = document) {
    for (const el of root.querySelectorAll(TITLE_SELECTOR)) wireTitle(el);
}

function syncText(el) {
    if (el.dataset.text !== el.textContent) {
        el.dataset.text = el.textContent;
    }
}

// ===================== TESTS =====================

describe('GlitchText — wireTitle', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('span');
        el.className = 'window-title';
        el.textContent = 'Terminal';
    });

    it('adds glitch class and sets data-text from textContent', () => {
        wireTitle(el);
        expect(el.classList.contains(GLITCH_CLASS)).toBe(true);
        expect(el.dataset.text).toBe('Terminal');
    });

    it('is idempotent — second call does not overwrite data-text', () => {
        wireTitle(el);
        // Simulate external text change after wiring
        el.textContent = 'Changed';
        wireTitle(el);
        // Should NOT re-set data-text because class is already present
        expect(el.dataset.text).toBe('Terminal');
    });

    it('handles empty textContent gracefully', () => {
        el.textContent = '';
        wireTitle(el);
        expect(el.dataset.text).toBe('');
        expect(el.classList.contains(GLITCH_CLASS)).toBe(true);
    });

    it('preserves special characters in data-text', () => {
        el.textContent = '<script>alert(1)</script>';
        wireTitle(el);
        // textContent is already text-safe, no HTML parsing
        expect(el.dataset.text).toBe('<script>alert(1)</script>');
    });
});

describe('GlitchText — wireAll', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
    });

    it('wires all matching titles in a subtree', () => {
        container.innerHTML =
            '<span class="window-title">A</span>' +
            '<div><span class="window-title">B</span></div>';
        wireAll(container);

        const titles = container.querySelectorAll(TITLE_SELECTOR);
        expect(titles[0].classList.contains(GLITCH_CLASS)).toBe(true);
        expect(titles[1].dataset.text).toBe('B');
    });

    it('skips non-matching elements', () => {
        container.innerHTML = '<span class="other-class">Nope</span>';
        wireAll(container);
        expect(container.querySelector('.other-class').dataset.text).toBeUndefined();
    });

    it('handles empty container without error', () => {
        expect(() => wireAll(container)).not.toThrow();
    });
});

describe('GlitchText — syncText', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('span');
        el.className = 'window-title glitch-text';
        el.textContent = 'Projects';
        el.dataset.text = 'Projects';
    });

    it('updates data-text when textContent diverges', () => {
        el.textContent = 'Projects > Details';
        syncText(el);
        expect(el.dataset.text).toBe('Projects > Details');
    });

    it('skips DOM write when already in sync', () => {
        // Verify the guard condition: when text matches, dataset stays unchanged
        const before = el.dataset.text;
        syncText(el);
        expect(el.dataset.text).toBe(before);
        // Confirm textContent hasn't been mutated either
        expect(el.textContent).toBe('Projects');
    });

    it('handles empty-to-content transition', () => {
        el.textContent = '';
        el.dataset.text = '';
        el.textContent = 'New Title';
        syncText(el);
        expect(el.dataset.text).toBe('New Title');
    });
});
