/* The fourth-wall notice.
 *
 * One status window, once per visit, after a real dwell — never a nag. It fires
 * only if someone has been reading for a while AND has scrolled past the hero,
 * so it lands on an engaged reader rather than a bounce.
 *
 * The line it opens with is the joke: this page keeps score, and the score is
 * that you have already spent longer here than the people it was built for.
 * That only works if the number is true, so it is measured, not invented.
 */

(function () {
    'use strict';

    const SEEN = 'sys-notice-seen';
    const DWELL = 75000; // ms of active reading before it will consider firing

    let hasScrolled = false;
    let fired = false;

    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
        if (window.sessionStorage.getItem(SEEN)) return;
    } catch {
        // Private mode with storage disabled: fall through and just show it once
        // for this page view rather than bailing out entirely.
    }

    const started = Date.now();

    function dismiss(el) {
        el.classList.remove('on');
        window.setTimeout(() => el.remove(), reduced ? 0 : 400);
    }

    function build() {
        const seconds = Math.round((Date.now() - started) / 1000);

        const el = document.createElement('aside');
        el.className = 'sys-notice panel brackets';
        el.setAttribute('role', 'status');
        el.innerHTML = `
            <div class="bk"></div>
            <div class="panel-head">
                <span class="label">NOTICE</span>
                <span class="stamp">SESSION ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}</span>
            </div>
            <div class="sys-notice-body">
                <p>Still reading. You have been on this page ${seconds} seconds — the average recruiter spends about seven.</p>
                <p class="dim">That is either a good sign or you got distracted. Both are fine.</p>
            </div>
            <div class="sys-notice-foot">
                <a class="btn gold" href="#contact">SAY SOMETHING</a>
                <button class="btn ghost" type="button" data-notice-close>DISMISS</button>
            </div>`;

        document.body.appendChild(el);
        el.querySelector('[data-notice-close]').addEventListener('click', () => dismiss(el));
        el.querySelector('a').addEventListener('click', () => dismiss(el));

        window.requestAnimationFrame(() => el.classList.add('on'));

        try {
            window.sessionStorage.setItem(SEEN, '1');
        } catch {
            /* storage unavailable — the in-memory `fired` flag still holds */
        }
    }

    function maybeFire() {
        if (fired || !hasScrolled) return;
        if (Date.now() - started < DWELL) return;
        // Never interrupt someone who is already writing to us.
        if (document.activeElement && document.activeElement.closest('#system-chat')) return;
        fired = true;
        build();
    }

    window.addEventListener(
        'scroll',
        () => {
            if (window.scrollY > window.innerHeight * 0.9) hasScrolled = true;
        },
        { passive: true },
    );

    const tick = window.setInterval(() => {
        if (document.hidden) return; // a backgrounded tab is not reading
        maybeFire();
        if (fired) window.clearInterval(tick);
    }, 5000);
})();
