import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/* figures.json is generated locally and COMMITTED — Vercel's build is
 * `vite build` and never re-runs the generator. So the service panel always
 * renders a measurement taken at some point in the past, and the only question
 * is whether it is honest about that.
 *
 * The dangerous direction is a stale UP. This panel exists because index.html
 * used to hardcode three green `UP` badges and claim three services were
 * running whether or not any were. Probe the Mini while it is up, let it die
 * that evening, never rebuild, and a stale snapshot reproduces exactly that bug
 * with a generator in front of it. These tests pin that it cannot.
 */

const FRESH = () => new Date(Date.now() - 2 * 3600000).toISOString();
const STALE = () => new Date(Date.now() - 30 * 3600000).toISOString();

function markup() {
    document.body.innerHTML = `
        <p><span data-svc-summary>placeholder</span></p>
        <h3>SERVICES <span class="h3-note">PROBED <span data-svc-checked>—</span></span></h3>
        <ul class="svc">
            <li><span class="state" data-svc="dashboard">—</span></li>
            <li><span class="state" data-svc="brain">—</span></li>
            <li><span class="state" data-svc="letstrade">—</span></li>
        </ul>`;
}

function snapshot(checkedAt, host, states) {
    return {
        generatedAt: checkedAt,
        definitions: {},
        services: {
            checkedAt,
            host,
            services: [
                { name: 'dashboard', port: 3000, state: states[0] },
                { name: 'brain', port: 7777, state: states[1] },
                { name: 'letstrade', port: 8420, state: states[2] },
            ],
        },
    };
}

async function render(snap) {
    markup();
    // globalThis, not global. `global` is a Node-only alias that eslint's browser
    // env does not declare, so it lints as an undefined variable — the same class
    // as the `process` no-undefs already fixed in this repo. globalThis is
    // standard and resolves in both environments.
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(snap) }));
    vi.resetModules();
    await import('../js/system-figures.js');
    // Let the fetch .then chain settle.
    for (let i = 0; i < 5; i++) await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
}

const state = (n) => document.querySelector(`[data-svc="${n}"]`);

describe('service panel staleness', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders a fresh probe as the measured state', async () => {
        await render(snapshot(FRESH(), 'up', ['up', 'up', 'up']));
        expect(state('dashboard').textContent).toBe('UP');
        expect(state('dashboard').dataset.state).toBe('up');
    });

    it('never renders a stale UP as UP', async () => {
        await render(snapshot(STALE(), 'up', ['up', 'up', 'up']));
        for (const n of ['dashboard', 'brain', 'letstrade']) {
            expect(state(n).textContent).toBe('UNVERIFIED');
            expect(state(n).dataset.state).toBe('stale');
            expect(state(n).dataset.state).not.toBe('up');
        }
    });

    it('keeps the last measured state in the tooltip rather than discarding it', async () => {
        await render(snapshot(STALE(), 'up', ['up', 'down', 'up']));
        expect(state('brain').getAttribute('title')).toMatch(/saw DOWN/);
        expect(state('dashboard').getAttribute('title')).toMatch(/saw UP/);
        expect(state('dashboard').getAttribute('title')).toMatch(/last probe ran/i);
    });

    it('does not let the lede claim services hold when the probe is stale', async () => {
        await render(snapshot(STALE(), 'up', ['up', 'up', 'up']));
        const sum = document.querySelector('[data-svc-summary]').textContent;
        expect(sum).toMatch(/last checked/);
        expect(sum).not.toMatch(/hold on a Mac Mini/);
    });

    it('still reports a fresh unreachable host as unreachable, not stale', async () => {
        await render(snapshot(FRESH(), 'unreachable', ['unreachable', 'unreachable', 'unreachable']));
        expect(state('dashboard').textContent).toBe('UNREACHABLE');
        expect(state('dashboard').dataset.state).toBe('unreachable');
        expect(document.querySelector('[data-svc-summary]').textContent).toMatch(/could not reach/);
    });

    it('treats a missing checkedAt as stale rather than trusting it', async () => {
        const snap = snapshot(FRESH(), 'up', ['up', 'up', 'up']);
        delete snap.services.checkedAt;
        await render(snap);
        expect(state('dashboard').textContent).toBe('UNVERIFIED');
    });

    it('marks the probe timestamp stale so the header shows it', async () => {
        await render(snapshot(STALE(), 'up', ['up', 'up', 'up']));
        expect(document.querySelector('[data-svc-checked]').dataset.stale).toBe('true');
    });
});
