/* Dead links are a regression, not a one-time cleanup.
 *
 * This runs the OFFLINE half of tools/link-audit.mjs — filesystem and rewrite
 * resolution only, no network — so it is fast and deterministic enough to sit in
 * the normal suite. The network half is `npm run audit:links:net`, kept out of
 * here because a flaky third-party host must never fail a local test run.
 *
 * The value is the catch-all: vercel.json rewrites every unmatched path to
 * /index.html, so a link to a page that ships no file returns 200 and renders the
 * homepage. Nothing about browsing the site reveals that, and no status-code
 * crawler can either — only resolving against the build output does.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');

describe('link integrity', () => {
    it.skipIf(!existsSync(DIST))('no internal link resolves only through the catch-all', () => {
        let out;
        try {
            out = execFileSync('node', ['tools/link-audit.mjs', '--json'], {
                cwd: ROOT,
                encoding: 'utf8',
                maxBuffer: 32 * 1024 * 1024,
            });
        } catch (err) {
            // The script exits non-zero when it finds something; that is the
            // failure case, and stdout still holds the report.
            out = err.stdout;
        }

        const report = JSON.parse(out);
        const offline = report.broken.filter((r) => r.type !== 'external');

        // Name them in the failure message. A bare count tells you something
        // broke without telling you what, which is a test you re-run instead of
        // read.
        expect(offline.map((r) => `${r.url} (in ${r.from}) — ${r.note}`)).toEqual([]);
    });

    it.skipIf(!existsSync(DIST))('every in-page anchor points at an element that exists', () => {
        let out;
        try {
            out = execFileSync('node', ['tools/link-audit.mjs', '--json'], {
                cwd: ROOT,
                encoding: 'utf8',
                maxBuffer: 32 * 1024 * 1024,
            });
        } catch (err) {
            out = err.stdout;
        }
        const report = JSON.parse(out);
        const anchors = report.broken.filter((r) => r.type === 'anchor');
        expect(anchors.map((r) => `${r.url} in ${r.from}`)).toEqual([]);
    });
});
