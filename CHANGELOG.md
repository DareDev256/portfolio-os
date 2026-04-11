# Passion OS - Development Changelog

---

title: Passion OS Changelog
version: 3.69.0
last_updated: 2026-04-11

---

<!-- AI Context: Complete development history organized by phases.
     Related files: All js/*.js, css/*.css
     See: DOCUMENTATION.md for usage, FEATURE_VERIFICATION.md for testing -->

## Overview

This changelog documents the evolutionary development of Passion OS from initial concept to current state. Features are organized by implementation phases with the newest changes first.

---

## [3.69.0] — 2026-04-11

### Added
- **Arc Reactor** (`js/arc-reactor.js`, `css/arc-reactor.css`) — Stark Industries-inspired window focus effect. A racing energy trace (gold→amethyst→cyan conic gradient) continuously orbits the active window's titlebar border using CSS `@property` for smooth angle interpolation. Four corner energy nodes pulse at staggered intervals with gold glow halos. Activates on window focus, deactivates on blur. `mask-composite: exclude` renders the conic gradient as a thin border ring — zero JS animation loops. MutationObserver auto-wires dynamically spawned windows via `WeakSet`-tracked decoration. Respects `prefers-reduced-motion`.

---

## [3.68.1] — 2026-04-10

### Changed
- **Spatial utilities extracted to dom-helpers** — Added `distance2D()` and `isPointInRect()` helpers to `js/dom-helpers.js`, consolidating duplicated Euclidean distance calculations (9 occurrences across 7 files) and point-in-bounds checks (2 identical implementations in cursor-tracker and cursor-reactive).
- **Math.hypot adoption** — Replaced `Math.sqrt(dx * dx + dy * dy)` with `Math.hypot(dx, dy)` across cursor-tracker, cursor-reactive, cursor-trail, ambient-drift, catalyst-pulse, pulse-grid, and skills modules for improved readability and numerical stability.
- **CSS @keyframes spin deduplicated** — Consolidated 4 identical `@keyframes spin` definitions (across styles.css, loading.css, interactions.css) into a single canonical definition in `styles.css`.

## [3.68.0] — 2026-04-10

### Added
- **Amethyst Aperture** — Cinematic camera-iris reveal on the Purple Reign portfolio hero. A `clip-path: circle()` animation opens from center to reveal the creative director's identity: James Olusoga's name in muted gold Playfair Display serif with staggered letter-spacing animation, a self-drawing gold divider line, and an amethyst role tagline. Brushed-metal texture overlay adds depth. 6-stage staggered timing (iris 0s → name 0.7s → divider 1.1s → role 1.3s) layers with existing glitch animations. Respects `prefers-reduced-motion` via existing hero observer.

---

## [3.67.1] — 2026-04-09

### Added
- **Ambient Drift tests (20)**: Noise function determinism, orb creation bounds (radius, color alternation, speed range), cursor repulsion physics (direction, decay, zero-distance guard), viewport wrapping thresholds, and edge-fade dimming.
- **Neural Link tests (11)**: Distance calculation, nearest-neighbor sorting, `MAX_DISTANCE` exclusion (strict `<`), `MAX_LINKS` capping, self-exclusion, single/empty icon edge cases.
- **DOM Helpers utility tests (21)**: `hexAlpha` clamping/padding, `loadBool`/`saveBool` round-trip and quota handling, `createDecorativeEl` HTML/SVG with aria-hidden, `createPointerTracker` lifecycle (init/move/leave/destroy), `fetchWithTimeout` abort on timeout and external signal passthrough.

---

## [3.67.0] — 2026-04-09

### Added
- **Obsidian Veil — monolith fracture reveal overlay**: Full-viewport dark monolith overlays the Purple Reign portfolio window and fractures into six irregular polygon shards when scrolling past the hero. Two-phase scroll-driven choreography: Phase 1 (50% scroll) traces amethyst glow along fracture lines via `drop-shadow` on `clip-path` shapes; Phase 2 (70% scroll) scatters shards outward with staggered delays, directional rotation, and fade, while gold/amethyst particle blooms radiate from fracture intersection points. Sequences after the crystal fracture (30% scroll) for layered dramatic impact. Shards use `will-change` GPU compositing, zero extra JS modules — 8 lines of DOM creation + 6 lines of scroll logic integrated into existing handler. Respects `prefers-reduced-motion`. Files: `css/obsidian-veil.css`, `js/desktop.js`.

## [3.66.1] — 2026-04-09

### Added
- **tests(void-scroll):** 9 tests covering progress bar injection, scroll percentage calculation, active-class toggling, reduced-motion guard, edge case for zero maxScroll, and MutationObserver wiring for dynamically added windows
- **tests(cosmic-dust):** 12 tests covering particle creation bounds (radius, color palette, speed, phase distribution), twinkle oscillation range, edge-fade calculation (center, boundary, partial, symmetry), viewport wrapping logic, and flare decay math

## [3.66.0] — 2026-04-08

### Added
- **Void Scroll — cyberpunk scrollbar theme + scroll-progress indicators**: Global scrollbar reskin replaces default browser scrollbars with thin (6px), neon-traced bars using the Passion OS palette — cyan thumb, transparent track, amethyst on active. Every `.window-content` area gains a luminous 2px progress indicator at its top edge that fills proportionally as the user scrolls, with a radial glow at the leading tip. Uses MutationObserver to detect dynamically spawned windows, ResizeObserver for async content loading, and rAF-throttled scroll updates. Respects `prefers-reduced-motion`. Firefox `scrollbar-color` and WebKit `::-webkit-scrollbar` both covered. Files: `css/void-scroll.css`, `js/void-scroll.js`.

## [3.65.1] — 2026-04-08

### Fixed
- **Holographic Card Tilt — flicker on child element hover**: The `mouseleave` capture handler in `holo-tilt.js` fired on every internal element boundary crossing (overlay, title, tech tags), resetting the 3D tilt transform and causing visible flicker during hover. Root cause: `document.addEventListener('mouseleave', handler, true)` catches `mouseleave` events on all descendant elements, not just the card itself. Fix uses `e.relatedTarget` to distinguish internal child-to-child moves from actual card exits. Also handles viewport-leave edge case (null `relatedTarget`) by cleaning up lingering `_activeCard` state. Added 8 tests covering tilt application, child-element traversal, viewport exit, and reduced-motion guard.

## [3.65.0] — 2026-04-08

### Added
- **Holographic Card Tilt** — Project cards in the Applications window now respond to the cursor with 3D perspective tilt (±8°) and a holographic light sweep that tracks mouse position. A gold-to-amethyst radial gradient follows the cursor across the card surface via `mix-blend-mode: screen`, blueprint corner markers illuminate with gold drop-shadow on hover, and the scan line shifts to a warm gold tint. Cards scale up 2% during interaction and spring back with `--ease-decel` on mouse leave. Event-delegation-based — works with dynamically rendered cards without rebinding. Desktop-only, respects `prefers-reduced-motion`.

## [3.64.1] — 2026-04-08

### Fixed
- **`dom-helpers.js` — fragile selector matching in `createRevealSystem` MutationObserver**: The dynamic-element watcher used `classList.contains(selector.slice(1))` to detect newly added scroll-reveal targets, which only works for simple `.class-name` selectors and silently fails for compound, attribute, or ID selectors. Replaced with `node.matches(selector)` — the DOM's native CSS selector matcher that handles any valid selector string. Affects both `ScrollReveal` and `Gauntlet` reveal systems.

## [3.64.0] — 2026-04-07

### Added
- **Cosmic Dust** — Faint twinkling star-field of 50 tiny particles drifting across the desktop surface. Particles fade in and out via smooth twinkle oscillation, with rare stochastic flares — brief gold or amethyst radial glows that decay exponentially, creating a "distant starlight through darkened glass" atmosphere. Canvas-based at z-index 1 (deepest ambient layer), additive `screen` blend mode, edge-fade wrapping. No cursor interaction by design — these particles exist behind the glass. Pauses when tab hidden. Desktop-only, respects `prefers-reduced-motion`.

## [3.63.3] — 2026-04-06

### Added
- **`tests/desktop-effects.test.js` — 31 tests for v3.59–v3.63 features**: Comprehensive test coverage for the pure logic cores of spectral-echo, cipher-decode, neural-link, pulse-grid, and ambient-drift. Tests extracted math (lerp, colorAt, dist, noise2d, smoothNoise), neighbor selection with MAX_LINKS/MAX_DISTANCE constraints, hexAlpha edge cases, createDecorativeEl (HTML + SVG), getElementCenter, shouldSkipDesktopEffects media query guard, and createPointerTracker lifecycle.

### Fixed
- **`dom-helpers.js` — SVG className assignment bug in `createDecorativeEl`**: SVG elements have a read-only `className` property (`SVGAnimatedString`), so `el.className = 'foo'` silently failed in browsers and threw in jsdom. Switched to `setAttribute('class', ...)` which works for both HTML and SVG elements. This bug affected `neural-link.js` which creates an SVG overlay via `createDecorativeEl`.

## [3.63.2] — 2026-04-06

### Changed
- **`dom-helpers.js` — extract `PALETTE`, `initDesktopCanvas`, `createPointerTracker`**: Centralized the gold/amethyst RGB palette and the duplicated canvas-init + pointer-tracking boilerplate shared by `ambient-drift.js` and `pulse-grid.js`. New desktop canvas effects now get DPR-aware setup, desktop mounting, resize wiring, and cursor tracking in two function calls instead of 20+ lines of ceremony.
- **`ambient-drift.js` — use shared helpers**: Replaced inline color constants, canvas creation, mouse tracking, and resize wiring with `PALETTE`, `initDesktopCanvas`, and `createPointerTracker` from `dom-helpers.js`. Net −12 lines.
- **`pulse-grid.js` — use shared helpers**: Same extraction — replaced duplicated init boilerplate and color constants. Pointer events now schedule redraws through the shared tracker. Net −19 lines.

## [3.63.1] — 2026-04-06

### Security
- **`Sanitize.attr()` — fix validation/output mismatch (CWE-116)**: Previously returned the original input (with control chars intact) after validating against a stripped copy. Now returns the stripped value, closing a gap where inconsistent browser control-char normalization could bypass URI scheme checks.
- **`Sanitize.attr()` — restrict data: URI allowlist**: Replaced broad `includes('script')||includes('svg')` check with an explicit safe-MIME allowlist (png, jpeg, gif, webp). Blocks all non-raster data: URIs including svg+xml, Flash, PDF, and unknown types.
- **`stripDangerousKeys()` — depth-limited recursion (CWE-674)**: Added MAX_DEPTH=20 guard to prevent stack overflow from deeply nested JSON payloads via admin backup import. A crafted 10,000+ level payload previously crashed the browser tab.
- **`stripDangerousKeys()` — expanded blocklist**: Added `__defineGetter__`, `__defineSetter__`, `__lookupGetter__`, `__lookupSetter__` legacy mutation methods to the prototype pollution blocklist. Upgraded from Array to Set for O(1) lookup.

## [3.63.0] — 2026-04-05

### Added
- **Ambient Drift** — Luminous floating orbs on the desktop surface. 7 softly glowing spheres (alternating gold & amethyst) drift in slow organic paths using smoothed pseudo-noise, creating a living atmosphere like dust motes catching light in a darkened lab. Orbs repel gently from the cursor within a 180px radius, pulse in brightness over time, and fade near viewport edges to avoid hard pop-in. Canvas-based with `mix-blend-mode: screen` for additive glow over the dark background. Pauses when tab is hidden. Desktop-only, respects `prefers-reduced-motion`.
  - New files: `js/ambient-drift.js`, `css/ambient-drift.css`
  - Modified: `js/main.js` (registration), `index.html` (CSS link)

---

## [3.62.1] — 2026-04-05

### Changed
- **dom-helpers** — Extract three new shared utilities: `shouldSkipDesktopEffects()` (combined reduced-motion + coarse-pointer guard), `createDecorativeEl()` (aria-hidden element factory), and `getElementCenter()` (viewport-relative center calculation). Eliminates duplicated boilerplate across 8 visual effect modules.
- **neural-link, spectral-echo, pulse-grid, cipher-decode, sonar-pulse** — Replace inline `matchMedia` desktop guards with centralized `shouldSkipDesktopEffects()`.
- **spectral-echo, phantom-reticle, pulse-grid, cipher-decode, catalyst-pulse** — Replace `createElement + className + aria-hidden` three-liner with `createDecorativeEl()`.
- **neural-link, phantom-reticle, icon-tilt** — Replace inline `getBoundingClientRect` center calculations with `getElementCenter()`.
- **pulse-grid** — Replace duplicated DPR canvas resize logic with existing `resizeCanvasDPR()` from dom-helpers.

---

## [3.62.0] — 2026-04-04

### Added
- **Pulse Grid** — Reactive ambient floor grid on the desktop surface. A faint geometric grid overlays the desktop; as the cursor moves, nearby cells illuminate with a gold→amethyst radial glow using quadratic distance falloff — like walking through Stark's lab with a light-up floor. Canvas-based for zero layout thrash, redraws only on `pointermove` via single `requestAnimationFrame`. Pauses when tab is hidden. Desktop-only (skipped on coarse-pointer devices), respects `prefers-reduced-motion`.
  - New files: `js/pulse-grid.js`, `css/pulse-grid.css`

---

## [3.61.0] — 2026-04-04

### Added
- **Neural Link** — Luminous connection traces between desktop icons on hover. When a desktop icon is hovered, thin energy lines trace from it to its 2–3 nearest neighbors using a gold→amethyst gradient with a stroke-dashoffset drawing animation — like neural pathways firing in a cybernetic brain. Lines glow with dual drop-shadow halos and fade out smoothly on hover end. SVG overlay layer with `pointer-events: none`, MutationObserver for dynamic icons. Desktop-only, respects `prefers-reduced-motion`.
  - New files: `js/neural-link.js`, `css/neural-link.css`
  - Modified: `js/main.js` (registration), `index.html` (CSS link)

---

## [3.60.0] — 2026-04-04

### Added
- **Cipher Decode** — Holographic code materialization effect for code-viewer panels. When `.cv-panel` elements scroll into view, syntax-highlighted tokens scramble through hex/glyph noise before resolving left-to-right in a wavefront pattern. A gold scan line sweeps across the code block during decode, and resolved characters flash gold before settling to their syntax color. IntersectionObserver-triggered with MutationObserver for dynamically added panels. Desktop-only, respects `prefers-reduced-motion`.
  - New files: `js/cipher-decode.js`, `css/cipher-decode.css`
  - Wired into `main.js` init sequence (safe-mode guarded)

---

## [3.59.2] — 2026-04-04

### Security
- **desktop.js** — Hardened three innerHTML rendering paths (desktop icons, dock icons, properties window) that interpolated `item.color`, `item.label`, `item.icon`, and `item.id` without sanitization. Applied `Sanitize.hexColor()` for colors, `Sanitize.text()` for labels/IDs, and `Sanitize.url()` for SVG icon paths. Closes defense-in-depth gap — admin panel already persists custom desktop items to localStorage, and any future code connecting that data to desktop rendering would have been immediate stored XSS without this fix.

---

## [3.59.1] — 2026-04-03

### Changed
- **dom-helpers** — Added `hexAlpha()` utility for opacity-to-hex conversion, eliminating 5 duplicated `Math.floor(v * 255).toString(16).padStart(2, '0')` expressions across cursor-reactive effects. Added `transitionWindow()` with declarative preset configs (`materialize`, `dematerialize`, `minimize`) that parameterize the identical structure previously copy-pasted across three separate functions.
- **micro-interactions** — Refactored `materializeWindow()`, `dematerializeWindow()`, and `minimizeWindow()` to delegate to the shared `transitionWindow()` preset system. Same behavior, single source of truth.
- **cursor-reactive** — Replaced inline hex-alpha arithmetic with `hexAlpha()` calls in `applyAmbientGlow()`, `applyProximityGlow()`, and `applyWakeEffect()`.

---

## [3.59.0] — 2026-04-03

### Added
- **Spectral Echo** (`spectral-echo.js`, `spectral-echo.css`) — Window materialization burst effect. When any window opens and becomes visible, a gold/amethyst border outline expands outward from the window bounds and fades, like a holographic interface powering up. Features amethyst corner crosshairs and a vertical scan line that sweeps through the echo. One-shot CSS animation with auto-disposal. MutationObserver-driven, desktop-only, respects `prefers-reduced-motion`.

---

## [3.58.2] — 2026-04-02

### Added
- **Glitch Text test suite (glitch-text.test.js)** — 10 tests covering `wireTitle` idempotency, `wireAll` subtree scanning, `syncText` data-text synchronization, special character handling, and empty state edge cases. Targets the chromatic aberration feature added in v3.58.0.
- **Phantom Reticle test suite (phantom-reticle.test.js)** — 12 tests covering spring physics convergence, velocity dampening, overshoot bounds, lock-on scale calculations for various target sizes, DOM lifecycle (create/destroy/hidden state), and negative coordinate handling.

## [3.58.1] — 2026-04-02

### Fixed
- **Glitch Text hover residue (glitch-text.css)** — Chromatic aberration pseudo-elements snapped back to `opacity: 0.7` after the 0.4s animation completed on sustained hovers, leaving persistent amethyst/gold ghost layers over the title text. Added `forwards` fill mode so the animation's final keyframe (`opacity: 0`) holds, giving a clean glitch-and-vanish on every hover.

---

## [3.58.0] — 2026-04-02

### Added
- **Glitch Text effect (glitch-text.js, glitch-text.css)** — Controlled chromatic aberration on window title hover. Amethyst and gold pseudo-element ghost layers animate via `clip-path` inset slicing and translate offsets in stepped keyframes, creating a brief digital corruption that resolves cleanly. MutationObserver auto-wires new windows and keeps `data-text` attributes synced during breadcrumb navigation. Pure CSS animation with minimal JS wiring. Respects `prefers-reduced-motion`.

---

## [3.57.3] — 2026-04-01

### Changed
- **Canvas effect lifecycle factory (dom-helpers.js)** — New `bootstrapCanvasEffect()` and `setCanvasEffectEnabled()` utilities centralize the identical init/toggle/resize boilerplate shared across canvas-based visual effect modules. Eliminates duplicated canvas creation, DPR resize wiring, throttled loop setup, and localStorage toggle persistence.
- **Aurora refactored (aurora.js)** — Replaced ~20 lines of manual canvas lifecycle with `bootstrapCanvasEffect()` call, keeping only the unique noise/draw logic.
- **FX refactored (fx.js)** — Replaced ~20 lines of manual canvas lifecycle with `bootstrapCanvasEffect()` call, keeping only particle simulation and rendering logic.

---

## [3.57.2] — 2026-03-31

### Security
- **Sanitize input length cap (sanitize.js)** — All sanitization functions (`html()`, `attr()`, `url()`) now enforce a 500KB `MAX_INPUT_LENGTH` ceiling via `clampLength()`. Prevents algorithmic-complexity attacks (CWE-400, CWE-1333) where adversarial mega-strings could stall DOMPurify or regex processing.
- **Terminal prototype property leak (terminal.js)** — `cat` command now uses `Object.hasOwn()` instead of bracket-notation lookup on `fileSystem`, preventing access to inherited `Object.prototype` properties (`__proto__`, `constructor`, `toString`) via crafted filenames (CWE-1321).
- **Terminal history cap (terminal.js)** — Command history capped at 100 entries to prevent unbounded memory growth in long sessions (CWE-770).
- **URL length guard (dom-helpers.js)** — `openExternal()` rejects URLs exceeding 2048 characters before processing, blocking oversized payloads from reaching `window.open()` (CWE-400).

---

## [3.57.1] — 2026-03-31

### Changed
- **dom-helpers: centralize page-visibility subscriptions with `onVisibilityChange()`** — New pub/sub API piggybacks on the single shared `visibilitychange` listener instead of each module adding its own. Returns an unsubscribe function for proper cleanup in `destroy()` methods. Migrated Whispers, GalaxyBackground, and InteractionEngine to use it — eliminates 3 redundant DOM listeners.
- **dom-helpers: fix orphaned JSDoc for `animateCounter()`** — Relocated the dangling docblock from above `el()` to directly above `animateCounter()` where it belongs, and added proper `@param`/`@returns` annotations.

---

## [3.57.0] — 2026-03-31

### Added
- **Phantom Reticle — HUD targeting cursor overlay (phantom-reticle.js + phantom-reticle.css)** — A persistent geometric reticle that follows the cursor with spring-physics elastic easing, creating an Iron Man targeting HUD feel. The reticle is a dashed gold ring with crosshair lines and a center dot that smoothly tracks mouse movement via configurable stiffness/damping constants. When the cursor approaches interactive elements (dock items, desktop icons, buttons, titlebar controls, context menu items), the reticle "locks on" — snapping to the element center, scaling proportionally to target size, and shifting from gold to amethyst with increased opacity and faster rotation. Clicks trigger an expanding pulse ring that radiates outward from the reticle. DOM-light (5 elements), GPU-composited with `will-change` and `mix-blend-mode: screen`, spring simulation runs at display refresh rate but skips frames when tab is hidden. Hides on mouse leave, invisible on touch devices (`hover: none` media query). Respects `prefers-reduced-motion`.

## [3.55.2] — 2026-03-30

### Changed
- **Centralized throttled animation loop (dom-helpers.js)** — Extracted `createThrottledLoop()` factory into `dom-helpers.js`, replacing the identical 6-line loop boilerplate (cancelAnimationFrame → enabled check → page-visibility gate → frame-rate cap → work → recurse) duplicated across canvas modules. Accepts `isEnabled` callback and configurable `minInterval` for per-module frame rates. Also extracted `resizeCanvasDPR()` for the identical 4-line DPR-aware canvas resize pattern. Refactored `aurora.js` (~24fps) and `fx.js` (~30fps) to use both helpers, eliminating module-level `_lastFrame` state and reducing each module by ~10 lines while making the frame-skip logic a single source of truth.

## [3.55.1] — 2026-03-30

### Security
- **Wallpaper URL validation hardened (state.js)** — `setWallpaper()` now validates URLs through `Sanitize.url()` (allowlist-based) before persisting to localStorage, closing a stored CSS injection vector where dangerous URIs could be written to localStorage and survive across sessions. Gradient tokens validated against an explicit `VALID_GRADIENTS` allowlist instead of open-ended string matching. `data:image/` URIs restricted to safe MIME types only (png, jpeg, gif, webp) — blocks `svg+xml` which can contain `<script>`. Invalid stored wallpapers are now purged from localStorage on load instead of silently re-rejected every session. Added `_validateWallpaperUrl()` as a centralized validation gate used by both `setWallpaper()` and `init()`. Comprehensive test coverage: 10 new validation tests covering protocol blocking, MIME allowlisting, gradient token validation, control character stripping, and persistence rejection.

## [3.55.0] — 2026-03-29

### Added
- **Catalyst Pulse — ambient breathing energy field** — Lock screen hero gains a living atmosphere: a gold-core radial glow with amethyst outer halo breathes in dual-rhythm cycles (4s core, 6s halo). Geometric crosshair lines and corner brackets frame the central wheel. Mouse proximity to screen center intensifies the glow, creating a reveal-on-approach effect. DOM injected dynamically by JS module, CSS-animated with `will-change` GPU compositing. Respects `prefers-reduced-motion`.

---

## [3.54.0] — 2026-03-29

### Added
- **Sonar Pulse — holographic desktop click ripple** — Clicking on the desktop surface spawns a Stark Industries-style targeting ping: three concentric rings (alternating gold/amethyst from `--gold` and `--amethyst` tokens) expand outward with staggered timing, a crosshair flashes at the impact origin, and a JetBrains Mono HUD readout floats upward showing `x:NNN y:NNN · SECTOR CLEAR` with randomized tactical status tags. Rings use CSS `scale()` animation for GPU compositing. Click-debounced at 320ms to prevent visual spam. Desktop-only (skipped on `pointer: coarse`). Respects `prefers-reduced-motion`.

---

## [3.53.0] — 2026-03-28

### Added
- **Parallax scroll depth — cinematic hero layer separation** — Enhanced the parallax engine with wheel-driven vertical depth separation on the lock screen hero. Scrolling (mousewheel/trackpad) pulls the four depth layers apart at different rates: grid background drifts up (+40px), watermark shifts subtly (-25px), title block separates faster (-50px), identity block leads the pull (-70px). Scroll momentum decays naturally back to center via 0.97 per-frame decay factor. Added ambient sine-wave drift oscillation that keeps the scene alive even without user interaction. Desktop background wheel now also inherits the ambient drift. All values lerp-smoothed at 0.06 for cinematic silk. Respects `prefers-reduced-motion`.

---

## [3.52.1] — 2026-03-27

### Changed
- **Viewport reveal system — centralized scroll-triggered observer pattern** — Extracted the identical IntersectionObserver + MutationObserver + WeakSet scaffolding duplicated across `scroll-reveal.js` and `gauntlet.js` into a single `createRevealSystem()` factory in `dom-helpers.js`. Both modules now declare only their configuration (selector, class, threshold, optional callback) — zero boilerplate. Gauntlet's SVG signature-draw side-effect preserved via `onReveal` callback. Combined ~100 lines of duplicated wiring reduced to ~50 shared lines. API surface unchanged (`{ init, observe }`).

---

## [3.52.0] — 2026-03-27

### Added
- **System Whispers — ambient floating HUD data fragments** — Translucent monospace text snippets (cipher hashes, system diagnostics, neural-link telemetry) spawn at random desktop positions and drift upward, creating a "data-in-the-air" holographic lab atmosphere. Max 6 concurrent fragments, staggered spawn every 4s, gold/cyan color alternation matching the signature accent palette. New `js/whispers.js` module + `css/whispers.css`. Auto-pauses when tab hidden. Disabled in safe mode. Respects `prefers-reduced-motion`.

---

## [3.51.0] — 2026-03-26

### Added
- **Signature Accents — gold/amethyst HUD branding for active windows** — Gold corner brackets (8-segment background-gradient technique) materialize on active windows like targeting HUD overlays. A gold focus-flash briefly warms the border on window activation via `focus-flash` keyframe. The titlebar holo-line shifts to a breathing gold-amethyst `heartbeat-line` pulse on active windows. Active window titles gain a subtle gold text-shadow. New `css/signature-accents.css` stylesheet (pure CSS, zero JS). Suppressed on maximized windows. Respects `prefers-reduced-motion`.

---

## [3.50.0] — 2026-03-26

### Added
- **Unveiling Gauntlet — cinematic About window** — Redesigned the About Me window as a multi-stage scroll experience. Three full-height cinematic stages (Identity, Mission, Arsenal) reveal progressively with perspective-based depth transforms, staggered text animations, gold divider sweeps, and an SVG "auric signature" stroke-draw animation. Each stage acts as a deliberate reveal — scroll to unveil. New `gauntlet.js` IntersectionObserver module and `gauntlet.css` with CSS custom property integration.

---

## [3.49.1] — 2026-03-26

### Changed
- **Boolean persistence helpers (`loadBool`/`saveBool`)** — Extracted the duplicated `localStorage.getItem(k) === '1'` / `localStorage.setItem(k, v ? '1' : '0')` pattern from Aurora, FX, AudioFX, and Glyphs into two shared functions in `dom-helpers.js`. State module's `_loadBoolean`/`_setBoolean` now delegate to these helpers too. Centralizes the `'1'`/`'0'` convention in one place, adds `try/catch` on writes for quota-exceeded resilience.

---

## [3.49.0] — 2026-03-24

### Added
- **Achievement System (TROPHIES.exe)** — Gamified portfolio exploration with 10 unlockable trophies across 4 rarity tiers (common, rare, epic, legendary). Visitors earn achievements by exploring the OS: "System Online" (boot complete), "Explorer" (3 apps), "Cartographer" (7 apps), "Terminal Jockey" (use terminal), "Due Diligence" (resume + about + skills), "Night Owl" (visit midnight–5am), "Power User" (command palette), "Passion's Friend" (open Passion chat), "Speed Demon" (5 windows in 30s), and "Completionist" (all achievements). Features slide-in unlock popups with rarity-themed glow effects, a gold trophy SVG desktop icon, a dedicated viewer window with progress bar, and full localStorage persistence. Zero coupling — uses CustomEvent observer pattern via `passion:window-open`, `passion:command-palette`, and `passion:boot-complete` events. Respects `prefers-reduced-motion`. CSP-compliant (all DOM construction is programmatic, no innerHTML in viewer).

> *"Any sufficiently advanced technology is indistinguishable from magic."* — Arthur C. Clarke

---

## [3.48.0] — 2026-03-24

### Changed
- **Centralized page-visibility and reduced-motion detection** — Extracted `isPageHidden()` and `prefersReducedMotion()` into `dom-helpers.js`, eliminating 4 duplicate `visibilitychange` listeners (fx.js, aurora.js, skills.js, mahoraga-wheel-3d.js) and 5 duplicate `matchMedia` calls (icon-tilt.js, parallax.js, mahoraga-wheel-3d.js, galaxy-background.js, cursor-trail.js). Single source of truth for accessibility and performance guards across all animation modules.

---

## [3.47.0] — 2026-03-24

### Added
- **Purple Haze Reveal Curtain** — Cinematic lock-to-desktop transition inspired by Prince's Purple Rain staging. Two amethyst velvet panels cover the screen during boot, a golden seam draws across the divide, an atmospheric bloom radiates from center, then the panels part vertically to reveal the desktop. Subtle CSS noise texture simulates velvet material. Uses design system motion tokens (`--ease-decel`, `--ease-accel`). Respects `prefers-reduced-motion`. New module: `js/purple-haze.js` + `css/purple-haze.css`.

---

## [3.46.0] — 2026-03-23

### Added
- **Holographic Blueprint Reveal** — Project cards in the Applications grid now enter with a tech-blueprint animation sequence: gold corner crosshairs materialize, geometric edge-trace lines draw themselves (gold → amethyst gradient), a scan line sweeps vertically, and content resolves from blur to clarity with staggered delays. The overlay fades out after completion. Respects `prefers-reduced-motion`. Purely CSS-driven, zero JavaScript overhead.

---

## [3.45.3] — 2026-03-23

### Added
- **Test: Terminal** — 19-test suite for `terminal.js` covering command parsing (case normalization, arg preservation), command routing for all 7 built-in commands (`help`, `clear`, `whoami`, `ls`, `cat`, `sys`, `deploy`), file system boundary enforcement (path traversal blocked, case-sensitive keys, closed file set), and history navigation edge cases (empty history, LIFO traversal, oldest-entry clamping, down-to-empty reset, index reset on new push).
- **Test: Dock Magnify** — 16-test suite for `dock-magnify.js` covering Gaussian falloff math (identity at zero, decay at distance, symmetry, non-negativity), scale computation (MAX_SCALE at cursor, BASE_SCALE at distance, no overshoot), lift pixel values, glow opacity thresholds (peak 0.33, floor 0.08), box-shadow activation boundary (factor > 0.3), and z-index monotonic ordering by proximity.

### Changed
- **Test counts updated** — 409→444 tests, 21→23 suites across all references.
- **Version synced** — 3.45.2→3.45.3 across `package.json`, `version.js`, README badges, and CHANGELOG.

---

## [3.45.2] — 2026-03-23

### Added
- **Test: Icon Tilt** — 7-test suite for `icon-tilt.js` covering 3D tilt CSS property application on mousemove, reset on mouseleave, `prefers-reduced-motion` accessibility compliance (both static and dynamic toggle), graceful no-op when container is missing, `MutationObserver` auto-wiring for dynamically added icons, and bloom position math verification.
- **Test: Calculator** — 15-test suite for `calculator.js` covering basic arithmetic (add, subtract, multiply, divide), division-by-zero ERR lockout with Clear recovery, decimal input with double-dot prevention, sign toggle (±), percentage, backspace (single-digit→0 edge case), operation chaining without `=`, Clear full reset, and cleanup function validation.

### Changed
- **Test counts updated** — README badges and inline stats bumped from 387→409 tests, 19→21 suites across all references.
- **Version synced** — Unified version across `package.json`, `version.js`, README badges, and CHANGELOG to 3.45.2.

---

## [3.45.1] — 2026-03-23

### Added
- **Deep Dive: 3D Icon Tilt** — Portfolio-grade README section documenting the `icon-tilt.js` module: normalized coordinate math, CSS custom property architecture (`--tilt-x/y`, `--bloom-x/y`), `perspective(600px)` rationale, light bloom simulation via `::before` pseudo-element, `MutationObserver` auto-wiring, and `prefers-reduced-motion` accessibility. Includes file cross-reference table.

### Changed
- **Version synced** — Unified version across `package.json`, `version.js`, README badges, and CHANGELOG to 3.45.1.

---

## [3.45.0] — 2026-03-20

### Added
- **3D icon tilt with frosted glass** — New `icon-tilt.js` module adds mouse-tracked gyroscopic 3D perspective tilt (±18°) to all desktop icons. Icons tilt toward the cursor with an inner light bloom that shifts to simulate overhead lighting, creating a premium holographic feel. Uses CSS custom properties (`--tilt-x`, `--tilt-y`, `--bloom-x`, `--bloom-y`) for GPU-composited transforms. MutationObserver auto-wires dynamically added icons. Respects `prefers-reduced-motion`.
- **Desktop icon frosted glass upgrade** — Icon boxes now use real `backdrop-filter` glass material (`--glass-bg`, `--glass-blur-light`) instead of opaque backgrounds, integrating with the Alien Tech glass system. Hover state upgraded from basic `scale(1.1)` to perspective-aware transform with enhanced glow.

### Changed
- **Version synced** — Unified version across `package.json`, `version.js`, `index.html` title, README badge, and CHANGELOG to 3.45.0.

---

## [3.44.4] — 2026-03-20

### Security
- **Patched 5 npm dependency vulnerabilities** — Fixed 1 moderate (ajv ReDoS) and 4 high-severity CVEs: flatted unbounded recursion DoS + prototype pollution, minimatch ReDoS (3 vectors), rollup arbitrary file write via path traversal, undici HTTP smuggling + WebSocket memory DoS (6 issues). All resolved via dependency upgrades.
- **GitHub API rate-limit hardening** — Added `X-RateLimit-Remaining` / `X-RateLimit-Reset` header tracking to `github.js`. Prevents silent app degradation when the 60 req/hr unauthenticated cap is hit. Now detects 403 rate-limit responses explicitly and provides reset time in error messaging instead of a generic connection failure.

### Changed
- **Version synced** — Unified version across `package.json`, `version.js`, `index.html` title, README badge, and CHANGELOG to 3.44.4.

---

## [3.44.3] — 2026-03-17

### Changed
- **README updated with deployment instructions and version sync** — Added a full Deployment section documenting Vercel production workflow (CLI commands, `vercel.json` security header config, custom domain setup, local preview build). Corrected stale module count from 49 → 55 and stylesheet count from 25 → 26. Architecture tree expanded with 6 previously undocumented modules (`version.js`, `scroll-reveal.js`, `parallax.js`, `dock-magnify.js`, `ambient-system.js`, `weather.js`). Unified version references across README badges, `version.js`, and `package.json` to 3.44.3 — resolving a 3-file version drift (was 3.44.1 in version.js/README, 3.44.2 in package.json).

---

## [3.44.2] — 2026-03-16

### Added
- **Test coverage for ScrollReveal** — 9 tests covering IntersectionObserver wiring, `scroll-reveal--visible` class toggling, MutationObserver auto-detection of new windows, WeakSet deduplication preventing double-observation, manual `.observe()` API, and dynamic element pickup inside observed containers.
- **Test coverage for Notify (toast system)** — 17 tests covering toast creation with a11y attributes, all four type variants (success/error/warning/info) with correct icons and labels, auto-dismiss timing with fake timers, queue eviction at MAX_VISIBLE=4, close button idempotency, hover pause/resume with remaining-time arithmetic, and progress bar animation state toggling.

---

## [3.44.1] — 2026-03-15

### Security
- **Hardened video source URL validation in Lightbox** — Direct `<video>` elements now pass through `Sanitize.url()` before setting `src`, blocking `javascript:`, `data:`, `blob:`, and protocol-obfuscated URIs from admin-editable media entries. YouTube/Vimeo embeds already validated IDs via regex; this closes the gap for non-embed video sources. Added early null/type guard on `openVideoWindow()` input. Invalid URLs render a visible error instead of silently loading dangerous content.

---

## [3.44.0] — 2026-03-14

### Added
- **Extended scroll-triggered reveals to Services, Applications, and Media windows** — Two new reveal variants: `fade-right` (mirror of fade-left) and `clip-up` (clip-path wipe reveal for a cinematic lab-notes effect). Services window now reveals hero (scale), section headers (fade-left/fade-right), service cards (staggered fade-up with gold accent line sweep), retainer cards (clip-up wipe), and CTA block. Applications window reveals header (fade-left), category headers (fade-right), and app items (staggered cascade). Media Vault header gets fade-left reveal. Gold accent line animation on service cards mirrors the amethyst accent on project cards. All new variants respect `prefers-reduced-motion`.

---

## [3.43.0] — 2026-03-14

### Added
- **Scroll-triggered reveal system for window content** — New `ScrollReveal` module (`js/scroll-reveal.js`) uses IntersectionObserver to animate elements as they scroll into view inside `.window-content` containers. A MutationObserver auto-wires new windows without manual hookup, and a nested child watcher catches dynamically rendered content (e.g. filtered project cards). Supports three reveal variants (`fade-up`, `fade-left`, `scale`) with staggered delay cascades via `data-reveal-delay` attributes. Applied to project cards (Applications window), About sections, and Contact window elements. Includes amethyst accent-line animation on project card reveal and full `prefers-reduced-motion` support. CSS uses `cubic-bezier(0.22, 1, 0.36, 1)` — a deceleration curve that gives reveals a cinematic ease-out feel.

---

## [3.42.1] — 2026-03-14

### Changed
- **README rewritten to portfolio-grade standard** — Hero section redesigned with cinematic copy aligned to dark luxury tech aesthetic. Badges use dark label backgrounds for visual cohesion. Stale module/test counts synced across all sections (49 modules, 25 stylesheets, 361 tests / 17 suites). "Why No Frameworks?" sharpened from three paragraphs to three decisive lines. Version references unified to 3.42.1 across README, package.json, and version.js (was drifted at v3.16.6 in footer). Architecture tree header counts corrected.

---

## [3.42.0] — 2026-03-13

### Changed
- **Context menu refactored to data-driven architecture** — extracted shared `_renderContextMenu(x, y, items)` method that both `showContextMenu` and `showIconContextMenu` now delegate to. Replaced fragile innerHTML + `document.getElementById` wiring with scoped element creation and direct event listeners. Menu items are now descriptor arrays (`{ icon, label, action }`), making menus trivially extensible — adding an item is one object instead of ~12 lines. Labels now pass through `Sanitize.text()`, closing a potential XSS vector from `item.label` interpolation.
### Added
- **Cursor-reactive amethyst aurora on lock screen** — A dual-layer radial gradient (amethyst + gold) follows the mouse cursor across the lock screen via CSS custom properties (`--aurora-x`, `--aurora-y`). Fades in on mouse entry, trails naturally via CSS transition, fades out on mouse leave. Zero layout thrash — GPU-composited gradient repositioning only.
- **INITIALIZE button amethyst hover state** — Button hover shifts from cyan to amethyst/gold accent palette matching the aurora, with a dedicated `:active` press state for tactile feedback.
- **Aurora lifecycle management** — Aurora listeners attach on init and lock, detach on login to desktop, preventing orphaned listeners across lock/unlock cycles.

## [3.41.2] — 2026-03-13

### Security
- **Prototype pollution protection expanded to all localStorage reads** — `loadJSON()` in dom-helpers.js now strips `__proto__`/`constructor`/`prototype` keys from every parsed value. Previously only `data-loader.js` was protected; 8+ callers (sticky notes, GitHub cache, folder icons, etc.) were exposed.
- **URL scheme enforcement on media/link attributes** — replaced `Sanitize.attr()` with `Sanitize.url()` for project demo/repo hrefs, video poster sources, and GitHub avatar URLs. `attr()` blocked `javascript:` but allowed `blob:`, `ftp:`, and other exploitable schemes; `url()` allowlists only `http(s)` and relative paths.
- **Lightbox source validation** — media `img.src` now runs through `Sanitize.url()` before assignment. Previously set raw URLs from localStorage-sourced data (admin-editable), enabling potential `javascript:`/`data:` URI injection.
- **Iframe sandbox hardening** — YouTube and Vimeo embeds now use `sandbox="allow-scripts allow-same-origin allow-presentation"`, blocking top-navigation hijacking, form submission, and popup creation from embedded content.
- **System monitor defense-in-depth** — Navigator API values (`platform`, `language`, `effectiveType`) now HTML-escaped before innerHTML interpolation. Prevents XSS if browser extensions or polyfills mutate navigator properties. Network downlink coerced to `Number()` to prevent string injection.

## [3.41.1] — 2026-03-11

### Security
- **Service Worker cache poisoning hardened** — validate response type before caching (blocks opaque/redirect responses), network-first for navigation requests, cache size cap (150 entries) with LRU eviction, reject non-GET methods. Cache version bumped to `portfolio-os-v4`.
- **Prototype pollution protection** — new `Sanitize.stripDangerousKeys()` strips `__proto__`, `constructor`, `prototype` keys from parsed JSON. Applied to admin backup import and data-loader localStorage reads.
- **Backup import file size limit** — reject files > 5 MB before `FileReader.readAsText()` to prevent tab freeze from crafted payloads.
- **Desktop item icon/URL sanitization on import** — SVG icon fields now pass through DOMPurify, URL fields validated via `Sanitize.url()` to block stored XSS via crafted backup JSON.

---

## [3.41.0] — 2026-03-11

### Added
- **Dock magnetic magnification** — macOS-style proximity-based scaling on the dock. Icons swell smoothly as the cursor approaches using Gaussian distance falloff, with neighboring icons scaling proportionally. Includes dynamic cyan glow intensification, spring-eased transitions, and smooth deceleration on mouse leave. New `dock-magnify.js` module (94 lines) with MutationObserver to track dynamically added taskbar buttons.

---

## [3.40.0] — 2026-03-11

### Added
- **Ambient system telemetry** — Top bar CPU and RAM metrics now fluctuate organically using weighted random walks instead of showing static "98% CPU". CPU indicator changes color (cyan → amber → red) based on simulated load. RAM display shows gradual memory allocation growth over session time.
- **Session uptime counter** — Live uptime timer in the top bar tracks how long the visitor has been on the site, displayed in amethyst purple with monospace font.
- **Visit tracking with welcome toasts** — First-time visitors see "Welcome to Passion OS. Press Cmd+K to explore." Returning visitors see their session count. Persisted via localStorage.
- **Ambient tips system** — Periodic contextual tips surface as toast notifications (keyboard shortcuts, terminal, context menu, etc.) with randomized 2–4 minute intervals. Pauses when tab is hidden to avoid notification spam.

---

## [3.39.0] — 2026-03-10

### Changed
- **Extract galaxy init into shared module** — Duplicated galaxy background config and initialization logic (main.js + login.js) consolidated into `js/galaxy-init.js` with a single `ensureGalaxy()` helper. Idempotent — safe to call from multiple entry points without double-init.
- **Remove dead typeof guards** — `initDesktop()` wrapped every module call in `typeof X !== 'undefined'` checks despite all modules being statically imported. Removed 6 unnecessary guards.
- **Remove empty updateFxIcon()** — Dead method that was a no-op stub. Cleaned up its call site in `login()`.
- **Fix version drift** — `index.html` title and top bar referenced v3.38.1 while `version.js` was at 3.38.2. Synced all version references.

---

## [3.38.2] — 2026-03-10

### Fixed
- **Modal alert keydown listener leak** — `alert()` registered a `keydown` handler on `document` but only removed it when the user dismissed via keyboard (Enter/Escape). Dismissing via OK button click or overlay click left the listener attached, stacking one orphan per alert cycle. Wrapped dismiss in a cleanup function that removes the listener regardless of dismissal path.
- **Login Enter key listener leak** — `initLoginScreen()` attached an anonymous `keydown` listener on `document` that was never removed after login. The handler persisted for the entire session, firing on every keypress even when the desktop was active. Stored the handler reference and now remove it in `login()`, re-attach it in `lock()`.

---

## [3.38.1] — 2026-03-10

### Fixed
- **Idle timer listener leak** — `startIdleTimer()` added 5 document-level event listeners on every call but never removed them. Each lock/unlock cycle stacked 5 more listeners, causing memory growth and redundant `resetTimer` invocations on every user interaction. Extracted `stopIdleTimer()` to deterministically remove listeners and clear the timeout. `lock()` now calls `stopIdleTimer()` instead of only clearing the timeout, and `startIdleTimer()` defensively tears down prior listeners before attaching new ones.

---

## [3.38.0] — 2026-03-09

### Changed
- **Centralized version constant** — Created `js/version.js` as the single source of truth for the application version string. `login.js` now imports `VERSION` instead of hardcoding `v3.35.0` in three places (skip subtitle, typewriter text, boot sequence message). Eliminates the recurring version-drift bug that was previously fixed in v3.7.1, v3.10.0, and v3.33.2.
- **Version sync** — Updated all 6 version references (package.json, version.js, index.html title, index.html top bar, login.js ×3) to `3.38.0`. Previously, package.json was at `3.37.2` while login.js showed `v3.35.0` and index.html showed `v3.37.0`.

---

## [3.37.2] — 2026-03-09

### Security
- **API response sanitization** — PassionLive now sanitizes all string fields from the external API at the trust boundary before storing in state or localStorage. Enum fields (status, state) are validated against strict allowlists. Numeric fields are coerced and checked with `Number.isFinite()`. Prevents stored XSS via compromised API or localStorage cache poisoning.
- **Inline onerror handler removal** — Eliminated all inline `onerror="..."` handlers from passion-ambient.js, passion-chat.js, welcome.js, and tour.js. Replaced with programmatic `addEventListener('error', ...)` calls. Inline handlers bypass Content-Security-Policy and are XSS vectors.
- **DOM construction hardening** — passion-ambient.js showToast() rewritten from innerHTML template interpolation to safe DOM construction (createElement/textContent/append). New `PassionLive.createPortraitImg()` helper creates img elements with programmatic error handling.

---

## [3.37.1] — 2026-03-08

### Security
- **CSP hardening** — Pinned `script-src` CDN allowlist from broad `https://cdn.jsdelivr.net` to exact versioned paths (`dompurify@3.0.8/`, `three@0.170.0/`). Removed stale `fonts.gstatic.com` from `img-src` (it serves fonts, not images). Added `font-src 'self'` for local font fallback. Added `connect-src` entries for Google Fonts stylesheet/woff2 fetches. Added `media-src 'self'`, `worker-src 'self'`, `manifest-src 'self'` to close implicit default-src fallback gaps.
- **Permissions-Policy expansion** — Locked down 12 browser APIs (accelerometer, autoplay, encrypted-media, gyroscope, magnetometer, midi, payment, picture-in-picture, usb, interest-cohort) in addition to camera/microphone/geolocation. Removed geolocation self-grant (not used).
- **New headers** — Added `X-DNS-Prefetch-Control: off` (prevents DNS leak of link targets) and `X-Download-Options: noopen` (IE download execution guard). Total: 12 security headers.
- **Service worker cache control** — Dedicated `/sw.js` header block with `no-cache, no-store, must-revalidate` to prevent stale worker caching and `Service-Worker-Allowed: /` scope.
- **Data endpoint hardening** — Added `/data/(.*)` header block with short-lived cache (300s + stale-while-revalidate) and `nosniff` to prevent MIME-type sniffing on JSON payloads.

---

## [3.37.0] — 2026-03-08

### Changed
- **Interaction motion tokens** — Replaced ~20 hardcoded `cubic-bezier()` and duration strings across `micro-interactions.js` and `cursor-reactive.js` with CSS design system variables (`--transition-fast`, `--ease-spring`, `--ease-press`, `--ease-snap`, etc.). All interaction animations now derive from the centralized motion token system in `variables.css`, making timing/easing adjustments a single-source change.
- **Engine loop optimization** — Cached the bound `loop()` function in `InteractionEngine` instead of allocating a new `Function.prototype.bind()` on every animation frame. Eliminates per-frame GC pressure in the hot path.
- **Named magic numbers** — Extracted frame budget (9ms), throttle interval (33ms), and approximate frame duration (16.67ms) into named constants on `InteractionEngine` for self-documenting code.

---

## [3.36.0] — 2026-03-08

### Added
- **Catalyst Aura** — Mouse-reactive radial glow on Purple Reign project chapters. A soft amethyst-to-gold gradient follows the cursor, with a hexagonal clip-path "crystal lens" that scales and rotates on hover. Gold geometric border traces itself around the chapter edges. Chapter titles gain an animated underline sweep (amethyst → gold gradient). All effects use CSS custom properties (`--mx`, `--my`) set via a lightweight `mousemove` handler — zero repaints from JS, the compositor handles it. Respects `prefers-reduced-motion`.

---

## [3.35.0] — 2026-03-08

### Added
- **Ascending Core reveal** — A CSS 3D obsidian crystal hovers in the Purple Reign hero section, rotating with an internal amethyst glow. As the user scrolls past the hero, the crystal fractures apart — each of 8 triangular faces flies outward with blur and fade — revealing the project chapters beneath. Scrolling back reassembles the core. Built with pure CSS `transform-style: preserve-3d` and scroll-driven class toggling, no external 3D libraries. Respects `prefers-reduced-motion`.

---

## [3.34.0] — 2026-03-08

### Changed
- **Motion system tokenization** — Replaced 30+ hardcoded `transition: ... ease` declarations across `styles.css`, `windows.css`, and `passion.css` with design system tokens (`--transition-fast`, `--transition-medium`, `--duration-*`, `--ease-decel/accel`). Every transition now uses intentional easing curves instead of the CSS generic `ease` default.
- **Transition shorthands upgraded** — `--transition-fast/medium/slow` now use `--ease-decel` (smooth arrival) instead of generic `ease`. Added `--transition-exit-fast` and `--transition-exit-medium` using `--ease-accel` for elements leaving view.
- **Window lifecycle motion** — `.minimized` and `.closing` states now use `--ease-accel` exit curves with duration tokens, matching the motion design language established in `glass.css` and `interactions.css`.

---

## [3.33.2] — 2026-03-06

### Fixed
- **Version string drift** — Synced all version displays to `v3.33.2`. The `<title>` tag showed `v3.32.0`, the desktop top bar showed `v3.31.0`, and the boot/cinematic subtitle showed `v3.3.0` — all out of sync with `package.json`. Now all 5 version references (title, top bar, typewriter subtitle, skip subtitle, boot message) pull the same version.

---

## [3.33.1] — 2026-03-06

### Added
- **WindowManager test suite** — 65 new tests across 12 describe blocks covering the full window lifecycle: creation (DOM structure, ARIA attributes, viewport clamping, cascade positioning, saved state restoration), duplicate prevention, focus management (z-index, active class, minimized guard), minimize/restore cycle with localStorage persistence, maximize toggle, close with animation timing (onClose callback, error handling, RAF leak prevention, screen reader announcements, navigation stack cleanup), navigation stack (push/pop/breadcrumb rendering/back button visibility), ESC key priority (modal > lightbox > tour > window), taskbar integration (active/minimized states, click-to-restore/minimize/focus), titlebar structure (control buttons, ARIA labels, icon rendering), and content rendering (string HTML vs HTMLElement).
- Documented a real ordering bug in `focus()`: `updateTaskbar()` is called before `activeWindow` is set, causing stale taskbar state until the next sync. Test captures and verifies the exact behavior.

### Changed
- Test count: 293 -> 358 across 17 suites (was 16).

---

## [3.33.0] — 2026-03-06

### Added
- **Black Mirror signal acquisition intro** — New "Act 0" cinematic phase before the existing 3-act lock screen sequence. Features three staggered horizontal interference bars sweeping with gold/amethyst gradients, radial edge glow pulses (gold from bottom, amethyst from top), and a stepped-keyframe "SIGNAL ACQUIRED" data flash. All animations use the existing design system variables (`--gold`, `--amethyst`, `--ease-decel`) and respect the dark luxury tech aesthetic.
- 6 new HTML elements in lock screen intro stage for the signal acquisition layer.
- 95 lines of CSS with 4 new `@keyframes` animations (`bm-sweep`, `bm-glow-pulse`, `bm-flash`) and scoped act-0 state selectors.

### Changed
- Cinematic intro timing shifted: Act 0 at 50ms, Act 1 at 950ms, Act 2 at 1450ms, Act 3 at 2900ms (was 50/550/2000/3000ms). Total sequence ~3.9s (was ~3s).
- Skip cinematic and lock/re-lock flows now reset `act-0` class alongside existing act classes.

---

## [3.32.2] — 2026-03-06

### Fixed
- **Element visibility checks** — `offsetParent !== null` always returned false for `position: fixed` elements (like the lock screen), making the first condition in parallax.js dead code. Added `isElementVisible()` to dom-helpers.js that correctly handles fixed/sticky positioning by falling back to `getComputedStyle` only when `offsetParent` is null.
- **Parallax lock screen detection** — Replaced broken `offsetParent` + `.hidden` class OR-chain in parallax.js with centralized `isElementVisible()` utility.

### Added
- `isElementVisible(el)` — Correct visibility detection that handles `display: none`, `visibility: hidden`, and `position: fixed/sticky` elements where `offsetParent` lies.
- `isInViewport(el)` — Synchronous viewport intersection check via `getBoundingClientRect` for frame-accurate culling.
- **12 new tests** for visibility utilities covering null inputs, display:none, visibility:hidden, position:fixed, position:sticky, and viewport boundary conditions (281 → 293 total).

---

## [3.32.1] — 2026-03-05

### Added
- **44 new edge-case tests** across 3 new test suites (237 → 281 total, 16 suites). Key coverage areas:
  - `GitHub.calculateLanguageStats` — division-by-zero when no repos have languages, single-language 100% dominance, top-3 cap enforcement, percentage rounding verification
  - `GitHub.buildCommitTimeline` — PushEvent filtering, missing `payload.commits` fallback-to-1, events outside day window ignored, date format validation
  - `animateCounter` edge cases — target=0 boundary (increment=0 but `0 >= 0` saves it), negative target convergence, `MAX_SAFE_INTEGER` overflow check
  - `saveJSON` quota handling — QuotaExceededError returns false (required direct localStorage mock — jsdom's `setItem` is an own property, not on `Storage.prototype`), circular reference serialization failure
  - `openExternal` protocol hardening — all-caps `JAVASCRIPT:`, null byte stripping, whitespace-only URLs, newline-in-protocol obfuscation, port number passthrough
  - `el()` DOM factory — tag creation, className/textContent assignment, falsy-value handling
  - State boolean toggle registry — auto-generated `set*/toggle*` method existence, localStorage persistence as "1"/"0", truthy/falsy coercion, event emission for toggles with/without event names
  - `State._loadBoolean` — "1"→true, "0"→false, missing key preservation, non-"1" string→false
  - `State.setCursorTrailType` — allowlist validation, XSS injection rejection, event emission

---

## [3.32.0] — 2026-03-05

### Added
- **Opulent Interface micro-interactions** — Elevated `.reign-link` and `.portfolio-link` CTA buttons with luxury hover treatment: embossed inset shadows for tactile depth, animated gold border trace via `clip-path` transition on `.reign-link::before`, letter-spacing breathe effect (1.2px → 2.5px) using a refined `cubic-bezier(0.645, 0.045, 0.355, 1)` timing curve, and coordinated text-shadow/box-shadow glow on hover. Active state adds a pressed-in feel with deeper inset shadows and subtle downward translate. All effects respect `prefers-reduced-motion`.

---

## [3.31.1] — 2026-03-05

### Security
- **Fetch timeout hardening** — Added `fetchWithTimeout` utility (AbortController-based, 8s default) to `dom-helpers.js`. Applied to GitHub API (3 parallel requests), Weather API, and DataLoader fetches. Prevents indefinitely frozen interfaces when external APIs are slow or unreachable.
- **CSP tightening** — Removed stale `https://*.trycloudflare.com` wildcard from `connect-src` directive in `vercel.json`. This wildcard allowed any trycloudflare subdomain as a valid connect target — a potential data exfiltration vector. Only `passion-api.jamesdare.com` is now permitted.
- **Consistent sanitization** — Replaced raw `innerHTML` in GitHub error render path with `Sanitize.setHTML()` for defense-in-depth consistency.

---

## [3.31.0] — 2026-03-04

### Fixed
- **YouTube showcase embed** — Removed overly restrictive `sandbox` attribute from YouTube iframes that caused "refused to connect" errors. YouTube-nocookie.com embeds work correctly now.
- **Resume PDF viewer** — Removed `sandbox` attribute from resume iframe that prevented PDF from loading properly, causing the site to reload instead.
- **Settings gear SVG** — Fixed broken diagonal tooth geometry (asymmetric paths and incorrect rotation transforms). All 8 teeth now render symmetrically.
- **Version sync** — Fixed stale v3.10.0 in HTML title and top bar (was out of sync with package.json).

### Added
- **Passion.AI custom SVG icon** — Replaced emoji 🤖 desktop icon with a purpose-built SVG featuring heart emblem, hexagonal frame, circuit traces, and orbit rings matching the cyberpunk theme.
- **Passion Chat "My Site" link** — Added a styled link to passion.jamesdare.com in the Passion Chat window so visitors can explore Passion's own site.
- **Mood display in status indicator** — The bottom-right status pill now shows Passion's current mood alongside her state (e.g., "Passion is crunching code · focused").

---

## [3.30.0] — 2026-02-27

### Changed
- **Data-driven DOM generation** — Extracted `openAbout()` skill badges (12 items), `openResume()` stat cards (4 items) and skill bars (4 items) from copy-pasted HTML blocks into declarative data arrays with `.map()` loops. Adding or removing entries is now a one-line table change.
- **CSS custom property badges** — Replaced 12 inline-style skill badge divs in About with a single `.about-skill-badge` class using `--badge-color` custom property and `color-mix()` for dynamic background/border tinting.
- **Application showcase semantic CSS** — Replaced inline `style.cssText` category headers with `.app-category-header` class using `--cat-color` custom property. Replaced inline badge/button styles with `.app-status-badge--live`, `.app-status-badge--source`, and `.app-launch-btn--live` classes.
- **About window structure** — Extracted inline styles into semantic CSS classes (`.about-identity`, `.about-bio`, `.about-skills-grid`, `.about-skill-badge`, `.about-label`, `.text-cyan`).

---

## [3.29.0] — 2026-02-24

### Added
- **Glimmer sweep hover effect** — Diagonal gold-to-amethyst light sweep triggered on hover for portfolio cards, project cards, portfolio links, and dock icons. Uses a `::after` pseudo-element with `skewX(-15deg)` diagonal gradient, GPU-composited `translateX` animation, and `ease-decel` fade-out on mouse-leave. Expanded project cards suppress the sweep to avoid visual conflict with lab notes. Reduced-motion users get a static soft overlay instead of animation.

---

## [3.28.2] — 2026-02-24

### Security
- **YouTube privacy-enhanced embeds** — Switched all YouTube iframes from `youtube.com` to `youtube-nocookie.com` to eliminate third-party cookie tracking and Chrome deprecation warnings.
- **CSP frame-src hardened** — Updated Content-Security-Policy to only allow `youtube-nocookie.com` (blocking regular `youtube.com` embeds), added `img.youtube.com` to `img-src` for thumbnail loading.
- **Resume PDF iframe sandboxed** — Added `sandbox="allow-scripts allow-same-origin"` to the resume PDF viewer iframe, preventing unrestricted top-navigation and popup capabilities.
- **Referrer policy on all iframes** — Added `referrerpolicy="no-referrer"` to YouTube, Vimeo, and PDF iframes to prevent origin leakage to embedded providers.
- **Admin YouTube regex hardened** — Replaced permissive `[^"&?/ ]{11}` character class with strict `[a-zA-Z0-9_-]{11}` to match lightbox's validated pattern, blocking special characters in video IDs.
- **Lazy loading on iframes** — Added `loading="lazy"` to defer iframe connections until visible, reducing unnecessary network exposure on page load.

### Added
- **6 new security tests** — Privacy-enhanced embed URL validation, admin regex hardening tests, and nocookie domain enforcement assertions.

---

## [3.28.1] — 2026-02-24

### Added
- **Research doc: The Two-Week Boomerang** (`docs/research-cursor-poach-boomerang.md`) — Competitive intelligence analysis documenting how Cursor (Anysphere) poached Claude Code's lead engineer Boris Cherny and product manager Cat Wu, only for Anthropic to hire both back within fourteen days. Covers the "wrapper vs. platform" tension in AI tooling, the "80% of Anthropic's code is written by Claude" datapoint, and what the boomerang reveals about Claude Code's strategic weight. Includes sourced timeline table, market context, and implications for anyone building on top of model providers.
- **README docs table** — Added entries for the Bloomberg Terminal analogy and the Cursor poach boomerang research documents.

---

## [3.28.0] — 2026-02-23

### Changed
- **Data-driven init architecture** (`js/main.js`) — Refactored the 260-line monolithic `init()` function into a declarative, table-driven architecture. Visual module initialization (Aurora, Glyphs, AudioFX) now loops over a `VISUAL_MODULES` registry instead of 3 copy-pasted init/setEnabled/addEventListener blocks. Keyboard shortcuts use a `SHORTCUT_MAP` lookup table replacing 4 chained `if` statements. Control panel toggle wiring uses a `CONTROL_TOGGLES` config array that drives both DOM generation and event binding, eliminating 6 repeated `getElementById` calls. Extracted `recoverStyles()`, `initShortcuts()`, and `initControlPanel()` as focused single-responsibility functions. Adding a new visual module, shortcut, or settings toggle is now a one-line table entry — zero structural code changes required.

---

## [3.27.0] — 2026-02-23

### Added
- **Parallax depth engine** (`js/parallax.js`) — New cinematic depth system with two interaction modes. Lock screen responds to mouse position across 4 depth layers (grid background, watermark wheel, title block, identity block) with independent parallax factors. Desktop mode shifts the background wheel based on scroll position within any open window, using MutationObserver to auto-attach to dynamically-created windows. Engine uses rAF with lerp smoothing (factor 0.08) for silky 60fps interpolation, `will-change: translate` GPU hints on all parallax elements, and fully respects `prefers-reduced-motion`. Includes cleanup/destroy method.

---

## [3.26.0] — 2026-02-23

### Changed
- **Motion easing design tokens** — Extracted 6 semantic easing function tokens (`--ease-spring`, `--ease-decel`, `--ease-accel`, `--ease-snap`, `--ease-elastic`, `--ease-press`) and 5 duration tokens (`--duration-instant` through `--duration-dramatic`) into `variables.css`. Replaced 14 hardcoded `cubic-bezier()` values across 8 CSS files (`styles.css`, `interactions.css`, `glass.css`, `passion.css`, `welcome.css`, `command-palette.css`, `shortcuts-overlay.css`, `variables.css`) with token references. Existing `--transition-*` shorthands now compose from the new tokens for backward compatibility. Enables site-wide motion tuning from a single location.

---

## [3.25.2] — 2026-02-23

### Fixed
- **Window z-index stacking overflow** — Windows no longer breach reserved UI tiers (top bar, dock, modals) during prolonged use. Added ceiling-bounded z-index management (`WINDOW_Z_CEILING = 899`) with automatic normalization that compacts all window z-indices back to base range while preserving relative stacking order. Raised top bar and dock to `z-index: 900` so they always render above windows. Added 2 tests for ceiling enforcement and order-preserving normalization.

---

## [3.25.1] — 2026-02-22

### Added
- **Research: Bloomberg Terminal analogy** — New analysis document (`docs/research-bloomberg-terminal-analogy.md`) framing Claude Code, Cursor, and Windsurf as the Bloomberg Terminals of software engineering. Maps the finance paradigm shift (information access → speed of interpretation) onto the developer tooling shift (knowing the codebase → knowing what to build). Cross-references the existing Anthropic marketing case study. Updated docs index with new Research & Analysis section.

---

## [3.25.0] — 2026-02-22

### Added
- **Lab Notes: click-to-reveal project diagnostics** — Each project card in the Applications window now has a hidden "Lab Notes" panel. Click any card to expand a diagnostic overlay showing project status (live/archived indicator), tech stack count, and classification tags. Features a gold scan-line animation on reveal, gold accent border draw, and accordion behavior (one panel open at a time). Inspired by Stark's lab blueprint aesthetic — makes browsing projects feel like inspecting classified tech specs.

---

## [3.24.0] — 2026-02-22

### Changed
- **Glass material token alignment** — Corrected `--glass-bg`, `--glass-bg-dense`, `--glass-bg-light`, and `--glass-blur` tokens in `variables.css` to match the actual rendered values in `glass.css`, closing a drift where the tokens and implementations had diverged
- **Glass classes use token references** — `.glass`, `.glass-dense`, `.glass-light` now reference `var(--glass-*)` tokens instead of hardcoded rgba/blur values, making the entire glass system configurable from one file
- **Added `--glass-blur-dense` token** — New intermediate blur tier for `.glass-dense` panels, previously only available as a hardcoded value
- **HUD accent token system** — Introduced `--hud-cyan-50/40/30/15/12` and `--hud-purple-15` opacity-variant tokens for the 20+ hardcoded `rgba(0, 240, 255, ...)` values used across HUD brackets, markers, orbit rings, scan rings, and mini bars
- **HUD bracket tokenization** — All `.hud-brackets`, `.hud-bracket-tr`, `.hud-bracket-bl`, `.hud-marker`, `.hud-scan-ring`, `.hud-orbit-ring`, `.hud-mini-bar`, and `.hud-readout` classes now reference centralized tokens instead of raw rgba values
- **Font token consistency** — `.hud-readout` font-family now references `var(--font-mono)` instead of a hardcoded font stack

**Files Modified**: `css/variables.css`, `css/glass.css`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.23.0] — 2026-02-22

### Changed
- **Design token elevation** — Centralized gold (`--gold`, `--gold-light`, `--gold-dim`) and amethyst (`--amethyst`, `--amethyst-dim`) accent colors into `variables.css` design tokens, replacing 8 hardcoded hex values across `portfolio.css`
- **Gold glow system** — Added `--glow-gold-sm/md` and `--glow-amethyst-sm/md` to the shared glow token set for consistent luxury accent effects
- **Holographic border refinement** — Introduced warm gold stop into the `conic-gradient` rotation on `.holo-border`, `.holo-border-bright`, and `.holo-line-bottom`, shifting the signature visual from pure cyberpunk to luxury tech
- **Portfolio card hover** — Cards now reveal gold-tinted borders and title text on hover, with a subtle gold text-shadow glow, matching the Purple Reign gilded typography system
- **Token consistency** — Reign hero glitch layers, caret color, live link accents, and gilded shimmer gradient all reference centralized tokens instead of raw hex values

**Files Modified**: `css/variables.css`, `css/glass.css`, `css/portfolio.css`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.22.1] — 2026-02-21

### Added
- **Research doc: Anthropic Claude Code Marketing Ops** — Case study documenting how Anthropic's growth marketing team (Austin Lau, single non-technical operator) built four production systems with Claude Code: Google Ads copy generator with sub-agent architecture, Figma batch creative plugin (10× output), Meta Ads MCP server, and self-improving A/B test memory system. Includes metrics, architecture patterns, and relevance to Passion Agent's own automation design

**Files Modified**: `docs/anthropic-claude-code-marketing-ops.md` (new), `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.22.0] — 2026-02-20

### Added
- **CodeViewer component** — Zero-dependency syntax-highlighted code panel with regex-based JS tokenizer, copy-to-clipboard with gold visual feedback, and scroll-triggered reveal animation. Uses a curated dark-luxury palette (purple keywords, gold strings, cyan function names) matching the Purple Reign aesthetic
- **Code snippets in Purple Reign showcase** — Each of the 5 featured projects now displays a representative code snippet within the cinematic scroll chapters, giving technical visitors an immediate feel for the codebase

**Files Modified**: `js/code-viewer.js` (new), `css/code-viewer.css` (new), `js/desktop.js`, `index.html`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.21.1] — 2026-02-20

### Fixed
- **Shell command crashes** — `photos` and `videos` terminal commands called non-existent `Desktop.openPhotos()` and crashed on `openVideos()` accessing `.icon` on undefined `DESKTOP_ITEMS` entry. Both now route to `openMediaVault()` correctly
- **Toast hover timer desync** — Hovering a notification then mousing away used a hardcoded `duration / 2` timeout instead of tracking actual remaining time, allowing toasts to be kept alive indefinitely by repeated hovering and desyncing the progress bar from the dismiss timer
- **Loader progress interval leak** — `PixelLoader.simulateProgress()` stored its `setInterval` in a local variable that `destroy()` couldn't reach. Early destroy left an orphaned timer calling methods on removed DOM elements
- **Alert modal keyboard accessibility** — Alert modals had no keyboard handler (unlike prompt modals), trapping keyboard-only users. Added Enter/Escape dismiss with auto-focus on the OK button

**Files Modified**: `js/desktop.js`, `js/notifications.js`, `js/loader.js`, `js/modal.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.21.0] — 2026-02-19

### Added
- **Amethyst Code hero reveal** — Full-screen cinematic intro for the Purple Reign portfolio showcase. A metallic purple glitch effect (CSS `clip-path` + chromatic split pseudo-elements in gold and purple) fractures on scroll entry, then resolves to reveal the "PURPLE REIGN" title with a breathing glow. Tagline types in with a blinking caret. Scroll hint fades in after the sequence completes
- **GPU-friendly glitch animation** — Uses `clip-path: inset()` with `steps(1)` timing for hard-cut glitch frames, keeping all animations compositor-friendly (transforms, opacity, clip-path)
- **Three-state reveal machine** — Hero transitions through idle → entered (glitch plays) → resolved (breathing glow), managed via IntersectionObserver + class toggling

**Files Modified**: `css/portfolio.css`, `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.20.0] — 2026-02-19

### Added
- **Forcefield reveal on portfolio chapters** — Chapters start blurred with a translucent purple veil (`::after` pseudo-element) that dissipates when the chapter scrolls into view via IntersectionObserver, evoking a Stark-lab forcefield powering down
- **Gilded title shimmer** — Chapter titles use `background-clip: text` with a gold gradient band that sweeps across once on reveal, creating a brief cinematic gold flash before settling back to white
- **Enhanced side accent animation** — The left-edge accent line expands and gains a colored glow when its chapter enters the viewport

**Files Modified**: `css/portfolio.css`, `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.19.1] — 2026-02-19

### Fixed
- **Portfolio observer leak on rapid close** — `openPortfolio()` defers IntersectionObserver setup via `requestAnimationFrame`, but if the window was closed before the rAF callback fired, `onClose` disconnected the observers first, then the rAF re-activated them by calling `.observe()` on disconnected instances. These zombie observers would persist with no way to disconnect. Added a `closed` guard flag checked before observer setup
- **`createLazyWindow` error path now uses `Sanitize.setHTML()`** — The error handler previously set structural HTML via raw `innerHTML`, bypassing the DOMPurify defense-in-depth layer added in v3.18.1. Error message content was already escaped via `Sanitize.text()`, but the surrounding HTML template was not routed through `Sanitize.setHTML()` like all other DOM injection paths

**Files Modified**: `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.19.0] — 2026-02-18

### Changed
- **Lightbox listener lifecycle refactored** — Document-level `keydown`, `mousemove`, and `mouseup` listeners are now attached only while the lightbox is open and detached on close. Previously these three listeners persisted for the entire page session, running handler checks on every keypress and mouse movement even when the lightbox was closed. Uses stable bound method references (`_boundKeydown`, `_boundMousemove`, `_boundMouseup`) created once during `initEvents()` for clean `addEventListener`/`removeEventListener` pairing
- **`createLazyWindow` error handling** — Dynamic `import()` failures now display a styled error message inside the window content area instead of silently leaving the window empty. Error text is sanitized through `Sanitize.text()` to prevent injection from crafted error messages
- **Removed duplicate `initEvents` JSDoc comment** in `lightbox.js` — zoom/pan state declarations now have their own descriptive comment block

**Files Modified**: `js/lightbox.js`, `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.18.1] — 2026-02-18

### Security
- **localStorage poisoning hardened across State module** — `setTheme()` and `setCursorTrailType()` now validate values against explicit allowlists before writing to `data-theme` attributes or emitting to CSS. Previously, a poisoned localStorage entry (e.g. from a temporary XSS) could inject arbitrary values into DOM attributes that persist across page loads. Both `init()` loaders also validate on read
- **`interactionIntensity` bounds-checked on load** — `parseInt()` result is now verified with `Number.isFinite()` and clamped to 0–100, preventing NaN propagation from corrupted localStorage
- **Data loader path traversal blocked** — `data-loader.js` now validates fetch keys through `Sanitize.safeKey()` before constructing `data/${key}` URLs. Blocks `../../etc/passwd`, `.env`, and protocol-prefixed strings that could escape the `data/` directory
- **Added `Sanitize.allowlist()` validator** — generic allowlist checker for any localStorage-sourced value that maps to a fixed set of options. Used by State for themes and cursor trail types
- **Added `Sanitize.safeKey()` validator** — identifier-safe string validator that allows only alphanumeric characters, hyphens, underscores, and dots. Blocks path traversal sequences (`..`), leading dots/slashes, and special characters
- **Closed stored XSS via folderIcons** — Media Vault folder icons from admin panel were stored raw and inserted via `innerHTML` without sanitization. A crafted icon string like `<img src=x onerror=alert(1)>` would execute when the Media Vault opened. Now routed through `Sanitize.text()`
- **Fixed attribute-context XSS in project tag filters** — `data-tag="${tag}"` was interpolated without attribute encoding, allowing tag values containing `"` to break out of the attribute and inject event handlers. Now uses `Sanitize.attr(tag)` for the attribute context
- **GitHub dashboard defense-in-depth** — `container.innerHTML = html` replaced with `Sanitize.setHTML(container, html)` to run the full assembled HTML through DOMPurify as a safety net, rather than relying solely on per-field escaping

### Added
- 10 new tests for `Sanitize.allowlist()` — covers valid values, invalid values, non-string input, and case sensitivity
- 7 new tests for `Sanitize.safeKey()` — covers valid filenames, path traversal, protocol handlers, special characters, and falsy input

**Test count**: 229 across 13 suites (up from 219)

**Files Modified**: `js/sanitize.js`, `js/state.js`, `js/data-loader.js`, `js/desktop.js`, `js/github.js`, `tests/sanitize.test.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.18.0] — 2026-02-18

### Added
- **Purple Reign cinematic project showcase** — Featured projects now display as full-height scroll-snap chapters inside the Portfolio window instead of a 2-column card grid. Each project is a "chapter" with staggered scroll-triggered reveal animations (via `IntersectionObserver`), a purple/gold accent system, and dot navigation on the right edge for quick jumping between projects. The design evokes a luxury lookbook — Prince's Purple Rain meets Tony Stark's lab
- **Scroll-snap chapter navigation** — Dot indicators on the right edge track the active chapter and allow click-to-jump navigation
- **Staggered entrance animations** — Chapter index, title, description, tech badges, and links animate in sequentially as each chapter scrolls into view

### Changed
- Portfolio window title updated from `FEATURED_PROJECTS` to `PURPLE REIGN // FEATURED`
- Project accent colors shifted from cyberpunk neons to a purple/violet/gold palette (`#8b5cf6`, `#c084fc`, `#a78bfa`, `#d4af37`, `#7c3aed`) to match the cinematic theme
- Portfolio window dimensions adjusted from 680×620 to 640×560 to emphasize vertical scroll immersion

---

## [3.17.1] — 2026-02-18

### Security
- **Admin save paths now sanitize URLs** — `saveProjects()` and `saveMedia()` write user-supplied `demo`, `repo`, media `url`, and `poster` fields through `Sanitize.url()` before persisting to localStorage. Previously, only the backup import path sanitized URLs; the manual save path wrote raw form input, allowing `javascript:` or `data:` URI injection via the admin panel that would execute when rendered in project cards or media vault
- **Theme color import validates hex format** — imported `themeColors` from backup JSON are now parsed and each value validated through `Sanitize.hexColor()` (strict `#RGB`/`#RRGGBB`/`#RRGGBBAA` regex). Previously accepted any string, enabling CSS injection payloads like `url(javascript:...)` or `expression()` when applied to CSS custom properties via `setProperty()`
- **Added `Sanitize.hexColor()` validator** — allowlist-based hex color validator that accepts only `#` + 3/4/6/8 hex digits. Returns a safe fallback for any non-matching input. Used by admin theme import to sanitize color values before they reach `document.documentElement.style.setProperty()`
- **`saveJSON()` handles QuotaExceededError** — `localStorage.setItem` throws when storage is full; the shared helper now catches the error, logs it, and returns `false` instead of crashing the caller. Prevents silent data loss when quota is exhausted

### Added
- 7 new tests for `Sanitize.hexColor()` — covers 6-digit, 3-digit, 8-digit hex acceptance, CSS injection payloads (`url()`, `expression()`, property breakout), named colors/rgb/hsl rejection, falsy input with custom fallback, and missing `#` prefix

**Test count**: 219 across 13 suites (up from 212)

**Files Modified**: `js/sanitize.js`, `js/admin.js`, `js/dom-helpers.js`, `tests/sanitize.test.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.17.0] — 2026-02-17

### Changed
- **Unified lazy-window pattern for Skills, GitHub, and Terminal** — `openSkills()` (30 lines → 13), `openGitHubCenter()` (18 lines → 13), and `openTerminal()` (18 lines → 11) now use the shared `createLazyWindow()` helper instead of manually creating containers, querying `.window-content`, and wiring dynamic imports. Eliminates 3 copies of the same lazy-load boilerplate
- **Extended `createLazyWindow()` API** — added `onLoad` callback for object-API modules (`.init()/.render()/.stop()` pattern), `containerClass` for CSS class assignment, and `windowOptions` spread for pass-through window config (e.g. `transitionType`). The existing `exportName` convention used by 5 other windows is unchanged

**Files Modified**: `js/desktop.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.16.7] — 2026-02-17

### Security
- **Added `Sanitize.url()` method** — allowlist-based URL validator that permits only `http(s)` and relative paths. Blocks `javascript:`, `data:`, `vbscript:`, `blob:`, and control-char-obfuscated protocol variants. Used during backup import to prevent stored XSS via crafted URLs in project/media JSON
- **Admin Dashboard import hardens URL fields** — all `demo`, `repo`, media `url`, and `poster` fields in imported backup JSON are now validated through `Sanitize.url()` before being written to localStorage. Previously, a malicious backup file could inject `javascript:` URIs that would execute when rendered in the admin panel or media vault
- **Admin tab renders routed through `Sanitize.setHTML()`** — all 5 admin tabs (desktop, projects, media, theme, data) and folder icon list now use DOMPurify-backed `Sanitize.setHTML()` instead of bare `innerHTML`. Defense-in-depth: catches any future template injection if dynamic data is interpolated without escaping
- **Startmenu shutdown uses safe DOM API** — replaced `document.body.innerHTML = ''` and `innerHTML = '<h1>...'` with `while(firstChild) remove()` + `createElement`/`textContent`. Eliminates the innerHTML pattern on `document.body` entirely

### Added
- 11 new security tests for `Sanitize.url()` — covers https/http allow, relative paths, javascript: block, control-char obfuscation, data:/vbscript:/blob: block, falsy input, whitespace trim (212 total tests)

**Files Modified**: `js/sanitize.js`, `js/admin.js`, `js/startmenu.js`, `tests/sanitize.test.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.16.6] — 2026-02-17

### Changed
- **DOCUMENTATION.md modernized from v2.56 to v3.16.6** — the main user guide was frozen at November 2025 (Phase 3 era) while the codebase grew from 10 modules to 44. Updated Quick Start from "open index.html" to Vite-based `npm run dev` workflow. Added complete Desktop Apps reference table covering all 20 apps. Added Keyboard Shortcuts & Easter Eggs section with command palette, toast notifications, and all hidden triggers. Replaced stale 10-file structure with current 44-module architecture summary. Fixed Deployment section to include `npm run build` and Vite output. Updated Admin Dashboard access instructions (now console-only via `Admin.open()`). Removed dead link to deleted `FEATURE_VERIFICATION.md`. Updated Related Documentation table with current doc set including EASTER_EGGS_GUIDE.md. Added Development Commands reference

**Files Modified**: `DOCUMENTATION.md`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.16.5] — 2026-02-17

### Fixed
- **Toast notification infinite loop on eviction** — `dismissToast()` removed entries from the queue asynchronously (inside `animationend` callback), but the `while (queue.length >= MAX_VISIBLE)` eviction loop checked synchronously. When 4+ toasts were queued rapidly (e.g. toggling settings), the loop spun forever, freezing the browser. Fixed by splicing the queue synchronously before starting the exit animation
- **Toast hover timer leak** — clearing the auto-dismiss timer on `mouseenter` worked, but the replacement timer created on `mouseleave` was never stored. Subsequent hovers couldn't cancel it, causing toasts to dismiss while the user was still reading them. Timer ID now tracked on the entry object and cleared consistently
- **Toast double-dismiss race condition** — the close button, auto-timer, and hover-leave timer could all call `dismissToast()` on the same entry, causing double-splice and orphaned DOM nodes. Added `dismissed` idempotency guard

**Files Modified**: `js/notifications.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.16.4] — 2026-02-17

### Security
- **Tabnapping prevention on `target="_blank"` links** — 4 anchor tags in `desktop.js` (contact social links, project demo/repo links) were missing `rel="noopener noreferrer"`, allowing opened pages to access `window.opener` and potentially redirect the portfolio. Fixed by adding the attribute to all 4 instances. The `openExternal()` helper already handles this for programmatic opens, but these HTML-interpolated links were missed
- **GitHub API response shape validation** — `github.js` now validates that API responses have expected `user.login` (string), `repos` (array of objects with `name`), and `events` (array) before rendering or caching. Corrupted localStorage cache is auto-purged on validation failure. Mirrors the weather widget validation pattern from v3.16.2
- **Contact form input length limits** — Added `maxlength` attributes to name (100), email (254 per RFC 5321), and message (2000) fields to prevent excessively long `mailto:` URI construction that could crash browsers or be used for abuse

### Added
- **GitHub validation test suite** (`tests/github.test.js`) — 7 tests covering `validateResponse()`: valid shape acceptance, missing/null user, non-string login, non-array repos, non-array events, invalid repo entries, and null repo entries

**Test count**: 201 across 13 suites (up from 194 across 12)

**Files Modified**: `js/desktop.js`, `js/github.js`, `tests/github.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.16.3] — 2026-02-16

### Added
- **Desktop utilities test suite** (`tests/desktop-utils.test.js`) — 23 new tests covering `el()` DOM factory, `Sanitize.html()` DOMPurify-absent fallback, `Sanitize.setHTML()` null safety and content replacement, advanced `Sanitize.attr()` XSS vectors (carriage return obfuscation, mid-string javascript:, data: with script keyword), and `createLazyWindow` closure pattern (cleanup lifecycle, pre-load close safety)
- Total test count: 194 across 12 suites (up from 171 across 11)

**Files Modified**: `tests/desktop-utils.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.16.2] — 2026-02-16

### Security
- **CSP `connect-src` updated** — Added `https://api.open-meteo.com` to Content-Security-Policy. Weather widget fetches were being silently blocked in production by the restrictive CSP that only allowed `'self'` and `api.github.com`
- **Permissions-Policy `geolocation` unlocked for same-origin** — Changed from `geolocation=()` (deny all) to `geolocation=(self)`. The weather widget's `navigator.geolocation.getCurrentPosition()` was being denied by the site's own security headers
- **`Sanitize.attr()` blocks `data:image/svg+xml` XSS** — SVG data URIs can embed `<script>` and `onload` handlers for script execution. Now blocks any `data:` URI containing `svg` alongside existing `javascript:`, `vbscript:`, and `data:text/html` blocks
- **Weather API response shape validation** — `fetchWeather()` now validates the response has expected `current` and `daily` fields with correct types before rendering, preventing crashes from malformed API data (mirrors the GitHub cache validation pattern)
- **Coordinate input validation** — `fetchWeather()` rejects `NaN`, `Infinity`, or non-finite coordinates via `Number.isFinite()`, preventing malformed API URLs from crafted Position objects
- 3 new security tests for SVG data URI blocking (171 total, up from 168)

**Files Modified**: `vercel.json`, `js/sanitize.js`, `js/weather.js`, `tests/sanitize.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

> *"The art of war teaches us not to rely on the likelihood of the enemy not coming, but on our own readiness to receive him."* — Sun Tzu

---

## [3.16.1] — 2026-02-16

### Fixed
- **Calculator keyboard listener stealing keystrokes globally** — the `keydown` handler on `document` fired regardless of which window was focused or whether the user was typing in a text field (command palette, sticky notes, terminal, contact form). Now checks: (1) event target is not an input/textarea/contenteditable, and (2) the calculator window has the `.active` class. Keyboard shortcuts only fire when the calculator is the foreground window and no text field is focused.

**Files Modified**: `js/calculator.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.16.0] — 2026-02-16

### Added
- **WEATHER desktop app** — Live weather widget using browser geolocation and Open-Meteo API (free, no API key). Displays current temperature, feels-like, humidity, wind speed, weather condition with WMO code emoji mapping, and 3-day forecast cards. Graceful error handling for denied/unavailable geolocation with user-friendly messages. Cyberpunk glass UI with cyan temperature glow, magenta forecast accents, and green stat highlights. Lazy-loaded via `createLazyWindow` pattern — zero bytes until opened
- New desktop icon `WEATHER` with custom sun/cloud/rain gradient SVG icon in Column 4 (Extras)
- New files: `js/weather.js`, `css/weather.css`, `public/assets/weather.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `README.md`, `CHANGELOG.md`, `package.json`
**Files Created**: `js/weather.js`, `css/weather.css`, `public/assets/weather.svg`

---

## [3.15.0] — 2026-02-16

### Added
- **CALC.exe desktop app** — Cyberpunk glass calculator with full arithmetic (add, subtract, multiply, divide), percentage, sign toggle, backspace, and expression chaining. Keyboard input support (0-9, operators, Enter, Backspace, Escape). Magenta-accented operator keys, green action keys, cyan display with neon glow. Lazy-loaded via `createLazyWindow` pattern — zero bytes until opened
- New desktop icon `CALC.exe` with custom gradient SVG icon in Column 4 (Extras)
- New files: `js/calculator.js`, `css/calculator.css`, `public/assets/calculator.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `README.md`, `CHANGELOG.md`, `package.json`
**Files Created**: `js/calculator.js`, `css/calculator.css`, `public/assets/calculator.svg`

---

## [3.14.0] — 2026-02-16

### Changed
- **Extracted `el()` DOM helper** to `dom-helpers.js` — removes identical 5-line function duplicated in `sticky-notes.js` and `pomodoro-timer.js`, consolidating it alongside existing shared utilities (`loadJSON`, `saveJSON`, `downloadJSON`, `animateCounter`)
- **Introduced `createLazyWindow()` helper** in `desktop.js` — replaces 3 copy-pasted lazy-load window patterns (System Monitor, Sticky Notes, Pomodoro Timer) with a single config-driven function. Each method shrinks from 18 lines to 6 lines
- Future lazy-loaded window apps now require only a 6-line config call instead of duplicating the full pattern

**Files Modified**: `js/dom-helpers.js`, `js/desktop.js`, `js/sticky-notes.js`, `js/pomodoro-timer.js`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.13.0] — 2026-02-15

### Added
- **FOCUS_TIMER desktop app** — Pomodoro timer with canvas-rendered neon ring, start/pause/reset controls, 3 duration presets (25/5, 50/10, 90/20 min), session counter, total focus time stats, and localStorage persistence. Lazy-loaded module following sticky-notes architecture pattern. Toast notifications on session complete via existing Notify system
- New desktop icon `FOCUS_TIMER` with custom cyberpunk SVG icon in Column 4 (Extras)
- New files: `js/pomodoro-timer.js`, `css/pomodoro-timer.css`, `public/assets/pomodoro-timer.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `README.md`, `CHANGELOG.md`, `package.json`
**Files Created**: `js/pomodoro-timer.js`, `css/pomodoro-timer.css`, `public/assets/pomodoro-timer.svg`

---

## [3.12.2] — 2026-02-15

### Changed
- **README elevated to portfolio-grade v3** — added stylesheets badge, quick stats blockquote (41 modules · 21 stylesheets · 168 tests · 17 apps · 10 headers · 0 deps), Project Health table with test/security/a11y/perf/lint/bundle metrics, linked author name to GitHub profile, added missing docs to Documentation table (EASTER_EGGS_GUIDE.md, docs/GLOSSARY.md), fixed 5 stale values (test count 157→168, architecture tree 159→168, docs module count 38→41, license version v3.12.0→v3.12.1, test command count)

**Files Modified**: `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.12.1] — 2026-02-14

### Security
- **Hardened `Sanitize.attr()` against protocol obfuscation** — now strips ASCII control characters (tabs, newlines, null bytes) before checking URI schemes, blocking bypass vectors like `java\tscript:`. Also blocks `vbscript:` and `data:text/html` payloads.
- **Added URL allowlist to `openExternal()`** — only `http://` and `https://` URLs are now permitted. Blocks `javascript:`, `data:`, `vbscript:`, and any non-HTTP protocol from being opened via `window.open()`. Prevents open-redirect and XSS-via-navigation from attacker-controlled data (e.g. GitHub API responses).
- **Added `upgrade-insecure-requests` to CSP** — forces all HTTP subresource requests to HTTPS, closing mixed-content downgrade vectors.

### Added
- **9 new security tests** — 6 for `openExternal()` URL validation (javascript:, data:, vbscript:, null/empty, tab-obfuscated, http:// allowlist) and 3 for `Sanitize.attr()` (vbscript:, data:text/html, control-char obfuscation).

**Test count**: 159 → 168 (9 new tests)

---

## [3.12.0] — 2026-02-14

### Changed
- **Extracted `downloadJSON()` helper into `dom-helpers.js`** — replaces 6 identical stringify→Blob→anchor→click→revoke sequences in `admin.js` (exportProjects, exportMedia, exportAll, exportDesktopOnly, exportProjectsOnly, exportMediaOnly) with a single reusable utility. Each 7-line block reduced to a 1-line call.
- **Replaced manual localStorage try/catch in `admin.js` `loadAllData()`** — the 8-line try/catch + JSON.parse block for loading desktop items now uses the existing `loadJSON()` helper (created in v3.7.0 for exactly this purpose, but this callsite was missed).

### Added
- **2 new tests** for `downloadJSON()` in `tests/dom-helpers.test.js` — covers anchor creation + click trigger, filename assignment, and objectURL cleanup.

**Test count**: 157 → 159 (2 new tests)

**Files Modified**: `js/dom-helpers.js`, `js/admin.js`, `tests/dom-helpers.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.11.0] — 2026-02-14

### Added
- **Sticky Notes app** (`js/sticky-notes.js`, `css/sticky-notes.css`) — persistent note-taking utility with localStorage auto-save. Create, edit, and delete notes in a responsive card grid. 5 cyberpunk color themes (cyber, neon, pink, gold, purple) cycle per note via color dot button. Notes persist across sessions with debounced save (400ms). Delete animation, empty state, contenteditable body with placeholder text, and timestamp display. Lazy-loaded module with cleanup function.
- **Sticky Notes SVG icon** (`assets/sticky-notes.svg`) — layered note cards with pencil accent, matching existing cyberpunk icon style
- **Desktop icon grid updated** — 17 icons (was 16), NOTES added to Column 4 (Extras). localStorage key bumped to `desktop_layout_v4` to force layout reset for existing users.

**Files Created**: `js/sticky-notes.js`, `css/sticky-notes.css`, `assets/sticky-notes.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.10.1] — 2026-02-14

### Security
- **Sanitized window content innerHTML** — `WindowManager.create()` now routes all string `content` through `Sanitize.setHTML()` instead of raw `innerHTML`, closing a defense-in-depth XSS gap where future callers could pass tainted HTML into window bodies
- **Sanitized window icon innerHTML** — titlebar and taskbar icon rendering in `windows.js` now uses `Sanitize.setHTML()` to filter SVG/HTML icon strings that could originate from localStorage-overridden desktop items
- **Sanitized start menu item rendering** — replaced `innerHTML` interpolation of `item.icon` and `item.label` in `startmenu.js` with DOM API (`textContent` + `Sanitize.setHTML`), preventing XSS from localStorage-poisoned desktop item configs
- **Added Cross-Origin-Embedder-Policy header** — `credentialless` mode enables cross-origin isolation (Spectre mitigation) while preserving Google Fonts, YouTube embeds, and Unsplash wallpaper loading
- **Added Cross-Origin-Resource-Policy header** — `same-origin` prevents cross-origin reads of site resources, hardening against side-channel data exfiltration

**Files Modified**: `js/windows.js`, `js/startmenu.js`, `vercel.json`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.10.0] — 2026-02-13

### Added
- **Keyboard shortcuts overlay** (`js/shortcuts-overlay.js`, `css/shortcuts-overlay.css`) — press `?` to toggle a glassmorphism panel showing all keyboard shortcuts and hidden easter eggs, organized into 3 categories: Navigation (6 shortcuts), System Toggles (4 shortcuts), and Easter Eggs (6 secrets). Platform-aware key labels (⌘ on Mac, Alt on Windows). Dismisses via Escape, `?` again, or backdrop click. Skips activation when typing in inputs/textareas. Mobile-responsive single-column layout at ≤600px.

**Files Created**: `js/shortcuts-overlay.js`, `css/shortcuts-overlay.css`

**Files Modified**: `js/main.js`, `index.html`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.9.3] — 2026-02-13

### Fixed
- **Vite dual-import warning eliminated** — `warp.js` statically imported `fx.js` while `main.js` dynamically imported it, preventing Vite from code-splitting `fx.js` into its own chunk. Replaced static import with `window.__FX` reference (already set by `main.js` during boot). FX now loads on-demand as its own 3.44 kB chunk.
- **18 → 0 ESLint warnings** — cleaned all remaining lint issues across 11 files: 3 catch variables prefixed with `_`, 6 unused callback parameters prefixed with `_`, 5 dead variables removed (`translateMatch`, `relX`/`relY`, `velocity`, `t0` ×2), and 1 orphaned `bounds` assignment cleaned up.

**Bundle impact**: Main chunk reduced from 135.8 kB → 132.3 kB (−3.5 kB); `fx.js` now a separate 3.44 kB lazy chunk.

**Files Modified**: `js/warp.js`, `js/admin.js`, `js/audiofx.js`, `js/boot.js`, `js/router.js`, `js/interactions/cursor-reactive.js`, `js/interactions/cursor-tracker.js`, `js/interactions/easter-eggs.js`, `js/interactions/micro-interactions.js`, `js/interactions/sound-manager.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.9.2] — 2026-02-13

### Fixed
- **Dead imports in `login.js`** — removed unused `AudioFX` and `destroyGalaxyBackground` imports left over from earlier refactors. The static `galaxy-background.js` import was defeating Vite's code-splitting; converted to dynamic `import()` so the 12.8 kB galaxy shader now loads on-demand instead of blocking initial page load.
- **Dead code in `desktop.js`** — removed unused `defaultTab`/`category` params from legacy `openMedia()` and unused `win` capture in `openSystemMonitor()`.
- **Dead code in `github.js`** — removed unused `mainLang` variable; replaced inline `onclick` handler (bypasses CSP, fails in bundled builds) with DOM `addEventListener` using dynamic `import()` to avoid circular dependency.
- **Dead code in `state.js`** — removed unused `getBoundingClientRect()` call in `saveWindowStates()` (state was already read from `win.x/y/width/height`).
- **ESLint config** — added `argsIgnorePattern: '^_'` and `caughtErrorsIgnorePattern: '^_'` to `no-unused-vars` rule, following the widespread JS convention for intentionally unused parameters. Reduced lint warnings from 27 to 18.

**Bundle impact**: Main chunk reduced from 148.4 kB to 135.8 kB (−12.6 kB) by enabling galaxy-background code-splitting.

**Files Modified**: `js/login.js`, `js/desktop.js`, `js/github.js`, `js/state.js`, `js/main.js`, `eslint.config.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.9.1] — 2026-02-13

### Added
- **Smoke test suite** (`tests/smoke.test.js`) — 27 integration tests covering the 4 critical user flows most likely to break during refactors: homepage DOM structure (7 tests verifying lock screen, desktop, dock, top bar, ARIA landmarks), router navigation dispatch (8 tests verifying all 5 route→opener mappings plus XSS/null path blocking), contact form lifecycle (5 tests covering required fields, FormData capture, mailto URI construction, reset, and preventDefault), and responsive breakpoints (7 tests covering mobile detection, body class injection, 768px stylesheet, viewport meta creation/dedup, and hover-disable rules).

**Test count**: 130 → 157 (27 new tests)

**Files Created**: `tests/smoke.test.js`

**Files Modified**: `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.9.0] — 2026-02-13

### Added
- **Toast notification system** (`js/notifications.js`, `css/notifications.css`) — non-blocking notification queue with 4 types (success, error, warning, info), auto-dismiss progress bar, hover-to-pause, click-to-dismiss, max 4 visible with oldest eviction, `aria-live` polite region for screen reader support, `prefers-reduced-motion` respect, and mobile-responsive bottom positioning.
- **Settings toggle feedback** — keyboard shortcuts (`Cmd+C`, `Cmd+S`, `Cmd+I` on Mac / `Alt+` on Windows) now show a toast confirming the toggle state (e.g. "Cursor trail ON").

### Changed
- **Easter eggs unified with toast system** — replaced 50+ lines of inline `showNotification()` with hardcoded CSS and DOM construction in `easter-eggs.js` with the shared `Notify` module. All 7 easter egg notifications (418 teapot, 404, system info, Konami code, rapid clicks, idle warning, PlayStation mode) now use the polished toast UI with progress bars and consistent styling.

**Files Created**: `js/notifications.js`, `css/notifications.css`

**Files Modified**: `js/interactions/easter-eggs.js`, `js/main.js`, `index.html`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.8.4] — 2026-02-12

### Changed
- **Refactored `state.js` boolean toggle system** — replaced 9 hand-written setter/toggle method pairs and 10 repetitive `localStorage.getItem` blocks with a data-driven `BOOLEAN_TOGGLES` registry. A single loop now generates `setXEnabled()`, `toggleX()`, and `init()` loading for all boolean properties. Reduces ~96 lines of copy-pasted code to ~62 lines of declarative configuration. Public API is unchanged — all existing callers (`State.toggleFx()`, `State.fxEnabled`, etc.) work identically. Adding a new boolean toggle now requires 1 line in the registry instead of 8+ lines of methods.

**Files Modified**: `js/state.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.8.3] — 2026-02-12

### Added
- **Command Palette test suite** (`tests/command-palette.test.js`) — 22 tests covering init/buildCommands (DOM creation, label sanitization), open/close lifecycle, fuzzy search filtering (case-insensitive substring, empty query, no matches), filterAndRender (empty state, role=option items, default selection), keyboard navigation (ArrowDown/ArrowUp wrap-around, empty list safety), executeSelected (action invocation, palette close, system toggle dispatch), and ARIA attribute verification (role=dialog, role=listbox, aria-label)
- **Mobile detection test suite** (`tests/mobile.test.js`) — 11 tests covering `isMobile()` detection matrix (iPhone/Android/iPad user agents, desktop rejection, touch+small screen combo, touch+large screen laptop rejection), `ensureViewportMeta()` (creation when missing, no-duplicate guard), and `applyMobileOptimizations()` (body class, hover-disable stylesheet injection, mobile layout stylesheet injection)

**Test count**: 97 → 130 (33 new tests across 2 files)

**Files Created**: `tests/command-palette.test.js`, `tests/mobile.test.js`

**Files Modified**: `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.8.2] — 2026-02-12

### Changed
- **Architecture docs modernized to v3.8.2** — `docs/ARCHITECTURE.md` was stuck at v2.56 (November 2025, 17 modules) while the codebase had grown to 38 modules, 18 CSS files, and 8 test suites. Updated module categories from 6 → 9 with complete tables for all 38 modules including the interactions subsystem, shared utilities layer (sanitize, dom-helpers, data-loader, focus-trap, modal, loader), application windows (terminal, github, system-monitor), and 3D/VFX modules (galaxy-background, mahoraga-wheel). Rewrote architecture diagram to show the new Shared Utilities Layer. Updated dependency graph with lazy-loading annotations, init sequence with current boot flow, and key files reference table.
- **Documentation index updated** (`docs/README.md`) — fixed 4 dead links to deleted `FEATURE_VERIFICATION.md`, updated file tree from 17 JS / 5 CSS to 38 JS / 18 CSS / 8 test suites, bumped version references from v2.56 to v3.8.2.

**Files Modified**: `docs/ARCHITECTURE.md`, `docs/README.md`, `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.8.1] — 2026-02-12

### Fixed
- **Skills Universe event listener leak** — `mousedown` and `mousemove` listeners on the canvas were registered with anonymous functions in `init()` but never removed in `stop()`, causing listeners to accumulate each time the Skills window was opened and closed. Now stores bound references for all four listeners (mousedown, mousemove, mouseup, resize) and removes them all on teardown.
- **Skills Universe spring physics NaN crash** — spring force calculation divided by `dist` without a zero-guard, unlike the repulsion code. Two connected nodes at identical coordinates produced `NaN` forces that propagated to all nodes, collapsing the entire graph. Added `dist === 0` guard matching the existing repulsion pattern.
- **Skills Universe missing resize handler** — canvas dimensions were set once at init and never updated. Resizing the browser or Skills window left nodes rendering outside the visible area or clipped. Added `window.resize` listener that reflows the canvas to its parent container dimensions.
- **InteractionEngine double-init race condition** — concurrent `init()` calls (e.g. from rapid window open/close) could bypass the `_initializing` boolean guard and trigger duplicate module loading. Replaced boolean flag with a stored Promise so concurrent callers await the same initialization.

**Files Modified**: `js/skills.js`, `js/interactions/engine.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.8.0] — 2026-02-12

### Added
- **Portfolio featured projects window** (`PORTFOLIO` desktop icon) — curated showcase of 5 hero projects (Passion Agent, Vibe Coder, Portfolio OS, Culture Drop HQ, FCPXML MCP Server) with rich cards, color-coded tech stack badges, live demo buttons, and source links. Includes "VIEW ALL 18 PROJECTS" bridge to the full Applications catalog.
- **Portfolio CSS** (`css/portfolio.css`) — responsive 2-column grid cards with hover glow effects, accent color custom properties, featured card spanning full width, and cyberpunk-styled badge/link components.
- **Portfolio SVG icon** (`assets/portfolio.svg`) — 4-panel grid icon matching the project showcase concept.
- **Desktop icon grid updated** — 16 icons (was 15), PORTFOLIO added to Row 1 second position. localStorage key bumped to `desktop_layout_v3` to force layout reset for existing users. PORTFOLIO added to dock launchers.

**Files Created**: `css/portfolio.css`, `public/assets/portfolio.svg`

**Files Modified**: `js/desktop.js`, `index.html`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.7.1] — 2026-02-12

### Changed
- **README elevated to portfolio-grade v2** — added prominent "Try the Live Demo" CTA above the fold, expanded Desktop Icons table from 10-row feature summary to accurate 15-icon reference with Type column (Window/External/Lightbox), added prerequisites to Quick Start (Node 18+, npm 9+), consolidated duplicate Scripts section into a unified Development section with tooling context, improved Documentation table descriptions, added source repo link to footer
- **Fixed stale version strings** — `index.html` title and top-bar version were stuck at `v3.3.0` since the content overhaul in Phase 3; updated both to `v3.7.1`

**Files Modified**: `README.md`, `CHANGELOG.md`, `package.json`, `index.html`

---

## [3.7.0] — 2026-02-12

### Changed
- **Extracted `loadJSON`/`saveJSON` storage helpers** into `dom-helpers.js` — replaces 6 inconsistent `try/catch` + `JSON.parse(localStorage.getItem(...))` patterns across `desktop.js` (3 sites), `github.js` (2 sites), `admin.js` (1 site), and `state.js` (1 site) with a single, tested utility. Error handling is now uniform: parse failures silently return the fallback value instead of varying between removing the key, logging an error, or swallowing silently.
- **Fixed `window` event listener memory leak in `skills.js`** — `window.addEventListener('mouseup', ...)` was registered with a new anonymous function on every `init()` call but never removed in `stop()`, causing listeners to stack each time the Skills window was opened and closed. Now stores a bound reference and removes it on teardown.

### Added
- **6 new tests** for `loadJSON()` and `saveJSON()` in `tests/dom-helpers.test.js` — covers valid JSON, missing keys, corrupted data fallback, default null, overwrite, and serialization

**Test count**: 91 → 97 (6 new tests)

**Files Modified**: `js/dom-helpers.js`, `js/desktop.js`, `js/github.js`, `js/admin.js`, `js/state.js`, `js/skills.js`, `tests/dom-helpers.test.js`, `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.6.5] — 2026-02-12

### Changed
- **README elevated to portfolio-grade** — added shields.io stat badges (version, tests, modules, frameworks, license), fixed stale module count (37→38 reflecting all JS files including warp.js, glyphs.js, audiofx.js), expanded architecture tree from partial (18 modules + ellipsis) to complete (all 38 modules + all 17 stylesheets with descriptions), and added "Why No Frameworks?" section articulating the vanilla JS constraint as a deliberate architectural demonstration

**Files Modified**: `README.md`, `CHANGELOG.md`, `package.json`

---

## [3.6.4] — 2026-02-12

### Added
- **DOM helpers test suite** (`tests/dom-helpers.test.js`) — 7 tests covering `openExternal()` (noopener/noreferrer enforcement, URL passthrough) and `animateCounter()` (completion, intermediate values, edge cases, cancellation)
- **Modal dialog test suite** (`tests/modal.test.js`) — 15 tests covering `init()` (container creation, idempotency), `_createDismiss()` (focus release, resolve values), `prompt()` (title/message rendering, focus trapping, confirm/cancel/overlay clicks, Enter/Escape keys), and `alert()` (OK-only rendering, dismiss lifecycle, focus trap cleanup)

**Test count**: 69 → 91 (22 new tests across 2 files)

**Files Created**: `tests/dom-helpers.test.js`, `tests/modal.test.js`

**Files Modified**: `package.json`, `README.md`, `CHANGELOG.md`

---

## [3.6.3] — 2026-02-12

### Changed
- **Lightbox focus trap unified with shared utility** — replaced 25-line inline `handleTabFocus()` method with the same `trapFocus()` from `focus-trap.js` already used by modal, login, welcome, and tour modules. Eliminates DRY violation, fixes inconsistent focusable selector (`[href]` → `a[href]`), and properly cleans up the keydown listener on close.

**Files Modified**: `js/lightbox.js`, `package.json`, `README.md`, `CHANGELOG.md`

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

**Latest Version**: 3.12.0

**Status**: ✅ Production Ready

**License**: MIT

**Built with ❤️ using vanilla JavaScript** - No frameworks, no dependencies.
