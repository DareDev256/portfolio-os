/**
 * Spectral Echo — Window Materialization Burst
 *
 * When a window opens and becomes visible, a gold/amethyst border
 * outline expands outward from the window bounds and fades —
 * like a holographic interface powering up in Stark's lab.
 *
 * Uses MutationObserver on #windowsContainer to detect new windows
 * gaining the `.visible` class. Each burst is a single disposable
 * div with a CSS animation, auto-removed on completion.
 *
 * Desktop-only (skipped on mobile / reduced-motion).
 */

import { prefersReducedMotion } from './dom-helpers.js';

const ECHO_LIFETIME_MS = 650;

/** Spawn a spectral echo at the given window's position and size. */
function spawnEcho(windowEl) {
    const rect = windowEl.getBoundingClientRect();

    const echo = document.createElement('div');
    echo.className = 'spectral-echo';
    echo.setAttribute('aria-hidden', 'true');
    echo.style.left   = `${rect.left}px`;
    echo.style.top    = `${rect.top}px`;
    echo.style.width  = `${rect.width}px`;
    echo.style.height = `${rect.height}px`;

    document.body.appendChild(echo);
    setTimeout(() => echo.remove(), ECHO_LIFETIME_MS);
}

export const SpectralEcho = {
    init() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        if (prefersReducedMotion()) return;

        const container = document.getElementById('windowsContainer');
        if (!container) return;

        // Watch for new .window elements gaining .visible
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type !== 'attributes' || m.attributeName !== 'class') continue;
                const el = m.target;
                if (
                    el.classList.contains('window') &&
                    el.classList.contains('visible') &&
                    !el.classList.contains('closing') &&
                    !el.dataset.echoFired
                ) {
                    el.dataset.echoFired = '1';
                    // Defer one frame so the window has its final position
                    requestAnimationFrame(() => spawnEcho(el));
                }
            }
        });

        observer.observe(container, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        });
    },
};
