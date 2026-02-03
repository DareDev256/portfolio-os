# Passion OS v3.0

**A cyberpunk-inspired portfolio operating system built with vanilla JavaScript -- no frameworks, no dependencies.**

Interactive desktop environment featuring draggable windows, GPU-optimized glass effects, recruiter-focused icon layout, easter eggs, and a full visual effects stack.

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

| Column 1: Hire Me | Column 2: What I Build | Column 3: Projects | Column 4: Extras |
|---|---|---|---|
| RESUME | SKILLS_MATRIX | Vibe_Coder.exe | MUSIC_VIDEOS |
| ABOUT_ME.exe | GITHUB_OPS | IMG_GEN.ai | SETTINGS |
| CONNECT | APPLICATIONS | TYPEMASTER | |
| LINKEDIN | DEV_TERMINAL | SHOWCASE.mp4 | |

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
- **Three.js** - Galaxy background, 3D wheel
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
