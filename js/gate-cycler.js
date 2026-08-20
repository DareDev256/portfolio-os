/* The work section, as a cycler.
 *
 * It used to be one hardcoded case study (BetMetrics) with everything else
 * demoted to a card, which meant the page argued exactly one project. Now the
 * expanded gate rotates through five, and the selector doubles as the index —
 * a visitor sees the whole roster without scrolling.
 *
 * Data lives in the HTML as a <template> per gate rather than in this file, so
 * the copy stays reviewable in the markup and the page still says something
 * useful with JavaScript off: gate one renders server-side and the rest are
 * inert templates that a crawler still reads.
 */

(function () {
    'use strict';

    const root = document.getElementById('gate-cycler');
    if (!root) return;

    const stage = root.querySelector('[data-gate-stage]');
    const tabs = Array.prototype.slice.call(root.querySelectorAll('[data-gate-tab]'));
    const templates = Array.prototype.slice.call(root.querySelectorAll('template[data-gate]'));
    if (!stage || templates.length < 2 || tabs.length !== templates.length) return;

    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const HOLD = 9000;
    let index = 0;
    let timer = null;
    let engaged = false; // a click or key ends the auto-advance for good

    function render(next, { focusStage = false } = {}) {
        if (next === index && stage.childElementCount) return;

        const tpl = templates[next];
        const fresh = tpl.content.cloneNode(true);

        stage.replaceChildren(fresh);
        // Restart the entrance rather than inheriting the outgoing gate's state.
        stage.classList.remove('swap');
        void stage.offsetWidth;
        if (!reduced) stage.classList.add('swap');

        tabs.forEach((tab, i) => {
            const on = i === next;
            tab.classList.toggle('on', on);
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.tabIndex = on ? 0 : -1;
        });

        index = next;
        if (focusStage) {
            const h = stage.querySelector('h3');
            if (h) h.setAttribute('tabindex', '-1'), h.focus({ preventScroll: true });
        }
    }

    function advance() {
        render((index + 1) % templates.length);
        queue();
    }

    function queue() {
        window.clearTimeout(timer);
        if (engaged || reduced) return;
        timer = window.setTimeout(advance, HOLD);
    }

    function stop() {
        engaged = true;
        window.clearTimeout(timer);
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => {
            stop();
            render(i, { focusStage: true });
        });
        tab.addEventListener('keydown', (e) => {
            const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (!step) return;
            e.preventDefault();
            stop();
            const next = (i + step + tabs.length) % tabs.length;
            tabs[next].focus();
            render(next);
        });
    });

    // Hovering the stage pauses; it does not disengage, so an idle visitor still
    // gets the rotation back when the pointer leaves.
    root.addEventListener('pointerenter', () => window.clearTimeout(timer));
    root.addEventListener('pointerleave', queue);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) window.clearTimeout(timer);
        else queue();
    });

    // Only run while the section is on screen.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) queue();
                    else window.clearTimeout(timer);
                });
            },
            { threshold: 0.2 },
        ).observe(root);
    } else {
        queue();
    }

    render(0);
})();
