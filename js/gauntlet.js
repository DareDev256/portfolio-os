/**
 * Gauntlet — Cinematic scroll-triggered reveal for About window stages
 *
 * Observes `.gauntlet-reveal` elements inside scrollable `.window-content`
 * containers. When a stage enters the viewport it gets the `--visible`
 * class, triggering CSS perspective transforms and staggered child reveals.
 * Also drives the SVG signature stroke-draw animation.
 */

const OBSERVED = new WeakSet();
const THRESHOLD = 0.2;

function createObserver(root) {
    return new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('gauntlet-reveal--visible');
                    // Trigger signature draw if present inside this stage
                    const sig = entry.target.querySelector('.gauntlet-sig');
                    if (sig) sig.classList.add('gauntlet-sig--drawn');
                }
            }
        },
        { root, threshold: THRESHOLD },
    );
}

function wire(container) {
    if (OBSERVED.has(container)) return;
    OBSERVED.add(container);

    const observer = createObserver(container);
    container.querySelectorAll('.gauntlet-reveal').forEach((el) => observer.observe(el));

    // Watch for dynamically added reveal targets
    const watcher = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.classList?.contains('gauntlet-reveal')) observer.observe(node);
                node.querySelectorAll?.('.gauntlet-reveal').forEach((el) => observer.observe(el));
            }
        }
    });
    watcher.observe(container, { childList: true, subtree: true });
}

export const Gauntlet = {
    /** Auto-wire all current and future windows containing gauntlet stages */
    init() {
        const wc = document.getElementById('windowsContainer');
        if (!wc) return;

        wc.querySelectorAll('.window-content').forEach(wire);

        new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    const content = node.classList?.contains('window-content')
                        ? node
                        : node.querySelector?.('.window-content');
                    if (content) wire(content);
                }
            }
        }).observe(wc, { childList: true, subtree: true });
    },
};
