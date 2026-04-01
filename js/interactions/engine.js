/**
 * Interaction Engine
 * Central coordination hub for all micro-interactions, cursor-reactive effects,
 * and easter eggs. Runs a single requestAnimationFrame loop for optimal performance.
 */
import { onVisibilityChange } from '../dom-helpers.js';

export const InteractionEngine = {
    // Core state
    isRunning: false,
    isEnabled: false,
    rafId: null,
    _modulesLoaded: false,
    _initPromise: null,
    _boundLoop: null, // cached bound loop — avoids allocating a new function every frame
    _unsubVisibility: null,

    // Performance tracking
    lastFrameTime: 0,
    fps: 60,
    frameCount: 0,
    fpsHistory: [],

    // Element registry
    registeredElements: new Map(),

    // Module references (lazy-loaded)
    cursorTracker: null,
    microInteractions: null,
    cursorReactive: null,
    cursorTrail: null,
    easterEggs: null,
    soundManager: null,

    // Settings
    settings: {
        targetFPS: 60,
        performanceMonitoring: true,
        autoDisableThreshold: 30, // Disable if FPS drops below this for 5s
        viewportCulling: true,
        respectReducedMotion: true,
    },

    // Performance monitoring
    lowFPSCount: 0,
    lowFPSThreshold: 5000, // 5 seconds
    FRAME_BUDGET_MS: 9,        // max ms per frame to maintain 60fps
    THROTTLE_INTERVAL_MS: 33,  // 30fps throttle — skip work if less than this since last frame
    APPROX_FRAME_MS: 16.67,    // approximate ms per frame at 60fps

    /**
     * Initialize the interaction engine
     * @param {Object} options
     * @param {boolean} options.startLoop - Whether to start the animation loop (default: true)
     */
    async init(options = {}) {
        const { startLoop = true } = options;
        if (this._modulesLoaded) return;
        if (this._initPromise) return this._initPromise;
        this._initPromise = this._doInit(startLoop);
        return this._initPromise;
    },

    async _doInit(startLoop) {

        console.log('[InteractionEngine] Initializing...');

        // Check for reduced motion preference — only gates the animation loop,
        // not event-driven modules like easter eggs
        const prefersReducedMotion = this.settings.respectReducedMotion &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            console.log('[InteractionEngine] Reduced motion — loop disabled, event-driven features active');
        }

        // Check hardware capabilities (warn but don't block — user preference takes priority)
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            console.warn('[InteractionEngine] Low-end device detected (cores:', navigator.hardwareConcurrency, ') — running with reduced effects');
        }

        // Lazy-load modules — allSettled so one failure doesn't kill everything
        const results = await Promise.allSettled([
            import('./cursor-tracker.js'),
            import('./micro-interactions.js'),
            import('./cursor-reactive.js'),
            import('./cursor-trail.js'),
            import('./easter-eggs.js'),
            import('./sound-manager.js')
        ]);

        const names = ['cursorTracker', 'microInteractions', 'cursorReactive', 'cursorTrail', 'easterEggs', 'soundManager'];
        const exports = ['CursorTracker', 'MicroInteractions', 'CursorReactive', 'CursorTrail', 'EasterEggs', 'SoundManager'];

        results.forEach((r, i) => {
            if (r.status === 'fulfilled') {
                this[names[i]] = r.value[exports[i]];
                this[names[i]].init();
            } else {
                console.warn(`[InteractionEngine] ${names[i]} failed to load:`, r.reason);
            }
        });

        this._modulesLoaded = true;
        this._initPromise = null;
        this.isEnabled = true;
        console.log('[InteractionEngine] Module loading complete');

        // Start the animation loop only if requested and motion is allowed
        if (startLoop && !prefersReducedMotion) {
            this.start();
        }
    },

    /**
     * Start the animation loop
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        if (!this._boundLoop) this._boundLoop = this.loop.bind(this);
        this._boundLoop(this.lastFrameTime);

        // Pause when tab is hidden, resume when visible — shared listener
        if (!this._unsubVisibility) {
            this._unsubVisibility = onVisibilityChange(
                () => this.stop(),
                () => this.start(),
            );
        }

        console.log('[InteractionEngine] Animation loop started');
    },

    /**
     * Stop the animation loop
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        console.log('[InteractionEngine] Animation loop stopped');
    },

    /**
     * Main animation loop
     * Budget: ~9ms per frame to maintain 60fps
     */
    loop(timestamp) {
        if (!this.isRunning) return;

        // Schedule next frame FIRST (ensures loop continues even if we skip work)
        this.rafId = requestAnimationFrame(this._boundLoop);

        // 30fps throttle — skip work if less than THROTTLE_INTERVAL_MS since last frame
        const deltaTime = timestamp - this.lastFrameTime;
        if (deltaTime < this.THROTTLE_INTERVAL_MS) return;
        this.lastFrameTime = timestamp;

        const currentFPS = 1000 / deltaTime;
        this.fps = currentFPS;

        // Performance monitoring
        if (this.settings.performanceMonitoring) {
            this.monitorPerformance(currentFPS);
        }

        // Update all modules
        const startTime = performance.now();

        try {
            // 1. Update cursor tracking (~0.5ms)
            if (this.cursorTracker) {
                this.cursorTracker.update(timestamp, deltaTime);
            }

            // 2. Update micro-interactions (~2ms)
            if (this.microInteractions) {
                this.microInteractions.update(timestamp, deltaTime);
            }

            // 3. Update cursor-reactive effects (~3ms)
            if (this.cursorReactive) {
                const cursorData = this.cursorTracker.getData();
                this.cursorReactive.update(timestamp, deltaTime, cursorData, this.registeredElements);
            }

            // 4. Update cursor trail (~2ms)
            if (this.cursorTrail) {
                const cursorData = this.cursorTracker.getData();
                this.cursorTrail.update(timestamp, deltaTime, cursorData);
            }

            // 5. Update easter eggs (~0.5ms)
            if (this.easterEggs) {
                this.easterEggs.update(timestamp, deltaTime);
            }

        } catch (error) {
            console.error('[InteractionEngine] Error in animation loop:', error);
        }

        // Debug: Log frame time if over budget
        const frameTime = performance.now() - startTime;
        if (frameTime > this.FRAME_BUDGET_MS) {
            console.warn(`[InteractionEngine] Frame time exceeded budget: ${frameTime.toFixed(2)}ms`);
        }
    },

    /**
     * Monitor performance and auto-disable if needed
     */
    monitorPerformance(currentFPS) {
        // Track FPS history (last 60 frames)
        this.fpsHistory.push(currentFPS);
        if (this.fpsHistory.length > 60) {
            this.fpsHistory.shift();
        }

        // Check for sustained low FPS
        if (currentFPS < this.settings.autoDisableThreshold) {
            this.lowFPSCount += this.APPROX_FRAME_MS;

            // If low FPS for 5 seconds, disable engine
            if (this.lowFPSCount >= this.lowFPSThreshold) {
                console.warn('[InteractionEngine] Sustained low FPS detected, disabling engine');
                this.stop();
                this.isEnabled = false;

                // Notify user
                if (window.Modal && window.Modal.showNotification) {
                    window.Modal.showNotification(
                        'Performance Mode',
                        'Interaction effects have been disabled to maintain performance.',
                        'info'
                    );
                }
            }
        } else {
            // Reset counter if FPS recovers
            this.lowFPSCount = Math.max(0, this.lowFPSCount - this.APPROX_FRAME_MS);
        }
    },

    /**
     * Register an element for interactions
     * @param {HTMLElement} element - The element to register
     * @param {Object} config - Configuration for interactions
     */
    register(element, config = {}) {
        if (!element || !(element instanceof HTMLElement)) {
            console.warn('[InteractionEngine] Invalid element provided for registration');
            return;
        }

        // Default configuration
        const defaultConfig = {
            effects: [], // Array of effect names: 'ripple', 'glow', 'tilt', etc.
            color: null, // Override color (uses theme default if null)
            intensity: 1.0, // Intensity multiplier (0-1)
            enabled: true,
        };

        const finalConfig = { ...defaultConfig, ...config };

        // Parse data attributes if present
        const dataInteract = element.getAttribute('data-interact');
        if (dataInteract) {
            finalConfig.effects = dataInteract.split(',').map(e => e.trim());
        }

        const dataColor = element.getAttribute('data-interact-color');
        if (dataColor) {
            finalConfig.color = dataColor;
        }

        // Store element configuration
        this.registeredElements.set(element, {
            config: finalConfig,
            bounds: null, // Will be calculated on first frame
            isVisible: true,
            lastUpdate: 0,
        });

        // Register with appropriate modules
        if (finalConfig.effects.includes('ripple') || finalConfig.effects.includes('press-release')) {
            this.microInteractions?.registerElement(element, finalConfig);
        }

        if (finalConfig.effects.includes('tilt') || finalConfig.effects.includes('magnetic-edges') || finalConfig.effects.includes('ambient-glow')) {
            this.cursorReactive?.registerElement(element, finalConfig);
        }

        console.log('[InteractionEngine] Registered element:', element, finalConfig);
    },

    /**
     * Unregister an element
     * @param {HTMLElement} element - The element to unregister
     */
    unregister(element) {
        if (!this.registeredElements.has(element)) {
            return;
        }

        // Unregister from modules
        this.microInteractions?.unregisterElement(element);
        this.cursorReactive?.unregisterElement(element);

        // Remove from registry
        this.registeredElements.delete(element);

        console.log('[InteractionEngine] Unregistered element:', element);
    },

    /**
     * Enable/disable the engine
     */
    async setEnabled(enabled) {
        if (enabled && !this._modulesLoaded && !this._initializing) {
            await this.init({ startLoop: true });
            return;
        }
        if (enabled && !this.isRunning) this.start();
        else if (!enabled && this.isRunning) this.stop();
        this.isEnabled = enabled;
    },

    /**
     * Get current FPS
     */
    getFPS() {
        return Math.round(this.fps);
    },

    /**
     * Get average FPS over last 60 frames
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) return 0;
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.fpsHistory.length);
    },

    /**
     * Get debug stats
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            isEnabled: this.isEnabled,
            fps: this.getFPS(),
            avgFPS: this.getAverageFPS(),
            registeredElements: this.registeredElements.size,
            cursorData: this.cursorTracker?.getData(),
        };
    },
};
