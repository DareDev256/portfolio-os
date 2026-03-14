/**
 * Scroll Reveal — Cinematic viewport-triggered animations for window content
 *
 * Uses IntersectionObserver to animate `.scroll-reveal` elements as they
 * enter scrollable `.window-content` containers. A MutationObserver on
 * #windowsContainer auto-wires new windows without manual hookup.
 *
 * Variants: data-reveal="fade-up" (default) | "fade-left" | "scale"
 * Stagger:  data-reveal-delay="0..6" (80ms increments)
 */

const OBSERVED_ROOTS = new WeakSet();
const ANIM_THRESHOLD = 0.15;

function createObserver(root) {
    return new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scroll-reveal--visible');
                }
            }
        },
        { root, threshold: ANIM_THRESHOLD },
    );
}

function observeChildren(container) {
    if (OBSERVED_ROOTS.has(container)) return;
    OBSERVED_ROOTS.add(container);

    const observer = createObserver(container);
    const targets = container.querySelectorAll('.scroll-reveal');
    targets.forEach((el) => observer.observe(el));

    // Watch for dynamically appended reveal targets inside this container
    const childWatcher = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.classList?.contains('scroll-reveal')) {
                    observer.observe(node);
                }
                node.querySelectorAll?.('.scroll-reveal').forEach((el) => observer.observe(el));
            }
        }
    });
    childWatcher.observe(container, { childList: true, subtree: true });
}

export const ScrollReveal = {
    init() {
        // Auto-wire existing and future windows
        const wc = document.getElementById('windowsContainer');
        if (!wc) return;

        // Catch windows that already exist
        wc.querySelectorAll('.window-content').forEach(observeChildren);

        // Watch for new windows being created
        const windowWatcher = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    const content = node.classList?.contains('window-content')
                        ? node
                        : node.querySelector?.('.window-content');
                    if (content) observeChildren(content);
                }
            }
        });
        windowWatcher.observe(wc, { childList: true, subtree: true });
    },

    /** Manually observe a specific scrollable container */
    observe(container) {
        if (container) observeChildren(container);
    },
};
