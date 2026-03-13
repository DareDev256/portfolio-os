<div align="center">

# Passion OS

### A Cyberpunk Desktop OS Portfolio — Built with Zero Frameworks

![Version](https://img.shields.io/badge/version-3.42.0-00f0ff?style=flat-square)
![Tests](https://img.shields.io/badge/tests-361_passing-00e676?style=flat-square)
![CSS](https://img.shields.io/badge/stylesheets-25-ff9100?style=flat-square)
![Modules](https://img.shields.io/badge/modules-49-b388ff?style=flat-square)
![Frameworks](https://img.shields.io/badge/frameworks-0-ff5252?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-888?style=flat-square)

### [Try the Live Demo &rarr;](https://jamesdare.com)

</div>

---

An interactive desktop environment that runs entirely in the browser. Draggable windows, GPU-optimized glass effects, a Three.js cyberspace background, Spotlight-style command palette, and 42 vanilla JavaScript modules — no React, no Vue, no dependencies beyond the web platform.

Built by [**James Olusoga**](https://github.com/DareDev256) — AI Solutions Engineer & Creative Technologist, Toronto.

> **48 ES modules** · **25 stylesheets** · **361 tests across 17 suites** · **20 desktop apps** · **12 security headers** · **0 runtime dependencies**

## Quick Start

**Prerequisites:** Node.js 18+ and npm 9+.

```bash
git clone https://github.com/DareDev256/portfolio-os.git
cd portfolio-os
npm install
npm run dev
```

Open `http://localhost:5173`. Click the lock screen to enter.

## What's Inside

### Desktop Environment

- **Window Manager** — Drag, resize, minimize, maximize, z-index focus management with ceiling-bounded normalization. Animated open/close with glass shimmer effects.
- **20 Desktop Icons** — Custom SVG icons in a recruiter-optimized 4-column grid. Right-click context menus on each. Includes 3 external deployed-project links (Vibe Coder, IMG_GEN.ai, TypeMaster) and a curated Portfolio showcase.
- **Purple Reign Showcase** — Opens with the "Ascending Core" — a rotating CSS 3D obsidian crystal with internal amethyst glow that fractures apart on scroll, revealing the content beneath. Followed by the "Amethyst Code" hero reveal — a metallic purple glitch effect that resolves to unveil the section title. Featured projects display as cinematic scroll-snap chapters with forcefield reveal, gilded gold shimmer on titles, staggered animations, dot navigation, and syntax-highlighted code snippets with copy-to-clipboard. CTA buttons feature "Opulent Interface" micro-interactions: embossed depth, animated gold border trace, and letter-spacing breathe on hover. Each chapter has a "Catalyst Aura" — a mouse-reactive amethyst-gold glow with hexagonal crystal lens that follows the cursor.
- **Command Palette** — `Cmd+K` / `Ctrl+K` opens a Spotlight-style fuzzy-search launcher across all apps and system toggles.
- **Dock** — macOS-style magnetic magnification (icons swell on cursor proximity with Gaussian falloff), active window indicators, minimize-to-dock animation, hover tooltips.
- **Client-Side Routing** — Deep-linkable URLs (`/about`, `/work`, `/resume`, `/terminal`) via History API.
- **Themes** — Dark/light toggle with wallpaper cycling. State persists in localStorage.
- **Ambient System Telemetry** — Live CPU/RAM metrics in the top bar fluctuate via weighted random walks, session uptime counter, visit tracking with welcome toasts, and periodic contextual tips.

### Visual Effects Stack

- **MMBN Cyberspace Background** — Three.js perspective grid with cobalt data streams, glowing network nodes, and a deep blue-purple void sky.
- **3D Mahoraga Wheel** — Three.js lock screen centerpiece. 60fps + antialiasing on desktop, 30fps lean mode on mobile.
- **Glass UI** — `backdrop-filter` frosted panels on windows, top bar, and dock — GPU-optimized with reduced blur radii.
- **Tokenized Motion System** — All transitions use design tokens (`--transition-fast/medium/slow`, `--ease-decel/accel/spring`) instead of hardcoded values. Entry animations decelerate, exits accelerate, emphasis bounces — no generic `ease` defaults.
- **Parallax Depth Engine** — Mouse-driven lock screen layers + scroll-driven desktop background shifts. 4-layer depth with lerp smoothing, MutationObserver for dynamic windows, `will-change` GPU compositing. Respects `prefers-reduced-motion`.
- **Glimmer Sweep** — Diagonal gold-to-amethyst light sweep on hover for portfolio cards, project cards, portfolio links, and dock icons. GPU-composited `translateX` animation with `ease-decel` fade-out. Respects `prefers-reduced-motion`.
- **Black Mirror Signal Acquisition** — Cinematic "Act 0" pre-intro on the lock screen. Three staggered interference bars sweep vertically with gold-amethyst gradients, edge glows pulse from screen boundaries, and a "SIGNAL ACQUIRED" data flash flickers in stepped keyframes before dissolving into the existing boot sequence.
- **Cursor Aurora** — Lock screen tracks mouse position via CSS custom properties, rendering a dual-layer amethyst/gold radial glow that follows the cursor. GPU-composited, zero layout thrash. INITIALIZE button shifts to amethyst hover state to match.
- **Cursor Trails** — Particle effects with PlayStation/chakra symbols. Lazy-initialized, throttled to 30fps.
- **Toast Notifications** — Non-blocking notification queue with success/error/warning/info types, auto-dismiss progress bar, hover-to-pause, and `aria-live` screen reader support.
- **Easter Eggs** — Konami code, triple-click glitch pulse, type "418" for teapot, `Ctrl+Shift+V` for system info, 18 terminal sass commands.

### Desktop Icons (20)

| Icon | Type | What It Does |
|------|------|-------------|
| **ABOUT_ME.exe** | Window | Bio, role, location, color-coded skills grid |
| **RESUME** | Window | PDF viewer |
| **CONNECT** | Window | Contact form with validation |
| **LINKEDIN** | External | Opens LinkedIn profile |
| **SKILLS_MATRIX** | Window | Interactive skills visualization |
| **GITHUB_OPS** | Window | Live GitHub API integration |
| **PORTFOLIO** | Window | Curated 5-project featured showcase with tech badges, live demo links, and rich cards |
| **APPLICATIONS** | Window | 17 real projects across 4 categories with DEPLOYED/SOURCE badges and Lab Notes click-to-reveal diagnostics |
| **DEV_TERMINAL** | Window | Fake terminal with 18 sass commands (`neofetch`, `cowsay`, `matrix`...) |
| **Vibe_Coder.exe** | External | Browser-based game — deployed project link |
| **IMG_GEN.ai** | External | AI image generation tool — deployed project link |
| **TYPEMASTER** | External | Typing speed game — deployed project link |
| **SHOWCASE.mp4** | Lightbox | Featured video showcase |
| **MUSIC_VIDEOS** | External | Music video portfolio |
| **SETTINGS** | Window | Theme, wallpaper, sound, cursor trail toggles |
| **NOTES** | Window | Sticky notes with 5 color themes, localStorage persistence, auto-save |
| **FOCUS_TIMER** | Window | Pomodoro timer with canvas ring, 3 presets (25/50/90 min), session stats |
| **CALC.exe** | Window | Cyberpunk calculator with keyboard input, expression chaining, glass UI |
| **WEATHER** | Window | Live weather with geolocation, current conditions, 3-day forecast via Open-Meteo |
| **SYS_MONITOR** | Window | Live FPS graph, heap usage, DOM count, network info, uptime |

### Security (Hardened Across v3.1–v3.41.2)

- All `innerHTML` routed through DOMPurify (SRI hash on CDN) — including window content, titlebar icons, taskbar icons, and start menu items
- 10 HTTP security headers via Vercel (CSP, HSTS, X-Frame-Options, COOP, COEP, CORP, Permissions-Policy)
- URL injection prevention — allowlist-based router, CSS breakout stripping
- `Sanitize.attr()` blocks `data:image/svg+xml` XSS vectors alongside `javascript:`, `vbscript:`, and `data:text/html`
- `Sanitize.url()` enforced on all `href`/`src` attributes sourced from external data (project links, media posters, GitHub avatars, lightbox images) — blocks `blob:`, `ftp:`, and other dangerous URI schemes
- Prototype pollution protection on all `localStorage` reads — `loadJSON()` strips `__proto__`/`constructor`/`prototype` keys from every parsed value across all callers
- Admin Dashboard renders all tab content through `Sanitize.setHTML()` (defense-in-depth against future template injection)
- CSP `connect-src` allowlists only known API origins (GitHub, Open-Meteo, Passion API) — stale wildcards removed
- All external API fetches protected by `AbortController` timeout (8s) via shared `fetchWithTimeout` — prevents frozen interfaces on slow/unreachable APIs
- localStorage `JSON.parse` wrapped in try/catch with fallbacks
- SVG content sanitized before DOM insertion
- CSP `img-src` locked to explicit GitHub asset domains
- YouTube/Vimeo video ID regex validation — blocks injection via crafted embed URLs
- Iframe `sandbox="allow-scripts allow-same-origin allow-presentation"` on all video embeds — blocks top-navigation, form submission, and popups
- Navigator API values HTML-escaped before innerHTML interpolation (defense-in-depth against extension/polyfill mutation)
- Weather widget validates API response shape and coordinate inputs
- GitHub API response shape validation — rejects malformed cache/API data before rendering
- `rel="noopener noreferrer"` on all `target="_blank"` links — prevents tabnapping
- Contact form input length limits (name 100, email 254, message 2000) — prevents mailto URI abuse

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
- Lazy-loaded modules (terminal, GitHub, skills, galaxy background — only fetched when needed)
- InteractionEngine throttled to 30fps; Aurora to ~24fps
- Zero `backdrop-filter` on desktop icons (pure GPU cost, zero visual payoff on dark backgrounds)
- Clean timer/RAF lifecycle — clock intervals, drag-inertia frames, and lightbox pan state properly cleared on teardown

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts overlay |
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `ESC` | Close active overlay (priority: modal > lightbox > tour > window) |
| `←` `→` | Navigate lightbox images |
| `Tab` / `Shift+Tab` | Cycle focus within trapped overlays |
| `↑↓` `Enter` | Navigate and select in command palette |
| `Ctrl+Shift+V` | System info easter egg |
| `↑↑↓↓←→←→BA` | Konami code easter egg |
| Triple-click desktop | Glitch pulse effect |
| Type `418` | I'm a teapot |

## Project Health

| Metric | Value |
|--------|-------|
| **Test Coverage** | 212 tests across 13 suites (vitest + jsdom) |
| **Security** | DOMPurify on all innerHTML, 10 HTTP headers, CSP, SRI |
| **Accessibility** | WCAG focus trapping, aria-live, skip-link, reduced-motion |
| **Performance** | Lazy-loaded modules, RAF pausing, 30fps-throttled FX |
| **Lint** | 0 ESLint warnings, Prettier-formatted |
| **Bundle** | 132 kB main chunk, code-split lazy modules |

## Why No Frameworks?

This isn't anti-framework ideology — it's a deliberate architectural choice to demonstrate depth.

Every feature recruiters expect from a React/Next.js portfolio is here (routing, state management, component lifecycle, lazy loading, accessibility) — built from scratch against the raw DOM API. The result is a 41-module codebase that proves understanding of **what frameworks abstract away**, not just how to use them.

**The constraint is the point.** Anyone can `npx create-next-app`. Not everyone can build a desktop OS with draggable windows, GPU-composited glass effects, and a 3D WebGL background in 41 hand-written modules with zero runtime dependencies.

## Architecture

```
js/                                 # 41 ES modules, zero framework imports
├── main.js                         # Entry — orchestrates boot, lazy-loads FX
├── boot.js                         # Cinematic boot sequence
├── login.js                        # Lock screen + 3D wheel init
├── desktop.js                      # Icon grid, context menus, app launchers
├── windows.js                      # Window manager (drag, resize, z-index)
├── state.js                        # localStorage persistence + CustomEvent bus
├── router.js                       # History API deep-linkable routing
├── command-palette.js              # Cmd+K fuzzy-search launcher
├── data-loader.js                  # Centralized JSON fetcher with caching
├── dom-helpers.js                  # Shared utilities (isElementVisible, isInViewport, openExternal, animateCounter, loadJSON, saveJSON, downloadJSON)
├── sanitize.js                     # DOMPurify wrapper
├── notifications.js                # Toast notification queue system
├── shortcuts-overlay.js            # Press ? to show all keyboard shortcuts
├── modal.js                        # Prompt/alert dialogs with focus trapping
├── focus-trap.js                   # WCAG focus trapping utility
├── lightbox.js                     # Image/video viewer (YouTube, Vimeo, MP4)
├── terminal.js                     # Dev terminal with 18 sass commands
├── github.js                       # Live GitHub API integration
├── skills.js                       # Interactive skills visualization
├── sticky-notes.js                 # Persistent sticky notes with color themes
├── pomodoro-timer.js               # Focus timer with canvas ring + work/break cycles
├── calculator.js                   # Glass calculator with keyboard input + expression chaining
├── system-monitor.js               # Live FPS, heap, DOM count dashboard
├── galaxy-background.js            # Three.js MMBN cyberspace grid
├── mahoraga-wheel-3d.js            # Three.js 3D wheel (60fps/30fps adaptive)
├── aurora.js                       # Aurora visual effects (~24fps throttled)
├── fx.js                           # Visual FX layer (~30fps throttled)
├── glyphs.js                       # Glyph rendering system
├── warp.js                         # Warp tunnel transition effect
├── loader.js                       # DOM-safe loading states
├── welcome.js                      # First-visit welcome overlay
├── tour.js                         # Interactive guided tour
├── mobile.js                       # Touch detection + responsive injection
├── startmenu.js                    # Start menu + system tray
├── admin.js                        # No-code content editor (console-only)
├── audiofx.js                      # Audio effects system
├── interactions/
│   ├── engine.js                   # Orchestrator (30fps throttled)
│   ├── cursor-trail.js             # Particle cursor effects
│   ├── cursor-tracker.js           # Mouse position tracking
│   ├── cursor-reactive.js          # Reactive cursor animations
│   ├── sound-manager.js            # UI sound effects
│   ├── easter-eggs.js              # Konami, 418, glitch pulse
│   └── micro-interactions.js       # Hover/click micro-animations
│
css/                                # 21 modular stylesheets
├── variables.css                   # Design tokens (colors, spacing, fonts, motion easing, transition shorthands)
├── reset.css                       # Normalize + base resets
├── styles.css                      # Core layout, dock, desktop, icons
├── glass.css                       # Glassmorphism + backdrop-filter
├── windows.css                     # Window chrome, animations, states
├── galaxy.css                      # MMBN cyberspace theme
├── modal.css                       # Dialog overlays
├── forms.css                       # Input, button, validation styles
├── accessibility.css               # WCAG, reduced-motion, skip-link
├── mobile.css                      # Responsive breakpoints, touch targets
├── interactions.css                # Cursor, hover, micro-animation styles
├── command-palette.css             # Cmd+K launcher
├── system-monitor.css              # Performance dashboard gauges
├── notifications.css               # Toast notification queue
├── shortcuts-overlay.css           # Keyboard shortcuts overlay
├── sticky-notes.css                # Sticky notes card grid
├── pomodoro-timer.css              # Focus timer ring and controls
├── calculator.css                  # Calculator glass keypad and display
├── portfolio.css                   # Featured project showcase cards
├── welcome.css                     # First-visit overlay
├── tour.css                        # Guided tour steps
├── loading.css                     # Boot sequence, spinners
└── admin.css                       # Content editor panel
│
tests/                              # 201 vitest tests across 13 suites
├── sanitize.test.js                # XSS sanitization (29 tests)
├── state.test.js                   # State persistence + events (15 tests)
├── data-loader.test.js             # JSON fetch + cache (9 tests)
├── router.test.js                  # Path validation + routing (12 tests)
├── focus-trap.test.js              # Tab cycling + cleanup (7 tests)
├── lightbox.test.js                # Video ID validation + sandbox (14 tests)
├── dom-helpers.test.js             # openExternal, animateCounter, loadJSON, saveJSON, downloadJSON (21 tests)
├── modal.test.js                   # Dialog init, dismiss, prompt, alert (15 tests)
├── command-palette.test.js         # Fuzzy search, keyboard nav, ARIA, execute (22 tests)
├── mobile.test.js                  # Device detection, viewport meta, mobile styles (11 tests)
├── github.test.js                  # API response validation (7 tests)
└── smoke.test.js                   # Critical path integration: DOM, routing, contact form, responsive (27 tests)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Core** | HTML5, CSS3 (custom properties, glassmorphism), JavaScript ES6 modules |
| **3D** | Three.js (galaxy background, Mahoraga wheel) |
| **Security** | DOMPurify 3.0.8 (SRI), 10 Vercel security headers |
| **Build** | Vite 7.x |
| **Test** | Vitest 4.x, jsdom |
| **Lint** | ESLint 9.x, Prettier |
| **Deploy** | Vercel (SPA routing, security headers) |
| **Fonts** | Tomorrow, Orbitron, JetBrains Mono (Google Fonts) |

**Zero framework dependencies.** Vanilla JavaScript core — Three.js for 3D, DOMPurify for XSS protection.

## Browser Support

Chrome 61+ · Firefox 60+ · Safari 11+ · Edge 79+

## Development

```bash
npm run dev       # Vite dev server (localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run test      # Run 201 vitest tests
npm run lint      # ESLint
npm run format    # Prettier
```

The project uses **Vite** for dev/build, **Vitest** + **jsdom** for testing, and **ESLint** + **Prettier** for code quality. There are no runtime dependencies — only dev tooling.

## Documentation

| Document | Description |
|----------|-------------|
| [DOCUMENTATION.md](DOCUMENTATION.md) | Complete user guide — 20 desktop apps, keyboard shortcuts, customization, deployment |
| [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md) | No-code content editor (console-only) |
| [EASTER_EGGS_GUIDE.md](EASTER_EGGS_GUIDE.md) | All hidden easter eggs and secret interactions |
| [CHANGELOG.md](CHANGELOG.md) | Full version history from v1.0 to present |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture — all 41 modules, dependency graph, init sequence |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Terminology and codebase glossary |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [docs/anthropic-claude-code-marketing-ops.md](docs/anthropic-claude-code-marketing-ops.md) | Case study: Anthropic's marketing team using Claude Code for ad ops |
| [docs/research-bloomberg-terminal-analogy.md](docs/research-bloomberg-terminal-analogy.md) | Bloomberg Terminal analogy for AI-assisted development |
| [docs/research-cursor-poach-boomerang.md](docs/research-cursor-poach-boomerang.md) | Cursor poached Claude Code's leads; Anthropic hired them back in 14 days |

## License

MIT — **v3.16.6**

---

<div align="center">

**Built with vanilla JavaScript. No frameworks. No dependencies. Just web standards.**

[Live Demo](https://jamesdare.com) · [Source](https://github.com/DareDev256/portfolio-os) · [Changelog](CHANGELOG.md)

</div>
