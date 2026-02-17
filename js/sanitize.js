/**
 * HTML Sanitization Utilities
 * Provides XSS protection using DOMPurify
 */

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

        return DOMPurify.sanitize(dirty, {
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
     * Blocks javascript:, vbscript:, data:text/html, and whitespace-obfuscated variants.
     * @param {string} value - Attribute value
     * @returns {string} Safe attribute value
     */
    attr(value) {
        if (!value) return '';

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

        // Block data: URIs that can execute scripts:
        // - data:image/svg+xml can contain <script> and onload handlers
        // - data: with any script-capable MIME (text/html already caught above)
        if (lower.startsWith('data:')) {
            if (lower.includes('script') || lower.includes('svg')) return '';
        }

        return value;
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
    }
};

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.Sanitize = Sanitize;
}
