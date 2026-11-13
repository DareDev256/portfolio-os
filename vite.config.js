import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { promoteStudio } from './tools/promote-studio.mjs';

// Four entries. Without this config Vite's default single-entry build would emit
// one page and silently drop the other three.
//
// Served paths are not source paths since 4.69.0: the studio is /, the Monitor
// /monitor. The why, and the swap itself, live in tools/promote-studio.mjs.
export default defineConfig({
    appType: 'mpa',
    plugins: [promoteStudio()],
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                os: resolve(import.meta.dirname, 'os/index.html'),
                coldopen: resolve(import.meta.dirname, 'coldopen/index.html'),
                studio: resolve(import.meta.dirname, 'studio/index.html'),
            },
        },
    },
});
