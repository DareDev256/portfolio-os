/**
 * Vitest setup — polyfill localStorage for Node.js 22+
 *
 * Node 22 ships a built-in localStorage that conflicts with jsdom's.
 * The built-in uses property access, not getItem/setItem, so tests fail.
 * This replaces it with a spec-compliant in-memory implementation.
 */

const store = new Map();

globalThis.localStorage = {
    getItem(key) { return store.get(String(key)) ?? null; },
    setItem(key, value) { store.set(String(key), String(value)); },
    removeItem(key) { store.delete(String(key)); },
    clear() { store.clear(); },
    get length() { return store.size; },
    key(index) { return [...store.keys()][index] ?? null; },
};
