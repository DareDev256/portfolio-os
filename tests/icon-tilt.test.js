import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stub matchMedia before importing the module
let motionMatches = false;
const listeners = [];

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: motionMatches,
        media: query,
        addEventListener: (_ev, cb) => listeners.push(cb),
        removeEventListener: vi.fn(),
    })),
});

const { IconTilt } = await import('../js/icon-tilt.js');

function makeDesktop(...boxCount) {
    const container = document.createElement('div');
    container.className = 'desktop-icons';
    const count = boxCount[0] || 1;
    for (let i = 0; i < count; i++) {
        const box = document.createElement('div');
        box.className = 'desktop-icon-box';
        // Give box a layout so getBoundingClientRect has real values
        Object.defineProperty(box, 'getBoundingClientRect', {
            value: () => ({ left: 100 * i, top: 100, width: 80, height: 80 }),
        });
        container.appendChild(box);
    }
    document.body.appendChild(container);
    return container;
}

function fireMouseMove(target, clientX, clientY) {
    target.dispatchEvent(new MouseEvent('mousemove', {
        clientX, clientY, bubbles: true,
    }));
}

function fireMouseLeave(target) {
    target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
}

describe('IconTilt', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        motionMatches = false;
        listeners.length = 0;
    });

    it('sets tilt CSS properties on mousemove', () => {
        const container = makeDesktop(1);
        IconTilt.init();
        const box = container.querySelector('.desktop-icon-box');

        // Mouse at center-right → positive tiltY, near-zero tiltX
        fireMouseMove(box, 180, 140);

        const tiltX = box.style.getPropertyValue('--tilt-x');
        const tiltY = box.style.getPropertyValue('--tilt-y');
        expect(tiltX).toBeTruthy();
        expect(tiltY).toBeTruthy();
        // Tilt values should be degree strings
        expect(tiltX).toMatch(/deg$/);
        expect(tiltY).toMatch(/deg$/);
    });

    it('resets tilt to zero on mouseleave', () => {
        const container = makeDesktop(1);
        IconTilt.init();
        const box = container.querySelector('.desktop-icon-box');

        fireMouseMove(box, 180, 140);
        fireMouseLeave(box);

        expect(box.style.getPropertyValue('--tilt-x')).toBe('0deg');
        expect(box.style.getPropertyValue('--tilt-y')).toBe('0deg');
        expect(box.style.getPropertyValue('--bloom-x')).toBe('50%');
        expect(box.style.getPropertyValue('--bloom-y')).toBe('50%');
    });

    it('respects prefers-reduced-motion — no tilt applied', () => {
        motionMatches = true;
        const container = makeDesktop(1);
        IconTilt.init();
        const box = container.querySelector('.desktop-icon-box');

        fireMouseMove(box, 180, 140);
        // No CSS properties should be set when reduced motion is on
        expect(box.style.getPropertyValue('--tilt-x')).toBe('');
    });

    it('dynamically responds to reduced-motion toggle', () => {
        const container = makeDesktop(1);
        IconTilt.init();
        const box = container.querySelector('.desktop-icon-box');

        // Simulate user enabling reduced motion at runtime
        listeners.forEach(cb => cb({ matches: true }));
        fireMouseMove(box, 180, 140);
        expect(box.style.getPropertyValue('--tilt-x')).toBe('');
    });

    it('does not throw when .desktop-icons is missing', () => {
        // No container in DOM — init should bail gracefully
        expect(() => IconTilt.init()).not.toThrow();
    });

    it('attaches to dynamically added icons via MutationObserver', async () => {
        const container = makeDesktop(0);
        // Remove any children so it starts empty
        container.innerHTML = '';
        IconTilt.init();

        // Dynamically add an icon box
        const newBox = document.createElement('div');
        newBox.className = 'desktop-icon-box';
        Object.defineProperty(newBox, 'getBoundingClientRect', {
            value: () => ({ left: 0, top: 0, width: 80, height: 80 }),
        });
        container.appendChild(newBox);

        // MutationObserver fires asynchronously
        await new Promise(r => setTimeout(r, 0));

        fireMouseMove(newBox, 40, 40);
        expect(newBox.style.getPropertyValue('--tilt-y')).toBeTruthy();
    });

    it('calculates bloom position inversely to tilt', () => {
        const container = makeDesktop(1);
        IconTilt.init();
        const box = container.querySelector('.desktop-icon-box');

        // Mouse at exact center of box (rect: left=0, top=100, w=80, h=80 → center 40,140)
        fireMouseMove(box, 40, 140);
        const bloomX = parseFloat(box.style.getPropertyValue('--bloom-x'));
        const bloomY = parseFloat(box.style.getPropertyValue('--bloom-y'));
        expect(bloomX).toBeCloseTo(50, 0);
        expect(bloomY).toBeCloseTo(50, 0);
    });
});
