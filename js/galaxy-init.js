/**
 * Shared Galaxy Background Initializer
 * Single source of truth for galaxy config and lazy initialization.
 * Both main.js (deferred boot) and login.js (post-intro) call ensureGalaxy()
 * instead of duplicating config and init logic.
 */

/** Tuned config — one place to tweak the starfield aesthetic */
const GALAXY_CONFIG = {
    starCount: 150,
    nebulaSpeed: 0.00025,
    starDriftSpeed: 0.0003,
    mouseInfluence: 0.015,
};

/**
 * Lazily initialize the galaxy background on the given container.
 * No-ops if the galaxy is already active (idempotent).
 * Stores the instance on window.__galaxyInstance for cross-module access.
 * @param {HTMLElement} container - Typically document.body
 * @returns {Promise<object|null>} The galaxy instance, or null on failure
 */
export async function ensureGalaxy(container) {
    if (container.classList.contains('galaxy-active') && window.__galaxyInstance) {
        return window.__galaxyInstance;
    }

    try {
        const { initGalaxyBackground } = await import('./galaxy-background.js');
        const instance = initGalaxyBackground(container, GALAXY_CONFIG);
        container.classList.add('galaxy-active', 'galaxy-container');
        window.__galaxyInstance = instance;
        return instance;
    } catch (err) {
        console.warn('[galaxy-init] Galaxy background failed:', err);
        return null;
    }
}
