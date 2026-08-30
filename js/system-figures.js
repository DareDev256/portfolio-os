/* system-figures.js — one source for every figure about the agent.
 *
 * Fills every [data-fig] on the page from /data/system-snapshot.json, which
 * check-daily-rollup writes and which carries its own `definitions` block
 * saying what each number counts.
 *
 * WHY: on 2026-08-24 this page carried THREE different module counts (92, 97,
 * 97), THREE line counts (67K, 61K, 60,795) and two repo counts (63, 91) — all
 * hardcoded, all describing the same system, on a page whose whole argument is
 * that the system reports itself accurately. Nothing was lying on purpose; the
 * figures were written at different times and drifted. Hardcoding a number that
 * a generated file already holds is the bug, so no [data-fig] element may carry
 * a literal value as a fallback: a stale number that renders looks correct,
 * while an em dash is visibly missing and gets fixed.
 *
 * The `title` attribute gets the generator's own definition, so hovering a figure
 * says what it counts — which is the actual answer to "63 or 91?": they are
 * different questions, and the page never said so.
 */

const SRC = '/data/figures.json';

const manualKeys = new Set();

function apply(root, values, defs) {
    root.querySelectorAll('[data-fig]').forEach((el) => {
        const key = el.dataset.fig;
        const v = values[key];
        if (v === undefined || v === null) return;
        el.textContent = String(v);
        if (defs[key]) {
            el.setAttribute('title', defs[key]);
            // Marks the figure as explainable so CSS can signal it. Without a cue
            // nobody hovers, and the definitions shipped invisibly for a week.
            el.dataset.explained = 'true';
            if (manualKeys.has(key)) el.dataset.kind = 'manual';
        }
    });
}

fetch(SRC)
    .then((r) => {
        if (!r.ok) throw new Error(`${SRC} -> ${r.status}`);
        return r.json();
    })
    .then((snap) => {
        const defs = snap.definitions ?? {};
        // figures.json already ships display-ready values (loc pre-compacted,
        // installs comma-grouped) so the page and the generator cannot disagree
        // about formatting the way they disagreed about the numbers.
        const values = { ...(snap.figures ?? {}) };

        // Manual figures are a different KIND of claim — no API can produce
        // them. They still render, but their tooltip says who counted and when,
        // so a reader can tell machine-verified from hand-counted.
        for (const [k, m] of Object.entries(snap.manual ?? {})) {
            values[k] = m.value;
            defs[k] = `Hand-counted, not measured: ${m.note} — as of ${m.asOf}`;
            manualKeys.add(k);
        }

        apply(document, values, defs);


        /* Shared definition readout. `title` is desktop-only and invisible until
         * hovered, so the generator's whole `definitions` block reached nobody on
         * a phone. Pointer and focus both drive it, and tap works because the
         * figures take focus. */
        const readout = document.querySelector('[data-fig-readout]');
        if (readout) {
            const rest = readout.innerHTML;
            const show = (el) => {
                const d = el.getAttribute('title');
                if (!d) return;
                readout.textContent = d;
                readout.dataset.on = 'true';
            };
            const clear = () => {
                readout.innerHTML = rest;
                delete readout.dataset.on;
            };
            document.querySelectorAll('[data-fig][data-explained]').forEach((el) => {
                el.tabIndex = 0;
                el.addEventListener('pointerenter', () => show(el));
                el.addEventListener('focus', () => show(el));
                el.addEventListener('click', () => show(el));
                el.addEventListener('pointerleave', clear);
                el.addEventListener('blur', clear);
            });
        }

        /* Services are a different shape from figures: each has its own measured
         * state, so they get their own pass. `unreachable` renders in amber and
         * says so — a portfolio that admits a box is off is more believable than
         * three permanent green rows, and those rows used to be hand-typed. */
        const probe = snap.services;
        if (probe) {
            const LABEL = { up: 'UP', down: 'DOWN', unreachable: 'UNREACHABLE' };
            for (const svc of probe.services ?? []) {
                const el = document.querySelector(`[data-svc="${svc.name}"]`);
                if (!el) continue;
                el.textContent = LABEL[svc.state] ?? String(svc.state).toUpperCase();
                el.dataset.state = svc.state;
                el.setAttribute(
                    'title',
                    svc.state === 'unreachable'
                        ? `The Mac Mini did not answer SSH when this build ran (${probe.checkedAt}). Nothing on this page can see the port from here, so it does not claim to.`
                        : `curl http://127.0.0.1:${svc.port}/ on the Mac Mini at build time${svc.code ? ` — HTTP ${svc.code}` : ''}`,
                );
            }
            /* The lede asserted "Three services hold on a Mac Mini" in the present
             * tense two inches above a panel that can say UNREACHABLE. One of the
             * two had to be wrong on any build where the host is off, so the
             * sentence reads from the same probe the panel does. */
            const sum = document.querySelector('[data-svc-summary]');
            if (sum) {
                const WORD = ['no', 'One', 'Two', 'Three', 'Four', 'Five'];
                const n = (probe.services ?? []).length;
                const up = (probe.services ?? []).filter((x) => x.state === 'up').length;
                const word = WORD[n] ?? String(n);
                sum.textContent =
                    probe.host === 'unreachable'
                        ? `${word} services live on a Mac Mini the page could not reach at build time`
                        : up === n
                          ? `${word} services hold on a Mac Mini`
                          : `${up} of ${n} services answered on a Mac Mini`;
            }

            const when = document.querySelector('[data-svc-checked]');
            if (when && probe.checkedAt) {
                const d = new Date(probe.checkedAt);
                const hrs = (Date.now() - d.getTime()) / 3600000;
                when.textContent = d.toISOString().slice(0, 10).replace(/-/g, '\u2022').slice(2);
                when.setAttribute('title', `Probed ${Math.round(hrs)}h ago at build time`);
                if (hrs > 72) when.dataset.stale = 'true';
            }
        }

        // Gate panels are cloned from <template> by gate-cycler.js long after
        // this runs, so a one-shot pass over `document` misses them entirely —
        // the figures inside a gate would sit at an em dash forever. Fill each
        // clone as it lands.
        const cycler = document.getElementById('gate-cycler');
        if (cycler) {
            new MutationObserver((records) => {
                for (const rec of records) {
                    rec.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) apply(node, values, defs);
                    });
                }
            }).observe(cycler, { childList: true, subtree: true });
        }

        // Anything still unfilled has no value in figures.json — the generator
        // does not measure it. Remove the wrapper phrase rather than leave a
        // dash mid-sentence. This is how "/ 43 active" retired: nothing counts
        // it, so the page stopped claiming it.
        document.querySelectorAll('[data-fig]').forEach((el) => {
            if (el.textContent.trim() !== '\u2014') return;
            const sub = el.closest('.sub');
            if (sub) sub.remove();
        });
    })
    .catch((err) => {
        // Leave the em dashes. A visibly missing figure is the correct failure:
        // it cannot be mistaken for a real number the way a stale literal can.
        console.warn('[system-figures]', err.message);
    });
