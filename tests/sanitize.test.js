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

    it('blocks vbscript: URLs', () => {
        expect(Sanitize.attr('vbscript:MsgBox("XSS")')).toBe('');
    });

    it('blocks data:text/html URLs', () => {
        expect(Sanitize.attr('data:text/html,<h1>XSS</h1>')).toBe('');
        expect(Sanitize.attr('data:text/html;base64,PHNjcmlwdD4=')).toBe('');
    });

    it('blocks tab-obfuscated javascript: (\\t, \\n, \\x00)', () => {
        expect(Sanitize.attr('java\tscript:alert(1)')).toBe('');
        expect(Sanitize.attr('java\nscript:alert(1)')).toBe('');
        expect(Sanitize.attr('\x00javascript:alert(1)')).toBe('');
    });

    it('blocks data:image/svg+xml XSS vectors', () => {
        expect(Sanitize.attr('data:image/svg+xml,<svg onload=alert(1)>')).toBe('');
        expect(Sanitize.attr('data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+')).toBe('');
    });

    it('blocks data:image/svg+xml with mixed case', () => {
        expect(Sanitize.attr('Data:Image/SVG+xml,<svg onload=alert(1)>')).toBe('');
    });

    it('allows safe data: images (non-SVG)', () => {
        expect(Sanitize.attr('data:image/png;base64,iVBOR=')).toBe('data:image/png;base64,iVBOR=');
    });
});

describe('Sanitize.url()', () => {
    it('allows https URLs', () => {
        expect(Sanitize.url('https://example.com')).toBe('https://example.com');
        expect(Sanitize.url('https://github.com/user/repo')).toBe('https://github.com/user/repo');
    });

    it('allows http URLs', () => {
        expect(Sanitize.url('http://localhost:3000')).toBe('http://localhost:3000');
    });

    it('allows relative paths starting with /', () => {
        expect(Sanitize.url('/assets/image.png')).toBe('/assets/image.png');
        expect(Sanitize.url('/data/projects.json')).toBe('/data/projects.json');
    });

    it('allows relative paths without leading slash', () => {
        expect(Sanitize.url('assets/photo.jpg')).toBe('assets/photo.jpg');
    });

    it('blocks javascript: protocol', () => {
        expect(Sanitize.url('javascript:alert(1)')).toBe('');
    });

    it('blocks javascript: with control char obfuscation', () => {
        expect(Sanitize.url('java\tscript:alert(1)')).toBe('');
        expect(Sanitize.url('\x00javascript:alert(1)')).toBe('');
    });

    it('blocks data: URIs', () => {
        expect(Sanitize.url('data:text/html,<script>alert(1)</script>')).toBe('');
        expect(Sanitize.url('data:image/svg+xml,<svg onload=alert(1)>')).toBe('');
    });

    it('blocks vbscript: protocol', () => {
        expect(Sanitize.url('vbscript:MsgBox("XSS")')).toBe('');
    });

    it('blocks blob: URLs', () => {
        expect(Sanitize.url('blob:https://evil.com/uuid')).toBe('');
    });

    it('returns empty string for falsy input', () => {
        expect(Sanitize.url('')).toBe('');
        expect(Sanitize.url(null)).toBe('');
        expect(Sanitize.url(undefined)).toBe('');
        expect(Sanitize.url(0)).toBe('');
    });

    it('strips leading/trailing whitespace', () => {
        expect(Sanitize.url('  https://example.com  ')).toBe('https://example.com');
    });
});
