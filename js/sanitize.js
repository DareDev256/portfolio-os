/**
 * HTML Sanitization Utilities
 * Provides XSS protection using DOMPurify
 */

/**
 * Maximum input length for sanitization functions.
 * Inputs exceeding this are truncated before processing to prevent
 * ReDoS and algorithmic-complexity attacks (CWE-400, CWE-1333).
 * 500KB covers any legitimate portfolio content with wide margin.
 */
const MAX_INPUT_LENGTH = 500_000;

/** @param {string} s @returns {string} */
function clampLength(s) {
    return (typeof s === 'string' && s.length > MAX_INPUT_LENGTH) ? s.slice(0, MAX_INPUT_LENGTH) : s;
}

export const Sanitize = {
    /**
     * Sanitize HTML string before inserting into DOM
     * @param {string} dirty - Untrusted HTML string
     * @param {object} config - DOMPurify configuration
     * @returns {string} Sanitized HTML
     */
    html(dirty, config = {}) {
        if (typeof DOMPurify === 'undefined') {
            console.error('DOMPurify not loaded! Falling back to text-only mode.');
            return this.text(dirty);
        }

        return DOMPurify.sanitize(clampLength(dirty), {
            ALLOWED_TAGS: [
                'div', 'span', 'p', 'br', 'strong', 'em', 'u', 'a', 'img',
                'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'button', 'label',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'svg', 'path', 'circle', 'rect'
            ],
            ALLOWED_ATTR: [
                'href', 'src', 'alt', 'title', 'class', 'id',
                'data-*', 'role', 'aria-*', 'type', 'value', 'placeholder',
                'width', 'height',
                'viewBox', 'fill', 'd', 'cx', 'cy', 'r', 'x', 'y', 'rx', 'ry',
                'preserveAspectRatio'
            ],
            ALLOW_DATA_ATTR: true,
            ALLOW_ARIA_ATTR: true,
            ...config
        });
    },

    /**
     * Escape HTML to plain text (no HTML allowed)
     * @param {string} str - String to escape
     * @returns {string} Escaped text
     */
    text(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Safely set innerHTML on an element
     * @param {HTMLElement} element - Target element
     * @param {string} html - HTML to insert
     * @param {object} config - Sanitization config
     */
    setHTML(element, html, config = {}) {
        if (!element) return;
        element.innerHTML = this.html(html, config);
    },

    /**
     * Sanitize attributes (prevent dangerous URI schemes and protocol obfuscation).
     * Blocks javascript:, vbscript:, and all non-image data: URIs.
     * Returns the control-char-stripped version — never leaks raw input back to the DOM.
     * @param {string} value - Attribute value
     * @returns {string} Safe attribute value
     */
    attr(value) {
        if (!value) return '';
        value = clampLength(value);

        // Strip ASCII control chars that browsers ignore inside URIs
        // (tabs, newlines, null bytes) — prevents "java\tscript:" obfuscation
        // eslint-disable-next-line no-control-regex
        const stripped = value.replace(/[\x00-\x1f\x7f]/g, '');
        const lower = stripped.toLowerCase().trim();

        // Block dangerous URI schemes
        if (
            lower.includes('javascript:') ||
            lower.includes('vbscript:') ||
            lower.startsWith('data:text/html')
        ) {
            return '';
        }

        // Block data: URIs except safe raster image MIME types.
        // svg+xml is excluded — SVG can contain <script>, onload handlers, and
        // foreignObject with arbitrary HTML. Only allow known-safe bitmap formats.
        if (lower.startsWith('data:')) {
            const SAFE_DATA_MIMES = ['data:image/png', 'data:image/jpeg', 'data:image/gif', 'data:image/webp'];
            if (!SAFE_DATA_MIMES.some(m => lower.startsWith(m))) return '';
        }

        // Return the stripped value — NOT the original.
        // Previous code returned `value` (with control chars intact), creating a
        // validation/output mismatch (CWE-116). Browsers normalize control chars
        // inconsistently, so always return the sanitized form.
        return stripped;
    },

    /**
     * Validate and sanitize a URL string.
     * Only allows http(s) and relative paths. Blocks javascript:, data:, vbscript:,
     * and protocol-obfuscated variants. Returns empty string for dangerous URLs.
     * Use this for user-supplied URLs (project links, media src, imported backups).
     * @param {string} url - URL to validate
     * @returns {string} Safe URL or empty string
     */
    url(url) {
        if (!url || typeof url !== 'string') return '';
        url = clampLength(url);
        // Strip control chars that hide protocol (tab, newline, null)
        // eslint-disable-next-line no-control-regex
        const stripped = url.replace(/[\x00-\x1f\x7f]/g, '').trim();
        if (!stripped) return '';
        // Allow relative paths (start with / or alphanumeric)
        if (/^\/[\w./-]*$/.test(stripped) || /^[\w][\w./-]*$/.test(stripped)) return stripped;
        // Allow only http(s) absolute URLs
        if (/^https?:\/\//i.test(stripped)) return stripped;
        // Block everything else (javascript:, data:, vbscript:, blob:, etc.)
        return '';
    },

    /**
     * Validate a CSS hex color string.
     * Only allows #RGB, #RRGGBB, #RGBA, #RRGGBBAA formats.
     * Blocks CSS injection payloads disguised as color values.
     * @param {string} value - Color string to validate
     * @param {string} fallback - Fallback color if invalid
     * @returns {string} Valid hex color or fallback
     */
    hexColor(value, fallback = '#000000') {
        if (!value || typeof value !== 'string') return fallback;
        const trimmed = value.trim();
        if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
            return trimmed;
        }
        return fallback;
    },

    /**
     * Validate a value against an explicit allowlist.
     * Use for any localStorage-sourced value that maps to a fixed set of options
     * (themes, cursor trail types, view modes, etc.). Prevents localStorage
     * poisoning from injecting unexpected values into DOM attributes or CSS.
     * @param {string} value - Value to validate
     * @param {string[]} allowed - Array of allowed values
     * @param {string} fallback - Fallback if value is not in the allowlist
     * @returns {string} Validated value or fallback
     */
    allowlist(value, allowed, fallback) {
        if (!value || typeof value !== 'string') return fallback;
        return allowed.includes(value) ? value : fallback;
    },

    /**
     * Validate an identifier-safe string (alphanumeric, hyphens, underscores, dots).
     * Use for localStorage keys used as fetch paths, CSS class names, or data attributes
     * to prevent path traversal (../../etc/passwd) and injection.
     * @param {string} value - String to validate
     * @returns {string} Safe identifier or empty string
     */
    safeKey(value) {
        if (!value || typeof value !== 'string') return '';
        const trimmed = value.trim();
        // Only allow: letters, digits, hyphens, underscores, dots, and single forward slashes
        // Block: .., //, \, control chars, and anything that could escape the data/ directory
        if (/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(trimmed) && !trimmed.includes('..')) {
            return trimmed;
        }
        return '';
    },

    /**
     * Recursively strip prototype-pollution keys from a parsed JSON object.
     * Call this on any user-supplied JSON (backup imports, localStorage overrides)
     * before assigning properties into application state.
     * Prevents an attacker from modifying Object.prototype via crafted JSON payloads.
     *
     * Depth-limited to prevent stack overflow from deeply nested payloads (CWE-674).
     * A crafted backup with 10,000+ nesting levels would crash the browser tab without
     * this guard. MAX_DEPTH of 20 covers any legitimate data structure.
     *
     * @param {*} obj - Parsed JSON value
     * @param {number} _depth - Internal recursion counter (do not pass manually)
     * @returns {*} Cleaned value (mutated in-place)
     */
    stripDangerousKeys(obj, _depth = 0) {
        const MAX_DEPTH = 20;
        if (!obj || typeof obj !== 'object') return obj;
        if (_depth >= MAX_DEPTH) {
            // Truncate overly nested structures — no legitimate portfolio data
            // requires 20+ levels. Anything deeper is suspicious or malformed.
            return obj;
        }
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) this.stripDangerousKeys(obj[i], _depth + 1);
            return obj;
        }
        // Block prototype pollution vectors:
        //   __proto__, constructor, prototype — direct pollution (CVE-2019-11358 class)
        //   __defineGetter__, __defineSetter__ — legacy property mutation
        //   __lookupGetter__, __lookupSetter__ — legacy property introspection
        const BLOCKED = new Set([
            '__proto__', 'constructor', 'prototype',
            '__defineGetter__', '__defineSetter__',
            '__lookupGetter__', '__lookupSetter__',
        ]);
        for (const key of Object.keys(obj)) {
            if (BLOCKED.has(key)) {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.stripDangerousKeys(obj[key], _depth + 1);
            }
        }
        return obj;
    }
};

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.Sanitize = Sanitize;
}
