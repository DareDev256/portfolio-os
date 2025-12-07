import { Desktop } from './desktop.js';
import { State } from './state.js';
import { Admin } from './admin.js';
import { Login } from './login.js';
import { AudioFX } from './audiofx.js';

/**
 * Command Palette + Skills Registry
 * Quick actions via Cmd/Ctrl+K (like "Claude Skills" for this UI)
 */

export const Skills = {
    el: null,
    input: null,
    list: null,
    items: [],
    results: [],
    selectedIndex: 0,

    init() {
        this.mount();
        this.registerBuiltins();
        this.bindHotkeys();
    },

    mount() {
        const overlay = document.createElement('div');
        overlay.className = 'cmdk-overlay';
        overlay.innerHTML = `
      <div class="cmdk" role="dialog" aria-label="Command Palette">
        <div class="cmdk-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input class="cmdk-input" type="text" placeholder="Type a command… (e.g., wallpaper, theme, open)" aria-label="Command" />
        </div>
        <div class="cmdk-list" role="listbox"></div>
      </div>`;
        document.body.appendChild(overlay);
        this.el = overlay;
        this.input = overlay.querySelector('.cmdk-input');
        this.list = overlay.querySelector('.cmdk-list');

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });
        this.input.addEventListener('input', () => this.search(this.input.value));
        this.input.addEventListener('keydown', (e) => this.onKeyDown(e));
    },

    bindHotkeys() {
        document.addEventListener('keydown', (e) => {
            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.open();
            }
        });
    },

    register(skill) {
        this.items.push(skill);
    },

    registerBuiltins() {
        const open = (fn) => () => {
            if (typeof fn === 'function') fn();
        };
        this.register({
            id: 'wallpaper-next',
            title: 'Next Wallpaper',
            keywords: 'wallpaper background next',
            run: open(() => Desktop.changeWallpaper()),
        });
        this.register({
            id: 'wallpaper-random',
            title: 'Random Wallpaper',
            keywords: 'wallpaper background random',
            run: open(() => Desktop.randomWallpaper()),
        });
        this.register({
            id: 'wallpaper-reset',
            title: 'Reset Wallpaper (Default Image)',
            keywords: 'wallpaper background reset default',
            run: open(() => State.resetWallpaper()),
        });
        this.register({
            id: 'wallpaper-grey',
            title: 'Apply Grey Gradient Wallpaper',
            keywords: 'wallpaper gradient grey',
            run: open(() => State.setWallpaper('gradient:grey-ombre')),
        });

        this.register({
            id: 'theme-toggle',
            title: 'Toggle Theme (Light/Dark)',
            keywords: 'theme dark light',
            run: open(() => State.toggleTheme()),
        });

        // FX controls
        this.register({
            id: 'fx-toggle',
            title: 'Toggle Futuristic FX',
            keywords: 'fx effects particles neon',
            run: open(() => State.toggleFx()),
        });
        this.register({
            id: 'fx-on',
            title: 'Enable Futuristic FX',
            keywords: 'fx on enable',
            run: open(() => State.setFxEnabled(true)),
        });
        this.register({
            id: 'fx-off',
            title: 'Disable Futuristic FX',
            keywords: 'fx off disable',
            run: open(() => State.setFxEnabled(false)),
        });

        // Aurora
        this.register({
            id: 'aurora-toggle',
            title: 'Toggle Aurora Fog',
            keywords: 'aurora fog overlay',
            run: open(() => State.toggleAurora()),
        });
        // Glyph ring
        this.register({
            id: 'glyphs-toggle',
            title: 'Toggle Glyph Ring',
            keywords: 'glyphs ring hologram',
            run: open(() => State.toggleGlyphs()),
        });

        // Sound
        this.register({
            id: 'sound-toggle',
            title: 'Toggle UI Sounds',
            keywords: 'audio sound fx',
            run: open(() => State.toggleSound()),
        });
        this.register({
            id: 'sound-chime',
            title: 'Play Test Chime',
            keywords: 'audio sound test chime',
            run: open(() => AudioFX && AudioFX.bootChime()),
        });
        this.register({
            id: 'open-admin',
            title: 'Open Content Editor',
            keywords: 'admin editor content',
            run: open(() => Admin.open()),
        });

        this.register({
            id: 'open-media',
            title: 'Open Media',
            keywords: 'open app media photos videos',
            run: open(() => Desktop.openMedia()),
        });
        this.register({
            id: 'open-photos',
            title: 'Open Photos (Media)',
            keywords: 'open app photos',
            run: open(() => Desktop.openMedia('images')),
        });
        this.register({
            id: 'open-videos',
            title: 'Open Videos (Media)',
            keywords: 'open app videos',
            run: open(() => Desktop.openMedia('videos')),
        });
        this.register({
            id: 'open-apps',
            title: 'Open Applications',
            keywords: 'open app applications projects',
            run: open(() => Desktop.openApplications()),
        });
        this.register({
            id: 'open-resume',
            title: 'Open Resume',
            keywords: 'open resume',
            run: open(() => Desktop.openResume()),
        });
        this.register({
            id: 'open-about',
            title: 'Open About',
            keywords: 'open about',
            run: open(() => Desktop.openAbout()),
        });
        this.register({
            id: 'open-contact',
            title: 'Open Contact',
            keywords: 'open contact',
            run: open(() => Desktop.openContact()),
        });

        this.register({
            id: 'lock',
            title: 'Lock Screen',
            keywords: 'lock login',
            run: open(() => Login.lock()),
        });

        // Service Worker
        this.register({
            id: 'sw-update',
            title: 'Update Cache (Service Worker)',
            keywords: 'cache service worker update',
            run: () => {
                if ('serviceWorker' in navigator) {
                    caches
                        .keys()
                        .then((keys) => keys.forEach((k) => caches.delete(k)))
                        .then(() => location.reload());
                }
            },
        });
    },

    open() {
        this.el.style.display = 'flex';
        this.input.value = '';
        this.search('');
        setTimeout(() => this.input.focus(), 20);
    },

    close() {
        this.el.style.display = 'none';
    },

    search(q) {
        const query = q.trim().toLowerCase();
        this.results = this.items.filter(
            (it) =>
                !query ||
                it.title.toLowerCase().includes(query) ||
                (it.keywords || '').includes(query)
        );
        this.selectedIndex = 0;
        this.renderList();
    },

    renderList() {
        this.list.innerHTML = '';
        if (this.results.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'cmdk-empty';
            empty.textContent = 'No commands found';
            this.list.appendChild(empty);
            return;
        }
        this.results.forEach((item, idx) => {
            const el = document.createElement('div');
            el.className = 'cmdk-item';
            el.setAttribute('role', 'option');
            el.setAttribute('aria-selected', idx === this.selectedIndex ? 'true' : 'false');
            el.textContent = item.title;
            el.addEventListener('mousemove', () => this.setSelected(idx));
            el.addEventListener('click', () => this.runSelected(idx));
            this.list.appendChild(el);
        });
    },

    setSelected(idx) {
        this.selectedIndex = idx;
        this.renderList();
    },

    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.close();
            return;
        }
        if (e.key === 'ArrowDown') {
            this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
            this.renderList();
            e.preventDefault();
            return;
        }
        if (e.key === 'ArrowUp') {
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
            this.renderList();
            e.preventDefault();
            return;
        }
        if (e.key === 'Enter') {
            this.runSelected(this.selectedIndex);
        }
    },

    runSelected(idx) {
        const item = this.results[idx];
        if (!item) return;
        try {
            item.run();
        } finally {
            this.close();
        }
    },
};
