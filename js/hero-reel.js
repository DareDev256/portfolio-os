/* Hero reel — the landing page's background is James's own work, alternating the
 * two lanes the page is arguing for: a music video he DIRECTED, then a site he
 * BUILT, three of each.
 *
 * The site clips are captured from the live sites by a frame-stepped Playwright
 * pass (never recordVideo, which only scales DOWN), reusing the shot list and the
 * driftIn easing from ~/dev/daredev-reel — the reel he cut for Instagram. Two of
 * those three sites carry track titles that cannot appear on a hiring page, so the
 * scroll beats are pinned to specific ranges. That is recorded in the capture
 * script, not here, but do not re-derive those fractions casually.
 *
 * Each plate carries a poster (1280px still) and, on capable clients, a 6-second
 * muted clip that fades in over its own poster. The poster is ALWAYS what paints
 * first; video is attached well after load so it can never become the LCP element
 * or delay it.
 *
 * Motion note: the crossfade is a settle, not a drift. A slow ken-burns pan would
 * pull this surface toward the tdotssolutionsz motion signature, which the
 * divergence record in css/system.css exists to prevent. See that header.
 */

(function () {
    'use strict';

    const stack = document.getElementById('plate-stack');
    if (!stack) return;

    const plates = Array.prototype.slice.call(stack.querySelectorAll('.plate'));
    if (plates.length < 2) return;

    // The label changes with the lane: DIRECTED for a film, BUILT for a site.
    const credit = {
        kind: document.querySelector('[data-reel-kind]'),
        who: document.querySelector('[data-reel-who]'),
        what: document.querySelector('[data-reel-what]'),
        meta: document.querySelector('[data-reel-meta]'),
    };

    const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
    const reduced = mq('(prefers-reduced-motion: reduce)');

    const conn = navigator.connection || {};
    const thin = Boolean(conn.saveData) || /(^|-)2g$/.test(conn.effectiveType || '');

    /* Video anywhere the connection can carry it.
     *
     * This used to also require (min-width: 900px) and (hover: hover), which
     * meant every phone fell through to stills — the reel just sat there as a
     * slideshow on the device most visitors actually arrive on. Width and
     * pointer type say nothing about whether video is wanted; they were a proxy
     * for "probably metered", and Save-Data plus effectiveType measure that
     * directly.
     *
     * Cost is bounded already: only the current plate and the next one are ever
     * attached, so this is two clips in flight, not ten — and only the current
     * one pulls a full body. See attachVideo. */
    const allowVideo = !reduced && !thin;

    const STILL_HOLD = 5200;

    /* Adaptive exposure.
     * Six clips shot by six different people land anywhere from a night car
     * interior to a white-wall studio: measured across the panel area, mean luma
     * ran 36 to 111. A single hardcoded brightness cannot serve both — it either
     * muds the dark ones or lets the bright ones wash out the status panel and
     * flatten the headline. So each plate is metered off its own poster and given
     * a personal exposure factor. Darkening only; brightening a dark frame just
     * amplifies its compression noise.
     * This runs for reduced-motion visitors too — they still get a still, and a
     * blown-out still is exactly as bad. */
    const TARGET_LUMA = 48;
    const sampler = document.createElement('canvas');
    sampler.width = 32;
    sampler.height = 18;
    const sctx = sampler.getContext && sampler.getContext('2d', { willReadFrequently: true });

    function meanLuma(source) {
        if (!sctx) return null;
        try {
            sctx.drawImage(source, 0, 0, sampler.width, sampler.height);
            const data = sctx.getImageData(0, 0, sampler.width, sampler.height).data;
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
                sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            }
            return sum / (data.length / 4);
        } catch {
            return null;
        }
    }

    function calibrate(plate) {
        if (plate.dataset.exposed) return;
        const img = plate.querySelector('img');
        if (!img || !img.complete || !img.naturalWidth) return;
        const luma = meanLuma(img);
        if (!luma) return;
        // Floor 0.20, not 0.34: a light editorial site (nirvanadeshaunbuilds is
        // cream below the fold) needs far more pull-down than any film frame did.
        const factor = Math.min(1, Math.max(0.2, TARGET_LUMA / luma));
        plate.style.setProperty('--plate-exposure', factor.toFixed(3));
        plate.dataset.exposed = '1';
    }

    function calibrateAll() {
        plates.forEach((plate) => {
            calibrate(plate);
            const img = plate.querySelector('img');
            if (img && !plate.dataset.exposed) {
                img.addEventListener('load', () => calibrate(plate), { once: true });
            }
        });
    }

    calibrateAll();

    let index = 0;
    let timer = null;
    let visible = true;

    function setCredit(plate) {
        if (credit.kind) credit.kind.textContent = plate.dataset.kind || '';
        if (credit.who) credit.who.textContent = plate.dataset.who || '';
        if (credit.what) credit.what.textContent = plate.dataset.what || '';
        if (credit.meta) credit.meta.textContent = plate.dataset.meta || '';
    }

    /* `eager` decides preload, and it is the difference between 3.2MB and 2.7MB
     * on first load.
     *
     * Both the current plate and the look-ahead used to attach at preload
     * 'auto', so the reel pulled TWO full clip bodies — 986KB + 505KB — before
     * the visitor had scrolled or clicked anything. The two-in-flight budget
     * described above was right about the COUNT and silent about the BYTES.
     *
     * The look-ahead does not need a body yet, only enough to start instantly
     * when it becomes current, so it attaches at 'metadata' and is upgraded in
     * show(). A clip that has not finished buffering when its turn arrives
     * degrades to its poster via the existing `playing` listener, which is the
     * same graceful path a stalled clip already took. */
    function attachVideo(plate, eager) {
        const src = plate.dataset.clip;
        if (!src || !allowVideo || plate.querySelector('video')) return null;

        const video = document.createElement('video');
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.preload = eager ? 'auto' : 'metadata';
        video.src = src;
        // Only reveal the clip once frames are actually running, so a stalled or
        // blocked video degrades to its poster instead of flashing black.
        video.addEventListener('playing', () => video.classList.add('on'), { once: true });
        video.addEventListener('ended', () => {
            if (visible) advance();
        });
        plate.appendChild(video);
        return video;
    }

    function show(next) {
        const current = plates[index];
        const plate = plates[next];

        current.classList.remove('is-on');
        plate.classList.add('is-on');
        index = next;
        setCredit(plate);

        const video = plate.querySelector('video');
        if (video) {
            // Its turn now — let it buffer fully.
            if (video.preload !== 'auto') video.preload = 'auto';
            video.currentTime = 0;
            const played = video.play();
            if (played && played.catch) played.catch(() => schedule(STILL_HOLD));
        } else {
            schedule(STILL_HOLD);
        }

        // Rewind the plate we just left so it starts clean next time round.
        const old = current.querySelector('video');
        if (old) {
            old.pause();
            old.classList.remove('on');
        }

        // Warm the next clip while this one plays, never before.
        attachVideo(plates[(next + 1) % plates.length], false);
    }

    function advance() {
        clearTimeout(timer);
        show((index + 1) % plates.length);
    }

    function schedule(ms) {
        clearTimeout(timer);
        timer = setTimeout(advance, ms);
    }

    function stop() {
        clearTimeout(timer);
        const video = plates[index].querySelector('video');
        if (video) video.pause();
    }

    function start() {
        const video = plates[index].querySelector('video');
        if (video) {
            const played = video.play();
            if (played && played.catch) played.catch(() => schedule(STILL_HOLD));
        } else {
            schedule(STILL_HOLD);
        }
    }

    // A reduced-motion visitor keeps the first still and its credit. No rotation,
    // no video, no timers left running.
    if (reduced) {
        setCredit(plates[0]);
        return;
    }

    setCredit(plates[0]);

    function begin() {
        attachVideo(plates[0], true);    // on screen now — needs the body
        attachVideo(plates[1], false);   // next up — metadata is enough
        start();
    }

    // Hold everything back until the page has finished loading, then one idle
    // beat, so the reel cannot compete with first paint.
    const kick = () => window.setTimeout(begin, 1200);
    if (document.readyState === 'complete') kick();
    else window.addEventListener('load', kick, { once: true });

    // Do not burn a decoder on a hero nobody is looking at.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    visible = entry.isIntersecting;
                    if (visible) start();
                    else stop();
                });
            },
            { threshold: 0.15 },
        ).observe(stack);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (visible) start();
    });
})();
