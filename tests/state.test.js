import { describe, it, expect, beforeEach } from 'vitest';
import { State } from '../js/state.js';

describe('State.getNextZIndex()', () => {
    beforeEach(() => {
        State.currentZIndex = 100;
        State.maxZIndex = 100;
    });

    it('increments z-index', () => {
        const z1 = State.getNextZIndex();
        const z2 = State.getNextZIndex();
        expect(z1).toBe(101);
        expect(z2).toBe(102);
    });

    it('tracks maxZIndex', () => {
        State.getNextZIndex();
        State.getNextZIndex();
        State.getNextZIndex();
        expect(State.maxZIndex).toBe(103);
    });
});

describe('State.setTheme()', () => {
    it('persists theme to localStorage', () => {
        State.setTheme('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(State.theme).toBe('dark');
    });

    it('sets data-theme attribute on body', () => {
        State.setTheme('light');
        expect(document.body.getAttribute('data-theme')).toBe('light');
    });
});

describe('State.toggleTheme()', () => {
    it('toggles between light and dark', () => {
        State.theme = 'light';
        State.toggleTheme();
        expect(State.theme).toBe('dark');
        State.toggleTheme();
        expect(State.theme).toBe('light');
    });
});

describe('State.setInteractionIntensity()', () => {
    it('clamps value between 0 and 100', () => {
        State.setInteractionIntensity(150);
        expect(State.interactionIntensity).toBe(100);

        State.setInteractionIntensity(-10);
        expect(State.interactionIntensity).toBe(0);

        State.setInteractionIntensity(50);
        expect(State.interactionIntensity).toBe(50);
    });

    it('persists to localStorage', () => {
        State.setInteractionIntensity(75);
        expect(localStorage.getItem('interactionIntensity')).toBe('75');
    });
});

describe('State.applyWallpaper()', () => {
    it('blocks javascript: protocol', () => {
        const spy = [];
        const origWarn = console.warn;
        console.warn = (...args) => spy.push(args);
        State.applyWallpaper('javascript:alert(1)');
        console.warn = origWarn;
        expect(spy.length).toBeGreaterThan(0);
        expect(spy[0][0]).toContain('Blocked');
    });

    it('blocks data:text/html protocol', () => {
        const spy = [];
        const origWarn = console.warn;
        console.warn = (...args) => spy.push(args);
        State.applyWallpaper('data:text/html,<script>alert(1)</script>');
        console.warn = origWarn;
        expect(spy.length).toBeGreaterThan(0);
    });

    it('handles gradient tokens', () => {
        State.applyWallpaper('gradient:dark-ombre');
        const val = document.documentElement.style.getPropertyValue('--wallpaper-url');
        expect(val).toContain('linear-gradient');
    });

    it('strips dangerous characters from URLs', () => {
        State.applyWallpaper("test')inject");
        const val = document.documentElement.style.getPropertyValue('--wallpaper-url');
        // After stripping ' and ), the URL should be clean
        expect(val).not.toContain("'test");
        expect(val).toContain('testinject');
    });
});

describe('State window registry', () => {
    beforeEach(() => {
        State.windows.clear();
    });

    it('registers and retrieves windows', () => {
        const win = { id: 'test', element: document.createElement('div') };
        State.registerWindow('test', win);
        expect(State.getWindow('test')).toBe(win);
    });

    it('unregisters windows', () => {
        const win = { id: 'test', element: document.createElement('div') };
        State.registerWindow('test', win);
        State.unregisterWindow('test');
        expect(State.getWindow('test')).toBeUndefined();
    });

    it('getAllWindows returns array', () => {
        const win1 = { id: 'a', element: document.createElement('div') };
        const win2 = { id: 'b', element: document.createElement('div') };
        State.registerWindow('a', win1);
        State.registerWindow('b', win2);
        expect(State.getAllWindows()).toHaveLength(2);
    });
});

describe('State._emit()', () => {
    it('dispatches CustomEvent on document', () => {
        let received = null;
        document.addEventListener('state:test', (e) => { received = e.detail; }, { once: true });
        State._emit('test', { value: 42 });
        expect(received).toEqual({ value: 42 });
    });
});
