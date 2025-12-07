# Passion OS - Glossary

---

title: Passion OS Glossary
version: 2.56
last_updated: 2025-11-27
type: reference

---

<!-- AI Context: Standardized terminology reference for Passion OS.
     Purpose: Define consistent vocabulary for documentation and code
     Related: ARCHITECTURE.md (technical details), DOCUMENTATION.md (usage) -->

## Overview

This glossary defines all key terms, concepts, and components used in Passion OS. Terms are organized alphabetically with file references where applicable.

---

## A

### Active Window

The window currently in focus, indicated by enhanced border glow. Only one window can be active at a time. Clicking a window makes it active and brings it to the front (highest z-index).

**File**: `js/windows.js`
**Related**: Z-Index, Window Manager

### Admin Dashboard

Visual content editor accessible via Settings → Content Editor. Provides no-code interface for managing desktop items, projects, media, themes, and data export/import.

**File**: `js/admin.js`, `css/admin.css`
**Documentation**: [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md)
**Related**: Desktop Items, Projects, Media Library

### Application Layer

The middle tier in Passion OS architecture, containing Desktop, Windows, Router, and Admin modules. Sits between the UI Layer and State Layer.

**Related**: ARCHITECTURE.md § System Overview

### Aurora

Animated aurora borealis background effect. Toggle-able via Settings or Alt+A keyboard shortcut.

**File**: `js/aurora.js`
**Related**: Visual Effects, State Management

---

## B

### Boot Sequence

Animated startup sequence showing system initialization messages. Plays after login button click and before desktop appears.

**File**: `js/boot.js`
**Duration**: ~3 seconds
**Related**: Login Flow

### Browser Storage

See **localStorage**

---

## C

### Case Study

Detailed project documentation template planned for future implementation. Will provide professional format for portfolio pieces.

**Status**: Planned (Session 3)
**Related**: Projects, Content Enhancement

### Client-Side Routing

URL-based navigation using the History API. Allows shareable URLs (e.g., `/about`) that open specific windows. Supports browser back/forward buttons.

**File**: `js/router.js`
**Implementation**: Phase 3.4
**Related**: Deep Linking, History API

### Command Palette

Keyboard-driven launcher (Cmd+K or Ctrl+K) for quick access to applications and features.

**File**: `js/skills.js`
**Shortcut**: Cmd/Ctrl + K
**Related**: Start Menu

### Context Menu

Right-click menu appearing on desktop icons or desktop background. Provides quick actions like "Open", "Properties", "Next Wallpaper", etc.

**File**: `js/desktop.js`
**Related**: Desktop Icons, Wallpaper

---

## D

### Deep Linking

Ability to share URLs that open specific windows on load. Example: `http://example.com/about` opens the About window.

**File**: `js/router.js`
**Related**: Client-Side Routing

### Desktop

Main workspace area where icons are displayed and windows open. Managed by `Desktop` module.

**File**: `js/desktop.js`
**Related**: Desktop Icons, Window Manager

### Desktop Items

Icons displayed on the desktop. Each item has:

- **id**: Unique identifier
- **label**: Display name (e.g., "ABOUT_ME")
- **icon**: Emoji or symbol
- **color**: Neon accent color
- **action**: Function to execute on click

**File**: `js/desktop.js` lines 10-45
**Storage**: `localStorage.desktopItems`
**Customization**: Admin Dashboard → Desktop Items Editor
**Related**: Admin Dashboard

### Dock

Bottom bar showing app launchers and open windows. Styled like macOS dock with hover effects and active indicators.

**File**: `js/windows.js`, `css/styles.css`
**Implementation**: Phase 3.3
**Related**: Taskbar, Window Manager

---

## E

### ES6 Modules

Modern JavaScript module system using `import`/`export` syntax. Passion OS uses ES6 modules exclusively (no CommonJS or AMD).

**Example**: `import { State } from './state.js'`
**Related**: Module Architecture

### Extension Points

Places in the code designed for customization. Includes desktop icons, routes, visual effects, and admin sections.

**Documentation**: ARCHITECTURE.md § Extension Points
**Related**: Customization

---

## F

### FX (Visual Effects)

Particle effects layer with floating particles and ambient animations. Toggle-able via Settings or Alt+X.

**File**: `js/fx.js`
**Related**: Aurora, Glyphs, Visual Effects

---

## G

### Glyphs

Floating animated symbols/characters in the background. Toggle-able via Settings or Alt+G.

**File**: `js/glyphs.js`
**Related**: Visual Effects

### Glow Effects

Neon-style box-shadow effects used throughout the UI. Each desktop icon has a color-matched glow, and the active window has a cyan glow.

**CSS**: `css/styles.css`, `css/windows.css`
**Colors**: Defined in `css/variables.css`
**Related**: Theme, Desktop Icons

---

## H

### History API

Browser API for manipulating browser history without page reload. Used for client-side routing.

**MDN**: https://developer.mozilla.org/en-US/docs/Web/API/History_API
**File**: `js/router.js`
**Methods**: `pushState()`, `popstate` event
**Related**: Client-Side Routing

---

## I

### Icon Context Menu

Right-click menu for individual desktop icons. Shows "Open" and "Properties" options.

**File**: `js/desktop.js` lines 159-163
**Related**: Context Menu, Desktop Icons

### Initialization Sequence

Ordered startup process: main.js → state.js → visual effects → boot → login → desktop.

**Documentation**: ARCHITECTURE.md § Initialization Sequence
**Entry Point**: `js/main.js`
**Related**: Boot Sequence

---

## L

### Lightbox

Fullscreen viewer for photos and videos. Supports keyboard navigation (←/→ arrows, ESC to close) and click-to-advance.

**File**: `js/lightbox.js`, `css/styles.css`
**Supported Formats**: JPG, PNG, MP4, YouTube, Vimeo
**Related**: Media Library

### localStorage

Browser API for persistent client-side storage. Passion OS stores all settings, window states, and user data in localStorage.

**Storage Keys**: See ARCHITECTURE.md § localStorage Keys
**Limits**: ~5-10MB per domain
**Related**: State Management, Data Flow

### Lock Screen

Initial screen shown on page load, displaying time/date and OS branding. Click or press Enter to advance to login.

**File**: `js/login.js`, `index.html`
**Related**: Login Flow, Boot Sequence

### Login Flow

Multi-step authentication sequence:

1. **Lock Screen** - Time/date display
2. **Login Screen** - User clicks "INITIALIZE"
3. **Boot Sequence** - Animated startup messages
4. **Desktop** - Main workspace appears

**File**: `js/login.js`
**Related**: Boot Sequence, Desktop

---

## M

### Media Library

Collection of photos and videos displayed in the Photos and Videos windows. Configured via Admin Dashboard or `data/media.json`.

**File**: `js/desktop.js` (openPhotos, openVideos methods)
**Storage**: `localStorage['media.json']` or `data/media.json`
**Formats**: Images (JPG/PNG), Videos (MP4/YouTube/Vimeo)
**Related**: Lightbox, Admin Dashboard

### Minimize

Window state where window is hidden but remains in dock. Click dock icon to restore.

**Animation**: 250ms shrink + drop to bottom
**File**: `js/windows.js`
**Related**: Window States, Dock

### Mobile Detection

Automatic detection of mobile devices based on user agent, touch support, and screen size (≤768px). Injects responsive CSS when detected.

**File**: `js/mobile.js`
**Implementation**: Phase 3.5
**Breakpoint**: 768px
**Related**: Responsive Design

### Module

Self-contained JavaScript file that exports functionality. Passion OS has 17 modules organized into 6 categories.

**Documentation**: ARCHITECTURE.md § Module Architecture
**Pattern**: ES6 modules with `export const ModuleName = { ... }`
**Related**: ES6 Modules

---

## P

### Passion OS

The project name. A vanilla JavaScript portfolio operating system with cyberpunk aesthetics.

**Version**: 2.56
**Tech Stack**: HTML, CSS, JavaScript (no frameworks)
**Repository**: (Your repo URL here)

### Phase

Development stage. Current project is in **Phase 3** (Core OS Features).

- **Phase 1**: Foundation (Sep 2025)
- **Phase 2**: Content Features (Oct 2025)
- **Phase 3**: Core OS Features (Nov 2025)

**Documentation**: [CHANGELOG.md](../CHANGELOG.md)

### Projects

Portfolio items displayed in the Applications window. Each project has title, description, tech stack, tags, demo URL, and repo URL.

**File**: `js/desktop.js` (openApplications method)
**Storage**: `localStorage['projects.json']` or `data/projects.json`
**Schema**:

```json
{
    "title": "Project Name",
    "description": "Description...",
    "tech": ["React", "Node.js"],
    "tags": ["Web", "Fullstack"],
    "demo": "https://...",
    "repo": "https://..."
}
```

**Related**: Admin Dashboard, Applications Window

### PWA (Progressive Web App)

Web app that can be installed on devices and work offline. Passion OS registers a service worker for PWA support.

**File**: `sw.js` (service worker)
**Registration**: `js/main.js` lines 57-61
**Status**: Basic implementation (future enhancement planned)

---

## R

### Responsive Design

UI adaptation for mobile devices. Automatically triggered when screen width ≤768px or mobile device detected.

**File**: `js/mobile.js`
**Features**: Full-screen windows, 3-column icon grid, scaled dock, touch-friendly menus
**Related**: Mobile Detection

### Router

Module handling client-side navigation and URL routing.

**File**: `js/router.js`
**Methods**: `navigate(path)`, `addRoute(path, handler)`
**Routes**: `/about`, `/work`, `/media`, `/connect`, `/settings`, `/resume`, `/terminal`
**Related**: Client-Side Routing, Deep Linking

---

## S

### Safe Mode

Special mode that disables all visual effects. Access via `?safe=1` URL parameter.

**Usage**: `http://localhost:5173/?safe=1`
**Purpose**: Debugging, low-powered devices
**File**: `js/main.js` lines 30-34
**Related**: Visual Effects

### Service Worker

Background script enabling PWA features like offline support and caching.

**File**: `sw.js`
**Registration**: `js/main.js`
**Related**: PWA

### Start Menu

Application launcher menu (currently hidden/repurposed in favor of desktop icons and command palette).

**File**: `js/startmenu.js`
**Status**: Legacy (kept for compatibility)
**Alternative**: Command Palette (Cmd+K)

### State

Central state management module. Single source of truth for theme, wallpaper, FX settings, and window registry.

**File**: `js/state.js`
**Pattern**: Singleton object with localStorage sync
**Documentation**: ARCHITECTURE.md § State Management
**Related**: localStorage, Data Flow

### State Layer

Architecture tier containing State.js and localStorage. Sits between Application Layer and Data Layer.

**Related**: ARCHITECTURE.md § System Overview

---

## T

### Taskbar

See **Dock**

### Theme

Color scheme (light or dark mode). Toggle via desktop context menu or Settings.

**Storage**: `localStorage.theme`
**Values**: `"light"` or `"dark"`
**CSS**: `body[data-theme="dark"]` attribute
**File**: `js/state.js` (setTheme, toggleTheme)
**Related**: CSS Variables

---

## V

### Vanilla JavaScript

Pure JavaScript without frameworks or libraries. Passion OS uses only native browser APIs.

**No Dependencies**: No React, Vue, jQuery, etc.
**Benefits**: Smaller bundle size, faster load times, no framework lock-in

### Visual Effects

Collective term for FX, Aurora, and Glyphs modules. All toggle-able independently.

**Files**: `js/fx.js`, `js/aurora.js`, `js/glyphs.js`
**Keyboard Shortcuts**: Alt+X (FX), Alt+A (Aurora), Alt+G (Glyphs)
**Related**: State Management, Safe Mode

---

## W

### Wallpaper

Desktop background image or gradient. Supports local images, external URLs, and gradient tokens.

**Storage**: `localStorage.wallpaper`
**Formats**: Image URLs, `gradient:dark-ombre`, `gradient:grey-ombre`
**File**: `js/state.js` (setWallpaper, applyWallpaper)
**Customization**: Admin Dashboard or desktop context menu
**Related**: Desktop, Theme

### Warp Tunnel

Visual effect during login transition. Creates a speed-warp animation.

**File**: `js/warp.js`
**Duration**: ~1 second
**Related**: Login Flow, Visual Effects

### Window

Draggable, resizable application container. Each window has:

- **Titlebar** (with title and control buttons)
- **Content area**
- **Resize handle** (bottom-right corner)

**File**: `js/windows.js`, `css/windows.css`
**Related**: Window Manager, Window States

### Window Manager

Module responsible for creating, positioning, and managing windows. Handles drag, resize, minimize, maximize, close, and z-index.

**File**: `js/windows.js`
**Export**: `WindowManager` object
**Methods**: `open()`, `close()`, `minimize()`, `maximize()`, `focus()`
**Related**: Window, State, Dock

### Window States

Possible states for a window:

- **Normal** - Standard open window
- **Minimized** - Hidden, shown in dock
- **Maximized** - Fullscreen
- **Closing** - Fade-out animation active
- **Active** - Currently focused

**File**: `js/windows.js`
**CSS Classes**: `.window.visible`, `.window.minimized`, `.window.closing`, `.window.active`
**Related**: Window Manager

---

## Z

### Z-Index

CSS property controlling stacking order. Passion OS uses incrementing z-index starting at 100.

**File**: `js/state.js` (getNextZIndex method)
**Pattern**: Each window click increments z-index
**Related**: Active Window, Window Manager

---

## Acronyms

| Acronym | Full Term                         | Definition                                                                            |
| ------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| API     | Application Programming Interface | Interface for interacting with browser features (e.g., History API, localStorage API) |
| CSS     | Cascading Style Sheets            | Styling language for HTML                                                             |
| ES6     | ECMAScript 2015                   | JavaScript version with modules, arrow functions, etc.                                |
| FX      | Effects                           | Visual effects module (particles, animations)                                         |
| HTML    | HyperText Markup Language         | Markup language for web pages                                                         |
| JS      | JavaScript                        | Programming language                                                                  |
| JSON    | JavaScript Object Notation        | Data format for structured data                                                       |
| OS      | Operating System                  | "Passion OS" mimics desktop OS interface                                              |
| PWA     | Progressive Web App               | Installable web app with offline support                                              |
| UI      | User Interface                    | Visual interface elements                                                             |
| URL     | Uniform Resource Locator          | Web address (e.g., `http://example.com/about`)                                        |

---

## File Extensions Reference

| Extension   | Type       | Purpose                 | Example                       |
| ----------- | ---------- | ----------------------- | ----------------------------- |
| `.js`       | JavaScript | Module code             | `desktop.js`, `windows.js`    |
| `.css`      | Stylesheet | Visual styling          | `styles.css`, `windows.css`   |
| `.json`     | Data       | Structured data storage | `projects.json`, `media.json` |
| `.html`     | Markup     | Page structure          | `index.html`                  |
| `.md`       | Markdown   | Documentation           | `DOCUMENTATION.md`            |
| `.jpg/.png` | Image      | Photos, wallpapers      | `wallpaper1.jpg`              |
| `.mp4`      | Video      | Video files             | `demo.mp4`                    |
| `.pdf`      | Document   | Resume file             | `resume.pdf`                  |

---

## Color Naming Conventions

Colors in Passion OS use "neon" prefix for cyberpunk aesthetic:

| Variable        | Color     | Usage                              |
| --------------- | --------- | ---------------------------------- |
| `--neon-cyan`   | `#00f0ff` | Primary accent, active window glow |
| `--neon-pink`   | `#ff006e` | Secondary accent                   |
| `--neon-purple` | `#9d00ff` | Tertiary accent                    |
| `--neon-green`  | `#39ff14` | Success states                     |
| `--neon-yellow` | `#ffea00` | Warnings                           |
| `--neon-orange` | `#ff6700` | Highlights                         |

**File**: `css/variables.css`
**Related**: Theme, Glow Effects

---

## Common Patterns

### localStorage Key Naming

- **Settings**: `theme`, `wallpaper`, `fxEnabled`
- **Data**: `projects.json`, `media.json` (JSON string format)
- **Custom**: `desktopItems`, `windowStates`

**Convention**: Use camelCase for boolean settings, `.json` suffix for data arrays

### CSS Class Naming

- **State classes**: `.visible`, `.minimized`, `.closing`, `.active`
- **Component classes**: `.window`, `.desktop-icon`, `.dock-launchers`
- **Modifier classes**: `.cyber-button`, `.neon-border`, `.glow-effect`

**Convention**: Use kebab-case for multi-word classes

### Function Naming

- **Actions**: `open*()`, `close()`, `toggle*()`
- **Getters**: `get*()`, `getNext*()`
- **Setters**: `set*()`, `apply*()`
- **Handlers**: `handle*()`, `on*()`

**Convention**: Use camelCase, descriptive verb prefixes

---

## Version Terminology

| Term              | Meaning           | Example                   |
| ----------------- | ----------------- | ------------------------- |
| **Major Version** | Breaking changes  | 1.0 → 2.0                 |
| **Minor Version** | New features      | 2.5 → 2.6                 |
| **Patch Version** | Bug fixes         | 2.56 → 2.57               |
| **Phase**         | Development stage | Phase 1, Phase 2, Phase 3 |

**Current Version**: 2.56 (Phase 3)

---

## Related Documentation

- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **User Guide**: [DOCUMENTATION.md](../DOCUMENTATION.md)
- **Development History**: [CHANGELOG.md](../CHANGELOG.md)
- **Admin Guide**: [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md)
- **Testing**: [FEATURE_VERIFICATION.md](../FEATURE_VERIFICATION.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Glossary Version**: 2.56

**Last Updated**: November 2025

**Total Terms**: 50+

---

<!-- AI Parsing Notes:
- Alphabetically organized for quick reference
- File paths included where applicable
- Cross-references to related concepts
- Consistent formatting: Term → Definition → Files → Related
- Code examples where helpful
-->
