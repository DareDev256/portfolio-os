import { AudioFX } from './audiofx.js';

/**
 * Warp tunnel overlay controller (screen-portal style)
 */
export const Warp = {
    el: null,
    last: { x: 0.5, y: 0.5 },
    ensure() {
        if (this.el) return this.el;
        const d = document.createElement('div');
        d.className = 'warp-overlay';
        document.body.appendChild(d);
        this.el = d;
        return d;
    },

    // Play warp-out, swap screens halfway via cb, then warp-in
    transition(cb, x, y) {
        const el = this.ensure();
        if (typeof x === 'number' && typeof y === 'number') this.setOrigin(x, y);
        el.classList.remove('warp-in');
        el.classList.add('warp-out');
        // Switch screens near the peak
        setTimeout(() => {
            try {
                cb && cb();
            } catch (e) {
                console.error('Warp transition callback failed:', e);
            }
        }, 260);
        if (AudioFX && AudioFX.whoosh) {
            AudioFX.whoosh();
        }
        const fx = window.__FX;
        if (fx && fx.triggerSuction) {
            const px = this.last.x * window.innerWidth || window.innerWidth / 2;
            const py = this.last.y * window.innerHeight || window.innerHeight / 2;
            fx.triggerSuction(px, py, 650);
        }
        // Clean up after finish
        setTimeout(() => el.classList.remove('warp-out'), 560);
    },

    pulse() {
        const el = this.ensure();
        el.classList.remove('warp-out');
        el.classList.add('warp-in');
        setTimeout(() => el.classList.remove('warp-in'), 560);
    },

    setOrigin(px, py) {
        const x = Math.max(0, Math.min(1, px / window.innerWidth));
        const y = Math.max(0, Math.min(1, py / window.innerHeight));
        this.last = { x, y };
        const el = this.ensure();
        el.style.setProperty('--warp-x', `${x * 100}%`);
        el.style.setProperty('--warp-y', `${y * 100}%`);
    },
};

// Track last click position as warp origin
window.addEventListener('pointerdown', (e) => {
    if (Warp) Warp.setOrigin(e.clientX, e.clientY);
});
