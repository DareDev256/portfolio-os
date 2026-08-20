/* THE SYSTEM — landing behaviour.
 *
 * Deliberately small. The hero's entrance is pure CSS (it is above the fold and
 * must not wait on a script); this file only handles the below-the-fold reveals
 * and the year stamp. If it fails to load the page still reads — every .rv
 * element is un-hidden by the no-js fallback below.
 */

(function () {
    'use strict';

    const reveals = Array.prototype.slice.call(document.querySelectorAll('.rv'));

    const reduced =
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !('IntersectionObserver' in window)) {
        reveals.forEach((el) => el.classList.add('on'));
    } else {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('on');
                    io.unobserve(entry.target);
                });
            },
            // The huge top margin is deliberate. It extends the observer's root
            // upward so anything ABOVE the viewport counts as intersecting. Without
            // it, jumping to #contact from the hero leaves every section it skipped
            // stuck at opacity 0 — scrolling back up shows a blank page, because a
            // plain IntersectionObserver never fires for what you have already passed.
            { rootMargin: '100000px 0px -12% 0px', threshold: 0.08 },
        );

        reveals.forEach((el) => io.observe(el));

        // Anything already on screen at load — a short viewport, a deep link, a
        // restored scroll position — should not wait for a scroll event.
        window.requestAnimationFrame(() => {
            reveals.forEach((el) => {
                const box = el.getBoundingClientRect();
                if (box.top < window.innerHeight) {
                    el.classList.add('on');
                    io.unobserve(el);
                }
            });
        });
    }

    const year = document.querySelector('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
})();
