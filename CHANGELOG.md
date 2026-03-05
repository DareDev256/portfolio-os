# Passion OS - Development Changelog

---

title: Passion OS Changelog
version: 3.31.1
last_updated: 2026-03-05

---

<!-- AI Context: Complete development history organized by phases.
     Related files: All js/*.js, css/*.css
     See: DOCUMENTATION.md for usage, FEATURE_VERIFICATION.md for testing -->

## Overview

This changelog documents the evolutionary development of Passion OS from initial concept to current state. Features are organized by implementation phases with the newest changes first.

---

## [3.31.1] — 2026-03-05

### Security
- **Fetch timeout hardening** — Added `fetchWithTimeout` utility (AbortController-based, 8s default) to `dom-helpers.js`. Applied to GitHub API (3 parallel requests), Weather API, and DataLoader fetches. Prevents indefinitely frozen interfaces when external APIs are slow or unreachable.
- **CSP tightening** — Removed stale `https://*.trycloudflare.com` wildcard from `connect-src` directive in `vercel.json`. This wildcard allowed any trycloudflare subdomain as a valid connect target — a potential data exfiltration vector. Only `passion-api.jamesdare.com` is now permitted.
- **Consistent sanitization** — Replaced raw `innerHTML` in GitHub error render path with `Sanitize.setHTML()` for defense-in-depth consistency.

---

## [3.31.0] — 2026-03-04

### Fixed
- **YouTube showcase embed** — Removed overly restrictive `sandbox` attribute from YouTube iframes that caused "refused to connect" errors. YouTube-nocookie.com embeds work correctly now.
- **Resume PDF viewer** — Removed `sandbox` attribute from resume iframe that prevented PDF from loading properly, causing the site to reload instead.
- **Settings gear SVG** — Fixed broken diagonal tooth geometry (asymmetric paths and incorrect rotation transforms). All 8 teeth now render symmetrically.
- **Version sync** — Fixed stale v3.10.0 in HTML title and top bar (was out of sync with package.json).

### Added
- **Passion.AI custom SVG icon** — Replaced emoji 🤖 desktop icon with a purpose-built SVG featuring heart emblem, hexagonal frame, circuit traces, and orbit rings matching the cyberpunk theme.
- **Passion Chat "My Site" link** — Added a styled link to passion.jamesdare.com in the Passion Chat window so visitors can explore Passion's own site.
- **Mood display in status indicator** — The bottom-right status pill now shows Passion's current mood alongside her state (e.g., "Passion is crunching code · focused").

---

## [3.30.0] — 2026-02-27

### Changed
- **Data-driven DOM generation** — Extracted `openAbout()` skill badges (12 items), `openResume()` stat cards (4 items) and skill bars (4 items) from copy-pasted HTML blocks into declarative data arrays with `.map()` loops. Adding or removing entries is now a one-line table change.
- **CSS custom property badges** — Replaced 12 inline-style skill badge divs in About with a single `.about-skill-badge` class using `--badge-color` custom property and `color-mix()` for dynamic background/border tinting.
- **Application showcase semantic CSS** — Replaced inline `style.cssText` category headers with `.app-category-header` class using `--cat-color` custom property. Replaced inline badge/button styles with `.app-status-badge--live`, `.app-status-badge--source`, and `.app-launch-btn--live` classes.
- **About window structure** — Extracted inline styles into semantic CSS classes (`.about-identity`, `.about-bio`, `.about-skills-grid`, `.about-skill-badge`, `.about-label`, `.text-cyan`).

---

## [3.29.0] — 2026-02-24

### Added
- **Glimmer sweep hover effect** — Diagonal gold-to-amethyst light sweep triggered on hover for portfolio cards, project cards, portfolio links, and dock icons. Uses a `::after` pseudo-element with `skewX(-15deg)` diagonal gradient, GPU-composited `translateX` animation, and `ease-decel` fade-out on mouse-leave. Expanded project cards suppress the sweep to avoid visual conflict with lab notes. Reduced-motion users get a static soft overlay instead of animation.

---

## [3.28.2] — 2026-02-24

### Security
- **YouTube privacy-enhanced embeds** — Switched all YouTube iframes from `youtube.com` to `youtube-nocookie.com` to eliminate third-party cookie tracking and Chrome deprecation warnings.
- **CSP frame-src hardened** — Updated Content-Security-Policy to only allow `youtube-nocookie.com` (blocking regular `youtube.com` embeds), added `img.youtube.com` to `img-src` for thumbnail loading.
- **Resume PDF iframe sandboxed** — Added `sandbox="allow-scripts allow-same-origin"` to the resume PDF viewer iframe, preventing unrestricted top-navigation and popup capabilities.
- **Referrer policy on all iframes** — Added `referrerpolicy="no-referrer"` to YouTube, Vimeo, and PDF iframes to prevent origin leakage to embedded providers.
- **Admin YouTube regex hardened** — Replaced permissive `[^"&?/ ]{11}` character class with strict `[a-zA-Z0-9_-]{11}` to match lightbox's validated pattern, blocking special characters in video IDs.
- **Lazy loading on iframes** — Added `loading="lazy"` to defer iframe connections until visible, reducing unnecessary network exposure on page load.

### Added
- **6 new security tests** — Privacy-enhanced embed URL validation, admin regex hardening tests, and nocookie domain enforcement assertions.

---

## [3.28.1] — 2026-02-24

### Added
- **Research doc: The Two-Week Boomerang** (`docs/research-cursor-poach-boomerang.md`) — Competitive intelligence analysis documenting how Cursor (Anysphere) poached Claude Code's lead engineer Boris Cherny and product manager Cat Wu, only for Anthropic to hire both back within fourteen days. Covers the "wrapper vs. platform" tension in AI tooling, the "80% of Anthropic's code is written by Claude" datapoint, and what the boomerang reveals about Claude Code's strategic weight. Includes sourced timeline table, market context, and implications for anyone building on top of model providers.
- **README docs table** — Added entries for the Bloomberg Terminal analogy and the Cursor poach boomerang research documents.

---

## [3.28.0] — 2026-02-23

### Changed
- **Data-driven init architecture** (`js/main.js`) — Refactored the 260-line monolithic `init()` function into a declarative, table-driven architecture. Visual module initialization (Aurora, Glyphs, AudioFX) now loops over a `VISUAL_MODULES` registry instead of 3 copy-pasted init/setEnabled/addEventListener blocks. Keyboard shortcuts use a `SHORTCUT_MAP` lookup table replacing 4 chained `if` statements. Control panel toggle wiring uses a `CONTROL_TOGGLES` config array that drives both DOM generation and event binding, eliminating 6 repeated `getElementById` calls. Extracted `recoverStyles()`, `initShortcuts()`, and `initControlPanel()` as focused single-responsibility functions. Adding a new visual module, shortcut, or settings toggle is now a one-line table entry — zero structural code changes required.

---

## [3.27.0] — 2026-02-23

### Added
- **Parallax depth engine** (`js/parallax.js`) — New cinematic depth system with two interaction modes. Lock screen responds to mouse position across 4 depth layers (grid background, watermark wheel, title block, identity block) with independent parallax factors. Desktop mode shifts the background wheel based on scroll position within any open window, using MutationObserver to auto-attach to dynamically-created windows. Engine uses rAF with lerp smoothing (factor 0.08) for silky 60fps interpolation, `will-change: translate` GPU hints on all parallax elements, and fully respects `prefers-reduced-motion`. Includes cleanup/destroy method.

---

## [3.26.0] — 2026-02-23

### Changed
- **Motion easing design tokens** — Extracted 6 semantic easing function tokens (`--ease-spring`, `--ease-decel`, `--ease-accel`, `--ease-snap`, `--ease-elastic`, `--ease-press`) and 5 duration tokens (`--duration-instant` through `--duration-dramatic`) into `variables.css`. Replaced 14 hardcoded `cubic-bezier()` values across 8 CSS files (`styles.css`, `interactions.css`, `glass.css`, `passion.css`, `welcome.css`, `command-palette.css`, `shortcuts-overlay.css`, `variables.css`) with token references. Existing `--transition-*` shorthands now compose from the new tokens for backward compatibility. Enables site-wide motion tuning from a single location.

---

## [3.25.2] — 2026-02-23

### Fixed
- **Window z-index stacking overflow** — Windows no longer breach reserved UI tiers (top bar, dock, modals) during prolonged use. Added ceiling-bounded z-index management (`WINDOW_Z_CEILING = 899`) with automatic normalization that compacts all window z-indices back to base range while preserving relative stacking order. Raised top bar and dock to `z-index: 900` so they always render above windows. Added 2 tests for ceiling enforcement and order-preserving normalization.

---

## [3.25.1] — 2026-02-22

### Added
- **Research: Bloomberg Terminal analogy** — New analysis document (`docs/research-bloomberg-terminal-analogy.md`) framing Claude Code, Cursor, and Windsurf as the Bloomberg Terminals of software engineering. Maps the finance paradigm shift (information access → speed of interpretation) onto the developer tooling shift (knowing the codebase → knowing what to build). Cross-references the existing Anthropic marketing case study. Updated docs index with new Research & Analysis section.

---

## [3.25.0] — 2026-02-22

### Added
- **Lab Notes: click-to-reveal project diagnostics** — Each project card in the Applications window now has a hidden "Lab Notes" panel. Click any card to expand a diagnostic overlay showing project status (live/archived indicator), tech stack count, and classification tags. Features a gold scan-line animation on reveal, gold accent border draw, and accordion behavior (one panel open at a time). Inspired by Stark's lab blueprint aesthetic — makes browsing projects feel like inspecting classified tech specs.

---

## [3.24.0] — 2026-02-22

### Changed
- **Glass material token alignment** — Corrected `--glass-bg`, `--glass-bg-dense`, `--glass-bg-light`, and `--glass-blur` tokens in `variables.css` to match the actual rendered values in `glass.css`, closing a drift where the tokens and implementations had diverged
- **Glass classes use token references** — `.glass`, `.glass-dense`, `.glass-light` now reference `var(--glass-*)` tokens instead of hardcoded rgba/blur values, making the entire glass system configurable from one file
- **Added `--glass-blur-dense` token** — New intermediate blur tier for `.glass-dense` panels, previously only available as a hardcoded value
- **HUD accent token system** — Introduced `--hud-cyan-50/40/30/15/12` and `--hud-purple-15` opacity-variant tokens for the 20+ hardcoded `rgba(0, 240, 255, ...)` values used across HUD brackets, markers, orbit rings, scan rings, and mini bars
- **HUD bracket tokenization** — All `.hud-brackets`, `.hud-bracket-tr`, `.hud-bracket-bl`, `.hud-marker`, `.hud-scan-ring`, `.hud-orbit-ring`, `.hud-mini-bar`, and `.hud-readout` classes now reference centralized tokens instead of raw rgba values
- **Font token consistency** — `.hud-readout` font-family now references `var(--font-mono)` instead of a hardcoded font stack

**Files Modified**: `css/variables.css`, `css/glass.css`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.23.0] — 2026-02-22

### Changed
- **Design token elevation** — Centralized gold (`--gold`, `--gold-light`, `--gold-dim`) and amethyst (`--amethyst`, `--amethyst-dim`) accent colors into `variables.css` design tokens, replacing 8 hardcoded hex values across `portfolio.css`
- **Gold glow system** — Added `--glow-gold-sm/md` and `--glow-amethyst-sm/md` to the shared glow token set for consistent luxury accent effects
- **Holographic border refinement** — Introduced warm gold stop into the `conic-gradient` rotation on `.holo-border`, `.holo-border-bright`, and `.holo-line-bottom`, shifting the signature visual from pure cyberpunk to luxury tech
- **Portfolio card hover** — Cards now reveal gold-tinted borders and title text on hover, with a subtle gold text-shadow glow, matching the Purple Reign gilded typography system
- **Token consistency** — Reign hero glitch layers, caret color, live link accents, and gilded shimmer gradient all reference centralized tokens instead of raw hex values

**Files Modified**: `css/variables.css`, `css/glass.css`, `css/portfolio.css`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.22.1] — 2026-02-21

### Added
- **Research doc: Anthropic Claude Code Marketing Ops** — Case study documenting how Anthropic's growth marketing team (Austin Lau, single non-technical operator) built four production systems with Claude Code: Google Ads copy generator with sub-agent architecture, Figma batch creative plugin (10× output), Meta Ads MCP server, and self-improving A/B test memory system. Includes metrics, architecture patterns, and relevance to Passion Agent's own automation design

**Files Modified**: `docs/anthropic-claude-code-marketing-ops.md` (new), `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.22.0] — 2026-02-20

### Added
- **CodeViewer component** — Zero-dependency syntax-highlighted code panel with regex-based JS tokenizer, copy-to-clipboard with gold visual feedback, and scroll-triggered reveal animation. Uses a curated dark-luxury palette (purple keywords, gold strings, cyan function names) matching the Purple Reign aesthetic
- **Code snippets in Purple Reign showcase** — Each of the 5 featured projects now displays a representative code snippet within the cinematic scroll chapters, giving technical visitors an immediate feel for the codebase

**Files Modified**: `js/code-viewer.js` (new), `css/code-viewer.css` (new), `js/desktop.js`, `index.html`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.21.1] — 2026-02-20

### Fixed
- **Shell command crashes** — `photos` and `videos` terminal commands called non-existent `Desktop.openPhotos()` and crashed on `openVideos()` accessing `.icon` on undefined `DESKTOP_ITEMS` entry. Both now route to `openMediaVault()` correctly
- **Toast hover timer desync** — Hovering a notification then mousing away used a hardcoded `duration / 2` timeout instead of tracking actual remaining time, allowing toasts to be kept alive indefinitely by repeated hovering and desyncing the progress bar from the dismiss timer
- **Loader progress interval leak** — `PixelLoader.simulateProgress()` stored its `setInterval` in a local variable that `destroy()` couldn't reach. Early destroy left an orphaned timer calling methods on removed DOM elements
- **Alert modal keyboard accessibility** — Alert modals had no keyboard handler (unlike prompt modals), trapping keyboard-only users. Added Enter/Escape dismiss with auto-focus on the OK button

**Files Modified**: `js/desktop.js`, `js/notifications.js`, `js/loader.js`, `js/modal.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.21.0] — 2026-02-19

### Added
- **Amethyst Code hero reveal** — Full-screen cinematic intro for the Purple Reign portfolio showcase. A metallic purple glitch effect (CSS `clip-path` + chromatic split pseudo-elements in gold and purple) fractures on scroll entry, then resolves to reveal the "PURPLE REIGN" title with a breathing glow. Tagline types in with a blinking caret. Scroll hint fades in after the sequence completes
- **GPU-friendly glitch animation** — Uses `clip-path: inset()` with `steps(1)` timing for hard-cut glitch frames, keeping all animations compositor-friendly (transforms, opacity, clip-path)
- **Three-state reveal machine** — Hero transitions through idle → entered (glitch plays) → resolved (breathing glow), managed via IntersectionObserver + class toggling

**Files Modified**: `css/portfolio.css`, `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.20.0] — 2026-02-19

### Added
- **Forcefield reveal on portfolio chapters** — Chapters start blurred with a translucent purple veil (`::after` pseudo-element) that dissipates when the chapter scrolls into view via IntersectionObserver, evoking a Stark-lab forcefield powering down
- **Gilded title shimmer** — Chapter titles use `background-clip: text` with a gold gradient band that sweeps across once on reveal, creating a brief cinematic gold flash before settling back to white
- **Enhanced side accent animation** — The left-edge accent line expands and gains a colored glow when its chapter enters the viewport

**Files Modified**: `css/portfolio.css`, `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.19.1] — 2026-02-19

### Fixed
- **Portfolio observer leak on rapid close** — `openPortfolio()` defers IntersectionObserver setup via `requestAnimationFrame`, but if the window was closed before the rAF callback fired, `onClose` disconnected the observers first, then the rAF re-activated them by calling `.observe()` on disconnected instances. These zombie observers would persist with no way to disconnect. Added a `closed` guard flag checked before observer setup
- **`createLazyWindow` error path now uses `Sanitize.setHTML()`** — The error handler previously set structural HTML via raw `innerHTML`, bypassing the DOMPurify defense-in-depth layer added in v3.18.1. Error message content was already escaped via `Sanitize.text()`, but the surrounding HTML template was not routed through `Sanitize.setHTML()` like all other DOM injection paths

**Files Modified**: `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.19.0] — 2026-02-18

### Changed
- **Lightbox listener lifecycle refactored** — Document-level `keydown`, `mousemove`, and `mouseup` listeners are now attached only while the lightbox is open and detached on close. Previously these three listeners persisted for the entire page session, running handler checks on every keypress and mouse movement even when the lightbox was closed. Uses stable bound method references (`_boundKeydown`, `_boundMousemove`, `_boundMouseup`) created once during `initEvents()` for clean `addEventListener`/`removeEventListener` pairing
- **`createLazyWindow` error handling** — Dynamic `import()` failures now display a styled error message inside the window content area instead of silently leaving the window empty. Error text is sanitized through `Sanitize.text()` to prevent injection from crafted error messages
- **Removed duplicate `initEvents` JSDoc comment** in `lightbox.js` — zoom/pan state declarations now have their own descriptive comment block

**Files Modified**: `js/lightbox.js`, `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.18.1] — 2026-02-18

### Security
- **localStorage poisoning hardened across State module** — `setTheme()` and `setCursorTrailType()` now validate values against explicit allowlists before writing to `data-theme` attributes or emitting to CSS. Previously, a poisoned localStorage entry (e.g. from a temporary XSS) could inject arbitrary values into DOM attributes that persist across page loads. Both `init()` loaders also validate on read
- **`interactionIntensity` bounds-checked on load** — `parseInt()` result is now verified with `Number.isFinite()` and clamped to 0–100, preventing NaN propagation from corrupted localStorage
- **Data loader path traversal blocked** — `data-loader.js` now validates fetch keys through `Sanitize.safeKey()` before constructing `data/${key}` URLs. Blocks `../../etc/passwd`, `.env`, and protocol-prefixed strings that could escape the `data/` directory
- **Added `Sanitize.allowlist()` validator** — generic allowlist checker for any localStorage-sourced value that maps to a fixed set of options. Used by State for themes and cursor trail types
- **Added `Sanitize.safeKey()` validator** — identifier-safe string validator that allows only alphanumeric characters, hyphens, underscores, and dots. Blocks path traversal sequences (`..`), leading dots/slashes, and special characters
- **Closed stored XSS via folderIcons** — Media Vault folder icons from admin panel were stored raw and inserted via `innerHTML` without sanitization. A crafted icon string like `<img src=x onerror=alert(1)>` would execute when the Media Vault opened. Now routed through `Sanitize.text()`
- **Fixed attribute-context XSS in project tag filters** — `data-tag="${tag}"` was interpolated without attribute encoding, allowing tag values containing `"` to break out of the attribute and inject event handlers. Now uses `Sanitize.attr(tag)` for the attribute context
- **GitHub dashboard defense-in-depth** — `container.innerHTML = html` replaced with `Sanitize.setHTML(container, html)` to run the full assembled HTML through DOMPurify as a safety net, rather than relying solely on per-field escaping

### Added
- 10 new tests for `Sanitize.allowlist()` — covers valid values, invalid values, non-string input, and case sensitivity
- 7 new tests for `Sanitize.safeKey()` — covers valid filenames, path traversal, protocol handlers, special characters, and falsy input

**Test count**: 229 across 13 suites (up from 219)

**Files Modified**: `js/sanitize.js`, `js/state.js`, `js/data-loader.js`, `js/desktop.js`, `js/github.js`, `tests/sanitize.test.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.18.0] — 2026-02-18

### Added
- **Purple Reign cinematic project showcase** — Featured projects now display as full-height scroll-snap chapters inside the Portfolio window instead of a 2-column card grid. Each project is a "chapter" with staggered scroll-triggered reveal animations (via `IntersectionObserver`), a purple/gold accent system, and dot navigation on the right edge for quick jumping between projects. The design evokes a luxury lookbook — Prince's Purple Rain meets Tony Stark's lab
- **Scroll-snap chapter navigation** — Dot indicators on the right edge track the active chapter and allow click-to-jump navigation
- **Staggered entrance animations** — Chapter index, title, description, tech badges, and links animate in sequentially as each chapter scrolls into view

### Changed
- Portfolio window title updated from `FEATURED_PROJECTS` to `PURPLE REIGN // FEATURED`
- Project accent colors shifted from cyberpunk neons to a purple/violet/gold palette (`#8b5cf6`, `#c084fc`, `#a78bfa`, `#d4af37`, `#7c3aed`) to match the cinematic theme
- Portfolio window dimensions adjusted from 680×620 to 640×560 to emphasize vertical scroll immersion

---

## [3.17.1] — 2026-02-18

### Security
- **Admin save paths now sanitize URLs** — `saveProjects()` and `saveMedia()` write user-supplied `demo`, `repo`, media `url`, and `poster` fields through `Sanitize.url()` before persisting to localStorage. Previously, only the backup import path sanitized URLs; the manual save path wrote raw form input, allowing `javascript:` or `data:` URI injection via the admin panel that would execute when rendered in project cards or media vault
- **Theme color import validates hex format** — imported `themeColors` from backup JSON are now parsed and each value validated through `Sanitize.hexColor()` (strict `#RGB`/`#RRGGBB`/`#RRGGBBAA` regex). Previously accepted any string, enabling CSS injection payloads like `url(javascript:...)` or `expression()` when applied to CSS custom properties via `setProperty()`
- **Added `Sanitize.hexColor()` validator** — allowlist-based hex color validator that accepts only `#` + 3/4/6/8 hex digits. Returns a safe fallback for any non-matching input. Used by admin theme import to sanitize color values before they reach `document.documentElement.style.setProperty()`
- **`saveJSON()` handles QuotaExceededError** — `localStorage.setItem` throws when storage is full; the shared helper now catches the error, logs it, and returns `false` instead of crashing the caller. Prevents silent data loss when quota is exhausted

### Added
- 7 new tests for `Sanitize.hexColor()` — covers 6-digit, 3-digit, 8-digit hex acceptance, CSS injection payloads (`url()`, `expression()`, property breakout), named colors/rgb/hsl rejection, falsy input with custom fallback, and missing `#` prefix

**Test count**: 219 across 13 suites (up from 212)

**Files Modified**: `js/sanitize.js`, `js/admin.js`, `js/dom-helpers.js`, `tests/sanitize.test.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.17.0] — 2026-02-17

### Changed
- **Unified lazy-window pattern for Skills, GitHub, and Terminal** — `openSkills()` (30 lines → 13), `openGitHubCenter()` (18 lines → 13), and `openTerminal()` (18 lines → 11) now use the shared `createLazyWindow()` helper instead of manually creating containers, querying `.window-content`, and wiring dynamic imports. Eliminates 3 copies of the same lazy-load boilerplate
- **Extended `createLazyWindow()` API** — added `onLoad` callback for object-API modules (`.init()/.render()/.stop()` pattern), `containerClass` for CSS class assignment, and `windowOptions` spread for pass-through window config (e.g. `transitionType`). The existing `exportName` convention used by 5 other windows is unchanged

**Files Modified**: `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.16.7] — 2026-02-17

### Security
- **Added `Sanitize.url()` method** — allowlist-based URL validator that permits only `http(s)` and relative paths. Blocks `javascript:`, `data:`, `vbscript:`, `blob:`, and control-char-obfuscated protocol variants. Used during backup import to prevent stored XSS via crafted URLs in project/media JSON
- **Admin Dashboard import hardens URL fields** — all `demo`, `repo`, media `url`, and `poster` fields in imported backup JSON are now validated through `Sanitize.url()` before being written to localStorage. Previously, a malicious backup file could inject `javascript:` URIs that would execute when rendered in the admin panel or media vault
- **Admin tab renders routed through `Sanitize.setHTML()`** — all 5 admin tabs (desktop, projects, media, theme, data) and folder icon list now use DOMPurify-backed `Sanitize.setHTML()` instead of bare `innerHTML`. Defense-in-depth: catches any future template injection if dynamic data is interpolated without escaping
- **Startmenu shutdown uses safe DOM API** — replaced `document.body.innerHTML = ''` and `innerHTML = '<h1>...'` with `while(firstChild) remove()` + `createElement`/`textContent`. Eliminates the innerHTML pattern on `document.body` entirely

### Added
- 11 new security tests for `Sanitize.url()` — covers https/http allow, relative paths, javascript: block, control-char obfuscation, data:/vbscript:/blob: block, falsy input, whitespace trim (212 total tests)

**Files Modified**: `js/sanitize.js`, `js/admin.js`, `js/startmenu.js`, `tests/sanitize.test.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.16.6] — 2026-02-17

### Changed
- **DOCUMENTATION.md modernized from v2.56 to v3.16.6** — the main user guide was frozen at November 2025 (Phase 3 era) while the codebase grew from 10 modules to 44. Updated Quick Start from "open index.html" to Vite-based `npm run dev` workflow. Added complete Desktop Apps reference table covering all 20 apps. Added Keyboard Shortcuts & Easter Eggs section with command palette, toast notifications, and all hidden triggers. Replaced stale 10-file structure with current 44-module architecture summary. Fixed Deployment section to include `npm run build` and Vite output. Updated Admin Dashboard access instructions (now console-only via `Admin.open()`). Removed dead link to deleted `FEATURE_VERIFICATION.md`. Updated Related Documentation table with current doc set including EASTER_EGGS_GUIDE.md. Added Development Commands reference

**Files Modified**: `DOCUMENTATION.md`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.16.5] — 2026-02-17

### Fixed
- **Toast notification infinite loop on eviction** — `dismissToast()` removed entries from the queue asynchronously (inside `animationend` callback), but the `while (queue.length >= MAX_VISIBLE)` eviction loop checked synchronously. When 4+ toasts were queued rapidly (e.g. toggling settings), the loop spun forever, freezing the browser. Fixed by splicing the queue synchronously before starting the exit animation
- **Toast hover timer leak** — clearing the auto-dismiss timer on `mouseenter` worked, but the replacement timer created on `mouseleave` was never stored. Subsequent hovers couldn't cancel it, causing toasts to dismiss while the user was still reading them. Timer ID now tracked on the entry object and cleared consistently
- **Toast double-dismiss race condition** — the close button, auto-timer, and hover-leave timer could all call `dismissToast()` on the same entry, causing double-splice and orphaned DOM nodes. Added `dismissed` idempotency guard

**Files Modified**: `js/notifications.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.16.4] — 2026-02-17

### Security
- **Tabnapping prevention on `target="_blank"` links** — 4 anchor tags in `desktop.js` (contact social links, project demo/repo links) were missing `rel="noopener noreferrer"`, allowing opened pages to access `window.opener` and potentially redirect the portfolio. Fixed by adding the attribute to all 4 instances. The `openExternal()` helper already handles this for programmatic opens, but these HTML-interpolated links were missed
- **GitHub API response shape validation** — `github.js` now validates that API responses have expected `user.login` (string), `repos` (array of objects with `name`), and `events` (array) before rendering or caching. Corrupted localStorage cache is auto-purged on validation failure. Mirrors the weather widget validation pattern from v3.16.2
- **Contact form input length limits** — Added `maxlength` attributes to name (100), email (254 per RFC 5321), and message (2000) fields to prevent excessively long `mailto:` URI construction that could crash browsers or be used for abuse

### Added
- **GitHub validation test suite** (`tests/github.test.js`) — 7 tests covering `validateResponse()`: valid shape acceptance, missing/null user, non-string login, non-array repos, non-array events, invalid repo entries, and null repo entries

**Test count**: 201 across 13 suites (up from 194 across 12)

**Files Modified**: `js/desktop.js`, `js/github.js`, `tests/github.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.16.3] — 2026-02-16

### Added
- **Desktop utilities test suite** (`tests/desktop-utils.test.js`) — 23 new tests covering `el()` DOM factory, `Sanitize.html()` DOMPurify-absent fallback, `Sanitize.setHTML()` null safety and content replacement, advanced `Sanitize.attr()` XSS vectors (carriage return obfuscation, mid-string javascript:, data: with script keyword), and `createLazyWindow` closure pattern (cleanup lifecycle, pre-load close safety)
- Total test count: 194 across 12 suites (up from 171 across 11)

**Files Modified**: `tests/desktop-utils.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.16.2] — 2026-02-16

### Security
- **CSP `connect-src` updated** — Added `https://api.open-meteo.com` to Content-Security-Policy. Weather widget fetches were being silently blocked in production by the restrictive CSP that only allowed `'self'` and `api.github.com`
- **Permissions-Policy `geolocation` unlocked for same-origin** — Changed from `geolocation=()` (deny all) to `geolocation=(self)`. The weather widget's `navigator.geolocation.getCurrentPosition()` was being denied by the site's own security headers
- **`Sanitize.attr()` blocks `data:image/svg+xml` XSS** — SVG data URIs can embed `<script>` and `onload` handlers for script execution. Now blocks any `data:` URI containing `svg` alongside existing `javascript:`, `vbscript:`, and `data:text/html` blocks
- **Weather API response shape validation** — `fetchWeather()` now validates the response has expected `current` and `daily` fields with correct types before rendering, preventing crashes from malformed API data (mirrors the GitHub cache validation pattern)
- **Coordinate input validation** — `fetchWeather()` rejects `NaN`, `Infinity`, or non-finite coordinates via `Number.isFinite()`, preventing malformed API URLs from crafted Position objects
- 3 new security tests for SVG data URI blocking (171 total, up from 168)

**Files Modified**: `vercel.json`, `js/sanitize.js`, `js/weather.js`, `tests/sanitize.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

> *"The art of war teaches us not to rely on the likelihood of the enemy not coming, but on our own readiness to receive him."* — Sun Tzu

---

## [3.16.1] — 2026-02-16

### Fixed
- **Calculator keyboard listener stealing keystrokes globally** — the `keydown` handler on `document` fired regardless of which window was focused or whether the user was typing in a text field (command palette, sticky notes, terminal, contact form). Now checks: (1) event target is not an input/textarea/contenteditable, and (2) the calculator window has the `.active` class. Keyboard shortcuts only fire when the calculator is the foreground window and no text field is focused.

**Files Modified**: `js/calculator.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.16.0] — 2026-02-16

### Added
- **WEATHER desktop app** — Live weather widget using browser geolocation and Open-Meteo API (free, no API key). Displays current temperature, feels-like, humidity, wind speed, weather condition with WMO code emoji mapping, and 3-day forecast cards. Graceful error handling for denied/unavailable geolocation with user-friendly messages. Cyberpunk glass UI with cyan temperature glow, magenta forecast accents, and green stat highlights. Lazy-loaded via `createLazyWindow` pattern — zero bytes until opened
- New desktop icon `WEATHER` with custom sun/cloud/rain gradient SVG icon in Column 4 (Extras)
- New files: `js/weather.js`, `css/weather.css`, `public/assets/weather.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `README.md`, `CHANGELOG.md`, `package.json`
**Files Created**: `js/weather.js`, `css/weather.css`, `public/assets/weather.svg`

---

## [3.15.0] — 2026-02-16

### Added
- **CALC.exe desktop app** — Cyberpunk glass calculator with full arithmetic (add, subtract, multiply, divide), percentage, sign toggle, backspace, and expression chaining. Keyboard input support (0-9, operators, Enter, Backspace, Escape). Magenta-accented operator keys, green action keys, cyan display with neon glow. Lazy-loaded via `createLazyWindow` pattern — zero bytes until opened
- New desktop icon `CALC.exe` with custom gradient SVG icon in Column 4 (Extras)
- New files: `js/calculator.js`, `css/calculator.css`, `public/assets/calculator.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `README.md`, `CHANGELOG.md`, `package.json`
**Files Created**: `js/calculator.js`, `css/calculator.css`, `public/assets/calculator.svg`

---

## [3.14.0] — 2026-02-16

### Changed
- **Extracted `el()` DOM helper** to `dom-helpers.js` — removes identical 5-line function duplicated in `sticky-notes.js` and `pomodoro-timer.js`, consolidating it alongside existing shared utilities (`loadJSON`, `saveJSON`, `downloadJSON`, `animateCounter`)
- **Introduced `createLazyWindow()` helper** in `desktop.js` — replaces 3 copy-pasted lazy-load window patterns (System Monitor, Sticky Notes, Pomodoro Timer) with a single config-driven function. Each method shrinks from 18 lines to 6 lines
- Future lazy-loaded window apps now require only a 6-line config call instead of duplicating the full pattern

**Files Modified**: `js/dom-helpers.js`, `js/desktop.js`, `js/sticky-notes.js`, `js/pomodoro-timer.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.13.0] — 2026-02-15

### Added
- **FOCUS_TIMER desktop app** — Pomodoro timer with canvas-rendered neon ring, start/pause/reset controls, 3 duration presets (25/5, 50/10, 90/20 min), session counter, total focus time stats, and localStorage persistence. Lazy-loaded module following sticky-notes architecture pattern. Toast notifications on session complete via existing Notify system
- New desktop icon `FOCUS_TIMER` with custom cyberpunk SVG icon in Column 4 (Extras)
- New files: `js/pomodoro-timer.js`, `css/pomodoro-timer.css`, `public/assets/pomodoro-timer.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `README.md`, `CHANGELOG.md`, `package.json`
**Files Created**: `js/pomodoro-timer.js`, `css/pomodoro-timer.css`, `public/assets/pomodoro-timer.svg`

---

## [3.12.2] — 2026-02-15

### Changed
- **README elevated to portfolio-grade v3** — added stylesheets badge, quick stats blockquote (41 modules · 21 stylesheets · 168 tests · 17 apps · 10 headers · 0 deps), Project Health table with test/security/a11y/perf/lint/bundle metrics, linked author name to GitHub profile, added missing docs to Documentation table (EASTER_EGGS_GUIDE.md, docs/GLOSSARY.md), fixed 5 stale values (test count 157→168, architecture tree 159→168, docs module count 38→41, license version v3.12.0→v3.12.1, test command count)

**Files Modified**: `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.12.1] — 2026-02-14

### Security
- **Hardened `Sanitize.attr()` against protocol obfuscation** — now strips ASCII control characters (tabs, newlines, null bytes) before checking URI schemes, blocking bypass vectors like `java\tscript:`. Also blocks `vbscript:` and `data:text/html` payloads.
- **Added URL allowlist to `openExternal()`** — only `http://` and `https://` URLs are now permitted. Blocks `javascript:`, `data:`, `vbscript:`, and any non-HTTP protocol from being opened via `window.open()`. Prevents open-redirect and XSS-via-navigation from attacker-controlled data (e.g. GitHub API responses).
- **Added `upgrade-insecure-requests` to CSP** — forces all HTTP subresource requests to HTTPS, closing mixed-content downgrade vectors.

### Added
- **9 new security tests** — 6 for `openExternal()` URL validation (javascript:, data:, vbscript:, null/empty, tab-obfuscated, http:// allowlist) and 3 for `Sanitize.attr()` (vbscript:, data:text/html, control-char obfuscation).

**Test count**: 159 → 168 (9 new tests)

---

## [3.12.0] — 2026-02-14

### Changed
- **Extracted `downloadJSON()` helper into `dom-helpers.js`** — replaces 6 identical stringify→Blob→anchor→click→revoke sequences in `admin.js` (exportProjects, exportMedia, exportAll, exportDesktopOnly, exportProjectsOnly, exportMediaOnly) with a single reusable utility. Each 7-line block reduced to a 1-line call.
- **Replaced manual localStorage try/catch in `admin.js` `loadAllData()`** — the 8-line try/catch + JSON.parse block for loading desktop items now uses the existing `loadJSON()` helper (created in v3.7.0 for exactly this purpose, but this callsite was missed).

### Added
- **2 new tests** for `downloadJSON()` in `tests/dom-helpers.test.js` — covers anchor creation + click trigger, filename assignment, and objectURL cleanup.

**Test count**: 157 → 159 (2 new tests)

**Files Modified**: `js/dom-helpers.js`, `js/admin.js`, `tests/dom-helpers.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.11.0] — 2026-02-14

### Added
- **Sticky Notes app** (`js/sticky-notes.js`, `css/sticky-notes.css`) — persistent note-taking utility with localStorage auto-save. Create, edit, and delete notes in a responsive card grid. 5 cyberpunk color themes (cyber, neon, pink, gold, purple) cycle per note via color dot button. Notes persist across sessions with debounced save (400ms). Delete animation, empty state, contenteditable body with placeholder text, and timestamp display. Lazy-loaded module with cleanup function.
- **Sticky Notes SVG icon** (`assets/sticky-notes.svg`) — layered note cards with pencil accent, matching existing cyberpunk icon style
- **Desktop icon grid updated** — 17 icons (was 16), NOTES added to Column 4 (Extras). localStorage key bumped to `desktop_layout_v4` to force layout reset for existing users.

**Files Created**: `js/sticky-notes.js`, `css/sticky-notes.css`, `assets/sticky-notes.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.10.1] — 2026-02-14

### Security
- **Sanitized window content innerHTML** — `WindowManager.create()` now routes all string `content` through `Sanitize.setHTML()` instead of raw `innerHTML`, closing a defense-in-depth XSS gap where future callers could pass tainted HTML into window bodies
- **Sanitized window icon innerHTML** — titlebar and taskbar icon rendering in `windows.js` now uses `Sanitize.setHTML()` to filter SVG/HTML icon strings that could originate from localStorage-overridden desktop items
- **Sanitized start menu item rendering** — replaced `innerHTML` interpolation of `item.icon` and `item.label` in `startmenu.js` with DOM API (`textContent` + `Sanitize.setHTML`), preventing XSS from localStorage-poisoned desktop item configs
- **Added Cross-Origin-Embedder-Policy header** — `credentialless` mode enables cross-origin isolation (Spectre mitigation) while preserving Google Fonts, YouTube embeds, and Unsplash wallpaper loading
- **Added Cross-Origin-Resource-Policy header** — `same-origin` prevents cross-origin reads of site resources, hardening against side-channel data exfiltration

**Files Modified**: `js/windows.js`, `js/startmenu.js`, `vercel.json`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.10.0] — 2026-02-13

### Added
- **Keyboard shortcuts overlay** (`js/shortcuts-overlay.js`, `css/shortcuts-overlay.css`) — press `?` to toggle a glassmorphism panel showing all keyboard shortcuts and hidden easter eggs, organized into 3 categories: Navigation (6 shortcuts), System Toggles (4 shortcuts), and Easter Eggs (6 secrets). Platform-aware key labels (⌘ on Mac, Alt on Windows). Dismisses via Escape, `?` again, or backdrop click. Skips activation when typing in inputs/textareas. Mobile-responsive single-column layout at ≤600px.

**Files Created**: `js/shortcuts-overlay.js`, `css/shortcuts-overlay.css`

**Files Modified**: `js/main.js`, `index.html`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.9.3] — 2026-02-13

### Fixed
- **Vite dual-import warning eliminated** — `warp.js` statically imported `fx.js` while `main.js` dynamically imported it, preventing Vite from code-splitting `fx.js` into its own chunk. Replaced static import with `window.__FX` reference (already set by `main.js` during boot). FX now loads on-demand as its own 3.44 kB chunk.
- **18 → 0 ESLint warnings** — cleaned all remaining lint issues across 11 files: 3 catch variables prefixed with `_`, 6 unused callback parameters prefixed with `_`, 5 dead variables removed (`translateMatch`, `relX`/`relY`, `velocity`, `t0` ×2), and 1 orphaned `bounds` assignment cleaned up.

**Bundle impact**: Main chunk reduced from 135.8 kB → 132.3 kB (−3.5 kB); `fx.js` now a separate 3.44 kB lazy chunk.

**Files Modified**: `js/warp.js`, `js/admin.js`, `js/audiofx.js`, `js/boot.js`, `js/router.js`, `js/interactions/cursor-reactive.js`, `js/interactions/cursor-tracker.js`, `js/interactions/easter-eggs.js`, `js/interactions/micro-interactions.js`, `js/interactions/sound-manager.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.9.2] — 2026-02-13

### Fixed
- **Dead imports in `login.js`** — removed unused `AudioFX` and `destroyGalaxyBackground` imports left over from earlier refactors. The static `galaxy-background.js` import was defeating Vite's code-splitting; converted to dynamic `import()` so the 12.8 kB galaxy shader now loads on-demand instead of blocking initial page load.
- **Dead code in `desktop.js`** — removed unused `defaultTab`/`category` params from legacy `openMedia()` and unused `win` capture in `openSystemMonitor()`.
- **Dead code in `github.js`** — removed unused `mainLang` variable; replaced inline `onclick` handler (bypasses CSP, fails in bundled builds) with DOM `addEventListener` using dynamic `import()` to avoid circular dependency.
- **Dead code in `state.js`** — removed unused `getBoundingClientRect()` call in `saveWindowStates()` (state was already read from `win.x/y/width/height`).
- **ESLint config** — added `argsIgnorePattern: '^_'` and `caughtErrorsIgnorePattern: '^_'` to `no-unused-vars` rule, following the widespread JS convention for intentionally unused parameters. Reduced lint warnings from 27 to 18.

**Bundle impact**: Main chunk reduced from 148.4 kB to 135.8 kB (−12.6 kB) by enabling galaxy-background code-splitting.

**Files Modified**: `js/login.js`, `js/desktop.js`, `js/github.js`, `js/state.js`, `js/main.js`, `eslint.config.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.9.1] — 2026-02-13

### Added
- **Smoke test suite** (`tests/smoke.test.js`) — 27 integration tests covering the 4 critical user flows most likely to break during refactors: homepage DOM structure (7 tests verifying lock screen, desktop, dock, top bar, ARIA landmarks), router navigation dispatch (8 tests verifying all 5 route→opener mappings plus XSS/null path blocking), contact form lifecycle (5 tests covering required fields, FormData capture, mailto URI construction, reset, and preventDefault), and responsive breakpoints (7 tests covering mobile detection, body class injection, 768px stylesheet, viewport meta creation/dedup, and hover-disable rules).

**Test count**: 130 → 157 (27 new tests)

**Files Created**: `tests/smoke.test.js`

**Files Modified**: `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.9.0] — 2026-02-13

### Added
- **Toast notification system** (`js/notifications.js`, `css/notifications.css`) — non-blocking notification queue with 4 types (success, error, warning, info), auto-dismiss progress bar, hover-to-pause, click-to-dismiss, max 4 visible with oldest eviction, `aria-live` polite region for screen reader support, `prefers-reduced-motion` respect, and mobile-responsive bottom positioning.
- **Settings toggle feedback** — keyboard shortcuts (`Cmd+C`, `Cmd+S`, `Cmd+I` on Mac / `Alt+` on Windows) now show a toast confirming the toggle state (e.g. "Cursor trail ON").

### Changed
- **Easter eggs unified with toast system** — replaced 50+ lines of inline `showNotification()` with hardcoded CSS and DOM construction in `easter-eggs.js` with the shared `Notify` module. All 7 easter egg notifications (418 teapot, 404, system info, Konami code, rapid clicks, idle warning, PlayStation mode) now use the polished toast UI with progress bars and consistent styling.

**Files Created**: `js/notifications.js`, `css/notifications.css`

**Files Modified**: `js/interactions/easter-eggs.js`, `js/main.js`, `index.html`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.8.4] — 2026-02-12

### Changed
- **Refactored `state.js` boolean toggle system** — replaced 9 hand-written setter/toggle method pairs and 10 repetitive `localStorage.getItem` blocks with a data-driven `BOOLEAN_TOGGLES` registry. A single loop now generates `setXEnabled()`, `toggleX()`, and `init()` loading for all boolean properties. Reduces ~96 lines of copy-pasted code to ~62 lines of declarative configuration. Public API is unchanged — all existing callers (`State.toggleFx()`, `State.fxEnabled`, etc.) work identically. Adding a new boolean toggle now requires 1 line in the registry instead of 8+ lines of methods.

**Files Modified**: `js/state.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.8.3] — 2026-02-12

### Added
- **Command Palette test suite** (`tests/command-palette.test.js`) — 22 tests covering init/buildCommands (DOM creation, label sanitization), open/close lifecycle, fuzzy search filtering (case-insensitive substring, empty query, no matches), filterAndRender (empty state, role=option items, default selection), keyboard navigation (ArrowDown/ArrowUp wrap-around, empty list safety), executeSelected (action invocation, palette close, system toggle dispatch), and ARIA attribute verification (role=dialog, role=listbox, aria-label)
- **Mobile detection test suite** (`tests/mobile.test.js`) — 11 tests covering `isMobile()` detection matrix (iPhone/Android/iPad user agents, desktop rejection, touch+small screen combo, touch+large screen laptop rejection), `ensureViewportMeta()` (creation when missing, no-duplicate guard), and `applyMobileOptimizations()` (body class, hover-disable stylesheet injection, mobile layout stylesheet injection)

**Test count**: 97 → 130 (33 new tests across 2 files)

**Files Created**: `tests/command-palette.test.js`, `tests/mobile.test.js`

**Files Modified**: `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.8.2] — 2026-02-12

### Changed
- **Architecture docs modernized to v3.8.2** — `docs/ARCHITECTURE.md` was stuck at v2.56 (November 2025, 17 modules) while the codebase had grown to 38 modules, 18 CSS files, and 8 test suites. Updated module categories from 6 → 9 with complete tables for all 38 modules including the interactions subsystem, shared utilities layer (sanitize, dom-helpers, data-loader, focus-trap, modal, loader), application windows (terminal, github, system-monitor), and 3D/VFX modules (galaxy-background, mahoraga-wheel). Rewrote architecture diagram to show the new Shared Utilities Layer. Updated dependency graph with lazy-loading annotations, init sequence with current boot flow, and key files reference table.
- **Documentation index updated** (`docs/README.md`) — fixed 4 dead links to deleted `FEATURE_VERIFICATION.md`, updated file tree from 17 JS / 5 CSS to 38 JS / 18 CSS / 8 test suites, bumped version references from v2.56 to v3.8.2.

**Files Modified**: `docs/ARCHITECTURE.md`, `docs/README.md`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.8.1] — 2026-02-12

### Fixed
- **Skills Universe event listener leak** — `mousedown` and `mousemove` listeners on the canvas were registered with anonymous functions in `init()` but never removed in `stop()`, causing listeners to accumulate each time the Skills window was opened and closed. Now stores bound references for all four listeners (mousedown, mousemove, mouseup, resize) and removes them all on teardown.
- **Skills Universe spring physics NaN crash** — spring force calculation divided by `dist` without a zero-guard, unlike the repulsion code. Two connected nodes at identical coordinates produced `NaN` forces that propagated to all nodes, collapsing the entire graph. Added `dist === 0` guard matching the existing repulsion pattern.
- **Skills Universe missing resize handler** — canvas dimensions were set once at init and never updated. Resizing the browser or Skills window left nodes rendering outside the visible area or clipped. Added `window.resize` listener that reflows the canvas to its parent container dimensions.
- **InteractionEngine double-init race condition** — concurrent `init()` calls (e.g. from rapid window open/close) could bypass the `_initializing` boolean guard and trigger duplicate module loading. Replaced boolean flag with a stored Promise so concurrent callers await the same initialization.

**Files Modified**: `js/skills.js`, `js/interactions/engine.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.8.0] — 2026-02-12

### Added
- **Portfolio featured projects window** (`PORTFOLIO` desktop icon) — curated showcase of 5 hero projects (Passion Agent, Vibe Coder, Portfolio OS, Culture Drop HQ, FCPXML MCP Server) with rich cards, color-coded tech stack badges, live demo buttons, and source links. Includes "VIEW ALL 18 PROJECTS" bridge to the full Applications catalog.
- **Portfolio CSS** (`css/portfolio.css`) — responsive 2-column grid cards with hover glow effects, accent color custom properties, featured card spanning full width, and cyberpunk-styled badge/link components.
- **Portfolio SVG icon** (`assets/portfolio.svg`) — 4-panel grid icon matching the project showcase concept.
- **Desktop icon grid updated** — 16 icons (was 15), PORTFOLIO added to Row 1 second position. localStorage key bumped to `desktop_layout_v3` to force layout reset for existing users. PORTFOLIO added to dock launchers.

**Files Created**: `css/portfolio.css`, `public/assets/portfolio.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.7.1] — 2026-02-12

### Changed
- **README elevated to portfolio-grade v2** — added prominent "Try the Live Demo" CTA above the fold, expanded Desktop Icons table from 10-row feature summary to accurate 15-icon reference with Type column (Window/External/Lightbox), added prerequisites to Quick Start (Node 18+, npm 9+), consolidated duplicate Scripts section into a unified Development section with tooling context, improved Documentation table descriptions, added source repo link to footer
- **Fixed stale version strings** — `index.html` title and top-bar version were stuck at `v3.3.0` since the content overhaul in Phase 3; updated both to `v3.7.1`

**Files Modified**: `README.md`, `CHANGELOG.md`, `package.json`, `index.html`

---

## [3.7.0] — 2026-02-12

### Changed
- **Extracted `loadJSON`/`saveJSON` storage helpers** into `dom-helpers.js` — replaces 6 inconsistent `try/catch` + `JSON.parse(localStorage.getItem(...))` patterns across `desktop.js` (3 sites), `github.js` (2 sites), `admin.js` (1 site), and `state.js` (1 site) with a single, tested utility. Error handling is now uniform: parse failures silently return the fallback value instead of varying between removing the key, logging an error, or swallowing silently.
- **Fixed `window` event listener memory leak in `skills.js`** — `window.addEventListener('mouseup', ...)` was registered with a new anonymous function on every `init()` call but never removed in `stop()`, causing listeners to stack each time the Skills window was opened and closed. Now stores a bound reference and removes it on teardown.

### Added
- **6 new tests** for `loadJSON()` and `saveJSON()` in `tests/dom-helpers.test.js` — covers valid JSON, missing keys, corrupted data fallback, default null, overwrite, and serialization

**Test count**: 91 → 97 (6 new tests)

**Files Modified**: `js/dom-helpers.js`, `js/desktop.js`, `js/github.js`, `js/admin.js`, `js/state.js`, `js/skills.js`, `tests/dom-helpers.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.6.5] — 2026-02-12

### Changed
- **README elevated to portfolio-grade** — added shields.io stat badges (version, tests, modules, frameworks, license), fixed stale module count (37→38 reflecting all JS files including warp.js, glyphs.js, audiofx.js), expanded architecture tree from partial (18 modules + ellipsis) to complete (all 38 modules + all 17 stylesheets with descriptions), and added "Why No Frameworks?" section articulating the vanilla JS constraint as a deliberate architectural demonstration

**Files Modified**: `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.6.4] — 2026-02-12

### Added
- **DOM helpers test suite** (`tests/dom-helpers.test.js`) — 7 tests covering `openExternal()` (noopener/noreferrer enforcement, URL passthrough) and `animateCounter()` (completion, intermediate values, edge cases, cancellation)
- **Modal dialog test suite** (`tests/modal.test.js`) — 15 tests covering `init()` (container creation, idempotency), `_createDismiss()` (focus release, resolve values), `prompt()` (title/message rendering, focus trapping, confirm/cancel/overlay clicks, Enter/Escape keys), and `alert()` (OK-only rendering, dismiss lifecycle, focus trap cleanup)

**Test count**: 69 → 91 (22 new tests across 2 files)

**Files Created**: `tests/dom-helpers.test.js`, `tests/modal.test.js`

**Files Modified**: `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.6.3] — 2026-02-12

### Changed
- **Lightbox focus trap unified with shared utility** — replaced 25-line inline `handleTabFocus()` method with the same `trapFocus()` from `focus-trap.js` already used by modal, login, welcome, and tour modules. Eliminates DRY violation, fixes inconsistent focusable selector (`[href]` → `a[href]`), and properly cleans up the keydown listener on close.

**Files Modified**: `js/lightbox.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.6.2] — 2026-02-12

### Security
- **Hardened video embed IDs** — YouTube IDs now validated against `/^[a-zA-Z0-9_-]{11}$/` and Vimeo IDs against `/^[0-9]{6,11}$/` before interpolation into iframe `src` URLs; invalid IDs are blocked with a visible error placeholder instead of creating a potentially malicious iframe
- **Sandboxed video iframes** — all YouTube and Vimeo embeds now carry `sandbox="allow-scripts allow-same-origin allow-presentation"`, preventing top-navigation hijacking, popup abuse, and form submission from embedded content
- **Null-guard on embed creation** — `createYouTubeEmbed()` and `createVimeoEmbed()` return a safe placeholder element when passed a null ID (fail-closed)

### Added
- **Lightbox security test suite** (`tests/lightbox.test.js`) — 14 tests covering YouTube ID validation (valid formats, path traversal, XSS payloads, oversized IDs), Vimeo ID validation (numeric-only, path traversal), MP4 fallback, and iframe sandbox token verification

**Test count**: 55 → 69 (14 new tests)

**Files Created**: `tests/lightbox.test.js`

**Files Modified**: `js/lightbox.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.6.1] — 2026-02-12

### Changed
- **README overhauled for portfolio-grade presentation** — added project stat badges (37 modules, 17 stylesheets, 55 tests, 0 framework deps), Keyboard Shortcuts reference table with all 9 shortcuts/easter eggs, expanded architecture tree showing all 7 interaction modules with descriptions, fixed stale CSS count (16→17), added per-test-file counts, and added footer navigation links to live demo, changelog, and architecture docs

**Files Modified**: `README.md`

---

## [3.6.0] — 2026-02-11

### Added
- **System Monitor app** (`SYS_MONITOR`) — real-time performance dashboard showing live FPS graph, JS heap usage, DOM node count, active window count, session uptime, page load time, CPU cores, network type, and platform info. Uses `performance.memory`, `performance.getEntriesByType`, `navigator.connection`, and RAF-based FPS measurement with a 70-sample rolling graph.
- **System Monitor icon** — new SVG desktop icon (`assets/system-monitor.svg`) in the Utilities row
- **System Monitor CSS** — dedicated `css/system-monitor.css` with gauge bars, canvas graph, and cyberpunk diagnostic styling

**Files Created**: `js/system-monitor.js`, `css/system-monitor.css`, `assets/system-monitor.svg`

### Changed
- **Extracted `dom-helpers.js` shared utility module** — centralizes `openExternal()` and `animateCounter()` that were duplicated across `desktop.js` and `github.js`
- **Hardened all external link opens** — 6 bare `window.open(url, '_blank')` calls in `desktop.js` replaced with `openExternal()` which adds `noopener,noreferrer` to prevent tabnapping; `github.js` also unified through the same helper
- **DRYed modal cleanup logic** — extracted `_createDismiss()` in `modal.js` to eliminate identical 6-line cleanup closures duplicated between `prompt()` and `alert()`
- **Removed duplicated `animateCounter`** — identical 12-line function was copy-pasted in both `desktop.js` and `github.js`; now delegates to single shared implementation

**Files Created**: `js/dom-helpers.js`

**Files Modified**: `js/desktop.js`, `js/github.js`, `js/modal.js`

---

## [3.5.2] — 2026-02-11

### Added
- **Data-loader test suite** (`tests/data-loader.test.js`) — 9 tests covering localStorage overrides, fetch fallbacks, in-memory caching, cache invalidation, and malformed JSON resilience
- **Router test suite** (`tests/router.test.js`) — 12 tests covering path validation security (blocks `javascript:`, `data:`, null, non-slash paths), route dispatching, custom route registration, and unknown-route handling
- **Focus-trap test suite** (`tests/focus-trap.test.js`) — 7 tests covering Tab wrap-around, Shift+Tab reverse cycling, disabled element exclusion, cleanup function, and empty-container safety

**Test count**: 27 → 55 (28 new tests across 3 files)

**Files Created**: `tests/data-loader.test.js`, `tests/router.test.js`, `tests/focus-trap.test.js`

---

## [3.5.1] — 2026-02-11

### Fixed
- **Clock interval memory leak** — `Login.lock()` never cleared the clock `setInterval`, causing intervals to stack on every lock/unlock cycle; now clears before recreating
- **Window inertia RAF leak** — `WindowManager.close()` didn't cancel in-flight `requestAnimationFrame` from drag-inertia physics, causing RAF loops to reference detached DOM elements; now cancels on close
- **Lightbox pan state bleed** — closing the lightbox mid-pan (ESC while dragging a zoomed image) left `panning: true`, causing the next lightbox to drift on mouse move; now resets all zoom/pan state on close
- **Navigation stack leak** — closed windows left orphaned entries in `WindowManager.navigationStack` Map; now cleaned up on close

**Files Modified**: `js/login.js`, `js/windows.js`, `js/lightbox.js`, `package.json`

---

## [3.5.0] — 2026-02-11

### Changed
- **Extracted centralized data-loader module** (`js/data-loader.js`) — replaces 4 copy-pasted fetch-or-localStorage blocks across `desktop.js` (3x) and `admin.js` (1x) with shared `loadMedia()` and `loadProjects()` functions
- **In-memory caching** — multiple callers requesting the same data share a single fetch promise, eliminating redundant network requests
- **Cache invalidation** — admin save/import operations now call `invalidateData()` so subsequent loads reflect changes
- **Fixed inconsistent fetch path** — `openFeaturedVideo()` used `/data/media.json` (absolute) while all other callers used `data/media.json` (relative); unified to relative path via data-loader

**Files Created**: `js/data-loader.js`
**Files Modified**: `js/desktop.js`, `js/admin.js`, `package.json`

---

## [3.4.1] — 2026-02-11

### Changed
- **README.md rewritten** as portfolio-grade documentation — restructured from changelog-dump to recruiter-scannable reference with centered hero, Quick Start in the first 25 lines, architecture tree, tech stack table, and categorized feature sections (was 256 lines of version history before features)
- Moved all version-specific release notes out of README into CHANGELOG where they belong

**Files Modified**: `README.md`

---

## [3.4.0] — 2026-02-11

### Added
- **Command Palette** (`Cmd+K` / `Ctrl+K`): Spotlight-style fuzzy-search launcher that provides instant keyboard access to all 14 desktop apps and 4 system toggles (theme, cursor trail, sound, interactions)
- Full keyboard navigation — arrow keys, Enter to execute, Escape to dismiss, click-outside to close
- Cyberpunk glass UI with frosted overlay, color-coded dot indicators, and monospace input styling
- Auto-syncs with `DESKTOP_ITEMS` — new desktop icons are automatically available in the palette

**Files Created**: `js/command-palette.js`, `css/command-palette.css`

**Files Modified**: `js/main.js`, `index.html`

---

## [3.3.2] — 2026-02-11

### Security
- Replaced innerHTML interpolation with DOM API (textContent/createElement) in `loader.js`, `windows.js` breadcrumbs, `easter-eggs.js` notifications, and `micro-interactions.js` loading states — eliminates XSS vectors from interpolated strings
- Sanitize fetched SVG content through DOMPurify in `cursor-trail.js` before innerHTML insertion — blocks embedded `<script>`, `onload`, and event-handler payloads in SVG files
- Tightened CSP `img-src` from wildcard `https:` to explicit GitHub asset domains (`avatars.githubusercontent.com`, `raw.githubusercontent.com`) — prevents image-based data exfiltration via tracking pixels
- Added `X-Permitted-Cross-Domain-Policies: none` security header to block Flash/PDF cross-domain policy file abuse

---

## [3.3.1] — 2026-02-10

### Security
- Wrapped unprotected `JSON.parse` calls in `github.js` and `desktop.js` with try/catch to prevent crashes from corrupted localStorage data
- Added allowlist-based path validation to `Router.navigate()` — blocks `javascript:`, `data:`, and non-path strings
- Hardened wallpaper URL validation in `state.js` — allowlists only safe raster `data:` image types (png, jpeg, gif, webp), blocking `data:image/svg+xml` which can contain scripts
- Added `;`, `<`, `>` to CSS URL breakout character strip in wallpaper handler

---

## v3.3.0 — Content & Visual Overhaul (February 11, 2026)

### About Me Rewrite
- **NAME**: Changed from "DareDev256" to "James Olusoga (DareDev256)"
- **ROLE**: Changed from "Developer • Creator • Visionary" to "AI Solutions Engineer • Creative Technologist"
- **LOCATION**: Added "Toronto, Canada" (was "Building the future")
- **Bio**: Complete rewrite — mentions Passion Agent, Claude Code, autonomous systems, RAG, MCP
- **Skills grid**: Color-coded by category (cyan: languages, purple: AI/ML, green: frameworks, amber: infra)

### Galaxy Theme Unification
- **Top bar brand text**: Shifted from gold metallic gradient to cobalt/platinum blue gradient
- **Logo wheel**: Added galaxy hue-rotate filter
- **Dock**: Deeper background (0.55 opacity), gradient top-edge glow line, galaxy-tinted separator
- **HUD mini bars**: Galaxy blue with subtle pulse animation
- **All HUD brackets**: Recolored to galaxy cobalt blue

### SEO & Meta Tags
- **Open Graph tags**: og:type, og:title, og:description, og:url, og:site_name
- **Twitter card**: summary_large_image with title and description
- **Canonical URL**: https://jamesdare.com
- **Author meta**: James Olusoga
- **Keywords meta**: AI Solutions Engineer, Machine Learning, MCP Server, etc.
- **Meta description**: Rewritten to highlight AI/ML, MCP servers, autonomous agents

### Project Data Integrity
- **Cross-referenced** all repos against GitHub API (only 16 public repos)
- **Removed dead repo links**: Passion Agent, Culture Drop HQ, Casper TNG, RAW.exe, Pixel Art LoRA, Portfolio OS
- **Added missing repo links**: Contract Translator, PulseMap, Tdots Portfolio, IMG Gen Prompts
- **Removed non-public projects**: Casper TNG Website, RAW.exe, Pixel Art LoRA (repos not public)
- **17 verified projects** (down from 19 — removed 3 with non-public repos and no demo, added accuracy)

### Bug Fixes
- **LinkedIn URL**: Desktop icon and Contact window now link to actual profile (was just linkedin.com)
- **Contact form email**: Now sends to real email address (was your-email@example.com)
- **Lock screen role text**: Updated to match About Me ("AI SOLUTIONS ENGINEER • CREATIVE TECHNOLOGIST")
- **Version sync**: All instances updated from v3.2.1 → v3.3.0

### Maintenance
- **CSS cache busting**: All 15 stylesheet links bumped from ?v=3.3 to ?v=3.4 for galaxy.css

---

## v3.2.0 — Portfolio Refresh (February 7, 2026)

### Desktop Icon Reorder — Recruiter F-Pattern

- **Row-first layout** — rewrote `getDefaultPosition()` from column-priority to row-priority reading order
- **Top row**: About Me, Applications, Music Videos, Resume — strongest first-impression icons
- **localStorage key bumped** to `desktop_layout_v2` — forces layout reset for existing users

### Applications Showcase Expansion

- **18 real projects** across 4 categorized sections (was 6 flat items)
- **Categories**: AI & Machine Learning, Full-Stack Applications, Creative & Client Work, Games & Tools
- **Status badges**: green "DEPLOYED" for live URLs, cyan "SOURCE" for GitHub-only repos
- **Window enlarged** to 700x650 to fit categorized content
- **Scrollable app list** with category dividers

### Font Change — Bangers → Orbitron

- **`.galaxy-text` font-family** changed from `'Bangers', 'Black Ops One'` to `'Orbitron', 'Tomorrow'`
- **Letter-spacing tightened** from 6px to 4px in galaxy.css, 8px to 4px in styles.css base rule
- **Why**: Orbitron is geometric/digital — matches MMBN cyberspace aesthetic. Bangers was manga-style and clashed.

### projects.json Cleanup

- **Removed 6 filler projects**: Weather Dashboard, Fitness Tracker, Blog CMS, Code Snippet Manager, Chat Application, E-Commerce Platform
- **Added 19 real projects** with proper GitHub URLs, demo links, tech stacks, and tags
- **All placeholder `yourusername` URLs eliminated**

**Files Modified**: `js/desktop.js`, `css/galaxy.css`, `css/styles.css`, `public/data/projects.json`

---

## v3.1.2 — MMBN Cyberspace Background (February 7, 2026)

### Background Shader Overhaul

- **Nebula → cyberspace grid** — replaced pink/magenta simplex noise nebula with MMBN-style perspective grid floor using Mode 7 UV math
- **Cobalt data streams** — animated pulses flow along grid paths toward the viewer
- **Network nodes** — bright glowing spots at major grid intersections, gently pulsing
- **Horizon glow** — cobalt line where the grid floor meets the void sky
- **Blue-purple void** — deep digital sky above the grid (replaces pink nebula)

### Color Palette Migration

- **Full pink/magenta → cobalt/blue-purple** — all galaxy theme colors migrated across galaxy.css, styles.css, variables.css
- **Stars recolored** — white/pale-blue, cobalt blue, platinum/silver (was warm white/purple/warm)
- **Buttons, glows, filters** — all updated to new palette

### Title & Layout

- **Title shrunk** — `clamp(48px, 7vw, 80px)` from `clamp(72px, 10vw, 140px)` so 3D Mahoraga wheel is the hero
- **Star drift speed doubled** — more dynamic floating data particles

---

## v3.1.1 — Desktop Wheel Quality + Galaxy Boot Background (February 7, 2026)

### Mahoraga Wheel — Adaptive Desktop Rendering

- **Antialias enabled on desktop** — eliminates jagged edges on torus/sphere geometry visible on large displays
- **Pixel ratio cap raised to 2x on desktop** — crisp rendering on Retina MacBooks (was globally capped at 1.5)
- **60fps on desktop, 30fps on mobile** — fluid rotation on 60Hz+ monitors, lean on phones
- **High-performance GPU preference on desktop** — uses discrete GPU when available instead of integrated
- **Lerp factor tuned per framerate** — snap animation speed feels identical across 30fps and 60fps

### Galaxy Background During Boot

- **Galaxy initializes before Boot.start()** — nebula + stars visible from first frame (was blank during ~1.5s wallpaper preload)
- **Login reuses existing instance** — no double-init, no duplicate console messages
- **Fallback preserved** — if main.js init fails, Login.initGalaxyEffect() retries as before

**Files Modified**: `js/mahoraga-wheel-3d.js`, `js/main.js`, `js/login.js`

---

## Phase 5: Full-Stack Audit — v3.1 (February 2026)

### Summary

Comprehensive security hardening, performance optimization, accessibility improvements, and code quality cleanup. Every `innerHTML` now sanitized, animation loops pause when tab hidden, state fully decoupled from visual modules, and 27 smoke tests added.

### 5.1 Security Hardening

- **DOMPurify wired to all injection points**: terminal, GitHub dashboard, admin panel, desktop, modal dialogs — previously imported but never called
- **DOMPurify config tightened**: removed dangerous tags (iframe, input, video), added SVG support for icon rendering
- **SRI hash** on DOMPurify CDN script tag
- **6 security headers** via Vercel: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **CSS injection prevention** in wallpaper URL handler (blocks `javascript:`, `data:text/html`, strips breakout characters)
- **JSON import validation** with schema checks and size bounds for admin backup/restore
- **Admin panel hidden from UI** — no longer accessible to visitors, console-only for developer
- **Service worker** now validates `res.ok` before caching responses

**Files Modified**: `js/sanitize.js`, `js/terminal.js`, `js/github.js`, `js/admin.js`, `js/desktop.js`, `js/modal.js`, `js/state.js`, `index.html`, `vercel.json`, `sw.js`

### 5.2 Performance

- **State decoupled from visual modules** via CustomEvent observer pattern — `state.js` has zero knowledge of FX/Aurora/Glyphs/AudioFX/InteractionEngine
- **Animation loops pause when tab hidden** (aurora, fx, skills, mahoraga wheel). Aurora throttled to ~24fps, FX to ~30fps
- **Lazy loading** for SkillsUniverse, GitHub, Terminal — only fetched when user opens the window
- **Google Fonts trimmed**: 6 families / 18 weights down to 5 families / 12 weights (~200KB saved)
- **CSS cache busting** on all 14 stylesheet links

**Files Modified**: `js/state.js`, `js/main.js`, `js/aurora.js`, `js/fx.js`, `js/skills.js`, `js/mahoraga-wheel-3d.js`, `js/desktop.js`, `index.html`, `css/galaxy.css`

### 5.3 Accessibility & UX

- **`aria-live` regions** for screen reader window open/close announcements
- **Focus trapping** in modal, login, welcome, and tour overlays with shared `trapFocus()` utility
- **Skip-link** for keyboard users
- **ESC key priority**: modal > lightbox > tour > window (no more closing windows behind open modals)
- **Mobile touch targets** bumped to 44px minimum (WCAG compliance), icon labels to 10px
- **Dock tooltip conflict fixed** — moved from `::after` to `::before` to coexist with active dot indicator
- **Missing CSS variables defined** (`--neon-pink`, `--neon-orange`) — 7 references were silently producing nothing
- **Reduced-motion queries deduplicated** — single global wildcard in `accessibility.css`, targeted overrides elsewhere

**Files Created**: `js/focus-trap.js`

**Files Modified**: `js/windows.js`, `js/modal.js`, `js/login.js`, `js/welcome.js`, `js/tour.js`, `index.html`, `css/variables.css`, `css/styles.css`, `css/mobile.css`, `css/reset.css`, `css/interactions.css`

### 5.4 Code Quality

- **27 smoke tests** via vitest covering Sanitize and State modules
- **Window `onClose` callback** for cleanup (SkillsUniverse RAF cancellation on close)
- **17 dead files deleted** (test HTML, shell scripts, stale docs, log files)
- **Dead imports cleaned** from main.js

**Files Created**: `vitest.config.js`, `tests/sanitize.test.js`, `tests/state.test.js`

**Files Modified**: `js/windows.js`, `js/main.js`, `package.json`

**Files Deleted**: `setup-folders.sh`, `CONNECT_DOMAIN.md.resolved`, `FEATURE_VERIFICATION.md`, `NEXT_STEPS.md`

### Phase 5 File Changes Summary

**Files Created (4)**: `js/focus-trap.js`, `vitest.config.js`, `tests/sanitize.test.js`, `tests/state.test.js`

**Files Modified (32)**: See sections above

**Files Deleted (4)**: `setup-folders.sh`, `CONNECT_DOMAIN.md.resolved`, `FEATURE_VERIFICATION.md`, `NEXT_STEPS.md`

**Breaking Changes**: Admin panel removed from Settings UI (still accessible via `Admin.open()` in console)

---

## Phase 4: Visual Overhaul — v3.0 (January 2026)

### Summary

Major visual upgrades, performance overhaul, desktop reorganization, and easter eggs. See README.md v3.0 Release Notes for full details.

---

## Phase 3: Core OS Features (November 2025)

### Summary

Enhanced window management, desktop interaction, routing, and mobile support. Focus on professional OS-like experience with smooth animations and modern web features.

### 3.1 Enhanced Window Manager v1.0

**Files Modified**: `js/windows.js`, `css/windows.css`

**Features**:

- Smooth open animation (300ms cubic-bezier, scale from 0.85 + slide up 20px)
- Smooth close animation (200ms fade + scale to 0.9)
- Minimize to dock animation (250ms shrink to 0.3 scale + drop to bottom)
- Active window glow (enhanced 80px cyan border shadow)
- Closing state class for graceful transitions

**Code Changes**:

```javascript
// js/windows.js:466-487
close(id) {
    windowObj.element.classList.add('closing');
    setTimeout(() => {
        windowObj.element.remove();
        State.unregisterWindow(id);
        this.removeFromTaskbar(id);
    }, 200);
}
```

**CSS States**:

- `.window.visible` - Full opacity, scale 1
- `.window.minimized` - Opacity 0, scale 0.3, translateY(100vh)
- `.window.closing` - Opacity 0, scale 0.9
- `.window.active` - Enhanced border glow

**Testing**: See FEATURE_VERIFICATION.md section "Window Manager v1.0"

---

### 3.2 Desktop Icon System v1.0

**Files Modified**: `js/desktop.js`, `css/styles.css`

**Features**:

- Right-click context menus per icon
    - "Open" - Launches application
    - "Properties" - Shows icon metadata window
- Enhanced hover glow effects
    - Color-matched 30px shadow
    - 50px cyan ambient glow
    - Border color matches icon color
- Scale animations (1.1x hover, 0.95x click)

**Code Changes**:

```javascript
// js/desktop.js:159-163
icon.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    this.showIconContextMenu(e.clientX, e.clientY, item);
});
```

**Customization**:

```javascript
// js/desktop.js:10-45 DESKTOP_ITEMS array
{
    id: 'custom-app',
    label: 'MY_APP',
    icon: '🚀',
    color: '#00f0ff',
    action: () => this.openCustom()
}
```

---

### 3.3 Dock v1.0 (Enhanced)

**Files Modified**: `js/windows.js`, `css/styles.css`

**Features**:

- Active window pulsing glow (2s infinite animation)
- Minimized window indicators (0.6 opacity + cyan dot)
- Smart click behavior
    - Active window → Minimize
    - Minimized window → Restore
    - Inactive window → Focus
- Hover tooltips (`title` attribute)
- Icon float animation (5px translateY)

**CSS Animation**:

```css
/* css/styles.css:430-437 */
@keyframes dockPulse {
    0%,
    100% {
        box-shadow:
            0 0 15px var(--neon-cyan),
            0 0 25px rgba(0, 240, 255, 0.3);
    }
    50% {
        box-shadow:
            0 0 20px var(--neon-cyan),
            0 0 35px rgba(0, 240, 255, 0.5);
    }
}
```

---

### 3.4 Client-Side Routing

**Files Created**: `js/router.js` (75 lines)

**Files Modified**: `js/login.js`

**Features**:

- History API integration (`pushState`, `popstate`)
- Route mapping to window opens:
    - `/about` → ABOUT_ME window
    - `/work` → Applications window
    - `/media` → Media Vault window
    - `/connect` → Contact window
    - `/settings` → Settings window
    - `/resume` → Resume window
    - `/terminal` → Terminal window
- Browser back/forward button support
- Deep linking (shareable URLs)
- Link interception for internal navigation

**Usage**:

```javascript
// Navigate programmatically
Router.navigate('/about');

// Add custom route
Router.addRoute('/custom', () => Desktop.openCustom());
```

**Testing**: Navigate to `http://localhost:5173/about` after login

---

### 3.5 Mobile Detection Scaffold

**Files Created**: `js/mobile.js` (155 lines)

**Files Modified**: `js/login.js`

**Features**:

- Mobile device detection (user agent + touch + screen size)
- Automatic responsive CSS injection:
    - Full-screen windows on mobile
    - 3-column icon grid
    - Scaled dock (95% max-width)
    - Touch-friendly context menus
- Hover effects disabled on touch devices
- Viewport meta tag auto-injection
- Mobile optimized toast notification

**Detection Logic**:

```javascript
// js/mobile.js:9-18
isMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;

    return mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
}
```

**Responsive Breakpoints**:

- Desktop: >768px
- Mobile: ≤768px

---

### 3.6 Admin Dashboard v1.0

**Files Created**: `js/admin.js` (965 lines), `css/admin.css` (465 lines)

**Files Created**: `ADMIN_DASHBOARD_GUIDE.md`

**Files Modified**: `index.html`

**Features**:

- 5 tabbed sections:
    1. Desktop Items Editor (add/edit/delete/reorder)
    2. Projects Manager (CRUD operations)
    3. Media Manager (images + videos)
    4. Theme Customizer (colors, wallpapers, effects)
    5. Import/Export (backup/restore all data)
- Visual content editing (no code required)
- Real-time color preview
- Export to JSON files
- Complete backup system
- Professional cyberpunk UI

**Data Storage**:

- Desktop items: localStorage `desktopItems`
- Projects: localStorage `projects.json`
- Media: localStorage `media.json`
- Theme: localStorage `themeColors`

**Access**: Settings → Content Editor

**Documentation**: See ADMIN_DASHBOARD_GUIDE.md

---

### Phase 3 File Changes Summary

**Files Created (5)**:

1. `js/router.js` - Client-side routing (75 lines)
2. `js/mobile.js` - Mobile detection (155 lines)
3. `js/admin.js` - Admin dashboard (965 lines)
4. `css/admin.css` - Admin styling (465 lines)
5. `ADMIN_DASHBOARD_GUIDE.md` - Usage guide (30 pages)

**Files Modified (5)**:

1. `js/windows.js` - Close animation, taskbar state (+50 lines)
2. `css/windows.css` - Window animations (+48 lines)
3. `js/desktop.js` - Icon context menus (+60 lines)
4. `css/styles.css` - Dock animations, icon glow (+45 lines)
5. `js/login.js` - Router/Mobile init (+12 lines)
6. `index.html` - Admin CSS link (+1 line)

**Total New Code**: ~1,850 lines

**Breaking Changes**: None

---

## Phase 2: Content Features (October 2025)

### Summary

Enhanced content management with photo filters, wallpaper cycling, and video embedding support.

### 2.1 Photo Category Filters

**Files Modified**: `js/desktop.js`

**Features**:

- Photos now support `category` field
- Auto-generated filter buttons from categories
- Reuses existing `.app-filters` CSS
- Lightbox opens with filtered set
- Keyboard navigation within filtered set

**Usage**:

```javascript
// js/desktop.js openPhotos()
const photos = [
    {
        url: 'photo.jpg',
        caption: 'Description',
        category: 'Nature', // Category tag
    },
];
```

**Categories Auto-Generated**: Buttons created for each unique category value

---

### 2.2 Multiple Cycling Wallpapers

**Files Modified**: `js/desktop.js`

**Features**:

- Configurable `WALLPAPERS` array
- Context menu options:
    - "Next Wallpaper" - Cycles through list
    - "Random Wallpaper" - Random selection
- Wallpaper choice persists in localStorage
- Supports both images and gradients

**Wallpaper Array**:

```javascript
// js/desktop.js:350-360
WALLPAPERS: [
    'gradient:dark-ombre',
    'assets/wallpapers/wallpaper1.jpg',
    'assets/wallpapers/wallpaper2.jpg',
    'https://external-url.com/image.jpg'
],
```

**Gradient Support**: Use `'gradient:dark-ombre'` token

---

### 2.3 YouTube/Vimeo Embed Support

**Files Modified**: `js/lightbox.js`, `js/desktop.js`, `css/styles.css`

**Features**:

- Auto-detection of video type (YouTube/Vimeo/MP4)
- YouTube embed support (`youtube.com/watch?v=` and `youtu.be/`)
- Vimeo embed support (`vimeo.com/VIDEO_ID`)
- MP4 fallback (backwards compatible)
- All videos use same lightbox interface

**Detection Methods**:

```javascript
// js/lightbox.js:50-75
detectVideoType(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'mp4';
}
```

**Embed Creation**:

- YouTube: Creates iframe with video ID
- Vimeo: Creates iframe with video ID
- MP4: Creates native `<video>` element

---

### 2.4 Simplified Login Screen

**Files Modified**: `index.html`, `js/login.js`, `css/styles.css`

**Features**:

- Removed password field (was confusing)
- Simple "Continue" button
- Clear messaging ("Welcome" + "View my portfolio")
- Keyboard accessible (Tab, Enter)
- All animations preserved

**Customization**:

```html
<!-- index.html -->
<h1 class="login-username">Your Name</h1>
<p class="login-subtitle">Your Tagline</p>
```

---

### Phase 2 File Changes Summary

**Files Modified (5)**:

1. `js/desktop.js` - Photo filters, wallpapers, videos (+140 lines)
2. `js/lightbox.js` - Video detection & embeds (+80 lines)
3. `js/login.js` - Simplified handlers (+20 lines)
4. `index.html` - Continue button (+15 lines)
5. `css/styles.css` - Button/iframe styles (+40 lines)

**Total Changes**: ~295 lines

**Breaking Changes**: None (backwards compatible)

---

## Phase 1: Foundation (September 2025)

### Summary

Initial implementation of core desktop OS functionality.

### 1.1 Lock & Login System

**Files**: `js/login.js`, `css/styles.css`, `index.html`

**Features**:

- Lock screen with time/date
- Login screen with boot sequence
- Click or Enter to advance
- Smooth transitions between states
- Warp tunnel effect on login

---

### 1.2 Desktop Environment

**Files**: `js/desktop.js`, `css/styles.css`

**Features**:

- Desktop icons with click handlers
- Icon positioning and styling
- Desktop background system
- Context menu (right-click)
    - Toggle theme
    - Change wallpaper

---

### 1.3 Window System

**Files**: `js/windows.js`, `css/windows.css`, `js/state.js`

**Features**:

- Window creation and management
- Drag to move (titlebar)
- Resize from bottom-right corner
- Minimize/Maximize/Close buttons
- Z-index management (click to focus)
- Window state persistence (localStorage)
- Taskbar integration
- ESC key to close

---

### 1.4 Start Menu & Taskbar

**Files**: `js/startmenu.js`, `css/styles.css`

**Features**:

- Start menu with sections
- System tray with clock
- Theme toggle button
- Open window indicators
- Keyboard navigation

---

### 1.5 Content Windows

**Files**: `js/desktop.js`

**Implemented Windows**:

- Photos (grid view + lightbox)
- Videos (grid view + lightbox)
- Applications (project showcase with filters)
- Resume (PDF viewer)
- About (bio/skills/experience)
- Contact (form with validation)
- Settings (theme/wallpaper/effects)

---

### 1.6 Lightbox System

**Files**: `js/lightbox.js`, `css/styles.css`

**Features**:

- Image viewer with arrows/ESC
- Video player
- Keyboard navigation
- Touch gestures (mobile)
- Smooth transitions

---

### Phase 1 File Changes Summary

**Files Created (~15)**:

- All core JS modules
- All CSS files
- HTML structure
- Data files (projects.json)

**Total Initial Code**: ~3,500 lines

---

## Upgrade Paths

### From Phase 1 to Phase 2:

No breaking changes. Add new features directly.

### From Phase 2 to Phase 3:

1. Add new files: `js/router.js`, `js/mobile.js`, `js/admin.js`, `css/admin.css`
2. Update imports in `js/login.js`
3. Test routing by navigating to `/about`
4. Test mobile by resizing browser
5. Access admin via Settings → Content Editor

### From Phase 3 to Current:

You're on the latest version!

---

## Migration Guides

### Enable Routing (Phase 3)

```javascript
// Already integrated in login.js
// Routes auto-activate after desktop loads
// Test: Navigate to http://localhost:5173/about
```

### Enable Mobile (Phase 3)

```javascript
// Auto-detects on page load
// Test: Resize browser to <768px
```

### Enable Admin Dashboard (Phase 3)

```javascript
// Access: Settings → Content Editor
// Or: Desktop.openAdminDashboard() in console
```

---

## Future Roadmap

### Planned Features:

- Blog system (markdown-based)
- Project detail pages (case studies)
- Achievement badges
- PWA support (offline mode)
- Advanced window features (snapping, multi-desktop)
- Performance optimizations

### Under Consideration:

- Drag-and-drop file upload
- Window session restore
- Keyboard shortcuts (Cmd+K palette)
- Search functionality
- Notification system

---

## Version History

| Version | Date     | Phase   | Key Features                                     |
| ------- | -------- | ------- | ------------------------------------------------ |
| 3.2.0   | Feb 2026 | Minor   | Icon reorder, 18-project showcase, Orbitron font  |
| 3.1.2   | Feb 2026 | Patch   | MMBN cyberspace grid background                   |
| 3.1.1   | Feb 2026 | Patch   | Desktop wheel quality, galaxy boot background     |
| 3.1     | Feb 2026 | Phase 5 | Security audit, perf, a11y, 27 tests             |
| 3.0     | Jan 2026 | Phase 4 | Visual overhaul, easter eggs, desktop reorder     |
| 2.56    | Nov 2025 | Phase 3 | Admin Dashboard, Routing, Mobile, Enhanced UI     |
| 2.45    | Oct 2025 | Phase 2 | Photo filters, Wallpapers, Video embeds           |
| 2.30    | Sep 2025 | Phase 1 | Core OS, Windows, Desktop, Login                  |
| 1.00    | Aug 2025 | Alpha   | Initial prototype                                 |

---

## Breaking Changes Log

**None to date.** All phases maintain backwards compatibility.

---

## Deprecation Notices

**None to date.** All features remain supported.

---

## Contributors

- **Primary Developer**: Developed with Claude Code (Anthropic)
- **Design Inspiration**: Windows 11, macOS, Cyberpunk aesthetics
- **Libraries**: Vanilla JavaScript (no dependencies)

---

## Related Documentation

- **Complete Guide**: [DOCUMENTATION.md](DOCUMENTATION.md)
- **Admin Dashboard**: [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

**Latest Version**: 3.12.0

**Status**: ✅ Production Ready

**License**: MIT

**Built with ❤️ using vanilla JavaScript** - No frameworks, no dependencies.
