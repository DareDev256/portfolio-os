/**
 * Cursor Trail
 * PlayStation button symbols (✕◯△□) or geometric chakra wheels
 * Spawns trailing symbols that fade and rotate behind the cursor
 */

export const CursorTrail = {
    enabled: false,
    trailType: 'playstation', // 'playstation' or 'chakra'

    // Particle system
    particles: [],
    particlePool: [],
    maxParticles: 50,

    // Spawning config
    spawnDistance: 40, // pixels between spawns
    lastSpawnX: 0,
    lastSpawnY: 0,
    distanceTraveled: 0,
    minVelocity: 2, // only spawn if moving faster than this

    // Animation config
    particleLifetime: 800, // ms
    particleSize: 24, // px

    // PlayStation symbols
    psSymbols: [
        { path: '/assets/cursor/ps-x.svg', color: '#00f0ff' },
        { path: '/assets/cursor/ps-circle.svg', color: '#ff00aa' },
        { path: '/assets/cursor/ps-triangle.svg', color: '#00ff88' },
        { path: '/assets/cursor/ps-square.svg', color: '#ffaa00' }
    ],

    // Performance
    isMobile: false,
    prefersReducedMotion: false,

    init() {
        console.log('[CursorTrail] Initialized');

        // Check for mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Auto-disable on mobile or reduced motion
        if (this.isMobile || this.prefersReducedMotion) {
            console.log('[CursorTrail] Disabled (mobile or reduced-motion)');
            this.enabled = false;
            return;
        }

        // Pre-create particle pool
        this.createParticlePool();

        // Preload SVG symbols
        this.preloadSymbols();
    },

    /**
     * Create pool of reusable particle elements
     */
    createParticlePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'cursor-trail-particle';
            particle.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 9998;
                width: ${this.particleSize}px;
                height: ${this.particleSize}px;
                opacity: 0;
                will-change: transform, opacity;
            `;

            // Add SVG container
            const svgContainer = document.createElement('div');
            svgContainer.style.cssText = `
                width: 100%;
                height: 100%;
            `;
            particle.appendChild(svgContainer);

            document.body.appendChild(particle);

            this.particlePool.push({
                element: particle,
                svgContainer: svgContainer,
                inUse: false,
                birthTime: 0,
                animation: null
            });
        }
    },

    /**
     * Preload SVG symbols
     */
    async preloadSymbols() {
        try {
            // Sanitize SVG to strip embedded scripts/event handlers
            const cleanSvg = (raw) =>
                typeof DOMPurify !== 'undefined'
                    ? DOMPurify.sanitize(raw, { USE_PROFILES: { svg: true } })
                    : raw;

            // Preload PlayStation symbols
            for (const symbol of this.psSymbols) {
                const response = await fetch(symbol.path);
                const svgText = await response.text();
                symbol.svg = cleanSvg(svgText);
            }

            // Preload chakra wheel
            const chakraResponse = await fetch('/assets/cursor/chakra-wheel.svg');
            this.chakraSvg = cleanSvg(await chakraResponse.text());

            console.log('[CursorTrail] Symbols preloaded');
        } catch (error) {
            console.warn('[CursorTrail] Failed to preload symbols:', error);
        }
    },

    /**
     * Get available particle from pool
     */
    getParticle() {
        return this.particlePool.find(p => !p.inUse);
    },

    /**
     * Update trail (called from engine loop)
     */
    update(timestamp, deltaTime, cursorData) {
        if (!this.enabled) return;

        // Check velocity threshold
        if (cursorData.velocity < this.minVelocity) {
            return;
        }

        // Calculate distance traveled since last spawn
        const dx = cursorData.x - this.lastSpawnX;
        const dy = cursorData.y - this.lastSpawnY;
        const distance = Math.hypot(dx, dy);

        this.distanceTraveled += distance;

        // Spawn particle if traveled enough distance
        if (this.distanceTraveled >= this.spawnDistance) {
            this.spawnParticle(cursorData.x, cursorData.y, timestamp);
            this.distanceTraveled = 0;
            this.lastSpawnX = cursorData.x;
            this.lastSpawnY = cursorData.y;
        } else {
            this.lastSpawnX = cursorData.x;
            this.lastSpawnY = cursorData.y;
        }

        // Update active particles
        this.updateParticles(timestamp);
    },

    /**
     * Spawn a new particle
     */
    spawnParticle(x, y, timestamp) {
        const particle = this.getParticle();
        if (!particle) return;

        particle.inUse = true;
        particle.birthTime = timestamp;

        // Position particle
        particle.element.style.left = `${x}px`;
        particle.element.style.top = `${y}px`;
        particle.element.style.transform = 'translate(-50%, -50%)';

        // Set symbol based on trail type
        if (this.trailType === 'playstation') {
            // Random PlayStation symbol
            const symbol = this.psSymbols[Math.floor(Math.random() * this.psSymbols.length)];
            if (symbol.svg) {
                particle.svgContainer.innerHTML = symbol.svg;
            }
        } else if (this.trailType === 'chakra') {
            // Chakra wheel
            if (this.chakraSvg) {
                particle.svgContainer.innerHTML = this.chakraSvg;
            }
        }

        // Animate particle
        const startRotation = Math.random() * 360;
        const endRotation = startRotation + (Math.random() > 0.5 ? 360 : -360);

        particle.animation = particle.element.animate([
            {
                opacity: 0.9,
                transform: `translate(-50%, -50%) scale(1.2) rotate(${startRotation}deg)`
            },
            {
                opacity: 0,
                transform: `translate(-50%, -50%) scale(0.8) rotate(${endRotation}deg)`
            }
        ], {
            duration: this.particleLifetime,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        particle.animation.onfinish = () => {
            particle.inUse = false;
            particle.element.style.opacity = '0';
        };
    },

    /**
     * Update all active particles
     */
    updateParticles(timestamp) {
        this.particlePool.forEach(particle => {
            if (!particle.inUse) return;

            // Check if particle lifetime exceeded
            const age = timestamp - particle.birthTime;
            if (age > this.particleLifetime) {
                particle.inUse = false;
                particle.element.style.opacity = '0';
                if (particle.animation) {
                    particle.animation.cancel();
                }
            }
        });
    },

    /**
     * Enable/disable trail
     */
    setEnabled(enabled) {
        // Don't enable on mobile (no cursor) but allow reduced-motion users to opt-in
        if (this.isMobile && enabled) {
            console.warn('[CursorTrail] Cannot enable on mobile (no cursor)');
            return;
        }

        // If pool wasn't created (e.g. reduced-motion skipped init), create now
        if (enabled && this.particlePool.length === 0) {
            this.createParticlePool();
            this.preloadSymbols();
        }

        this.enabled = enabled;

        if (!enabled) {
            this.clearParticles();
        }

        console.log(`[CursorTrail] ${enabled ? 'Enabled' : 'Disabled'}`);
    },

    /**
     * Set trail type
     */
    setType(type) {
        if (type !== 'playstation' && type !== 'chakra') {
            console.warn('[CursorTrail] Invalid type:', type);
            return;
        }

        this.trailType = type;
        console.log(`[CursorTrail] Type set to: ${type}`);
    },

    /**
     * Clear all particles
     */
    clearParticles() {
        this.particlePool.forEach(particle => {
            particle.inUse = false;
            particle.element.style.opacity = '0';
            if (particle.animation) {
                particle.animation.cancel();
            }
        });
    },

    /**
     * Set spawn distance
     */
    setSpawnDistance(distance) {
        this.spawnDistance = Math.max(10, Math.min(100, distance));
    },

    /**
     * Set particle lifetime
     */
    setLifetime(lifetime) {
        this.particleLifetime = Math.max(300, Math.min(2000, lifetime));
    },

    /**
     * Get stats
     */
    getStats() {
        const activeParticles = this.particlePool.filter(p => p.inUse).length;

        return {
            enabled: this.enabled,
            type: this.trailType,
            activeParticles,
            maxParticles: this.maxParticles,
            spawnDistance: this.spawnDistance,
            isMobile: this.isMobile,
            prefersReducedMotion: this.prefersReducedMotion
        };
    }
};
