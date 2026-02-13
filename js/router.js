import { Desktop } from './desktop.js';

/**
 * Router
 * Client-side routing using History API
 * Maps routes to window opens
 */

export const Router = {
    routes: {
        '/': null,
        '/about': () => Desktop.openAbout(),
        '/work': () => Desktop.openApplications(),
        '/media': () => Desktop.openMediaVault(), // kept for backward compat — icon removed from desktop
        '/connect': () => Desktop.openContact(),
        '/contact': () => Desktop.openContact(),
        '/settings': () => Desktop.openSettings(),
        '/resume': () => Desktop.openResume(),
        '/terminal': () => Desktop.openShell(),
    },

    /**
     * Initialize router
     */
    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (_e) => {
            this.handleRoute(window.location.pathname);
        });

        // Handle initial route
        this.handleRoute(window.location.pathname);

        // Intercept link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link && !link.hasAttribute('target')) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });
    },

    /**
     * Navigate to a route
     */
    navigate(path) {
        if (!path || typeof path !== 'string' || !/^\/[\w/-]*$/.test(path)) {
            console.warn('[Router] Blocked invalid path:', path);
            return;
        }
        window.history.pushState({}, '', path);
        this.handleRoute(path);
    },

    /**
     * Handle route
     */
    handleRoute(path) {
        // Normalize path
        path = path === '' ? '/' : path;

        // Find matching route
        const handler = this.routes[path];

        if (handler) {
            handler();
        } else if (path !== '/') {
            // 404 - show a simple window
            console.warn(`Route not found: ${path}`);
        }
    },

    /**
     * Add a custom route
     */
    addRoute(path, handler) {
        this.routes[path] = handler;
    },
};
