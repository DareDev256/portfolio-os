import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Three entries. `/` is the hiring surface (THE SYSTEM), the Passion OS desktop
// that used to own `/` now lives at `/os`, and `/coldopen` is the method page
// added in 4.21.0. Without this config Vite's default single-entry build would
// emit the landing page and silently drop the other two.
export default defineConfig({
    appType: 'mpa',
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                os: resolve(import.meta.dirname, 'os/index.html'),
                coldopen: resolve(import.meta.dirname, 'coldopen/index.html'),
            },
        },
    },
});
