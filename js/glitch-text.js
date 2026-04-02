/**
 * Glitch Text — Controlled digital corruption on window titles
 *
 * Adds `data-text` attributes and the `.glitch-text` class to window
 * titles so CSS pseudo-elements can render chromatic aberration layers.
 * A MutationObserver auto-wires new windows as they're created.
 *
 * Respects prefers-reduced-motion — CSS disables animations, and
 * this module skips wiring entirely so no unnecessary DOM writes.
 */

import { prefersReducedMotion } from './dom-helpers.js';

const TITLE_SELECTOR = '.window-title';
const GLITCH_CLASS = 'glitch-text';

/** Wire a single title element with glitch attributes */
function wireTitle(el) {
    if (el.classList.contains(GLITCH_CLASS)) return;
    el.classList.add(GLITCH_CLASS);
    el.dataset.text = el.textContent;
}

/** Scan a subtree for unwired titles */
function wireAll(root = document) {
    for (const el of root.querySelectorAll(TITLE_SELECTOR)) wireTitle(el);
}

/** Keep data-text synced when title text changes (e.g. breadcrumb nav) */
function syncText(el) {
    if (el.dataset.text !== el.textContent) {
        el.dataset.text = el.textContent;
    }
}

let observer;

export const GlitchText = {
    init() {
        if (prefersReducedMotion()) return;

        wireAll();

        observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                // New nodes added — scan for titles
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.matches?.(TITLE_SELECTOR)) wireTitle(node);
                    else if (node.querySelectorAll) wireAll(node);
                }
                // Text content changed on an existing title
                if (m.type === 'characterData' || m.type === 'childList') {
                    const title = m.target.closest?.(TITLE_SELECTOR)
                        || m.target.parentElement?.closest?.(TITLE_SELECTOR);
                    if (title) syncText(title);
                }
            }
        });

        const container = document.getElementById('windowsContainer') || document.body;
        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    },
};
