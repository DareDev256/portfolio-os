import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Desktop and State so command-palette.js can import without side effects
vi.mock('../js/desktop.js', () => ({
    Desktop: {
        DESKTOP_ITEMS: [
            { id: 'about', label: 'ABOUT_ME.exe', color: '#00f0ff', action: vi.fn() },
            { id: 'resume', label: 'RESUME', color: '#ff0', action: vi.fn() },
            { id: 'terminal', label: 'DEV_TERMINAL', color: '#0f0', action: vi.fn() },
        ],
    },
}));

vi.mock('../js/state.js', () => ({
    State: {
        toggleTheme: vi.fn(),
        toggleCursorTrail: vi.fn(),
        toggleSound: vi.fn(),
        toggleInteractions: vi.fn(),
    },
}));

const { CommandPalette } = await import('../js/command-palette.js');
const { Desktop } = await import('../js/desktop.js');
const { State } = await import('../js/state.js');

describe('CommandPalette', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Remove any previous DOM
        document.querySelectorAll('.cmd-palette-overlay').forEach(el => el.remove());
        // Reset internal state
        CommandPalette.overlay = null;
        CommandPalette.input = null;
        CommandPalette.list = null;
        CommandPalette.visible = false;
        CommandPalette.selectedIndex = 0;
        CommandPalette.commands = [];
        // Init fresh
        CommandPalette.init();
    });

    afterEach(() => {
        document.querySelectorAll('.cmd-palette-overlay').forEach(el => el.remove());
    });

    describe('init + buildCommands', () => {
        it('creates overlay, input, and list in the DOM', () => {
            expect(CommandPalette.overlay).toBeInstanceOf(HTMLElement);
            expect(CommandPalette.input.tagName).toBe('INPUT');
            expect(CommandPalette.list.tagName).toBe('UL');
        });

        it('builds commands from desktop items + system toggles', () => {
            // 3 desktop items + 4 system commands = 7
            expect(CommandPalette.commands.length).toBe(7);
        });

        it('strips underscores and file extensions from labels', () => {
            const labels = CommandPalette.commands.map(c => c.label);
            expect(labels).toContain('ABOUT ME');
            expect(labels).toContain('DEV TERMINAL');
            expect(labels).not.toContain('ABOUT_ME.exe');
        });
    });

    describe('open / close', () => {
        it('sets visible=true and adds active class on open', () => {
            CommandPalette.open();
            expect(CommandPalette.visible).toBe(true);
            expect(CommandPalette.overlay.classList.contains('active')).toBe(true);
        });

        it('sets visible=false and removes active class on close', () => {
            CommandPalette.open();
            CommandPalette.close();
            expect(CommandPalette.visible).toBe(false);
            expect(CommandPalette.overlay.classList.contains('active')).toBe(false);
        });

        it('resets input and selectedIndex on open', () => {
            CommandPalette.input.value = 'leftover';
            CommandPalette.selectedIndex = 5;
            CommandPalette.open();
            expect(CommandPalette.input.value).toBe('');
            expect(CommandPalette.selectedIndex).toBe(0);
        });
    });

    describe('getFiltered (fuzzy search)', () => {
        it('returns all commands when query is empty', () => {
            CommandPalette.input.value = '';
            expect(CommandPalette.getFiltered().length).toBe(7);
        });

        it('filters by substring match (case-insensitive)', () => {
            CommandPalette.input.value = 'theme';
            const filtered = CommandPalette.getFiltered();
            expect(filtered.length).toBe(1);
            expect(filtered[0].label).toBe('Toggle Theme');
        });

        it('returns empty array for no matches', () => {
            CommandPalette.input.value = 'zzzznonexistent';
            expect(CommandPalette.getFiltered().length).toBe(0);
        });

        it('matches partial desktop item names', () => {
            CommandPalette.input.value = 'term';
            const filtered = CommandPalette.getFiltered();
            expect(filtered.length).toBe(1);
            expect(filtered[0].id).toBe('terminal');
        });
    });

    describe('filterAndRender', () => {
        it('renders "No results" when nothing matches', () => {
            CommandPalette.input.value = 'zzzzz';
            CommandPalette.filterAndRender();
            const empty = CommandPalette.list.querySelector('.cmd-palette-empty');
            expect(empty).not.toBeNull();
            expect(empty.textContent).toBe('No results');
        });

        it('renders list items with role=option', () => {
            CommandPalette.input.value = '';
            CommandPalette.filterAndRender();
            const items = CommandPalette.list.querySelectorAll('[role="option"]');
            expect(items.length).toBe(7);
        });

        it('marks first item as selected by default', () => {
            CommandPalette.open();
            const selected = CommandPalette.list.querySelector('.selected');
            expect(selected).not.toBeNull();
            expect(selected).toBe(CommandPalette.list.querySelector('.cmd-palette-item'));
        });
    });

    describe('moveSelection (keyboard navigation)', () => {
        // jsdom doesn't implement scrollIntoView
        beforeEach(() => {
            HTMLElement.prototype.scrollIntoView = vi.fn();
        });

        it('wraps from last item to first (ArrowDown)', () => {
            CommandPalette.open();
            const total = CommandPalette.commands.length;
            CommandPalette.selectedIndex = total - 1;
            CommandPalette.filterAndRender();
            CommandPalette.moveSelection(1);
            expect(CommandPalette.selectedIndex).toBe(0);
        });

        it('wraps from first item to last (ArrowUp)', () => {
            CommandPalette.open();
            CommandPalette.selectedIndex = 0;
            CommandPalette.filterAndRender();
            CommandPalette.moveSelection(-1);
            expect(CommandPalette.selectedIndex).toBe(CommandPalette.commands.length - 1);
        });

        it('does nothing when list is empty', () => {
            CommandPalette.input.value = 'zzzzz';
            CommandPalette.filterAndRender();
            CommandPalette.moveSelection(1);
            // Should not throw
        });
    });

    describe('executeSelected', () => {
        it('calls the action of the selected command', () => {
            CommandPalette.open();
            CommandPalette.selectedIndex = 0;
            CommandPalette.executeSelected();
            expect(Desktop.DESKTOP_ITEMS[0].action).toHaveBeenCalled();
        });

        it('closes the palette after execution', () => {
            CommandPalette.open();
            CommandPalette.executeSelected();
            expect(CommandPalette.visible).toBe(false);
        });

        it('invokes system toggle commands correctly', () => {
            CommandPalette.open();
            // System commands start at index 3 (after 3 desktop items)
            CommandPalette.selectedIndex = 3; // Toggle Theme
            CommandPalette.executeSelected();
            expect(State.toggleTheme).toHaveBeenCalled();
        });
    });

    describe('ARIA attributes', () => {
        it('overlay has role=dialog', () => {
            expect(CommandPalette.overlay.getAttribute('role')).toBe('dialog');
        });

        it('list has role=listbox', () => {
            expect(CommandPalette.list.getAttribute('role')).toBe('listbox');
        });

        it('input has aria-label', () => {
            expect(CommandPalette.input.getAttribute('aria-label')).toBe('Search commands');
        });
    });
});
