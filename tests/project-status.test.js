import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { deriveStatus, statusClass } from '../js/project-status.js';

// Tests run under jsdom, where import.meta.url is an http URL — read from the
// project root instead of resolving relative to this module.
const projects = JSON.parse(
    readFileSync(path.resolve(process.cwd(), 'public/data/projects.json'), 'utf-8')
);

describe('deriveStatus', () => {
    it('prefers an explicit status over the demo heuristic', () => {
        // The whole point of the field: a repo-only project can still be alive.
        expect(deriveStatus({ status: 'LIVE', demo: null })).toBe('LIVE');
    });

    it('still falls back to the demo heuristic when no status is set', () => {
        expect(deriveStatus({ demo: 'https://example.com' })).toBe('LIVE');
        expect(deriveStatus({ demo: null })).toBe('ARCHIVED');
    });

    it('only styles ARCHIVED as archived', () => {
        expect(statusClass({ demo: null })).toBe('lab-notes__status--archived');
        expect(statusClass({ status: 'LIVE', demo: null })).toBe('');
    });
});

describe('projects.json data contract', () => {
    it('never ships a null/empty repo key', () => {
        // A `repo` present but falsy used to render a GitHub button to nowhere.
        for (const p of projects) {
            if ('repo' in p && p.repo !== null) {
                expect(typeof p.repo, `${p.title} repo`).toBe('string');
                expect(p.repo.length, `${p.title} repo`).toBeGreaterThan(0);
            }
        }
    });

    it('does not label the flagship OSS project as archived', () => {
        // Regression: this rendered ARCHIVED for months because it ships to
        // PyPI rather than to a hosted demo URL.
        const fcp = projects.find((p) => p.title === 'FCPXML MCP Server');
        expect(fcp).toBeDefined();
        expect(deriveStatus(fcp)).toBe('LIVE');
    });

    it('points every GitHub link at a canonical repo name', () => {
        // The site accumulated three spellings of this repo, one of them a 404.
        const bad = projects.filter((p) => typeof p.repo === 'string' && /fcpxml-mcp\b|fcpxml-mcp-server/.test(p.repo));
        expect(bad.map((p) => p.title)).toEqual([]);
    });
});
