/* registry-graph.js — the #system graph, rendered from live registry data.
 *
 * Replaces ~40 hand-placed SVG coordinates. In the old version node size,
 * position and count were arbitrary: it read as a system diagram while encoding
 * nothing, sitting directly beside a hard numeric claim. Here every node traces
 * to public/data/registry-graph.json, built by tools/build-registry-graph.mjs
 * from `gh repo list`. Radius is disk usage, colour is days since last push.
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
    const coreG = el('g', { class: 'rg-core' });
    coreG.append(
        el('circle', { class: 'rg-core-ring', cx: CX, cy: CY, r: data.core.r + 12 }),
        el('circle', { class: 'rg-core-disc', cx: CX, cy: CY, r: data.core.r }),
        el('circle', { class: 'rg-core-dot', cx: CX, cy: CY, r: 7 })
    );
    const coreLabel = el('text', { class: 'rg-label rg-label-core', x: CX, y: CY + data.core.r + 20 });
    coreLabel.textContent = data.core.label;
    coreG.append(coreLabel);
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
    wireReadout(svg, items, data);

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

    const side = dx < 0 ? -1 : 1;
    it.label.setAttribute('text-anchor', side < 0 ? 'end' : 'start');
    it.label.setAttribute('x', (x + side * (it.p.r + 11)).toFixed(1));
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

/* ---------- readout ---------- */
function wireReadout(svg, items, data) {
    const out = document.getElementById('rg-readout');
    if (!out) return;

    const fields = {
        name: out.querySelector('[data-rg="name"]'),
        blurb: out.querySelector('[data-rg="blurb"]'),
        pushed: out.querySelector('[data-rg="pushed"]'),
        lang: out.querySelector('[data-rg="lang"]'),
    };

    const rest = {
        name: data.core.id,
        blurb: data.core.blurb || '—',
        pushed: data.core.pushedAt,
        lang: 'the registry core',
    };

    function show(v) {
        fields.name.textContent = v.name;
        fields.blurb.textContent = v.blurb;
        fields.pushed.textContent = v.pushed;
        fields.lang.textContent = v.lang;
    }

    show(rest);

    items
        .filter((it) => it.group)
        .forEach((it) => {
            const v = {
                name: it.p.id,
                blurb: it.p.blurb || '—',
                pushed: it.p.pushedAt,
                // ageDays is already computed and honest; recomputing it here
                // from pushedAt would drift against the generated data.
                lang: [it.p.lang, it.p.private ? 'private' : 'public', `${it.p.ageDays}d ago`]
                    .filter(Boolean)
                    .join(' · '),
            };
            const on = () => {
                svg.classList.add('is-focus');
                it.group.classList.add('is-on');
                show(v);
            };
            const off = () => {
                svg.classList.remove('is-focus');
                it.group.classList.remove('is-on');
                show(rest);
            };
            it.group.addEventListener('pointerenter', on);
            it.group.addEventListener('pointerleave', off);
            it.group.addEventListener('focus', on);
            it.group.addEventListener('blur', off);
        });
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
