# Passion OS v3.0 — Alien Technology Upgrade

## Vision
Transform Passion OS from "solid cyberpunk CSS theme" into "alien technology command center" — adding dimensional depth, HUD ornamentation, glass materials, and a 3D hero artifact. Keep everything that works. Elevate every surface.

## References
- **Visual Level:** Samolevsky Futuristic UI Kit (HUD rings, technical markers, wireframe elements)
- **Font Energy:** Elsone by Rantautype (wide, angular, geometric display)
- **Material Feel:** Sony PlayStation UI + alien crystal glass
- **First Impact:** Luxury Tech HQ meets Alien Artifact discovery

---

## Phase 1: Glass Foundation + HUD System (CSS)

### 1.1 New CSS Variables

```css
/* Glass Materials */
--glass-bg: rgba(15, 10, 30, 0.35);
--glass-bg-dense: rgba(15, 10, 30, 0.5);
--glass-blur: blur(40px) saturate(1.4);
--glass-blur-light: blur(20px) saturate(1.2);
--glass-border: 1px solid rgba(0, 240, 255, 0.15);
--glass-radius: 12px;

/* Holographic Border Gradient */
--holo-gradient: conic-gradient(from var(--holo-angle, 0deg), #00f0ff, #aa00ff, #ff00aa, #00f0ff);
--holo-speed: 8s;

/* HUD Decorative */
--hud-line-color: rgba(0, 240, 255, 0.2);
--hud-line-width: 1px;
--hud-marker-size: 4px;
--hud-bracket-size: 12px;
```

### 1.2 Font Upgrade

**Replace:** Orbitron → Tomorrow (Google Fonts, free)
**Pairing:** Tomorrow (display 700-900) + JetBrains Mono (system/mono text)

```css
--font-display: 'Tomorrow', 'Orbitron', sans-serif;
--font-system: 'Tomorrow', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 1.3 Glass Surface Treatment

Apply to ALL panels (windows, dock, top bar, control panel, desktop icons):

```css
.glass-surface {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--glass-radius);
  border: var(--glass-border);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

### 1.4 Holographic Animated Border

Using CSS @property for smooth gradient rotation:

```css
@property --holo-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes holo-rotate {
  to { --holo-angle: 360deg; }
}

.holo-border {
  position: relative;
}

.holo-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: conic-gradient(from var(--holo-angle), #00f0ff, #aa00ff, #ff00aa, #00f0ff);
  animation: holo-rotate var(--holo-speed) linear infinite;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  padding: 1px;
}
```

### 1.5 HUD Corner Brackets

SVG-based corner decorations on every glass panel:

```css
.hud-brackets {
  position: relative;
}

.hud-brackets::before,
.hud-brackets::after {
  content: '';
  position: absolute;
  width: var(--hud-bracket-size);
  height: var(--hud-bracket-size);
  border-color: rgba(0, 240, 255, 0.4);
  border-style: solid;
  border-width: 0;
  pointer-events: none;
}

/* Top-left + bottom-right via ::before/::after + extra elements */
```

Actually implemented as 4 small SVG corner elements positioned absolutely, animated in on panel mount. Each corner is an L-shaped bracket with a small dot at the vertex.

### 1.6 Specific Surface Upgrades

**Top Bar:**
- Glass bg + holographic bottom border line
- Corner brackets at left/right ends
- Brand text: Tomorrow font, subtle glass emboss (light text-shadow top, dark bottom)
- Wheel logo: micro-glow pulse animation

**Windows:**
- Glass bg (denser titlebar, lighter content area)
- Holographic animated border
- Corner brackets on all 4 corners
- Active window: border glow intensifies, subtle bloom shadow
- Open animation: current scale-up + new "shimmer sweep" (white gradient sweeps left→right across panel on appear)
- Border-radius: 12px (up from 4px)
- Window controls: keep traffic light dots, add subtle glass circle behind each

**Desktop Icons:**
- Icon boxes become frosted glass CIRCLES (not squares)
- Holographic border on hover
- 3D tilt on hover: CSS perspective + rotateX/Y tracking mouse position within icon
- Light bloom underneath on hover (radial gradient shadow)
- Labels: micro frosted pill background
- Faint concentric ring scan effect on hover (expanding ring animation)

**Dock:**
- Frosted glass shelf with 12px radius
- Holographic animated border
- Reflection: flipped, faded copy underneath via CSS transform: scaleY(-1) + opacity mask
- Magnetic cursor: icons scale up (1.0→1.2) as cursor approaches, smooth transition
- Active indicator: holographic dot below icon (replaces border glow)
- Separator: thin holographic vertical line
- Section labels: Tomorrow font, smaller tracking

**Control Panel Dropdown:**
- Glass treatment
- HUD corner brackets
- Holographic border
- Toggle switches: glass pill style

---

## Phase 2: Lock Screen 3D Wheel (Three.js)

### 2.1 3D Model Pipeline

1. Generate Mahoraga wheel model via Meshy/Tripo3D AI
2. Clean up in Blender if needed (reduce polycount, fix normals)
3. Apply PBR materials: brushed dark metal base + holographic iridescent highlights
4. Export as .glb (compressed GLTF)
5. Target: <2MB file size

### 2.2 Three.js Scene Setup

**New file:** `js/wheel-3d.js`

- Three.js loaded via CDN or npm (evaluate bundle size)
- Scene: transparent background (galaxy canvas shows through)
- Camera: PerspectiveCamera, FOV 50, positioned to frame wheel
- Renderer: WebGLRenderer with alpha, antialias, toneMapping

**Lighting Rig:**
- Key light: warm gold/white from top-right (DirectionalLight)
- Rim light: cool purple/magenta from behind-left (PointLight)
- Ambient: very dim fill (AmbientLight, intensity 0.1)
- Subtle volumetric god rays through spokes (bloom post-processing)

**Post-processing:**
- UnrealBloomPass for glow/god ray effect
- Subtle chromatic aberration (optional, test performance)

### 2.3 Wheel Animation

- Continuous Y-axis rotation: slow base speed (~0.003 rad/frame)
- "Clunky ship wheel" feel: custom easing with micro-stutters
  - Implement via sine wave modulation on rotation speed
  - `speed = baseSpeed + sin(time * 0.5) * 0.001` — slight acceleration/deceleration
- Mouse tracking gyroscope: wheel tilts toward cursor position
  - Map cursor X/Y to rotateX/rotateZ (±10deg max)
  - Smooth lerp interpolation (0.05 factor) for fluid response
  - Light positions shift slightly with tilt for dynamic highlights

### 2.4 HUD Ring Decorations (Lock Screen)

Concentric SVG/CSS rings around the 3D wheel:

- **Ring 1 (inner):** Thin dashed circle, rotates CW slowly
- **Ring 2 (mid):** Dotted circle with small marker nodes, rotates CCW
- **Ring 3 (outer):** Thin solid circle with tick marks (like a compass), rotates CW faster
- All rings: 1px stroke, rgba(0, 240, 255, 0.3), different radii

**Technical data readouts** positioned around the wheel:
- Top-left: "SYS: ONLINE" with blinking dot
- Top-right: "VER 2.56"
- Bottom-left: tiny animated bars (fake EQ/data)
- Bottom-right: "DAREDEV256"
- All in JetBrains Mono, 9-10px, rgba white 0.4

These fade in during the cinematic intro sequence (Act 2).

### 2.5 Title Repositioning

- "PASSION OS" moves below the wheel
- Tomorrow font, 800 weight, wide letter-spacing
- Frosted glass pill behind it
- Space-pattern fill stays (the galaxy-text class) but with Tomorrow's angular forms
- Holographic shimmer overlay

- "INITIALIZE" button below title
- Frosted glass capsule shape
- Animated holographic border
- Hover: bloom expand + lift

---

## Phase 3: Polish & Advanced Interactions

### 3.1 Window Materialization Shimmer
On window open, after scale-up: a white gradient (rgba(255,255,255,0.1)) sweeps left→right across the panel in 0.4s. Like light catching crystal as it materializes.

### 3.2 Chromatic Aberration at Glass Edges
Pseudo-element on glass panels: 2-3px RGB split at borders only. Very subtle. Fades inward. Simulates light refraction through alien crystal.

### 3.3 Inner Energy Glow
Each glass panel has a faint pulsing radial gradient from center. Color follows holographic border cycle (very dim, ~0.05 opacity). Feels like energy running through the panel.

### 3.4 Desktop Icon Circle Conversion
- Swap from rounded-square to circle
- Update hit areas
- Ensure label readability with frosted pill background
- Verify all icon SVGs look good in circular frame

### 3.5 Dock Reflection
- CSS pseudo-element: `transform: scaleY(-1)`
- Opacity gradient mask: 0.15 at top → 0 at bottom
- Blur slightly: `filter: blur(2px)`
- Only show on desktop, hide on mobile

### 3.6 Performance & Accessibility
- `prefers-reduced-motion`: disable all animations, use static versions
- Three.js: detect low-end GPUs, fall back to 2D SVG wheel
- Lazy-load Three.js only on lock screen
- Test backdrop-filter performance on mobile (fallback: solid bg)
- Monitor FPS during development

---

## File Changes Summary

### New Files
- `js/wheel-3d.js` — Three.js lock screen wheel scene
- `css/glass.css` — Glass material system + holographic borders + HUD elements
- `public/assets/models/mahoraga-wheel.glb` — 3D wheel model
- `public/assets/fonts/JetBrainsMono-*.woff2` — JetBrains Mono font files (or Google Fonts CDN)

### Modified Files
- `index.html` — Add Three.js CDN, new CSS link, font links
- `css/variables.css` — New glass/HUD/font variables
- `css/styles.css` — Glass treatment on top bar, lock screen, buttons
- `css/windows.css` — Glass windows, holographic borders, corner brackets
- `css/galaxy.css` — Updated for 3D wheel integration
- `css/interactions.css` — 3D tilt hover, dock magnification
- `css/mobile.css` — Responsive glass fallbacks
- `css/accessibility.css` — Reduced motion fallbacks
- `js/login.js` — Initialize 3D wheel scene, update intro sequence
- `js/desktop.js` — Circle icons, dock magnification, 3D hover
- `js/windows.js` — Shimmer animation on create

---

## Implementation Order

1. **Glass CSS system** (variables, surfaces, holographic borders)
2. **Font swap** (Tomorrow + JetBrains Mono)
3. **HUD corner brackets** (SVG/CSS on all panels)
4. **Apply glass to all surfaces** (top bar → windows → dock → icons)
5. **Desktop icon circles + 3D hover tilt**
6. **Dock magnification + reflection**
7. **3D Mahoraga wheel** (model generation → Three.js scene → integration)
8. **Lock screen HUD rings + data readouts**
9. **Window shimmer + chromatic aberration + inner glow**
10. **Performance testing + accessibility fallbacks**
