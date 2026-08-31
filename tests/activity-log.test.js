import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/* The SNAPSHOT LOG was four hand-typed rows with frozen times — the page's
 * strongest evidence for "systems that run without me", and the only claim on it
 * that nothing measured.
 *
 * The dangerous direction for a panel like this is not failing loudly. It is
 * showing activity when there was none: a stale fallback, or a hidden panel,
 * both read to a visitor as "things are running". So the empty case and the
 * error case are the ones pinned here.
 */

function markup() {
    document.body.innerHTML = `
        <h3>RAN WITHOUT ME <span class="h3-note" data-activity-count>—</span></h3>
        <div class="log" data-activity-log>
            <div class="rv d1"><time>—</time><div><div class="what">Reading…</div></div></div>
        </div>`;
}

async function render(payload, { fail = false } = {}) {
    markup();
    globalThis.fetch = vi.fn(() =>
        fail
            ? Promise.resolve({ ok: false, status: 500 })
            : Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })
    );
    vi.resetModules();
    await import('../js/activity-log.js');
    for (let i = 0; i < 5; i++) await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
}

const log = () => document.querySelector('[data-activity-log]').textContent;
const count = () => document.querySelector('[data-activity-count]').textContent;

describe('activity log', () => {
    beforeEach(() => { document.body.innerHTML = ''; });
    afterEach(() => { vi.restoreAllMocks(); });

    it('renders real events with their measured times', async () => {
        await render({
            windowHours: 36, ranInWindow: 2, jobsWatched: 8,
            events: [
                { time: '09:21', label: 'Career pipeline digested', source: 'career-digest', ageMinutes: 128 },
                { time: '06:46', label: 'Morning brief compiled and sent', source: 'daily-brief', ageMinutes: 283 },
            ],
        });
        expect(log()).toContain('09:21');
        expect(log()).toContain('Morning brief compiled and sent');
        expect(count()).toBe('2 of 8 ran · 36h');
    });

    it('SAYS nothing ran rather than hiding or falling back', async () => {
        await render({ windowHours: 36, ranInWindow: 0, jobsWatched: 8, events: [] });
        expect(log()).toMatch(/Nothing ran/i);
        expect(count()).toBe('0 of 8 ran · 36h');
        // The panel must still be present — a hidden panel reads as "fine".
        expect(document.querySelector('[data-activity-log]')).not.toBeNull();
    });

    it('never renders a stale event when the source cannot be read', async () => {
        await render(null, { fail: true });
        expect(log()).toMatch(/Could not read/i);
        expect(log()).not.toMatch(/Morning brief/);
    });

    /* The first version of this panel shipped INVISIBLE. Rows carry `.rv`, which
     * is opacity:0 until something adds `.on`, and the page's reveal script
     * collects `.rv` once at load — so injected rows were in the DOM, readable by
     * textContent, and unpainted. The textContent assertions above all passed
     * against a blank panel. These pin the thing textContent cannot see. */
    it('reveals injected rows — a row in the DOM at opacity 0 is not rendered', async () => {
        await render({
            windowHours: 36, ranInWindow: 1, jobsWatched: 8,
            events: [{ time: '09:21', label: 'Career pipeline digested', source: 'x', ageMinutes: 12 }],
        });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const rows = [...document.querySelectorAll('[data-activity-log] .rv')];
        expect(rows.length).toBeGreaterThan(0);
        for (const r of rows) expect(r.classList.contains('on')).toBe(true);
    });

    it('reveals the empty-state row too', async () => {
        await render({ windowHours: 36, ranInWindow: 0, jobsWatched: 8, events: [] });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const row = document.querySelector('[data-activity-log] .rv');
        expect(row.classList.contains('on')).toBe(true);
    });

    it('reveals the failed-read row too', async () => {
        await render(null, { fail: true });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const row = document.querySelector('[data-activity-log] .rv');
        expect(row.classList.contains('on')).toBe(true);
    });

    it('escapes values rather than injecting them as markup', async () => {
        await render({
            windowHours: 36, ranInWindow: 1, jobsWatched: 8,
            events: [{ time: '01:00', label: '<img src=x onerror=alert(1)>', source: 'x', ageMinutes: 5 }],
        });
        expect(document.querySelector('[data-activity-log] img')).toBeNull();
        expect(log()).toContain('<img');
    });
});
