/* registry-graph.js — the #system graph, rendered from live registry data.
 *
 * Replaces ~40 hand-placed SVG coordinates. In the old version node size,
 * position and count were arbitrary: it read as a system diagram while encoding
 * nothing, sitting directly beside a hard numeric claim. Here every node traces
 * to public/data/registry-graph.json, built by tools/build-registry-graph.mjs
 * from `gh repo list` MERGED with data/registry-curation.json. Radius is the curated
 * tier, colour is days since last push.
 *
 * Selection used to be `sort by pushedAt, take 14`, which against 24 public repos
 * labelled 58% of them — a listing, not a curation, with a bubble-pop game drawn at
 * the same weight as a package with 95 stars. The tier now carries a claim the page
 * states in the legend, so a viewer can disagree with it.
 *
 * EDGES ARE DELIBERATELY ONLY core -> named. Repository membership in the
 * registry is a fact; a dependency graph between these repos is not something
 * `gh` gives us, so drawing repo-to-repo edges would be inventing structure. The
 * 71 unlabelled entries orbit the core WITHOUT edges for the same reason — they
 * are really in the registry, but their placement is arrangement, not data, and
 * an edge would assert a relationship that was never measured.
 *
 * No d3. d3-force is ~30KB gzipped to run one velocity-Verlet loop over ~85
 * nodes; the solver below is the part actually needed, and owning it means the
 * settle behaviour can be tuned to the page instead of to a general-purpose API.
 */

const SRC = '/data/registry-graph.json';
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
const NS = 'http://www.w3.org/2000/svg';

/* Two layouts, one solver. A phone gets a portrait canvas, six labelled nodes
 * and a tighter halo; anything wider gets the full ring. Chosen once at load
 * rather than on resize — re-solving mid-session would make the graph jump for
 * a visitor who merely rotated their phone, and the labels would land somewhere
 * different from where they last read them. */
const NARROW = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;

const W = NARROW ? 460 : 850;
const H = NARROW ? 620 : 640;
const CX = W / 2;
const CY = H / 2;

/* ---------- the solver ----------
 * Velocity Verlet with per-tick damping and a decaying alpha. Tuned so the
 * layout resolves in roughly two seconds — long enough to read as the registry
 * assembling itself, short enough that nobody watches it finish. */
const RING = NARROW ? 132 : 186; // target orbit for a named repo
const HALO_MIN = NARROW ? 182 : 252; // inner edge of the unlabelled field
const HALO_MAX = NARROW ? 218 : 300;

/* Labelled nodes shown. Six fits a 460-unit canvas with its labels legible;
 * fourteen does not, which is what made the old fixed-count graph unreadable on
 * a phone and got the whole section hidden below 640px. */
const NAMED_CAP = NARROW ? 6 : Infinity;
/* The halo is a texture, not a count the eye reads — thinning it on a small
 * canvas keeps it from swallowing the labelled ring. The legend still states
 * the true total, so nothing is being under-claimed. */
const HALO_CAP = NARROW ? 26 : Infinity;

function el(name, attrs) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
}

function simulate(nodes, ticks, onTick) {
    let alpha = 1;
    for (let t = 0; t < ticks; t += 1) {
        step(nodes, alpha);
        alpha *= 0.985;
        if (onTick) onTick(alpha);
    }
}

function step(nodes, alpha) {
    const n = nodes.length;

    // Pairwise repulsion. O(n^2) over ~85 nodes is ~3.6k pairs per tick, which
    // is nothing; a quadtree here would be optimising the wrong thing.
    for (let i = 0; i < n; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < n; j += 1) {
            const b = nodes[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let d2 = dx * dx + dy * dy;
            // Two nodes at the exact same point produce d=0 and a NaN that
            // silently poisons every later position. Nudge them apart instead.
            if (d2 < 0.01) {
                dx = (i % 2 ? 1 : -1) * 0.5;
                dy = (j % 2 ? 1 : -1) * 0.5;
                d2 = 0.5;
            }
            const d = Math.sqrt(d2);
            const min = a.r + b.r + 13;
            if (d < min) {
                const push = ((min - d) / d) * 0.5 * alpha;
                a.vx -= dx * push;
                a.vy -= dy * push;
                b.vx += dx * push;
                b.vy += dy * push;
            }
        }
    }

    // Radial spring to each node's own target orbit.
    for (const p of nodes) {
        const dx = p.x - CX;
        const dy = p.y - CY;
        const d = Math.hypot(dx, dy) || 0.001;
        const pull = (p.orbit - d) * 0.06 * alpha;
        p.vx += (dx / d) * pull;
        p.vy += (dy / d) * pull;

        // Angular spring: hold roughly the seeded angle so the layout is stable
        // between reloads. Without it the ring is a different arrangement every
        // visit, and the labels jump around on a page the visitor may revisit.
        const ang = Math.atan2(dy, dx);
        let diff = p.seedAngle - ang;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        const tang = diff * d * 0.05 * alpha;
        p.vx += -Math.sin(ang) * tang;
        p.vy += Math.cos(ang) * tang;

        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;
    }
}

function build(data) {
    const wrap = document.getElementById('registry-graph');
    if (!wrap) return;

    const named = data.nodes.slice(0, NAMED_CAP).map((d, i, arr) => {
        const seedAngle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
        return {
            ...d,
            kind: 'named',
            orbit: RING,
            seedAngle,
            // Seeded on the ring rather than at the core: starting every node at
            // one point means the first tick is dominated by the degenerate-pair
            // nudge above, and the settle looks like an explosion, not a layout.
            x: CX + Math.cos(seedAngle) * RING * 0.35,
            y: CY + Math.sin(seedAngle) * RING * 0.35,
            vx: 0,
            vy: 0,
        };
    });

    const halo = [];
    const haloCount = Math.min(data.unnamed, HALO_CAP);
    for (let i = 0; i < haloCount; i += 1) {
        // Golden-angle placement: an even ring reads as a decorative pattern,
        // and Math.random() would move on every reload. This is stable and
        // irregular, which is what a real registry sample looks like.
        const seedAngle = i * 2.399963 - Math.PI / 2;
        const orbit = HALO_MIN + ((i * 37) % 100) / 100 * (HALO_MAX - HALO_MIN);
        halo.push({
            id: null,
            kind: 'halo',
            r: 3.4,
            orbit,
            seedAngle,
            x: CX + Math.cos(seedAngle) * orbit,
            y: CY + Math.sin(seedAngle) * orbit,
            vx: 0,
            vy: 0,
        });
    }

    const all = named.concat(halo);

    // Solve to convergence off-screen, then animate from seed to solution. The
    // alternative — ticking the simulation live in rAF — makes the settle time
    // depend on the visitor's frame rate, so a slow machine shows a graph still
    // visibly crawling when they scroll past it.
    const seed = all.map((p) => ({ x: p.x, y: p.y }));
    simulate(all, 320);
    const solved = all.map((p) => ({ x: p.x, y: p.y }));

    render(wrap, data, all, named, seed, solved);
}

function render(svg, data, all, named, seed, solved) {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const gEdge = el('g', { class: 'rg-edges' });
    const gHalo = el('g', { class: 'rg-halo' });
    const gNode = el('g', { class: 'rg-nodes' });
    svg.append(gEdge, gHalo, gNode);

    // Core
    const coreG = el('g', { class: 'rg-core', tabindex: '0', role: 'button' });
    coreG.dataset.id = data.core.id;
    coreG.append(
        el('circle', { class: 'rg-core-ring', cx: CX, cy: CY, r: data.core.r + 12 }),
        el('circle', { class: 'rg-core-disc', cx: CX, cy: CY, r: data.core.r }),
        el('circle', { class: 'rg-core-dot', cx: CX, cy: CY, r: 7 })
    );
    const coreLabel = el('text', { class: 'rg-label rg-label-core', x: CX, y: CY + data.core.r + 20 });
    coreLabel.textContent = data.core.label;
    coreG.append(coreLabel);
    // Hit target for the core. The disc is 26px but the pointer needs the same
    // generous target every other node gets, and the label sits below it.
    coreG.append(el('circle', { class: 'rg-hit', cx: CX, cy: CY, r: data.core.r + 22 }));
    svg.append(coreG);

    const items = [];

    all.forEach((p, i) => {
        if (p.kind === 'halo') {
            const c = el('circle', { class: 'rg-dot', cx: seed[i].x, cy: seed[i].y, r: p.r });
            gHalo.append(c);
            items.push({ p, i, dot: c });
            return;
        }

        const edge = el('line', {
            class: 'rg-edge',
            x1: CX,
            y1: CY,
            x2: seed[i].x,
            y2: seed[i].y,
        });
        gEdge.append(edge);

        const g = el('g', { class: 'rg-node', tabindex: '0', role: 'button' });
        g.dataset.id = p.id;
        const hit = el('circle', { class: 'rg-hit', cx: seed[i].x, cy: seed[i].y, r: p.r + 16 });
        const disc = el('circle', { class: 'rg-disc', cx: seed[i].x, cy: seed[i].y, r: p.r });
        // Heat drives colour through a custom property rather than a fill
        // attribute so the stylesheet keeps ownership of the palette.
        disc.style.setProperty('--heat', p.heat);
        const label = el('text', { class: 'rg-label' });
        // The viewBox is smaller on a phone, so a fixed 10.5px font scales UP
        // with it and turns into headline-sized labels. Counter-scale it.
        if (NARROW) label.setAttribute('font-size', '13');
        label.textContent = p.id;
        g.append(hit, disc, label);
        gNode.append(g);

        items.push({ p, i, edge, group: g, disc, hit, label });
    });

    place(items, seed, solved, 0);
    wireReadout(svg, items, data, coreG);
    buildRail(data);

    if (REDUCED.matches) {
        place(items, seed, solved, 1);
        svg.classList.add('is-settled');
        return;
    }

    // Only run the settle once the section is actually on screen — otherwise it
    // plays to an empty room and the visitor scrolls down to a finished graph.
    const host = svg.closest('.graph-wrap') || svg;
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                io.disconnect();
                animate(svg, items, seed, solved);
            });
        },
        { threshold: 0.25 }
    );
    io.observe(host);
}

function place(items, seed, solved, t) {
    // easeOutExpo, matching --sys-expo. The settle should decelerate hard: a
    // linear interpolation reads as a machine moving parts, not as a system
    // finding its own resting shape.
    const e = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    for (const it of items) {
        const s = seed[it.i];
        const f = solved[it.i];
        const x = s.x + (f.x - s.x) * e;
        const y = s.y + (f.y - s.y) * e;
        if (it.dot) {
            it.dot.setAttribute('cx', x.toFixed(1));
            it.dot.setAttribute('cy', y.toFixed(1));
            continue;
        }
        it.edge.setAttribute('x2', x.toFixed(1));
        it.edge.setAttribute('y2', y.toFixed(1));
        it.disc.setAttribute('cx', x.toFixed(1));
        it.disc.setAttribute('cy', y.toFixed(1));
        it.hit.setAttribute('cx', x.toFixed(1));
        it.hit.setAttribute('cy', y.toFixed(1));
        placeLabel(it, x, y);
    }
}

/* Labels sit RADIALLY OUTWARD from the core, not always below the node.
 * Always-below is what made `shopbayhq-site` run under `betmetrics` and parked
 * `passion-dashboard` on top of its own disc: on a radial layout, the space
 * directly under a node is occupied by whatever is further round the ring,
 * while the space pointing away from the centre is guaranteed empty. */
function placeLabel(it, x, y) {
    const dx = x - CX;
    const dy = y - CY;
    const d = Math.hypot(dx, dy) || 1;

    // The direction picks the SIDE; the offset is then applied on that axis
    // alone, not along the diagonal. Offsetting radially looks correct but the
    // horizontal component of a 45-degree offset is only 0.71 of it — smaller
    // than the radius on the larger nodes — so nine labels sat on top of their
    // own disc. Measured, not guessed: a rect test over the rendered boxes.
    const vertical = Math.abs(dx) < d * 0.34;

    if (vertical) {
        it.label.setAttribute('text-anchor', 'middle');
        it.label.setAttribute('x', x.toFixed(1));
        // 4px above the cap height going up, baseline below the disc going down.
        it.label.setAttribute('y', (y + (dy < 0 ? -(it.p.r + 11) : it.p.r + 19)).toFixed(1));
        return;
    }

    /* Pick the side that FITS, not merely the side the node points at.
     *
     * The radial rule below is right about direction and silent about width.
     * On the 460-unit phone canvas a 25-character id — `tdotssolutionsz-portfolio`,
     * `passion-dashboard` — is wider than the gap between its node and the edge,
     * so with `overflow: visible` it rendered past the viewBox and the page edge
     * sheared it: two of six labelled nodes read `tionsz-portfolio` and
     * `assion-dashboard`. Unreadable, in the one section built to be evidence.
     *
     * Measured, not assumed: getComputedTextLength on the real element, cached
     * once because the text never changes and place() runs every frame of the
     * 1.9s settle — measuring per frame would force layout 60 times a second. */
    if (it.labelW === undefined) {
        it.labelW = typeof it.label.getComputedTextLength === 'function'
            ? it.label.getComputedTextLength()
            : it.label.textContent.length * 7;   // jsdom and other non-rendering hosts
    }

    const PAD = 6;
    const gap = it.p.r + 11;
    const w = it.labelW;
    const wants = dx < 0 ? -1 : 1;

    // Does the preferred side leave the whole label inside the canvas?
    const fits = (side) => (side < 0 ? x - gap - w >= PAD : x + gap + w <= W - PAD);
    const side = fits(wants) ? wants : (fits(-wants) ? -wants : wants);

    it.label.setAttribute('text-anchor', side < 0 ? 'end' : 'start');

    let lx = x + side * gap;
    // A label wider than the room on BOTH sides still must not leave the frame.
    // Clamping beats truncating: the whole name stays readable, it simply sits
    // closer to its node than the radial rule would like.
    if (side < 0) lx = Math.max(lx, PAD + w);
    else lx = Math.min(lx, W - PAD - w);

    it.label.setAttribute('x', lx.toFixed(1));
    // +3.6 puts the mono baseline on the disc's optical centre.
    it.label.setAttribute('y', (y + 3.6).toFixed(1));
}

function animate(svg, items, seed, solved) {
    const DUR = 1900;
    // performance.now(), not Date.now(): the former is monotonic, so a clock
    // adjustment mid-animation cannot make the progress jump or run backwards.
    const t0 = performance.now();
    function frame(now) {
        const t = Math.min(1, (now - t0) / DUR);
        place(items, seed, solved, t);
        if (t < 1) requestAnimationFrame(frame);
        else {
            svg.classList.add('is-settled');
            dispatchPulse(svg, items);
        }
    }
    requestAnimationFrame(frame);
}

/* A pulse walks core -> repo along a real edge every few seconds. It stands for
 * the agent dispatching to a repo, which is the one thing the still image could
 * never show. Named nodes only: a pulse to an unlabelled dot would assert the
 * agent touched a specific repo we never identified. */
function dispatchPulse(svg, items) {
    const targets = items.filter((it) => it.edge);
    if (!targets.length) return;
    let n = 0;

    function fire() {
        // Cycle in order rather than at random: random repeats, and a repeat
        // reads as a stutter rather than as a second dispatch.
        const it = targets[n % targets.length];
        n += 1;

        const dot = el('circle', { class: 'rg-pulse', cx: CX, cy: CY, r: 3.5 });
        svg.querySelector('.rg-edges').append(dot);

        const x2 = Number(it.edge.getAttribute('x2'));
        const y2 = Number(it.edge.getAttribute('y2'));
        const t0 = performance.now();
        const DUR = 780;

        function frame(now) {
            const t = Math.min(1, (now - t0) / DUR);
            const e = t * t * (3 - 2 * t);
            dot.setAttribute('cx', (CX + (x2 - CX) * e).toFixed(1));
            dot.setAttribute('cy', (CY + (y2 - CY) * e).toFixed(1));
            dot.setAttribute('opacity', (t < 0.85 ? 1 : (1 - t) / 0.15).toFixed(2));
            if (t < 1) requestAnimationFrame(frame);
            else {
                dot.remove();
                it.group.classList.add('is-hit');
                setTimeout(() => it.group.classList.remove('is-hit'), 520);
            }
        }
        requestAnimationFrame(frame);
    }

    fire();
    const timer = setInterval(fire, 2600);

    // A setInterval on a backgrounded tab queues work that all lands at once on
    // return. Stop while hidden and restart on focus.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) clearInterval(timer);
    });
}

/* ---------- detail panel ----------
 *
 * Two states, and the difference matters. HOVER previews — cheap, reversible,
 * reverts to the core on exit. CLICK (or Enter/Space) PINS: the panel keeps its
 * content, becomes pointer-reachable, grows its links and writes #system/<repo>
 * to the URL.
 *
 * They are separate because a hover-only panel cannot hold a link. The moment
 * the pointer leaves the node to travel to the CODE button, the node's
 * pointerleave fires and the panel it was walking toward reverts. That is why
 * the old readout had no links: with `pointer-events: none` and revert-on-exit,
 * there was nowhere to put one that a mouse could reach.
 */

const HASH_PREFIX = '#system/';

function detailOf(n, isCore) {
    return {
        id: n.id,
        tier: isCore ? 'CORE' : String(n.tier || '').toUpperCase(),
        what: n.what || n.blurb || '—',
        proves: n.proves || null,
        // lang comes from gh and stack is authored, so they can disagree in
        // wording; show the authored stack when there is one, since it names
        // what was actually used rather than what GitHub guessed from bytes.
        stack: (n.stack && n.stack.length ? n.stack : [n.lang].filter(Boolean)).join(' · '),
        pushed: n.pushedAt ? `PUSHED ${n.pushedAt}` : '',
        live: n.live || null,
        code: n.code || null,
        private: !!n.private,
    };
}

function wireReadout(svg, items, data, coreG) {
    const out = document.getElementById('rg-readout');
    if (!out) return;

    const f = {
        name: out.querySelector('[data-rg="name"]'),
        tier: out.querySelector('[data-rg="tier"]'),
        what: out.querySelector('[data-rg="what"]'),
        proves: out.querySelector('[data-rg="proves"]'),
        stack: out.querySelector('[data-rg="stack"]'),
        pushed: out.querySelector('[data-rg="pushed"]'),
        live: out.querySelector('[data-rg="live"]'),
        code: out.querySelector('[data-rg="code"]'),
        hint: out.querySelector('[data-rg="hint"]'),
        close: out.querySelector('[data-rg="close"]'),
    };

    const rest = detailOf(data.core, true);
    let pinned = null; // the group element currently pinned, or null

    function setLink(a, spec, fallbackLabel) {
        if (!a) return;
        if (!spec) {
            a.hidden = true;
            a.removeAttribute('href');
            return;
        }
        const url = typeof spec === 'string' ? spec : spec.url;
        a.textContent = (typeof spec === 'string' ? fallbackLabel : spec.label) || fallbackLabel;
        a.href = url;
        // Only an off-site link gets a new tab. /os and /passion are this site,
        // and opening your own pages in new tabs is how you end up with eleven.
        const external = /^https?:/i.test(url);
        if (external) {
            a.target = '_blank';
            // noopener is a security requirement, not a nicety: without it the
            // opened page gets a handle on window.opener and can navigate this
            // tab somewhere else.
            a.rel = 'noopener noreferrer';
        } else {
            a.removeAttribute('target');
            a.removeAttribute('rel');
        }
        a.hidden = false;
    }

    function show(v, isPinned) {
        f.name.textContent = v.id;
        f.tier.textContent = v.tier;
        f.tier.dataset.tier = v.tier.toLowerCase();
        f.what.textContent = v.what;

        if (f.proves) {
            f.proves.textContent = v.proves || '';
            f.proves.hidden = !v.proves;
        }
        f.stack.textContent = v.stack;
        f.pushed.textContent = v.pushed;

        // Links only render while pinned. Showing them on hover advertises a
        // target the pointer cannot reach without dismissing the panel.
        setLink(f.live, isPinned ? v.live : null, 'OPEN →');
        // A private repo has no code link by construction — the generator emits
        // null — so this hides itself without a special case here.
        setLink(f.code, isPinned ? v.code : null, 'CODE ↗');

        if (f.hint) f.hint.hidden = isPinned || !!pinned;
        if (f.close) f.close.hidden = !isPinned;
        out.classList.toggle('is-pinned', !!isPinned);
    }

    function unpin(restoreFocus) {
        const was = pinned;
        pinned = null;
        if (was) was.classList.remove('is-pinned');
        svg.classList.remove('is-focus');
        items.forEach((it) => it.group && it.group.classList.remove('is-on'));
        if (coreG) coreG.classList.remove('is-on');
        show(rest, false);
        if (history.replaceState && location.hash.startsWith(HASH_PREFIX)) {
            history.replaceState(null, '', '#system');
        }
        if (restoreFocus && was) was.focus();
    }

    function pin(group, v) {
        if (pinned && pinned !== group) pinned.classList.remove('is-pinned');
        pinned = group;
        group.classList.add('is-pinned', 'is-on');
        svg.classList.add('is-focus');
        show(v, true);
        if (history.replaceState) {
            history.replaceState(null, '', HASH_PREFIX + v.id);
        }
    }

    function wire(group, v) {
        const on = () => {
            if (pinned) return; // a pinned panel is not overwritten by a passing pointer
            svg.classList.add('is-focus');
            group.classList.add('is-on');
            show(v, false);
        };
        const off = () => {
            if (pinned) return;
            svg.classList.remove('is-focus');
            group.classList.remove('is-on');
            show(rest, false);
        };

        group.addEventListener('pointerenter', on);
        group.addEventListener('pointerleave', off);
        group.addEventListener('focus', on);
        group.addEventListener('blur', off);

        group.addEventListener('click', () => {
            if (pinned === group) unpin(false);
            else pin(group, v);
        });
        group.addEventListener('keydown', (e) => {
            // role="button" gets no default activation in SVG, so Enter and
            // Space have to be handled here or the whole graph is mouse-only.
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                if (pinned === group) unpin(false);
                else pin(group, v);
            }
        });
    }

    const targets = new Map();

    if (coreG) {
        wire(coreG, rest);
        targets.set(data.core.id.toLowerCase(), { group: coreG, v: rest });
    }

    items
        .filter((it) => it.group)
        .forEach((it) => {
            const v = detailOf(it.p, false);
            wire(it.group, v);
            targets.set(v.id.toLowerCase(), { group: it.group, v });
        });

    show(rest, false);

    if (f.close) f.close.addEventListener('click', () => unpin(true));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && pinned) unpin(true);
    });

    // Clicking the empty canvas clears the pin. Without this the only way out is
    // the small close button, which on a phone is a 24px target inside a graph.
    svg.addEventListener('click', (e) => {
        if (pinned && !e.target.closest('.rg-node, .rg-core')) unpin(false);
    });

    /* Deep link. #system/<repo> pins one node on load and after a
     * back/forward, so a single repo can be sent to someone directly. The
     * browser cannot scroll to it natively — there is no element with that id —
     * so the scroll is done here. */
    function fromHash() {
        if (!location.hash.startsWith(HASH_PREFIX)) return;
        const want = decodeURIComponent(location.hash.slice(HASH_PREFIX.length)).toLowerCase();
        const t = targets.get(want);
        if (!t) return;
        const sect = document.getElementById('system');
        if (sect) sect.scrollIntoView({ behavior: 'smooth', block: 'start' });
        pin(t.group, t.v);
    }

    fromHash();
    window.addEventListener('hashchange', fromHash);

    // The index list below the graph drives the same panel, so a keyboard or
    // screen-reader visitor reaches every repo without touching the canvas.
    document.addEventListener('click', (e) => {
        const a = e.target.closest('[data-rg-jump]');
        if (!a) return;
        const t = targets.get(a.dataset.rgJump.toLowerCase());
        if (!t) return;
        e.preventDefault();
        pin(t.group, t.v);
        document.getElementById('rg-readout')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

/* ---------- the rail ----------
 *
 * A horizontal snap slider, one card per curated repo. It is a <ul> of real
 * anchors underneath — the slider is layout. Strip the CSS and a crawler still
 * reads a list, which is the whole reason this block exists: the SVG is
 * aria-hidden and canvas-only, so the named repositories were unreachable to a
 * screen reader and invisible to a crawler.
 *
 * It also carries the phone. The narrow layout caps the graph at six labelled
 * nodes, so on a phone the rail is the ONLY place the other seven exist.
 *
 * Scrolling is native — `scroll-snap-type` in CSS, `scrollBy` here. A JS
 * animation loop would have to reimplement momentum, rubber-banding and the
 * trackpad's own inertia, and would fight the browser for the same gesture.
 */
function buildRail(data) {
    const rail = document.getElementById('rg-rail');
    const track = document.getElementById('rg-rail-track');
    if (!rail || !track) return;

    const rows = [data.core].concat(data.nodes);

    const title = rail.querySelector('.rg-rail-title');
    if (title) {
        // Never a hardcoded count. "THE TWELVE" in the markup would go stale the
        // first time a repo is added to the curation, which is the same class of
        // bug as the three snapshot dates.
        title.childNodes[0].nodeValue = `${rows.length} REPOSITORIES, HAND-PICKED `;
    }

    const ofEl = rail.querySelector('[data-rail="of"]');
    const atEl = rail.querySelector('[data-rail="at"]');
    const fill = rail.querySelector('.rg-rail-fill');
    const prev = rail.querySelector('[data-rail="prev"]');
    const next = rail.querySelector('[data-rail="next"]');
    if (ofEl) ofEl.textContent = String(rows.length);

    track.innerHTML = '';

    rows.forEach((n, i) => {
        const isCore = n === data.core;
        const v = detailOf(n, isCore);

        const li = document.createElement('li');
        li.className = 'rg-card';
        li.dataset.id = v.id;
        if (isCore) li.classList.add('is-core');

        // Heat as a hairline along the card's top edge. The graph encodes recency
        // as node brightness, which is unreadable once you are looking at text;
        // the same number as a bar is legible at a glance and uses the identical
        // value, so the two views cannot disagree.
        const heat = document.createElement('span');
        heat.className = 'rg-card-heat';
        heat.style.setProperty('--heat', n.heat === undefined ? 1 : n.heat);
        li.append(heat);

        const num = document.createElement('span');
        num.className = 'rg-card-num';
        num.textContent = String(i + 1).padStart(2, '0');

        const tier = document.createElement('span');
        tier.className = 'rg-card-tier';
        tier.dataset.tier = v.tier.toLowerCase();
        tier.textContent = v.tier;

        const top = document.createElement('div');
        top.className = 'rg-card-top';
        top.append(num, tier);

        const name = document.createElement('a');
        name.className = 'rg-card-name';
        name.href = HASH_PREFIX + v.id;
        name.dataset.rgJump = v.id;
        name.textContent = v.id;

        const what = document.createElement('p');
        what.className = 'rg-card-what';
        what.textContent = v.what;

        li.append(top, name, what);

        if (v.proves) {
            const pr = document.createElement('p');
            pr.className = 'rg-card-proves';
            // The label is a separate element, not a prefix in the string, so the
            // evidence line stays selectable and quotable on its own.
            const lab = document.createElement('span');
            lab.className = 'rg-card-proves-k';
            lab.textContent = 'PROVES';
            pr.append(lab, document.createTextNode(v.proves));
            li.append(pr);
        }

        const meta = document.createElement('div');
        meta.className = 'rg-card-meta';
        if (v.stack) {
            const st = document.createElement('span');
            st.textContent = v.stack;
            meta.append(st);
        }
        if (v.pushed) {
            const ps = document.createElement('span');
            ps.textContent = v.pushed;
            meta.append(ps);
        }
        li.append(meta);

        const links = document.createElement('div');
        links.className = 'rg-card-links';
        if (v.live) {
            const a = document.createElement('a');
            a.className = 'rg-card-btn is-live';
            a.href = typeof v.live === 'string' ? v.live : v.live.url;
            a.textContent = (typeof v.live === 'string' ? 'OPEN' : v.live.label) || 'OPEN';
            if (/^https?:/i.test(a.href)) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            links.append(a);
        }
        if (v.code) {
            const a = document.createElement('a');
            a.className = 'rg-card-btn';
            a.href = v.code;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = 'CODE ↗';
            links.append(a);
        }
        if (!v.code && v.private) {
            // Say why. A missing link on a page about shipped work reads as
            // nothing shipped.
            const sp = document.createElement('span');
            sp.className = 'rg-card-note';
            sp.textContent = 'PRIVATE REPOSITORY';
            links.append(sp);
        }
        if (links.childNodes.length) li.append(links);

        track.append(li);
    });

    // Tail card: the unlabelled remainder, stated rather than implied.
    const tail = document.createElement('li');
    tail.className = 'rg-card rg-card-tail';
    tail.innerHTML = '';
    const tn = document.createElement('span');
    tn.className = 'rg-card-tailnum';
    tn.textContent = `+${data.unnamed}`;
    const tt = document.createElement('p');
    tt.className = 'rg-card-what';
    tt.textContent =
        'more repositories in the registry — counted, and deliberately not named. Client work and private experiments live here.';
    tail.append(tn, tt);
    track.append(tail);

    /* ---------- slider mechanics ---------- */

    const cards = () => [...track.querySelectorAll('.rg-card')];

    function stepSize() {
        const list = cards();
        if (list.length < 2) return track.clientWidth;
        // Measured from two real cards rather than assumed from CSS. The gap is
        // a clamp() and the card width is a min() of two units, so any constant
        // here would drift the moment the viewport changed.
        return Math.round(list[1].offsetLeft - list[0].offsetLeft);
    }

    function currentIndex() {
        const list = cards();
        const x = track.scrollLeft;
        let best = 0;
        let bestD = Infinity;
        list.forEach((c, i) => {
            const d = Math.abs(c.offsetLeft - track.offsetLeft - x);
            if (d < bestD) {
                bestD = d;
                best = i;
            }
        });
        return best;
    }

    function sync() {
        const max = track.scrollWidth - track.clientWidth;
        const p = max > 0 ? track.scrollLeft / max : 0;
        if (fill) fill.style.transform = `scaleX(${Math.max(0.04, Math.min(1, p)).toFixed(3)})`;
        if (atEl) atEl.textContent = String(Math.min(rows.length, currentIndex() + 1));

        // Disable rather than hide. A control that disappears mid-gesture moves
        // the one next to it under the finger already travelling toward it.
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= max - 2;

        rail.classList.toggle('at-end', track.scrollLeft >= max - 2);
    }

    function nudge(dir) {
        track.scrollBy({ left: dir * stepSize(), behavior: REDUCED.matches ? 'auto' : 'smooth' });
    }

    prev?.addEventListener('click', () => nudge(-1));
    next?.addEventListener('click', () => nudge(1));

    track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nudge(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            nudge(-1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            track.scrollTo({ left: 0, behavior: 'smooth' });
        } else if (e.key === 'End') {
            e.preventDefault();
            track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
        }
    });

    /* SCROLL TRAP. Chrome maps a vertical wheel onto a horizontally-scrollable
     * element that has no vertical overflow — so scrolling the PAGE with the
     * cursor anywhere over this rail scrolls the RAIL sideways instead, and the
     * page stays put until the rail hits its end. On a 13-card rail that is a
     * dead zone the height of the cards, which a visitor reads as the page
     * having frozen.
     *
     * The fix has to be manual: there is no CSS property that opts out of the
     * translation (overscroll-behavior governs chaining, not this). So when the
     * gesture is dominantly vertical, cancel it and scroll the window by the
     * same delta. A dominantly horizontal gesture — a trackpad two-finger swipe,
     * a shift-wheel — still belongs to the rail and is left alone.
     *
     * passive:false because preventDefault is the entire point; a passive
     * listener cannot cancel and the browser would ignore it. */
    track.addEventListener(
        'wheel',
        (e) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            e.preventDefault();
            // deltaMode 1 is lines, 2 is pages. Treating either as pixels makes
            // a mouse wheel move the page by three pixels per notch.
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
            window.scrollBy({ top: e.deltaY * unit, behavior: 'auto' });
        },
        { passive: false }
    );

    /* Drag to pan with a mouse. Touch already has this natively, so the handler
     * ignores anything that is not a mouse — adding it for touch would fight the
     * browser's own momentum and make the rail feel heavier on the device that
     * needs it most. */
    let drag = null;
    track.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        if (e.target.closest('a, button')) return; // a link is for clicking, not dragging
        drag = { x: e.clientX, left: track.scrollLeft, moved: false };
        track.classList.add('is-grabbing');
    });
    track.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x;
        if (Math.abs(dx) > 3) drag.moved = true;
        track.scrollLeft = drag.left - dx;
    });
    function endDrag() {
        if (!drag) return;
        drag = null;
        track.classList.remove('is-grabbing');
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);
    // A drag that ends on top of a card must not also fire that card's link.
    track.addEventListener(
        'click',
        (e) => {
            if (drag && drag.moved) {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        true
    );

    /* Keep the rail and the graph pointing at the same repo. Scrolling the rail
     * marks the card in view as active and lights its node; without this they
     * are two lists of the same thing that never agree on where you are. */
    let activeId = null;
    function markActive() {
        const list = cards();
        const i = currentIndex();
        list.forEach((c, k) => c.classList.toggle('is-active', k === i));
        const id = list[i]?.dataset.id || null;
        if (id === activeId) return;
        activeId = id;
        document.querySelectorAll('.rg-node, .rg-core').forEach((g) => {
            g.classList.toggle('is-near', !!id && g.dataset.id === id);
        });
    }
    /* ONE rAF-coalesced scroll handler for both readouts. A scroll event can fire
     * once per frame per pixel, and doing layout reads inline janks the very
     * gesture being measured.
     *
     * cancel-then-request, never a boolean latch. A `if (pending) return;
     * pending = true` guard set BEFORE the frame is requested is a trap: if that
     * frame never arrives — the page was opened in a background tab, where the
     * browser throttles rAF to nothing — the flag stays true forever and every
     * later scroll returns early. The progress bar and the active card would be
     * dead for the life of the page, silently, on the one visit where the
     * visitor came back to a tab they had left open. Holding the id and
     * cancelling means the newest callback simply runs whenever frames resume.
     *
     * A hidden tab flushes synchronously instead, so the rail is already correct
     * the moment it becomes visible rather than one frame late. */
    let raf = 0;
    function onScroll() {
        if (document.hidden) {
            sync();
            markActive();
            return;
        }
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            raf = 0;
            sync();
            markActive();
        });
    }

    track.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onScroll);

    // Card widths come from clamp()/min(), so a resize changes the step and the
    // progress bar without any scroll happening.
    window.addEventListener('resize', () => {
        sync();
        markActive();
    });

    sync();
    markActive();
}

fetch(SRC)
    .then((r) => {
        if (!r.ok) throw new Error(`${SRC} -> ${r.status}`);
        return r.json();
    })
    .then(build)
    .catch((err) => {
        // Fail visibly in the console but silently on the page: the figcaption
        // and the repo list beside the graph carry the same facts in text, so a
        // missing graph costs decoration, not information.
        console.warn('[registry-graph]', err.message);
    });
