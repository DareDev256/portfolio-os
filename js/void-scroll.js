/**
 * Void Scroll — Scroll-progress indicators for window content areas
 *
 * Each `.window-content` gains a thin neon bar at its top edge that
 * fills proportionally as the user scrolls — like a data-transfer
 * gauge in a sci-fi HUD.  Bars only appear when content is actually
 * scrollable, and fade out when the user scrolls back to the top.
 *
 * Uses MutationObserver to detect dynamically created windows
 * (the OS spawns them on demand), so no manual wiring is needed.
 */

import { prefersReducedMotion } from './dom-helpers.js';

/* ── State ─────────────────────────────────── */
const _tracked = new WeakSet();

/* ── Core: attach a progress bar to a scrollable window ──────────── */
function attachProgressBar(contentEl) {
    if (_tracked.has(contentEl)) return;
    _tracked.add(contentEl);

    // Only attach if there's overflow to scroll
    if (contentEl.scrollHeight <= contentEl.clientHeight) {
        // Re-check later — content may load async
        const recheck = new ResizeObserver(() => {
            if (contentEl.scrollHeight > contentEl.clientHeight) {
                recheck.disconnect();
                inject(contentEl);
            }
        });
        recheck.observe(contentEl);
        return;
    }

    inject(contentEl);
}

function inject(contentEl) {
    const bar = document.createElement('div');
    bar.className = 'void-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');

    // Ensure parent can anchor the absolute bar
    const pos = getComputedStyle(contentEl).position;
    if (pos === 'static') contentEl.style.position = 'relative';

    contentEl.prepend(bar);

    // Scroll handler — updates bar width
    let ticking = false;
    contentEl.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateBar(contentEl, bar);
            ticking = false;
        });
    }, { passive: true });

    // Initial state
    updateBar(contentEl, bar);
}

function updateBar(el, bar) {
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
        bar.style.width = '0%';
        bar.classList.remove('active');
        return;
    }

    const pct = (el.scrollTop / maxScroll) * 100;
    bar.style.width = `${pct}%`;

    // Show bar only when scrolled past the very top
    if (pct > 0.5) {
        bar.classList.add('active');
    } else {
        bar.classList.remove('active');
    }
}

/* ── Observer: detect new windows as they appear ─────────────────── */
function observeNewWindows() {
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;

                // The added node itself might be a window-content
                if (node.classList?.contains('window-content')) {
                    attachProgressBar(node);
                }

                // Or it might contain window-content children
                const children = node.querySelectorAll?.('.window-content');
                if (children) {
                    for (const child of children) attachProgressBar(child);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

/* ── Public API ────────────────────────────── */
export const VoidScroll = {
    init() {
        // Scrollbar CSS applies globally; progress bars need JS
        if (prefersReducedMotion()) return;

        // Attach to any existing windows
        for (const el of document.querySelectorAll('.window-content')) {
            attachProgressBar(el);
        }

        // Watch for future windows
        observeNewWindows();
    },
};
