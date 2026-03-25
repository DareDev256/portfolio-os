/**
 * Command Palette (Cmd+K / Ctrl+K)
 * Spotlight-style quick launcher for Passion OS.
 */
import { Desktop } from './desktop.js';
import { State } from './state.js';

export const CommandPalette = {
    overlay: null,
    input: null,
    list: null,
    selectedIndex: 0,
    visible: false,
    commands: [],

    init() {
        this.buildCommands();
        this.createDOM();
        this.bindGlobalShortcut();
    },

    buildCommands() {
        const desktopCmds = Desktop.DESKTOP_ITEMS.map(item => ({
            id: item.id,
            label: item.label.replace(/_/g, ' ').replace('.exe', '').replace('.ai', '').replace('.mp4', ''),
            hint: 'Open',
            color: item.color,
            action: item.action,
        }));
        const systemCmds = [
            { id: 'sys-theme', label: 'Toggle Theme', hint: 'System', color: '#00f0ff', action: () => State.toggleTheme() },
            { id: 'sys-cursor', label: 'Toggle Cursor Trail', hint: 'System', color: '#aa00ff', action: () => State.toggleCursorTrail() },
            { id: 'sys-sound', label: 'Toggle Sound', hint: 'System', color: '#00ff88', action: () => State.toggleSound() },
            { id: 'sys-interactions', label: 'Toggle Interactions', hint: 'System', color: '#ff00aa', action: () => State.toggleInteractions() },
        ];
        this.commands = [...desktopCmds, ...systemCmds];
    },

    createDOM() {
        const overlay = document.createElement('div');
        overlay.className = 'cmd-palette-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', 'Command Palette');

        const container = document.createElement('div');
        container.className = 'cmd-palette';

        const inputWrap = document.createElement('div');
        inputWrap.className = 'cmd-palette-input-wrap';

        const prefix = document.createElement('span');
        prefix.className = 'cmd-palette-prefix';
        prefix.textContent = '>';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cmd-palette-input';
        input.placeholder = 'Type a command\u2026';
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'false');
        input.setAttribute('aria-label', 'Search commands');

        inputWrap.appendChild(prefix);
        inputWrap.appendChild(input);

        const list = document.createElement('ul');
        list.className = 'cmd-palette-list';
        list.setAttribute('role', 'listbox');

        container.appendChild(inputWrap);
        container.appendChild(list);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.input = input;
        this.list = list;

        input.addEventListener('input', () => this.filterAndRender());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); this.moveSelection(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); this.moveSelection(-1); }
            else if (e.key === 'Enter') { e.preventDefault(); this.executeSelected(); }
            else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
        });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    },

    bindGlobalShortcut() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.visible ? this.close() : this.open();
            }
        });
    },

    open() {
        this.visible = true;
        this.input.value = '';
        this.selectedIndex = 0;
        this.overlay.classList.add('active');
        this.filterAndRender();
        requestAnimationFrame(() => this.input.focus());

        // Achievement system: track command palette usage
        document.dispatchEvent(new CustomEvent('passion:command-palette'));
    },

    close() {
        this.visible = false;
        this.overlay.classList.remove('active');
        this.input.blur();
    },

    getFiltered() {
        const query = this.input.value.toLowerCase().trim();
        return query
            ? this.commands.filter(cmd => cmd.label.toLowerCase().includes(query))
            : this.commands;
    },

    filterAndRender() {
        const filtered = this.getFiltered();
        this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, filtered.length - 1));
        this.list.textContent = '';

        if (filtered.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'cmd-palette-empty';
            empty.textContent = 'No results';
            this.list.appendChild(empty);
            return;
        }

        filtered.forEach((cmd, i) => {
            const li = document.createElement('li');
            li.className = 'cmd-palette-item';
            li.setAttribute('role', 'option');
            if (i === this.selectedIndex) li.classList.add('selected');

            const dot = document.createElement('span');
            dot.className = 'cmd-palette-dot';
            dot.style.background = cmd.color || '#00f0ff';

            const label = document.createElement('span');
            label.className = 'cmd-palette-label';
            label.textContent = cmd.label;

            const hint = document.createElement('span');
            hint.className = 'cmd-palette-hint';
            hint.textContent = cmd.hint;

            li.append(dot, label, hint);
            li.addEventListener('click', () => { this.selectedIndex = i; this.executeSelected(); });
            li.addEventListener('mouseenter', () => { this.selectedIndex = i; this.highlightSelected(); });
            this.list.appendChild(li);
        });
    },

    moveSelection(delta) {
        const items = this.list.querySelectorAll('.cmd-palette-item');
        if (!items.length) return;
        this.selectedIndex = (this.selectedIndex + delta + items.length) % items.length;
        this.highlightSelected();
        items[this.selectedIndex]?.scrollIntoView({ block: 'nearest' });
    },

    highlightSelected() {
        this.list.querySelectorAll('.cmd-palette-item').forEach((el, i) =>
            el.classList.toggle('selected', i === this.selectedIndex));
    },

    executeSelected() {
        const cmd = this.getFiltered()[this.selectedIndex];
        if (cmd) { this.close(); cmd.action(); }
    },
};
