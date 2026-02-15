import { loadJSON, saveJSON } from './dom-helpers.js';

/**
 * Sticky Notes — localStorage-persisted notes with color themes.
 * Renders inside a Passion OS window. Supports create, edit, delete, color pick.
 */

const KEY = 'passion_sticky_notes';
const COLORS = [
    { name: 'cyber', bg: 'rgba(0,240,255,0.08)', border: '#00f0ff' },
    { name: 'neon', bg: 'rgba(0,255,136,0.08)', border: '#00ff88' },
    { name: 'pink', bg: 'rgba(255,0,170,0.08)', border: '#ff00aa' },
    { name: 'gold', bg: 'rgba(255,170,0,0.08)', border: '#ffaa00' },
    { name: 'purple', bg: 'rgba(170,0,255,0.08)', border: '#aa00ff' },
];

function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
}

function renderNote(note, grid, save, onDelete) {
    const color = COLORS.find((c) => c.name === note.color) || COLORS[0];
    const card = el('div', 'sticky-note');
    card.style.background = color.bg;
    card.style.borderColor = color.border;

    const header = el('div', 'sticky-note-header');
    const colorBtn = el('button', 'sticky-note-color-btn');
    colorBtn.style.background = color.border;
    colorBtn.title = 'Change color';
    colorBtn.addEventListener('click', () => {
        const idx = COLORS.findIndex((c) => c.name === note.color);
        const next = COLORS[(idx + 1) % COLORS.length];
        note.color = next.name;
        card.style.background = next.bg;
        card.style.borderColor = next.border;
        colorBtn.style.background = next.border;
        body.style.color = next.border;
        save();
    });

    const delBtn = el('button', 'sticky-note-del-btn', '×');
    delBtn.title = 'Delete note';
    delBtn.addEventListener('click', () => {
        card.classList.add('sticky-note-removing');
        setTimeout(() => { card.remove(); onDelete(note.id); }, 200);
    });

    header.append(colorBtn, delBtn);

    const body = el('div', 'sticky-note-body');
    body.contentEditable = 'true';
    body.spellcheck = false;
    body.style.color = color.border;
    body.textContent = note.text;
    body.setAttribute('aria-label', 'Note text');

    let timer = null;
    body.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => { note.text = body.textContent; note.updated = Date.now(); save(); }, 400);
    });
    body.addEventListener('blur', () => {
        if (timer) { clearTimeout(timer); note.text = body.textContent; note.updated = Date.now(); save(); timer = null; }
    });

    const time = el('div', 'sticky-note-time');
    time.style.color = color.border;
    time.textContent = new Date(note.updated || note.created)
        .toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    card.append(header, body, time);
    grid.appendChild(card);
}

export function renderStickyNotes(container) {
    container.innerHTML = '';
    const wrapper = el('div', 'sticky-notes-app');
    const toolbar = el('div', 'sticky-notes-toolbar');
    const addBtn = el('button', 'sticky-notes-add', '+ NEW NOTE');
    const countEl = el('span', 'sticky-notes-count');
    toolbar.append(addBtn, countEl);

    const grid = el('div', 'sticky-notes-grid');
    const empty = el('div', 'sticky-notes-empty', 'No notes yet. Click + NEW NOTE to get started.');
    wrapper.append(toolbar, grid, empty);
    container.appendChild(wrapper);

    let notes = loadJSON(KEY, []);
    const save = () => saveJSON(KEY, notes);

    function refresh() {
        grid.innerHTML = '';
        notes.forEach((n) => renderNote(n, grid, save, (id) => {
            notes = notes.filter((x) => x.id !== id);
            save();
            refresh();
        }));
        countEl.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
        empty.style.display = notes.length ? 'none' : '';
        grid.style.display = notes.length ? '' : 'none';
    }

    addBtn.addEventListener('click', () => {
        notes.unshift({
            id: `note_${Date.now()}`,
            text: '',
            color: COLORS[notes.length % COLORS.length].name,
            created: Date.now(),
            updated: Date.now(),
        });
        save();
        refresh();
        grid.querySelector('.sticky-note-body')?.focus();
    });

    refresh();
    return () => {
        // Flush any pending edits from contentEditable bodies into notes array
        grid.querySelectorAll('.sticky-note-body').forEach((body, i) => {
            if (notes[i] && body.textContent !== notes[i].text) {
                notes[i].text = body.textContent;
                notes[i].updated = Date.now();
            }
        });
        save();
    };
}
