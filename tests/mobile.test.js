import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import directly — Mobile has no external module deps
const { Mobile } = await import('../js/mobile.js');

describe('Mobile.isMobile()', () => {
    const originalUA = navigator.userAgent;
    const originalMaxTP = navigator.maxTouchPoints;

    afterEach(() => {
        // Restore originals
        Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: originalMaxTP, configurable: true });
        delete window.ontouchstart;
        // Reset innerWidth
        Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    });

    it('returns true for iPhone user agent', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
            configurable: true,
        });
        expect(Mobile.isMobile()).toBe(true);
    });

    it('returns true for Android user agent', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)',
            configurable: true,
        });
        expect(Mobile.isMobile()).toBe(true);
    });

    it('returns true for iPad user agent', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
            configurable: true,
        });
        expect(Mobile.isMobile()).toBe(true);
    });

    it('returns false for desktop user agent with large screen', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            configurable: true,
        });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
        expect(Mobile.isMobile()).toBe(false);
    });

    it('returns true for touch device with small screen (non-mobile UA)', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Linux; Chrome)',
            configurable: true,
        });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
        expect(Mobile.isMobile()).toBe(true);
    });

    it('returns false for touch device with large screen (laptop touchscreen)', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            configurable: true,
        });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 10, configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
        expect(Mobile.isMobile()).toBe(false);
    });
});

describe('Mobile.ensureViewportMeta()', () => {
    beforeEach(() => {
        document.querySelectorAll('meta[name="viewport"]').forEach(el => el.remove());
    });

    it('creates viewport meta tag when missing', () => {
        Mobile.ensureViewportMeta();
        const meta = document.querySelector('meta[name="viewport"]');
        expect(meta).not.toBeNull();
        expect(meta.content).toContain('width=device-width');
    });

    it('does not duplicate if viewport meta already exists', () => {
        const existing = document.createElement('meta');
        existing.name = 'viewport';
        existing.content = 'width=device-width';
        document.head.appendChild(existing);

        Mobile.ensureViewportMeta();
        const metas = document.querySelectorAll('meta[name="viewport"]');
        expect(metas.length).toBe(1);
    });
});

describe('Mobile.applyMobileOptimizations()', () => {
    beforeEach(() => {
        document.body.classList.remove('mobile-device');
        document.querySelectorAll('meta[name="viewport"]').forEach(el => el.remove());
        // Remove injected styles from previous runs
        document.querySelectorAll('style').forEach(el => el.remove());
    });

    it('adds mobile-device class to body', () => {
        Mobile.applyMobileOptimizations();
        expect(document.body.classList.contains('mobile-device')).toBe(true);
    });

    it('injects hover-disable stylesheet', () => {
        Mobile.applyMobileOptimizations();
        const styles = [...document.querySelectorAll('style')];
        const hoverStyle = styles.find(s => s.textContent.includes('hover: none'));
        expect(hoverStyle).not.toBeUndefined();
    });

    it('injects mobile layout stylesheet', () => {
        Mobile.applyMobileOptimizations();
        const styles = [...document.querySelectorAll('style')];
        const mobileStyle = styles.find(s => s.textContent.includes('max-width: 768px'));
        expect(mobileStyle).not.toBeUndefined();
    });
});
