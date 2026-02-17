import { describe, it, expect } from 'vitest';
import { GitHub } from '../js/github.js';

describe('GitHub.validateResponse()', () => {
    const validData = {
        user: { login: 'DareDev256', public_repos: 16, avatar_url: 'https://example.com/avatar.png' },
        repos: [
            { name: 'repo-1', stargazers_count: 5, forks_count: 1, language: 'JavaScript', html_url: 'https://github.com/DareDev256/repo-1', description: 'A repo' }
        ],
        events: [
            { type: 'PushEvent', created_at: new Date().toISOString(), repo: { name: 'DareDev256/repo-1' }, payload: { commits: [{ message: 'init' }] } }
        ],
    };

    it('accepts valid API response shape', () => {
        expect(() => GitHub.validateResponse(validData)).not.toThrow();
    });

    it('rejects missing user object', () => {
        expect(() => GitHub.validateResponse({ ...validData, user: null })).toThrow('Invalid user data');
    });

    it('rejects user without login string', () => {
        expect(() => GitHub.validateResponse({ ...validData, user: { login: 42 } })).toThrow('Invalid user data');
    });

    it('rejects non-array repos', () => {
        expect(() => GitHub.validateResponse({ ...validData, repos: 'not-array' })).toThrow('Invalid repos data');
    });

    it('rejects non-array events', () => {
        expect(() => GitHub.validateResponse({ ...validData, events: {} })).toThrow('Invalid events data');
    });

    it('rejects repo entry without name string', () => {
        expect(() => GitHub.validateResponse({
            ...validData,
            repos: [{ name: 123 }],
        })).toThrow('Invalid repo entry');
    });

    it('rejects null repo entries', () => {
        expect(() => GitHub.validateResponse({
            ...validData,
            repos: [null],
        })).toThrow('Invalid repo entry');
    });
});
