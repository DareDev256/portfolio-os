# Passion OS - System Architecture

---

title: Passion OS Architecture
version: 3.8.2
last_updated: 2026-02-12
type: technical_reference
audience: developers, AI

---

<!-- AI Context: System architecture documentation for Passion OS v3.8.2.
     Purpose: Understand module dependencies, data flow, and file organization
     Related: DOCUMENTATION.md (user guide), CHANGELOG.md (history)
     Entry point: js/main.js
     Module count: 38 JS modules, 18 CSS files, 8 test suites (97 tests) -->

## Table of Contents

1. [System Overview](#system-overview)
2. [Module Architecture](#module-architecture)
3. [Data Flow](#data-flow)
4. [File Organization](#file-organization)
5. [Initialization Sequence](#initialization-sequence)
6. [State Management](#state-management)
7. [Module Dependencies](#module-dependencies)
8. [Extension Points](#extension-points)

---

## System Overview

Passion OS is a **vanilla JavaScript** portfolio operating system — Three.js for 3D, DOMPurify for XSS protection, zero framework dependencies. It follows a **modular architecture** with clear separation of concerns.

### Core Principles

- **No frameworks** — Pure JavaScript (ES6 modules), 38 hand-written modules
- **Security-first** — All `innerHTML` routed through DOMPurify, CSP headers, input sanitization
- **localStorage-first** — Client-side state persistence via centralized helpers
- **CustomEvent observer pattern** — State decoupled from visual modules
- **Lazy loading** — Terminal, GitHub, Skills only fetched on window open
- **Mobile-responsive** — Auto-detects and adapts to mobile devices

### Architecture Pattern

```
┌─────────────────────────────────────────┐
│           User Interface Layer          │
│  (HTML + 18 CSS modules + Visual FX)   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Application Layer               │
│  Desktop │ Windows │ Router │ Admin     │
│  Command Palette │ Terminal │ GitHub    │
│  Portfolio │ System Monitor │ Tour      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Shared Utilities Layer          │
│  sanitize.js │ dom-helpers.js           │
│  data-loader.js │ focus-trap.js         │
│  modal.js │ loader.js                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           State Layer                   │
│  State.js + CustomEvent bus             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Data Layer                    │
│  localStorage │ JSON files │ Assets     │
└─────────────────────────────────────────┘
```

---

## Module Architecture

### Module Categories

Passion OS consists of **38 JavaScript modules** organized into 9 functional categories:

#### 1. Core System (4 modules)

| Module | File          | Purpose                                       |
| ------ | ------------- | --------------------------------------------- |
| Main   | `js/main.js`  | Entry point, orchestrates boot, lazy-loads FX |
| State  | `js/state.js` | localStorage persistence + CustomEvent bus    |
| Login  | `js/login.js` | Lock screen + 3D wheel init                   |
| Boot   | `js/boot.js`  | Cinematic boot sequence                       |

#### 2. Desktop Environment (3 modules)

| Module  | File            | Purpose                                 |
| ------- | --------------- | --------------------------------------- |
| Desktop | `js/desktop.js` | Icon grid, context menus, app launchers |
| Windows | `js/windows.js` | Window manager (drag, resize, z-index)  |
| Router  | `js/router.js`  | History API deep-linkable routing       |

#### 3. Shared Utilities (6 modules) — _added v3.1–v3.7_

| Module      | File                | Purpose                                                  |
| ----------- | ------------------- | -------------------------------------------------------- |
| Sanitize    | `js/sanitize.js`    | DOMPurify wrapper for all innerHTML                      |
| DOM Helpers | `js/dom-helpers.js` | `openExternal`, `animateCounter`, `loadJSON`, `saveJSON` |
| Data Loader | `js/data-loader.js` | Centralized JSON fetcher with in-memory caching          |
| Focus Trap  | `js/focus-trap.js`  | WCAG focus trapping (Tab/Shift+Tab cycling)              |
| Modal       | `js/modal.js`       | Prompt/alert dialogs with focus trapping                 |
| Loader      | `js/loader.js`      | DOM-safe loading states                                  |

#### 4. UI Components (6 modules)

| Module          | File                    | Purpose                                      |
| --------------- | ----------------------- | -------------------------------------------- |
| Command Palette | `js/command-palette.js` | Cmd+K fuzzy-search launcher                  |
| Lightbox        | `js/lightbox.js`        | Image/video viewer (YouTube, Vimeo, MP4)     |
| Start Menu      | `js/startmenu.js`       | Start menu + system tray                     |
| Skills          | `js/skills.js`          | Interactive skills force-graph visualization |
| Welcome         | `js/welcome.js`         | First-visit welcome overlay                  |
| Tour            | `js/tour.js`            | Interactive guided tour                      |

#### 5. Application Windows (3 modules) — _added v3.3–v3.6_

| Module         | File                   | Purpose                                   |
| -------------- | ---------------------- | ----------------------------------------- |
| Terminal       | `js/terminal.js`       | Dev terminal with 18 sass commands        |
| GitHub         | `js/github.js`         | Live GitHub API integration               |
| System Monitor | `js/system-monitor.js` | Live FPS graph, heap, DOM count dashboard |

#### 6. 3D / Visual Effects (6 modules)

| Module         | File                      | Purpose                                          |
| -------------- | ------------------------- | ------------------------------------------------ |
| Galaxy BG      | `js/galaxy-background.js` | Three.js MMBN cyberspace grid                    |
| Mahoraga Wheel | `js/mahoraga-wheel-3d.js` | Three.js 3D wheel (60fps desktop / 30fps mobile) |
| Aurora         | `js/aurora.js`            | Aurora visual effects (~24fps throttled)         |
| FX             | `js/fx.js`                | Visual FX layer (~30fps throttled)               |
| Glyphs         | `js/glyphs.js`            | Glyph rendering system                           |
| Warp           | `js/warp.js`              | Warp tunnel transition effect                    |

#### 7. Interactions Subsystem (7 modules)

| Module             | File                                    | Purpose                        |
| ------------------ | --------------------------------------- | ------------------------------ |
| Engine             | `js/interactions/engine.js`             | Orchestrator (30fps throttled) |
| Cursor Trail       | `js/interactions/cursor-trail.js`       | Particle cursor effects        |
| Cursor Tracker     | `js/interactions/cursor-tracker.js`     | Mouse position tracking        |
| Cursor Reactive    | `js/interactions/cursor-reactive.js`    | Reactive cursor animations     |
| Sound Manager      | `js/interactions/sound-manager.js`      | UI sound effects               |
| Easter Eggs        | `js/interactions/easter-eggs.js`        | Konami, 418, glitch pulse      |
| Micro-Interactions | `js/interactions/micro-interactions.js` | Hover/click micro-animations   |

#### 8. Enhanced Features (2 modules)

| Module | File           | Purpose                                |
| ------ | -------------- | -------------------------------------- |
| Admin  | `js/admin.js`  | No-code content editor (console-only)  |
| Mobile | `js/mobile.js` | Touch detection + responsive injection |

#### 9. Audio (1 module)

| Module  | File            | Purpose              |
| ------- | --------------- | -------------------- |
| AudioFX | `js/audiofx.js` | Audio effects system |

#### Test Suites (8 files, 97 tests)

| Suite       | File                        | Tests | Covers                              |
| ----------- | --------------------------- | ----- | ----------------------------------- |
| Sanitize    | `tests/sanitize.test.js`    | 12    | XSS sanitization                    |
| State       | `tests/state.test.js`       | 15    | State persistence + events          |
| Data Loader | `tests/data-loader.test.js` | 9     | JSON fetch + cache                  |
| Router      | `tests/router.test.js`      | 12    | Path validation + routing           |
| Focus Trap  | `tests/focus-trap.test.js`  | 7     | Tab cycling + cleanup               |
| Lightbox    | `tests/lightbox.test.js`    | 14    | Video ID validation + sandbox       |
| DOM Helpers | `tests/dom-helpers.test.js` | 13    | openExternal, animateCounter, JSON  |
| Modal       | `tests/modal.test.js`       | 15    | Dialog init, dismiss, prompt, alert |

---

## Data Flow

### localStorage → State → UI Pipeline

```
┌─────────────────┐
│  localStorage   │  (Browser Storage)
└────────┬────────┘
         │
         │ Load on init
         ▼
┌─────────────────┐
│   State.js      │  (Central State Manager)
│                 │
│ • theme         │  ──┐
│ • wallpaper     │    │
│ • fxEnabled     │    │ Read by modules
│ • windowStates  │    │
│ • windows Map   │  ◄─┘
└────────┬────────┘
         │
         │ State changes
         ▼
┌─────────────────┐
│  UI Modules     │
│                 │
│ Desktop.js      │ ──► Desktop background, icons
│ Windows.js      │ ──► Window positions, states
│ FX/Aurora       │ ──► Visual effects toggle
└────────┬────────┘
         │
         │ User interactions
         ▼
┌─────────────────┐
│  State.js       │  Save to localStorage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  localStorage   │  (Persisted)
└─────────────────┘
```

### Data Sources

| Data Type     | Source                                                  | Consumed By                      | Format                         |
| ------------- | ------------------------------------------------------- | -------------------------------- | ------------------------------ |
| Desktop Items | `localStorage.desktopItems` or `js/desktop.js:10-45`    | Desktop.js                       | JSON array                     |
| Projects      | `localStorage['projects.json']` or `data/projects.json` | Desktop.js (Applications)        | JSON array                     |
| Media         | `localStorage['media.json']` or `data/media.json`       | Desktop.js (Photos/Videos)       | JSON array                     |
| Theme         | `localStorage.theme`                                    | State.js → CSS variables         | String                         |
| Wallpaper     | `localStorage.wallpaper`                                | State.js → CSS `--wallpaper-url` | String (URL or gradient token) |
| Window States | `localStorage.windowStates`                             | State.js → Windows.js            | JSON object                    |
| FX Settings   | `localStorage.fxEnabled`, etc.                          | State.js → FX/Aurora/Glyphs      | Boolean (stored as '0'/'1')    |

### Content Flow Example: Opening a Photo Gallery

```
User clicks "PHOTOS" desktop icon
        │
        ▼
Desktop.openPhotos() called
        │
        ├─► Read localStorage['media.json']
        │   (or fallback to default photos array)
        │
        ▼
WindowManager.open({
    title: 'PHOTOS',
    content: '<photo grid HTML>'
})
        │
        ├─► State.registerWindow(id, windowObj)
        ├─► State.getNextZIndex() → Apply z-index
        ├─► Render window with animations
        │
        ▼
User clicks photo
        │
        ▼
Lightbox.open(photoArray, index)
        │
        ├─► Render fullscreen photo viewer
        ├─► Setup keyboard navigation (←/→/ESC)
        │
        ▼
User closes lightbox (ESC)
        │
        ▼
Lightbox.close()
```

---

## File Organization

### Project Structure

See README.md for the complete annotated architecture tree with all 38 JS modules, 18 CSS files, and 8 test suites.

### Key Files Reference

| File Path                   | Purpose                      | Primary Exports                         |
| --------------------------- | ---------------------------- | --------------------------------------- |
| `js/main.js`                | Entry point                  | `init()` function                       |
| `js/state.js`               | State + CustomEvent bus      | `State` object                          |
| `js/desktop.js`             | Desktop controller           | `Desktop` object                        |
| `js/windows.js`             | Window manager               | `WindowManager` object                  |
| `js/sanitize.js`            | DOMPurify wrapper            | `sanitizeHTML()`                        |
| `js/dom-helpers.js`         | Shared DOM utilities         | `openExternal`, `loadJSON`, `saveJSON`  |
| `js/data-loader.js`         | Centralized JSON fetch+cache | `loadData`, `loadMedia`, `loadProjects` |
| `js/focus-trap.js`          | WCAG focus trapping          | `trapFocus(container)`                  |
| `js/command-palette.js`     | Cmd+K launcher               | `CommandPalette` object                 |
| `js/interactions/engine.js` | Interaction orchestrator     | `InteractionEngine` object              |

---

## Initialization Sequence

### Startup Flow

```
1. Browser loads index.html
        │
        ▼
2. HTML loads 18 CSS files (reset → variables → styles → ... → admin)
        │
        ▼
3. <script type="module" src="/js/main.js">
        │
        ├─► State.init() — loads theme, wallpaper, FX from localStorage
        ├─► Galaxy background initializes (Three.js cyberspace grid)
        │
        ▼
4. DOMContentLoaded → main.js init()
        │
        ├─► Check ?safe=1 (disables all effects)
        ├─► FX.init(), Aurora.init(), Glyphs.init(), AudioFX.init()
        ├─► InteractionEngine.init() (lazy-loads cursor trail, easter eggs, etc.)
        ├─► CommandPalette.init()
        ├─► Boot.start() → Login.init()
        │
        ▼
5. Lock screen — Mahoraga 3D wheel renders (60fps desktop / 30fps mobile)
        │
        ▼
6. User clicks → Desktop.init() + WindowManager.init() + Router.init() + Mobile.init()
        │
        ├─► Router checks URL → opens matching window
        ├─► Welcome overlay (first visit only)
        ├─► Service worker registers
        │
        ▼
7. Desktop ready — apps lazy-load on open (terminal, github, skills, sys-monitor)
```

### Safe Mode

Access `http://localhost:5173/?safe=1` to disable all visual effects. Useful for debugging, low-powered devices, and testing without distractions.

---

## State Management

### State.js Architecture

The **State** module is the **single source of truth** for application state. It follows these patterns:

#### 1. Centralized State

```javascript
// File: js/state.js lines 6-26

export const State = {
    // Z-index management
    currentZIndex: 100,
    maxZIndex: 100,

    // Window registry (Map of window objects)
    windows: new Map(),

    // Persisted settings
    theme: 'light',
    wallpaper: 'assets/wallpapers/default.jpg',
    fxEnabled: false,
    auroraEnabled: false,
    glyphsEnabled: true,
    soundEnabled: true,

    // Configuration
    idleTime: 120000, // 2 minutes
};
```

#### 2. Persistence Layer

State automatically syncs to `localStorage`:

```javascript
// File: js/state.js lines 30-65

init() {
    // Load from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        this.theme = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);
    }

    const savedWallpaper = localStorage.getItem('wallpaper');
    if (savedWallpaper) {
        this.wallpaper = savedWallpaper;
        this.applyWallpaper(savedWallpaper);
    }

    // ... load all other settings
}
```

```javascript
// File: js/state.js lines 71-75

setTheme(theme) {
    this.theme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // Auto-persist
}
```

#### 3. Window Registry

All open windows are tracked in a `Map`:

```javascript
// File: js/state.js lines 160-185

registerWindow(id, windowObj) {
    this.windows.set(id, windowObj);
}

unregisterWindow(id) {
    this.windows.delete(id);
    this.saveWindowStates();
}

getWindow(id) {
    return this.windows.get(id);
}

getAllWindows() {
    return Array.from(this.windows.values());
}
```

#### 4. Z-Index Management

Windows use incrementing z-index for stacking:

```javascript
// File: js/state.js lines 149-156

getNextZIndex() {
    this.currentZIndex++;
    if (this.currentZIndex > this.maxZIndex) {
        this.maxZIndex = this.currentZIndex;
    }
    return this.currentZIndex;
}
```

### localStorage Keys

| Key             | Type        | Purpose            | Example Value                     |
| --------------- | ----------- | ------------------ | --------------------------------- |
| `theme`         | string      | Color theme        | `"dark"`                          |
| `wallpaper`     | string      | Background         | `"assets/wallpapers/default.jpg"` |
| `fxEnabled`     | string      | Particle FX        | `"1"` or `"0"`                    |
| `auroraEnabled` | string      | Aurora effect      | `"1"` or `"0"`                    |
| `glyphsEnabled` | string      | Floating glyphs    | `"1"` or `"0"`                    |
| `soundEnabled`  | string      | Audio FX           | `"1"` or `"0"`                    |
| `windowStates`  | JSON string | Window positions   | `{"about":{"x":100,"y":100,...}}` |
| `desktopItems`  | JSON string | Custom icons       | `[{id:"app",label:"MY_APP",...}]` |
| `projects.json` | JSON string | Portfolio projects | `[{title:"Project 1",...}]`       |
| `media.json`    | JSON string | Photos/videos      | `[{url:"photo.jpg",...}]`         |

---

## Module Dependencies

### Import Graph

```
main.js
  ├─► state.js (foundation — no dependencies)
  ├─► galaxy-background.js → THREE
  ├─► fx.js → state.js
  ├─► aurora.js → state.js
  ├─► glyphs.js → state.js
  ├─► audiofx.js → state.js
  ├─► interactions/engine.js (lazy-loads 6 sub-modules)
  │     ├─► cursor-trail.js, cursor-tracker.js, cursor-reactive.js
  │     ├─► sound-manager.js, easter-eggs.js, micro-interactions.js
  │     └─► state.js
  ├─► command-palette.js → desktop.js
  ├─► boot.js (no dependencies)
  └─► login.js
        ├─► state.js
        ├─► mahoraga-wheel-3d.js → THREE
        ├─► desktop.js
        │     ├─► state.js, windows.js, sanitize.js
        │     ├─► dom-helpers.js, data-loader.js
        │     ├─► lightbox.js → focus-trap.js
        │     ├─► modal.js → focus-trap.js
        │     └─► admin.js → data-loader.js
        ├─► windows.js → state.js
        ├─► router.js → desktop.js
        ├─► mobile.js
        ├─► welcome.js → focus-trap.js
        └─► tour.js → focus-trap.js
```

Lazy-loaded on window open (not imported at boot):

- `terminal.js` — loaded when DEV_TERMINAL opened
- `github.js` — loaded when GITHUB_OPS opened
- `skills.js` — loaded when SKILLS_MATRIX opened
- `system-monitor.js` — loaded when SYS_MONITOR opened

### Dependency Rules

1. **State.js has no dependencies** — It's the foundation
2. **Shared utilities have no app dependencies** — sanitize, dom-helpers, data-loader, focus-trap
3. **Visual FX modules only depend on State** — Self-contained, auto-pause when tab hidden
4. **Desktop depends on Windows** — Desktop creates windows
5. **Router depends on Desktop** — Router opens desktop windows
6. **All innerHTML goes through sanitize.js** — Security invariant

### Circular Dependency Prevention

- **Router** imports `Desktop`, but Desktop doesn't import Router
- **State** emits `CustomEvent` — FX modules listen; no import coupling
- **Windows** registers itself with `State`, but State doesn't import Windows
- **Lightbox** is opened by Desktop, but doesn't import Desktop

---

## Extension Points

### How to Extend Passion OS

#### 1. Add a New Desktop Icon

**Location**: `js/desktop.js` lines 10-45

```javascript
DESKTOP_ITEMS: [
    // ... existing icons
    {
        id: 'my-feature',
        label: 'MY_FEATURE',
        icon: '🎯',
        color: '#ff00ff',
        action: () => this.openMyFeature(),
    },
];
```

Then add the method:

```javascript
openMyFeature() {
    WindowManager.open({
        id: 'my-feature',
        title: 'MY FEATURE',
        content: '<div>Custom content</div>',
        width: 800,
        height: 600
    });
}
```

#### 2. Add a New Route

**Location**: `js/router.js` lines 15-30

```javascript
// In Router.init()
this.addRoute('/my-page', () => Desktop.openMyFeature());
```

#### 3. Add a Visual Effect Module

Create `js/my-effect.js`:

```javascript
export const MyEffect = {
    enabled: false,

    init() {
        // Setup effect
    },

    setEnabled(value) {
        this.enabled = value;
        // Toggle effect
    },
};
```

Import in `js/main.js`:

```javascript
import { MyEffect } from './my-effect.js';

function init() {
    MyEffect.init();
    MyEffect.setEnabled(State.myEffectEnabled);
}
```

#### 4. Add Admin Dashboard Section

**Location**: `js/admin.js` lines 100-200

Add a new tab to the admin dashboard by modifying the `this.sections` array and implementing the render method.

#### 5. Add Custom localStorage Data

```javascript
// Save custom data
const myData = { foo: 'bar' };
localStorage.setItem('myData', JSON.stringify(myData));

// Load custom data
const saved = localStorage.getItem('myData');
const myData = saved ? JSON.parse(saved) : defaultData;
```

---

## Performance Considerations

### Optimization Patterns Used

1. **Lazy Initialization**
    - Visual effects only initialize when needed
    - Windows only render when opened

2. **Event Delegation**
    - Desktop uses single click listener for all icons
    - Window manager uses single mousedown listener

3. **Debounced Resize**
    - Window resize handler uses 250ms debounce
    - Prevents excessive layout recalculations

4. **CSS Transitions Over JS**
    - Window animations use CSS transitions
    - GPU-accelerated transforms (translate, scale)

5. **LocalStorage Batching**
    - Window states saved on close, not on every move
    - Reduces localStorage write operations

### Performance Metrics

- **Initial Load**: ~200ms (without effects)
- **Window Open**: ~300ms (with animation)
- **Desktop Icons**: Instant (CSS transitions)
- **Lightbox Open**: ~200ms

---

## Browser Compatibility

### Requirements

- **ES6 Module Support** (Chrome 61+, Firefox 60+, Safari 11+)
- **CSS Custom Properties** (All modern browsers)
- **History API** (For routing)
- **localStorage** (All browsers)
- **Optional**: Service Worker (for PWA)

### Fallbacks

- No JavaScript fallback (not applicable for this app)
- Safe mode disables effects for low-powered devices
- Mobile detection provides touch-optimized UI

---

## Related Documentation

- **User Guide**: [DOCUMENTATION.md](../DOCUMENTATION.md)
- **Development History**: [CHANGELOG.md](../CHANGELOG.md)
- **Admin Dashboard**: [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md)
- **Terminology**: [GLOSSARY.md](GLOSSARY.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Architecture Version**: 3.8.2

**Last Updated**: February 2026

---

<!-- AI Parsing Notes:
- Module count: 38 JavaScript files (31 root + 7 interactions/)
- CSS count: 18 stylesheets
- Test count: 8 suites, 97 tests (vitest + jsdom)
- Initialization: main.js → state.js → galaxy → boot → login → desktop
- State pattern: Centralized singleton with CustomEvent bus + localStorage
- Security: All innerHTML via DOMPurify, CSP headers, input sanitization
- Data flow: localStorage → data-loader.js → State → Modules → UI → localStorage
- Extension points: Desktop icons, Routes, Effects, Admin sections
-->
