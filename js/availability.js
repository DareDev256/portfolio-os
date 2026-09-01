/* The next times James can actually take a call.
 *
 * NOT a Calendly embed. Embedding it inline needs five CSP directives widened
 * and a third-party script with DOM access, on a page whose own argument is that
 * it ships no unsafe-inline in production. So the page renders availability as
 * its own content from a generated file — same contract as every other figure
 * here — and hands the actual booking to Calendly by link.
 *
 * The data is built by tools/build-availability.mjs, which refuses to write
 * anything if it cannot read the source. So a failure here means STALE, never
 * WRONG — and stale is rendered as stale rather than quietly presented as live.
 */
const SRC = '/data/availability.json';
/* Calendly is the source of truth at the moment of booking: it is connected to
 * the same calendar and will refuse a slot that has since gone. This surface
 * exists to answer "when is he actually around", not to hold a lock. */
const STALE_HOURS = 30;

function fmt(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return m ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

function render(root, data) {
    const ageH = (Date.now() - new Date(data.generatedAt).getTime()) / 3600000;
    const stale = !(ageH < STALE_HOURS);

    const open = data.days.filter((d) => d.slots.length);
    if (!open.length) {
        root.hidden = false;
        root.innerHTML = '<p class="avail-note">No open windows in the next three weeks. '
            + `<a href="${data.bookingUrl}" rel="noopener">Ask anyway</a> — I will make room for the right conversation.</p>`;
        return;
    }

    const rows = open.slice(0, 5).map((d) => {
        const when = new Date(`${d.date}T12:00:00`);
        const label = when.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
        const chips = d.slots.map((s) => `<span class="avail-slot">${fmt(s)}</span>`).join('');
        return `<li class="avail-row"><span class="avail-day">${label}</span><span class="avail-slots">${chips}</span></li>`;
    }).join('');

    root.hidden = false;
    root.innerHTML = `
        <div class="avail-head">
            <span class="label">NEXT OPEN</span>
            <span class="stamp"${stale ? ' data-state="stale"' : ''}>${
                stale ? `CHECKED ${Math.round(ageH / 24)} DAYS AGO` : 'ALL TIMES EASTERN'
            }</span>
        </div>
        <ul class="avail-list">${rows}</ul>
        <p class="avail-note">
            ${data.slotMinutes}-minute slots, generated from real commitments — afternoons,
            because mornings are production time.
            <a href="${data.bookingUrl}" rel="noopener">Pick one →</a>
        </p>`;
}

export function initAvailability(doc = document) {
    const root = doc.querySelector('[data-availability]');
    if (!root) return null;
    return fetch(SRC)
        .then((r) => { if (!r.ok) throw new Error(`${SRC} -> ${r.status}`); return r.json(); })
        .then((data) => { render(root, data); return data; })
        .catch(() => {
            /* Stay hidden. The BOOK 30 MINUTES button beside this already works,
             * so a failed fetch should cost the visitor nothing — an empty panel
             * with an apology in it is worse than no panel. */
            root.hidden = true;
            return null;
        });
}

if (typeof document !== 'undefined') initAvailability();
