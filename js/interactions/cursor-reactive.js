/**
 * Cursor-Reactive Effects
 * Makes UI elements respond to cursor proximity and position
 * Windows tilt, buttons glow, icons wake up - everything feels aware
 */
import { hexAlpha } from '../dom-helpers.js';

export const CursorReactive = {
    registeredElements: new Map(),
    viewportElements: new Set(),

    // Performance settings
    updateThrottle: 1, // Update every frame (can increase to throttle)
    frameCounter: 0,
    proximityThreshold: 150, // pixels - only affect elements within this distance

    // Effect intensities (can be modulated by State.interactionIntensity)
    intensityMultiplier: 1.0,

    init() {
        console.log('[CursorReactive] Initialized');

        // Setup background gradient
        this.setupBackgroundGradient();
    },

    /**
     * Setup background gradient that follows cursor
     */
    setupBackgroundGradient() {
        // Add CSS custom properties to document root
        document.documentElement.style.setProperty('--cursor-x', '50%');
        document.documentElement.style.setProperty('--cursor-y', '50%');
    },

    /**
     * Main update loop (called from engine)
     */
    update(timestamp, deltaTime, cursorData, _allElements) {
        this.frameCounter++;

        // Throttle updates if needed
        if (this.frameCounter % this.updateThrottle !== 0) {
            return;
        }

        // Update viewport culling
        this.updateViewportElements();

        // Update background gradient position
        this.updateBackgroundGradient(cursorData);

        // Process each registered element
        this.registeredElements.forEach((data, element) => {
            // Skip if not visible or not in viewport
            if (!data.isVisible || !this.viewportElements.has(element)) {
                return;
            }

            // Calculate element bounds (cached)
            if (!data.bounds || timestamp - data.lastBoundsUpdate > 1000) {
                data.bounds = element.getBoundingClientRect();
                data.centerX = data.bounds.left + data.bounds.width / 2;
                data.centerY = data.bounds.top + data.bounds.height / 2;
                data.lastBoundsUpdate = timestamp;
            }

            // Calculate distance from cursor to element center
            const dx = cursorData.x - data.centerX;
            const dy = cursorData.y - data.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Skip if too far away (performance optimization)
            if (distance > this.proximityThreshold && !this.isOverElement(element, cursorData)) {
                this.resetElement(element, data);
                return;
            }

            // Calculate proximity factor (0-1, 1 = at center, 0 = at threshold)
            const proximity = Math.max(0, 1 - (distance / this.proximityThreshold));

            // Apply effects based on element type and configuration
            const effects = data.config.effects || [];

            if (effects.includes('tilt')) {
                this.applyWindowTilt(element, cursorData, data);
            }

            if (effects.includes('magnetic-edges')) {
                this.applyMagneticEdges(element, cursorData, data);
            }

            if (effects.includes('ambient-glow')) {
                this.applyAmbientGlow(element, cursorData, data);
            }

            if (effects.includes('proximity-glow')) {
                this.applyProximityGlow(element, proximity, data);
            }

            if (effects.includes('magnetic-attract')) {
                this.applyMagneticAttraction(element, dx, dy, proximity, data);
            }

            if (effects.includes('wake')) {
                this.applyWakeEffect(element, proximity, data);
            }
        });
    },

    /**
     * Update which elements are in viewport
     */
    updateViewportElements() {
        this.viewportElements.clear();

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        this.registeredElements.forEach((data, element) => {
            if (!data.bounds) return;

            const inViewport = (
                data.bounds.bottom >= 0 &&
                data.bounds.right >= 0 &&
                data.bounds.top <= viewportHeight &&
                data.bounds.left <= viewportWidth
            );

            if (inViewport) {
                this.viewportElements.add(element);
            }
        });
    },

    /**
     * Update background gradient following cursor
     */
    updateBackgroundGradient(cursorData) {
        // Convert cursor position to percentage
        const xPercent = (cursorData.x / window.innerWidth) * 100;
        const yPercent = (cursorData.y / window.innerHeight) * 100;

        // Update CSS variables (very subtle shift, 2-3%)
        const shiftX = 50 + (xPercent - 50) * 0.03;
        const shiftY = 50 + (yPercent - 50) * 0.03;

        document.documentElement.style.setProperty('--cursor-x', `${shiftX}%`);
        document.documentElement.style.setProperty('--cursor-y', `${shiftY}%`);
    },

    /**
     * Apply perspective tilt to windows
     */
    applyWindowTilt(element, cursorData, data) {
        // Only tilt if cursor is over the element
        if (!this.isOverElement(element, cursorData)) {
            element.style.transform = '';
            return;
        }

        const bounds = data.bounds;

        // Calculate relative position (-1 to 1)
        const relX = ((cursorData.x - bounds.left) / bounds.width) * 2 - 1;
        const relY = ((cursorData.y - bounds.top) / bounds.height) * 2 - 1;

        // Calculate rotation (max ±5 degrees)
        const maxTilt = 5 * this.intensityMultiplier;
        const rotateY = relX * maxTilt;
        const rotateX = -relY * maxTilt;

        // Apply transform
        element.style.transition = 'transform var(--transition-fast)';
        element.style.transformStyle = 'preserve-3d';
        element.style.perspective = '1000px';
        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    },

    /**
     * Apply magnetic edges effect
     */
    applyMagneticEdges(element, cursorData, data) {
        const bounds = data.bounds;
        const edgeThreshold = 40; // pixels from edge
        const maxPull = 8; // max pixels to pull

        let pullX = 0;
        let pullY = 0;

        // Check proximity to edges
        const leftDist = cursorData.x - bounds.left;
        const rightDist = bounds.right - cursorData.x;
        const topDist = cursorData.y - bounds.top;
        const bottomDist = bounds.bottom - cursorData.y;

        // Left edge
        if (leftDist < edgeThreshold && leftDist > 0) {
            pullX = -(1 - leftDist / edgeThreshold) * maxPull;
        }
        // Right edge
        else if (rightDist < edgeThreshold && rightDist > 0) {
            pullX = (1 - rightDist / edgeThreshold) * maxPull;
        }

        // Top edge
        if (topDist < edgeThreshold && topDist > 0) {
            pullY = -(1 - topDist / edgeThreshold) * maxPull;
        }
        // Bottom edge
        else if (bottomDist < edgeThreshold && bottomDist > 0) {
            pullY = (1 - bottomDist / edgeThreshold) * maxPull;
        }

        // Apply magnetic pull
        if (pullX !== 0 || pullY !== 0) {
            const currentTransform = element.style.transform || '';
            element.style.transform = currentTransform.replace(/translate\([^)]+\)/, '') +
                ` translate(${pullX}px, ${pullY}px)`;
        }
    },

    /**
     * Apply ambient glow around element border
     */
    applyAmbientGlow(element, cursorData, data) {
        if (!this.isOverElement(element, cursorData)) {
            element.style.boxShadow = '';
            return;
        }

        const color = data.config.color || '#00f0ff';

        // Create radial gradient glow effect
        const glowOpacity = 0.3 * this.intensityMultiplier;
        element.style.boxShadow = `
            0 0 30px ${color}${hexAlpha(glowOpacity)},
            inset 0 0 30px ${color}${hexAlpha(glowOpacity * 0.3)}
        `;
    },

    /**
     * Apply proximity glow (glow intensifies as cursor approaches)
     */
    applyProximityGlow(element, proximity, data) {
        if (proximity <= 0) {
            element.style.boxShadow = '';
            return;
        }

        const color = data.config.color || '#00f0ff';
        const baseBlur = 10;
        const maxBlur = 30;
        const blur = baseBlur + (proximity * (maxBlur - baseBlur)) * this.intensityMultiplier;

        element.style.transition = 'box-shadow var(--transition-fast)';
        element.style.boxShadow = `
            0 0 ${blur}px ${color}${hexAlpha(proximity * 0.6)},
            0 0 ${blur * 1.5}px ${color}${hexAlpha(proximity * 0.3)}
        `;
    },

    /**
     * Apply magnetic attraction (element shifts toward cursor)
     */
    applyMagneticAttraction(element, dx, dy, proximity, _data) {
        if (proximity <= 0) {
            element.style.transform = '';
            return;
        }

        const maxShift = 4; // max pixels to shift
        const shiftX = -(dx / Math.abs(dx || 1)) * proximity * maxShift * this.intensityMultiplier;
        const shiftY = -(dy / Math.abs(dy || 1)) * proximity * maxShift * this.intensityMultiplier;

        element.style.transition = 'transform var(--duration-fast) var(--ease-decel)';
        element.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
    },

    /**
     * Apply wake effect (icons "wake up" when cursor approaches)
     */
    applyWakeEffect(element, proximity, data) {
        if (proximity <= 0) {
            element.style.transform = '';
            element.style.boxShadow = '';
            return;
        }

        const scale = 1 + (proximity * 0.1 * this.intensityMultiplier); // max 1.1x
        const wobble = Math.sin(Date.now() / 200) * proximity * 2; // subtle wobble
        const color = data.config.color || '#00f0ff';

        element.style.transition = 'transform var(--transition-medium), box-shadow var(--transition-medium)';
        element.style.transform = `scale(${scale}) rotate(${wobble}deg)`;
        element.style.boxShadow = `
            0 0 ${proximity * 20}px ${color}${hexAlpha(proximity * 0.5)}
        `;
    },

    /**
     * Check if cursor is over element
     */
    isOverElement(element, cursorData) {
        const bounds = element.getBoundingClientRect();
        return (
            cursorData.x >= bounds.left &&
            cursorData.x <= bounds.right &&
            cursorData.y >= bounds.top &&
            cursorData.y <= bounds.bottom
        );
    },

    /**
     * Reset element to default state
     */
    resetElement(element, data) {
        const effects = data.config.effects || [];

        if (effects.includes('tilt') || effects.includes('magnetic-attract') || effects.includes('wake')) {
            element.style.transition = 'transform var(--transition-slow)';
            element.style.transform = '';
        }

        if (effects.includes('ambient-glow') || effects.includes('proximity-glow')) {
            element.style.transition = 'box-shadow var(--transition-slow)';
            element.style.boxShadow = '';
        }
    },

    /**
     * Register element for cursor-reactive effects
     */
    registerElement(element, config) {
        this.registeredElements.set(element, {
            config,
            bounds: null,
            centerX: 0,
            centerY: 0,
            isVisible: true,
            lastBoundsUpdate: 0
        });
    },

    /**
     * Unregister element
     */
    unregisterElement(element) {
        this.registeredElements.delete(element);
        this.viewportElements.delete(element);
        this.resetElement(element, { config: { effects: ['tilt', 'proximity-glow', 'wake'] } });
    },

    /**
     * Set intensity multiplier (0-1)
     */
    setIntensity(intensity) {
        this.intensityMultiplier = Math.max(0, Math.min(1, intensity / 100));
    },

    /**
     * Get stats
     */
    getStats() {
        return {
            registeredElements: this.registeredElements.size,
            viewportElements: this.viewportElements.size,
            intensity: this.intensityMultiplier
        };
    }
};
