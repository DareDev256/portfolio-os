/**
 * Dock Magnification — macOS-style proximity scaling
 *
 * Each dock icon swells based on cursor distance using a Gaussian falloff.
 * Neighboring icons scale proportionally, creating the signature fluid
 * magnification effect. Uses CSS transforms for GPU-accelerated rendering.
 */

const BASE_SCALE  = 1;
const MAX_SCALE   = 1.55;
const SPREAD      = 120;   // px — how far the magnification reaches
const LIFT_PX     = 14;    // max upward shift at peak magnification

// σ² for Gaussian: controls the "bell" width
const SIGMA_SQ = (SPREAD * SPREAD) / 4.5;

/** @type {HTMLElement|null} */
let dock = null;
/** @type {HTMLElement[]} */
let icons = [];
let active = false;
let rafId = 0;
let cursorX = 0;

function gaussian(distSq) {
    return Math.exp(-distSq / (2 * SIGMA_SQ));
}

function getIconCenterX(el) {
    const rect = el.getBoundingClientRect();
    return rect.left + rect.width / 2;
}

function applyMagnification() {
    for (const icon of icons) {
        const centerX = getIconCenterX(icon);
        const dist = cursorX - centerX;
        const factor = gaussian(dist * dist);
        const scale = BASE_SCALE + (MAX_SCALE - BASE_SCALE) * factor;
        const lift = LIFT_PX * factor;

        icon.style.transform = `translateY(-${lift}px) scale(${scale})`;
        icon.style.zIndex = Math.round(factor * 10);

        // Intensify glow on proximity
        const glowOpacity = 0.08 + factor * 0.25;
        icon.style.borderColor = `rgba(0, 240, 255, ${glowOpacity})`;
        if (factor > 0.3) {
            icon.style.boxShadow = `0 ${4 + lift}px ${12 + lift}px rgba(0, 0, 0, 0.35), 0 0 ${factor * 20}px rgba(0, 240, 255, ${factor * 0.2})`;
        } else {
            icon.style.boxShadow = '';
        }
    }
}

function onMouseMove(e) {
    cursorX = e.clientX;
    if (!active) {
        active = true;
        dock.classList.add('dock-magnifying');
    }
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(applyMagnification);
}

function resetIcons() {
    active = false;
    cancelAnimationFrame(rafId);
    dock?.classList.remove('dock-magnifying');
    for (const icon of icons) {
        icon.style.transform = '';
        icon.style.zIndex = '';
        icon.style.borderColor = '';
        icon.style.boxShadow = '';
    }
}

/**
 * Initialize dock magnification. Call after dock icons are rendered.
 */
export function initDockMagnify() {
    dock = document.querySelector('.taskbar.dock-style');
    if (!dock) return;

    icons = Array.from(dock.querySelectorAll('.dock-icon, .taskbar-window-btn'));
    if (icons.length === 0) return;

    dock.addEventListener('mousemove', onMouseMove);
    dock.addEventListener('mouseleave', resetIcons);

    // Refresh icon list when new windows open (taskbar buttons added)
    const observer = new MutationObserver(() => {
        icons = Array.from(dock.querySelectorAll('.dock-icon, .taskbar-window-btn'));
    });
    observer.observe(dock, { childList: true, subtree: true });
}
