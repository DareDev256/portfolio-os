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
                'button', 'input', 'label', 'select', 'option', 'textarea',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'video', 'audio', 'source', 'iframe'
            ],
            ALLOWED_ATTR: [
                'href', 'src', 'alt', 'title', 'class', 'id', 'style',
                'data-*', 'role', 'aria-*', 'type', 'value', 'placeholder',
                'width', 'height', 'controls', 'autoplay', 'loop', 'muted',
                'frameborder', 'allow', 'allowfullscreen'
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
     * Sanitize attributes (prevent javascript: URLs, etc.)
     * @param {string} value - Attribute value
     * @returns {string} Safe attribute value
     */
    attr(value) {
        if (!value) return '';

        // Remove javascript: protocol
        if (value.toLowerCase().includes('javascript:')) {
            return '';
        }

        // Remove data: URLs with script content
        if (value.toLowerCase().startsWith('data:') && value.toLowerCase().includes('script')) {
            return '';
        }

        return value;
    }
};

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.Sanitize = Sanitize;
}
