/* System effects — the two that carry meaning, not the ten that would be noise.
 *
 * 1. COUNT-UP on every figure. The page's whole argument is that the numbers are
 *    real and derived, so having them tick up like a readout being taken is the
 *    one flourish that says something true. 90 stars landing on 90 reads as
 *    measurement; 90 sitting there reads as a claim.
 *
 * 2. SCAN SWEEP when a gate swaps. A single line crossing the new panel, once.
 *    It marks the moment the readout changed, which is exactly what a status
 *    window would do.
 *
 * Both are disabled wholesale under prefers-reduced-motion, and both leave the
 * final value in the DOM from the start — the animation only ever overwrites a
 * value that is already correct, so a failure here shows the real number.
 */

(function () {
    'use strict';

    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    /* Split "1,928 installs/mo" into prefix "", number 1928, suffix " installs/mo",
     * preserving comma grouping so the count-up formats the same way it landed.
     * Anything with two separate numbers ("1 in 3") is left alone — animating one
     * half of a phrase looks broken. */
    function parseFigure(text) {
        const groups = text.match(/\d[\d,]*\.?\d*/g);
        if (!groups || groups.length !== 1) return null;
        const raw = groups[0];
        const idx = text.indexOf(raw);
        const value = parseFloat(raw.replace(/,/g, ''));
        if (!isFinite(value) || value === 0) return null;
        return {
            prefix: text.slice(0, idx),
            suffix: text.slice(idx + raw.length),
            value,
            decimals: (raw.split('.')[1] || '').length,
            grouped: raw.includes(','),
        };
    }

    function render(part, n) {
        const fixed = n.toFixed(part.decimals);
        const shown = part.grouped
            ? Number(fixed).toLocaleString('en-US', {
                  minimumFractionDigits: part.decimals,
                  maximumFractionDigits: part.decimals,
              })
            : fixed;
        return part.prefix + shown + part.suffix;
    }

    const outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

    function countUp(el) {
        if (el.dataset.counted) return;
        const final = el.textContent;
        const part = parseFigure(final);
        if (!part) {
            el.dataset.counted = '1';
            return;
        }
        el.dataset.counted = '1';

        const DURATION = 1100;
        const started = performance.now();

        function step(now) {
            /* Clamped at BOTH ends. The upper bound was always here; the lower
             * one matters because `now` is the frame's start timestamp and can
             * legitimately predate the performance.now() taken just before
             * scheduling this callback. A negative t makes 2^(-10t) enormous,
             * so outExpo returns a large NEGATIVE multiplier and the figure
             * renders as garbage — `v0.59` came out as `v-51666.88` and `2×` as
             * `-175252×` in a real capture of the live page.
             *
             * A normal browser does not do this: instrumented over 244 rendered
             * values in headless Chromium, every one counted up cleanly. The
             * renderer that produced those numbers drives a virtual clock ~1.8s
             * behind. That is exactly what link-preview bots, archive crawlers
             * and OG-image generators do, and their output is seen by people. */
            const t = Math.max(0, Math.min(1, (now - started) / DURATION));
            const eased = outExpo(t);
            el.textContent = render(part, part.value * eased);
            if (t < 1) {
                window.requestAnimationFrame(step);
            } else {
                // Always land on the exact original string, never on a rounding of it.
                el.textContent = final;
            }
        }
        window.requestAnimationFrame(step);
    }

    const FIGURE_SELECTOR = '.figs .n, .panel-rows .row span:last-child, .legend + * .n';

    function countUpWithin(root) {
        root.querySelectorAll('.figs .n').forEach(countUp);
    }

    // Hero status panel: count once, when its rows have animated in.
    window.setTimeout(() => {
        document.querySelectorAll('.panel-rows .row > span:last-child').forEach((el) => {
            // Nested spans (the "/ 43 active" halves) would double-animate.
            if (el.querySelector('span')) return;
            countUp(el);
        });
    }, 1600);

    // Gate figures: on first sight, and again on every swap.
    const stage = document.querySelector('[data-gate-stage]');
    if (stage) {
        const swept = () => {
            stage.querySelectorAll('.figs .n').forEach((el) => {
                delete el.dataset.counted;
                countUp(el);
            });
            stage.classList.remove('sweep');
            void stage.offsetWidth;
            stage.classList.add('sweep');
        };
        new MutationObserver(swept).observe(stage, { childList: true });
    }

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    countUpWithin(entry.target);
                    io.unobserve(entry.target);
                });
            },
            { threshold: 0.4 },
        );
        document.querySelectorAll('.gate-cycler, .gate-strip').forEach((el) => io.observe(el));
    } else {
        countUpWithin(document);
    }

    void FIGURE_SELECTOR;
})();
