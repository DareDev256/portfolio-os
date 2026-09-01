import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* The SNAPSHOT stamp must be able to admit it is old.
 *
 * On 2026-09-01 the live status panel read `SNAPSHOT 26•08•23` — nine days
 * stale — as a bare date, directly above a hero that says "I build systems that
 * run without me". Nothing was lying, and that is the point: the generator
 * behaved CORRECTLY. system-snapshot.sh refuses to write when the Mac Mini is
 * unreachable, because a failed ssh returns 0 jobs and would publish an
 * undercount that looks perfectly valid. The number was right to freeze. The
 * page was wrong to render a frozen date as a current one.
 *
 * The failure mode these tests exist to prevent is therefore NOT a wrong
 * number. It is a right number with a silently expired timestamp, on the one
 * panel whose entire job is to prove the page measures itself.
 */

const ISO = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const display = (iso) => iso.slice(0, 10).replace(/-/g, '•').slice(2);

function markup() {
    document.body.innerHTML = `
        <span class="stamp">SNAPSHOT <span data-fig="snapshotDate">&#8212;</span></span>
        <div class="stamp">DESKTOP: SNAPSHOT <span data-fig="snapshotDate">&#8212;</span></div>`;
}

function payload(iso, { withIso = true } = {}) {
    const figures = { snapshotDate: display(iso) };
    if (withIso) figures.snapshotAt = iso;
    return { generatedAt: iso, definitions: {}, figures, manual: {} };
}

async function render(snap) {
    markup();
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(snap) }));
    vi.resetModules();
    await import('../js/system-figures.js');
    for (let i = 0; i < 5; i++) await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
}

const stamps = () => [...document.querySelectorAll('[data-fig="snapshotDate"]')];

describe('snapshot stamp staleness', () => {
    beforeEach(() => { document.body.innerHTML = ''; });
    afterEach(() => { vi.restoreAllMocks(); });

    it('renders a recent snapshot as a plain date, with no scolding', async () => {
        const iso = ISO(2);
        await render(payload(iso));
        for (const el of stamps()) {
            expect(el.textContent).toBe(display(iso));
            expect(el.dataset.state).toBeUndefined();
        }
    });

    it('still reads clean the day before the weekly job would be late', async () => {
        // 7 days is one full cycle. The job is weekly; flagging at exactly a
        // week would fire every Sunday morning before it runs.
        await render(payload(ISO(7)));
        expect(stamps()[0].dataset.state).toBeUndefined();
    });

    it('declares its own age once a full cycle plus jitter has passed', async () => {
        await render(payload(ISO(9)));
        for (const el of stamps()) {
            expect(el.dataset.state).toBe('stale');
            expect(el.textContent).toContain('9 DAYS OLD');
            // The date itself must survive. Replacing it with a word throws away
            // the one fact a reader can check.
            expect(el.textContent).toContain(display(ISO(9)));
        }
    });

    it('marks EVERY stamp, not just the first', async () => {
        // index.html carries this figure twice — the status panel and the OS
        // aside. A fix applied with querySelector instead of querySelectorAll
        // leaves the second one quietly claiming to be current.
        await render(payload(ISO(20)));
        expect(stamps()).toHaveLength(2);
        expect(stamps().every((el) => el.dataset.state === 'stale')).toBe(true);
    });

    it('explains the cause on hover rather than just crying stale', async () => {
        await render(payload(ISO(9)));
        const title = stamps()[0].getAttribute('title') || '';
        expect(title).toMatch(/Mac\s+Mini/);
        expect(title).toMatch(/undercount/);
    });

    it('degrades correctly against a deployed figures.json with no snapshotAt', async () => {
        // The raw ISO is new. An older figures.json still on the CDN has only
        // the display string, and the check must survive that rather than
        // silently skipping and rendering a stale date as fresh.
        const iso = ISO(30);
        await render(payload(iso, { withIso: false }));
        expect(stamps()[0].dataset.state).toBe('stale');
        expect(stamps()[0].textContent).toContain('DAYS OLD');
    });

    it('does not throw when the stamp is missing or unparseable', async () => {
        await render({ generatedAt: ISO(1), definitions: {}, figures: { snapshotDate: 'not-a-date' }, manual: {} });
        expect(stamps()[0].dataset.state).toBeUndefined();
    });
});
