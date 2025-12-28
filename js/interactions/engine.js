/**
 * Interaction Engine
 * Central coordination hub for all micro-interactions, cursor-reactive effects,
 * and easter eggs. Runs a single requestAnimationFrame loop for optimal performance.
 */

export const InteractionEngine = {
    // Core state
    isRunning: false,
    isEnabled: false,
    rafId: null,

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

    /**
     * Initialize the interaction engine
     */
    async init() {
        console.log('[InteractionEngine] Initializing...');

        // Check for reduced motion preference
        if (this.settings.respectReducedMotion) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                console.log('[InteractionEngine] Reduced motion detected, engine disabled');
                return;
            }
        }

        // Check hardware capabilities
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            console.log('[InteractionEngine] Low-end device detected, engine disabled');
            return;
        }

        // Lazy-load modules
        try {
            const [
                { CursorTracker },
                { MicroInteractions },
                { CursorReactive },
                { CursorTrail },
                { EasterEggs },
                { SoundManager }
            ] = await Promise.all([
                import('./cursor-tracker.js'),
                import('./micro-interactions.js'),
                import('./cursor-reactive.js'),
                import('./cursor-trail.js'),
                import('./easter-eggs.js'),
                import('./sound-manager.js')
            ]);

            this.cursorTracker = CursorTracker;
            this.microInteractions = MicroInteractions;
            this.cursorReactive = CursorReactive;
            this.cursorTrail = CursorTrail;
            this.easterEggs = EasterEggs;
            this.soundManager = SoundManager;

            // Initialize all modules
            this.cursorTracker.init();
            this.microInteractions.init();
            this.cursorReactive.init();
            this.cursorTrail.init();
            this.easterEggs.init();
            this.soundManager.init();

            this.isEnabled = true;
            console.log('[InteractionEngine] All modules loaded successfully');

        } catch (error) {
            console.error('[InteractionEngine] Failed to load modules:', error);
            return;
        }

        // Start the animation loop
        this.start();
    },

    /**
     * Start the animation loop
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.loop(this.lastFrameTime);

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

        // Calculate delta time and FPS
        const deltaTime = timestamp - this.lastFrameTime;
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
        if (frameTime > 9) {
            console.warn(`[InteractionEngine] Frame time exceeded budget: ${frameTime.toFixed(2)}ms`);
        }

        // Schedule next frame
        this.rafId = requestAnimationFrame(this.loop.bind(this));
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
            this.lowFPSCount += 16.67; // Approximate ms per frame

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
            this.lowFPSCount = Math.max(0, this.lowFPSCount - 16.67);
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
    setEnabled(enabled) {
        if (enabled && !this.isRunning) {
            this.start();
        } else if (!enabled && this.isRunning) {
            this.stop();
        }
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
