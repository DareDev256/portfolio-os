/**
 * Catalyst Pulse — ambient breathing energy field on lock screen
 *
 * Renders a gold-core / amethyst-halo radial glow behind the hero
 * wheel that intensifies when the cursor approaches center.
 * Injects its own DOM into #lockScreen on init, tears down cleanly.
 *
 * Respects prefers-reduced-motion (skips mouse tracking, keeps static glow).
 */
import { prefersReducedMotion, createDecorativeEl } from './dom-helpers.js';

const PROXIMITY_THRESHOLD = 0.35; // fraction of viewport diagonal

export const CatalystPulse = {
    _container: null,
    _lockScreen: null,
    _intense: false,
    _bound: null,

    init() {
        this._lockScreen = document.getElementById('lockScreen');
        if (!this._lockScreen) return;

        // Build DOM
        const frag = document.createDocumentFragment();
        const wrap = createDecorativeEl('div', 'catalyst-pulse');

        wrap.innerHTML =
            '<div class="catalyst-halo"></div>' +
            '<div class="catalyst-core"></div>' +
            '<div class="catalyst-circuit"></div>' +
            '<div class="catalyst-bracket catalyst-bracket--tl"></div>' +
            '<div class="catalyst-bracket catalyst-bracket--tr"></div>' +
            '<div class="catalyst-bracket catalyst-bracket--bl"></div>' +
            '<div class="catalyst-bracket catalyst-bracket--br"></div>';

        frag.appendChild(wrap);
        // Insert as first child so it sits behind intro-stage content
        this._lockScreen.insertBefore(frag, this._lockScreen.firstChild);
        this._container = wrap;

        // Mouse proximity tracking (skip if reduced motion)
        if (!prefersReducedMotion()) {
            this._bound = this._onMouseMove.bind(this);
            this._lockScreen.addEventListener('mousemove', this._bound, { passive: true });
        }
    },

    _onMouseMove(e) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const diag = Math.sqrt(cx * cx + cy * cy);
        const ratio = dist / diag;

        const shouldIntensify = ratio < PROXIMITY_THRESHOLD;
        if (shouldIntensify !== this._intense) {
            this._intense = shouldIntensify;
            this._container.classList.toggle('catalyst--intense', shouldIntensify);
        }
    },

    destroy() {
        if (this._bound && this._lockScreen) {
            this._lockScreen.removeEventListener('mousemove', this._bound);
        }
        this._container?.remove();
        this._container = null;
        this._lockScreen = null;
    },
};
