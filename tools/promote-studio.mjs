/* promote-studio.mjs: the studio is the home page (4.69.0).
 *
 * Imported by vite.config.js; kept out of it so the tests can load it without
 * pulling Vite (and esbuild) into the jsdom test environment.
 *
 * SERVED PATHS ARE NOT SOURCE PATHS (4.69.0). The studio took `/`:
 *   source studio/index.html  ->  served at /          (dist/index.html)
 *   source index.html         ->  served at /monitor   (dist/monitor/index.html)
 * The Monitor's source stays at the root on purpose: the nightly
 * system-snapshot job (passion-cron/system-snapshot.sh), tools/studio/make-feeds.mjs,
 * dump-layout and the hero-plate skill all edit or read `index.html` as the
 * Monitor, and moving the file would break each of them silently. The swap
 * happens once, in the bundle, below; dev and preview get the same paths from
 * the middleware, so every environment serves what production serves.
 * `/os` is the Passion OS desktop and `/coldopen` the method page (4.21.0).
 */
export const SERVED = { 'studio/index.html': 'index.html', 'index.html': 'monitor/index.html' };

/** Rename the emitted HTML so the studio is the home page and the Monitor sits at /monitor. */
export function promoteStudio() {
    const route = (req, _res, next) => {
        const [path, query = ''] = req.url.split('?');
        const q = query ? `?${query}` : '';
        if (path === '/' || path === '/index.html') req.url = `/studio/index.html${q}`;
        else if (path === '/monitor' || path === '/monitor/') req.url = `/index.html${q}`;
        next();
    };
    const preview = (req, _res, next) => {
        const [path, query = ''] = req.url.split('?');
        if (path === '/monitor') req.url = `/monitor/index.html${query ? `?${query}` : ''}`;
        next();
    };
    return {
        name: 'promote-studio',
        // Vite emits the HTML pages in its own generateBundle, so this runs after it.
        enforce: 'post',
        configureServer(server) { server.middlewares.use(route); },
        configurePreviewServer(server) { server.middlewares.use(preview); },
        generateBundle: {
            order: 'post',
            handler(_opts, bundle) {
                const moving = Object.entries(SERVED).map(([from, to]) => [bundle[from], to]);
                // Refuse rather than ship a site whose home page is the wrong one or missing.
                for (const [file] of moving) if (!file) this.error(`promote-studio: ${Object.keys(SERVED).join(', ')} must all be in the bundle`);
                for (const [from] of Object.entries(SERVED)) delete bundle[from];
                for (const [file, to] of moving) { file.fileName = to; bundle[to] = file; }
            },
        },
    };
}
