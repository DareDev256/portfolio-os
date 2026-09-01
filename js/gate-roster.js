/* The other six gates, on a phone.
 *
 * THE PROBLEM, from a blind mobile critic judging against rauno.me, leerob.com
 * and brittanychiang.com: "a phone reader sees exactly one case study." The
 * cycler auto-advances every 9 seconds, which is fine on a desktop where the
 * page is being read, and useless on a phone where the reader scrolls past in
 * three. The tab rail carries all seven names now, but nothing tells a thumb
 * that tapping one does anything.
 *
 * The critic's fix was to stack all the gates vertically. That was rejected on
 * arithmetic: the page is already 8.9 phone screens, and seven expanded gates
 * would roughly double it — trading "one proof visible" for "no one reaches the
 * contact section". The reader who bounces at screen 14 is not better served
 * than the one who bounces at screen 9.
 *
 * So: one compact row per remaining gate, name plus its single hardest number,
 * pulled from the SAME <template> the expanded gate renders from. One source,
 * so the roster cannot drift from the case study the way a hand-written summary
 * would. Tapping a row opens that gate in the cycler above.
 *
 * Desktop is untouched — the cycler already works there and the reader has the
 * patience the format assumes.
 */
const NARROW = '(max-width: 720px)';

/* Figures inside a <template> are NOT rendered, so a `data-fig` span still holds
 * the em-dash placeholder that system-figures.js replaces at runtime. Reading
 * the template naively produced four rows reading "— GITHUB STARS", which looks
 * broken rather than modest. Resolve them the same way the page does. */
let FIGURES = null;

function hardestFigure(tpl) {
    /* The FIRST figure is the one the gate leads with, and the copy is written so
     * that it is the strongest. Not "the biggest number" — 0 PAYOUT INCIDENTS
     * outranks everything else on BetMetrics and a max() would throw it away. */
    const n = tpl.content.querySelector('.figs .n');
    const cap = tpl.content.querySelector('.figs .cap');
    if (!n || !cap) return null;

    let value = n.textContent.trim();
    const key = n.getAttribute('data-fig');
    if (key && FIGURES) value = String(FIGURES[key] ?? value);

    // Still a placeholder — a row saying "— MODULES" claims nothing and costs a
    // line. Drop the figure and keep the name rather than shipping a dash.
    if (!value || value === '\u2014' || value === '-') return null;
    return { n: value, cap: cap.textContent.trim() };
}

/* `window.matchMedia` is not universal — jsdom omits it entirely, and calling it
 * from a default parameter meant this module THREW ON IMPORT there, taking the
 * whole page's module graph with it in any environment that lacks it. Resolve it
 * defensively and fall back to "not narrow", so the worst case is the desktop
 * cycler alone rather than a blank section. */
function narrowQuery() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return { matches: false, addEventListener() {} };
    }
    return window.matchMedia(NARROW);
}

export function initGateRoster(doc = document, mq = narrowQuery()) {
    const root = doc.getElementById('gate-cycler');
    const host = doc.querySelector('[data-gate-roster]');
    if (!root || !host) return null;

    const tabs = Array.prototype.slice.call(root.querySelectorAll('[data-gate-tab]'));
    const templates = Array.prototype.slice.call(root.querySelectorAll('template[data-gate]'));
    if (tabs.length !== templates.length || templates.length < 2) return null;

    function paint() {
        if (!mq.matches) { host.hidden = true; host.replaceChildren(); return null; }

        const active = tabs.findIndex((t) => t.classList.contains('on'));
        const rows = templates.map((tpl, i) => ({ tpl, i }))
            .filter(({ i }) => i !== active)
            .map(({ tpl, i }) => {
                const name = (tabs[i].querySelector('.nm') || {}).textContent || `Gate ${i + 1}`;
                const fig = hardestFigure(tpl);
                const li = doc.createElement('li');
                li.className = 'roster-row';
                const b = doc.createElement('button');
                b.type = 'button';
                b.className = 'roster-btn';
                b.innerHTML = `<span class="roster-nm">${name.trim()}</span>`
                    + (fig ? `<span class="roster-fig"><b>${fig.n}</b> ${fig.cap}</span>` : '');
                // Drive the real cycler rather than duplicating its logic — one
                // renderer, so the roster can never show a gate the stage cannot.
                b.addEventListener('click', () => {
                    // Switch the gate FIRST. The scroll is a courtesy; if it
                    // throws (jsdom has no scrollIntoView, and neither do some
                    // embedded webviews) the gate must already have changed.
                    tabs[i].click();
                    if (typeof root.scrollIntoView === 'function') {
                        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
                li.append(b);
                return li;
            });

        const ul = doc.createElement('ul');
        ul.className = 'roster-list';
        ul.append(...rows);
        host.replaceChildren(ul);
        host.hidden = false;
        return rows.length;
    }

    paint();

    /* Then resolve the runtime figures and repaint. Deliberately AFTER the first
     * paint, not instead of it: the roster must render with names alone if the
     * figures never arrive, because a phone reader seeing six project names
     * still beats seeing one case study. */
    fetch('/data/figures.json')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
            if (!d) return;
            FIGURES = { ...(d.figures || {}) };
            for (const [k, m] of Object.entries(d.manual || {})) FIGURES[k] = m.value;
            paint();
        })
        .catch(() => { /* names-only is a fine outcome; never break the roster for a figure */ });

    // Repaint when the cycler advances, so the roster never lists the gate that
    // is currently expanded above it.
    tabs.forEach((t) => t.addEventListener('click', () => setTimeout(paint, 50)));
    if (mq.addEventListener) mq.addEventListener('change', paint);
    return paint;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') initGateRoster();
