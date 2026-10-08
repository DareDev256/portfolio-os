import { describe, it, expect } from 'vitest';
import { slotsFrom, validate, RULES, localDay } from '../api/_booking.js';

// Thu 2026-10-08 10:00 Toronto (EDT, UTC-4) = 14:00Z
const NOW = Date.parse('2026-10-08T14:00:00Z');
const at = (iso) => Date.parse(iso);
const local = (s) => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(s));
    const g = (t) => p.find((x) => x.type === t).value;
    return `${g('weekday')}, ${String(+g('hour') % 24).padStart(2, '0')}:${g('minute')}`;
};

describe('slotsFrom', () => {
    it('offers only the call windows: weekdays 4:45-7 pm and Saturday 11-2, nothing on Sunday', () => {
        const s = slotsFrom([], NOW);
        expect(s.length).toBeGreaterThan(0);
        for (const iso of s) {
            const [wd, hm] = local(iso).split(', ');
            const [h, m] = hm.split(':').map(Number);
            const t = h + m / 60;
            if (wd === 'Sat') expect(t >= 11 && t + 0.25 <= 14).toBe(true);
            else { expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).toContain(wd); expect(t >= 16.75 && t + 0.25 <= 19).toBe(true); }
        }
        expect(s.some((iso) => local(iso).startsWith('Sun'))).toBe(false);
    });

    it('never offers a slot inside the 12-hour notice window', () => {
        const s = slotsFrom([], NOW);
        expect(Math.min(...s.map(Date.parse))).toBeGreaterThanOrEqual(NOW + RULES.minNoticeH * 3600e3);
    });

    it('keeps a 15-minute buffer around any busy block', () => {
        // Fri Oct 9, busy 17:30-18:00 local (21:30-22:00Z)
        const busy = [[at('2026-10-09T21:30:00Z'), at('2026-10-09T22:00:00Z')]];
        const fri = slotsFrom(busy, NOW).filter((iso) => iso.startsWith('2026-10-09'));
        const times = fri.map((iso) => local(iso).split(', ')[1]);
        expect(times).toContain('17:00');           // ends 17:15, buffer to 17:30 is clear
        expect(times).not.toContain('17:15');        // would touch the block within the buffer
        expect(times).not.toContain('17:45');
        expect(times).not.toContain('18:00');        // starts right at the end, no buffer
        expect(times).toContain('18:15');
    });

    it('stops offering a day once it already holds 3 intro calls', () => {
        const full = { [localDay(at('2026-10-09T21:00:00Z'))]: 3 };
        expect(slotsFrom([], NOW, full).some((iso) => iso.startsWith('2026-10-09'))).toBe(false);
        expect(slotsFrom([], NOW, {}).some((iso) => iso.startsWith('2026-10-09'))).toBe(true);
    });
});

describe('validate', () => {
    const ok = { name: 'Ada Lovelace', email: 'ada@example.com', site: 'tdots', start: '2026-10-09T21:00:00.000Z' };
    it('accepts a clean booking', () => { expect(validate(ok).error).toBeUndefined(); });
    it('flags the honeypot as spam', () => { expect(validate({ ...ok, website: 'x' }).error).toBe('spam'); });
    it('rejects a bad email, a missing name and an off-grid time', () => {
        expect(validate({ ...ok, email: 'nope' }).error).toMatch(/email/);
        expect(validate({ ...ok, name: '' }).error).toMatch(/name/);
        expect(validate({ ...ok, start: '2026-10-09T21:07:00.000Z' }).error).toMatch(/time/);
    });
    it('falls back to the jamesdare persona for an unknown site', () => { expect(validate({ ...ok, site: 'evil' }).site).toBe('jamesdare'); });
});
