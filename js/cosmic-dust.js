/**
 * Cosmic Dust — Faint twinkling star-field on the desktop surface
 *
 * Dozens of tiny particles drift almost imperceptibly, fading in and
 * out like distant starlight through a darkened lab window. Occasional
 * particles catch the light — brief gold or amethyst flares that die
 * as quickly as they appear.
 *
 * Canvas-based for performance. Desktop-only, respects reduced-motion.
 */

import {
    shouldSkipDesktopEffects,
    isPageHidden,
    onVisibilityChange,
    initDesktopCanvas,
    PALETTE,
} from './dom-helpers.js';

/* ── Tuning ────────────────────────────────── */
const DUST_COUNT      = 50;
const DUST_MIN_R      = 0.4;
const DUST_MAX_R      = 1.4;
const DRIFT_SPEED     = 0.08;       // very slow base drift
const TWINKLE_SPEED   = 0.012;      // oscillation rate for alpha
const FLARE_CHANCE    = 0.002;      // per-particle per-frame chance of a bright flare
const FLARE_DECAY     = 0.92;       // flare fades by this multiplier per frame
const FLARE_RADIUS    = 12;         // px — glow around a flaring particle
const FADE_EDGE       = 40;         // px — particles dim near viewport edges

const GOLD     = PALETTE.GOLD;
const AMETHYST = PALETTE.AMETHYST;

/* ── State ─────────────────────────────────── */
let ctx;
let particles = [];
let rafId = 0;
let visible = true;
let time = 0;
let lastFrame = 0;
const FRAME_INTERVAL = 50; // ~20fps — ambient effect doesn't need 60fps

/* ── Particle factory ─────────────────────── */
function createParticle(i) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isGold = Math.random() < 0.4; // bias toward amethyst
    return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: DUST_MIN_R + Math.random() * (DUST_MAX_R - DUST_MIN_R),
        color: isGold ? GOLD : AMETHYST,
        phase: Math.random() * Math.PI * 2,    // twinkle offset
        driftAngle: Math.random() * Math.PI * 2,
        speed: DRIFT_SPEED * (0.3 + Math.random() * 1.0),
        flare: 0,  // 0 = no flare, 1 = full flare brightness
    };
}

function spawnParticles() {
    particles = [];
    for (let i = 0; i < DUST_COUNT; i++) particles.push(createParticle(i));
}

/* ── Update & Draw ─────────────────────────── */
function update() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    time += 1;

    for (const p of particles) {
        // Gentle linear drift — no noise needed at this scale
        p.x += Math.cos(p.driftAngle) * p.speed;
        p.y += Math.sin(p.driftAngle) * p.speed;

        // Very slow directional wander
        p.driftAngle += (Math.random() - 0.5) * 0.02;

        // Random flare ignition
        if (p.flare < 0.01 && Math.random() < FLARE_CHANCE) {
            p.flare = 0.6 + Math.random() * 0.4;
        }
        // Flare decay
        if (p.flare > 0.01) p.flare *= FLARE_DECAY;
        else p.flare = 0;

        // Wrap around viewport
        if (p.x < -20)    p.x = w + 10;
        if (p.x > w + 20) p.x = -10;
        if (p.y < -20)    p.y = h + 10;
        if (p.y > h + 20) p.y = -10;
    }
}

function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
        // Twinkle — smooth oscillation between dim and visible
        const twinkle = 0.15 + 0.35 * Math.sin(time * TWINKLE_SPEED + p.phase);

        // Edge fade
        let edgeFade = 1;
        const ex = Math.min(p.x, w - p.x);
        const ey = Math.min(p.y, h - p.y);
        edgeFade = Math.min(edgeFade, Math.max(0, ex / FADE_EDGE));
        edgeFade = Math.min(edgeFade, Math.max(0, ey / FADE_EDGE));

        const baseAlpha = twinkle * edgeFade;
        if (baseAlpha < 0.01 && p.flare < 0.01) continue;

        const { r, g, b } = p.color;

        // Flare glow (rare, brief)
        if (p.flare > 0.05) {
            const flareAlpha = p.flare * edgeFade * 0.4;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, FLARE_RADIUS);
            grad.addColorStop(0,   `rgba(${r}, ${g}, ${b}, ${flareAlpha})`);
            grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${flareAlpha * 0.3})`);
            grad.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, FLARE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }

        // Core dot
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${baseAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function tick(now) {
    rafId = 0;
    if (isPageHidden() || !visible) return;
    if (now - lastFrame < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(tick);
        return;
    }
    lastFrame = now;
    update();
    draw();
    rafId = requestAnimationFrame(tick);
}

function start() {
    if (!rafId) rafId = requestAnimationFrame(tick);
}

/* ── Public API ────────────────────────────── */
export const CosmicDust = {
    init() {
        if (shouldSkipDesktopEffects()) return;

        ({ ctx } = initDesktopCanvas('cosmic-dust-canvas'));
        spawnParticles();

        onVisibilityChange(
            () => { visible = false; },
            () => { visible = true; start(); },
        );

        start();
    },
};
