import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Stub matchMedia before importing the module
let motionMatches = false;

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: motionMatches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })),
});

const { HoloTilt } = await import('../js/holo-tilt.js');

/** Create a .project-card with child elements (mirrors real DOM structure) */
function makeCard() {
    const card = document.createElement('div');
    card.className = 'project-card';
    Object.defineProperty(card, 'getBoundingClientRect', {
        value: () => ({ left: 100, top: 100, width: 200, height: 160,
                        right: 300, bottom: 260, x: 100, y: 100, toJSON() {} }),
    });
    // Add children — mimics blueprint overlay, title, description
    const overlay = document.createElement('div');
    overlay.className = 'blueprint-overlay';
    const title = document.createElement('div');
    title.className = 'project-title';
    title.textContent = 'Test Project';
    card.append(overlay, title);
    document.body.appendChild(card);
    return card;
}

function fireLeave(target, relatedTarget) {
    target.dispatchEvent(new MouseEvent('mouseleave', {
        bubbles: false, relatedTarget,
    }));
}

describe('HoloTilt', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        motionMatches = false;
        HoloTilt._activeCard = null;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('applies 3D transform on mousemove over a project card', () => {
        const card = makeCard();
        HoloTilt.init();

        // Move cursor to card area — target a child so closest() walks up
        card.querySelector('.project-title').dispatchEvent(
            new MouseEvent('mousemove', { clientX: 200, clientY: 180, bubbles: true }),
        );

        expect(card.style.transform).toContain('perspective');
        expect(card.style.transform).toContain('rotateX');
        expect(card.style.getPropertyValue('--holo-opacity')).toBe('1');
    });

    it('resets transform when cursor leaves the card entirely', () => {
        const card = makeCard();
        HoloTilt.init();

        // Activate card
        card.querySelector('.project-title').dispatchEvent(
            new MouseEvent('mousemove', { clientX: 200, clientY: 180, bubbles: true }),
        );
        expect(card.style.transform).toContain('perspective');

        // Cursor leaves card to an element outside (relatedTarget = body)
        fireLeave(card, document.body);

        expect(card.style.transform).toBe('');
        expect(card.style.getPropertyValue('--holo-opacity')).toBe('0');
    });

    it('does NOT reset when cursor moves between child elements within the card', () => {
        const card = makeCard();
        HoloTilt.init();

        const overlay = card.querySelector('.blueprint-overlay');
        const title = card.querySelector('.project-title');

        // Activate card via mousemove on overlay
        overlay.dispatchEvent(
            new MouseEvent('mousemove', { clientX: 200, clientY: 180, bubbles: true }),
        );
        expect(card.style.transform).toContain('perspective');

        // Cursor leaves overlay but enters title (still inside card)
        fireLeave(overlay, title);

        // Transform should remain — no flicker
        expect(card.style.transform).toContain('perspective');
        expect(card.style.getPropertyValue('--holo-opacity')).toBe('1');
    });

    it('resets active card when cursor leaves the viewport (relatedTarget is null)', () => {
        const card = makeCard();
        HoloTilt.init();

        card.querySelector('.project-title').dispatchEvent(
            new MouseEvent('mousemove', { clientX: 200, clientY: 180, bubbles: true }),
        );

        // mouseleave with null relatedTarget = cursor left the window
        fireLeave(card, null);

        expect(card.style.transform).toBe('');
        expect(HoloTilt._activeCard).toBeNull();
    });

    it('resets lingering active card when mouseleave fires on a non-card element', () => {
        const card = makeCard();
        HoloTilt.init();

        // Activate card
        card.querySelector('.project-title').dispatchEvent(
            new MouseEvent('mousemove', { clientX: 200, clientY: 180, bubbles: true }),
        );
        expect(HoloTilt._activeCard).toBe(card);

        // mouseleave on body (non-card element) — should clean up active card
        fireLeave(document.body, null);

        expect(card.style.transform).toBe('');
        expect(HoloTilt._activeCard).toBeNull();
    });

    it('skips init when prefers-reduced-motion is active', () => {
        motionMatches = true;
        const addSpy = vi.spyOn(document, 'addEventListener');
        // Create a fresh object to test the guard without prior listeners
        const fresh = { ...HoloTilt, _activeCard: null };
        fresh.init.call(fresh);

        // init() should bail before adding any listeners
        const holoListeners = addSpy.mock.calls.filter(
            ([type]) => type === 'mousemove' || type === 'mouseleave',
        );
        expect(holoListeners).toHaveLength(0);
        addSpy.mockRestore();
    });

    it('sets holographic light position relative to card', () => {
        const card = makeCard();
        HoloTilt.init();

        card.dispatchEvent(
            new MouseEvent('mousemove', { clientX: 150, clientY: 130, bubbles: true }),
        );

        // lx = clientX - rect.left = 150 - 100 = 50
        // ly = clientY - rect.top  = 130 - 100 = 30
        expect(card.style.getPropertyValue('--holo-x')).toBe('50px');
        expect(card.style.getPropertyValue('--holo-y')).toBe('30px');
        expect(card.style.getPropertyValue('--holo-r')).toBe('260px');
    });

    it('resets via mousemove when cursor leaves card area', () => {
        const card = makeCard();
        HoloTilt.init();

        // Activate
        card.dispatchEvent(
            new MouseEvent('mousemove', { clientX: 200, clientY: 180, bubbles: true }),
        );
        expect(card.style.transform).toContain('perspective');

        // mousemove on body (outside any card)
        document.body.dispatchEvent(
            new MouseEvent('mousemove', { clientX: 500, clientY: 500, bubbles: true }),
        );

        expect(card.style.transform).toBe('');
    });
});
