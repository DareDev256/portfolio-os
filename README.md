<div align="center">

# ◈ PASSION OS

### A Desktop Operating System in the Browser — Zero Frameworks, Pure Web Standards

![Version](https://img.shields.io/badge/v3.57.2-00f0ff?style=flat-square&labelColor=0d0d0d)
![Tests](https://img.shields.io/badge/453_tests-00e676?style=flat-square&labelColor=0d0d0d)
![Modules](https://img.shields.io/badge/60_modules-b388ff?style=flat-square&labelColor=0d0d0d)
![Frameworks](https://img.shields.io/badge/0_frameworks-ff5252?style=flat-square&labelColor=0d0d0d)

**[▸ ENTER THE LIVE DEMO](https://jamesdare.com)**

</div>

---

A fully interactive desktop environment — draggable windows, GPU-composited glass UI, Three.js cyberspace, Spotlight-style command palette — running entirely in the browser with zero runtime dependencies. Not a portfolio template. An operating system.

Built by [**James Olusoga**](https://github.com/DareDev256) — AI Solutions Engineer & Creative Technologist, Toronto.

> `60 modules` · `30 stylesheets` · `453 tests / 23 suites` · `21 desktop apps` · `0 dependencies`

## Quick Start

**Prerequisites:** Node.js 18+ and npm 9+.

```bash
git clone https://github.com/DareDev256/portfolio-os.git
cd portfolio-os
npm install
npm run dev
```

Open `http://localhost:5173`. Click the lock screen to enter.

## What You're Looking At

### Desktop Environment

- **Window Manager** — Drag, resize, minimize, maximize, z-index focus management with ceiling-bounded normalization. Animated open/close with glass shimmer effects.
- **21 Desktop Icons** — Custom SVG icons in a recruiter-optimized 4-column grid. Right-click context menus on each. Includes 3 external deployed-project links (Vibe Coder, IMG_GEN.ai, TypeMaster) and a curated Portfolio showcase.
- **Purple Reign Showcase** — Opens with the "Ascending Core" — a rotating CSS 3D obsidian crystal with internal amethyst glow that fractures apart on scroll, revealing the content beneath. Followed by the "Amethyst Code" hero reveal — a metallic purple glitch effect that resolves to unveil the section title. Featured projects display as cinematic scroll-snap chapters with forcefield reveal, gilded gold shimmer on titles, staggered animations, dot navigation, and syntax-highlighted code snippets with copy-to-clipboard. CTA buttons feature "Opulent Interface" micro-interactions: embossed depth, animated gold border trace, and letter-spacing breathe on hover. Each chapter has a "Catalyst Aura" — a mouse-reactive amethyst-gold glow with hexagonal crystal lens that follows the cursor.
- **Command Palette** — `Cmd+K` / `Ctrl+K` opens a Spotlight-style fuzzy-search launcher across all apps and system toggles.
- **Dock** — macOS-style magnetic magnification (icons swell on cursor proximity with Gaussian falloff), active window indicators, minimize-to-dock animation, hover tooltips.
- **Client-Side Routing** — Deep-linkable URLs (`/about`, `/work`, `/resume`, `/terminal`) via History API.
- **Themes** — Dark/light toggle with wallpaper cycling. State persists in localStorage.
- **Ambient System Telemetry** — Live CPU/RAM metrics in the top bar fluctuate via weighted random walks, session uptime counter, visit tracking with welcome toasts, and periodic contextual tips.

### Visual Effects Stack

- **MMBN Cyberspace Background** — Three.js perspective grid with cobalt data streams, glowing network nodes, and a deep blue-purple void sky.
- **3D Mahoraga Wheel** — Three.js lock screen centerpiece. 60fps + antialiasing on desktop, 30fps lean mode on mobile.
- **Glass UI** — `backdrop-filter` frosted panels on windows, top bar, dock, and desktop icons — GPU-optimized with reduced blur radii.
- **3D Icon Tilt** — Desktop icons respond to cursor position with gyroscopic 3D perspective tilt (±18°) and an inner light bloom that shifts to simulate overhead lighting. Mouse-tracked via CSS custom properties, MutationObserver for dynamic icons. Respects `prefers-reduced-motion`.
- **Tokenized Motion System** — All transitions use design tokens (`--transition-fast/medium/slow`, `--ease-decel/accel/spring`) instead of hardcoded values. Entry animations decelerate, exits accelerate, emphasis bounces — no generic `ease` defaults.
- **Catalyst Pulse** — Ambient breathing energy field behind the lock screen hero. A gold-core radial glow with an amethyst outer halo pulsates in a 4s/6s dual-rhythm breath cycle, with geometric crosshair lines and corner brackets framing the wheel. Moving the cursor toward screen center intensifies the glow — a proximity-driven reveal that makes the lock screen feel alive before the user interacts. CSS-animated with GPU-composited `will-change`, JS mouse tracking for intensity. Respects `prefers-reduced-motion`.
- **Parallax Depth Engine** — Mouse-driven lock screen layers + wheel-driven cinematic depth separation + ambient drift + scroll-driven desktop background shifts. 4-layer depth with lerp smoothing, scroll momentum decay, sine-wave ambient oscillation, MutationObserver for dynamic windows, `will-change` GPU compositing. Scroll the hero to pull layers apart at different rates. Respects `prefers-reduced-motion`.
- **Holographic Blueprint Reveal** — Project cards in the Applications window enter with a tech-blueprint animation: gold corner crosshairs lock on, edge-trace lines draw themselves (gold → amethyst gradient), a scan line sweeps, then content resolves from blur to clarity. Overlay fades out after completion. CSS-only, zero JS overhead. Respects `prefers-reduced-motion`.
- **Signature Accents** — Gold HUD corner brackets materialize on active windows like Stark Industries targeting overlays. A gold focus-flash briefly warms the border on window activation, and the titlebar line shifts to a breathing gold-amethyst heartbeat pulse. Active window titles gain a faint gold text-shadow. Pure CSS, zero JS overhead. Respects `prefers-reduced-motion`.
- **Sonar Pulse** — Click anywhere on the desktop surface and concentric gold/amethyst rings radiate outward from the impact point like a Stark Industries targeting ping. A crosshair flashes at the origin while a JetBrains Mono HUD readout floats upward showing click coordinates and a randomized sector status tag (`SECTOR CLEAR`, `SIGNAL NOMINAL`, etc.). Three staggered rings alternate gold/amethyst with decreasing opacity. Debounced to prevent spam. Desktop-only, respects `prefers-reduced-motion`.
- **Glimmer Sweep** — Diagonal gold-to-amethyst light sweep on hover for portfolio cards, project cards, portfolio links, and dock icons. GPU-composited `translateX` animation with `ease-decel` fade-out. Respects `prefers-reduced-motion`.
- **Golden Cadence** — Mouse-reactive metallic sheen on the top bar and dock. A gold/holographic radial gradient tracks the cursor, simulating light catching on brushed metal. CSS custom properties bridge JS cursor tracking to GPU-composited radial gradients. Dock border warms to gold on proximity. Respects `prefers-reduced-motion`.
- **Purple Haze Reveal Curtain** — Cinematic lock-to-desktop transition. Two amethyst velvet panels (CSS noise texture) cover the screen during boot, a golden seam draws across the divide, an atmospheric bloom radiates from center, then the panels part vertically to reveal the desktop. Inspired by Prince's Purple Rain staging. Uses design system motion tokens. Respects `prefers-reduced-motion`.
- **Black Mirror Signal Acquisition** — Cinematic "Act 0" pre-intro on the lock screen. Three staggered interference bars sweep vertically with gold-amethyst gradients, edge glows pulse from screen boundaries, and a "SIGNAL ACQUIRED" data flash flickers in stepped keyframes before dissolving into the existing boot sequence.
- **Cursor Aurora** — Lock screen tracks mouse position via CSS custom properties, rendering a dual-layer amethyst/gold radial glow that follows the cursor. GPU-composited, zero layout thrash. INITIALIZE button shifts to amethyst hover state to match.
- **Scroll-Triggered Reveals** — Elements inside window content animate into view as they scroll into the viewport. IntersectionObserver-driven with five variants (fade-up, fade-left, fade-right, scale, clip-up), staggered delay cascades, amethyst accent-line on project cards, gold accent sweep on service cards. Applied across Portfolio, About, Contact, Services, Applications, and Media windows. MutationObserver auto-wires new windows. Respects `prefers-reduced-motion`.
- **Unveiling Gauntlet** — The About Me window is a cinematic multi-stage scroll experience. Three full-height stages (Identity, Mission, Arsenal) reveal progressively with CSS perspective-based depth transforms (`translateZ`), staggered child animations, gold divider sweeps with spring easing, and an SVG "auric signature" monogram that draws itself via `stroke-dashoffset` as each stage enters view. Built on a dedicated `Gauntlet` IntersectionObserver module that auto-wires new windows via MutationObserver.
- **System Whispers** — Ambient floating HUD data fragments that drift across the desktop at low opacity. Monospace text snippets (cipher hashes, neural-link telemetry, system diagnostics) spawn at random positions and float upward in gold/cyan, creating a "data-in-the-air" holographic lab atmosphere. Max 6 concurrent, auto-pauses when tab hidden. Respects `prefers-reduced-motion`.
- **Phantom Reticle** — A spring-physics HUD targeting reticle that follows the cursor with elastic easing. A dashed gold ring with crosshairs smoothly tracks movement, then "locks on" to interactive elements (dock items, icons, buttons) by snapping to their center, scaling proportionally, and shifting from gold to amethyst. Clicks trigger an expanding pulse ring. DOM-light (5 elements), GPU-composited with `mix-blend-mode: screen`. Respects `prefers-reduced-motion`.
- **Cursor Trails** — Particle effects with PlayStation/chakra symbols. Lazy-initialized, throttled to 30fps.
- **Toast Notifications** — Non-blocking notification queue with success/error/warning/info types, auto-dismiss progress bar, hover-to-pause, and `aria-live` screen reader support.
- **Easter Eggs** — Konami code, triple-click glitch pulse, type "418" for teapot, `Ctrl+Shift+V` for system info, 18 terminal sass commands.

### Desktop Icons (21)

| Icon | Type | What It Does |
|------|------|-------------|
| **ABOUT_ME.exe** | Window | Bio, role, location, color-coded skills grid |
| **RESUME** | Window | PDF viewer |
| **CONNECT** | Window | Contact form with validation |
| **LINKEDIN** | External | Opens LinkedIn profile |
| **SKILLS_MATRIX** | Window | Interactive skills visualization |
| **GITHUB_OPS** | Window | Live GitHub API integration |
| **PORTFOLIO** | Window | Curated 5-project featured showcase with tech badges, live demo links, and rich cards |
| **APPLICATIONS** | Window | 17 real projects across 4 categories with DEPLOYED/SOURCE badges, Lab Notes click-to-reveal diagnostics, and classified dossier declassification reveals (scan-line sweep + ACCESS GRANTED stamp) |
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
| **TROPHIES.exe** | Window | Achievement system — 10 unlockable trophies for exploring the OS (explorer, speed demon, night owl, completionist...) |

### Security (Hardened Across v3.1–v3.57.2)

- All `innerHTML` routed through DOMPurify (SRI hash on CDN) — including window content, titlebar icons, taskbar icons, and start menu items
- 10 HTTP security headers via Vercel (CSP, HSTS, X-Frame-Options, COOP, COEP, CORP, Permissions-Policy)
- URL injection prevention — allowlist-based router, CSS breakout stripping
- `State.setWallpaper()` validates URLs through `Sanitize.url()` before localStorage persistence — prevents stored CSS injection via localStorage poisoning; gradient tokens validated against an explicit allowlist; `data:image/` URIs restricted to safe MIME types (png, jpeg, gif, webp)
- `Sanitize.attr()` blocks `data:image/svg+xml` XSS vectors alongside `javascript:`, `vbscript:`, and `data:text/html`
- `Sanitize.url()` enforced on all `href`/`src` attributes sourced from external data (project links, media posters, GitHub avatars, lightbox images) — blocks `blob:`, `ftp:`, and other dangerous URI schemes
- `Sanitize.cssUrl()` strips CSS-breaking characters (`'`, `"`, `(`, `)`, `;`, `\`) from URLs embedded in CSS `url('...')` contexts — prevents stored CSS injection via crafted backup imports
- Prototype pollution protection on all `localStorage` reads — `loadJSON()` strips `__proto__`/`constructor`/`prototype` keys from every parsed value across all callers
- Admin Dashboard renders all tab content through `Sanitize.setHTML()` (defense-in-depth against future template injection)
- CSP `connect-src` allowlists only known API origins (GitHub, Open-Meteo, Passion API) — stale wildcards removed
- All external API fetches protected by `AbortController` timeout (8s) via shared `fetchWithTimeout` — prevents frozen interfaces on slow/unreachable APIs
- localStorage `JSON.parse` wrapped in try/catch with fallbacks
- SVG content sanitized before DOM insertion
- CSP `img-src` locked to explicit GitHub asset domains
- YouTube/Vimeo video ID regex validation — blocks injection via crafted embed URLs
- Direct `<video>` sources validated through `Sanitize.url()` — blocks `javascript:`, `data:`, `blob:` URI schemes from admin-editable media entries
- Iframe `sandbox="allow-scripts allow-same-origin allow-presentation"` on all video embeds — blocks top-navigation, form submission, and popups
- Navigator API values HTML-escaped before innerHTML interpolation (defense-in-depth against extension/polyfill mutation)
- Weather widget validates API response shape and coordinate inputs
- GitHub API response shape validation — rejects malformed cache/API data before rendering
- `rel="noopener noreferrer"` on all `target="_blank"` links — prevents tabnapping
- Contact form input length limits (name 100, email 254, message 2000) — prevents mailto URI abuse
- All `Sanitize.*()` inputs capped at 500KB (`MAX_INPUT_LENGTH`) — prevents ReDoS and algorithmic-complexity attacks on sanitization functions (CWE-400)
- Terminal `cat` command uses `Object.hasOwn()` instead of bracket-notation — prevents prototype property leakage (CWE-1321)
- `openExternal()` rejects URLs exceeding 2048 characters — caps input before `window.open()` processing
- Terminal command history bounded at 100 entries — prevents unbounded memory growth in long sessions (CWE-770)

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
- Clean timer/RAF lifecycle — clock intervals, taskbar clocks, ambient timers, drag-inertia frames, and lightbox pan state properly cleared on teardown and re-init

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
| **Test Coverage** | 485 tests across 25 suites (vitest + jsdom) |
| **Security** | DOMPurify on all innerHTML, 10 HTTP headers, CSP, SRI |
| **Accessibility** | WCAG focus trapping, aria-live, skip-link, reduced-motion |
| **Performance** | Lazy-loaded modules, RAF pausing, 30fps-throttled FX |
| **Lint** | 0 ESLint warnings, Prettier-formatted |
| **Bundle** | 132 kB main chunk, code-split lazy modules |

## Deep Dive: 3D Icon Tilt (`icon-tilt.js`)

The desktop icons respond to cursor proximity with a gyroscopic 3D perspective tilt — a small module (83 LOC) that punches well above its weight in perceived polish. Here's how it works under the hood.

### The Math

Every icon tracks its center relative to the viewport. On `mousemove`, the cursor position is normalized to a `−1…1` coordinate space:

```
          −1
           │
  −1 ──────┼────── +1     nx = (clientX − centerX) / halfWidth
           │               ny = (clientY − centerY) / halfHeight
          +1
```

These normalized values drive two things:

1. **Tilt angles** — `rotateY(nx × 18°)` and `rotateX(−ny × 18°)`. The Y-axis tracks horizontal movement, X-axis tracks vertical (inverted so the icon tilts *toward* the cursor, not away).
2. **Light bloom position** — The `::before` pseudo-element renders a `radial-gradient` spotlight. Its center shifts *opposite* to the tilt (`50% + n × 30%`), simulating overhead lighting — when the icon tilts left, the light appears to come from the right. This sells the 3D illusion.

### CSS Architecture

The JS never touches `transform` directly. Instead it writes four CSS custom properties:

| Property | Default | Range | Purpose |
|----------|---------|-------|---------|
| `--tilt-x` | `0deg` | ±18° | X-axis rotation |
| `--tilt-y` | `0deg` | ±18° | Y-axis rotation |
| `--bloom-x` | `50%` | 20–80% | Light bloom horizontal |
| `--bloom-y` | `50%` | 20–80% | Light bloom vertical |

CSS consumes them via `transform: perspective(600px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))` on `.desktop-icon-box`, and `radial-gradient(circle at var(--bloom-x) var(--bloom-y), ...)` on the `::before` pseudo-element. This separation means the effect is entirely CSS-removable — delete the custom properties and the icons fall back to flat, zero-breakage.

### Why It Feels Right

- **`perspective(600px)`** — Close enough to create visible depth without fisheye distortion. Values below 400px warp aggressively; above 800px the tilt becomes imperceptible.
- **`will-change: transform`** — Promotes the element to its own compositor layer. The GPU handles the 3D transform instead of triggering layout/paint cycles.
- **`ease-out` transition on transform** — The icon follows the cursor with slight inertia on the way in, then springs back smoothly on `mouseleave` when all properties reset to defaults.
- **`MutationObserver`** — Auto-wires icons added dynamically to the DOM, so no manual re-init is needed when the desktop grid changes.

### Accessibility

The module checks `prefers-reduced-motion: reduce` at init and listens for live changes via `matchMedia.addEventListener('change')`. When reduced motion is active, `handleMove` early-returns — icons remain static. The bloom and tilt custom properties stay at their defaults, so the frosted glass appearance is preserved without any motion.

### Files

| File | Role |
|------|------|
| `js/icon-tilt.js` | Mouse tracking, coordinate math, custom property writes |
| `css/styles.css:1068–1111` | `.desktop-icon-box` transform + `::before` bloom gradient |
| `css/glass.css:464–465` | Glass system integration (tilt vars in glass transforms) |

---

## Why No Frameworks?

Not ideology. Proof of depth.

Routing, state management, component lifecycle, lazy loading, accessibility — everything you'd expect from a React/Next.js build — implemented against the raw DOM API. 49 hand-written modules that prove understanding of what frameworks abstract away.

**The constraint is the point.** Anyone can `npx create-next-app`. Building a desktop OS with draggable windows, GPU-composited glass, and WebGL backgrounds from scratch is a different conversation.

## Architecture

```
js/                                 # 55 ES modules, zero framework imports
├── main.js                         # Entry — orchestrates boot, lazy-loads FX
├── boot.js                         # Cinematic boot sequence
├── login.js                        # Lock screen + 3D wheel init
├── desktop.js                      # Icon grid, context menus, app launchers
├── windows.js                      # Window manager (drag, resize, z-index)
├── state.js                        # localStorage persistence + CustomEvent bus
├── router.js                       # History API deep-linkable routing
├── command-palette.js              # Cmd+K fuzzy-search launcher
├── data-loader.js                  # Centralized JSON fetcher with caching
├── dom-helpers.js                  # Shared utilities (isPageHidden, prefersReducedMotion, isElementVisible, isInViewport, openExternal, animateCounter, loadJSON, saveJSON, downloadJSON, loadBool, saveBool, createRevealSystem, createThrottledLoop, resizeCanvasDPR)
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
├── version.js                      # Single source of truth for app version
├── scroll-reveal.js                # IntersectionObserver scroll-triggered animations
├── parallax.js                     # Parallax depth engine (mouse + scroll + ambient drift)
├── dock-magnify.js                 # macOS-style dock icon magnification
├── ambient-system.js               # Live system telemetry simulation
├── weather.js                      # Geolocation weather widget (Open-Meteo)
├── interactions/
│   ├── engine.js                   # Orchestrator (30fps throttled)
│   ├── cursor-trail.js             # Particle cursor effects
│   ├── cursor-tracker.js           # Mouse position tracking
│   ├── cursor-reactive.js          # Reactive cursor animations
│   ├── sound-manager.js            # UI sound effects
│   ├── easter-eggs.js              # Konami, 418, glitch pulse
│   └── micro-interactions.js       # Hover/click micro-animations
│
css/                                # 26 modular stylesheets
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
tests/                              # 485 vitest tests across 25 suites
├── sanitize.test.js                # XSS sanitization (54 tests)
├── state.test.js                   # State persistence + events (17 tests)
├── state-toggles.test.js           # Auto-generated boolean toggles (14 tests)
├── data-loader.test.js             # JSON fetch + cache (9 tests)
├── router.test.js                  # Path validation + routing (12 tests)
├── focus-trap.test.js              # Tab cycling + cleanup (7 tests)
├── lightbox.test.js                # Video ID validation + sandbox (20 tests)
├── dom-helpers.test.js             # openExternal, animateCounter, loadJSON, saveJSON, downloadJSON (21 tests)
├── dom-helpers-edge.test.js        # el(), visibility, viewport, protocol edges (27 tests)
├── modal.test.js                   # Dialog init, dismiss, prompt, alert (18 tests)
├── command-palette.test.js         # Fuzzy search, keyboard nav, ARIA, execute (22 tests)
├── mobile.test.js                  # Device detection, viewport meta, mobile styles (11 tests)
├── github.test.js                  # API response validation (7 tests)
├── github-stats.test.js            # GitHub stats display + error handling (12 tests)
├── windows.test.js                 # Window manager, titlebar, cascade, content (65 tests)
├── desktop-utils.test.js           # Desktop utilities + DOMPurify fallback (23 tests)
├── scroll-reveal.test.js           # IntersectionObserver, MutationObserver, WeakSet dedup (9 tests)
├── notifications.test.js           # Toast queue, auto-dismiss, hover pause/resume, a11y (17 tests)
├── security-boundaries.test.js     # Prototype pollution, fetchWithTimeout, state persistence (22 tests)
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
npm run test      # Run 485 vitest tests
npm run lint      # ESLint
npm run format    # Prettier
```

The project uses **Vite** for dev/build, **Vitest** + **jsdom** for testing, and **ESLint** + **Prettier** for code quality. There are no runtime dependencies — only dev tooling.

## Deployment

Passion OS is deployed on **Vercel** at [jamesdare.com](https://jamesdare.com). Every push to `main` triggers an automatic production deployment.

### Vercel (Production)

```bash
# Install the Vercel CLI
npm i -g vercel

# Link to the project (first time only)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

The project ships with a `vercel.json` that configures:
- **SPA rewrites** — all routes fall through to `index.html` for client-side routing
- **12 security headers** — CSP, HSTS (2-year preload), X-Frame-Options, COOP, COEP, CORP, Permissions-Policy, DNS prefetch control, download options, and cross-domain policies
- **Service Worker cache control** — `no-cache` on `sw.js` to prevent stale worker versions
- **Data endpoint caching** — 5-minute `Cache-Control` with `stale-while-revalidate` on `/data/*`

### Custom Domain

1. Add your domain in the Vercel Dashboard → Settings → Domains
2. Point your DNS `A` record to `76.76.21.21` (or use the CNAME Vercel provides)
3. SSL is provisioned automatically

### Local Preview (Production Build)

```bash
npm run build      # Vite build → dist/
npm run preview    # Serve dist/ on localhost:4173
```

### Environment Notes

- No `.env` file required — the app has zero server-side secrets
- All API calls (GitHub, Open-Meteo, Passion API) use public endpoints
- The Service Worker (`sw.js`) caches assets locally with network-first for navigation and LRU eviction at 150 entries

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

MIT — **v3.45.2**

---

<div align="center">

**No frameworks. No dependencies. No excuses.**

[▸ Live Demo](https://jamesdare.com) · [Source](https://github.com/DareDev256/portfolio-os) · [Changelog](CHANGELOG.md)

</div>
