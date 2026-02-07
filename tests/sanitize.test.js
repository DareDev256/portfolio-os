import { describe, it, expect } from 'vitest';
import { Sanitize } from '../js/sanitize.js';

describe('Sanitize.text()', () => {
    it('escapes HTML tags', () => {
        expect(Sanitize.text('<script>alert(1)</script>')).toBe(
            '&lt;script&gt;alert(1)&lt;/script&gt;'
        );
    });

    it('escapes angle brackets in attributes', () => {
        expect(Sanitize.text('<img src=x onerror=alert(1)>')).toBe(
            '&lt;img src=x onerror=alert(1)&gt;'
        );
    });

    it('returns empty string for falsy input', () => {
        expect(Sanitize.text('')).toBe('');
        expect(Sanitize.text(null)).toBe('');
        expect(Sanitize.text(undefined)).toBe('');
    });

    it('preserves safe text', () => {
        expect(Sanitize.text('Hello World')).toBe('Hello World');
    });

    it('escapes ampersands and quotes', () => {
        expect(Sanitize.text('a & b "c"')).toBe('a &amp; b "c"');
    });
});

describe('Sanitize.attr()', () => {
    it('blocks javascript: URLs', () => {
        expect(Sanitize.attr('javascript:alert(1)')).toBe('');
    });

    it('blocks javascript: with mixed case', () => {
        expect(Sanitize.attr('JavaScript:alert(1)')).toBe('');
    });

    it('blocks javascript: with spaces', () => {
        expect(Sanitize.attr('  javascript:alert(1)')).toBe('');
    });

    it('blocks data: URLs with script content', () => {
        expect(Sanitize.attr('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('allows safe URLs', () => {
        expect(Sanitize.attr('https://example.com')).toBe('https://example.com');
    });

    it('allows relative paths', () => {
        expect(Sanitize.attr('/assets/image.png')).toBe('/assets/image.png');
    });

    it('returns empty string for falsy input', () => {
        expect(Sanitize.attr('')).toBe('');
        expect(Sanitize.attr(null)).toBe('');
        expect(Sanitize.attr(undefined)).toBe('');
    });
});
