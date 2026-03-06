import { describe, it, expect, beforeEach } from 'vitest';
import { State } from '../js/state.js';

describe('State — auto-generated boolean toggles', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('generates setter methods for all toggles', () => {
        const expected = [
            'setFxEnabled', 'setAuroraEnabled', 'setGlyphsEnabled',
            'setSoundEnabled', 'setInteractionsEnabled',
            'setMicroInteractionsEnabled', 'setCursorReactiveEnabled',
            'setCursorTrailEnabled', 'setEasterEggsEnabled',
        ];
        expected.forEach(name => {
            expect(typeof State[name]).toBe('function');
        });
    });

    it('generates toggle methods for all toggles', () => {
        const expected = [
            'toggleFx', 'toggleAurora', 'toggleGlyphs',
            'toggleSound', 'toggleInteractions',
            'toggleMicroInteractions', 'toggleCursorReactive',
            'toggleCursorTrail', 'toggleEasterEggs',
        ];
        expected.forEach(name => {
            expect(typeof State[name]).toBe('function');
        });
    });

    it('setter persists value to localStorage as "1"/"0"', () => {
        State.setFxEnabled(true);
        expect(localStorage.getItem('fxEnabled')).toBe('1');
        State.setFxEnabled(false);
        expect(localStorage.getItem('fxEnabled')).toBe('0');
    });

    it('toggle flips current state', () => {
        State.fxEnabled = false;
        State.toggleFx();
        expect(State.fxEnabled).toBe(true);
        State.toggleFx();
        expect(State.fxEnabled).toBe(false);
    });

    it('setter coerces truthy/falsy values to boolean', () => {
        State.setGlyphsEnabled(0);
        expect(State.glyphsEnabled).toBe(false);
        State.setGlyphsEnabled('yes');
        expect(State.glyphsEnabled).toBe(true);
        State.setGlyphsEnabled(null);
        expect(State.glyphsEnabled).toBe(false);
    });

    it('emits state event for toggles with event names', () => {
        let received = null;
        document.addEventListener('state:fx', (e) => { received = e.detail; }, { once: true });
        State.setFxEnabled(true);
        expect(received).toEqual({ enabled: true });
    });

    it('does not emit event for toggles without event name', () => {
        // microInteractionsEnabled has event: null
        let emitted = false;
        const handler = () => { emitted = true; };
        document.addEventListener('state:null', handler);
        State.setMicroInteractionsEnabled(true);
        document.removeEventListener('state:null', handler);
        expect(emitted).toBe(false);
    });
});

describe('State.setCursorTrailType()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('accepts valid trail type', () => {
        State.setCursorTrailType('playstation');
        expect(State.cursorTrailType).toBe('playstation');
        expect(localStorage.getItem('cursorTrailType')).toBe('playstation');
    });

    it('rejects invalid trail type and falls back to chakra', () => {
        State.setCursorTrailType('evil" onmouseover=alert(1)');
        expect(State.cursorTrailType).toBe('chakra');
    });

    it('emits cursorTrailType event', () => {
        let received = null;
        document.addEventListener('state:cursorTrailType', (e) => {
            received = e.detail;
        }, { once: true });
        State.setCursorTrailType('playstation');
        expect(received).toEqual({ type: 'playstation' });
    });
});

describe('State._loadBoolean()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('loads "1" as true', () => {
        localStorage.setItem('fxEnabled', '1');
        State.fxEnabled = false;
        State._loadBoolean('fxEnabled');
        expect(State.fxEnabled).toBe(true);
    });

    it('loads "0" as false', () => {
        localStorage.setItem('fxEnabled', '0');
        State.fxEnabled = true;
        State._loadBoolean('fxEnabled');
        expect(State.fxEnabled).toBe(false);
    });

    it('preserves current value when key is missing from localStorage', () => {
        State.fxEnabled = true;
        State._loadBoolean('fxEnabled');
        expect(State.fxEnabled).toBe(true);
    });

    it('treats any non-"1" string as false', () => {
        localStorage.setItem('fxEnabled', 'true');
        State._loadBoolean('fxEnabled');
        expect(State.fxEnabled).toBe(false);
    });
});
