/**
 * State Management
 * Handles localStorage persistence, z-index management, and global state
 * Modules register themselves via registerModule() — no static imports here
 * to avoid defeating lazy loading.
 */
import { loadJSON } from './dom-helpers.js';

export const State = {
    /** Dispatch a state change event so visual modules can react without coupling */
    _emit(name, detail) {
        document.dispatchEvent(new CustomEvent('state:' + name, { detail }));
    },
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

    // Interaction Engine settings
    interactionsEnabled: true,
    microInteractionsEnabled: true,
    cursorReactiveEnabled: true,
    cursorTrailEnabled: false, // Disabled by default, can be enabled via Konami code
    cursorTrailType: 'chakra', // 'playstation' or 'chakra' - chakra is default, PS unlocked via secret
    easterEggsEnabled: true,
    interactionIntensity: 100, // 0-100

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

        // Load interaction engine settings
        const savedInteractions = localStorage.getItem('interactionsEnabled');
        if (savedInteractions !== null) this.interactionsEnabled = savedInteractions === '1';
        const savedMicroInteractions = localStorage.getItem('microInteractionsEnabled');
        if (savedMicroInteractions !== null) this.microInteractionsEnabled = savedMicroInteractions === '1';
        const savedCursorReactive = localStorage.getItem('cursorReactiveEnabled');
        if (savedCursorReactive !== null) this.cursorReactiveEnabled = savedCursorReactive === '1';
        const savedCursorTrail = localStorage.getItem('cursorTrailEnabled');
        if (savedCursorTrail !== null) this.cursorTrailEnabled = savedCursorTrail === '1';
        const savedTrailType = localStorage.getItem('cursorTrailType');
        if (savedTrailType) this.cursorTrailType = savedTrailType;
        const savedEasterEggs = localStorage.getItem('easterEggsEnabled');
        if (savedEasterEggs !== null) this.easterEggsEnabled = savedEasterEggs === '1';
        const savedIntensity = localStorage.getItem('interactionIntensity');
        if (savedIntensity !== null) this.interactionIntensity = parseInt(savedIntensity, 10);

        // Load window states
        const windowStates = loadJSON('windowStates');
        if (windowStates) this.windowStates = windowStates;
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

            // Block dangerous protocols — allowlist safe data: subtypes only
            const lower = url.toLowerCase().trim();
            if (
                lower.startsWith('javascript:') ||
                (lower.startsWith('data:') &&
                    !lower.startsWith('data:image/png') &&
                    !lower.startsWith('data:image/jpeg') &&
                    !lower.startsWith('data:image/gif') &&
                    !lower.startsWith('data:image/webp'))
            ) {
                console.warn('[State] Blocked dangerous wallpaper URL:', url);
                return;
            }

            // Strip characters that could break out of CSS url('...')
            url = url.replace(/['"()\\;<>]/g, '');

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
        this._emit('fx', { enabled: this.fxEnabled });
    },

    toggleFx() {
        this.setFxEnabled(!this.fxEnabled);
    },

    setAuroraEnabled(v) {
        this.auroraEnabled = !!v;
        localStorage.setItem('auroraEnabled', this.auroraEnabled ? '1' : '0');
        this._emit('aurora', { enabled: this.auroraEnabled });
    },
    toggleAurora() {
        this.setAuroraEnabled(!this.auroraEnabled);
    },

    setGlyphsEnabled(v) {
        this.glyphsEnabled = !!v;
        localStorage.setItem('glyphsEnabled', this.glyphsEnabled ? '1' : '0');
        this._emit('glyphs', { enabled: this.glyphsEnabled });
    },
    toggleGlyphs() {
        this.setGlyphsEnabled(!this.glyphsEnabled);
    },

    setSoundEnabled(v) {
        this.soundEnabled = !!v;
        localStorage.setItem('soundEnabled', this.soundEnabled ? '1' : '0');
        this._emit('sound', { enabled: this.soundEnabled });
    },
    toggleSound() {
        this.setSoundEnabled(!this.soundEnabled);
    },

    // Interaction Engine controls
    setInteractionsEnabled(v) {
        this.interactionsEnabled = !!v;
        localStorage.setItem('interactionsEnabled', this.interactionsEnabled ? '1' : '0');
        this._emit('interactions', { enabled: this.interactionsEnabled });
    },
    toggleInteractions() {
        this.setInteractionsEnabled(!this.interactionsEnabled);
    },

    setCursorTrailEnabled(v) {
        this.cursorTrailEnabled = !!v;
        localStorage.setItem('cursorTrailEnabled', this.cursorTrailEnabled ? '1' : '0');
        this._emit('cursorTrail', { enabled: this.cursorTrailEnabled });
    },

    setCursorTrailType(type) {
        this.cursorTrailType = type;
        localStorage.setItem('cursorTrailType', type);
        this._emit('cursorTrailType', { type });
    },

    toggleCursorTrail() {
        this.setCursorTrailEnabled(!this.cursorTrailEnabled);
    },

    setInteractionIntensity(intensity) {
        this.interactionIntensity = Math.max(0, Math.min(100, intensity));
        localStorage.setItem('interactionIntensity', this.interactionIntensity.toString());
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

// Initialize state on load (guarded for test environments)
if (typeof window !== 'undefined' && typeof localStorage?.getItem === 'function') {
    State.init();
}
