/**
 * Shared DOM Utilities
 * Centralizes duplicated patterns across desktop.js, github.js, and others.
 */
import { Sanitize } from './sanitize.js';

/* ── Page Visibility (single listener, replaces duplicate listeners) ── */
let _pageHidden = document.hidden;
/** @type {Set<(hidden: boolean) => void>} */
const _visibilitySubs = new Set();

document.addEventListener('visibilitychange', () => {
    _pageHidden = document.hidden;
    for (const cb of _visibilitySubs) cb(_pageHidden);
});

/** @returns {boolean} True when the tab is backgrounded */
export function isPageHidden() { return _pageHidden; }

/**
 * Subscribe to page visibility changes with separate hide/show callbacks.
 * Piggybacks on the single shared visibilitychange listener instead of
 * adding redundant DOM listeners per module.
 * @param {() => void} onHide  - Called when tab becomes hidden
 * @param {() => void} onShow  - Called when tab becomes visible
 * @returns {() => void} Unsubscribe function (call in destroy/cleanup)
 */
export function onVisibilityChange(onHide, onShow) {
    const handler = (hidden) => { hidden ? onHide() : onShow(); };
    _visibilitySubs.add(handler);
    return () => { _visibilitySubs.delete(handler); };
}

/* ── Reduced Motion ── */
const _REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** @returns {boolean} True when the user prefers reduced motion */
export function prefersReducedMotion() {
    return window.matchMedia(_REDUCED_MOTION_QUERY).matches;
}

/**
 * Combined desktop-only guard: skip when user prefers reduced motion
 * OR is on a coarse-pointer (touch) device.
 * Replaces the identical two-line check duplicated in 7+ visual effect inits.
 * @returns {boolean} True when desktop visual effects should be skipped
 */
export function shouldSkipDesktopEffects() {
    return prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Create a decorative (aria-hidden) DOM element.
 * Replaces the createElement → className → setAttribute('aria-hidden', 'true')
 * three-liner duplicated in 10+ visual effect modules.
 * @param {string} tag - HTML tag name (or SVG tag when namespace is provided)
 * @param {string} [className] - CSS class name(s)
 * @param {string} [namespace] - XML namespace (use 'http://www.w3.org/2000/svg' for SVG)
 * @returns {Element}
 */
export function createDecorativeEl(tag, className, namespace) {
    const el = namespace
        ? document.createElementNS(namespace, tag)
        : document.createElement(tag);
    if (className) el.className = className;
    el.setAttribute('aria-hidden', 'true');
    return el;
}

/**
 * Get the center point of a DOM element relative to the viewport.
 * Replaces the identical `getBoundingClientRect → left + width/2` pattern
 * duplicated in 8+ modules (neural-link, phantom-reticle, icon-tilt, etc.).
 * @param {Element} el - DOM element
 * @returns {{ x: number, y: number }} Center point in viewport coordinates
 */
export function getElementCenter(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Default fetch timeout — prevents indefinitely hanging requests from freezing the UI */
const DEFAULT_FETCH_TIMEOUT = 8_000; // 8 seconds

/**
 * Fetch with automatic AbortController timeout.
 * Prevents frozen interfaces when APIs are slow or unreachable.
 * Wraps native fetch — drop-in replacement with timeout protection.
 * @param {string|Request} input - URL or Request
 * @param {RequestInit & { timeout?: number }} init - fetch options + optional timeout (ms)
 * @returns {Promise<Response>}
 */
export function fetchWithTimeout(input, init = {}) {
    const { timeout = DEFAULT_FETCH_TIMEOUT, signal: externalSignal, ...rest } = init;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    // If caller also passes an AbortSignal, respect it
    if (externalSignal) {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    return fetch(input, { ...rest, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Load a boolean flag from localStorage ('1'/'0' convention).
 * Replaces the duplicated `(localStorage.getItem(k) ?? 'd') === '1'` pattern
 * found across Aurora, FX, AudioFX, and Glyphs modules.
 * @param {string} key - localStorage key
 * @param {boolean} fallback - Value when key is absent (default true)
 * @returns {boolean}
 */
export function loadBool(key, fallback = true) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === '1';
}

/**
 * Persist a boolean flag to localStorage as '1'/'0'.
 * Companion to {@link loadBool}.
 * @param {string} key - localStorage key
 * @param {boolean} value - Boolean to persist
 */
export function saveBool(key, value) {
    try {
        localStorage.setItem(key, value ? '1' : '0');
    } catch { /* quota exceeded — non-critical */ }
}

/**
 * Safely parse a JSON value from localStorage.
 * Replaces 6 inconsistent try/catch patterns scattered across the codebase.
 * @param {string} key - localStorage key
 * @param {*} fallback - Value returned on missing key or parse failure
 * @returns {*} Parsed value or fallback
 */
export function loadJSON(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const parsed = JSON.parse(raw);
        // Strip prototype-pollution keys (__proto__, constructor, prototype).
        // localStorage data can originate from user-imported backups containing
        // crafted keys that modify Object.prototype when assigned to app state.
        if (parsed && typeof parsed === 'object') {
            Sanitize.stripDangerousKeys(parsed);
        }
        return parsed;
    } catch {
        return fallback;
    }
}

/**
 * Serialize a value to JSON and persist it in localStorage.
 * Handles QuotaExceededError gracefully instead of throwing.
 * @param {string} key - localStorage key
 * @param {*} value - Value to serialize
 * @returns {boolean} True if write succeeded, false on quota/error
 */
export function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`[saveJSON] Failed to write "${key}":`, e.name, e.message);
        return false;
    }
}

/**
 * Trigger a JSON file download in the browser.
 * Replaces 6 identical stringify→Blob→anchor→click→revoke sequences in admin.js.
 * @param {*} data - Value to serialize as JSON
 * @param {string} filename - Download filename (e.g. 'projects.json')
 */
export function downloadJSON(data, filename) {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Safely open an external link with noopener/noreferrer to prevent tabnapping.
 * Only allows http: and https: URLs — blocks javascript:, data:, vbscript:, etc.
 * Replaces bare window.open(url, '_blank') calls throughout the codebase.
 */
export function openExternal(url) {
    if (!url || typeof url !== 'string') return;
    // Cap URL length — legitimate URLs are well under 2KB; longer strings are
    // either malformed or attack payloads (CWE-400)
    if (url.length > 2048) return;
    // Strip control characters that could obfuscate the protocol
    // eslint-disable-next-line no-control-regex
    const cleaned = url.replace(/[\x00-\x1f\x7f]/g, '').trim();
    // Allowlist: only http(s) protocols
    if (!/^https?:\/\//i.test(cleaned)) return;
    window.open(cleaned, '_blank', 'noopener,noreferrer');
}

/**
 * Check whether a DOM element is visible (not hidden by CSS).
 * Handles the offsetParent gotcha: position:fixed/sticky elements return null
 * for offsetParent even when fully visible. Falls back to getComputedStyle
 * only when offsetParent is null, keeping the fast path fast.
 * @param {Element} el - DOM element to check
 * @returns {boolean} True if the element is rendered and visible
 */
export function isElementVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    // Fast path: offsetParent is non-null → element is in layout
    if (el.offsetParent !== null) return true;
    // offsetParent is null for: display:none, fixed/sticky, or <body>/<html>
    const style = getComputedStyle(el);
    // display:none → not visible regardless of position
    if (style.display === 'none') return false;
    // visibility:hidden → takes space but not rendered
    if (style.visibility === 'hidden') return false;
    // position:fixed or sticky with non-none display → visible
    return style.position === 'fixed' || style.position === 'sticky';
}

/**
 * Check whether a DOM element intersects the current viewport.
 * Uses getBoundingClientRect for synchronous, frame-accurate checks.
 * For scroll-triggered animations prefer IntersectionObserver instead.
 * @param {Element} el - DOM element to check
 * @returns {boolean} True if any part of the element is in the viewport
 */
export function isInViewport(el) {
    if (!el || !(el instanceof Element)) return false;
    const rect = el.getBoundingClientRect();
    return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Create a DOM element with optional class and text content.
 * Replaces identical helpers duplicated in sticky-notes.js and pomodoro-timer.js.
 * @param {string} tag - HTML tag name
 * @param {string} [cls] - CSS class name(s)
 * @param {string} [text] - Text content
 * @returns {HTMLElement}
 */
export function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
}

/* ── Viewport Reveal System ── */

/**
 * Create a scroll-triggered reveal system for elements inside `.window-content`
 * containers. Centralizes the identical pattern duplicated across scroll-reveal.js
 * and gauntlet.js: WeakSet dedup → IntersectionObserver → MutationObserver wiring
 * → windowsContainer auto-init.
 *
 * @param {object} opts
 * @param {string} opts.selector  - CSS selector for reveal targets (e.g. '.scroll-reveal')
 * @param {string} opts.activeClass - Class added when target enters viewport
 * @param {number} [opts.threshold=0.15] - IntersectionObserver threshold
 * @param {(entry: IntersectionObserverEntry) => void} [opts.onReveal] - Extra callback per reveal
 * @returns {{ init(): void, observe(container: Element): void }}
 */
export function createRevealSystem({ selector, activeClass, threshold = 0.15, onReveal }) {
    const observed = new WeakSet();

    function makeObserver(root) {
        return new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(activeClass);
                        if (onReveal) onReveal(entry);
                    }
                }
            },
            { root, threshold },
        );
    }

    function wire(container) {
        if (observed.has(container)) return;
        observed.add(container);

        const observer = makeObserver(container);
        container.querySelectorAll(selector).forEach((el) => observer.observe(el));

        new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.classList?.contains(selector.slice(1))) observer.observe(node);
                    node.querySelectorAll?.(selector).forEach((el) => observer.observe(el));
                }
            }
        }).observe(container, { childList: true, subtree: true });
    }

    return {
        init() {
            const wc = document.getElementById('windowsContainer');
            if (!wc) return;

            wc.querySelectorAll('.window-content').forEach(wire);

            new MutationObserver((mutations) => {
                for (const m of mutations) {
                    for (const node of m.addedNodes) {
                        if (node.nodeType !== 1) continue;
                        const content = node.classList?.contains('window-content')
                            ? node
                            : node.querySelector?.('.window-content');
                        if (content) wire(content);
                    }
                }
            }).observe(wc, { childList: true, subtree: true });
        },
        observe(container) {
            if (container) wire(container);
        },
    };
}

/* ── Color Utilities ── */

/**
 * Convert a 0–1 opacity float to a 2-digit hex string for CSS color suffixes.
 * Replaces the duplicated `Math.floor(v * 255).toString(16).padStart(2, '0')`
 * expression scattered across cursor-reactive effects.
 * @param {number} opacity - Value between 0 and 1
 * @returns {string} Two-character hex string (e.g. '4d', 'ff')
 */
export function hexAlpha(opacity) {
    return Math.floor(Math.max(0, Math.min(1, opacity)) * 255)
        .toString(16)
        .padStart(2, '0');
}

/* ── Window Transition Presets ── */

/**
 * Preset configurations for window transition animations.
 * Each preset defines initial styles, target styles, transition timing,
 * and callback delay — parameterizing the identical structure previously
 * duplicated across materializeWindow, dematerializeWindow, minimizeWindow.
 * @type {Record<string, object>}
 */
const WINDOW_PRESETS = {
    materialize: {
        initial: { opacity: '0', transform: 'scale(0.8)', filter: 'blur(10px)' },
        target:  { opacity: '1', transform: 'scale(1)',   filter: 'blur(0px)' },
        transition: 'all var(--duration-slow) var(--ease-spring)',
        delay: 400,
        deferred: true, // apply target in rAF for browser to paint initial state
    },
    dematerialize: {
        initial: null, // no initial styles — starts from current state
        target:  { opacity: '0', transform: 'scale(0.9)', filter: 'blur(5px)' },
        transition: 'all var(--duration-slow) var(--ease-snap)',
        delay: 300,
        deferred: false,
    },
    minimize: {
        initial: null,
        target:  { opacity: '0' }, // transform set dynamically
        transition: 'all var(--duration-slow) var(--ease-decel)',
        delay: 350,
        deferred: false,
    },
};

/**
 * Animate a window element using a named transition preset.
 * Consolidates materializeWindow / dematerializeWindow / minimizeWindow
 * into a single parameterized entry point.
 *
 * @param {HTMLElement} windowElement - The window DOM element
 * @param {'materialize'|'dematerialize'|'minimize'} preset - Named preset
 * @param {Function} [callback] - Called after the transition's delay
 * @param {object} [overrides] - Extra style properties merged into target
 */
export function transitionWindow(windowElement, preset, callback, overrides) {
    const p = WINDOW_PRESETS[preset];
    if (!p) return;

    // Apply initial styles (e.g. materialize starts invisible)
    if (p.initial) Object.assign(windowElement.style, p.initial);

    const applyTarget = () => {
        windowElement.style.transition = p.transition;
        Object.assign(windowElement.style, p.target);
        if (overrides) Object.assign(windowElement.style, overrides);
        if (callback) setTimeout(callback, p.delay);
    };

    // Deferred presets use rAF so the browser paints initial state first
    if (p.deferred) {
        requestAnimationFrame(applyTarget);
    } else {
        applyTarget();
    }
}

/* ── Shared Palette ── */

/**
 * Canonical gold/amethyst RGB palette for desktop visual effects.
 * Single source of truth — previously duplicated in ambient-drift.js,
 * pulse-grid.js, and referenced via CSS vars in neural-link.js.
 */
export const PALETTE = {
    GOLD:     { r: 212, g: 175, b: 55 },
    AMETHYST: { r: 139, g: 92,  b: 246 },
};

/* ── Desktop Canvas Bootstrap ── */

/**
 * Shared pointer-position tracker for canvas effects.
 * Returns a reactive `mouse` object and wires pointermove/pointerleave
 * on `document` — replacing the identical 4-line pattern in ambient-drift
 * and pulse-grid.
 *
 * @returns {{ mouse: { x: number, y: number }, destroy: () => void }}
 */
export function createPointerTracker() {
    const mouse = { x: -9999, y: -9999 };
    const onMove  = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = ()  => { mouse.x = -9999; mouse.y = -9999; };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);
    return {
        mouse,
        destroy() {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerleave', onLeave);
        },
    };
}

/**
 * Shared canvas init for desktop ambient effects.
 * Creates a DPR-aware canvas, appends it to `#desktop` (or body),
 * wires the resize listener, and returns `{ canvas, ctx }`.
 *
 * Collapses the 8-line init ceremony duplicated across ambient-drift,
 * pulse-grid, and any future canvas-based desktop overlays.
 *
 * @param {string} className - CSS class name for the canvas element
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }}
 */
export function initDesktopCanvas(className) {
    const canvas = createDecorativeEl('canvas', className);
    const ctx = canvas.getContext('2d');
    const desktop = document.getElementById('desktop');
    (desktop || document.body).appendChild(canvas);
    resizeCanvasDPR(canvas, ctx);
    window.addEventListener('resize', () => resizeCanvasDPR(canvas, ctx));
    return { canvas, ctx };
}

/* ── Canvas & Animation Utilities ── */

/**
 * DPR-aware canvas resize. Replaces the identical 4-line pattern
 * duplicated in aurora.js, fx.js, and other canvas modules.
 * Caps DPR at 2 to avoid GPU over-draw on high-density displays.
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 */
export function resizeCanvasDPR(canvas, ctx) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Bootstrap a canvas-based visual effect module with the shared lifecycle:
 * canvas creation → loadBool toggle state → throttled loop → DPR resize.
 *
 * Eliminates the identical init / setEnabled / toggle / clear boilerplate
 * duplicated across Aurora, FX, and any future full-screen canvas effect.
 * The module only needs to define `_frame()` for its per-frame work.
 *
 * @param {object} mod - Target module object (mutated in place)
 * @param {string} storageKey - localStorage key for the enabled toggle
 * @param {object} [opts]
 * @param {boolean} [opts.defaultEnabled=true] - Initial state when no saved pref
 * @param {number}  [opts.minInterval=33.3]    - Min ms between frames (~30fps)
 * @param {string}  [opts.canvasClass='fx-canvas'] - CSS class for the canvas
 * @param {number}  [opts.zIndex]              - Optional z-index override
 * @param {object}  [opts.contextOptions]      - getContext options (e.g. { alpha: true })
 */
export function bootstrapCanvasEffect(mod, storageKey, {
    defaultEnabled = true,
    minInterval = 33.3,
    canvasClass = 'fx-canvas',
    zIndex,
    contextOptions,
} = {}) {
    mod.enabled = loadBool(storageKey, defaultEnabled);

    mod.canvas = document.createElement('canvas');
    mod.canvas.className = canvasClass;
    if (zIndex != null) mod.canvas.style.zIndex = String(zIndex);
    mod.ctx = mod.canvas.getContext('2d', contextOptions);
    document.body.appendChild(mod.canvas);

    mod._loop = createThrottledLoop(() => mod._frame(), {
        isEnabled: () => mod.enabled,
        minInterval,
    });

    resizeCanvasDPR(mod.canvas, mod.ctx);
    window.addEventListener('resize', () => resizeCanvasDPR(mod.canvas, mod.ctx));

    if (mod.enabled) mod._loop.start();
}

/**
 * Shared setEnabled / toggle / clear for canvas effect modules.
 * Pairs with {@link bootstrapCanvasEffect} — call `setEnabled` on any
 * module that was bootstrapped, and it handles persist + loop lifecycle.
 *
 * @param {object} mod - The bootstrapped module
 * @param {string} storageKey - Same key passed to bootstrapCanvasEffect
 * @param {boolean} v - New enabled state
 */
export function setCanvasEffectEnabled(mod, storageKey, v) {
    mod.enabled = !!v;
    saveBool(storageKey, mod.enabled);
    if (mod.enabled) mod._loop.start();
    else mod.clear();
}

/**
 * Create a throttled requestAnimationFrame loop with page-visibility gating.
 * Replaces the identical loop() boilerplate duplicated in aurora.js and fx.js:
 * cancel → enabled check → hidden check → frame-rate cap → work → recurse.
 *
 * @param {() => void} callback  - Frame work function
 * @param {object} opts
 * @param {() => boolean} opts.isEnabled - Return false to stop the loop
 * @param {number} [opts.minInterval=33.3] - Minimum ms between frames (~30fps default)
 * @returns {{ start(): void, stop(): void }} Loop controller
 */
export function createThrottledLoop(callback, { isEnabled, minInterval = 33.3 } = {}) {
    let rafId = 0;
    let lastFrame = 0;

    function tick() {
        rafId = 0;
        if (isEnabled && !isEnabled()) return;
        if (isPageHidden()) { rafId = requestAnimationFrame(tick); return; }
        const now = performance.now();
        if (now - lastFrame < minInterval) { rafId = requestAnimationFrame(tick); return; }
        lastFrame = now;
        callback();
        rafId = requestAnimationFrame(tick);
    }

    return {
        start() { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); },
        stop()  { cancelAnimationFrame(rafId); rafId = 0; },
    };
}

/**
 * Animate a number counter from 0 to target over a duration.
 * Returns the interval ID so callers can cancel if needed.
 * @param {HTMLElement} element - Element whose textContent is updated
 * @param {number} target - Final counter value
 * @param {number} [duration=1500] - Animation duration in ms
 * @returns {number} Interval ID
 */
export function animateCounter(element, target, duration = 1500) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
    return timer;
}
