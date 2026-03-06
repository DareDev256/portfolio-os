import { describe, it, expect } from 'vitest';
import { GitHub } from '../js/github.js';

describe('GitHub.calculateLanguageStats()', () => {
    it('returns top 3 languages sorted by count', () => {
        const repos = [
            { language: 'JavaScript' },
            { language: 'JavaScript' },
            { language: 'Python' },
            { language: 'Python' },
            { language: 'Python' },
            { language: 'Rust' },
            { language: 'Go' },
        ];
        const stats = GitHub.calculateLanguageStats(repos);
        expect(stats).toHaveLength(3);
        expect(stats[0].name).toBe('Python');
        expect(stats[1].name).toBe('JavaScript');
        // Third could be Rust or Go (both 1) — just verify count
        expect(stats[2].count).toBe(1);
    });

    it('returns empty array when no repos have a language', () => {
        const repos = [{ language: null }, { language: undefined }, {}];
        const stats = GitHub.calculateLanguageStats(repos);
        expect(stats).toEqual([]);
    });

    it('handles single-language dominance (100%)', () => {
        const repos = [{ language: 'TypeScript' }, { language: 'TypeScript' }];
        const stats = GitHub.calculateLanguageStats(repos);
        expect(stats).toHaveLength(1);
        expect(stats[0]).toEqual({ name: 'TypeScript', count: 2, percent: 100 });
    });

    it('rounds percentages to whole numbers', () => {
        // 1/3 = 33.33... should round to 33
        const repos = [
            { language: 'A' },
            { language: 'B' },
            { language: 'C' },
        ];
        const stats = GitHub.calculateLanguageStats(repos);
        stats.forEach(s => {
            expect(s.percent).toBe(Math.round(s.percent));
            expect(Number.isInteger(s.percent)).toBe(true);
        });
    });

    it('handles empty repos array', () => {
        expect(GitHub.calculateLanguageStats([])).toEqual([]);
    });

    it('caps at 3 results even with more languages', () => {
        const repos = 'ABCDE'.split('').map(l => ({ language: l }));
        expect(GitHub.calculateLanguageStats(repos)).toHaveLength(3);
    });
});

describe('GitHub.buildCommitTimeline()', () => {
    it('creates timeline with correct number of days', () => {
        const timeline = GitHub.buildCommitTimeline([], 7);
        expect(timeline).toHaveLength(7);
        timeline.forEach(day => expect(day.count).toBe(0));
    });

    it('counts commits from PushEvents', () => {
        const now = new Date();
        const events = [{
            type: 'PushEvent',
            created_at: now.toISOString(),
            payload: { commits: [{ message: 'a' }, { message: 'b' }] },
        }];
        const timeline = GitHub.buildCommitTimeline(events, 1);
        expect(timeline[0].count).toBe(2);
    });

    it('ignores non-PushEvent types', () => {
        const now = new Date();
        const events = [{
            type: 'WatchEvent',
            created_at: now.toISOString(),
            payload: {},
        }];
        const timeline = GitHub.buildCommitTimeline(events, 1);
        expect(timeline[0].count).toBe(0);
    });

    it('defaults to 1 commit when payload.commits is missing', () => {
        const now = new Date();
        const events = [{
            type: 'PushEvent',
            created_at: now.toISOString(),
            payload: {},
        }];
        const timeline = GitHub.buildCommitTimeline(events, 1);
        expect(timeline[0].count).toBe(1);
    });

    it('ignores events outside the day window', () => {
        const old = new Date();
        old.setDate(old.getDate() - 31); // 31 days ago, outside 30-day window
        const events = [{
            type: 'PushEvent',
            created_at: old.toISOString(),
            payload: { commits: [{ message: 'ancient' }] },
        }];
        const timeline = GitHub.buildCommitTimeline(events, 30);
        const total = timeline.reduce((sum, d) => sum + d.count, 0);
        expect(total).toBe(0);
    });

    it('each day entry has a formatted date string', () => {
        const timeline = GitHub.buildCommitTimeline([], 3);
        timeline.forEach(day => {
            // Format is "Mon D" e.g. "Mar 5"
            expect(day.date).toMatch(/^[A-Z][a-z]{2}\s\d{1,2}$/);
        });
    });
});
