<div align="center">

# Passion OS

### A Cyberpunk Desktop OS Portfolio — Built with Zero Frameworks

**[jamesdare.com](https://jamesdare.com)** · **[View Changelog](CHANGELOG.md)**

`37 modules` · `17 stylesheets` · `91 tests` · `0 framework deps`

</div>

---

An interactive desktop environment that runs entirely in the browser. Draggable windows, GPU-optimized glass effects, a Three.js cyberspace background, Spotlight-style command palette, and 37 vanilla JavaScript modules — no React, no Vue, no dependencies beyond the web platform.

Built by **James Olusoga** — AI Solutions Engineer & Creative Technologist, Toronto.

## Quick Start

```bash
git clone https://github.com/DareDev256/portfolio-os.git
cd portfolio-os
npm install
npm run dev
```

Open `http://localhost:5173`. Click the lock screen to enter.

## What's Inside

### Desktop Environment

- **Window Manager** — Drag, resize, minimize, maximize, z-index focus management. Animated open/close with glass shimmer effects.
- **15 Desktop Icons** — Custom SVG icons in a recruiter-optimized 4-column F-pattern grid. Right-click context menus on each.
- **Command Palette** — `Cmd+K` / `Ctrl+K` opens a Spotlight-style fuzzy-search launcher across all apps and system toggles.
- **Dock** — Active window indicators, minimize-to-dock animation, hover tooltips.
- **Client-Side Routing** — Deep-linkable URLs (`/about`, `/work`, `/resume`, `/terminal`) via History API.
- **Themes** — Dark/light toggle with wallpaper cycling. State persists in localStorage.

### Visual Effects Stack

- **MMBN Cyberspace Background** — Three.js perspective grid with cobalt data streams, glowing network nodes, and a deep blue-purple void sky.
- **3D Mahoraga Wheel** — Three.js lock screen centerpiece. 60fps + antialiasing on desktop, 30fps lean mode on mobile.
- **Glass UI** — `backdrop-filter` frosted panels on windows, top bar, and dock — GPU-optimized with reduced blur radii.
- **Cursor Trails** — Particle effects with PlayStation/chakra symbols. Lazy-initialized, throttled to 30fps.
- **Easter Eggs** — Konami code, triple-click glitch pulse, type "418" for teapot, `Ctrl+Shift+V` for system info, 18 terminal sass commands.

### Content Windows

| Window | What It Does |
|--------|-------------|
| **About Me** | Bio, role, location, color-coded skills grid |
| **Applications** | 17 real projects across 4 categories with DEPLOYED/SOURCE badges |
| **GitHub Ops** | Live GitHub API integration |
| **Skills Matrix** | Interactive skills visualization |
| **Music Videos** | Lightbox with YouTube/Vimeo embed support |
| **Resume** | PDF viewer |
| **Dev Terminal** | Fake terminal with 18 sass commands (`neofetch`, `cowsay`, `matrix`...) |
| **Contact** | Form with validation |
| **Settings** | Theme, wallpaper, sound, cursor trail toggles |
| **System Monitor** | Live FPS graph, heap usage, DOM count, network info, uptime |

### Security (Hardened Across v3.1–v3.6.2)

- All `innerHTML` routed through DOMPurify (SRI hash on CDN)
- 8 HTTP security headers via Vercel (CSP, HSTS, X-Frame-Options, CORP, Permissions-Policy)
- URL injection prevention — allowlist-based router, CSS breakout stripping
- localStorage `JSON.parse` wrapped in try/catch with fallbacks
- SVG content sanitized before DOM insertion
- CSP `img-src` locked to explicit GitHub asset domains
- YouTube/Vimeo video ID regex validation — blocks injection via crafted embed URLs
- Iframe `sandbox` on all video embeds — prevents top-navigation and popup abuse

### Accessibility (WCAG)

- `aria-live` regions for screen reader announcements
- Focus trapping in modals, lightbox, login, welcome, and tour overlays
- Skip-link for keyboard users
- 44px minimum touch targets on mobile
- `prefers-reduced-motion` respected globally
- ESC key priority chain: modal > lightbox > tour > window

### Performance

- Animation loops auto-pause when tab is hidden (`visibilitychange` API)
- State decoupled from FX via `CustomEvent` observer pattern
- Lazy-loaded modules (terminal, GitHub, skills — only fetched on window open)
- InteractionEngine throttled to 30fps; Aurora to ~24fps
- Zero `backdrop-filter` on desktop icons (pure GPU cost, zero visual payoff on dark backgrounds)
- Clean timer/RAF lifecycle — clock intervals, drag-inertia frames, and lightbox pan state properly cleared on teardown

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `ESC` | Close active overlay (priority: modal > lightbox > tour > window) |
| `←` `→` | Navigate lightbox images |
| `Tab` / `Shift+Tab` | Cycle focus within trapped overlays |
| `↑↓` `Enter` | Navigate and select in command palette |
| `Ctrl+Shift+V` | System info easter egg |
| `↑↑↓↓←→←→BA` | Konami code easter egg |
| Triple-click desktop | Glitch pulse effect |
| Type `418` | I'm a teapot |

## Architecture

```
js/                              # 37 ES modules, zero framework imports
├── main.js                      # Entry point, lazy-loads FX
├── boot.js                      # Cinematic boot sequence
├── login.js                     # Lock screen + 3D wheel init
├── desktop.js                   # Icon grid, context menus, app launchers
├── windows.js                   # Window manager (drag, resize, z-index)
├── state.js                     # localStorage persistence + CustomEvent bus
├── data-loader.js               # Centralized JSON fetcher with caching
├── dom-helpers.js               # Shared utilities (openExternal, animateCounter)
├── router.js                    # History API deep-linkable routing
├── sanitize.js                  # DOMPurify wrapper
├── command-palette.js           # Cmd+K fuzzy-search launcher
├── system-monitor.js            # Live FPS, heap, DOM count dashboard
├── galaxy-background.js         # Three.js MMBN cyberspace grid
├── mahoraga-wheel-3d.js         # Three.js 3D wheel (60fps desktop, 30fps mobile)
├── terminal.js                  # Dev terminal with 18 commands
├── github.js                    # Live GitHub API integration
├── lightbox.js                  # Image/video viewer (YouTube, Vimeo, MP4)
├── focus-trap.js                # WCAG focus trapping utility
├── interactions/
│   ├── engine.js                # Orchestrator (30fps throttled)
│   ├── cursor-trail.js          # Particle cursor effects
│   ├── cursor-tracker.js        # Mouse position tracking
│   ├── cursor-reactive.js       # Reactive cursor animations
│   ├── sound-manager.js         # UI sound effects
│   ├── easter-eggs.js           # Konami, 418, glitch pulse
│   └── micro-interactions.js    # Hover/click micro-animations
└── ... (+ admin, modal, mobile, loader, skills, fx, aurora, etc.)

css/                             # 17 modular stylesheets
├── variables.css                # Design tokens
├── glass.css                    # Glassmorphism + backdrop-filter
├── galaxy.css                   # MMBN cyberspace theme
├── accessibility.css            # WCAG, reduced-motion
├── system-monitor.css           # Performance dashboard
├── command-palette.css          # Cmd+K styles
└── ... (+ windows, modal, forms, mobile, tour, welcome, etc.)

tests/                           # 91 vitest tests
├── sanitize.test.js             # XSS sanitization (12 tests)
├── state.test.js                # State management (15 tests)
├── data-loader.test.js          # JSON fetch + cache (9 tests)
├── router.test.js               # Path validation + routing (12 tests)
├── focus-trap.test.js           # Tab cycling + cleanup (7 tests)
├── lightbox.test.js             # Video ID validation + sandbox (14 tests)
├── dom-helpers.test.js          # openExternal + animateCounter (7 tests)
└── modal.test.js                # Dialog init, dismiss, prompt, alert (15 tests)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Core** | HTML5, CSS3 (custom properties, glassmorphism), JavaScript ES6 modules |
| **3D** | Three.js (galaxy background, Mahoraga wheel) |
| **Security** | DOMPurify 3.0.8 (SRI), 8 Vercel security headers |
| **Build** | Vite 7.x |
| **Test** | Vitest 4.x, jsdom |
| **Lint** | ESLint 9.x, Prettier |
| **Deploy** | Vercel (SPA routing, security headers) |
| **Fonts** | Tomorrow, Orbitron, JetBrains Mono (Google Fonts) |

**Zero framework dependencies.** Vanilla JavaScript core — Three.js for 3D, DOMPurify for XSS protection.

## Scripts

```bash
npm run dev       # Vite dev server (localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run test      # Run 91 vitest tests
npm run lint      # ESLint
npm run format    # Prettier
```

## Browser Support

Chrome 61+ · Firefox 60+ · Safari 11+ · Edge 79+

## Documentation

| Document | Purpose |
|----------|---------|
| [DOCUMENTATION.md](DOCUMENTATION.md) | Complete user guide |
| [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md) | No-code content editor |
| [CHANGELOG.md](CHANGELOG.md) | Full version history |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues |

## License

MIT — **v3.6.4**

---

<div align="center">

**Built with vanilla JavaScript. No frameworks. No dependencies. Just web standards.**

[Live Demo](https://jamesdare.com) · [Changelog](CHANGELOG.md) · [Architecture](docs/ARCHITECTURE.md)

</div>
