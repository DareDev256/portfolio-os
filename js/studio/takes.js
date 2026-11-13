/* takes.js: each station's real takes, read from stations.json (4.68.0).
 *
 * A take is one commit (tools/build-stations.mjs counts them from git on the
 * Mac that holds the repos, once a day). Every station screen gets a 14-day
 * strip of its takes and the newest take's age; the slate's TAKE field is the
 * real number of the newest take; a tally lamp on the monitor burns red while
 * that station has a take from the last 24 hours. A station the file does not
 * carry (101 Films is footage, not a repo) keeps the Monitor's own label: no
 * strip is better than a strip of invented zeros.
 */

export const STATIONS_URL = '/data/stations.json';
export const ROLLING_HOURS = 24;
const TZ = 'America/Toronto';
/** 1191 -> '1,191'. */
export const num = (n) => Number(n).toLocaleString('en-US');

/** The takes for a crew member: its station, the whole registry for the graph, or null. */
export function takesFor(stations, c) {
    if (!stations || !c) return null;
    if (c.kind === 'graph') {
        const a = stations.all;
        return a?.days?.length ? { all: true, repos: a.active, scanned: a.scanned, inWindow: a.inWindow, days: a.days, lastAt: null } : null;
    }
    const s = stations.stations?.[c.id];
    return s?.days?.length ? s : null;
}

/** '42M AGO', '3H AGO', '6D AGO'. Null for a missing or unreadable time. */
export function ageLabel(iso, now = Date.now()) {
    const t = Date.parse(iso);
    if (!iso || Number.isNaN(t)) return null;
    const m = Math.max(0, Math.floor((now - t) / 6e4));
    if (m < 60) return `${Math.max(1, m)}M AGO`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h}H AGO`;
    return `${Math.floor(h / 24)}D AGO`;
}

/** True while the station's newest take is under ROLLING_HOURS old. */
export function rolling(st, now = Date.now()) {
    const t = Date.parse(st?.lastAt);
    return !Number.isNaN(t) && now - t >= -5 * 6e4 && now - t < ROLLING_HOURS * 36e5;
}

/** The lower-third line. */
export function takesLine(st, windowDays = 14, now = Date.now()) {
    if (!st) return null;
    const n = st.inWindow;
    const word = n === 1 ? 'take' : 'takes';
    if (st.all) return `${num(n)} ${word} across ${st.repos} repos in ${windowDays} days`;
    const age = ageLabel(st.lastAt, now);
    return `${num(n)} ${word} in ${windowDays} days${age ? ` · last ${age.toLowerCase()}` : ''}`;
}

/** The slate's DATE: the newest take's day, '13 NOV 26', in Toronto time. */
export function takeDate(iso) {
    const t = new Date(iso);
    if (!iso || Number.isNaN(t.getTime())) return null;
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', year: '2-digit' }).formatToParts(t).map((x) => [x.type, x.value]));
    return `${p.day} ${p.month.toUpperCase().slice(0, 3)} ${p.year}`;
}

/** Words for the strip, for a screen reader. */
export function stripLabel(st, windowDays = 14, now = Date.now()) {
    if (!st) return '';
    const per = st.days.map((d) => String(d)).join(', ');
    const head = st.all ? `${num(st.inWindow)} takes across ${st.repos} repositories` : `${num(st.inWindow)} takes`;
    const age = !st.all && ageLabel(st.lastAt, now);
    return `${head} in the last ${windowDays} days, oldest day first: ${per}.${age ? ` The newest landed ${age.toLowerCase()}.` : ''}`;
}

/** Bar heights for the strip: 0..1, empty days at 0, the busiest day at 1. */
export function stripHeights(days) {
    const max = Math.max(0, ...(days || []));
    return (days || []).map((d) => (max ? d / max : 0));
}

/** Draw the strip into a 2D context. Empty days are a faint tick so the fortnight still reads. */
export function drawStrip(x, days, { left, top, width, height, color }) {
    const hs = stripHeights(days);
    const n = hs.length || 1;
    const gap = 2;
    const bw = (width - gap * (n - 1)) / n;
    hs.forEach((k, i) => {
        const bx = left + i * (bw + gap);
        if (k > 0) {
            const bh = Math.max(3, Math.round(height * k));
            x.fillStyle = color;
            x.fillRect(bx, top + height - bh, bw, bh);
        } else {
            x.fillStyle = 'rgba(255,255,255,.2)';
            x.fillRect(bx, top + height - 2, bw, 2);
        }
    });
}
