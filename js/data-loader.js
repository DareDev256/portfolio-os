/**
 * Centralized Data Loader
 * Fetches JSON data with localStorage override support and in-memory caching.
 * Eliminates duplicated fetch-or-override logic scattered across desktop.js and admin.js.
 */
import { Sanitize } from './sanitize.js';

/** @type {Map<string, Promise<any>>} */
const cache = new Map();

/**
 * Load JSON data from a file path, with localStorage override support.
 * Results are cached in-memory — subsequent calls for the same key return the same promise.
 *
 * @param {string} key - localStorage key and filename under data/ (e.g. 'media.json')
 * @param {*} fallback - Default value if both localStorage and fetch fail
 * @returns {Promise<any>}
 */
export async function loadData(key, fallback = null) {
    if (cache.has(key)) return cache.get(key);

    const promise = _fetchData(key, fallback);
    cache.set(key, promise);
    return promise;
}

/** @private */
async function _fetchData(key, fallback) {
    // Validate key to prevent path traversal — only allow safe filenames
    const safeKey = Sanitize.safeKey(key);
    if (!safeKey) {
        console.warn(`[DataLoader] Blocked unsafe key: ${key}`);
        return fallback;
    }

    try {
        const override = localStorage.getItem(safeKey);
        if (override) return JSON.parse(override);

        const res = await fetch(`data/${safeKey}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn(`[DataLoader] Failed to load ${safeKey}:`, e);
        return fallback;
    }
}

/**
 * Invalidate cached data for a key (useful after admin edits).
 * @param {string} key
 */
export function invalidateData(key) {
    cache.delete(key);
}

/**
 * Load media data (images + videos).
 * @returns {Promise<{images: Array, videos: Array}>}
 */
export function loadMedia() {
    return loadData('media.json', { images: [], videos: [] });
}

/**
 * Load projects data.
 * @returns {Promise<Array>}
 */
export function loadProjects() {
    return loadData('projects.json', []);
}
