import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadData, invalidateData, loadMedia, loadProjects } from '../js/data-loader.js';

describe('loadData()', () => {
    beforeEach(() => {
        localStorage.clear();
        // Invalidate all cached keys between tests
        invalidateData('media.json');
        invalidateData('projects.json');
        invalidateData('test.json');
        vi.restoreAllMocks();
    });

    it('returns localStorage override when present', async () => {
        const data = { images: [{ url: 'a.jpg' }], videos: [] };
        localStorage.setItem('test.json', JSON.stringify(data));
        const result = await loadData('test.json', null);
        expect(result).toEqual(data);
    });

    it('fetches from network when localStorage is empty', async () => {
        const payload = [{ name: 'project' }];
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(payload),
        });
        const result = await loadData('test.json', []);
        expect(result).toEqual(payload);
        expect(fetch).toHaveBeenCalledWith('data/test.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    });

    it('returns fallback when fetch fails', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = await loadData('test.json', 'fallback-value');
        expect(result).toBe('fallback-value');
    });

    it('returns fallback when HTTP status is not ok', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 });
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = await loadData('test.json', []);
        expect(result).toEqual([]);
    });

    it('caches results — second call does not re-fetch', async () => {
        const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ cached: true }),
        });
        const first = await loadData('test.json');
        const second = await loadData('test.json');
        expect(first).toEqual(second);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('invalidateData() forces re-fetch on next call', async () => {
        const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ v: 1 }),
        });
        await loadData('test.json');
        expect(spy).toHaveBeenCalledTimes(1);

        invalidateData('test.json');
        spy.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ v: 2 }),
        });
        const result = await loadData('test.json');
        expect(result).toEqual({ v: 2 });
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('returns fallback when localStorage has invalid JSON', async () => {
        localStorage.setItem('test.json', '{broken');
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = await loadData('test.json', 'safe');
        expect(result).toBe('safe');
    });
});

describe('loadMedia()', () => {
    beforeEach(() => {
        localStorage.clear();
        invalidateData('media.json');
        vi.restoreAllMocks();
    });

    it('returns default shape on failure', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = await loadMedia();
        expect(result).toEqual({ images: [], videos: [] });
    });
});

describe('loadProjects()', () => {
    beforeEach(() => {
        localStorage.clear();
        invalidateData('projects.json');
        vi.restoreAllMocks();
    });

    it('returns empty array on failure', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = await loadProjects();
        expect(result).toEqual([]);
    });
});
