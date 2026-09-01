import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initAvailability } from '../js/availability.js';

const DATA = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../public/data/availability.json'), 'utf8'),
);

function payload(over = {}) {
    return {
        generatedAt: new Date().toISOString(),
        slotMinutes: 30,
        bookingUrl: '/book',
        days: [{ date: '2026-09-04', weekday: 'Fri', carsDue: 2, lastDeadline: '13:00', slots: ['15:00', '15:30'] }],
        ...over,
    };
}

async function render(data, ok = true) {
    document.body.innerHTML = '<div data-availability hidden></div>';
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(data) }));
    await initAvailability(document);
}

const panel = () => document.querySelector('[data-availability]');

describe('availability panel', () => {
    beforeEach(() => { document.body.innerHTML = ''; });
    afterEach(() => { vi.restoreAllMocks(); });

    it('stays hidden when the fetch fails, rather than apologising', async () => {
        // BOOK 30 MINUTES sits right beside this and already works. An empty
        // panel with an error in it costs the visitor more than no panel.
        await render(null, false);
        expect(panel().hidden).toBe(true);
        expect(panel().innerHTML).toBe('');
    });

    it('renders real slots and links to the booking page', async () => {
        await render(payload());
        expect(panel().hidden).toBe(false);
        expect(panel().querySelectorAll('.avail-slot')).toHaveLength(2);
        expect(panel().querySelector('a').getAttribute('href')).toBe('/book');
    });

    it('formats 24h into the 12h a North American reader expects', async () => {
        await render(payload({ days: [{ date: '2026-09-04', weekday: 'Fri', slots: ['15:00', '15:30', '09:00'] }] }));
        const t = [...panel().querySelectorAll('.avail-slot')].map((e) => e.textContent);
        expect(t).toEqual(['3pm', '3:30pm', '9am']);
    });

    it('says so when it is stale instead of presenting old data as live', async () => {
        const old = new Date(Date.now() - 4 * 86400000).toISOString();
        await render(payload({ generatedAt: old }));
        const stamp = panel().querySelector('.stamp');
        expect(stamp.dataset.state).toBe('stale');
        expect(stamp.textContent).toContain('DAYS AGO');
    });

    it('handles a fully booked horizon without rendering an empty box', async () => {
        await render(payload({ days: [{ date: '2026-09-03', weekday: 'Thu', slots: [] }] }));
        expect(panel().hidden).toBe(false);
        expect(panel().textContent).toContain('No open windows');
        expect(panel().querySelector('a').getAttribute('href')).toBe('/book');
    });
});

describe('the generated data itself', () => {
    it('publishes nothing that identifies a car, customer or advisor', () => {
        // The input is the dealership's data, not James's. Computed availability
        // may be published; a stock number or a name may not. The generator
        // asserts this too — pinned here so a later change to either fails.
        const blob = JSON.stringify(DATA);
        expect(blob).not.toMatch(/\b[A-Z]?\d{5,6}[A-Z]?\b/);
        expect(blob).not.toMatch(/SERINA|BROOKE|HALLIEE|MIKE|MARK|ALLAN|AMIR|CHLOE|ERIK|DELNIA|NICHOLAS/i);
        expect(blob).not.toMatch(/Audi|Q[357]\b|SQ5|detail/i);
    });

    it('offers only afternoon slots, which is the whole measured point', () => {
        for (const d of DATA.days) {
            for (const s of d.slots) {
                expect(Number(s.slice(0, 2))).toBeGreaterThanOrEqual(15);
                expect(Number(s.slice(0, 2))).toBeLessThan(17);
            }
        }
    });

    it('never offers a slot before the day\'s last delivery deadline', () => {
        for (const d of DATA.days) {
            if (!d.lastDeadline || !d.slots.length) continue;
            const last = Number(d.lastDeadline.slice(0, 2)) + Number(d.lastDeadline.slice(3)) / 60;
            for (const s of d.slots) {
                expect(Number(s.slice(0, 2)) + Number(s.slice(3)) / 60).toBeGreaterThanOrEqual(last);
            }
        }
    });

    it('never offers a slot that collides with a busy block', () => {
        /* THE FAILURE THIS EXISTS FOR: the first version of the generator modelled
         * car deadlines and nothing else, and offered 15:00 on 2026-09-02 — the
         * exact half hour of the Exadel interview. A booking page that
         * double-books its owner into a job interview is worse than none.
         *
         * Mutation-checked: deleting the `blocked()` guard in
         * tools/build-availability.mjs puts 15:00 back on Sep 2 and fails this.
         * Every other test in this file passed with that guard removed, which is
         * why this one had to be written separately. */
        const busy = JSON.parse(
            readFileSync(resolve(import.meta.dirname, '../data/busy-blocks.json'), 'utf8'),
        ).blocks || [];
        const mins = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
        const collisions = [];
        for (const d of DATA.days) {
            for (const s of d.slots) {
                const a = mins(s); const b = a + DATA.slotMinutes;
                for (const blk of busy) {
                    if (blk.date !== d.date) continue;
                    if (mins(blk.start) < b && mins(blk.end) > a) {
                        collisions.push(`${d.date} ${s} overlaps ${blk.start}-${blk.end}`);
                    }
                }
            }
        }
        // Named, not counted — a bare count tells you it broke without saying where.
        expect(collisions).toEqual([]);
    });

    it('excludes weekends', () => {
        for (const d of DATA.days) {
            expect(new Date(`${d.date}T12:00:00`).getDay()).not.toBe(0);
            expect(new Date(`${d.date}T12:00:00`).getDay()).not.toBe(6);
        }
    });
});
