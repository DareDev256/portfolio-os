/**
 * Main Entry Point
 * Initializes the application in the correct order
 *
 * Architecture: data-driven init — visual modules, keyboard shortcuts,
 * and control-panel toggles are all declared as configuration arrays,
 * then wired up by generic loops. Adding a new toggle or shortcut is
 * a one-line table entry instead of 10+ lines of imperative wiring.
 */

import { State } from './state.js';
import { Aurora } from './aurora.js';
import { Glyphs } from './glyphs.js';
import { AudioFX } from './audiofx.js';
import { Boot } from './boot.js';
import { Login } from './login.js';
import { Modal } from './modal.js';
import { Desktop } from './desktop.js';
import { CommandPalette } from './command-palette.js';
import { ShortcutsOverlay } from './shortcuts-overlay.js';
import { Notify } from './notifications.js';
import { Parallax } from './parallax.js';

/* ── Visual module registry ────────────────────────────────────────
 * Each entry drives: module.init(), module.setEnabled(), and a
 * state-event listener — all from a single declarative row.        */
const VISUAL_MODULES = [
    { module: Aurora,  stateKey: 'auroraEnabled', event: 'aurora' },
    { module: Glyphs,  stateKey: 'glyphsEnabled', event: 'glyphs' },
    { module: AudioFX, stateKey: 'soundEnabled',  event: 'sound' },
];

/* ── Keyboard shortcut table ───────────────────────────────────────
 * key → { toggle, label } — looked up on (Cmd|Alt)+key press.     */
const SHORTCUT_MAP = {
    c: { toggle: () => State.toggleCursorTrail(), label: () => `Cursor trail ${State.cursorTrailEnabled ? 'ON' : 'OFF'}` },
    s: { toggle: () => State.toggleSound(),       label: () => `Sound ${State.soundEnabled ? 'ON' : 'OFF'}` },
    i: { toggle: () => State.toggleInteractions(), label: () => `Interactions ${State.interactionsEnabled ? 'ON' : 'OFF'}` },
    p: { toggle: () => document.getElementById('controlPanelBtn')?.click() },
};

/* ── Control panel toggle definitions ──────────────────────────────
 * Drives both DOM generation and click-handler wiring.             */
const CONTROL_TOGGLES = [
    { id: 'toggle-cursor-trail', label: 'Cursor Trail', toggle: () => State.toggleCursorTrail(), stateKey: 'cursorTrailEnabled' },
    { id: 'toggle-sound',        label: 'Sound',        toggle: () => State.toggleSound(),       stateKey: 'soundEnabled' },
    { id: 'toggle-interactions',  label: 'Interactions', toggle: () => State.toggleInteractions(), stateKey: 'interactionsEnabled' },
];

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Initialize application
 */
async function init() {
    const params = new URLSearchParams(location.search);
    const safeMode = params.get('safe') === '1';

    // Initialize FX layer (lazy-load only if enabled)
    if (!safeMode && State.fxEnabled) {
        const { FX } = await import('./fx.js');
        FX.init();
        FX.setEnabled(true);
        window.__FX = FX;
        document.addEventListener('state:fx', (e) => FX.setEnabled(e.detail.enabled));
    }

    // Initialize visual modules from registry
    for (const { module, stateKey, event } of VISUAL_MODULES) {
        module.init();
        module.setEnabled(safeMode ? false : State[stateKey]);
        document.addEventListener(`state:${event}`, (e) => module.setEnabled(e.detail.enabled));
    }

    // Initialize Interaction Engine — always load modules so event-driven
    // features (easter eggs) work even if the animation loop is off
    if (!safeMode && sessionStorage.getItem('digivice-intro-seen')) {
        const { InteractionEngine } = await import('./interactions/engine.js');
        await InteractionEngine.init({ startLoop: State.interactionsEnabled });
        window.__InteractionEngine = InteractionEngine;
        document.addEventListener('state:interactions', (e) => InteractionEngine.setEnabled(e.detail.enabled));
        document.addEventListener('state:cursorTrail', (e) => InteractionEngine.cursorTrail?.setEnabled(e.detail.enabled));
        document.addEventListener('state:cursorTrailType', (e) => InteractionEngine.cursorTrail?.setType(e.detail.type));
        Desktop.setupEasterEggHooks();
    }

    // Initialize Modal system
    Modal.init();

    // Initialize Command Palette (Cmd+K / Ctrl+K)
    CommandPalette.init();

    // Initialize Shortcuts Overlay (press ?)
    ShortcutsOverlay.init();

    // Defer galaxy on first visit — GPU contention blocks video intro decode
    if (!safeMode && sessionStorage.getItem('digivice-intro-seen')) {
        try {
            const { initGalaxyBackground } = await import('./galaxy-background.js');
            const galaxyInstance = initGalaxyBackground(document.body, {
                starCount: 150,
                nebulaSpeed: 0.00025,
                starDriftSpeed: 0.0003,
                mouseInfluence: 0.015
            });
            document.body.classList.add('galaxy-active', 'galaxy-container');
            window.__galaxyInstance = galaxyInstance;
        } catch (err) {
            console.warn('[Main] Galaxy background failed, Login will retry:', err);
        }
    }

    // Initialize parallax depth layers (lock screen + desktop)
    if (!safeMode && sessionStorage.getItem('digivice-intro-seen')) {
        Parallax.init();
    }

    // Direct-access routes skip boot/lock entirely (e.g. /services for prospects)
    const directAccessRoutes = ['/services'];
    const isDirectAccess = directAccessRoutes.includes(window.location.pathname);

    if (isDirectAccess) {
        Login.skipToDesktop();
    } else if (!safeMode && sessionStorage.getItem('digivice-intro-seen')) {
        Boot.start(() => Login.init());
    } else {
        Login.init();
    }

    // Register service worker (production only — Vite dev server transforms
    // CSS into JS modules, and SW cache-first strategy poisons the cache)
    if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => { });
        });
    }

    recoverStyles();
    initShortcuts();
    setTimeout(initControlPanel, 1000);

    // Global error handlers
    window.addEventListener('error', (e) => console.error('Global error:', e.error));
    window.addEventListener('unhandledrejection', (e) => console.error('Unhandled promise rejection:', e.reason));

    // Resize handler — clamp windows that drift off-screen
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const maxX = window.innerWidth - 100;
            const maxY = window.innerHeight - 100;
            for (const win of State.getAllWindows()) {
                if (!win.element || win.maximized) continue;
                if (win.x > maxX) { win.x = maxX; win.element.style.left = `${win.x}px`; }
                if (win.y > maxY) { win.y = maxY; win.element.style.top = `${win.y}px`; }
            }
        }, 250);
    });
}

/* ── Style recovery ────────────────────────────────────────────────
 * Detects missing critical stylesheets (Vite HMR race, bad cache)
 * and force-injects them as a recovery fallback.                   */
const CRITICAL_STYLES = ['css/reset.css', 'css/variables.css', 'css/styles.css', 'css/windows.css', 'css/modal.css', 'css/loading.css'];

function recoverStyles() {
    setTimeout(() => {
        const hasOurStyles = Array.from(document.styleSheets).some(sheet => {
            try { return sheet.href && (sheet.href.includes('styles.css') || sheet.href.includes('windows.css')); }
            catch { return false; }
        });
        if (hasOurStyles) return;

        console.warn('Critical styles missing. Activating Safe Mode...');
        const bust = Date.now();
        for (const href of CRITICAL_STYLES) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${href}?t=${bust}`;
            document.head.appendChild(link);
        }
        document.body.classList.add('recovered-mode');
    }, 1000);
}

/* ── Keyboard shortcuts (Cmd on Mac, Alt on Windows/Linux) ─────── */
function initShortcuts() {
    const isMac = navigator.platform.toUpperCase().includes('MAC');

    document.addEventListener('keydown', (e) => {
        const mod = isMac ? e.metaKey : e.altKey;
        const noOtherMods = !e.shiftKey && !(isMac ? e.altKey : e.metaKey) && !e.ctrlKey;
        if (!mod || !noOtherMods) return;

        const entry = SHORTCUT_MAP[e.key.toLowerCase()];
        if (!entry) return;

        entry.toggle();
        if (entry.label) Notify.info(entry.label());
        e.preventDefault();
    });
}

/* ── Control panel dropdown ────────────────────────────────────── */
function initControlPanel() {
    const btn = document.getElementById('controlPanelBtn');
    if (!btn) return;

    const panel = document.createElement('div');
    panel.className = 'control-panel-dropdown';
    panel.innerHTML = `
        <div class="control-panel-header">\u2699 QUICK SETTINGS</div>
        ${CONTROL_TOGGLES.map(t => `
            <div class="control-panel-item">
                <span class="control-panel-label">${t.label}</span>
                <div class="mini-toggle" id="${t.id}"></div>
            </div>
        `).join('')}
    `;
    document.body.appendChild(panel);

    function syncToggles() {
        for (const t of CONTROL_TOGGLES) {
            document.getElementById(t.id)?.classList.toggle('active', State[t.stateKey]);
        }
    }

    btn.addEventListener('click', () => { panel.classList.toggle('active'); syncToggles(); });
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('active');
    });

    for (const t of CONTROL_TOGGLES) {
        document.getElementById(t.id)?.addEventListener('click', () => { t.toggle(); syncToggles(); });
    }
}
