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
            /* A figure inside a link must NOT take focus of its own. The anchor is
             * already a tab stop, so making the span one too stops a keyboard user
             * twice on the same content — the second time on a span with no role
             * and nothing to activate. Let the wrapping anchor drive the readout
             * instead, which is the behaviour a reader expects anyway. */
            const wire = (el) => {
                if (el.dataset.readoutWired) return;
                el.dataset.readoutWired = '1';
                const inLink = el.closest('a');
                if (!inLink) el.tabIndex = 0;
                const target = inLink ?? el;
                target.addEventListener('pointerenter', () => show(el));
                target.addEventListener('focus', () => show(el));
                target.addEventListener('click', () => show(el));
                target.addEventListener('pointerleave', clear);
                target.addEventListener('blur', clear);
            };
            document.querySelectorAll('[data-fig][data-explained]').forEach(wire);

            /* Gate panels are cloned from <template> long after this runs, so a
             * one-shot pass over `document` gave their figures a title and nothing
             * else: no focus, no readout, definitions unreachable on touch —
             * exactly the gap the shared readout exists to close. Wire each clone
             * as it lands. */
            new MutationObserver((records) => {
                for (const rec of records) {
                    rec.addedNodes.forEach((node) => {
                        if (node.nodeType !== 1) return;
                        /* Match on [data-fig] ALONE. `data-explained` is stamped by
                         * apply(), which runs from the gate-cycler's own observer
                         * AFTER insertion — so at the moment a clone lands it carries
                         * only data-fig. Requiring both attributes here is why the
                         * 4.30.0 version of this fix silently did nothing: every gate
                         * figure filled, showed a title, and was still unreachable by
                         * keyboard or touch. show() reads the title lazily, so wiring
                         * before the definition arrives is safe. */
                        if (node.matches?.('[data-fig]')) wire(node);
                        node.querySelectorAll?.('[data-fig]').forEach(wire);
                    });
                }
            }).observe(document.body, { childList: true, subtree: true });
        }

        /* Services are a different shape from figures: each has its own measured
         * state, so they get their own pass. `unreachable` renders in amber and
         * says so — a portfolio that admits a box is off is more believable than
         * three permanent green rows, and those rows used to be hand-typed. */
        const probe = snap.services;
        if (probe) {
            const LABEL = { up: 'UP', down: 'DOWN', unreachable: 'UNREACHABLE' };

            /* A probe is a measurement, and a measurement has an age. figures.json
             * is generated locally and COMMITTED — Vercel's build is `vite build`
             * and never re-runs the generator — so whatever state was true at the
             * last generator run ships until someone regenerates.
             *
             * That is how the hardcoded green `UP` badges this panel was built to
             * replace would come back in through the back door: probe the Mini
             * while it is up, let it die that evening, and the page keeps telling
             * visitors three services are running for as long as nobody rebuilds.
             * Past the threshold the panel stops asserting a present-tense state
             * and says only what it actually knows — what the last probe saw, and
             * how long ago. 26h leaves the daily radar two hours of jitter before
             * a healthy site starts calling itself unverified. */
            const STALE_HOURS = 26;
            const ageH = probe.checkedAt
                ? (Date.now() - new Date(probe.checkedAt).getTime()) / 3600000
                : Infinity;
            const stale = !(ageH < STALE_HOURS);
            const ageWord = Number.isFinite(ageH)
                ? ageH < 48
                    ? `${Math.round(ageH)}h ago`
                    : `${Math.round(ageH / 24)} days ago`
                : 'at an unrecorded time';

            for (const svc of probe.services ?? []) {
                const el = document.querySelector(`[data-svc="${svc.name}"]`);
                if (!el) continue;
                const label = LABEL[svc.state] ?? String(svc.state).toUpperCase();
                el.textContent = stale ? 'UNVERIFIED' : label;
                el.dataset.state = stale ? 'stale' : svc.state;
                el.setAttribute(
                    'title',
                    stale
                        ? `Not checked recently. The last probe ran ${ageWord} and saw ${label}. This page will not claim a live state it has not measured, so it reports the age instead.`
                        : svc.state === 'unreachable'
                          ? `The Mac Mini did not answer SSH when this build ran (${probe.checkedAt}). Nothing on this page can see the port from here, so it does not claim to.`
                          : `curl http://127.0.0.1:${svc.port}/ on the Mac Mini, probed ${ageWord}${svc.code ? ` — HTTP ${svc.code}` : ''}`,
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
                sum.textContent = stale
                    ? `${word} services live on a Mac Mini, last checked ${ageWord}`
                    : probe.host === 'unreachable'
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
                if (stale) when.dataset.stale = 'true';
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
