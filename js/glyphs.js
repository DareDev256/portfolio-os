/**
 * Hologram Glyph Ring (D)
 * Rotating ring with alien glyphs; subtle and layered.
 * Now uses CSS animation instead of RAF loop for zero main-thread cost.
 */

import { loadBool, saveBool } from './dom-helpers.js';

export const Glyphs = {
    enabled: true,
    el: null,
    glyphs: '⟟⋉⋔⋇⋏⋎⋒⋙⋛⋌⋋⋈⋐⋱⋰⋣⋠⋵',

    init() {
        this.enabled = loadBool('glyphsEnabled', true);
        this.el = document.createElement('div');
        this.el.style.position = 'fixed';
        this.el.style.inset = '0';
        this.el.style.zIndex = '82';
        this.el.style.pointerEvents = 'none';
        this.el.innerHTML = `
      <svg class="holo-ring" viewBox="0 0 600 600" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(70vw,70vh);height:auto;filter: drop-shadow(0 0 12px rgba(0,231,255,0.45)); opacity:.6; animation: holo-ring-spin 7s linear infinite;">
        <defs>
          <linearGradient id="neonGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="var(--neon-cyan)"/>
            <stop offset="100%" stop-color="var(--neon-magenta)"/>
          </linearGradient>
        </defs>
        <circle cx="300" cy="300" r="220" fill="none" stroke="url(#neonGrad)" stroke-width="2" stroke-dasharray="8 8"/>
        <circle cx="300" cy="300" r="260" fill="none" stroke="url(#neonGrad)" stroke-width="1" opacity="0.5"/>
        <g id="glyphLayer"></g>
      </svg>
    `;
        document.body.appendChild(this.el);

        // Inject CSS keyframes for the spin
        const style = document.createElement('style');
        style.textContent = `
            @keyframes holo-ring-spin {
                to { transform: translate(-50%,-50%) rotate(1turn); }
            }
        `;
        document.head.appendChild(style);

        this.populateGlyphs();
        if (!this.enabled) this.el.style.display = 'none';
    },

    populateGlyphs() {
        const g = this.el.querySelector('#glyphLayer');
        g.innerHTML = '';
        const N = 28;
        for (let i = 0; i < N; i++) {
            const ang = (i / N) * Math.PI * 2;
            const x = 300 + Math.cos(ang) * 220;
            const y = 300 + Math.sin(ang) * 220;
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('fill', 'url(#neonGrad)');
            text.setAttribute('font-size', '16');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('alignment-baseline', 'middle');
            text.setAttribute('class', 'holo-text');
            text.textContent = this.glyphs[i % this.glyphs.length];
            g.appendChild(text);
        }
    },

    setEnabled(v) {
        this.enabled = !!v;
        saveBool('glyphsEnabled', this.enabled);
        if (this.enabled) {
            this.el.style.display = '';
        } else {
            this.el.style.display = 'none';
        }
    },

    toggle() {
        this.setEnabled(!this.enabled);
    },
};
