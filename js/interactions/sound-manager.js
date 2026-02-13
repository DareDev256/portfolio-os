/**
 * Sound Manager
 * Extends AudioFX with PS1/PS2-inspired sounds and interaction sounds
 * All sounds synthesized with Web Audio API (no external files)
 */

import { AudioFX } from '../audiofx.js';

export const SoundManager = {
    enabled: true,

    /**
     * Initialize sound manager
     */
    init() {
        console.log('[SoundManager] Initialized');
        this.enabled = AudioFX.enabled;
    },

    /**
     * PS1/PS2 Boot Sound
     * Dramatic orchestral hit inspired by PlayStation boot sequence
     * Deeper, more epic than the standard bootChime
     */
    ps1Boot() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        // Deep orchestral hit (bass)
        this.tone(55, 1.2, 'triangle', 0, 0.4);      // A1 - Deep foundation
        this.tone(82.41, 1.2, 'triangle', 0, 0.35);  // E2 - Perfect 5th

        // Mid-range harmony
        this.tone(110, 1.0, 'sine', 0.1, 0.3);       // A2
        this.tone(164.81, 1.0, 'sine', 0.15, 0.28);  // E3

        // Bright overtones (the "shimmer")
        this.tone(220, 0.8, 'sine', 0.2, 0.25);      // A3
        this.tone(277.18, 0.8, 'sine', 0.25, 0.22);  // C#4
        this.tone(329.63, 0.8, 'sine', 0.3, 0.2);    // E4

        // High sparkle (PS1 signature)
        this.tone(440, 0.6, 'sine', 0.35, 0.18);     // A4
        this.tone(554.37, 0.6, 'sine', 0.4, 0.15);   // C#5
        this.tone(659.25, 0.6, 'sine', 0.45, 0.12);  // E5

        // Ethereal top (like PS2 boot)
        this.tone(880, 0.5, 'sine', 0.5, 0.1);       // A5
        this.tone(1108.73, 0.4, 'sine', 0.55, 0.08); // C#6

        console.log('[SoundManager] PS1 Boot Sound');
    },

    /**
     * Ripple Sound
     * Water droplet effect for ripple interactions
     */
    ripple() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        // High frequency "plip" descending
        const t0 = AudioFX.ctx.currentTime;
        const osc = AudioFX.ctx.createOscillator();
        const gain = AudioFX.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, t0);
        osc.frequency.exponentialRampToValueAtTime(800, t0 + 0.15);

        gain.gain.setValueAtTime(0.15, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);

        osc.connect(gain).connect(AudioFX.master);
        osc.start(t0);
        osc.stop(t0 + 0.2);
    },

    /**
     * Window Open Sound
     * Ascending whoosh with resolution tone
     */
    windowOpen() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        const t0 = AudioFX.ctx.currentTime;

        // Whoosh up
        const osc1 = AudioFX.ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(60, t0);
        osc1.frequency.exponentialRampToValueAtTime(400, t0 + 0.3);

        const filter = AudioFX.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, t0);
        filter.frequency.exponentialRampToValueAtTime(1200, t0 + 0.3);

        const gain1 = AudioFX.ctx.createGain();
        gain1.gain.setValueAtTime(0.001, t0);
        gain1.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);

        osc1.connect(filter).connect(gain1).connect(AudioFX.master);
        osc1.start(t0);
        osc1.stop(t0 + 0.35);

        // Resolution tone
        this.tone(880, 0.15, 'sine', 0.3, 0.12);
        this.tone(1108.73, 0.12, 'sine', 0.32, 0.1);
    },

    /**
     * Window Close Sound
     * Descending whoosh with bass thump
     */
    windowClose() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        const t0 = AudioFX.ctx.currentTime;

        // Whoosh down
        const osc1 = AudioFX.ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(400, t0);
        osc1.frequency.exponentialRampToValueAtTime(60, t0 + 0.25);

        const filter = AudioFX.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t0);
        filter.frequency.exponentialRampToValueAtTime(200, t0 + 0.25);

        const gain1 = AudioFX.ctx.createGain();
        gain1.gain.setValueAtTime(0.001, t0);
        gain1.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);

        osc1.connect(filter).connect(gain1).connect(AudioFX.master);
        osc1.start(t0);
        osc1.stop(t0 + 0.3);

        // Bass thump
        this.tone(55, 0.15, 'triangle', 0.25, 0.18);
    },

    /**
     * Window Minimize Sound
     * Quick compression sweep downward
     */
    windowMinimize() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        const t0 = AudioFX.ctx.currentTime;

        const osc = AudioFX.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t0);
        osc.frequency.exponentialRampToValueAtTime(150, t0 + 0.15);

        const gain = AudioFX.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);

        osc.connect(gain).connect(AudioFX.master);
        osc.start(t0);
        osc.stop(t0 + 0.2);
    },

    /**
     * Window Maximize Sound
     * Expansion sweep upward
     */
    windowMaximize() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        const t0 = AudioFX.ctx.currentTime;

        const osc = AudioFX.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t0);
        osc.frequency.exponentialRampToValueAtTime(600, t0 + 0.15);

        const gain = AudioFX.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);

        osc.connect(gain).connect(AudioFX.master);
        osc.start(t0);
        osc.stop(t0 + 0.2);
    },

    /**
     * Notification Sound
     * Gentle chime with harmonic overtones
     */
    notification() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        // Soft bell-like chime (C major chord)
        this.tone(523.25, 0.5, 'sine', 0, 0.15);    // C5
        this.tone(659.25, 0.5, 'sine', 0.05, 0.13); // E5
        this.tone(783.99, 0.5, 'sine', 0.1, 0.11);  // G5
        this.tone(1046.5, 0.4, 'sine', 0.15, 0.09); // C6 (sparkle)
    },

    /**
     * Konami Code Unlock Sound
     * Retro power-up with ascending arpeggio
     */
    konami() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        // Classic power-up arpeggio
        this.tone(261.63, 0.1, 'square', 0, 0.2);     // C4
        this.tone(329.63, 0.1, 'square', 0.1, 0.2);   // E4
        this.tone(392.00, 0.1, 'square', 0.2, 0.2);   // G4
        this.tone(523.25, 0.1, 'square', 0.3, 0.2);   // C5
        this.tone(659.25, 0.1, 'square', 0.4, 0.2);   // E5
        this.tone(783.99, 0.2, 'square', 0.5, 0.25);  // G5
        this.tone(1046.5, 0.3, 'square', 0.65, 0.3);  // C6 (sustain)

        // Add some retro-style harmonics
        this.tone(1318.5, 0.25, 'square', 0.7, 0.15); // E6
        this.tone(1568.0, 0.2, 'square', 0.75, 0.12); // G6
    },

    /**
     * Particle Burst Sound
     * Quick sparkle for particle effects
     */
    particleBurst() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        // High frequency burst with noise
        for (let i = 0; i < 5; i++) {
            const freq = 1200 + Math.random() * 800;
            const delay = i * 0.02;
            this.tone(freq, 0.08, 'sine', delay, 0.08);
        }
    },

    /**
     * Error Sound
     * Dissonant, descending tone
     */
    error() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        // Dissonant tritone (devil's interval)
        this.tone(349.23, 0.15, 'sawtooth', 0, 0.2);   // F4
        this.tone(493.88, 0.15, 'sawtooth', 0, 0.2);   // B4 (tritone)

        // Descending sweep
        const t0 = AudioFX.ctx.currentTime;
        const osc = AudioFX.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t0 + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100, t0 + 0.3);

        const gain = AudioFX.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t0 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);

        osc.connect(gain).connect(AudioFX.master);
        osc.start(t0 + 0.1);
        osc.stop(t0 + 0.35);
    },

    /**
     * Success Sound
     * Bright, ascending progression
     */
    success() {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        // Bright C major progression
        this.tone(523.25, 0.12, 'sine', 0, 0.15);    // C5
        this.tone(659.25, 0.12, 'sine', 0.1, 0.15);  // E5
        this.tone(783.99, 0.2, 'sine', 0.2, 0.2);    // G5
        this.tone(1046.5, 0.25, 'sine', 0.3, 0.22);  // C6
    },

    /**
     * Play sound by name
     * Convenience method for calling sounds from other modules
     */
    play(soundName) {
        if (!this.enabled) return;

        const soundMap = {
            'ps1-boot': () => this.ps1Boot(),
            'boot': () => this.ps1Boot(),
            'ripple': () => this.ripple(),
            'window-open': () => this.windowOpen(),
            'window-close': () => this.windowClose(),
            'window-minimize': () => this.windowMinimize(),
            'window-maximize': () => this.windowMaximize(),
            'minimize': () => this.windowMinimize(),
            'maximize': () => this.windowMaximize(),
            'notification': () => this.notification(),
            'konami': () => this.konami(),
            'particle-burst': () => this.particleBurst(),
            'error': () => this.error(),
            'success': () => this.success(),
            'click': () => AudioFX.click(),
            'hover': () => AudioFX.hover(),
            'whoosh': () => AudioFX.whoosh(),
        };

        const soundFn = soundMap[soundName];
        if (soundFn) {
            soundFn();
        } else {
            console.warn(`[SoundManager] Unknown sound: ${soundName}`);
        }
    },

    /**
     * Helper to create tones (wraps AudioFX.tone with gain control)
     */
    tone(freq, dur, type, start, gain = 0.2) {
        if (!this.enabled) return;
        AudioFX.ensureContext();
        if (!AudioFX.ctx) return;

        const t0 = AudioFX.ctx.currentTime + start;
        const osc = AudioFX.ctx.createOscillator();
        const gainNode = AudioFX.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gainNode.gain.setValueAtTime(0.001, t0);
        gainNode.gain.linearRampToValueAtTime(gain, t0 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        osc.connect(gainNode).connect(AudioFX.master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    },

    /**
     * Enable/disable sound manager
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        AudioFX.setEnabled(enabled);
    },

    /**
     * Get stats
     */
    getStats() {
        return {
            enabled: this.enabled,
            audioContext: AudioFX.ctx ? 'initialized' : 'not initialized',
            masterVolume: AudioFX.master?.gain.value || 0
        };
    }
};
