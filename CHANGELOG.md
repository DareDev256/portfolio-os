# Passion OS - Development Changelog

---

title: Passion OS Changelog
version: 3.6.2
last_updated: 2026-02-12

---

<!-- AI Context: Complete development history organized by phases.
     Related files: All js/*.js, css/*.css
     See: DOCUMENTATION.md for usage, FEATURE_VERIFICATION.md for testing -->

## Overview

This changelog documents the evolutionary development of Passion OS from initial concept to current state. Features are organized by implementation phases with the newest changes first.

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

**Latest Version**: 3.5.2

**Status**: ✅ Production Ready

**License**: MIT

**Built with ❤️ using vanilla JavaScript** - No frameworks, no dependencies.
