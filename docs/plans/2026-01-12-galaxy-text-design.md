# Galaxy Text & Wheel Design

## Overview
Add animated galaxy/starfield effects to the "PASSION OS" title and Mahoraga wheel, using a JJK/Dark Shonen cosmic aesthetic with deep purples, magentas, and cursed energy vibes.

## Scope (Phase 1 - Incremental)
- **PASSION OS title**: Animated starfield inside text letters
- **Mahoraga wheel**: Galaxy color treatment with cosmic glow

## Visual Direction
- **Aesthetic**: Jujutsu Kaisen / Dark Shonen
- **Palette**:
  - Deep space: #1a0a2e, #0f051a (blacks/purples)
  - Nebula: #6b21a8, #4c1d95 (purples), #be185d (magenta)
  - Accents: #dc2626, #991b1b (red cursed energy flares)
  - Stars: White, pale blue, occasional warm accents

## Technical Architecture

### Layer Stack (back to front)
1. Static nebula layer — AI-generated custom texture
2. Three.js canvas — Transparent, renders dynamic stars only
3. Text/Wheel elements — CSS masking to reveal combined effect

### Three.js Starfield Specs
- Star count: 200-400 particles
- Properties: 0.5-2px size, brightness flicker, subtle mouse parallax
- Motion: Slow diagonal drift
- Depth: 3 parallax layers at different speeds
- Colors: Mostly white/pale blue, occasional warm accents

### Performance
- Canvas sized to element bounding box (not fullscreen)
- RAF with visibility throttling
- Fallback: Static CSS gradient for reduced motion / low-end devices

### Nebula Texture Requirements
- Resolution: 1920x1080
- Style: Painterly/ethereal, not photorealistic
- Tileable preferred
- Palette: Deep blacks, purples, magenta, subtle red wisps

## Implementation Steps
1. Generate custom nebula texture via AI
2. Create galaxy-background.js Three.js module
3. Add .galaxy-fill CSS class with masking
4. Apply to PASSION OS title on lock screen
5. Apply galaxy treatment to Mahoraga wheel SVG
6. Test performance and add fallbacks
7. Preserve original gold styling as rollback option

## Rollback Strategy
- Keep `.gold-metallic` class for wheel
- Original title styles preserved, galaxy applied via additional class
