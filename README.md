# Passion OS v3.3.0

**A cyberpunk-inspired portfolio operating system built with vanilla JavaScript -- no frameworks, no dependencies.**

Interactive desktop environment featuring draggable windows, GPU-optimized glass effects, MMBN cyberspace galaxy theme, recruiter-focused content, and a full visual effects stack.

---

## v3.3.0 -- Content & Visual Overhaul

Complete content rewrite for recruiter readiness, galaxy theme unification, SEO improvements, and project data integrity.

- **About Me rewritten**: Real bio (AI Solutions Engineer, Passion Agent, autonomous systems), Toronto location, color-coded skills grid.
- **Galaxy theme unified**: Top bar brand text shifted from gold to cobalt blue gradient, dock deepened with galaxy tint, HUD elements recolored.
- **SEO**: Open Graph tags, Twitter cards, canonical URL, author meta, keyword meta added.
- **Projects data fixed**: Cross-referenced with GitHub API -- only public repos get repo links, added missing links for Contract Translator, PulseMap, Tdots Portfolio, IMG Gen.
- **Contact window fixed**: LinkedIn now links to actual profile, email goes to real address.
- **Version sync**: All v3.2.1 references updated to v3.3.0 across title, top bar, boot sequence.
- **CSS cache busting**: All stylesheet links bumped to ?v=3.4.

---

## v3.2.0 -- Portfolio Refresh

Recruiter-priority icon reorder, expanded 18-project Applications showcase, and Orbitron font for MMBN digital aesthetic.

- **Icon layout**: Row-first F-pattern scanning -- top row is About Me, Applications, Music Videos, Resume.
- **Applications showcase**: 18 real projects across 4 categories (AI & ML, Full-Stack, Creative & Client, Games & Tools) with DEPLOYED/SOURCE status badges.
- **Font**: PASSION OS title changed from Bangers (manga) to Orbitron (geometric digital) -- matches the MMBN cyberspace background.
- **projects.json**: Removed 6 filler/placeholder projects, replaced with 19 real repos.

---

## v3.1.2 -- MMBN Cyberspace Background

Replaced the static pink nebula shader with a Megaman Battle Network-style digital cyberspace background. Perspective grid floor with cobalt blue data streams, platinum grid lines, glowing network nodes, and a deep blue-purple void sky. Title shrunk so the 3D Mahoraga wheel is the hero element.

---

## v3.1 Release Notes

### Security Hardening

Full-stack XSS audit -- every `innerHTML` assignment now runs through DOMPurify sanitization.

- **DOMPurify wired to all injection points**: terminal, github dashboard, admin panel, desktop, modal dialogs. Previously imported but never called.
- **DOMPurify config tightened**: removed dangerous tags (iframe, input, video), added SVG support for icon rendering.
- **SRI hash** on DOMPurify CDN script tag.
- **6 security headers** via Vercel: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **CSS injection prevention** in wallpaper URL handler (blocks `javascript:`, `data:text/html`, strips breakout characters).
- **JSON import validation** with schema checks and size bounds for admin backup/restore.
- **Admin panel hidden from UI** -- no longer accessible to visitors, console-only for developer.
- **Service worker** now validates `res.ok` before caching responses.

### Performance

- **State decoupled from visual modules** via CustomEvent observer pattern -- `state.js` has zero knowledge of FX/Aurora/Glyphs/AudioFX/InteractionEngine.
- **Animation loops pause when tab hidden** (aurora, fx, skills, mahoraga wheel). Aurora throttled to ~24fps, FX to ~30fps.
- **Lazy loading** for SkillsUniverse, GitHub, Terminal -- only fetched when user opens the window.
- **Google Fonts trimmed**: 6 families / 18 weights down to 5 families / 12 weights (~200KB saved).
- **CSS cache busting** on all 14 stylesheet links.

### Accessibility & UX

- **`aria-live` regions** for screen reader window open/close announcements.
- **Focus trapping** in modal, login, welcome, and tour overlays with shared `trapFocus()` utility.
- **Skip-link** for keyboard users.
- **ESC key priority**: modal > lightbox > tour > window (no more closing windows behind open modals).
- **Mobile touch targets** bumped to 44px minimum (WCAG compliance), icon labels to 10px.
- **Dock tooltip conflict fixed** -- moved from `::after` to `::before` to coexist with active dot indicator.
- **Missing CSS variables defined** (`--neon-pink`, `--neon-orange`) -- 7 references were silently producing nothing.
- **Reduced-motion queries deduplicated** -- single global wildcard in `accessibility.css`, targeted overrides elsewhere.

### Code Quality

- **27 smoke tests** via vitest covering Sanitize and State modules.
- **Window `onClose` callback** for cleanup (SkillsUniverse RAF cancellation on close).
- **17 dead files deleted** (test HTML, shell scripts, stale docs, log files).
- **Dead imports cleaned** from main.js.

---

## v3.0 Release Notes

### Performance Overhaul

The biggest focus of v3.0: killing lag at the source.

**Problem:** The desktop was running 30+ concurrent `backdrop-filter: blur()` compositor layers (15 icons x 2 blur ops each), plus always-on CSS animations on every icon and dock item, plus unthrottled 60fps JavaScript RAF loops -- all stacking on top of a Three.js galaxy background.

**Approach:**
- Removed all `backdrop-filter` from desktop icons and labels. On a dark nebula background, the blur was invisible anyway -- pure GPU cost for zero visual payoff. Increased opacity instead for the same perceived effect.
- Reduced blur radii on windows (40 -> 20px), top bar (30 -> 16px), dock (40 -> 20px). Still visually frosted, half the sampling cost.
- Killed 5 always-on CSS animations (`icon-idle-float`, `icon-glow-pulse`, `dock-idle-bounce`, `brand-shimmer`, `galaxy-text-glow`). Icons now glow only on hover. The `hud-bar-dance` animation (which animated `height`, triggering layout reflow every frame) replaced with static heights.
- Replaced the Glyphs module's unthrottled RAF loop with a CSS `animation: rotate` -- runs on the compositor thread at zero main-thread cost.
- Throttled InteractionEngine from 60fps to 30fps for half the work on effects that don't need 60fps fidelity.
- Cached `getBoundingClientRect()` in the galaxy mousemove handler -- was forcing layout recalculation on every single mouse event (60-120Hz).
- Added `visibilitychange` pausing to InteractionEngine -- zero CPU when tab is hidden.
- Reduced default star particle count from 300 to 150.

### Bug Fixes

**Interaction engine never loading (critical):**
- `navigator.hardwareConcurrency < 4` was silently killing the entire interaction system. Changed to a warning instead of a hard exit. User preference takes priority over heuristic gates.
- `window.InteractionEngine` vs `window.__InteractionEngine` naming mismatch across 6 files. Easter-eggs.js and micro-interactions.js referenced the wrong global name, so Konami code activation, notification sounds, and micro-interaction sounds all silently failed (optional chaining hid the errors).
- Cursor trail triple-gated by `prefers-reduced-motion`: engine init, trail init, AND `setEnabled()` all independently blocked it. Now respects explicit user opt-in -- lazy-initializes the particle pool if needed.

**Icon overlap (MUSIC_VIDEOS on top of DEV_TERMINAL):**
- Root cause: `portfolio-videos` was the only desktop item not assigned to any column group in `getDefaultPosition()`. It fell through to the fallback grid formula: `col = 13 % 4 = 1, row = floor(13/4) = 3` -- the exact same position as `terminal` in the coreApps column. Fixed by giving every icon an explicit column assignment.

### Desktop Icon Reorder (Recruiter Optimization)

Reorganized the 4-column desktop layout to front-load what recruiters actually look for:

| Row | Col 1 | Col 2 | Col 3 | Col 4 |
|-----|-------|-------|-------|-------|
| 1 (First Impression) | ABOUT_ME | APPLICATIONS | MUSIC_VIDEOS | RESUME |
| 2 (Technical) | GITHUB_OPS | SKILLS_MATRIX | SHOWCASE | LINKEDIN |
| 3 (Live Projects) | Vibe_Coder | IMG_GEN.ai | DEV_TERMINAL | CONNECT |
| 4 (Utilities) | TYPEMASTER | SETTINGS | | |

Removed MEDIA_VAULT (redundant with MUSIC_VIDEOS).

### Easter Eggs

All zero-cost at rest -- event-driven, no RAF loops, no persistent DOM.

- **18 new terminal sass commands**: `neofetch`, `matrix`, `cowsay`, `ping`, `top`, `history`, `fortune`, `git blame`, `ssh root@passion-os`, `docker`, `apt-get install girlfriend`, and more
- **Triple-click desktop background**: Triggers a glitch pulse (500ms CSS filter animation)
- **Type "418" anywhere**: "I'M A TEAPOT" notification
- **Type "404" anywhere**: "NOT FOUND... or is it?" notification
- **Ctrl+Shift+V**: System info popup (uptime, window count, vibe level)
- **Konami code**: Now actually works (fixed the `window.__InteractionEngine` reference)

### Visual Upgrades (Prior Work)

- 3D Mahoraga wheel on lock screen (Three.js)
- HUD corner brackets on windows
- Glass shimmer + scan effects on window open
- HUD orbit rings on intro watermark
- HUD mini-bars in top bar
- New fonts: Tomorrow, JetBrains Mono

---

## Features

### Core OS

- Desktop environment with icon-based launcher and context menus
- Window manager with drag, resize, minimize, maximize
- GPU-optimized glass/frosted effects (backdrop-filter where it matters)
- Client-side routing with deep linkable URLs (`/about`, `/work`, `/resume`)
- Mobile responsive with auto-detection
- Command palette (Cmd+K)

### Content

- Photo gallery with lightbox and keyboard navigation
- Video player supporting MP4, YouTube, Vimeo
- Portfolio project showcase with tech tags
- Resume PDF viewer
- Contact form with EmailJS/Formspree
- Admin dashboard for no-code content editing

### Technical

- State persistence via localStorage
- Dark/light themes with wallpaper cycling
- Full keyboard navigation and accessibility
- Toggle-able sound effects
- Boot sequence with cinematic intro
- Interaction engine with cursor trails, micro-interactions, and easter eggs
- Three.js galaxy background with nebula shader

---

## Quick Start

```bash
git clone https://github.com/yourusername/passion-os.git
cd passion-os
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, animations, glassmorphism
- **JavaScript (ES6)** - Modules, async/await, Web Animations API
- **Three.js** - Galaxy background, 3D wheel (adaptive rendering: 60fps/antialias on desktop, lean on mobile)
- **localStorage** - Client-side persistence
- **History API** - Client-side routing
- **Vite** - Development server

**Zero framework dependencies** -- vanilla JavaScript core.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [DOCUMENTATION.md](DOCUMENTATION.md) | Complete user guide |
| [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md) | No-code content editor |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues |

---

## Browser Support

- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

---

## License

MIT License

---

**Built with vanilla JavaScript. No frameworks. No dependencies. Just web standards.**
