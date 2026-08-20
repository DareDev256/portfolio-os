import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Two entries, not one. `/` is the hiring surface (THE SYSTEM); the Passion OS
// desktop that used to own `/` now lives at `/os`. Without this config Vite's
// default single-entry build would emit the landing page and silently drop the
// OS, which is 3.76.0 of work.
export default defineConfig({
    appType: 'mpa',
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                os: resolve(import.meta.dirname, 'os/index.html'),
            },
        },
    },
});
