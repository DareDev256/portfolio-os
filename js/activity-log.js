/* activity-log.js — render what actually ran unattended.
 *
 * The SNAPSHOT LOG used to be four hand-typed rows with frozen clock times. It
 * was the page's strongest evidence for "I build systems that run without me",
 * and it was the only claim on the page that nothing measured. A visitor
 * returning the next day saw the same four lines at the same four times.
 *
 * tools/build-activity.mjs now reads eight launchd jobs' own logs and writes
 * what it can actually see. This renders that.
 *
 * The empty case is the important one. If nothing ran, the panel says nothing
 * ran — it does NOT fall back to the last known good list, and it does not hide
 * itself. A quiet night is a true thing to report; a page that only ever shows
 * activity is back to being a mockup.
 */

const SRC = '/data/activity.json';

fetch(SRC)
    .then((r) => {
        if (!r.ok) throw new Error(`${SRC} -> ${r.status}`);
        return r.json();
    })
    .then((data) => {
        const list = document.querySelector('[data-activity-log]');
        const count = document.querySelector('[data-activity-count]');
        const events = Array.isArray(data.events) ? data.events : [];

        if (count) {
            count.textContent = `${data.ranInWindow} of ${data.jobsWatched} ran · ${data.windowHours}h`;
            count.setAttribute(
                'title',
                data.definitions?.ranInWindow ?? 'jobs that wrote to their own log in the window'
            );
        }
        if (!list) return;

        if (events.length === 0) {
            // Deliberately rendered, not hidden. "Nothing ran" is a measurement.
            list.innerHTML =
                '<div class="rv d1"><time>—</time><div><div class="what">Nothing ran in the last ' +
                `${data.windowHours} hours</div><div class="src">that is the measurement, not a gap</div></div></div>`;
            return;
        }

        list.innerHTML = events
            .map((e, i) => {
                const t = String(e.time ?? '—');
                const what = String(e.label ?? e.id ?? 'ran');
                const src = String(e.source ?? e.id ?? '');
                const ago =
                    typeof e.ageMinutes === 'number'
                        ? e.ageMinutes < 90
                            ? `${e.ageMinutes} minutes ago`
                            : `${Math.round(e.ageMinutes / 60)} hours ago`
                        : '';
                // textContent-style escaping without innerHTML risk on the values.
                const esc = (s) =>
                    s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
                return (
                    `<div class="rv d${Math.min(i + 1, 5)}">` +
                    `<time title="${esc(ago)}">${esc(t)}</time>` +
                    `<div><div class="what">${esc(what)}</div>` +
                    `<div class="src">${esc(src)}</div></div></div>`
                );
            })
            .join('');
    })
    .catch((err) => {
        // Leave the markup's own fallback text in place rather than inventing a
        // log. A panel that cannot read its source must not look like a quiet day.
        const list = document.querySelector('[data-activity-log]');
        if (list) {
            list.innerHTML =
                '<div class="rv d1"><time>—</time><div><div class="what">Could not read the activity log</div>' +
                '<div class="src">this is a failed check, not a quiet day</div></div></div>';
        }
        console.warn('[activity-log]', err.message);
    });
