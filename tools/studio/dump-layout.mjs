#!/usr/bin/env node
/* dump-layout.mjs: write the set layout the Blender build reads (4.66.0).
 *
 * The station count comes from the Monitor's own switcher in index.html, the
 * positions from js/studio/layout.js, so the baked room is built for exactly
 * the crew the live page will stand on it. Refuses (exit 1) when the switcher
 * is missing rather than baking a guess.
 *
 *   node tools/studio/dump-layout.mjs [out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setLayout } from '../../js/studio/layout.js';

const root = resolve(import.meta.dirname, '../..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/<button[^>]*\bclass="src[^"]*"[^>]*\bdata-src="([^"]+)"/g)].map((m) => m[1]);
if (ids.length < 2) {
    console.error(`dump-layout: found ${ids.length} sources in index.html; refusing to write a layout`);
    process.exit(1);
}
const out = resolve(root, process.argv[2] || 'tools/studio/layout.json');
writeFileSync(out, `${JSON.stringify({ ...setLayout(ids.length), ids }, null, 2)}\n`);
console.log(`dump-layout: ${ids.length} stations -> ${out}`);
