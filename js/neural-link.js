/**
 * Neural Link — Luminous connection traces between desktop icons
 *
 * When a desktop icon is hovered, thin energy lines trace from the
 * hovered icon to its 2–3 nearest neighbors — like neural pathways
 * firing in Stark's lab or synapses activating in a cybernetic brain.
 *
 * Lines use a stroke-dashoffset drawing animation with a gold→amethyst
 * gradient, fading out when hover ends. Desktop-only, respects
 * reduced-motion.
 */

import { shouldSkipDesktopEffects, prefersReducedMotion, createDecorativeEl, getElementCenter } from './dom-helpers.js';

const MAX_LINKS = 3;
const MAX_DISTANCE = 400;        // px — skip icons further than this
const DRAW_DURATION_MS = 350;
const FADE_DURATION_MS = 280;

let svgLayer = null;
let activeLines = [];
let currentTarget = null;

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Euclidean distance between two points. */
function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Create the SVG overlay layer (once). */
function ensureLayer() {
    if (svgLayer) return svgLayer;
    svgLayer = createDecorativeEl('svg', 'neural-link-layer', SVG_NS);

    // Gradient definition — gold → amethyst
    svgLayer.innerHTML = `<defs>
        <linearGradient id="nl-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--gold, #d4af37)" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="var(--amethyst, #8b5cf6)" stop-opacity="0.7"/>
        </linearGradient>
    </defs>`;

    document.body.appendChild(svgLayer);
    return svgLayer;
}

/** Draw a single animated line between two points. */
function drawLine(from, to) {
    const layer = ensureLayer();
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y);
    line.classList.add('neural-link-line');

    const length = dist(from, to);
    line.style.strokeDasharray = `${length}`;
    line.style.strokeDashoffset = `${length}`;

    layer.appendChild(line);

    // Trigger draw animation
    requestAnimationFrame(() => {
        line.style.transition = `stroke-dashoffset ${DRAW_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        line.style.strokeDashoffset = '0';
    });

    activeLines.push(line);
    return line;
}

/** Fade out and remove all active lines. */
function clearLines() {
    for (const line of activeLines) {
        line.style.transition = `opacity ${FADE_DURATION_MS}ms ease-out`;
        line.style.opacity = '0';
        setTimeout(() => line.remove(), FADE_DURATION_MS);
    }
    activeLines = [];
    currentTarget = null;
}

/** Handle icon hover — find nearest neighbors and draw links. */
function onIconEnter(e) {
    if (prefersReducedMotion()) return;

    const icon = e.currentTarget;
    if (icon === currentTarget) return;

    clearLines();
    currentTarget = icon;

    const allIcons = Array.from(document.querySelectorAll('.desktop-icon'));
    const origin = getElementCenter(icon.querySelector('.desktop-icon-box') || icon);

    // Compute distances to all other icons, sort, take closest
    const neighbors = allIcons
        .filter(ic => ic !== icon)
        .map(ic => ({ el: ic, pt: getElementCenter(ic.querySelector('.desktop-icon-box') || ic) }))
        .map(n => ({ ...n, d: dist(origin, n.pt) }))
        .filter(n => n.d < MAX_DISTANCE)
        .sort((a, b) => a.d - b.d)
        .slice(0, MAX_LINKS);

    for (const n of neighbors) {
        drawLine(origin, n.pt);
    }
}

function onIconLeave() {
    clearLines();
}

/** Wire hover listeners onto all desktop icons. */
function wireIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    for (const icon of icons) {
        icon.addEventListener('pointerenter', onIconEnter);
        icon.addEventListener('pointerleave', onIconLeave);
    }
}

export const NeuralLink = {
    init() {
        if (shouldSkipDesktopEffects()) return;

        // Icons may be rendered after init — use MutationObserver
        const container = document.querySelector('.desktop-icons');
        if (container) {
            wireIcons();
            const obs = new MutationObserver(() => wireIcons());
            obs.observe(container, { childList: true });
        }
    },
};
