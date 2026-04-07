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
import { ScrollReveal } from './scroll-reveal.js';
import { IconTilt } from './icon-tilt.js';
import { ensureGalaxy } from './galaxy-init.js';
import { Achievements } from './achievements.js';
import { Gauntlet } from './gauntlet.js';
import { Whispers } from './whispers.js';
import { SonarPulse } from './sonar-pulse.js';
import { CatalystPulse } from './catalyst-pulse.js';
import { PhantomReticle } from './phantom-reticle.js';
import { GlitchText } from './glitch-text.js';
import { SpectralEcho } from './spectral-echo.js';
import { CipherDecode } from './cipher-decode.js';
import { NeuralLink } from './neural-link.js';
import { PulseGrid } from './pulse-grid.js';
import { AmbientDrift } from './ambient-drift.js';
import { CosmicDust } from './cosmic-dust.js';

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
    if (!safeMode) {
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

    // Initialize Achievement System (must be before Desktop.init fires boot-complete)
    Achievements.init();

    // Initialize Shortcuts Overlay (press ?)
    ShortcutsOverlay.init();

    // Defer galaxy on first visit — GPU contention blocks video intro decode
    if (!safeMode && sessionStorage.getItem('digivice-intro-seen')) {
        await ensureGalaxy(document.body);
    }

    // Initialize parallax depth layers (lock screen + desktop)
    if (!safeMode) {
        Parallax.init();
    }

    // Scroll-triggered reveals for window content
    ScrollReveal.init();
    Gauntlet.init();

    // 3D tilt on desktop icon hover (Phase 1 — Alien Tech Upgrade)
    IconTilt.init();

    // Ambient floating HUD data fragments on desktop
    if (!safeMode) Whispers.init();

    // Holographic sonar pulse on desktop clicks
    if (!safeMode) SonarPulse.init();

    // Catalyst Pulse — ambient breathing energy field on lock screen
    if (!safeMode) CatalystPulse.init();

    // Phantom Reticle — HUD targeting cursor overlay
    if (!safeMode) PhantomReticle.init();

    // Glitch Text — chromatic aberration on window title hover
    if (!safeMode) GlitchText.init();

    // Spectral Echo — materialization burst on window open
    if (!safeMode) SpectralEcho.init();

    // Cipher Decode — holographic code materialization on scroll reveal
    if (!safeMode) CipherDecode.init();

    // Neural Link — luminous connection traces between desktop icons
    if (!safeMode) NeuralLink.init();

    // Pulse Grid — reactive ambient floor grid on the desktop
    if (!safeMode) PulseGrid.init();

    // Ambient Drift — luminous floating orbs on the desktop
    if (!safeMode) AmbientDrift.init();

    // Cosmic Dust — faint twinkling star-field on the desktop
    if (!safeMode) CosmicDust.init();

    // Direct-access routes skip boot/lock entirely (e.g. /services for prospects)
    const directAccessRoutes = ['/services'];
    const isDirectAccess = directAccessRoutes.includes(window.location.pathname);

    if (isDirectAccess) {
        Login.skipToDesktop();
    } else if (!safeMode) {
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
