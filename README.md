<div align="center">

# Passion OS

### A Cyberpunk Desktop OS Portfolio — Built with Zero Frameworks

**[jamesdare.com](https://jamesdare.com)**

</div>

---

An interactive desktop environment that runs in the browser. Draggable windows, GPU-optimized glass effects, a Three.js cyberspace background, command palette, and 35 vanilla JavaScript modules — no React, no Vue, no dependencies beyond the web platform.

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
- **14 Desktop Icons** — Custom SVG icons in a recruiter-optimized 4-column F-pattern grid. Right-click context menus on each.
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

### Security (Hardened Across v3.1–v3.3.2)

- All `innerHTML` routed through DOMPurify (SRI hash on CDN)
- 8 HTTP security headers via Vercel (CSP, HSTS, X-Frame-Options, CORP, Permissions-Policy)
- URL injection prevention — allowlist-based router, CSS breakout stripping
- localStorage `JSON.parse` wrapped in try/catch with fallbacks
- SVG content sanitized before DOM insertion
- CSP `img-src` locked to explicit GitHub asset domains

### Accessibility (WCAG)

- `aria-live` regions for screen reader announcements
- Focus trapping in modals, login, welcome, and tour overlays
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

## Architecture

```
js/
├── main.js                  # Entry point, lazy-loads FX
├── boot.js                  # Cinematic boot sequence
├── login.js                 # Lock screen
├── desktop.js               # Icon grid, context menus, app launchers
├── windows.js               # Window manager
├── state.js                 # localStorage persistence + CustomEvent bus
├── data-loader.js           # Centralized JSON fetcher with caching
├── router.js                # History API routing
├── sanitize.js              # DOMPurify wrapper
├── command-palette.js       # Cmd+K launcher
├── galaxy-background.js     # Three.js MMBN cyberspace
├── mahoraga-wheel-3d.js     # Three.js 3D wheel
├── interactions/
│   ├── engine.js            # Orchestrator (30fps throttled)
│   ├── cursor-trail.js      # Particle cursor effects
│   ├── easter-eggs.js       # Konami, 418, glitch pulse
│   └── micro-interactions.js
└── ... (35 modules total)

css/                         # 16 modular stylesheets
├── variables.css            # Design tokens
├── glass.css                # Glassmorphism
├── galaxy.css               # MMBN cyberspace theme
├── accessibility.css        # WCAG, reduced-motion
└── command-palette.css      # Cmd+K styles

tests/                       # 55 vitest tests
├── sanitize.test.js
├── state.test.js
├── data-loader.test.js
├── router.test.js
└── focus-trap.test.js
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
npm run test      # Run 55 vitest tests
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

MIT

---

<div align="center">

**Built with vanilla JavaScript. No frameworks. No dependencies. Just web standards.**

</div>
