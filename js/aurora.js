/**
 * Aurora Fog Overlay (B)
 * Lightweight animated gradient-noise aurora/fog on a canvas.
 */

import { loadBool, saveBool, resizeCanvasDPR, createThrottledLoop } from './dom-helpers.js';

export const Aurora = {
    enabled: true,
    canvas: null,
    ctx: null,
    t: 0,
    _loop: null,

    init() {
        this.enabled = loadBool('auroraEnabled', true);
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'fx-canvas';
        this.canvas.style.zIndex = 79; // behind FX particles
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);

        this._loop = createThrottledLoop(() => this._frame(), {
            isEnabled: () => this.enabled,
            minInterval: 41.6, // ~24fps
        });

        this.onResize();
        window.addEventListener('resize', () => this.onResize());
        if (this.enabled) this._loop.start();
    },

    setEnabled(v) {
        this.enabled = !!v;
        saveBool('auroraEnabled', this.enabled);
        if (this.enabled) this._loop.start();
        else this.clear();
    },
    toggle() {
        this.setEnabled(!this.enabled);
    },

    onResize() {
        resizeCanvasDPR(this.canvas, this.ctx);
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
