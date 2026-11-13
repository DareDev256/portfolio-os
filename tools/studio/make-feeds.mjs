#!/usr/bin/env node
/* make-feeds.mjs: station-sized copies of the Monitor's clips (4.66.0).
 *
 * Every clip a source carries on the Monitor (data-clips in index.html) gets a
 * 480px, silent, faststart copy in public/assets/studio/feeds/, so sixteen
 * station screens can play on a phone without decoding 720p video. The studio
 * reads feeds/manifest.json and falls back to the original clip for anything
 * the manifest does not list; a test fails when a clip has no copy.
 *
 *   node tools/studio/make-feeds.mjs        (skips copies that are newer than their source)
 */
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '../..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const clips = [...new Set([...html.matchAll(/\bdata-clips="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean))];
if (!clips.length) {
    console.error('make-feeds: no data-clips in index.html; refusing to write an empty manifest');
    process.exit(1);
}
const outDir = resolve(root, 'public/assets/studio/feeds');
mkdirSync(outDir, { recursive: true });
const manifest = {};
for (const clip of clips) {
    const src = resolve(root, 'public', clip.replace(/^\//, ''));
    if (!existsSync(src)) {
        console.error(`make-feeds: ${clip} is on the Monitor but not in public/; refusing`);
        process.exit(1);
    }
    const name = basename(clip);
    const out = resolve(outDir, name);
    if (!existsSync(out) || statSync(out).mtimeMs < statSync(src).mtimeMs) {
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', 'scale=480:-2,fps=24', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '29', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
    }
    manifest[clip] = `/assets/studio/feeds/${name}`;
    console.log(`${clip} ${statSync(src).size} -> ${statSync(out).size}`);
}
writeFileSync(resolve(outDir, 'manifest.json'), `${JSON.stringify({ note: 'tools/studio/make-feeds.mjs: station copies of the Monitor clips', clips: manifest }, null, 2)}\n`);
console.log(`make-feeds: ${clips.length} clips`);
