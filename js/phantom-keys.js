/**
 * Phantom Keys — Holographic Keystroke Projections
 * Keystrokes on the desktop spawn brief, glowing characters that float
 * upward and dissolve — like Tony Stark's projected holographic keyboard.
 * Skipped inside inputs/textareas, on mobile, and for reduced-motion.
 */

import { shouldSkipDesktopEffects } from './dom-helpers.js';

const LIFETIME_MS  = 900;
const MAX_ACTIVE   = 6;
const COOLDOWN_MS  = 60;
const FONT_SIZE    = 28;

/** Characters currently animating — pool-limit prevents GPU overload */
let _activeCount = 0;
let _lastSpawn   = 0;

/** Hex strings for the two-tone glow palette */
const PALETTE = [
    '#d4af37',            // gold
    '#f5d76e',            // gold-light
    '#8b5cf6',            // amethyst
    'rgba(139,92,246,.7)' // amethyst-dim
];

function pickColor() {
    return PALETTE[(Math.random() * PALETTE.length) | 0];
}

/**
 * Determine spawn position — center-bottom of viewport with horizontal jitter,
 * mimicking a projected keyboard beneath the user's hands.
 */
function spawnPosition() {
    const cx = window.innerWidth / 2;
    const jitterX = (Math.random() - 0.5) * 320;
    const jitterY = (Math.random() - 0.5) * 40;
    return {
        x: cx + jitterX,
        y: window.innerHeight - 80 + jitterY,
    };
}

function spawn(char) {
    const now = Date.now();
    if (now - _lastSpawn < COOLDOWN_MS) return;
    if (_activeCount >= MAX_ACTIVE) return;
    _lastSpawn = now;

    const { x, y } = spawnPosition();
    const color = pickColor();

    const el = document.createElement('span');
    el.className = 'phantom-key';
    el.textContent = char;
    el.setAttribute('aria-hidden', 'true');

    // Randomize drift direction and distance
    const driftX = (Math.random() - 0.5) * 60;
    el.style.cssText = `
        left:${x}px;
        top:${y}px;
        color:${color};
        text-shadow: 0 0 8px ${color}, 0 0 20px ${color};
        font-size:${FONT_SIZE + (Math.random() * 8 - 4)}px;
        --drift-x:${driftX}px;
    `;

    document.body.appendChild(el);
    _activeCount++;

    setTimeout(() => {
        el.remove();
        _activeCount--;
    }, LIFETIME_MS);
}

/** Only fire on printable keys typed outside editable fields */
function isTypingTarget(el) {
    if (!el) return true;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    // Inside a window's editable region (notes, terminal input, etc.)
    if (el.closest('[contenteditable="true"]')) return true;
    return false;
}

export const PhantomKeys = {
    init() {
        if (shouldSkipDesktopEffects()) return;

        document.addEventListener('keydown', (e) => {
            if (isTypingTarget(e.target)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            // Only printable single characters
            if (e.key.length !== 1) return;

            spawn(e.key.toUpperCase());
        });
    },
};
