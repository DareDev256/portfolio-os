/**
 * Main Entry Point
 * Initializes the application in the correct order
 */

import { State } from './state.js';
import { Sanitize } from './sanitize.js';
import { Aurora } from './aurora.js';
import { Glyphs } from './glyphs.js';
import { AudioFX } from './audiofx.js';
import { Boot } from './boot.js';
import { Login } from './login.js';
// import { Skills } from './skills.js'; // Removed old reference
import { WindowManager } from './windows.js'; // Imported for type safety/checking if needed, though logic is in Login
import { Modal } from './modal.js';
import { Welcome } from './welcome.js';

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
        // Store reference for keyboard toggle
        window.__FX = FX;
    }

    Aurora.init();
    Aurora.setEnabled(safeMode ? false : State.auroraEnabled);

    Glyphs.init();
    Glyphs.setEnabled(safeMode ? false : State.glyphsEnabled);

    AudioFX.init();
    // small boot chime when boot starts (after user gesture it will play)
    setTimeout(() => AudioFX.bootChime(), 500);

    // Initialize Modal system
    Modal.init();

    // Initialize Skills (Command Palette)
    // if (Skills) Skills.init();

    // Show splash/boot, then continue to login
    if (!safeMode) {
        Boot.start(() => Login.init());
    } else {
        Login.init();
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
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

    // Quick keyboard toggles if palette not handy (Alt+X/A/G/S)
    document.addEventListener('keydown', (e) => {
        if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
            const k = e.key.toLowerCase();
            if (k === 'x') {
                State.toggleFx();
                e.preventDefault();
            }
            if (k === 'a') {
                State.toggleAurora();
                e.preventDefault();
            }
            if (k === 'g') {
                State.toggleGlyphs();
                e.preventDefault();
            }
            if (k === 's') {
                State.toggleSound();
                e.preventDefault();
            }
        }
    });

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
