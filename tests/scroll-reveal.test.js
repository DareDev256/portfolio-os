import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScrollReveal } from '../js/scroll-reveal.js';

// ── Scroll Reveal Tests ─────────────────────────────────────────────
// Covers: IntersectionObserver wiring, MutationObserver auto-detection,
//         WeakSet deduplication, and dynamic element observation.

/** Capture IntersectionObserver instances for manual triggering */
let observers = [];
class MockIntersectionObserver {
    constructor(cb, opts) {
        this.cb = cb;
        this.opts = opts;
        this.elements = new Set();
        observers.push(this);
    }
    observe(el) { this.elements.add(el); }
    unobserve(el) { this.elements.delete(el); }
    disconnect() { this.elements.clear(); }
    /** Simulate entries intersecting */
    fire(entries) { this.cb(entries); }
}

describe('ScrollReveal', () => {
    beforeEach(() => {
        observers = [];
        globalThis.IntersectionObserver = MockIntersectionObserver;

        document.body.innerHTML = `
            <div id="windowsContainer">
                <div class="window">
                    <div class="window-content">
                        <div class="scroll-reveal" data-reveal="fade-up">Section A</div>
                        <div class="scroll-reveal" data-reveal="scale">Section B</div>
                    </div>
                </div>
            </div>`;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('observes .scroll-reveal elements inside existing .window-content', () => {
        ScrollReveal.init();
        expect(observers.length).toBeGreaterThanOrEqual(1);
        const io = observers[0];
        expect(io.elements.size).toBe(2);
        expect(io.opts.threshold).toBe(0.15);
    });

    it('adds scroll-reveal--visible class when entry intersects', () => {
        ScrollReveal.init();
        const el = document.querySelector('.scroll-reveal');
        observers[0].fire([{ target: el, isIntersecting: true }]);
        expect(el.classList.contains('scroll-reveal--visible')).toBe(true);
    });

    it('does NOT add visible class when entry is not intersecting', () => {
        ScrollReveal.init();
        const el = document.querySelector('.scroll-reveal');
        observers[0].fire([{ target: el, isIntersecting: false }]);
        expect(el.classList.contains('scroll-reveal--visible')).toBe(false);
    });

    it('skips init gracefully when #windowsContainer is missing', () => {
        document.body.innerHTML = '';
        expect(() => ScrollReveal.init()).not.toThrow();
        expect(observers.length).toBe(0);
    });

    it('auto-wires new windows added to windowsContainer via MutationObserver', async () => {
        ScrollReveal.init();
        const initialCount = observers.length;

        // Dynamically add a new window with reveal targets
        const wc = document.getElementById('windowsContainer');
        const newWin = document.createElement('div');
        newWin.className = 'window';
        newWin.innerHTML = `<div class="window-content"><div class="scroll-reveal">New</div></div>`;
        wc.appendChild(newWin);

        // MutationObserver fires async — flush microtasks
        await vi.waitFor(() => {
            expect(observers.length).toBeGreaterThan(initialCount);
        });
    });

    it('does not double-observe the same container (WeakSet dedup)', () => {
        ScrollReveal.init();
        const container = document.querySelector('.window-content');
        const before = observers.length;
        ScrollReveal.observe(container);
        // Should not create a new IntersectionObserver for same container
        expect(observers.length).toBe(before);
    });

    it('manually observes a container via .observe()', () => {
        const standalone = document.createElement('div');
        standalone.className = 'custom-scroll';
        standalone.innerHTML = '<div class="scroll-reveal">Manual</div>';
        document.body.appendChild(standalone);

        ScrollReveal.observe(standalone);
        const io = observers[observers.length - 1];
        expect(io.elements.size).toBe(1);
    });

    it('ignores .observe(null) without throwing', () => {
        expect(() => ScrollReveal.observe(null)).not.toThrow();
    });

    it('picks up dynamically appended .scroll-reveal inside an observed container', async () => {
        ScrollReveal.init();
        const content = document.querySelector('.window-content');
        const dynamic = document.createElement('div');
        dynamic.className = 'scroll-reveal';
        dynamic.setAttribute('data-reveal', 'fade-left');
        content.appendChild(dynamic);

        await vi.waitFor(() => {
            const io = observers[0];
            expect(io.elements.has(dynamic)).toBe(true);
        });
    });
});
