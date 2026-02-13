/**
 * Micro-Interactions
 * Handles ripples, glows, particles, button animations, and state transitions
 * Every interaction should feel incredibly satisfying
 */

export const MicroInteractions = {
    registeredElements: new Map(),
    activeAnimations: new Set(),
    particlePool: [],
    maxParticles: 100,

    init() {
        console.log('[MicroInteractions] Initialized');

        // Pre-create particle pool
        this.createParticlePool();

        // Add global click listener for ripple effects
        document.addEventListener('mousedown', this.handleGlobalClick.bind(this), true);
    },

    /**
     * Create a pool of reusable particle elements
     */
    createParticlePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'micro-particle';
            particle.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 9999;
                width: 4px;
                height: 4px;
                border-radius: 50%;
                opacity: 0;
            `;
            document.body.appendChild(particle);
            this.particlePool.push({
                element: particle,
                inUse: false
            });
        }
    },

    /**
     * Get an available particle from the pool
     */
    getParticle() {
        return this.particlePool.find(p => !p.inUse);
    },

    /**
     * Handle global click for ripple effects
     */
    handleGlobalClick(e) {
        const target = e.target.closest('[data-interact]');
        if (!target) return;

        const config = this.registeredElements.get(target);
        if (!config || !config.config.enabled) return;

        const effects = config.config.effects;

        // Ripple effect
        if (effects.includes('ripple')) {
            this.createRipple(target, e.clientX, e.clientY, config.config.color);
            // Play ripple sound
            if (window.__InteractionEngine?.soundManager) {
                window.__InteractionEngine.soundManager.play('ripple');
            }
        }

        // Press effect (mousedown)
        if (effects.includes('press-release')) {
            this.applyPressEffect(target);

            // Release on mouseup
            const handleMouseUp = () => {
                this.applyReleaseEffect(target);
                document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mouseup', handleMouseUp);
        }

        // Particle burst
        if (effects.includes('particle-burst')) {
            this.createParticleBurst(e.clientX, e.clientY, config.config.color);
            // Play particle burst sound
            if (window.__InteractionEngine?.soundManager) {
                window.__InteractionEngine.soundManager.play('particle-burst');
            }
        }
    },

    /**
     * Create ripple effect at click position
     */
    createRipple(element, x, y, color = null) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');

        // Calculate position relative to element
        const localX = x - rect.left;
        const localY = y - rect.top;

        // Calculate max radius (to cover entire element from click point)
        const maxRadius = Math.max(
            Math.hypot(localX, localY),
            Math.hypot(rect.width - localX, localY),
            Math.hypot(localX, rect.height - localY),
            Math.hypot(rect.width - localX, rect.height - localY)
        );

        const rippleColor = color || 'var(--neon-cyan, #00f0ff)';

        ripple.className = 'micro-ripple';
        ripple.style.cssText = `
            position: absolute;
            left: ${localX}px;
            top: ${localY}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, ${rippleColor}40 0%, ${rippleColor}20 50%, transparent 100%);
            pointer-events: none;
            z-index: 100;
            transform: translate(-50%, -50%);
            animation: ripple-expand 0.6s ease-out;
        `;

        // Ensure element has position context
        const currentPosition = window.getComputedStyle(element).position;
        if (currentPosition === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(ripple);

        // Animate ripple
        const animation = ripple.animate([
            { width: '0px', height: '0px', opacity: 0.8 },
            { width: `${maxRadius * 2}px`, height: `${maxRadius * 2}px`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        });

        animation.onfinish = () => {
            ripple.remove();
        };

        this.activeAnimations.add(animation);
    },

    /**
     * Apply press effect (scale down)
     */
    applyPressEffect(element) {
        element.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.6, 1)';
        element.style.transform = 'scale(0.95)';
    },

    /**
     * Apply release effect (bounce back)
     */
    applyReleaseEffect(element) {
        element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        element.style.transform = 'scale(1.05)';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    },

    /**
     * Create particle burst effect
     */
    createParticleBurst(x, y, color = null) {
        const particleCount = 8 + Math.floor(Math.random() * 5); // 8-12 particles
        const particleColor = color || 'var(--neon-cyan, #00f0ff)';

        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle();
            if (!particle) break;

            particle.inUse = true;
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const distance = 30 + Math.random() * 40;

            const endX = x + Math.cos(angle) * distance;
            const endY = y + Math.sin(angle) * distance;

            particle.element.style.left = `${x}px`;
            particle.element.style.top = `${y}px`;
            particle.element.style.background = particleColor;

            const animation = particle.element.animate([
                {
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(${endX - x}px, ${endY - y}px) scale(0.5)`,
                    opacity: 0
                }
            ], {
                duration: 400 + Math.random() * 200,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });

            animation.onfinish = () => {
                particle.inUse = false;
                particle.element.style.opacity = '0';
            };

            this.activeAnimations.add(animation);
        }
    },

    /**
     * Register element for micro-interactions
     */
    registerElement(element, config) {
        const effects = config.effects || [];

        // Add hover listeners if needed
        if (effects.includes('glow') || effects.includes('lift')) {
            element.addEventListener('mouseenter', () => this.handleHoverEnter(element, config));
            element.addEventListener('mouseleave', () => this.handleHoverLeave(element, config));
        }

        this.registeredElements.set(element, {
            config,
            animations: new Set()
        });
    },

    /**
     * Handle hover enter
     */
    handleHoverEnter(element, config) {
        const effects = config.effects;

        // Glow intensification
        if (effects.includes('glow')) {
            const color = config.color || '#00f0ff';
            element.style.transition = 'box-shadow 0.2s ease-out';
            element.style.boxShadow = `
                0 0 20px ${color}40,
                0 0 40px ${color}20,
                inset 0 0 20px ${color}10
            `;
        }

        // Lift & tilt
        if (effects.includes('lift')) {
            element.style.transition = 'transform 0.25s ease-out';
            element.style.transform = 'translateY(-4px) rotateX(2deg)';
        }
    },

    /**
     * Handle hover leave
     */
    handleHoverLeave(element, config) {
        const effects = config.effects;

        // Remove glow
        if (effects.includes('glow')) {
            element.style.transition = 'box-shadow 0.3s ease-out';
            element.style.boxShadow = '';
        }

        // Remove lift
        if (effects.includes('lift')) {
            element.style.transition = 'transform 0.3s ease-out';
            element.style.transform = '';
        }
    },

    /**
     * Update active animations (called from engine loop)
     */
    update(_timestamp, _deltaTime) {
        // Clean up finished animations
        this.activeAnimations.forEach(anim => {
            if (anim.playState === 'finished') {
                this.activeAnimations.delete(anim);
            }
        });
    },

    /**
     * Unregister element
     */
    unregisterElement(element) {
        const data = this.registeredElements.get(element);
        if (data) {
            // Cancel any active animations for this element
            data.animations.forEach(anim => anim.cancel());
            this.registeredElements.delete(element);
        }
    },

    /**
     * Create window materialize effect
     */
    materializeWindow(windowElement, callback) {
        windowElement.style.opacity = '0';
        windowElement.style.transform = 'scale(0.8)';
        windowElement.style.filter = 'blur(10px)';

        requestAnimationFrame(() => {
            windowElement.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            windowElement.style.opacity = '1';
            windowElement.style.transform = 'scale(1)';
            windowElement.style.filter = 'blur(0px)';

            if (callback) {
                setTimeout(callback, 400);
            }
        });
    },

    /**
     * Create window dematerialize effect
     */
    dematerializeWindow(windowElement, callback) {
        windowElement.style.transition = 'all 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
        windowElement.style.opacity = '0';
        windowElement.style.transform = 'scale(0.9)';
        windowElement.style.filter = 'blur(5px)';

        setTimeout(() => {
            if (callback) callback();
        }, 300);
    },

    /**
     * Minimize window animation
     */
    minimizeWindow(windowElement, targetElement, callback) {
        const windowRect = windowElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const scaleX = targetRect.width / windowRect.width;
        const scaleY = targetRect.height / windowRect.height;
        const translateX = targetRect.left - windowRect.left + (targetRect.width / 2) - (windowRect.width / 2);
        const translateY = targetRect.top - windowRect.top + (targetRect.height / 2) - (windowRect.height / 2);

        windowElement.style.transition = 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        windowElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
        windowElement.style.opacity = '0';

        setTimeout(() => {
            if (callback) callback();
        }, 350);
    },

    /**
     * Create loading state with personality
     */
    createLoadingState(container, message = 'PROCESSING') {
        const loader = document.createElement('div');
        loader.className = 'micro-loader';
        const spinner = document.createElement('div');
        spinner.className = 'loader-spinner';
        const textEl = document.createElement('div');
        textEl.className = 'loader-text';
        textEl.textContent = message;
        const dots = document.createElement('span');
        dots.className = 'loader-dots';
        dots.textContent = '...';
        textEl.appendChild(dots);
        loader.appendChild(spinner);
        loader.appendChild(textEl);

        loader.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding: 30px;
        `;

        container.appendChild(loader);
        return loader;
    },

    /**
     * Get stats
     */
    getStats() {
        return {
            registeredElements: this.registeredElements.size,
            activeAnimations: this.activeAnimations.size,
            particlePoolUsage: this.particlePool.filter(p => p.inUse).length
        };
    }
};
