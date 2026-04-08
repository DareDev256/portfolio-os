/**
 * Holographic Card Tilt
 * 3D perspective tilt + holographic light sweep on project cards.
 * Uses event delegation — works with dynamically rendered cards.
 */
import { prefersReducedMotion } from './dom-helpers.js';

const SELECTOR = '.project-card';
const MAX_TILT = 8;           // degrees
const LIGHT_RADIUS = 260;     // px — holographic spotlight size
const TRANSITION_OUT = 'transform 0.5s var(--ease-decel), --holo-opacity 0.3s';

export const HoloTilt = {
    /** @type {HTMLElement|null} */
    _activeCard: null,

    init() {
        if (prefersReducedMotion()) return;

        document.addEventListener('mousemove', this._onMove.bind(this), { passive: true });
        document.addEventListener('mouseleave', this._onLeave.bind(this), true);
    },

    _onMove(e) {
        const card = e.target.closest(SELECTOR);
        if (!card) {
            if (this._activeCard) this._reset(this._activeCard);
            return;
        }

        this._activeCard = card;
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // Normalize cursor offset to [-1, 1]
        const nx = (e.clientX - cx) / (rect.width / 2);
        const ny = (e.clientY - cy) / (rect.height / 2);

        // Tilt: rotateY follows X-axis, rotateX inverted Y-axis
        const tiltX = -ny * MAX_TILT;
        const tiltY = nx * MAX_TILT;

        // Light position (relative to card, in px)
        const lx = e.clientX - rect.left;
        const ly = e.clientY - rect.top;

        card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
        card.style.setProperty('--holo-x', `${lx}px`);
        card.style.setProperty('--holo-y', `${ly}px`);
        card.style.setProperty('--holo-r', `${LIGHT_RADIUS}px`);
        card.style.setProperty('--holo-opacity', '1');
        card.style.transition = 'none';
    },

    _onLeave(e) {
        const card = e.target.closest(SELECTOR);
        if (!card) {
            // Cursor left a non-card element (e.g. leaving the viewport).
            // Reset any lingering active card.
            if (this._activeCard) this._reset(this._activeCard);
            return;
        }
        // Ignore mouseleave events between child elements within the same
        // card — only reset when the cursor actually exits the card boundary.
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;
        this._reset(card);
    },

    _reset(card) {
        card.style.transition = TRANSITION_OUT;
        card.style.transform = '';
        card.style.setProperty('--holo-opacity', '0');
        this._activeCard = null;
    },
};
