/**
 * Parallax Engine
 * Three modes:
 *   1) Lock screen — mouse-position depth layers on intro elements
 *   2) Lock screen — wheel-driven vertical parallax separation (cinematic depth pull)
 *   3) Desktop — window scroll drives subtle background shifts
 *
 * Ambient drift keeps the scene alive even without user interaction.
 * Respects prefers-reduced-motion and stays under 16ms/frame via rAF.
 */
import { isElementVisible, prefersReducedMotion } from './dom-helpers.js';

/* ── Layer config ─────────────────────────────────────────────────
 * z  = mouse-parallax intensity (fraction of viewport)
 * sz = scroll-parallax multiplier (px shift per unit of scroll)
 * Negative sz pulls layers *toward* the viewer on scroll-down.    */
const LOCK_LAYERS = [
    { sel: '.grid-background',    z: 0.015, sz:  40 },
    { sel: '.intro-watermark',    z: 0.035, sz: -25 },
    { sel: '.intro-title-block',  z: 0.020, sz: -50 },
    { sel: '.intro-identity',     z: 0.012, sz: -70 },
];

const BG_WHEEL_SEL = '.bg-wheel-container';
const LERP        = 0.08;  // Mouse smoothing — lower = silkier
const SCROLL_LERP = 0.06;  // Scroll smoothing — extra silk for cinematic feel
const DRIFT_AMP   = 0.003; // Ambient drift amplitude (fraction of viewport)
const DRIFT_SPEED  = 0.0004; // Ambient oscillation speed
const SCROLL_CLAMP = 1;    // Max normalized scroll accumulator (±1)
const SCROLL_DECAY = 0.97; // Scroll momentum decay per frame (0–1)
const SCROLL_SENS  = 0.003; // Wheel deltaY → normalized scroll conversion

/** Linearly interpolate toward target */
function lerp(current, target, factor) {
    return current + (target - current) * factor;
}

/** Clamp value between min and max */
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export const Parallax = {
    _raf: null,
    _mouseX: 0,
    _mouseY: 0,
    _currX: 0,
    _currY: 0,
    _scrollTarget: 0,    // Raw scroll accumulator (wheel-driven)
    _scrollCurr: 0,      // Smoothed scroll value
    _windowShift: 0,     // Desktop window-content scroll
    _windowShiftCurr: 0,
    _active: false,
    _lockEls: [],
    _bgWheel: null,
    _observer: null,
    _startTime: 0,

    init() {
        if (prefersReducedMotion()) return;

        this._bgWheel = document.querySelector(BG_WHEEL_SEL);
        this._startTime = performance.now();
        this._cacheLockElements();
        this._bindMouse();
        this._bindLockWheel();
        this._bindWindowScroll();
        this._active = true;
        this._tick();
    },

    _cacheLockElements() {
        this._lockEls = LOCK_LAYERS.map(layer => ({
            ...layer,
            el: document.querySelector(layer.sel),
        })).filter(l => l.el);
    },

    _bindMouse() {
        document.addEventListener('mousemove', (e) => {
            this._mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            this._mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });
    },

    /** Wheel events on lock screen → vertical depth separation */
    _bindLockWheel() {
        const lockEl = document.getElementById('lockScreen');
        if (!lockEl) return;
        lockEl.addEventListener('wheel', (e) => {
            this._scrollTarget = clamp(
                this._scrollTarget + e.deltaY * SCROLL_SENS,
                -SCROLL_CLAMP, SCROLL_CLAMP,
            );
        }, { passive: true });
    },

    _bindWindowScroll() {
        const handler = (e) => {
            const el = e.target;
            const maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll > 0) {
                this._windowShift = el.scrollTop / maxScroll;
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

        document.querySelectorAll('.window-content').forEach(wc => {
            wc.addEventListener('scroll', handler, { passive: true });
            wc.__parallaxBound = true;
        });

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

    _tick() {
        if (!this._active) return;

        const t = performance.now() - this._startTime;

        // Smooth interpolation
        this._currX = lerp(this._currX, this._mouseX, LERP);
        this._currY = lerp(this._currY, this._mouseY, LERP);
        this._scrollCurr = lerp(this._scrollCurr, this._scrollTarget, SCROLL_LERP);
        this._windowShiftCurr = lerp(this._windowShiftCurr, this._windowShift, LERP);

        // Scroll momentum decay — slowly return to center when not scrolling
        this._scrollTarget *= SCROLL_DECAY;

        // Ambient drift — gentle sine oscillation keeps the scene alive
        const driftX = Math.sin(t * DRIFT_SPEED) * DRIFT_AMP;
        const driftY = Math.cos(t * DRIFT_SPEED * 0.7) * DRIFT_AMP * 0.6;

        // --- Lock screen parallax (mouse + scroll + drift) ---
        const lockEl = document.getElementById('lockScreen');
        const lockVisible = lockEl ? isElementVisible(lockEl) : false;

        if (lockVisible) {
            for (const { el, z, sz } of this._lockEls) {
                const mx = (this._currX + driftX) * z * window.innerWidth;
                const my = (this._currY + driftY) * z * window.innerHeight;
                const scrollY = this._scrollCurr * sz;
                el.style.translate = `${mx.toFixed(1)}px ${(my + scrollY).toFixed(1)}px`;
            }
        }

        // --- Background wheel (desktop scroll + mouse + drift) ---
        if (this._bgWheel) {
            const scrollY = this._windowShiftCurr * -30;
            const mouseX = (this._currX + driftX) * 8;
            const mouseY = (this._currY + driftY) * 8;
            this._bgWheel.style.translate =
                `calc(-50% + ${mouseX.toFixed(1)}px) calc(-50% + ${(scrollY + mouseY).toFixed(1)}px)`;
        }

        this._raf = requestAnimationFrame(() => this._tick());
    },

    destroy() {
        this._active = false;
        if (this._raf) cancelAnimationFrame(this._raf);
        if (this._observer) this._observer.disconnect();
        this._lockEls.forEach(({ el }) => { el.style.translate = ''; });
        if (this._bgWheel) this._bgWheel.style.translate = '';
    },
};
