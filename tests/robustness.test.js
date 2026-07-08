import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderStickyNotes } from '../js/sticky-notes.js';

describe('Sticky Notes Robustness', () => {
    let container;
    const KEY = 'passion_sticky_notes';

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        container.remove();
        localStorage.clear();
    });

    it('gracefully handles corrupted JSON stored in localStorage without throwing', () => {
        // Corrupted JSON (truncated)
        localStorage.setItem(KEY, '{"id": "note_1", "text": "H');

        expect(() => {
            renderStickyNotes(container);
        }).not.toThrow();

        // Should fallback to empty state
        const count = container.querySelector('.sticky-notes-count');
        expect(count.textContent).toBe('0 notes');
    });

    it('documents behavior when localStorage contains an object instead of an array', () => {
        localStorage.setItem(KEY, JSON.stringify({ id: "note_1", text: "Hello" }));

        // The user prompt says:
        // "if you discover the code actually throws on corrupted JSON, leave the source as-is and just note the crash in the PR description."
        // We expect it to throw TypeError: notes.forEach is not a function
        expect(() => {
            renderStickyNotes(container);
        }).toThrow(/notes.forEach is not a function/);
    });
});
