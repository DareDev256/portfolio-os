/**
 * Pulse Grid — Reactive ambient floor grid on the desktop
 *
 * A faint grid overlays the desktop surface. As the cursor moves,
 * nearby grid cells illuminate with a gold→amethyst radial glow —
 * like walking through Stark's lab with a light-up floor.
 *
 * Canvas-based for performance. Desktop-only, respects reduced-motion.
 */

import { shouldSkipDesktopEffects, isPageHidden, onVisibilityChange, initDesktopCanvas, createPointerTracker, PALETTE } from './dom-helpers.js';

const CELL_SIZE = 72;          // px per grid cell
const GLOW_RADIUS = 180;       // px — how far the glow reaches from cursor
const LINE_ALPHA_BASE = 0.04;  // grid line opacity when unlit
const LINE_ALPHA_PEAK = 0.35;  // grid line opacity at cursor center
const FILL_ALPHA_PEAK = 0.08;  // cell fill opacity at cursor center
const GOLD = PALETTE.GOLD;
const AMETHYST = PALETTE.AMETHYST;

let ctx = null;
let pointer = null;    // initialized in init()
let rafId = 0;
let visible = true;

function lerp(a, b, t) { return a + (b - a) * t; }

/** Mix gold→amethyst based on distance ratio (0 = gold at center, 1 = amethyst at edge) */
function colorAt(t) {
    return {
        r: lerp(GOLD.r, AMETHYST.r, t),
        g: lerp(GOLD.g, AMETHYST.g, t),
        b: lerp(GOLD.b, AMETHYST.b, t),
    };
}


function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    const cols = Math.ceil(w / CELL_SIZE) + 1;
    const rows = Math.ceil(h / CELL_SIZE) + 1;

    // Draw lit cells first (fills), then grid lines on top
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cx = col * CELL_SIZE + CELL_SIZE / 2;
            const cy = row * CELL_SIZE + CELL_SIZE / 2;
            const dx = pointer.mouse.x - cx;
            const dy = pointer.mouse.y - cy;
            const dist = Math.hypot(dx, dy);

            if (dist < GLOW_RADIUS) {
                const t = dist / GLOW_RADIUS;          // 0 at cursor, 1 at edge
                const intensity = 1 - t * t;           // quadratic falloff
                const c = colorAt(t);
                const alpha = FILL_ALPHA_PEAK * intensity;

                ctx.fillStyle = `rgba(${c.r | 0}, ${c.g | 0}, ${c.b | 0}, ${alpha})`;
                ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    // Vertical grid lines
    for (let col = 0; col <= cols; col++) {
        const x = col * CELL_SIZE;
        const dist = Math.abs(pointer.mouse.x - x);
        const proximity = dist < GLOW_RADIUS ? 1 - (dist / GLOW_RADIUS) : 0;
        const alpha = LINE_ALPHA_BASE + (LINE_ALPHA_PEAK - LINE_ALPHA_BASE) * proximity;
        const c = colorAt(1 - proximity);

        ctx.strokeStyle = `rgba(${c.r | 0}, ${c.g | 0}, ${c.b | 0}, ${alpha})`;
        ctx.lineWidth = proximity > 0.3 ? 0.8 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }

    // Horizontal grid lines
    for (let row = 0; row <= rows; row++) {
        const y = row * CELL_SIZE;
        const dist = Math.abs(pointer.mouse.y - y);
        const proximity = dist < GLOW_RADIUS ? 1 - (dist / GLOW_RADIUS) : 0;
        const alpha = LINE_ALPHA_BASE + (LINE_ALPHA_PEAK - LINE_ALPHA_BASE) * proximity;
        const c = colorAt(1 - proximity);

        ctx.strokeStyle = `rgba(${c.r | 0}, ${c.g | 0}, ${c.b | 0}, ${alpha})`;
        ctx.lineWidth = proximity > 0.3 ? 0.8 : 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
}

function tick() {
    rafId = 0;
    if (isPageHidden() || !visible) return;
    draw();
}

function scheduleFrame() {
    if (!rafId) rafId = requestAnimationFrame(tick);
}

export const PulseGrid = {
    init() {
        if (shouldSkipDesktopEffects()) return;

        ({ ctx } = initDesktopCanvas('pulse-grid-canvas'));
        pointer = createPointerTracker();

        // Redraw on pointer movement (cursor-reactive, not continuous)
        document.addEventListener('pointermove', scheduleFrame);
        document.addEventListener('pointerleave', scheduleFrame);

        onVisibilityChange(
            () => { visible = false; },
            () => { visible = true; scheduleFrame(); },
        );

        // Initial draw with no cursor — faint ambient grid
        scheduleFrame();
    },
};
