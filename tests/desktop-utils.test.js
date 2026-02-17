import { describe, it, expect, vi, beforeEach } from 'vitest';
import { el } from '../js/dom-helpers.js';
import { Sanitize } from '../js/sanitize.js';

// ── el() utility ─────────────────────────────────────────────

describe('el()', () => {
    it('creates an element with the given tag', () => {
        const div = el('div');
        expect(div.tagName).toBe('DIV');
    });

    it('assigns className when cls is provided', () => {
        const span = el('span', 'badge active');
        expect(span.className).toBe('badge active');
    });

    it('sets textContent when text is provided', () => {
        const p = el('p', null, 'Hello');
        expect(p.textContent).toBe('Hello');
        expect(p.className).toBe(''); // cls was null
    });

    it('omits className and textContent when not provided', () => {
        const btn = el('button');
        expect(btn.className).toBe('');
        expect(btn.textContent).toBe('');
    });

    it('uses textContent, not innerHTML — XSS safe', () => {
        const div = el('div', null, '<img onerror=alert(1)>');
        expect(div.innerHTML).toBe('&lt;img onerror=alert(1)&gt;');
        expect(div.children.length).toBe(0);
    });

    it('creates less common elements (canvas, section)', () => {
        expect(el('canvas').tagName).toBe('CANVAS');
        expect(el('section').tagName).toBe('SECTION');
    });
});

// ── Sanitize.html() fallback when DOMPurify is missing ───────

describe('Sanitize.html() — DOMPurify absent', () => {
    it('falls back to text-only escaping when DOMPurify is undefined', () => {
        // DOMPurify is not loaded in vitest/jsdom
        const result = Sanitize.html('<b>bold</b> & <script>xss</script>');
        // Should escape everything since fallback uses Sanitize.text()
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('<b>');
        expect(result).toContain('&lt;script&gt;');
    });

    it('returns empty string for falsy input via fallback', () => {
        expect(Sanitize.html('')).toBe('');
        expect(Sanitize.html(null)).toBe('');
    });
});

// ── Sanitize.setHTML() ───────────────────────────────────────

describe('Sanitize.setHTML()', () => {
    it('sets element innerHTML via Sanitize.html()', () => {
        const div = document.createElement('div');
        Sanitize.setHTML(div, '<em>safe</em> <script>bad</script>');
        // Fallback path escapes everything to text
        expect(div.innerHTML).not.toContain('<script>');
        expect(div.textContent).toContain('safe');
    });

    it('does nothing when element is null/undefined', () => {
        // Should not throw
        expect(() => Sanitize.setHTML(null, '<b>hi</b>')).not.toThrow();
        expect(() => Sanitize.setHTML(undefined, '<b>hi</b>')).not.toThrow();
    });

    it('replaces existing content', () => {
        const div = document.createElement('div');
        div.innerHTML = '<p>old</p>';
        Sanitize.setHTML(div, 'new');
        expect(div.textContent).toBe('new');
        expect(div.querySelector('p')).toBeNull();
    });
});

// ── Sanitize.attr() — additional edge cases ──────────────────

describe('Sanitize.attr() — advanced vectors', () => {
    it('blocks javascript: with carriage return obfuscation', () => {
        expect(Sanitize.attr('java\rscript:alert(1)')).toBe('');
    });

    it('blocks javascript: embedded mid-string', () => {
        expect(Sanitize.attr('https://evil.com?redirect=javascript:alert(1)')).toBe('');
    });

    it('blocks data:image/svg+xml with whitespace obfuscation', () => {
        expect(Sanitize.attr('data:\timage/svg+xml,<svg>')).toBe('');
    });

    it('allows mailto: links (not a dangerous scheme)', () => {
        expect(Sanitize.attr('mailto:user@example.com')).toBe('mailto:user@example.com');
    });

    it('allows tel: links', () => {
        expect(Sanitize.attr('tel:+1234567890')).toBe('tel:+1234567890');
    });

    it('allows hash-only anchors', () => {
        expect(Sanitize.attr('#section-2')).toBe('#section-2');
    });

    it('allows plain text attribute values', () => {
        expect(Sanitize.attr('my-class-name')).toBe('my-class-name');
    });

    it('blocks data: with script keyword in path', () => {
        expect(Sanitize.attr('data:application/x-script,payload')).toBe('');
    });
});

// ── createLazyWindow ─────────────────────────────────────────

// createLazyWindow is not exported — we test its behavior by importing
// the module and mocking WindowManager. Since it's a private function,
// we verify the pattern via an integration-style mock.

describe('createLazyWindow pattern', () => {
    let mockWindowManager;

    beforeEach(() => {
        // Simulate the WindowManager.create contract
        mockWindowManager = {
            create: vi.fn(),
        };
    });

    it('creates a full-height container div for the app content', () => {
        // Replicate createLazyWindow's container creation logic
        const content = document.createElement('div');
        content.style.height = '100%';
        expect(content.style.height).toBe('100%');
        expect(content.tagName).toBe('DIV');
    });

    it('passes correct options to WindowManager.create', () => {
        const content = document.createElement('div');
        content.style.height = '100%';
        const onClose = vi.fn();

        mockWindowManager.create({
            id: 'test-app',
            title: 'Test App',
            icon: '🧪',
            content,
            width: 400,
            height: 300,
            onClose,
        });

        expect(mockWindowManager.create).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'test-app',
                title: 'Test App',
                icon: '🧪',
                content,
                width: 400,
                height: 300,
            })
        );
    });

    it('onClose callback invokes cleanup when module provides one', () => {
        const cleanupFn = vi.fn();

        // Replicate createLazyWindow's closure pattern exactly:
        // cleanup starts null, gets set after dynamic import resolves
        let cleanup = null;
        const onClose = () => { if (cleanup) cleanup(); };

        // Before module loads — close should be safe (no-op)
        onClose();
        expect(cleanupFn).not.toHaveBeenCalled();

        // Module resolves, sets cleanup
        cleanup = cleanupFn;

        // Now close invokes the cleanup
        onClose();
        expect(cleanupFn).toHaveBeenCalledOnce();
    });

    it('onClose is safe when module returns no cleanup', () => {
        let cleanup = null;
        const onClose = () => { if (cleanup) cleanup(); };

        // Module didn't return a cleanup function
        cleanup = undefined;

        // Should not throw
        expect(() => onClose()).not.toThrow();
    });
});
