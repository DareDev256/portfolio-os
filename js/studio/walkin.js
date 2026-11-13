/* walkin.js: the establishing pass on a first visit (4.67.0).
 *
 * The lab sits stage left, the Vegapunk board on the back wall and the throne
 * back right: on a phone none of them is in the opening frame, and the lab
 * hides behind the crew from every angle the wide orbit allows. So on a first
 * visit the camera flies real shots instead: the lab, the board, the throne,
 * then home to the wide shot, while the hint pill names what is on screen.
 * Any touch, key or wheel hands the camera back at once. Reduced motion never
 * gets it; ?walkin always does.
 *
 * A key names a shot and a distance; the page turns that into a camera
 * position and a look point (see shotFor in studio.js), so the pass follows
 * the props wherever layout.js puts them.
 */

export const WALKIN_KEY = 'studio.walkin';
export const WALKIN_AGAIN_MS = 30 * 864e5;
export const SHOTS = ['robot', 'poster', 'throne', 'home'];

export const WALKIN = [
    { t: 0, shot: 'robot', dist: 5.4, cap: 'Stage left · the robot lab' },
    { t: 1.8, shot: 'robot', dist: 4.7 },
    { t: 3.3, shot: 'poster', dist: 5.5, cap: 'Back wall · Dr. Vegapunk' },
    { t: 4.2, shot: 'poster', dist: 5.0 },
    { t: 5.8, shot: 'throne', dist: 7.6, cap: 'Back right · the throne' },
    { t: 7.0, shot: 'throne', dist: 6.8, cap: null },
    { t: 8.6, shot: 'home', cap: null },
];

const smooth = (x) => x * x * (3 - 2 * x);
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/**
 * The pass at time t: { pos, look, cap, done }. shotFor(name, dist) returns
 * { pos: [x,y,z], look: [x,y,z] }. cap is the caption in force (null = the normal hint).
 */
export function walkinPose(t, shotFor, keys = WALKIN) {
    const last = keys[keys.length - 1];
    if (t >= last.t) {
        const s = shotFor(last.shot, last.dist);
        return { pos: s.pos, look: s.look, cap: null, done: true };
    }
    let cap = null;
    for (const k of keys) if (k.t <= t && 'cap' in k) cap = k.cap;
    if (t <= keys[0].t) {
        const s = shotFor(keys[0].shot, keys[0].dist);
        return { pos: s.pos, look: s.look, cap: keys[0].cap ?? null, done: false };
    }
    let i = 0;
    while (keys[i + 1].t < t) i += 1;
    const a = keys[i];
    const b = keys[i + 1];
    const k = smooth((t - a.t) / (b.t - a.t));
    const sa = shotFor(a.shot, a.dist);
    const sb = shotFor(b.shot, b.dist);
    return { pos: mix(sa.pos, sb.pos, k), look: mix(sa.look, sb.look, k), cap, done: false };
}

/** Whether this visit gets the pass. seenAt is the stored timestamp (or null). */
export function shouldWalkIn({ reduce, search = '', seenAt = null, now = Date.now() }) {
    if (/[?&]walkin(=|&|$)/.test(search)) return true;
    if (reduce) return false;
    const seen = Number(seenAt);
    return !(Number.isFinite(seen) && seen > 0 && now - seen < WALKIN_AGAIN_MS);
}
