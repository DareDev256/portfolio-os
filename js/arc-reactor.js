/**
 * Arc Reactor — Stark Industries window focus effect
 *
 * Racing energy trace orbits the active window's titlebar border.
 * Corner energy nodes pulse at each vertex. The effect activates on
 * window focus and deactivates on blur, creating a sci-fi command
 * center feel when switching between application windows.
 *
 * Uses CSS @property for conic-gradient rotation — zero JS animation
 * loops. The JS layer only manages DOM decoration and class toggling.
 */

import { shouldSkipDesktopEffects, createDecorativeEl } from './dom-helpers.js';

const CORNERS = ['tl', 'tr', 'bl', 'br'];

/** @type {WeakSet<Element>} Windows that already have corner nodes injected */
const _decorated = new WeakSet();

/** @type {MutationObserver|null} */
let _observer = null;

/**
 * Inject corner energy nodes into a window element (idempotent).
 * @param {HTMLElement} win
 */
function decorateWindow(win) {
    if (_decorated.has(win)) return;

    for (const corner of CORNERS) {
        const node = createDecorativeEl('div', `arc-reactor-node arc-reactor-node--${corner}`);
        win.appendChild(node);
    }
    _decorated.add(win);
}

/**
 * Sync arc-reactor-on class to whichever window currently has .active.
 * Called on every class mutation inside the windows container.
 */
function syncActiveState() {
    const container = document.getElementById('windowsContainer');
    if (!container) return;

    const windows = container.querySelectorAll('.window');
    for (const win of windows) {
        const isActive = win.classList.contains('active');

        if (isActive) {
            decorateWindow(win);
            win.classList.add('arc-reactor-on');
        } else {
            win.classList.remove('arc-reactor-on');
        }
    }
}

/**
 * Initialize the Arc Reactor effect.
 * Observes the windows container for class changes on child windows.
 */
function init() {
    if (shouldSkipDesktopEffects()) return;

    const container = document.getElementById('windowsContainer');
    if (!container) return;

    // Decorate any windows already open
    syncActiveState();

    // Watch for class changes (focus/blur) and new windows (childList)
    _observer = new MutationObserver((mutations) => {
        let needsSync = false;
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                needsSync = true;
                break;
            }
            if (m.type === 'childList' && m.addedNodes.length > 0) {
                needsSync = true;
                break;
            }
        }
        if (needsSync) syncActiveState();
    });

    _observer.observe(container, {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        subtree: true,
    });
}

export const ArcReactor = { init };
