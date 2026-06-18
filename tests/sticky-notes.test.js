import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderStickyNotes } from '../js/sticky-notes.js';

describe('Sticky Notes', () => {
    let container;

    beforeEach(() => {
        // Set up the DOM container
        container = document.createElement('div');
        document.body.appendChild(container);

        // Clear localStorage mock before each test
        localStorage.clear();

        // Use fake timers to easily test the debounced save operations
        vi.useFakeTimers();
    });

    afterEach(() => {
        container.remove();
        vi.useRealTimers();
    });

    it('renders empty state when no notes exist', () => {
        renderStickyNotes(container);

        const emptyMessage = container.querySelector('.sticky-notes-empty');
        const countSpan = container.querySelector('.sticky-notes-count');

        expect(emptyMessage.style.display).not.toBe('none');
        expect(emptyMessage.textContent).toBe('No notes yet. Click + NEW NOTE to get started.');
        expect(countSpan.textContent).toBe('0 notes');
    });

    it('adds a new note when clicking the add button', () => {
        renderStickyNotes(container);

        const addBtn = container.querySelector('.sticky-notes-add');
        addBtn.click();

        const notes = container.querySelectorAll('.sticky-note');
        expect(notes.length).toBe(1);

        const countSpan = container.querySelector('.sticky-notes-count');
        expect(countSpan.textContent).toBe('1 note');

        // Check if localStorage was updated correctly
        const savedData = JSON.parse(localStorage.getItem('passion_sticky_notes'));
        expect(savedData.length).toBe(1);
        expect(savedData[0].text).toBe('');
    });

    it('loads existing notes from localStorage', () => {
        const testNotes = [
            { id: 'note_1', text: 'Test Note 1', color: 'cyber', created: Date.now(), updated: Date.now() },
            { id: 'note_2', text: 'Test Note 2', color: 'neon', created: Date.now(), updated: Date.now() },
        ];
        localStorage.setItem('passion_sticky_notes', JSON.stringify(testNotes));

        renderStickyNotes(container);

        const notes = container.querySelectorAll('.sticky-note');
        expect(notes.length).toBe(2);

        const countSpan = container.querySelector('.sticky-notes-count');
        expect(countSpan.textContent).toBe('2 notes');

        const bodies = container.querySelectorAll('.sticky-note-body');
        expect(bodies[0].textContent).toBe('Test Note 1');
        expect(bodies[1].textContent).toBe('Test Note 2');
    });

    it('updates a note and debounces the save operation', () => {
        renderStickyNotes(container);

        const addBtn = container.querySelector('.sticky-notes-add');
        addBtn.click();

        const body = container.querySelector('.sticky-note-body');
        body.textContent = 'Updated Note Text';
        body.dispatchEvent(new Event('input'));

        // Advance timers by 400ms to trigger the debounce
        vi.advanceTimersByTime(400);

        const savedData = JSON.parse(localStorage.getItem('passion_sticky_notes'));
        expect(savedData[0].text).toBe('Updated Note Text');
    });

    it('changes a note color when color button is clicked', () => {
        renderStickyNotes(container);

        const addBtn = container.querySelector('.sticky-notes-add');
        addBtn.click();

        const colorBtn = container.querySelector('.sticky-note-color-btn');
        colorBtn.click();

        const savedData = JSON.parse(localStorage.getItem('passion_sticky_notes'));
        // Initial color is usually first in array ('cyber'), so clicking should change it to the next ('neon').
        // Because of modulus math on note length in code: color = COLORS[notes.length % COLORS.length] (which is COLORS[0] since length is 0 before add, so 'cyber')
        // Next should be 'neon'
        expect(savedData[0].color).toBe('neon');
    });

    it('deletes a note', () => {
        renderStickyNotes(container);

        const addBtn = container.querySelector('.sticky-notes-add');
        addBtn.click();

        // Need to advance time so Date.now() returns different values for the IDs,
        // otherwise both notes will have the same ID.
        vi.advanceTimersByTime(10);
        addBtn.click(); // Add two notes

        let notes = container.querySelectorAll('.sticky-note');
        expect(notes.length).toBe(2);

        const delBtn = notes[0].querySelector('.sticky-note-del-btn');
        delBtn.click();

        // Advance timers to account for the setTimeout inside the delete handler
        vi.advanceTimersByTime(200);

        notes = container.querySelectorAll('.sticky-note');
        expect(notes.length).toBe(1);

        const savedData = JSON.parse(localStorage.getItem('passion_sticky_notes'));
        expect(savedData.length).toBe(1);
    });

    it('flushes pending edits when unmounted', () => {
        const cleanup = renderStickyNotes(container);

        const addBtn = container.querySelector('.sticky-notes-add');
        addBtn.click();

        const body = container.querySelector('.sticky-note-body');
        body.textContent = 'Pending Edit Text';

        // Call cleanup function without triggering the debounce timer
        cleanup();

        const savedData = JSON.parse(localStorage.getItem('passion_sticky_notes'));
        expect(savedData[0].text).toBe('Pending Edit Text');
    });
});
