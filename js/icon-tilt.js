/**
 * Icon Tilt — 3D perspective tilt for desktop icons
 * Mouse-tracked gyroscopic effect: icons tilt toward the cursor
 * with an inner light bloom that follows the tilt angle.
 *
 * Phase 1 of the Alien Tech Upgrade plan.
 */

import { prefersReducedMotion, getElementCenter } from './dom-helpers.js';

const MAX_TILT = 18; // degrees

function handleMove(e) {
    if (prefersReducedMotion()) return;
    const box = e.currentTarget;
    const { x: cx, y: cy } = getElementCenter(box);
    const rect = box.getBoundingClientRect();

    // Normalize cursor position to -1…1 relative to center
    const nx = (e.clientX - cx) / (rect.width / 2);
    const ny = (e.clientY - cy) / (rect.height / 2);

    // Tilt: Y-axis follows horizontal mouse, X-axis follows vertical (inverted)
    const tiltY = nx * MAX_TILT;
    const tiltX = -ny * MAX_TILT;

    box.style.setProperty('--tilt-x', `${tiltX}deg`);
    box.style.setProperty('--tilt-y', `${tiltY}deg`);

    // Light bloom position (opposite of tilt for realism)
    box.style.setProperty('--bloom-x', `${50 + nx * 30}%`);
    box.style.setProperty('--bloom-y', `${50 + ny * 30}%`);
}

function handleLeave(e) {
    const box = e.currentTarget;
    box.style.setProperty('--tilt-x', '0deg');
    box.style.setProperty('--tilt-y', '0deg');
    box.style.setProperty('--bloom-x', '50%');
    box.style.setProperty('--bloom-y', '50%');
}

function attach(container) {
    const boxes = container.querySelectorAll('.desktop-icon-box');
    boxes.forEach((box) => {
        box.addEventListener('mousemove', handleMove);
        box.addEventListener('mouseleave', handleLeave);
    });
}

export const IconTilt = {
    init() {
        const container = document.querySelector('.desktop-icons');
        if (!container) return;

        // Attach to existing icons
        attach(container);

        // Watch for dynamically added icons
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        const box = node.classList?.contains('desktop-icon-box')
                            ? node
                            : node.querySelector?.('.desktop-icon-box');
                        if (box) {
                            box.addEventListener('mousemove', handleMove);
                            box.addEventListener('mouseleave', handleLeave);
                        }
                    }
                }
            }
        });
        observer.observe(container, { childList: true, subtree: true });
    },
};
