/**
 * Sonar Pulse — Holographic Click Ripple
 * Desktop clicks emit concentric gold/amethyst rings with HUD coordinate
 * readouts, evoking a Stark Industries targeting overlay.
 * Desktop-only (skipped on mobile / reduced-motion).
 */

const RING_COUNT   = 3;
const LIFETIME_MS  = 1600;
const SECTOR_TAGS  = ['SECTOR CLEAR', 'SIGNAL NOMINAL', 'FIELD STABLE', 'GRID LOCKED', 'PING OK'];

let _cooldown = false;

function randomTag() {
    return SECTOR_TAGS[(Math.random() * SECTOR_TAGS.length) | 0];
}

function spawn(x, y) {
    if (_cooldown) return;
    _cooldown = true;
    setTimeout(() => { _cooldown = false; }, 320);   // debounce rapid clicks

    const wrap = document.createElement('div');
    wrap.className = 'sonar-pulse';
    wrap.style.left = `${x}px`;
    wrap.style.top  = `${y}px`;

    // Concentric rings — alternate gold / amethyst
    for (let i = 0; i < RING_COUNT; i++) {
        const ring = document.createElement('div');
        ring.className = `sonar-ring sonar-ring--${i}`;
        wrap.appendChild(ring);
    }

    // Crosshair flash
    const cross = document.createElement('div');
    cross.className = 'sonar-cross';
    wrap.appendChild(cross);

    // HUD coordinate readout
    const hud = document.createElement('div');
    hud.className = 'sonar-hud';
    hud.textContent = `x:${x} y:${y} · ${randomTag()}`;
    wrap.appendChild(hud);

    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), LIFETIME_MS);
}

function isDesktopSurface(target) {
    if (!target) return false;
    return target.id === 'desktop'
        || target.classList.contains('desktop-icons')
        || target.classList.contains('bg-wheel-container');
}

export const SonarPulse = {
    init() {
        if (window.matchMedia('(pointer: coarse)').matches) return;      // mobile — skip
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        document.addEventListener('click', (e) => {
            if (!isDesktopSurface(e.target)) return;
            spawn(e.clientX, e.clientY);
        });
    },
};
