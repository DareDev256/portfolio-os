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

/* SECOND VANTAGE.
 *
 * 2026-09-08: this MacBook could not reach www.jamesdare.com at all — 000
 * after a 15s timeout — while the Mac Mini fetched the same URL in 0.32s.
 * It is not a local misconfiguration: the route, gateway and interface are
 * identical to hosts that work, cloudflare.com answers in 0.29s, and
 * vercel.com in 0.35s. One Cloudflare anycast prefix (172.64.80.1) is
 * unreachable from this ISP, and IPv6 has no route to it either.
 *
 * A drift checker that cannot see the site is not a checker. Rather than
 * report "could not determine" four times a day forever from a host that
 * structurally cannot answer, fall back to a host that can. An http 000 is
 * "I could not look", never a site status — so the fallback runs before any
 * verdict is reached, not after one is guessed.
 *
 * Still exits 1 if BOTH vantages fail. "I could not check" and "nothing is
 * wrong" are different answers and only one of them is safe. */
async function fetchLive() {
    try {
        const r = await fetch(LIVE, { headers: { 'cache-control': 'no-cache' } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return { data: await r.json(), via: 'local' };
    } catch (err) {
        console.error(`· local vantage failed (${err.message}) — trying the Mini`);
    }
    try {
        const { execFileSync } = await import('node:child_process');
        const out = execFileSync('ssh', [
            '-o', 'ConnectTimeout=8', '-o', 'BatchMode=yes', 'macmini',
            `curl -sS -m 20 -H 'cache-control: no-cache' ${LIVE}`,
        ], { encoding: 'utf8', timeout: 40000, env: { ...process.env, SSH_AUTH_SOCK: '' } });
        return { data: JSON.parse(out), via: 'macmini' };
    } catch (err) {
        console.error(`✗ could not fetch ${LIVE} from either vantage: ${err.message}`);
        process.exit(1);
    }
}

const { data: live, via } = await fetchLive();
if (via !== 'local') console.error(`· read the deployed file via ${via}`);

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
