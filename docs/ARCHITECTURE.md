# Passion OS - System Architecture

---

title: Passion OS Architecture
version: 2.56
last_updated: 2025-11-27
type: technical_reference
audience: developers, AI

---

<!-- AI Context: System architecture documentation for Passion OS.
     Purpose: Understand module dependencies, data flow, and file organization
     Related: DOCUMENTATION.md (user guide), CHANGELOG.md (history)
     Entry point: js/main.js -->

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

Passion OS is a **vanilla JavaScript** portfolio operating system with no external dependencies. It follows a **modular architecture** with clear separation of concerns.

### Core Principles

- **No frameworks** - Pure JavaScript (ES6 modules)
- **No build step required** - Runs directly in browser (Vite dev server optional)
- **localStorage-first** - Client-side state persistence
- **Progressive enhancement** - Works without JavaScript effects
- **Mobile-responsive** - Auto-detects and adapts to mobile devices

### Architecture Pattern

```
┌─────────────────────────────────────────┐
│           User Interface Layer          │
│  (HTML + CSS + Visual Effects)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Application Layer               │
│  Desktop │ Windows │ Router │ Admin     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           State Layer                   │
│  (State.js + localStorage)              │
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

Passion OS consists of **17 JavaScript modules** organized into 6 functional categories:

#### 1. Core System (4 modules)

| Module | File          | Purpose                                  | Lines |
| ------ | ------------- | ---------------------------------------- | ----- |
| Main   | `js/main.js`  | Entry point, initialization orchestrator | 111   |
| State  | `js/state.js` | Global state + localStorage persistence  | 231   |
| Login  | `js/login.js` | Authentication flow, desktop loader      | ~300  |
| Boot   | `js/boot.js`  | Boot sequence animation                  | ~150  |

#### 2. Desktop Environment (3 modules)

| Module  | File            | Purpose                                | Lines |
| ------- | --------------- | -------------------------------------- | ----- |
| Desktop | `js/desktop.js` | Icon management, content windows       | ~800  |
| Windows | `js/windows.js` | Window manager (drag, resize, z-index) | ~600  |
| Router  | `js/router.js`  | Client-side routing (History API)      | 75    |

#### 3. UI Components (3 modules)

| Module     | File              | Purpose                   | Lines |
| ---------- | ----------------- | ------------------------- | ----- |
| Lightbox   | `js/lightbox.js`  | Photo/video viewer        | ~200  |
| Start Menu | `js/startmenu.js` | Application launcher menu | ~250  |
| Skills     | `js/skills.js`    | Command palette (Cmd+K)   | ~400  |

#### 4. Visual Effects (4 modules)

| Module | File           | Purpose                    | Lines |
| ------ | -------------- | -------------------------- | ----- |
| FX     | `js/fx.js`     | Particle effects layer     | ~300  |
| Aurora | `js/aurora.js` | Aurora borealis background | ~250  |
| Glyphs | `js/glyphs.js` | Floating glyph animations  | ~200  |
| Warp   | `js/warp.js`   | Login warp tunnel effect   | ~150  |

#### 5. Enhanced Features (2 modules)

| Module | File           | Purpose                           | Lines |
| ------ | -------------- | --------------------------------- | ----- |
| Admin  | `js/admin.js`  | Content management dashboard      | 965   |
| Mobile | `js/mobile.js` | Mobile detection + responsive CSS | 155   |

#### 6. Audio (1 module)

| Module  | File            | Purpose              | Lines |
| ------- | --------------- | -------------------- | ----- |
| AudioFX | `js/audiofx.js` | Sound effects system | ~200  |

**Total Code**: ~5,500 lines of JavaScript

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

```
/Users/t./Documents/Website/
│
├── index.html              # Main HTML entry point
├── sw.js                   # Service worker (PWA support)
│
├── js/                     # JavaScript modules (17 files)
│   ├── main.js            # Entry point
│   ├── state.js           # State management
│   ├── login.js           # Login flow
│   ├── boot.js            # Boot sequence
│   ├── desktop.js         # Desktop manager
│   ├── windows.js         # Window manager
│   ├── router.js          # Client-side routing
│   ├── mobile.js          # Mobile detection
│   ├── admin.js           # Admin dashboard
│   ├── lightbox.js        # Media viewer
│   ├── startmenu.js       # Start menu
│   ├── skills.js          # Command palette
│   ├── fx.js              # Particle FX
│   ├── aurora.js          # Aurora effect
│   ├── glyphs.js          # Floating glyphs
│   ├── warp.js            # Warp tunnel
│   └── audiofx.js         # Sound effects
│
├── css/                    # Stylesheets (5 files)
│   ├── reset.css          # CSS reset
│   ├── variables.css      # CSS custom properties
│   ├── styles.css         # Main styles
│   ├── windows.css        # Window-specific styles
│   └── admin.css          # Admin dashboard styles
│
├── data/                   # JSON data files
│   ├── projects.json      # Portfolio projects (optional)
│   └── media.json         # Photos/videos (optional)
│
├── assets/                 # Static assets
│   ├── wallpapers/        # Background images
│   ├── sounds/            # Audio files
│   └── resume/            # PDF resume
│
└── docs/                   # Documentation
    ├── ARCHITECTURE.md    # This file
    ├── GLOSSARY.md        # Terminology
    ├── TROUBLESHOOTING.md # Common issues
    ├── README.md          # Documentation index
    └── archive/           # Old documentation
```

### Key Files Reference

| File Path            | Purpose            | Primary Exports         |
| -------------------- | ------------------ | ----------------------- |
| `js/main.js`         | Entry point        | `init()` function       |
| `js/state.js`        | State manager      | `State` object          |
| `js/desktop.js`      | Desktop controller | `Desktop` object        |
| `js/windows.js`      | Window manager     | `WindowManager` object  |
| `js/router.js`       | Router             | `Router` object         |
| `js/admin.js`        | Admin dashboard    | `AdminDashboard` object |
| `index.html`         | HTML structure     | N/A (loaded by browser) |
| `css/variables.css`  | Theme colors       | CSS custom properties   |
| `data/projects.json` | Projects data      | JSON array              |
| `data/media.json`    | Media data         | JSON array              |

---

## Initialization Sequence

### Startup Flow

The application initializes in this exact order:

```
1. Browser loads index.html
        │
        ▼
2. HTML loads CSS files (reset → variables → styles → windows → admin)
        │
        ▼
3. HTML loads <script type="module" src="/js/main.js">
        │
        ▼
4. main.js imports all modules
        │
        ├─► State.js executes (calls State.init() automatically)
        │   └─► Loads theme, wallpaper, FX settings from localStorage
        │
        ├─► Other modules imported (but not initialized yet)
        │
        ▼
5. DOMContentLoaded fires → main.js init() called
        │
        ├─► Check for ?safe=1 parameter (disables effects)
        │
        ├─► Initialize visual effects modules
        │   ├─► FX.init()
        │   ├─► Aurora.init()
        │   ├─► Glyphs.init()
        │   └─► AudioFX.init()
        │
        ├─► Initialize Skills (command palette)
        │
        ├─► Start boot sequence
        │   └─► Boot.start() → callback to Login.init()
        │
        ▼
6. Boot sequence completes → Login.init() called
        │
        ├─► Setup login button handler
        │
        ▼
7. User clicks "INITIALIZE" button
        │
        ├─► Play boot animation
        │
        ├─► Initialize Desktop
        │   ├─► Desktop.init()
        │   ├─► WindowManager.init()
        │   ├─► Router.init()
        │   └─► Mobile.init()
        │
        ├─► Hide login screen
        │
        ├─► Show desktop with fade-in
        │
        ▼
8. Desktop ready
        │
        ├─► Router checks URL (e.g., /about)
        │   └─► Opens matching window if route found
        │
        ├─► User can now interact with desktop icons
        │
        └─► Service worker registers (PWA support)
```

### Code Reference: main.js Initialization

```javascript
// File: js/main.js lines 26-54

function init() {
    // State already initialized on import

    const params = new URLSearchParams(location.search);
    const safeMode = params.get('safe') === '1';

    // Initialize FX layer
    FX.init();
    FX.setEnabled(safeMode ? false : State.fxEnabled);

    Aurora.init();
    Aurora.setEnabled(safeMode ? false : State.auroraEnabled);

    Glyphs.init();
    Glyphs.setEnabled(safeMode ? false : State.glyphsEnabled);

    AudioFX.init();
    setTimeout(() => AudioFX.bootChime(), 500);

    // Initialize Skills (Command Palette)
    if (Skills) Skills.init();

    // Show splash/boot, then continue to login
    if (!safeMode) {
        Boot.start(() => Login.init());
    } else {
        Login.init();
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        });
    }
}
```

### Safe Mode

Access `http://localhost:5173/?safe=1` to disable all visual effects. Useful for:

- Debugging performance issues
- Low-powered devices
- Testing without distractions

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
  ├─► state.js (no dependencies)
  ├─► fx.js → state.js
  ├─► aurora.js → state.js
  ├─► glyphs.js → state.js
  ├─► audiofx.js → state.js
  ├─► boot.js (no dependencies)
  ├─► skills.js (no dependencies)
  └─► login.js
        ├─► state.js
        ├─► desktop.js
        │     ├─► state.js
        │     ├─► windows.js
        │     │     └─► state.js
        │     ├─► lightbox.js
        │     └─► admin.js
        ├─► windows.js
        ├─► router.js
        │     └─► desktop.js
        └─► mobile.js
```

### Dependency Rules

1. **State.js has no dependencies** - It's the foundation
2. **Visual FX modules only depend on State** - Self-contained
3. **Desktop depends on Windows** - Desktop creates windows
4. **Router depends on Desktop** - Router opens desktop windows
5. **Admin depends on Desktop** - Admin modifies desktop data

### Circular Dependency Prevention

- **Router** imports `Desktop`, but Desktop doesn't import Router
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
- **Testing Guide**: [FEATURE_VERIFICATION.md](../FEATURE_VERIFICATION.md)
- **Terminology**: [GLOSSARY.md](GLOSSARY.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Architecture Version**: 2.56

**Last Updated**: November 2025

**Maintained By**: Passion OS Development Team

---

<!-- AI Parsing Notes:
- Module count: 17 JavaScript files
- Total code: ~5,500 lines
- Initialization: main.js → state.js → boot.js → login.js → desktop.js
- State pattern: Centralized singleton with localStorage persistence
- Data flow: localStorage → State → Modules → UI → localStorage
- Extension points: Desktop icons, Routes, Effects, Admin sections
-->
