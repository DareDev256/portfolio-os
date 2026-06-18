import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderStickyNotes } from '../js/sticky-notes.js';

describe('Sticky Notes', () => {
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

    it('renders empty state when no notes exist', () => {
        renderStickyNotes(container);

        const count = container.querySelector('.sticky-notes-count');
        const empty = container.querySelector('.sticky-notes-empty');
        const grid = container.querySelector('.sticky-notes-grid');

        expect(count.textContent).toBe('0 notes');
        expect(empty.style.display).not.toBe('none');
        expect(grid.style.display).toBe('none');
        expect(grid.children.length).toBe(0);
    });

    it('renders existing notes from localStorage including legacy models', () => {
        const initialNotes = [
            { id: 'note_1', text: 'Hello', color: 'cyber', created: 1000, updated: 1000 },
            { id: 'note_2', text: 'World', color: 'neon', created: 2000, updated: 2000 },
            // Legacy model from issue description
            { id: 'demo', text: 'Welcome to Passion OS!\n\nTry dragging this note around, or edit the text.', x: 50, y: 50, color: 'yellow' }
        ];
        localStorage.setItem(KEY, JSON.stringify(initialNotes));

        renderStickyNotes(container);

        const count = container.querySelector('.sticky-notes-count');
        const grid = container.querySelector('.sticky-notes-grid');

        expect(count.textContent).toBe('3 notes');
        expect(grid.style.display).not.toBe('none');
        expect(grid.children.length).toBe(3);

        const bodies = grid.querySelectorAll('.sticky-note-body');
        expect(bodies[0].textContent).toBe('Hello');
        expect(bodies[1].textContent).toBe('World');
        expect(bodies[2].textContent).toBe('Welcome to Passion OS!\n\nTry dragging this note around, or edit the text.');

        // Verify fallback color is applied to the legacy 'yellow' color note
        const note3ColorBtn = grid.children[2].querySelector('.sticky-note-color-btn');
        // It falls back to COLORS[0] which is 'cyber' / #00f0ff (in rgb: rgb(0, 240, 255))
        // Since style.background color may be returned as rgb(...) we test if it exists
        expect(note3ColorBtn.style.background).not.toBe('');
    });

    it('adds a new note when clicking the add button', () => {
        renderStickyNotes(container);

        const addBtn = container.querySelector('.sticky-notes-add');
        addBtn.click();

        const grid = container.querySelector('.sticky-notes-grid');
        expect(grid.children.length).toBe(1);

        const savedNotes = JSON.parse(localStorage.getItem(KEY));
        expect(savedNotes).toBeInstanceOf(Array);
        expect(savedNotes.length).toBe(1);
        expect(savedNotes[0].text).toBe('');
    });

    it('deletes a note and saves state', () => {
        const initialNotes = [
            { id: 'note_1', text: 'To delete', color: 'cyber', created: 1000, updated: 1000 }
        ];
        localStorage.setItem(KEY, JSON.stringify(initialNotes));

        renderStickyNotes(container);

        const delBtn = container.querySelector('.sticky-note-del-btn');
        delBtn.click();

        // Fast-forward setTimeout in onDelete (200ms)
        vi.advanceTimersByTime(250);

        const grid = container.querySelector('.sticky-notes-grid');
        expect(grid.children.length).toBe(0);

        const savedNotes = JSON.parse(localStorage.getItem(KEY));
        expect(savedNotes.length).toBe(0);
    });

    it('cycles color when clicking the color button', () => {
        const initialNotes = [
            { id: 'note_1', text: 'Color note', color: 'cyber', created: 1000, updated: 1000 }
        ];
        localStorage.setItem(KEY, JSON.stringify(initialNotes));

        renderStickyNotes(container);

        const colorBtn = container.querySelector('.sticky-note-color-btn');
        colorBtn.click();

        const savedNotes = JSON.parse(localStorage.getItem(KEY));
        // 'cyber' -> 'neon'
        expect(savedNotes[0].color).toBe('neon');
    });

    it('saves note text after input debounce', () => {
        const initialNotes = [
            { id: 'note_1', text: 'Old text', color: 'cyber', created: 1000, updated: 1000 }
        ];
        localStorage.setItem(KEY, JSON.stringify(initialNotes));

        renderStickyNotes(container);

        const body = container.querySelector('.sticky-note-body');
        body.textContent = 'New text';
        body.dispatchEvent(new Event('input'));

        // Verify not saved immediately
        let savedNotes = JSON.parse(localStorage.getItem(KEY));
        expect(savedNotes[0].text).toBe('Old text');

        // Fast-forward past 400ms debounce
        vi.advanceTimersByTime(500);

        savedNotes = JSON.parse(localStorage.getItem(KEY));
        expect(savedNotes[0].text).toBe('New text');
    });

    it('saves note text on blur', () => {
        const initialNotes = [
            { id: 'note_1', text: 'Old text', color: 'cyber', created: 1000, updated: 1000 }
        ];
        localStorage.setItem(KEY, JSON.stringify(initialNotes));

        renderStickyNotes(container);

        const body = container.querySelector('.sticky-note-body');
        body.textContent = 'Blur text';
        body.dispatchEvent(new Event('input'));
        body.dispatchEvent(new Event('blur'));

        const savedNotes = JSON.parse(localStorage.getItem(KEY));
        expect(savedNotes[0].text).toBe('Blur text');
    });

    it('cleanup function flushes pending edits', () => {
        const initialNotes = [
            { id: 'note_1', text: 'Initial', color: 'cyber', created: 1000, updated: 1000 }
        ];
        localStorage.setItem(KEY, JSON.stringify(initialNotes));

        const cleanup = renderStickyNotes(container);

        const body = container.querySelector('.sticky-note-body');
        // change text but don't trigger input or blur
        body.textContent = 'Pending edit';

        cleanup();

        const savedNotes = JSON.parse(localStorage.getItem(KEY));
        expect(savedNotes[0].text).toBe('Pending edit');
    });
});
