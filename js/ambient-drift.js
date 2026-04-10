/**
 * Ambient Drift — Luminous floating orbs on the desktop surface
 *
 * 6–8 softly glowing spheres (gold & amethyst) drift in slow organic
 * paths using simplex-like noise.  They repel gently from the cursor,
 * creating a living, breathing atmosphere — dust motes catching light
 * in a darkened lab.
 *
 * Canvas-based for performance. Desktop-only, respects reduced-motion.
 */

import {
    shouldSkipDesktopEffects,
    isPageHidden,
    onVisibilityChange,
    initDesktopCanvas,
    createPointerTracker,
    PALETTE,
} from './dom-helpers.js';

/* ── Tuning ────────────────────────────────── */
const ORB_COUNT       = 7;
const ORB_MIN_R       = 3;
const ORB_MAX_R       = 7;
const DRIFT_SPEED     = 0.15;      // base px/frame
const NOISE_SCALE     = 0.0008;    // frequency of directional wander
const REPEL_RADIUS    = 180;       // px — cursor influence zone
const REPEL_STRENGTH  = 2.5;       // max push-back px/frame
const GLOW_RADIUS_MUL = 8;        // radialGradient outer stop = r * MUL
const FADE_EDGE       = 60;        // px — orbs fade near viewport edges

const GOLD     = PALETTE.GOLD;
const AMETHYST = PALETTE.AMETHYST;

/* ── State ─────────────────────────────────── */
let ctx;
let orbs = [];
let pointer;    // initialized in init()
let rafId = 0;
let visible = true;
let time = 0;

/* ── Cheap pseudo-noise (no dependency) ────── */
function noise2d(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);           // 0-1
}
function smoothNoise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);  // smoothstep
    const sy = fy * fy * (3 - 2 * fy);
    const a = noise2d(ix, iy), b = noise2d(ix + 1, iy);
    const c = noise2d(ix, iy + 1), d = noise2d(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/* ── Orb factory ───────────────────────────── */
function createOrb(i) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isGold = i % 2 === 0;
    const color = isGold ? GOLD : AMETHYST;
    return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: ORB_MIN_R + Math.random() * (ORB_MAX_R - ORB_MIN_R),
        color,
        phase: Math.random() * 1000,     // noise phase offset
        speed: DRIFT_SPEED * (0.6 + Math.random() * 0.8),
        pulse: 0.7 + Math.random() * 0.3, // brightness variance
    };
}

function spawnOrbs() {
    orbs = [];
    for (let i = 0; i < ORB_COUNT; i++) orbs.push(createOrb(i));
}

/* ── Update & Draw ─────────────────────────── */
function update() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    time += 1;

    for (const orb of orbs) {
        // Noise-driven drift direction
        const nx = smoothNoise((orb.x + orb.phase) * NOISE_SCALE, time * 0.002) * 2 - 1;
        const ny = smoothNoise(time * 0.002, (orb.y + orb.phase) * NOISE_SCALE) * 2 - 1;

        orb.x += nx * orb.speed;
        orb.y += ny * orb.speed;

        // Cursor repulsion
        const dx = orb.x - pointer.mouse.x;
        const dy = orb.y - pointer.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_RADIUS && dist > 0) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            orb.x += (dx / dist) * force;
            orb.y += (dy / dist) * force;
        }

        // Wrap around viewport edges with margin
        if (orb.x < -40)  orb.x = w + 20;
        if (orb.x > w + 40) orb.x = -20;
        if (orb.y < -40)  orb.y = h + 20;
        if (orb.y > h + 40) orb.y = -20;

        // Slow pulsing brightness
        orb.pulse = 0.55 + 0.45 * Math.sin(time * 0.015 + orb.phase);
    }
}

function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    for (const orb of orbs) {
        // Edge fade — orbs near viewport edge dim to avoid hard pop-in
        let edgeFade = 1;
        const ex = Math.min(orb.x, w - orb.x);
        const ey = Math.min(orb.y, h - orb.y);
        edgeFade = Math.min(edgeFade, Math.max(0, ex / FADE_EDGE));
        edgeFade = Math.min(edgeFade, Math.max(0, ey / FADE_EDGE));

        const alpha = orb.pulse * edgeFade * 0.6;
        if (alpha < 0.01) continue;

        const { r, g, b } = orb.color;
        const outerR = orb.r * GLOW_RADIUS_MUL;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, outerR);
        grad.addColorStop(0,   `rgba(${r}, ${g}, ${b}, ${alpha})`);
        grad.addColorStop(0.15, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`);
        grad.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, outerR, 0, Math.PI * 2);
        ctx.fill();
    }
}

function tick() {
    rafId = 0;
    if (isPageHidden() || !visible) return;
    update();
    draw();
    rafId = requestAnimationFrame(tick);
}

function start() {
    if (!rafId) rafId = requestAnimationFrame(tick);
}

/* ── Public API ────────────────────────────── */
export const AmbientDrift = {
    init() {
        if (shouldSkipDesktopEffects()) return;

        ({ ctx } = initDesktopCanvas('ambient-drift-canvas'));
        pointer = createPointerTracker();
        spawnOrbs();

        onVisibilityChange(
            () => { visible = false; },
            () => { visible = true; start(); },
        );

        start();
    },
};
