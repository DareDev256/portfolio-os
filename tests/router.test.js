import { describe, it, expect, beforeEach, vi } from 'vitest';

// Router imports Desktop which pulls in heavy DOM modules.
// We mock desktop.js so we can test Router logic in isolation.
vi.mock('../js/desktop.js', () => ({
    Desktop: {
        openAbout: vi.fn(),
        openApplications: vi.fn(),
        openMediaVault: vi.fn(),
        openContact: vi.fn(),
        openSettings: vi.fn(),
        openResume: vi.fn(),
        openShell: vi.fn(),
    },
}));

const { Router } = await import('../js/router.js');
const { Desktop } = await import('../js/desktop.js');

describe('Router.navigate()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.history.replaceState({}, '', '/');
    });

    it('blocks javascript: protocol', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        Router.navigate('javascript:alert(1)');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('Blocked'), expect.anything());
        expect(window.location.pathname).toBe('/');
    });

    it('blocks data: URLs', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        Router.navigate('data:text/html,<h1>hi</h1>');
        expect(window.location.pathname).toBe('/');
    });

    it('blocks paths without leading slash', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        Router.navigate('about');
        expect(window.location.pathname).toBe('/');
    });

    it('blocks null/undefined/empty input', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        Router.navigate(null);
        Router.navigate(undefined);
        Router.navigate('');
        expect(window.location.pathname).toBe('/');
    });

    it('navigates to valid paths', () => {
        Router.navigate('/about');
        expect(window.location.pathname).toBe('/about');
        expect(Desktop.openAbout).toHaveBeenCalled();
    });

    it('blocks paths with special characters', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        Router.navigate('/path?query=1');
        expect(window.location.pathname).not.toBe('/path?query=1');
    });
});

describe('Router.handleRoute()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls correct handler for /about', () => {
        Router.handleRoute('/about');
        expect(Desktop.openAbout).toHaveBeenCalled();
    });

    it('calls correct handler for /work', () => {
        Router.handleRoute('/work');
        expect(Desktop.openApplications).toHaveBeenCalled();
    });

    it('calls correct handler for /connect', () => {
        Router.handleRoute('/connect');
        expect(Desktop.openContact).toHaveBeenCalled();
    });

    it('normalizes empty string to /', () => {
        // '/' route has null handler — should not throw
        expect(() => Router.handleRoute('')).not.toThrow();
    });

    it('logs warning for unknown routes', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        Router.handleRoute('/nonexistent');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });
});

describe('Router.addRoute()', () => {
    it('registers and invokes custom routes', () => {
        const handler = vi.fn();
        Router.addRoute('/custom', handler);
        Router.handleRoute('/custom');
        expect(handler).toHaveBeenCalled();
        // Clean up
        delete Router.routes['/custom'];
    });
});
