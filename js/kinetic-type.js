/* kinetic-type.js — the display type performs.
 *
 * Three effects, all riding Saira's variable axes (wdth 50-125, wght 100-900):
 *
 *   1. settle       hand the hero's axes back to CSS once the entrance lands, so a
 *                   resize or a later hover does not snap mid-interpolation
 *   2. scrub        headings widen and tighten as they cross the viewport
 *   3. proximity    characters thicken under the cursor and thin as it leaves
 *
 * Vanilla on purpose. The whole page is one Vite build with no animation
 * dependency; adding GSAP + SplitType here would cost ~70KB gzipped to do what
 * an IntersectionObserver and one rAF loop already do.
 *
 * Every effect fails to NOTHING. If this file 404s the headline still reads —
 * the entrance is CSS-only, and .kt-settled is the only thing this adds to it.
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
const COARSE = window.matchMedia('(pointer: coarse)');

/* ---------- 1. settle ----------
 * The entrance is a CSS animation with `forwards`, which leaves the animation
 * holding the axes forever. That is fine until something else wants to write
 * them (proximity, a media-query change) — an animation in fill mode wins over
 * a plain declaration, so those writes would be silently ignored. Swapping in
 * .kt-settled on animationend releases the axes without a visual step, because
 * the class declares exactly the animation's TO state. */
function initSettle() {
    document.querySelectorAll('.kt-in').forEach((el) => {
        el.addEventListener(
            'animationend',
            (e) => {
                // Two animations run on this element; only the width one carries
                // the axes we are handing over. Waiting for `ktRise` instead would
                // work by luck of equal durations, and break the moment they differ.
                if (e.animationName === 'ktWiden') el.classList.add('kt-settled');
            },
            { once: false }
        );
    });
}

/* ---------- 2. scroll-scrubbed width ----------
 * Writes --kt-p from 0 to 1 as the element travels from the bottom of the
 * viewport to a third of the way up. CSS does the axis math from there.
 *
 * Deliberately NOT `animation-timeline: view()`: Safari still does not ship it
 * as of 2026-08, and this surface's traffic is recruiters on whatever they have.
 * A rAF loop gated on an IntersectionObserver costs almost nothing — only
 * elements actually on screen are measured. */
function initScrub() {
    const targets = Array.from(document.querySelectorAll('[data-kt-scrub]'));
    if (!targets.length) return;

    const live = new Set();
    let ticking = false;

    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) live.add(entry.target);
                else {
                    live.delete(entry.target);
                    // Park it at the resolved state rather than wherever it left
                    // off, so scrolling past fast never strands a heading at 46 wide.
                    entry.target.style.setProperty('--kt-p', entry.boundingClientRect.top < 0 ? '1' : '0');
                }
            });
            schedule();
        },
        { rootMargin: '0px 0px -10% 0px', threshold: [0, 0.5, 1] }
    );

    targets.forEach((el) => io.observe(el));

    function measure() {
        ticking = false;
        const vh = window.innerHeight;
        live.forEach((el) => {
            const rect = el.getBoundingClientRect();
            // 0 when the top edge is at the viewport bottom, 1 by the time it has
            // reached a third of the way up. Clamped so a tall element mid-screen
            // does not overshoot the axis range and clip.
            const raw = (vh - rect.top) / (vh * 0.68);
            const p = Math.min(1, Math.max(0, raw));
            el.style.setProperty('--kt-p', p.toFixed(3));
        });
    }

    function schedule() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(measure);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();
}

/* ---------- 3. cursor proximity weight ----------
 * Splits a heading into characters and drives each one's weight off its distance
 * from the pointer. Skipped entirely on touch: there is no cursor to be near, and
 * the split would cost the DOM nodes for nothing. */
function splitChars(el) {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';

    const chars = [];
    for (const ch of text) {
        const span = document.createElement('span');
        span.className = ch === ' ' ? 'kt-char kt-space' : 'kt-char';
        span.textContent = ch === ' ' ? ' ' : ch;
        span.setAttribute('aria-hidden', 'true');
        el.appendChild(span);
        if (ch !== ' ') chars.push(span);
    }
    return chars;
}

/* The design weight. A heading that is not being hovered must sit HERE, not at
 * the bottom of the proximity range — otherwise the whole page renders thin and
 * washed out for every visitor whose cursor is somewhere else, which is most of
 * them, most of the time. Verified 2026-08-24: the first cut of this file
 * painted every char at 300 on load because the pointer starts off-screen. */
const REST_WGHT = 700;
const NEAR_WGHT = 900;
const FAR_WGHT = 420;

function initProximity() {
    if (COARSE.matches) return;

    const groups = [];
    document.querySelectorAll('[data-kt-proximity]').forEach((el) => {
        const radius = Number(el.dataset.ktProximity) || 180;
        const group = { chars: splitChars(el), radius, host: el, active: false };
        // Scoped to the heading: the effect only arms while the pointer is over
        // that specific block. A global mousemove would mean a cursor parked in
        // the footer is still thinning a heading three sections up.
        el.addEventListener('pointerenter', () => {
            group.active = true;
            remeasure();
            schedule();
        });
        el.addEventListener('pointerleave', () => {
            group.active = false;
            group.chars.forEach((c) => c.style.setProperty('--kt-w', REST_WGHT));
        });
        groups.push(group);
    });
    if (!groups.length) return;

    let mx = -9999;
    let my = -9999;
    let ticking = false;
    // Character boxes are measured once per settle, not per frame:
    // getBoundingClientRect inside a mousemove loop on ~60 spans is a layout
    // thrash that shows up as jitter on the scroll, not on the type.
    let boxes = [];

    function remeasure() {
        boxes = groups
            .filter((g) => g.active)
            .flatMap((g) =>
                g.chars.map((c) => {
                    const r = c.getBoundingClientRect();
                    return { el: c, x: r.left + r.width / 2, y: r.top + r.height / 2, radius: g.radius };
                })
            );
    }

    function paint() {
        ticking = false;
        for (const b of boxes) {
            const d = Math.hypot(mx - b.x, my - b.y);
            const near = Math.max(0, 1 - d / b.radius);
            // Smoothstep rather than linear: a linear falloff makes a visible
            // circular edge travel across the words. This keeps the bulge soft.
            const t = near * near * (3 - 2 * near);
            const w = FAR_WGHT + (NEAR_WGHT - FAR_WGHT) * t;
            b.el.style.setProperty('--kt-w', Math.round(w));
        }
    }

    function schedule() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(paint);
    }

    window.addEventListener(
        'mousemove',
        (e) => {
            mx = e.clientX;
            my = e.clientY;
            schedule();
        },
        { passive: true }
    );

    // Boxes are viewport-relative, so they move with every scroll.
    window.addEventListener('scroll', () => {
        remeasure();
        schedule();
    }, { passive: true });
    window.addEventListener('resize', () => {
        remeasure();
        schedule();
    });

    // Fonts land after first paint; measuring before they do records boxes for
    // the fallback face and the weights bulge in the wrong places.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(remeasure);
    }
    remeasure();
    // No paint on boot. Nothing is active yet, so every char keeps the CSS
    // default (REST_WGHT) until a pointer actually enters a heading.
}

function boot() {
    initSettle();
    if (REDUCED.matches) return;
    initScrub();
    initProximity();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
