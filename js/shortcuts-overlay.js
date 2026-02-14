/**
 * Keyboard Shortcuts Overlay
 * Press ? to reveal all keyboard shortcuts and hidden easter eggs.
 */
export const ShortcutsOverlay = {
    overlay: null,
    visible: false,

    init() {
        this.createDOM();
        this.bindShortcut();
    },

    createDOM() {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const mod = isMac ? '⌘' : 'Alt';

        const sections = [
            { title: 'Navigation', color: '#00f0ff', shortcuts: [
                { keys: [isMac ? '⌘' : 'Ctrl', 'K'], desc: 'Open command palette' },
                { keys: ['Esc'], desc: 'Close active overlay' },
                { keys: ['↑', '↓'], desc: 'Navigate palette / menus' },
                { keys: ['Enter'], desc: 'Execute selected command' },
                { keys: ['←', '→'], desc: 'Navigate lightbox images' },
                { keys: ['Tab'], desc: 'Cycle focus in overlays' },
            ]},
            { title: 'System Toggles', color: '#b388ff', shortcuts: [
                { keys: [mod, 'C'], desc: 'Toggle cursor trail' },
                { keys: [mod, 'S'], desc: 'Toggle sound' },
                { keys: [mod, 'I'], desc: 'Toggle interactions' },
                { keys: [mod, 'P'], desc: 'Open control panel' },
            ]},
            { title: 'Easter Eggs', color: '#ff6e40', shortcuts: [
                { keys: ['↑↑↓↓←→←→BA'], desc: 'Konami code — PlayStation mode' },
                { keys: ['Ctrl', 'Shift', 'V'], desc: 'System info popup' },
                { keys: ['418'], desc: 'I\'m a teapot' },
                { keys: ['404'], desc: 'Not found... or is it?' },
                { keys: ['3×click desktop'], desc: 'Glitch pulse effect' },
                { keys: ['10× rapid click'], desc: 'Decaf suggestion' },
            ]},
        ];

        const overlay = document.createElement('div');
        overlay.className = 'shortcuts-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', 'Keyboard Shortcuts');

        const panel = document.createElement('div');
        panel.className = 'shortcuts-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'shortcuts-header';
        const title = document.createElement('h2');
        title.textContent = 'Keyboard Shortcuts';
        const hint = document.createElement('kbd');
        hint.textContent = '?';
        hint.className = 'shortcuts-close-hint';
        header.append(title, hint);
        panel.appendChild(header);

        // Sections grid
        const grid = document.createElement('div');
        grid.className = 'shortcuts-grid';

        for (const section of sections) {
            const col = document.createElement('div');
            col.className = 'shortcuts-section';
            const h3 = document.createElement('h3');
            h3.textContent = section.title;
            h3.style.color = section.color;
            col.appendChild(h3);

            for (const sc of section.shortcuts) {
                const row = document.createElement('div');
                row.className = 'shortcut-row';
                const keysWrap = document.createElement('div');
                keysWrap.className = 'shortcut-keys';
                for (const k of sc.keys) {
                    const kbd = document.createElement('kbd');
                    kbd.textContent = k;
                    keysWrap.appendChild(kbd);
                }
                const desc = document.createElement('span');
                desc.className = 'shortcut-desc';
                desc.textContent = sc.desc;
                row.append(keysWrap, desc);
                col.appendChild(row);
            }
            grid.appendChild(col);
        }

        panel.appendChild(grid);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        this.overlay = overlay;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    },

    bindShortcut() {
        document.addEventListener('keydown', (e) => {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
            if (e.key === '?') { e.preventDefault(); this.visible ? this.close() : this.open(); }
            if (e.key === 'Escape' && this.visible) { e.preventDefault(); e.stopPropagation(); this.close(); }
        });
    },

    open() {
        this.visible = true;
        this.overlay.classList.add('active');
    },

    close() {
        this.visible = false;
        this.overlay.classList.remove('active');
    },
};
