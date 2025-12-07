import { State } from './state.js';

/**
 * Boot/Splash Screen
 * Shows a short animated loader while preloading the wallpaper
 */

export const Boot = {
    el: null,
    bar: null,
    meta: null,

    async start(next) {
        // Create DOM
        this.el = document.createElement('div');
        this.el.className = 'boot-screen';
        this.el.innerHTML = `
      <div class="boot-overlay"></div>
      <div class="boot-panel">
        <div class="boot-title">Starting Portfolio OS…</div>
        <div class="boot-progress"><div class="boot-bar"></div></div>
        <div class="boot-meta">Initializing…</div>
      </div>
    `;
        document.body.appendChild(this.el);
        this.bar = this.el.querySelector('.boot-bar');
        this.meta = this.el.querySelector('.boot-meta');

        const steps = [
            { label: 'Preloading wallpaper', task: () => this.preloadWallpaper() },
            { label: 'Preparing UI', task: () => this.delay(350) },
            { label: 'Warming up modules', task: () => this.delay(300) },
        ];

        for (let i = 0; i < steps.length; i++) {
            const s = steps[i];
            this.meta.textContent = s.label + '…';
            try {
                await s.task();
            } catch (e) {
                /* ignore */
            }
            this.setProgress(((i + 1) / steps.length) * 100);
        }

        // Fade out
        await this.delay(200);
        this.el.style.opacity = '0';
        await this.delay(300);
        this.el.remove();

        if (typeof next === 'function') next();
    },

    setProgress(pct) {
        this.bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    },

    preloadWallpaper() {
        return new Promise((resolve) => {
            // Determine current wallpaper value in State
            const src =
                typeof State.wallpaper === 'string' && !State.wallpaper.startsWith('gradient:')
                    ? State.wallpaper
                    : 'assets/wallpapers/default.jpg';
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
        });
    },

    delay(ms) {
        return new Promise((r) => setTimeout(r, ms));
    },
};
