/**
 * Purple Haze Reveal Curtain
 * Cinematic amethyst curtain that parts to reveal the desktop,
 * channeling Prince's Purple Rain staging + Stark lab unveil.
 *
 * Usage:  PurpleHaze.cover()   → snap curtain closed (instant)
 *         PurpleHaze.reveal()  → split curtain open (returns Promise)
 *         PurpleHaze.destroy() → remove DOM
 */

export const PurpleHaze = {
    el: null,

    /** Lazily create the curtain DOM */
    _ensure() {
        if (this.el) return this.el;

        const wrap = document.createElement('div');
        wrap.className = 'purple-haze';
        wrap.setAttribute('aria-hidden', 'true');
        wrap.innerHTML = `
            <div class="ph-panel ph-panel--top"></div>
            <div class="ph-panel ph-panel--bottom"></div>
            <div class="ph-seam"></div>
            <div class="ph-bloom"></div>
        `;
        document.body.appendChild(wrap);
        this.el = wrap;
        return wrap;
    },

    /** Snap the curtain shut (no animation) */
    cover() {
        const el = this._ensure();
        el.classList.remove('reveal');
        // Force reflow so removing 'reveal' takes effect before adding 'active'
        void el.offsetHeight;
        el.classList.add('active');
    },

    /**
     * Part the curtain to reveal what's behind.
     * Resolves when panels finish sliding away (~1.5s).
     */
    reveal() {
        return new Promise((resolve) => {
            const el = this._ensure();
            if (!el.classList.contains('active')) {
                resolve();
                return;
            }

            el.classList.add('reveal');

            // Total animation: seam draws (0.6s) → panels slide (1.1s after 0.35s delay)
            // Resolve when panels are clear ≈ 1.5s
            setTimeout(() => {
                el.classList.remove('active', 'reveal');
                resolve();
            }, 1600);
        });
    },

    /** Clean up DOM */
    destroy() {
        if (this.el) {
            this.el.remove();
            this.el = null;
        }
    },
};
