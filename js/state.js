import { FX } from './fx.js';
import { Aurora } from './aurora.js';
import { Glyphs } from './glyphs.js';
import { AudioFX } from './audiofx.js';

/**
 * State Management
 * Handles localStorage persistence, z-index management, and global state
 */

export const State = {
    // Z-index management
    currentZIndex: 100,
    maxZIndex: 100,

    // Window registry
    windows: new Map(),

    // Theme and wallpaper
    theme: 'light',
    // Default wallpaper: gradient (matches CSS default)
    wallpaper: null, // null means use CSS default gradient
    // Futuristic FX toggle
    fxEnabled: false,
    auroraEnabled: false,
    glyphsEnabled: true,
    soundEnabled: true,

    // Idle lock configuration
    idleTime: 120000, // 2 minutes default

    /**
     * Initialize state from localStorage
     */
    init() {
        // Load theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.theme = savedTheme;
            document.body.setAttribute('data-theme', savedTheme);
        }

        // Load wallpaper (only if user has set a custom one)
        const savedWallpaper = localStorage.getItem('wallpaper');
        if (savedWallpaper) {
            this.wallpaper = savedWallpaper;
            this.applyWallpaper(savedWallpaper);
        }
        // Otherwise, use CSS default gradient (no need to apply)

        const savedFx = localStorage.getItem('fxEnabled');
        if (savedFx !== null) {
            this.fxEnabled = savedFx === '1';
        }
        const savedAurora = localStorage.getItem('auroraEnabled');
        if (savedAurora !== null) this.auroraEnabled = savedAurora === '1';
        const savedGlyphs = localStorage.getItem('glyphsEnabled');
        if (savedGlyphs !== null) this.glyphsEnabled = savedGlyphs === '1';
        const savedSound = localStorage.getItem('soundEnabled');
        if (savedSound !== null) this.soundEnabled = savedSound === '1';

        // Load window states
        const savedWindows = localStorage.getItem('windowStates');
        if (savedWindows) {
            try {
                const windowStates = JSON.parse(savedWindows);
                this.windowStates = windowStates;
            } catch (e) {
                console.error('Failed to parse window states:', e);
            }
        }
    },

    /**
     * Set and persist theme
     */
    setTheme(theme) {
        this.theme = theme;
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    },

    /**
     * Toggle theme
     */
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },

    /**
     * Set and persist wallpaper
     */
    setWallpaper(url) {
        this.wallpaper = url;
        this.applyWallpaper(url);
        localStorage.setItem('wallpaper', url);
    },

    /**
     * Apply wallpaper to all wallpaper elements
     * Supports URL prefixes for local assets and external links
     */
    applyWallpaper(input) {
        // Support gradients via tokens like 'gradient:dark-ombre'
        let cssValue = '';
        if (typeof input === 'string' && input.startsWith('gradient:')) {
            const key = input.split(':')[1] || 'grey-ombre';
            switch (key) {
                case 'grey-ombre':
                    cssValue = 'linear-gradient(135deg, #2e3238 0%, #3b424a 50%, #2c3036 100%)';
                    break;
                case 'dark-ombre':
                default:
                    cssValue = 'linear-gradient(135deg, #121316 0%, #1a1c20 50%, #0b0c0e 100%)';
            }
        } else {
            // Determine correct CSS path: prefix '../' for local asset paths
            let url = input;
            const isExternal =
                /^https?:\/\//.test(url) || url.startsWith('/') || url.startsWith('data:');
            if (!isExternal) {
                url = `../${url}`;
            }
            cssValue = `url('${url}')`;
        }

        document.documentElement.style.setProperty('--wallpaper-url', cssValue);
    },

    // FX controls
    setFxEnabled(enabled) {
        this.fxEnabled = !!enabled;
        localStorage.setItem('fxEnabled', this.fxEnabled ? '1' : '0');
        if (FX) FX.setEnabled(this.fxEnabled);
    },

    toggleFx() {
        this.setFxEnabled(!this.fxEnabled);
    },

    setAuroraEnabled(v) {
        this.auroraEnabled = !!v;
        localStorage.setItem('auroraEnabled', this.auroraEnabled ? '1' : '0');
        if (Aurora) Aurora.setEnabled(this.auroraEnabled);
    },
    toggleAurora() {
        this.setAuroraEnabled(!this.auroraEnabled);
    },

    setGlyphsEnabled(v) {
        this.glyphsEnabled = !!v;
        localStorage.setItem('glyphsEnabled', this.glyphsEnabled ? '1' : '0');
        if (Glyphs) Glyphs.setEnabled(this.glyphsEnabled);
    },
    toggleGlyphs() {
        this.setGlyphsEnabled(!this.glyphsEnabled);
    },

    setSoundEnabled(v) {
        this.soundEnabled = !!v;
        localStorage.setItem('soundEnabled', this.soundEnabled ? '1' : '0');
        if (AudioFX) AudioFX.setEnabled(this.soundEnabled);
    },
    toggleSound() {
        this.setSoundEnabled(!this.soundEnabled);
    },

    /** Reset wallpaper to default image */
    resetWallpaper() {
        this.setWallpaper('assets/wallpapers/default.jpg');
    },

    /**
     * Get next z-index
     */
    getNextZIndex() {
        this.currentZIndex++;
        if (this.currentZIndex > this.maxZIndex) {
            this.maxZIndex = this.currentZIndex;
        }
        return this.currentZIndex;
    },

    /**
     * Register a window
     */
    registerWindow(id, windowObj) {
        this.windows.set(id, windowObj);
    },

    /**
     * Unregister a window
     */
    unregisterWindow(id) {
        this.windows.delete(id);
        this.saveWindowStates();
    },

    /**
     * Get window by ID
     */
    getWindow(id) {
        return this.windows.get(id);
    },

    /**
     * Get all windows
     */
    getAllWindows() {
        return Array.from(this.windows.values());
    },

    /**
     * Save window states to localStorage
     */
    saveWindowStates() {
        const states = {};
        this.windows.forEach((win, id) => {
            if (!win.element) return;

            const rect = win.element.getBoundingClientRect();
            states[id] = {
                x: win.x,
                y: win.y,
                width: win.width,
                height: win.height,
                minimized: win.minimized,
                maximized: win.maximized,
            };
        });
        localStorage.setItem('windowStates', JSON.stringify(states));
        // Keep in-memory window states updated
        this.windowStates = states;
    },

    /**
     * Get saved window state
     */
    getWindowState(id) {
        if (!this.windowStates) return null;
        return this.windowStates[id] || null;
    },

    /**
     * Clear all saved states (for debugging)
     */
    clearAllStates() {
        localStorage.removeItem('windowStates');
        localStorage.removeItem('theme');
        localStorage.removeItem('wallpaper');
        this.windowStates = {};
    },
};

// Initialize state on load
State.init();
