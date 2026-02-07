/**
 * Main Entry Point
 * Initializes the application in the correct order
 */

import { State } from './state.js';
import { Aurora } from './aurora.js';
import { Glyphs } from './glyphs.js';
import { AudioFX } from './audiofx.js';
import { Boot } from './boot.js';
import { Login } from './login.js';
import { Modal } from './modal.js';
import { Desktop } from './desktop.js';

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
    // State is already initialized via its own script (it runs on import)

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

    Aurora.init();
    Aurora.setEnabled(safeMode ? false : State.auroraEnabled);
    document.addEventListener('state:aurora', (e) => Aurora.setEnabled(e.detail.enabled));

    Glyphs.init();
    Glyphs.setEnabled(safeMode ? false : State.glyphsEnabled);
    document.addEventListener('state:glyphs', (e) => Glyphs.setEnabled(e.detail.enabled));

    AudioFX.init();
    document.addEventListener('state:sound', (e) => AudioFX.setEnabled(e.detail.enabled));

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

    // Show splash/boot, then continue to login
    if (!safeMode) {
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

    // Fix for "wonky UI" - Safe Mode CSS Injection
    // Instead of reloading, we try to recover by re-injecting styles
    setTimeout(() => {
        const stylesheets = Array.from(document.styleSheets);
        const ourStyles = stylesheets.filter(sheet => {
            try {
                return sheet.href && (
                    sheet.href.includes('styles.css') ||
                    sheet.href.includes('windows.css')
                );
            } catch (e) { return false; }
        });

        if (ourStyles.length === 0) {
            console.warn('Critical styles missing. Activating Safe Mode...');

            // Force inject core styles
            const links = [
                'css/reset.css',
                'css/variables.css',
                'css/styles.css',
                'css/windows.css',
                'css/modal.css',
                'css/loading.css'
            ];

            links.forEach(href => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href + '?t=' + Date.now();
                document.head.appendChild(link);
            });

            // Add a class to body to indicate recovery
            document.body.classList.add('recovered-mode');
        }
    }, 1000);

    // Quick keyboard toggles (Cmd on Mac, Alt on Windows/Linux)
    document.addEventListener('keydown', (e) => {
        // Detect Mac vs Windows/Linux
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const correctModifier = isMac ? e.metaKey : e.altKey;
        const otherModifiers = !e.shiftKey && !(isMac ? e.altKey : e.metaKey) && !e.ctrlKey;

        if (correctModifier && otherModifiers) {
            const k = e.key.toLowerCase();
            if (k === 'c') {
                State.toggleCursorTrail();
                e.preventDefault();
            }
            if (k === 's') {
                State.toggleSound();
                e.preventDefault();
            }
            if (k === 'i') {
                State.toggleInteractions();
                e.preventDefault();
            }
            if (k === 'p') {
                const controlPanelBtn = document.getElementById('controlPanelBtn');
                if (controlPanelBtn) controlPanelBtn.click();
                e.preventDefault();
            }
        }
    });

    // Control Panel Toggle (waits for desktop to be visible)
    setTimeout(() => {
        const controlPanelBtn = document.getElementById('controlPanelBtn');
        if (!controlPanelBtn) return;

        const controlPanel = document.createElement('div');
        controlPanel.className = 'control-panel-dropdown';
        controlPanel.innerHTML = `
            <div class="control-panel-header">⚙ QUICK SETTINGS</div>
            <div class="control-panel-item">
                <span class="control-panel-label">Cursor Trail</span>
                <div class="mini-toggle" id="toggle-cursor-trail"></div>
            </div>
            <div class="control-panel-item">
                <span class="control-panel-label">Sound</span>
                <div class="mini-toggle" id="toggle-sound"></div>
            </div>
            <div class="control-panel-item">
                <span class="control-panel-label">Interactions</span>
                <div class="mini-toggle" id="toggle-interactions"></div>
            </div>
        `;
        document.body.appendChild(controlPanel);

        // Initialize toggle states
        function updateControlPanel() {
            const toggleCursorTrail = document.getElementById('toggle-cursor-trail');
            const toggleSound = document.getElementById('toggle-sound');
            const toggleInteractions = document.getElementById('toggle-interactions');

            if (toggleCursorTrail) toggleCursorTrail.classList.toggle('active', State.cursorTrailEnabled);
            if (toggleSound) toggleSound.classList.toggle('active', State.soundEnabled);
            if (toggleInteractions) toggleInteractions.classList.toggle('active', State.interactionsEnabled);
        }

        // Toggle visibility
        controlPanelBtn.addEventListener('click', () => {
            controlPanel.classList.toggle('active');
            updateControlPanel();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!controlPanel.contains(e.target) && e.target !== controlPanelBtn) {
                controlPanel.classList.remove('active');
            }
        });

        // Wire up toggles
        const toggleCursorTrail = document.getElementById('toggle-cursor-trail');
        const toggleSound = document.getElementById('toggle-sound');
        const toggleInteractions = document.getElementById('toggle-interactions');

        if (toggleCursorTrail) {
            toggleCursorTrail.addEventListener('click', () => {
                State.toggleCursorTrail();
                updateControlPanel();
            });
        }
        if (toggleSound) {
            toggleSound.addEventListener('click', () => {
                State.toggleSound();
                updateControlPanel();
            });
        }
        if (toggleInteractions) {
            toggleInteractions.addEventListener('click', () => {
                State.toggleInteractions();
                updateControlPanel();
            });
        }
    }, 1000);

    // Add global error handler
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
    });

    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
    });

    // Add resize handler to update window constraints
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Update any windows that might be out of bounds
            State.getAllWindows().forEach((win) => {
                if (!win.element || win.maximized) return;

                const maxX = window.innerWidth - 100;
                const maxY = window.innerHeight - 100;

                if (win.x > maxX) {
                    win.x = maxX;
                    win.element.style.left = `${win.x}px`;
                }

                if (win.y > maxY) {
                    win.y = maxY;
                    win.element.style.top = `${win.y}px`;
                }
            });
        }, 250);
    });
}
