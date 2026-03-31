/**
 * Phantom Reticle — HUD Targeting Cursor Overlay
 *
 * A persistent geometric reticle that follows the cursor with elastic
 * spring easing. When hovering interactive elements (dock items, desktop
 * icons, buttons), it "locks on" by snapping to the element center and
 * shifting from gold to amethyst. Clicks trigger a brief pulse ring.
 *
 * Think Iron Man's targeting HUD meets Prince's gold/purple palette.
 */

import { prefersReducedMotion, isPageHidden } from './dom-helpers.js';

/** Selectors that count as "lockable" interactive targets */
const LOCK_TARGETS = [
    '.dock-item', '.desktop-icon', '.cyber-button',
    '.window .titlebar-btn', '.context-menu-item',
    '.control-panel-icon', '.top-bar .status-item',
].join(',');

export const PhantomReticle = {
    el: null,
    ring: null,
    _raf: 0,
    _mx: 0, _my: 0,       // mouse position
    _rx: 0, _ry: 0,        // reticle position (smoothed)
    _vx: 0, _vy: 0,        // velocity for spring physics
    _locked: false,
    _scale: 1,
    _alive: false,

    /* ── Spring physics constants ── */
    STIFFNESS: 0.12,
    DAMPING: 0.72,

    init() {
        if (prefersReducedMotion()) return;

        // Create reticle DOM
        this.el = document.createElement('div');
        this.el.className = 'phantom-reticle';
        this.el.setAttribute('aria-hidden', 'true');
        this.el.innerHTML =
            '<div class="pr-crosshair pr-h"></div>' +
            '<div class="pr-crosshair pr-v"></div>' +
            '<div class="pr-ring"></div>' +
            '<div class="pr-dot"></div>' +
            '<div class="pr-pulse-ring"></div>';
        document.body.appendChild(this.el);

        this.ring = this.el.querySelector('.pr-pulse-ring');

        // Bind events
        window.addEventListener('mousemove', this._onMove.bind(this), { passive: true });
        window.addEventListener('mousedown', this._onDown.bind(this));
        window.addEventListener('mouseleave', () => { this.el.classList.add('pr-hidden'); });
        window.addEventListener('mouseenter', () => { this.el.classList.remove('pr-hidden'); });

        // Start hidden until first mouse move
        this.el.classList.add('pr-hidden');
        this._alive = true;
        this._tick();
    },

    _onMove(e) {
        this._mx = e.clientX;
        this._my = e.clientY;
        this.el.classList.remove('pr-hidden');

        // Check lock target
        const target = e.target.closest?.(LOCK_TARGETS);
        if (target) {
            const r = target.getBoundingClientRect();
            this._mx = r.left + r.width / 2;
            this._my = r.top + r.height / 2;
            this._scale = Math.max(r.width, r.height) / 36;
            if (!this._locked) this.el.classList.add('pr-locked');
            this._locked = true;
        } else {
            if (this._locked) this.el.classList.remove('pr-locked');
            this._locked = false;
            this._scale = 1;
        }
    },

    _onDown() {
        // Pulse animation
        this.ring.classList.remove('pr-pulse');
        // Force reflow to restart animation
        void this.ring.offsetWidth;
        this.ring.classList.add('pr-pulse');
    },

    _tick() {
        if (!this._alive) return;
        this._raf = requestAnimationFrame(() => this._tick());
        if (isPageHidden()) return;

        // Spring physics: acceleration toward target
        const dx = this._mx - this._rx;
        const dy = this._my - this._ry;
        this._vx += dx * this.STIFFNESS;
        this._vy += dy * this.STIFFNESS;
        this._vx *= this.DAMPING;
        this._vy *= this.DAMPING;
        this._rx += this._vx;
        this._ry += this._vy;

        // Apply transform (translate + scale for lock-on sizing)
        const s = this._locked
            ? 1 + (this._scale - 1) * 0.4  // partial scale toward target size
            : 1;
        this.el.style.transform =
            `translate(${this._rx}px, ${this._ry}px) scale(${s})`;
    },

    destroy() {
        this._alive = false;
        cancelAnimationFrame(this._raf);
        this.el?.remove();
    },
};
