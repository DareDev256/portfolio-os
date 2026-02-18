/**
 * Shared DOM Utilities
 * Centralizes duplicated patterns across desktop.js, github.js, and others.
 */

/**
 * Safely parse a JSON value from localStorage.
 * Replaces 6 inconsistent try/catch patterns scattered across the codebase.
 * @param {string} key - localStorage key
 * @param {*} fallback - Value returned on missing key or parse failure
 * @returns {*} Parsed value or fallback
 */
export function loadJSON(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

/**
 * Serialize a value to JSON and persist it in localStorage.
 * Handles QuotaExceededError gracefully instead of throwing.
 * @param {string} key - localStorage key
 * @param {*} value - Value to serialize
 * @returns {boolean} True if write succeeded, false on quota/error
 */
export function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`[saveJSON] Failed to write "${key}":`, e.name, e.message);
        return false;
    }
}

/**
 * Trigger a JSON file download in the browser.
 * Replaces 6 identical stringify→Blob→anchor→click→revoke sequences in admin.js.
 * @param {*} data - Value to serialize as JSON
 * @param {string} filename - Download filename (e.g. 'projects.json')
 */
export function downloadJSON(data, filename) {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Safely open an external link with noopener/noreferrer to prevent tabnapping.
 * Only allows http: and https: URLs — blocks javascript:, data:, vbscript:, etc.
 * Replaces bare window.open(url, '_blank') calls throughout the codebase.
 */
export function openExternal(url) {
    if (!url || typeof url !== 'string') return;
    // Strip control characters that could obfuscate the protocol
    // eslint-disable-next-line no-control-regex
    const cleaned = url.replace(/[\x00-\x1f\x7f]/g, '').trim();
    // Allowlist: only http(s) protocols
    if (!/^https?:\/\//i.test(cleaned)) return;
    window.open(cleaned, '_blank', 'noopener,noreferrer');
}

/**
 * Animate a number counter from 0 to target over a duration.
 * Previously duplicated identically in desktop.js and github.js.
 * Returns the interval ID so callers can cancel if needed.
 */
/**
 * Create a DOM element with optional class and text content.
 * Replaces identical helpers duplicated in sticky-notes.js and pomodoro-timer.js.
 * @param {string} tag - HTML tag name
 * @param {string} [cls] - CSS class name(s)
 * @param {string} [text] - Text content
 * @returns {HTMLElement}
 */
export function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
}

export function animateCounter(element, target, duration = 1500) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
    return timer;
}
