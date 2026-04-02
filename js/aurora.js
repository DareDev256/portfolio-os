/**
 * Aurora Fog Overlay (B)
 * Lightweight animated gradient-noise aurora/fog on a canvas.
 */

import { bootstrapCanvasEffect, setCanvasEffectEnabled } from './dom-helpers.js';

const STORAGE_KEY = 'auroraEnabled';

export const Aurora = {
    t: 0,

    init() {
        bootstrapCanvasEffect(this, STORAGE_KEY, {
            defaultEnabled: true,
            minInterval: 41.6, // ~24fps
            zIndex: 79,       // behind FX particles
        });
    },

    setEnabled(v) {
        setCanvasEffectEnabled(this, STORAGE_KEY, v);
    },
    toggle() {
        this.setEnabled(!this.enabled);
    },

    noise(x, y, t) {
        // Simple looping value noise using sin blends (fast and good enough)
        return (
            (Math.sin(x * 0.018 + t) +
                Math.sin(y * 0.014 - t * 0.8) +
                Math.sin((x + y) * 0.01 + t * 0.6)) /
            3
        ); // [-1..1]
    },

    draw() {
        const ctx = this.ctx;
        const w = window.innerWidth,
            h = window.innerHeight;
        const cell = 14; // coarse grid for speed
        for (let y = 0; y < h; y += cell) {
            for (let x = 0; x < w; x += cell) {
                const n = this.noise(x, y, this.t);
                // Map noise to cyan/magenta aurora
                const c = (n + 1) * 0.5; // [0..1]
                const r = Math.floor(40 + 120 * c);
                const g = Math.floor(80 + 140 * (1 - c));
                const b = Math.floor(120 + 135 * c);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.08)`;
                ctx.fillRect(x, y, cell + 1, cell + 1);
            }
        }
        // Soft vignette
        const grad = ctx.createRadialGradient(
            w / 2,
            h / 2,
            Math.min(w, h) * 0.25,
            w / 2,
            h / 2,
            Math.max(w, h) * 0.8
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    },

    /** Per-frame work — called by the throttled loop */
    _frame() {
        // Trail: fade instead of clear for smoother motion
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = 'rgba(0,0,0,0.10)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = 'lighter';
        this.draw();
        this.t += 0.02;
    },

    clear() {
        this._loop.stop();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
};
