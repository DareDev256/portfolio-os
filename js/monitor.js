/* monitor.js: the video village that is the homepage (4.62.0).
 *
 * Three jobs:
 *   1. The router. Four views (monitor, crew, reel, call), one per tab, and
 *      none of them scrolls. Old anchors from the long page (#gates, #system,
 *      #play, #contact) still land somewhere sensible.
 *   2. The switcher. Sixteen sources, one button each. A cut swaps what plays
 *      on the program monitor, the HUD, and which take sits on the slate.
 *   3. The agent feed. Source 4 replays /data/activity.json, which
 *      tools/build-activity.mjs writes from the jobs' own logs. It shows the
 *      file's age, so an old read is never presented as a live one.
 *
 * Every source's words and links are in index.html, not here, so the page
 * reads completely with scripting off. This file only decides what is on air.
 */

const VIEWS = ['monitor', 'crew', 'reel', 'call'];
const LEGACY = { gates: 'monitor', work: 'monitor', system: 'monitor', play: 'monitor', contact: 'call', book: 'call' };
const LEGACY_SOURCE = { system: 'registry', play: 'manyroads' };
const HUD_PREFIX = { rec: 'REC ', log: 'LOG ', still: 'STILL ', play: '▶ ', graph: 'LIVE · ', none: '' };
const ACTIVITY = '/data/activity.json';
/* build-activity reads a 36 hour window. Past that the file describes a day
 * that is over, so the feed says how old it is instead of passing as current. */
const ACTIVITY_STALE_HOURS = 36;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

export function hudDate(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '';
    return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

/* The agent feed's closing line. Exported so the stale branch is testable
 * without a clock: a feed that cannot admit its age is the bug this page has
 * shipped before (the "Ran without me" panel froze on 1 Sep for two months). */
export function activitySummary(data, now = Date.now()) {
    const ageH = (now - new Date(data.generatedAt).getTime()) / 3600000;
    const ran = `${data.ranInWindow} of ${data.jobsWatched} watched jobs wrote a log in ${data.windowHours} h`;
    if (!Number.isFinite(ageH)) return { text: `${ran}, read at an unrecorded time`, stale: true };
    if (ageH < ACTIVITY_STALE_HOURS) return { text: ran, stale: false };
    const age = ageH < 48 ? `${Math.round(ageH)} hours` : `${Math.round(ageH / 24)} days`;
    return { text: `${ran}. Read ${age} ago, not since`, stale: true };
}

export function routeFor(hash, sourceIds = []) {
    const raw = (hash || '').replace(/^#/, '');
    const head = raw.split('/')[0];
    if (VIEWS.includes(head)) return { view: head, source: null };
    if (sourceIds.includes(head)) return { view: 'monitor', source: head };
    if (LEGACY[head]) return { view: LEGACY[head], source: LEGACY_SOURCE[head] ?? null };
    return { view: 'monitor', source: null };
}

export function initMonitor(doc = document, win = window) {
    const $ = (id) => doc.getElementById(id);
    const screen = $('screen');
    const pgm = $('pgm');
    const switcher = $('switcher');
    if (!screen || !pgm || !switcher) return null;

    const still = $('still');
    const logfeed = $('logfeed');
    const graphfeed = $('graphfeed');
    const nosig = $('nosignal');
    const slate = $('slate');
    const hold = $('hold');
    const buttons = [...switcher.querySelectorAll('[data-src]')];
    const ids = buttons.map((b) => b.dataset.src);
    const reduce = !!win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let current = null;
    let take = 0;
    let clipIndex = 0;
    let logTimer = null;
    // Reduced motion starts on hold: the poster frame is on air until tapped.
    let held = reduce;
    let view = 'monitor';

    const play = (v) => {
        try {
            const p = v.play();
            if (p && p.catch) p.catch(() => {});
        } catch { /* jsdom and very old engines */ }
    };
    const pause = (v) => { try { v.pause(); } catch { /* not loaded */ } };

    function clipsOf(b) { return (b.dataset.clips || '').split(/\s+/).filter(Boolean); }
    function tagsOf(b) { return (b.dataset.tags || '').split('|').filter(Boolean); }

    function camLabel(b, i) {
        const n = buttons.indexOf(b) + 1;
        const tags = tagsOf(b);
        const tag = tags.length ? ` · ${tags[i % tags.length]}` : '';
        return `${n} · ${b.dataset.scene.toUpperCase()}${tag}`;
    }

    function stopClip() {
        pause(pgm);
        pgm.removeAttribute('src');
        try { pgm.load(); } catch { /* jsdom */ }
        pgm.hidden = true;
    }

    function playClip(b) {
        const clips = clipsOf(b);
        clipIndex = 0;
        pgm.hidden = false;
        pgm.loop = clips.length === 1;
        pgm.poster = b.dataset.poster || '';
        pgm.src = clips[0];
        if (!held && view === 'monitor') play(pgm);
    }

    pgm.addEventListener('ended', () => {
        if (!current) return;
        const clips = clipsOf(current);
        if (clips.length < 2) return;
        clipIndex = (clipIndex + 1) % clips.length;
        pgm.src = clips[clipIndex];
        $('hudCam').textContent = camLabel(current, clipIndex);
        play(pgm);
    });

    /* ---------- the agent feed ---------- */
    let activity = null;
    const activityReady = () => {
        if (!activity) {
            activity = fetch(ACTIVITY)
                .then((r) => { if (!r.ok) throw new Error(`${ACTIVITY} -> ${r.status}`); return r.json(); })
                .catch(() => null);
        }
        return activity;
    };

    function line(cells) {
        const d = doc.createElement('div');
        d.className = 'ln';
        cells.forEach((c) => {
            const s = doc.createElement('span');
            s.textContent = c;
            d.appendChild(s);
        });
        return d;
    }

    function runLog(b) {
        logfeed.replaceChildren();
        logfeed.hidden = false;
        activityReady().then((data) => {
            if (current !== b) return;
            const rows = [];
            if (!data) {
                // A panel that cannot read its source must not look like a quiet day.
                const r = line(['—', 'The log could not be read from here.']);
                r.classList.add('sum');
                rows.push(r);
                $('hudRec').textContent = 'LOG UNREADABLE';
            } else {
                const events = Array.isArray(data.events) ? data.events.slice(0, 5) : [];
                if (!events.length) rows.push(line(['—', '', `Nothing ran in the last ${data.windowHours} hours. That is the measurement.`]));
                events.forEach((e) => rows.push(line([String(e.time ?? '—'), String(e.id ?? ''), String(e.label ?? 'ran')])));
                const sum = activitySummary(data);
                const s = line([`${data.windowHours} h`, sum.text]);
                s.classList.add('sum');
                if (sum.stale) s.dataset.state = 'stale';
                rows.push(s);
                $('hudRec').textContent = `${HUD_PREFIX.log}${hudDate(data.generatedAt)}`;
                $('sDate').textContent = hudDate(data.generatedAt);
            }
            rows.forEach((r) => logfeed.appendChild(r));
            if (reduce || held) { rows.forEach((r) => r.classList.add('on')); return; }
            let i = 0;
            (function next() {
                if (current !== b) return;
                if (i < rows.length) {
                    rows[i].classList.add('on');
                    i += 1;
                    logTimer = win.setTimeout(next, i === rows.length ? 4200 : 650);
                } else {
                    rows.forEach((r) => r.classList.remove('on'));
                    i = 0;
                    logTimer = win.setTimeout(next, 500);
                }
            })();
        });
    }

    function hideLayers() {
        win.clearTimeout(logTimer);
        logfeed.hidden = true;
        graphfeed.hidden = true;
        nosig.hidden = true;
        still.hidden = true;
        still.classList.remove('drift');
    }

    function renderHold() {
        hold.setAttribute('aria-pressed', String(held));
        hold.setAttribute('aria-label', held ? 'Play the program feed' : 'Pause the program feed');
        const tally = $('hudTally');
        tally.className = `tally ${held ? 'held' : current ? current.dataset.kind : ''}`;
        const pgmLabel = $('bezelPgm');
        pgmLabel.textContent = held ? '◼ HOLD' : '● PGM';
        if (held) pgmLabel.dataset.held = ''; else delete pgmLabel.dataset.held;
        screen.classList.toggle('held', held);
        still.style.animationPlayState = held ? 'paused' : '';
    }

    function cut(id, { initial = false, focus = false } = {}) {
        const b = buttons.find((x) => x.dataset.src === id);
        if (!b || (current === b && !initial)) return;
        current = b;
        take += 1;
        const kind = b.dataset.kind;
        const n = buttons.indexOf(b) + 1;

        buttons.forEach((x) => {
            const on = x === b;
            x.setAttribute('aria-selected', String(on));
            x.tabIndex = on ? 0 : -1;
        });
        if (focus) b.focus();
        doc.querySelectorAll('.take').forEach((t) => { t.hidden = t.id !== `take-${id}`; });

        if (!reduce && !initial) {
            screen.classList.add('cutting');
            win.setTimeout(() => screen.classList.remove('cutting'), 110);
        }
        hideLayers();
        screen.dataset.kind = kind;
        if (kind === 'rec' || kind === 'play') playClip(b);
        else {
            stopClip();
            if (kind === 'log') runLog(b);
            else if (kind === 'graph') graphfeed.hidden = false;
            else if (kind === 'still') {
                still.src = b.dataset.still;
                still.hidden = false;
                void still.offsetWidth;
                still.classList.add('drift');
            } else nosig.hidden = false;
        }

        $('hudCam').textContent = camLabel(b, 0);
        $('hudRec').textContent = `${HUD_PREFIX[kind] ?? ''}${b.dataset.date || ''}`;
        $('hudFmt').textContent = kind === 'graph' || kind === 'log' ? 'DATA' : '16:9 · 24P';
        $('bezelSrc').textContent = `SRC ${pad(n)}`;
        $('sScene').textContent = b.dataset.scene;
        $('sTake').textContent = pad(take);
        $('sDate').textContent = b.dataset.date || '';
        renderHold();

        if (!reduce && !initial) {
            slate.classList.remove('clap');
            void slate.offsetWidth;
            slate.classList.add('clap');
        }
    }

    buttons.forEach((b) => b.addEventListener('click', () => cut(b.dataset.src)));

    /* Arrow keys move along the switcher and cut as they go, the way a tablist
     * with automatic activation behaves. Home and End jump to the ends. */
    switcher.addEventListener('keydown', (e) => {
        const at = buttons.indexOf(doc.activeElement);
        if (at === -1) return;
        const cols = (win.getComputedStyle(switcher.querySelector('.sw-grid')).gridTemplateColumns || '').split(' ').filter(Boolean).length || 6;
        const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
        let to = null;
        if (step) to = Math.min(buttons.length - 1, Math.max(0, at + step));
        if (e.key === 'Home') to = 0;
        if (e.key === 'End') to = buttons.length - 1;
        if (to === null) return;
        e.preventDefault();
        cut(buttons[to].dataset.src, { focus: true });
    });

    hold.addEventListener('click', () => {
        held = !held;
        if (current && (current.dataset.kind === 'rec' || current.dataset.kind === 'play')) {
            if (held) pause(pgm); else play(pgm);
        }
        if (!held && current && current.dataset.kind === 'log') runLog(current);
        renderHold();
    });

    /* Time-of-day timecode at 24 frames, like a slate synced to the clock. */
    const tc = $('tc');
    win.setInterval(() => {
        if (doc.hidden || view !== 'monitor' || held) return;
        const d = new Date();
        tc.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${pad(Math.floor((d.getMilliseconds() / 1000) * 24))}`;
    }, 1000 / 24);

    /* ---------- router ---------- */
    function route() {
        const r = routeFor(win.location.hash, ids);
        view = r.view;
        VIEWS.forEach((v) => { const s = $(v); if (s) s.hidden = v !== view; });
        doc.body.dataset.view = view;
        doc.querySelectorAll('.tabs a').forEach((a) => {
            if (a.getAttribute('href') === `#${view}`) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
        if (r.source) cut(r.source);
        if (view === 'monitor') { if (pgm.getAttribute('src') && !held) play(pgm); } else pause(pgm);
        doc.querySelectorAll('#reel video').forEach((v) => {
            if (view === 'reel') {
                if (!v.getAttribute('src')) v.src = v.dataset.lazy;
                if (!reduce) play(v);
            } else pause(v);
        });
        win.scrollTo(0, 0);
    }
    win.addEventListener('hashchange', route);

    doc.addEventListener('visibilitychange', () => {
        if (doc.hidden) pause(pgm);
        else if (view === 'monitor' && !held && pgm.getAttribute('src')) play(pgm);
    });

    /* ---------- call view ---------- */
    const copy = $('copy');
    if (copy) {
        copy.addEventListener('click', () => {
            const done = (label) => { copy.textContent = label; };
            const select = () => {
                const r = doc.createRange();
                r.selectNodeContents($('email'));
                const s = win.getSelection();
                s.removeAllRanges();
                s.addRange(r);
                done('Selected');
            };
            try { win.navigator.clipboard.writeText('dev@jamesdare.com').then(() => done('Copied'), select); } catch { select(); }
        });
    }

    const ask = $('ask');
    if (ask && typeof ask.showModal === 'function') {
        doc.querySelectorAll('[data-open-chat]').forEach((b) => b.addEventListener('click', () => {
            ask.showModal();
            const input = ask.querySelector('[data-chat-input]');
            if (input && win.matchMedia && win.matchMedia('(min-width: 980px)').matches) input.focus();
        }));
        doc.querySelectorAll('[data-close-chat]').forEach((b) => b.addEventListener('click', () => ask.close()));
        // A tap on the backdrop closes the sheet; the dialog element itself is
        // the click target only outside its content box.
        // An in-page link inside a reply (SEE THE WORK -> #monitor) must also
        // close the sheet, or the view changes behind a dialog that stays up.
        ask.addEventListener('click', (e) => {
            if (e.target === ask || (e.target.closest && e.target.closest('a[href^="#"]'))) ask.close();
        });
    }

    doc.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

    const initial = routeFor(win.location.hash, ids);
    cut(initial.source || 'fcp', { initial: true });
    route();

    return { cut, route, get current() { return current && current.dataset.src; } };
}

if (typeof document !== 'undefined' && document.getElementById('screen')) initMonitor();
