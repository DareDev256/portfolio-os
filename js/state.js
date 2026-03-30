/**
 * State Management
 * Handles localStorage persistence, z-index management, and global state
 * Modules register themselves via registerModule() — no static imports here
 * to avoid defeating lazy loading.
 */
import { loadJSON, loadBool, saveBool } from './dom-helpers.js';
import { Sanitize } from './sanitize.js';

/**
 * Registry of boolean toggle properties.
 * Each entry defines the property name (also the localStorage key),
 * default value, and event name emitted on change.
 * Setters, toggles, and init() loading are all driven from this table.
 */
const BOOLEAN_TOGGLES = [
    // FX layer
    { prop: 'fxEnabled',              defaultVal: false, event: 'fx' },
    { prop: 'auroraEnabled',          defaultVal: false, event: 'aurora' },
    { prop: 'glyphsEnabled',          defaultVal: true,  event: 'glyphs' },
    { prop: 'soundEnabled',           defaultVal: true,  event: 'sound' },
    // Interaction engine
    { prop: 'interactionsEnabled',    defaultVal: true,  event: 'interactions' },
    { prop: 'microInteractionsEnabled', defaultVal: true, event: null },
    { prop: 'cursorReactiveEnabled',  defaultVal: true,  event: null },
    { prop: 'cursorTrailEnabled',     defaultVal: false, event: 'cursorTrail' },
    { prop: 'easterEggsEnabled',      defaultVal: true,  event: null },
];

export const State = {
    /** Dispatch a state change event so visual modules can react without coupling */
    _emit(name, detail) {
        document.dispatchEvent(new CustomEvent('state:' + name, { detail }));
    },

    /** Load a boolean from localStorage ('1'/'0'), falling back to current value */
    _loadBoolean(key) {
        const saved = localStorage.getItem(key);
        if (saved !== null) this[key] = loadBool(key, this[key]);
    },

    /** Generic boolean setter: persist, emit, return new value */
    _setBoolean(prop, enabled, event) {
        this[prop] = !!enabled;
        saveBool(prop, this[prop]);
        if (event) this._emit(event, { enabled: this[prop] });
    },

    // Z-index management — windows live in [100, 899] to avoid breaching
    // reserved UI tiers (top bar 900, Passion 900+, modals 10000+)
    WINDOW_Z_FLOOR: 100,
    WINDOW_Z_CEILING: 899,
    currentZIndex: 100,
    maxZIndex: 100,

    // Window registry
    windows: new Map(),

    // Theme and wallpaper
    theme: 'light',
    VALID_THEMES: ['light', 'dark'],
    wallpaper: null, // null means use CSS default gradient
    cursorTrailType: 'chakra', // 'playstation' or 'chakra'
    VALID_TRAIL_TYPES: ['chakra', 'playstation'],
    interactionIntensity: 100, // 0-100
    idleTime: 120000, // 2 minutes default

    /**
     * Initialize state from localStorage
     */
    init() {
        // Load theme — allowlist-validated to prevent localStorage poisoning
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            const safe = Sanitize.allowlist(savedTheme, this.VALID_THEMES, 'light');
            this.theme = safe;
            document.body.setAttribute('data-theme', safe);
        }

        // Load wallpaper (only if user has set a custom one)
        // Validate before applying — localStorage could contain poisoned values
        // from crafted backup imports or devtools tampering
        const savedWallpaper = localStorage.getItem('wallpaper');
        if (savedWallpaper) {
            const safe = this._validateWallpaperUrl(savedWallpaper);
            if (safe) {
                this.wallpaper = safe;
                this.applyWallpaper(safe);
            } else {
                // Purge invalid stored wallpaper so it doesn't re-trigger on every load
                localStorage.removeItem('wallpaper');
            }
        }

        // Load all boolean toggles from localStorage
        for (const { prop } of BOOLEAN_TOGGLES) {
            this._loadBoolean(prop);
        }

        // Non-boolean persisted settings — validated against allowlists
        const savedTrailType = localStorage.getItem('cursorTrailType');
        if (savedTrailType) {
            this.cursorTrailType = Sanitize.allowlist(savedTrailType, this.VALID_TRAIL_TYPES, 'chakra');
        }
        const savedIntensity = localStorage.getItem('interactionIntensity');
        if (savedIntensity !== null) {
            const parsed = parseInt(savedIntensity, 10);
            this.interactionIntensity = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 100;
        }

        // Load window states
        const windowStates = loadJSON('windowStates');
        if (windowStates) this.windowStates = windowStates;
    },

    /**
     * Set and persist theme — allowlist-validated to prevent attribute injection
     */
    setTheme(theme) {
        const safe = Sanitize.allowlist(theme, this.VALID_THEMES, 'light');
        this.theme = safe;
        document.body.setAttribute('data-theme', safe);
        localStorage.setItem('theme', safe);
    },

    /**
     * Toggle theme
     */
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },

    /**
     * Allowlisted gradient tokens for wallpaper.
     * Only these keys are valid — prevents injection via crafted gradient: strings.
     */
    VALID_GRADIENTS: {
        'grey-ombre': 'linear-gradient(135deg, #2e3238 0%, #3b424a 50%, #2c3036 100%)',
        'dark-ombre': 'linear-gradient(135deg, #121316 0%, #1a1c20 50%, #0b0c0e 100%)',
    },

    /**
     * Validate a wallpaper URL before persistence or application.
     * Uses Sanitize.url() (allowlist: http/https/relative) as the primary gate,
     * with explicit allowlists for gradient tokens and safe data:image/ URIs.
     * Returns the validated string, or empty string if blocked.
     * @param {string} input - Raw wallpaper URL or gradient token
     * @returns {string} Validated value or ''
     */
    _validateWallpaperUrl(input) {
        if (!input || typeof input !== 'string') return '';

        // Gradient tokens — validate key against allowlist
        if (input.startsWith('gradient:')) {
            const key = input.slice(9);
            return (key in this.VALID_GRADIENTS) ? input : '';
        }

        // Strip control chars that hide protocol (tab, newline, null)
        // eslint-disable-next-line no-control-regex
        const stripped = input.replace(/[\x00-\x1f\x7f]/g, '').trim();
        if (!stripped) return '';

        // Safe data:image/ URIs — strict MIME allowlist (no svg+xml, no text/html)
        const lower = stripped.toLowerCase();
        if (lower.startsWith('data:image/')) {
            const SAFE_MIMES = ['data:image/png', 'data:image/jpeg', 'data:image/gif', 'data:image/webp'];
            if (SAFE_MIMES.some(m => lower.startsWith(m))) return stripped;
            return ''; // Blocks svg+xml (can contain <script>), and any unknown image type
        }

        // All other URLs go through the centralized allowlist validator
        // (permits only http(s) and relative paths — blocks javascript:, vbscript:, blob:, etc.)
        return Sanitize.url(stripped);
    },

    /**
     * Set and persist wallpaper — validates before storing to prevent
     * localStorage poisoning with dangerous URIs that persist across sessions.
     */
    setWallpaper(url) {
        const safe = this._validateWallpaperUrl(url);
        if (!safe) {
            console.warn('[State] Blocked invalid wallpaper URL');
            return;
        }
        this.wallpaper = safe;
        this.applyWallpaper(safe);
        localStorage.setItem('wallpaper', safe);
    },

    /**
     * Apply wallpaper to all wallpaper elements.
     * Expects pre-validated input from setWallpaper/init — keeps defense-in-depth
     * CSS injection guards as a secondary layer.
     */
    applyWallpaper(input) {
        // Gradient tokens — lookup from validated allowlist
        if (typeof input === 'string' && input.startsWith('gradient:')) {
            const key = input.slice(9);
            const cssValue = this.VALID_GRADIENTS[key] || this.VALID_GRADIENTS['dark-ombre'];
            document.documentElement.style.setProperty('--wallpaper-url', cssValue);
            return;
        }

        // Defense-in-depth: strip CSS-breakout chars even though input is pre-validated
        let url = typeof input === 'string' ? input : '';
        url = url.replace(/['"()\\;<>]/g, '');
        if (!url) return;

        const isExternal =
            /^https?:\/\//.test(url) || url.startsWith('/') || url.startsWith('data:');
        if (!isExternal) {
            url = `../${url}`;
        }

        document.documentElement.style.setProperty('--wallpaper-url', `url('${url}')`);
    },

    setCursorTrailType(type) {
        const safe = Sanitize.allowlist(type, this.VALID_TRAIL_TYPES, 'chakra');
        this.cursorTrailType = safe;
        localStorage.setItem('cursorTrailType', safe);
        this._emit('cursorTrailType', { type: safe });
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
     * Get next z-index for a window.
     * Windows are capped at WINDOW_Z_CEILING (899) so they never overlap
     * the top bar, dock (900), Passion widget, or modal layers (10000+).
     * When the ceiling is hit, all window z-indices are compacted back down.
     */
    getNextZIndex() {
        this.currentZIndex++;
        if (this.currentZIndex > this.WINDOW_Z_CEILING) {
            this._normalizeZIndices();
        }
        if (this.currentZIndex > this.maxZIndex) {
            this.maxZIndex = this.currentZIndex;
        }
        return this.currentZIndex;
    },

    /**
     * Compact all window z-indices back to base range.
     * Preserves relative stacking order so the topmost window stays on top.
     */
    _normalizeZIndices() {
        const wins = Array.from(this.windows.values())
            .filter(w => w.element)
            .sort((a, b) => {
                const za = parseInt(a.element.style.zIndex, 10) || 0;
                const zb = parseInt(b.element.style.zIndex, 10) || 0;
                return za - zb;
            });
        let z = this.WINDOW_Z_FLOOR;
        for (const win of wins) {
            z++;
            win.element.style.zIndex = z;
        }
        this.currentZIndex = z;
        this.maxZIndex = z;
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

// Generate default properties, setters, and toggles from the BOOLEAN_TOGGLES registry.
// This replaces ~70 lines of copy-pasted set/toggle methods with data-driven generation.
// Public API is identical: State.setFxEnabled(v), State.toggleFx(), State.fxEnabled, etc.
for (const { prop, defaultVal, event } of BOOLEAN_TOGGLES) {
    // Set default value as a direct property
    State[prop] = defaultVal;

    // Derive method names: 'fxEnabled' → 'setFxEnabled' / 'toggleFx'
    const upperProp = prop[0].toUpperCase() + prop.slice(1);
    const setterName = 'set' + upperProp;
    // Toggle name strips 'Enabled' suffix: 'FxEnabled' → 'toggleFx'
    const toggleBase = upperProp.replace(/Enabled$/, '');
    const toggleName = 'toggle' + toggleBase;

    State[setterName] = function (v) {
        this._setBoolean(prop, v, event);
    };
    State[toggleName] = function () {
        this[setterName](!this[prop]);
    };
}

// Initialize state on load (guarded for test environments)
if (typeof window !== 'undefined' && typeof localStorage?.getItem === 'function') {
    State.init();
}
