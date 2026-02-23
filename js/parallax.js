/**
 * Parallax Engine
 * Two modes:
 *   1) Lock screen — mouse-position depth layers on intro elements
 *   2) Desktop — window scroll drives subtle background shifts
 *
 * Respects prefers-reduced-motion and stays under 16ms/frame via rAF.
 */

const LOCK_LAYERS = [
    { sel: '.grid-background',    z: 0.015, prop: 'translate' },
    { sel: '.intro-watermark',    z: 0.035, prop: 'translate' },
    { sel: '.intro-title-block',  z: 0.020, prop: 'translate' },
    { sel: '.intro-identity',     z: 0.012, prop: 'translate' },
];

const BG_WHEEL_SEL = '.bg-wheel-container';
const LERP = 0.08; // Smoothing factor — lower = silkier

/** Linearly interpolate toward target */
function lerp(current, target, factor) {
    return current + (target - current) * factor;
}

export const Parallax = {
    _raf: null,
    _mouseX: 0,
    _mouseY: 0,
    _currX: 0,
    _currY: 0,
    _scrollShift: 0,
    _currShift: 0,
    _active: false,
    _reduced: false,
    _lockEls: [],
    _bgWheel: null,
    _observer: null,

    init() {
        // Respect accessibility
        this._reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (this._reduced) return;

        this._bgWheel = document.querySelector(BG_WHEEL_SEL);
        this._cacheLockElements();
        this._bindMouse();
        this._bindWindowScroll();
        this._active = true;
        this._tick();
    },

    /** Cache lock screen element references */
    _cacheLockElements() {
        this._lockEls = LOCK_LAYERS.map(layer => ({
            ...layer,
            el: document.querySelector(layer.sel),
        })).filter(l => l.el);
    },

    /** Mouse tracking for lock screen depth */
    _bindMouse() {
        document.addEventListener('mousemove', (e) => {
            // Normalize to -1…1 from viewport center
            this._mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            this._mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });
    },

    /**
     * Observe scroll inside every .window-content.
     * Uses a MutationObserver to catch dynamically-created windows.
     */
    _bindWindowScroll() {
        const handler = (e) => {
            const el = e.target;
            const maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll > 0) {
                // Normalize 0…1
                this._scrollShift = el.scrollTop / maxScroll;
            }
        };

        const attach = (node) => {
            if (node.nodeType !== 1) return;
            const targets = node.matches?.('.window-content')
                ? [node]
                : Array.from(node.querySelectorAll?.('.window-content') || []);
            targets.forEach(wc => {
                if (!wc.__parallaxBound) {
                    wc.addEventListener('scroll', handler, { passive: true });
                    wc.__parallaxBound = true;
                }
            });
        };

        // Attach to existing windows
        document.querySelectorAll('.window-content').forEach(wc => {
            wc.addEventListener('scroll', handler, { passive: true });
            wc.__parallaxBound = true;
        });

        // Watch for new windows
        this._observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                m.addedNodes.forEach(attach);
            }
        });
        const container = document.getElementById('windowsContainer');
        if (container) {
            this._observer.observe(container, { childList: true, subtree: true });
        }
    },

    /** Main animation loop */
    _tick() {
        if (!this._active) return;

        // Smooth interpolation toward target
        this._currX = lerp(this._currX, this._mouseX, LERP);
        this._currY = lerp(this._currY, this._mouseY, LERP);
        this._currShift = lerp(this._currShift, this._scrollShift, LERP);

        // --- Lock screen layers (mouse-driven depth) ---
        const lockVisible = document.getElementById('lockScreen')?.offsetParent !== null
            || !document.getElementById('lockScreen')?.classList.contains('hidden');

        if (lockVisible) {
            for (const { el, z } of this._lockEls) {
                const dx = this._currX * z * window.innerWidth;
                const dy = this._currY * z * window.innerHeight;
                // Preserve any existing transform by composing translate
                el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
            }
        }

        // --- Background wheel (scroll-driven shift) ---
        if (this._bgWheel) {
            // Subtle vertical drift + mouse influence when on desktop
            const scrollY = this._currShift * -30; // max 30px upward shift
            const mouseInfluenceX = this._currX * 8;
            const mouseInfluenceY = this._currY * 8;
            this._bgWheel.style.translate =
                `calc(-50% + ${mouseInfluenceX.toFixed(1)}px) calc(-50% + ${(scrollY + mouseInfluenceY).toFixed(1)}px)`;
        }

        this._raf = requestAnimationFrame(() => this._tick());
    },

    /** Clean up */
    destroy() {
        this._active = false;
        if (this._raf) cancelAnimationFrame(this._raf);
        if (this._observer) this._observer.disconnect();
        // Reset transforms
        this._lockEls.forEach(({ el }) => { el.style.translate = ''; });
        if (this._bgWheel) this._bgWheel.style.translate = '';
    },
};
