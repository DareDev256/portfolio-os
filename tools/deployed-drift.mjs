#!/usr/bin/env node
/* deployed-drift.mjs — does the LIVE site still say what the generator says?
 *
 *   node tools/deployed-drift.mjs [--json]
 *
 * WHY THIS EXISTS: on 2026-08-30 jamesdare.com was serving figures.json built
 * on 08-25. Stars read 94 (95), installs 2,107 (1,976), and `snapshotDate` did
 * not exist in the deployed payload at all — so `SERVICES AS OF —` rendered
 * blank and the page's own honesty label was switched off by a stale deploy.
 * build-figures.mjs guarantees the numbers are right WHEN GENERATED. Nothing
 * checked that the bytes a visitor downloads are the ones that were generated.
 * That gap is this file.
 *
 * Exit 0 = deployed matches local. Exit 2 = drift (the actionable signal).
 * Exit 1 = could not tell, which is NOT reported as "clean".
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = 'https://www.jamesdare.com/data/figures.json';
const asJson = process.argv.includes('--json');

let local;
try {
    local = JSON.parse(readFileSync(resolve(ROOT, 'public/data/figures.json'), 'utf8'));
} catch (err) {
    console.error(`✗ local figures.json unreadable: ${err.message}`);
    process.exit(1);
}

let live;
try {
    const r = await fetch(LIVE, { headers: { 'cache-control': 'no-cache' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    live = await r.json();
} catch (err) {
    // Cannot see the deployed file. Exit 1, never 0 — "I could not check" and
    // "nothing is wrong" are different answers and only one of them is safe.
    console.error(`✗ could not fetch ${LIVE}: ${err.message}`);
    process.exit(1);
}

const drift = [];
const lf = local.figures ?? {};
const vf = live.figures ?? {};

for (const key of new Set([...Object.keys(lf), ...Object.keys(vf)])) {
    const a = vf[key];
    const b = lf[key];
    if (String(a) !== String(b)) drift.push({ key, deployed: a ?? '(absent)', generated: b ?? '(absent)' });
}

// The service probe is the newest field; its absence on prod IS the drift.
if (local.services && !live.services) {
    drift.push({ key: 'services', deployed: '(absent)', generated: `${local.services.host}` });
}

const ageH = live.generatedAt ? (Date.now() - Date.parse(live.generatedAt)) / 3_600_000 : null;

if (asJson) {
    console.log(JSON.stringify({ drift, deployedAgeHours: ageH ? Math.round(ageH) : null, deployedAt: live.generatedAt }, null, 2));
} else {
    console.log(`deployed build: ${live.generatedAt ?? 'unknown'}${ageH ? `  (${Math.round(ageH)}h old)` : ''}`);
    if (!drift.length) {
        console.log('✓ deployed figures match the generator');
    } else {
        console.log(`✗ ${drift.length} figure(s) drifted between the generator and the live site:`);
        for (const d of drift) console.log(`    ${d.key.padEnd(14)} live=${String(d.deployed).padEnd(12)} should be ${d.generated}`);
    }
}

process.exit(drift.length ? 2 : 0);
