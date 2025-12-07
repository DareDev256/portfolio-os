/**
 * UI Soundscape (E)
 * WebAudio-based subtle SFX and a short boot chime. No external files.
 */

export const AudioFX = {
    enabled: true,
    ctx: null,
    master: null,
    init() {
        this.enabled = (localStorage.getItem('soundEnabled') ?? '1') === '1';
        // Lazy: create context on first play due to browser gesture policies
        document.addEventListener('click', () => this.ensureContext(), { once: true });
    },

    ensureContext() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.enabled ? 0.15 : 0.0;
            this.master.connect(this.ctx.destination);
        } catch (e) {
            /* ignore */
        }
    },

    setEnabled(v) {
        this.enabled = !!v;
        localStorage.setItem('soundEnabled', this.enabled ? '1' : '0');
        if (!this.ctx) return;
        this.master.gain.setTargetAtTime(this.enabled ? 0.15 : 0, this.ctx.currentTime, 0.05);
    },
    toggle() {
        this.setEnabled(!this.enabled);
    },

    tone(freq = 440, dur = 0.12, type = 'sine', start = 0) {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;
        const t0 = this.ctx.currentTime + start;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(0.28, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.002, t0 + dur);
        osc.connect(gain).connect(this.master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    },

    bootChime() {
        // Rising triad
        this.tone(440, 0.18, 'sine', 0);
        this.tone(660, 0.18, 'sine', 0.05);
        this.tone(880, 0.22, 'sine', 0.1);
    },

    click() {
        this.tone(520, 0.08, 'triangle');
    },
    hover() {
        this.tone(220, 0.06, 'sine');
    },
    toggleOn() {
        this.tone(760, 0.14, 'sawtooth');
    },
    toggleOff() {
        this.tone(280, 0.14, 'sawtooth');
    },

    whoosh() {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;
        const t0 = this.ctx.currentTime + 0.01;
        const o1 = this.ctx.createOscillator();
        o1.type = 'sawtooth';
        o1.frequency.setValueAtTime(120, t0);
        const o2 = this.ctx.createOscillator();
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(90, t0);
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(350, t0);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.001, t0);
        g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.06);
        g.gain.exponentialRampToValueAtTime(0.002, t0 + 0.55);
        f.frequency.exponentialRampToValueAtTime(1800, t0 + 0.5);
        o1.connect(f);
        o2.connect(f);
        f.connect(g).connect(this.master);
        o1.start(t0);
        o2.start(t0);
        o1.stop(t0 + 0.6);
        o2.stop(t0 + 0.6);
    },
};
