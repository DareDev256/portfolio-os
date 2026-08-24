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

function apply(root, values, defs) {
    root.querySelectorAll('[data-fig]').forEach((el) => {
        const key = el.dataset.fig;
        const v = values[key];
        if (v === undefined || v === null) return;
        el.textContent = String(v);
        if (defs[key]) el.setAttribute('title', defs[key]);
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
            defs[k] = `${m.note} — as of ${m.asOf}`;
        }

        apply(document, values, defs);

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
