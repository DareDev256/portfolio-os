/**
 * Futuristic Visual FX Layer
 * - Neon starfield/particle network
 * - Cursor comet particles
 * - Optional scanline overlay
 */

import { bootstrapCanvasEffect, setCanvasEffectEnabled } from './dom-helpers.js';

const STORAGE_KEY = 'fxEnabled';

export const FX = {
    scanlines: null,
    particles: [],
    mouse: { x: 0, y: 0, active: false },
    suction: null,

    init() {
        bootstrapCanvasEffect(this, STORAGE_KEY, {
            defaultEnabled: false,
            minInterval: 33.3, // ~30fps
            contextOptions: { alpha: true },
        });

        // Scanlines overlay
        this.scanlines = document.createElement('div');
        this.scanlines.className = 'fx-scanlines';
        document.body.appendChild(this.scanlines);

        window.addEventListener('mousemove', (e) => {
            this.mouse = { x: e.clientX, y: e.clientY, active: true };
            this.spawnComet(e.clientX, e.clientY);
        });
        window.addEventListener('mouseleave', () => (this.mouse.active = false));

        // Seed background particles
        for (let i = 0; i < 140; i++) this.particles.push(this.makeParticle());

        if (!this.enabled) this.clear();
    },

    setEnabled(v) {
        setCanvasEffectEnabled(this, STORAGE_KEY, v);
    },

    toggle() {
        this.setEnabled(!this.enabled);
    },

    makeParticle(x = Math.random() * window.innerWidth, y = Math.random() * window.innerHeight) {
        const speed = 0.2 + Math.random() * 0.6;
        const dir = Math.random() * Math.PI * 2;
        return {
            x,
            y,
            vx: Math.cos(dir) * speed,
            vy: Math.sin(dir) * speed,
            r: Math.random() * 1.5 + 0.3,
            life: 0,
            hue: 180 + Math.random() * 120,
        };
    },

    spawnComet(x, y) {
        for (let i = 0; i < 4; i++) {
            const p = this.makeParticle(x, y);
            p.vx += (Math.random() - 0.5) * 1.5;
            p.vy += (Math.random() - 0.5) * 1.5;
            p.r = 1 + Math.random() * 2.5;
            p.life = -Math.random() * 40;
            this.particles.push(p);
        }
    },

    triggerSuction(x, y, ms = 600) {
        this.suction = { x, y, end: performance.now() + ms };
    },

    step() {
        // Update particles
        const sucking = this.suction && performance.now() < this.suction.end;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            // suction force
            if (sucking) {
                const dx = this.suction.x - p.x;
                const dy = this.suction.y - p.y;
                const dist = Math.hypot(dx, dy) + 1e-3;
                const force = Math.min(0.08, 18 / (dist * dist));
                p.vx += dx * force;
                p.vy += dy * force;
            }
            p.x += p.vx;
            p.y += p.vy;
            p.life++;
            // Wrap around edges softly
            if (p.x < -10) p.x = window.innerWidth + 10;
            if (p.x > window.innerWidth + 10) p.x = -10;
            if (p.y < -10) p.y = window.innerHeight + 10;
            if (p.y > window.innerHeight + 10) p.y = -10;
            // Limit count
            if (this.particles.length > 400 && p.life > 240) this.particles.splice(i, 1);
        }
    },

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Glow trail backdrop
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const p of this.particles) {
            const alpha = 0.25 + Math.abs(Math.sin((p.life + p.hue) * 0.02)) * 0.35;
            ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Connect nearby particles (neon filaments)
        for (let i = 0; i < this.particles.length; i++) {
            const a = this.particles[i];
            for (let j = i + 1; j < i + 18 && j < this.particles.length; j++) {
                const b = this.particles[j];
                const dx = a.x - b.x,
                    dy = a.y - b.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 90 * 90) {
                    const alpha = 0.04 + (1 - Math.sqrt(d2) / 90) * 0.08;
                    ctx.strokeStyle = `rgba(76, 194, 255, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    },

    /** Per-frame work — called by the throttled loop */
    _frame() {
        this.step();
        this.draw();
    },

    clear() {
        this._loop.stop();
        if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.scanlines) this.scanlines.style.display = 'none';
    },
};
