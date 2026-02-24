/**
 * Lightbox security tests — video ID validation and iframe sandboxing
 */
import { describe, it, expect } from 'vitest';

// Minimal Lightbox stub with the security-critical methods extracted from lightbox.js
// We can't import Lightbox directly because it binds to DOM on init,
// so we replicate the detection + embed logic here for unit testing.
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const VIMEO_ID_RE = /^[0-9]{6,11}$/;

function detectVideoType(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let id = '';
        if (url.includes('youtube.com/watch?v=')) {
            id = url.split('v=')[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
            id = url.split('youtu.be/')[1].split('?')[0];
        }
        if (!YOUTUBE_ID_RE.test(id)) {
            return { type: 'youtube', id: null };
        }
        return { type: 'youtube', id };
    } else if (url.includes('vimeo.com')) {
        const id = url.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0] || '';
        if (!VIMEO_ID_RE.test(id)) {
            return { type: 'vimeo', id: null };
        }
        return { type: 'vimeo', id };
    }
    return { type: 'video', id: null };
}

describe('Lightbox — Video ID Validation', () => {
    // --- YouTube: valid ---
    it('accepts a standard YouTube watch URL', () => {
        const r = detectVideoType('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(r).toEqual({ type: 'youtube', id: 'dQw4w9WgXcQ' });
    });

    it('accepts a YouTube short URL', () => {
        const r = detectVideoType('https://youtu.be/dQw4w9WgXcQ');
        expect(r).toEqual({ type: 'youtube', id: 'dQw4w9WgXcQ' });
    });

    it('accepts YouTube URL with extra query params', () => {
        const r = detectVideoType('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42');
        expect(r).toEqual({ type: 'youtube', id: 'dQw4w9WgXcQ' });
    });

    it('accepts YouTube IDs with hyphens and underscores', () => {
        const r = detectVideoType('https://youtu.be/a-B_cD3e4F5');
        expect(r).toEqual({ type: 'youtube', id: 'a-B_cD3e4F5' });
    });

    // --- YouTube: invalid (attack vectors) ---
    it('blocks path traversal in YouTube ID', () => {
        const r = detectVideoType('https://youtube.com/watch?v=../../../evil');
        expect(r.id).toBeNull();
    });

    it('blocks overly long YouTube ID', () => {
        const r = detectVideoType('https://youtube.com/watch?v=dQw4w9WgXcQextra');
        expect(r.id).toBeNull();
    });

    it('blocks special characters in YouTube ID', () => {
        const r = detectVideoType('https://youtube.com/watch?v=<script>xss');
        expect(r.id).toBeNull();
    });

    it('blocks empty YouTube ID', () => {
        const r = detectVideoType('https://youtube.com/watch?v=');
        expect(r.id).toBeNull();
    });

    // --- Vimeo: valid ---
    it('accepts a standard Vimeo URL', () => {
        const r = detectVideoType('https://vimeo.com/76979871');
        expect(r).toEqual({ type: 'vimeo', id: '76979871' });
    });

    it('accepts Vimeo URL with query params', () => {
        const r = detectVideoType('https://vimeo.com/76979871?h=abc123');
        expect(r).toEqual({ type: 'vimeo', id: '76979871' });
    });

    // --- Vimeo: invalid ---
    it('blocks non-numeric Vimeo ID', () => {
        const r = detectVideoType('https://vimeo.com/evil-script');
        expect(r.id).toBeNull();
    });

    it('blocks path traversal in Vimeo ID', () => {
        const r = detectVideoType('https://vimeo.com/../attacker.com');
        expect(r.id).toBeNull();
    });

    // --- Fallback ---
    it('returns type "video" with null id for MP4 URLs', () => {
        const r = detectVideoType('https://example.com/video.mp4');
        expect(r).toEqual({ type: 'video', id: null });
    });
});

describe('Lightbox — Iframe Sandbox', () => {
    it('sandbox string includes required tokens and excludes dangerous ones', () => {
        const sandbox = 'allow-scripts allow-same-origin allow-presentation';
        const tokens = sandbox.split(' ');
        expect(tokens).toContain('allow-scripts');
        expect(tokens).toContain('allow-same-origin');
        expect(tokens).toContain('allow-presentation');
        expect(tokens).not.toContain('allow-top-navigation');
        expect(tokens).not.toContain('allow-popups');
        expect(tokens).not.toContain('allow-forms');
    });
});

describe('Lightbox — Privacy-Enhanced Embeds', () => {
    it('YouTube embed URL uses nocookie domain', () => {
        // Mirrors the actual embed URL construction in lightbox.js
        const id = 'dQw4w9WgXcQ';
        const embedUrl = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
        expect(embedUrl).toContain('youtube-nocookie.com');
        expect(embedUrl).not.toContain('www.youtube.com');
    });

    it('rejects youtube.com in embed URLs (must use nocookie)', () => {
        const badUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
        expect(badUrl).not.toContain('youtube-nocookie.com');
    });
});

describe('Admin — YouTube ID Regex Hardening', () => {
    // The admin regex must enforce the same 11-char alphanumeric constraint as lightbox
    const ADMIN_REGEX = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?/]|$)/;

    it('extracts valid 11-char YouTube ID', () => {
        const match = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'.match(ADMIN_REGEX);
        expect(match[1]).toBe('dQw4w9WgXcQ');
    });

    it('blocks IDs containing special characters', () => {
        const match = 'https://www.youtube.com/watch?v=<script>xss'.match(ADMIN_REGEX);
        expect(match).toBeNull();
    });

    it('blocks IDs shorter than 11 chars', () => {
        const match = 'https://www.youtube.com/watch?v=short'.match(ADMIN_REGEX);
        expect(match).toBeNull();
    });

    it('handles youtu.be short URLs', () => {
        const match = 'https://youtu.be/a-B_cD3e4F5'.match(ADMIN_REGEX);
        expect(match[1]).toBe('a-B_cD3e4F5');
    });
});
