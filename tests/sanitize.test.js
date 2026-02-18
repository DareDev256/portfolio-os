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

describe('Sanitize.hexColor()', () => {
    it('accepts valid 6-digit hex colors', () => {
        expect(Sanitize.hexColor('#00f0ff')).toBe('#00f0ff');
        expect(Sanitize.hexColor('#FFFFFF')).toBe('#FFFFFF');
        expect(Sanitize.hexColor('#000000')).toBe('#000000');
    });

    it('accepts valid 3-digit hex colors', () => {
        expect(Sanitize.hexColor('#fff')).toBe('#fff');
        expect(Sanitize.hexColor('#0af')).toBe('#0af');
    });

    it('accepts valid 8-digit hex colors (with alpha)', () => {
        expect(Sanitize.hexColor('#00f0ffcc')).toBe('#00f0ffcc');
    });

    it('rejects CSS injection payloads', () => {
        expect(Sanitize.hexColor('url(javascript:alert(1))')).toBe('#000000');
        expect(Sanitize.hexColor('expression(alert(1))')).toBe('#000000');
        expect(Sanitize.hexColor('#000; background: url(evil)')).toBe('#000000');
    });

    it('rejects non-hex strings', () => {
        expect(Sanitize.hexColor('red')).toBe('#000000');
        expect(Sanitize.hexColor('rgb(0,0,0)')).toBe('#000000');
        expect(Sanitize.hexColor('hsl(0,0%,0%)')).toBe('#000000');
    });

    it('returns fallback for falsy input', () => {
        expect(Sanitize.hexColor('')).toBe('#000000');
        expect(Sanitize.hexColor(null)).toBe('#000000');
        expect(Sanitize.hexColor(undefined, '#ff0000')).toBe('#ff0000');
    });

    it('rejects hex without # prefix', () => {
        expect(Sanitize.hexColor('00f0ff')).toBe('#000000');
    });
});

describe('Sanitize.allowlist()', () => {
    it('accepts values in the allowlist', () => {
        expect(Sanitize.allowlist('dark', ['light', 'dark'], 'light')).toBe('dark');
        expect(Sanitize.allowlist('light', ['light', 'dark'], 'light')).toBe('light');
    });

    it('returns fallback for values not in the allowlist', () => {
        expect(Sanitize.allowlist('evil" onload=alert(1)', ['light', 'dark'], 'light')).toBe('light');
        expect(Sanitize.allowlist('custom', ['light', 'dark'], 'light')).toBe('light');
    });

    it('returns fallback for non-string input', () => {
        expect(Sanitize.allowlist(null, ['a', 'b'], 'a')).toBe('a');
        expect(Sanitize.allowlist(undefined, ['a', 'b'], 'a')).toBe('a');
        expect(Sanitize.allowlist('', ['a', 'b'], 'a')).toBe('a');
        expect(Sanitize.allowlist(42, ['a', 'b'], 'a')).toBe('a');
    });

    it('is case-sensitive (exact match)', () => {
        expect(Sanitize.allowlist('Dark', ['light', 'dark'], 'light')).toBe('light');
    });
});

describe('Sanitize.safeKey()', () => {
    it('accepts valid filenames', () => {
        expect(Sanitize.safeKey('media.json')).toBe('media.json');
        expect(Sanitize.safeKey('projects.json')).toBe('projects.json');
        expect(Sanitize.safeKey('data_v2.json')).toBe('data_v2.json');
    });

    it('blocks path traversal sequences', () => {
        expect(Sanitize.safeKey('../../etc/passwd')).toBe('');
        expect(Sanitize.safeKey('../secret.json')).toBe('');
        expect(Sanitize.safeKey('data/../../etc/hosts')).toBe('');
    });

    it('blocks paths starting with dot or slash', () => {
        expect(Sanitize.safeKey('.env')).toBe('');
        expect(Sanitize.safeKey('/etc/passwd')).toBe('');
    });

    it('blocks URLs and protocol handlers', () => {
        expect(Sanitize.safeKey('https://evil.com/steal')).toBe('');
        expect(Sanitize.safeKey('javascript:alert(1)')).toBe('');
    });

    it('returns empty string for falsy input', () => {
        expect(Sanitize.safeKey('')).toBe('');
        expect(Sanitize.safeKey(null)).toBe('');
        expect(Sanitize.safeKey(undefined)).toBe('');
    });

    it('blocks keys with special characters', () => {
        expect(Sanitize.safeKey('file<script>.json')).toBe('');
        expect(Sanitize.safeKey('file;rm -rf.json')).toBe('');
    });
});
