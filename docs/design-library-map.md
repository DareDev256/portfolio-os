# Design Library Map — UI/UX + Motion Reference

**Compiled:** 2026-08-24 · **For:** jamesdare.com / tdots creative work
**Brief:** a curated, high-craft reference map so web work never reads as AI slop. Model: [metalforge.xyz](https://metalforge.xyz/) — 51 hand-tuned Metal/WGSL shaders, live parameter editor, opinionated curation, freemium export (€5/mo). Verified live 2026-08-24.

Every entry below was verified by fetching the site, the GitHub API, or the npm registry on 2026-08-24. Dates are real `pushed_at` / publish timestamps, not vibes. Dead and mediocre things are named as such.

---

## 1. MOTION LIBRARIES (WEB)

### Motion — the default for React/Vue product work
- **URL:** https://motion.dev · https://github.com/motiondivision/motion
- **What:** The renamed Framer Motion, now merged with Motion One's vanilla-JS engine into one package (`motion`, import from `motion/react`). Hybrid engine: hands off to the browser's native WAAPI where it can, JS where it must.
- **Version:** `motion@13.1.1`, published 2026-08-20. Repo pushed 2026-08-20. 33.3k stars. **MIT.**
- **Reach for it when:** component-level motion in React — enter/exit (`AnimatePresence`), layout animation (`layout` prop), gestures, shared-element morphs between routes. The `layout` prop alone is worth the dependency; nothing else does FLIP that cheaply.
- **NOT for:** long, orchestrated, scroll-scrubbed cinematic timelines. You will end up hand-rolling a timeline that GSAP already has. Also not for non-React sites — use the vanilla API or just use GSAP.
- **Cost:** free/MIT. **Motion+** is a paid tier (~$19/mo or one-time lifetime) for extra APIs (cursor, ticker, split-text-style helpers) and premium examples. The core library is not crippled without it.
- **Status:** actively maintained, sponsored by Framer/Linear/Figma. Safe.

### GSAP — the default for anything choreographed. Now genuinely free.
- **URL:** https://gsap.com · https://github.com/greensock/GSAP
- **What:** The industry timeline engine. Webflow acquired GreenSock in late 2024 and **as of April 2025 made 100% of GSAP free, including every former Club plugin** — SplitText, MorphSVG, DrawSVG, ScrollTrigger, ScrollSmoother, Flip, Observer. Commercial use included.
- **Version:** `gsap@3.15.0`, published 2026-04-13. Repo pushed 2026-04-13. 28k stars. License: GSAP Standard "no charge" license (not MIT, but free for commercial).
- **Reach for it when:** scroll-scrubbed sequences, multi-element choreography with real timing control, SVG morphing, text splitting, anything where you need to say "this starts 0.2s before that ends."
- **NOT for:** simple React enter/exit — it's the wrong ergonomics and you'll fight React's lifecycle. Not for a site that needs 3 fade-ins (use CSS).
- **Status:** healthy, but note the release cadence slowed post-acquisition (4 months since last publish at time of writing). Not a red flag yet; watch it.
- **The 2026 headline:** SplitText being free killed the entire "SplitType alternative" category. Use SplitText.

### Anime.js v4 — the small, elegant middle
- **URL:** https://animejs.com · https://github.com/juliangarnier/anime
- **What:** Rewritten in v4 as ES modules with named exports (`animate`, `stagger`, `createTimeline`, `createDraggable`, `createScope`, spring/WAAPI engines). No longer the toy it was in v3.
- **Version:** `animejs@4.5.0`, published 2026-06-22. Repo pushed 2026-08-21. 72.4k stars. **MIT.**
- **Reach for it when:** you want GSAP-ish timeline control at a fraction of the weight, on a vanilla or Astro site, with a nicer modern API than GSAP's string-based syntax.
- **NOT for:** heavy scroll scrubbing (its ScrollObserver is real but thinner than ScrollTrigger), SVG morphing, or when a team already knows GSAP.
- **Status:** very actively maintained. Genuinely underrated in 2026 now that GSAP is free — most people default to GSAP without comparing.

### Rive — interactive vector animation with real state machines
- **URL:** https://rive.app
- **What:** Design tool + runtime. Unlike Lottie, a Rive file contains a **state machine** with inputs and data binding, so the animation itself responds to app state rather than just playing a segment.
- **Version:** `@rive-app/react-canvas@4.32.1`, published 2026-08-20. **MIT runtime.**
- **Reach for it when:** interactive icons/micro-interactions that respond to input, animated mascots, a hero object that reacts to cursor or scroll, anything you'd otherwise build as a fragile DOM contraption.
- **NOT for:** one or two decorative loops. The web runtime is **~200KB gzipped including a WASM binary** vs lottie-web's ~60KB. It only amortizes at 10+ instances or app-scale use.
- **Cost:** editor free tier, paid from ~$15/mo for teams/private files. Runtime is free.
- **Status:** active, weekly-ish releases. The strongest thing in this category.

### Lottie — only when the source is After Effects
- **What:** JSON playback of AE comps. LottieFiles added a web Creator with a state machine + AI logic generation in 2025-26, narrowing Rive's gap, but the model is still "control playback" not "know your data."
- **Reach for it when:** a motion designer hands you an AE file and there is no budget to rebuild it.
- **NOT for:** anything interactive or data-driven. Not for a site where you control the pipeline — you'd choose Rive.

### Theatre.js — **do not start a new project on this**
- **URL:** https://github.com/theatre-js/theatre
- **Status: effectively stalled.** `@theatre/core@0.7.2` published **2024-05-19**. Public repo `pushed_at` **2024-08-14**. The README says 1.0 development "temporarily" moved to a private repo — that notice is now two years old.
- **Verdict:** the concept (a visual keyframe editor bolted onto a live three.js/DOM scene) is still the best idea in the space and nothing replaced it. But shipping client work on a library with a two-year-old public commit is a liability. Study it, don't depend on it.

### View Transitions API — ship it, with a fallback
- **URL:** https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- **State in 2026:** Same-document transitions are broadly supported. **Cross-document** (MPA) transitions ship in Chrome 126+/Edge, Safari 18.2+ (macOS + iOS); Firefox support landed in 2026 but reporting is inconsistent on whether it is still flagged in stable — treat Firefox as "gets a plain cross-fade."
- **Reach for it when:** page-to-page continuity on a multi-page site (see §7 — this is the single biggest untapped craft lever). `view-transition-name` on a shared image is a 6-line effect that reads as expensive.
- **NOT for:** replacing a real motion library. It has one job. Also: it is a **progressive enhancement**, never a dependency — the un-transitioned navigation must be correct on its own.
- **Gotcha:** named elements must be unique per snapshot, and transitions are blocked while the old page is still painting. Debug with the "capture" DevTools panel, not by eye.

### Popmotion — dead, and correctly so
Popmotion was absorbed into Motion One and then into Motion. There is no successor to look for; **Motion is the successor.** Ignore any 2023-era article recommending it.

---

## 2. SCROLL + FEEL

### Lenis — the current standard for smooth scroll
- **URL:** https://lenis.darkroom.engineering · https://github.com/darkroomengineering/lenis
- **Version:** `lenis@1.3.26`, published 2026-08-05. Repo pushed 2026-08-22. 15.5k stars. **MIT.**
- **What:** Wraps the browser's own scroll rather than replacing it — so `position: sticky`, anchor links, scrollbars, and screen readers keep working. That is the whole reason it won.
- **Reach for it when:** you want inertia and you need GSAP ScrollTrigger, WebGL scenes, or sticky layouts to keep functioning. React/Vue adapters exist. Honors `prefers-reduced-motion` out of the box.
- **NOT for:** content-dense reading surfaces, docs, dashboards, or anything where a user scrolls to *find* something. Smooth scroll is a cost paid in control; only spend it on narrative pages.
- **Status:** the healthiest thing in this section.

### Locomotive Scroll v5 — now a thin Lenis wrapper
- **URL:** https://scroll.locomotive.ca · https://github.com/locomotivemtl/locomotive-scroll
- **Version:** `locomotive-scroll@5.0.1`, published 2026-01-15. Repo pushed 2026-06-30. MIT.
- **What changed:** v5 abandoned the v4 transform-hijacking approach and is built **on top of Lenis**, adding a declarative `data-scroll` attribute layer for in-view detection and parallax.
- **Reach for it when:** you like the `data-scroll-speed` declarative ergonomics and don't want to wire IntersectionObservers by hand.
- **NOT for:** new work where you already use GSAP. ScrollTrigger + Lenis covers everything Locomotive does with better timing control and far more documentation.
- **Verdict:** not wrong, but largely redundant now. If you are choosing fresh: **Lenis + ScrollTrigger.**

### GSAP ScrollTrigger / ScrollSmoother — free since 2025
- ScrollTrigger is the reference implementation for scroll-scrubbed timelines: `scrub`, `pin`, `snap`, `toggleActions`, `containerAnimation` for horizontal sections.
- **ScrollSmoother** is GSAP's own smooth-scroll and now free. It integrates natively with ScrollTrigger (no `scrollerProxy` glue). **Lenis vs ScrollSmoother:** Lenis is lighter and preserves native scroll semantics better; ScrollSmoother has zero integration friction with the rest of GSAP and adds effects like `data-speed`/`data-lag` for free. Pick one, never both.

### CSS scroll-driven animations — real now, but not a full replacement
- **URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- **State in 2026:** Chrome/Edge 115+, Safari 18+ (scroll-driven landed in Safari 26; 26.4 added **threaded** scroll-driven animations, 26.5 fixed progress-accuracy and `animation-play-state` bugs). Firefox is partial/flagged behind `layout.css.scroll-driven-animations.enabled` in stable as of Firefox 152, on by default in Nightly, and a named **Interop 2026** priority. Roughly **84% global support.**
- **Reach for it when:** progress bars, reveal-on-enter, sticky-header state, parallax on a hero. It runs off the main thread — this is the *only* scroll animation approach that cannot jank from JS work.
- **NOT for:** anything needing sequenced timing across many elements, or where the Firefox fallback of "no animation" is unacceptable as a state.
- **Rule:** always wrap in `@supports (animation-timeline: scroll())` and make the un-animated state the correct final state.

### WHAT MAKES SCROLL FEEL EXPENSIVE VS CHEAP

This is the part nobody writes down. Distilled:

1. **Lerp is a per-frame fraction, not a duration.** Lenis `lerp: 0.1` means "close 10% of the remaining distance each frame." Lower = heavier/slower settle. `0.05` is cinematic and starts feeling *laggy* on a trackpad; `0.1` is the standard; `0.15-0.2` is snappy. Above `0.25` you have paid a dependency for nothing.
2. **Cheap smooth scroll fights the input; expensive smooth scroll delays only the *render*.** If the scrollbar position, anchor links, or keyboard PageDown break, it reads as broken, not as smooth. This is precisely why Lenis (wraps native scroll) beat Locomotive v4 (replaced it).
3. **Never use a symmetric ease on scroll-linked motion.** `ease-in-out` on scrub reads as mush. Scrub wants near-linear or a very gentle `expo.out`. Lenis's own default is exponential-out: `1.001 - 2^(-10t)`.
4. **Scrub is a mapping, not an animation.** `scrub: true` binds progress 1:1 (feels mechanical, precise, good for a horizontal gallery). `scrub: 1` adds a 1-second catch-up lag (feels weighted, good for hero type). `scrub: 0.5` is the sweet spot for most reveals. The catch-up number, not the tween easing, is what carries the "expensive" feeling.
5. **Snap vs drift is a content decision, not a taste one.** Snap when each section is a *discrete unit* the user chose (a card, a case study, a slide) — the snap confirms the choice. Drift when the page is a *continuous narrative*. Snapping a continuous narrative feels like the site is steering; drifting through discrete units feels like the site is imprecise. Use CSS `scroll-snap-type: y proximity` before reaching for JS — `mandatory` traps users on tall sections.
6. **Distance is the tell.** Amateur scroll animation moves things 100px+ and fades from 0. Expensive scroll animation moves **8-24px** and fades from ~0.6, over a distance of about one-third viewport. Big travel reads as a template.
7. **Stagger is a taper, not a constant.** A flat 0.1s per item across 12 items takes 1.2s and the last item feels forgotten. Use `stagger: { amount: 0.4 }` (total budget) rather than per-item, so the sequence stays under ~500ms regardless of count.
8. **Everything scroll-linked must survive a fast scroll.** Test by flinging to the bottom. If elements are stuck at opacity 0 or mid-transform, the reveal was written as a one-way trigger instead of a reversible state.

---

## 3. COMPONENT / "ANIMATION BOX" LIBRARIES

**Blunt framing first.** These libraries are not bad code. They are *distribution*. Aceternity's components appear most prominently on developer-tool and AI-startup landing pages — browse Product Hunt's top products from 2025-2026 and you will see the same spotlight, the same 3D card flip, the same animated beam across dozens of unrelated products. Aceternity essentially **defined the "premium developer tool aesthetic"** that became dominant during the AI startup boom. That is the exact look James is trying not to have. The components are copy-paste source, not an npm dependency, which is the escape hatch: **take the mechanism, throw away the styling.**

### THE OVEREXPOSED LIST — avoid or heavily rework

| Component | Why it's burned |
|---|---|
| **Aurora / gradient-mesh background** (Aceternity `aurora-background`, Magic UI warp/gradient) | The single most recognizable AI-startup tell. Purple-to-blue animated blur behind white text. Instantly dates a site to 2024-2026. |
| **Spotlight / mouse-follow radial glow** | Same origin, same crowd. Also actively harms readability. |
| **Animated beam / connecting lines between logos** | Was a genuinely nice idea for an integrations diagram. Now shorthand for "we have an API." |
| **Infinite marquee logo strip** ("trusted by") | Motion applied to a static fact. Frequently used with logos of companies that are not clients. Also a horizontal-scroll accessibility problem. |
| **Animated gradient border card** (conic-gradient rotating around a card) | Everywhere. Adds nothing. |
| **"Text generate effect" / typewriter reveal** | Simulates an LLM typing. On a portfolio, it is *literally* signalling AI-generated. Delete on sight. |
| **Bento grid** | Not inherently bad — Apple made it good — but the default 2×3-with-rounded-corners-and-a-glow implementation is a template signature. |
| **3D tilt card on hover** | 2021's effect, still shipping. |
| **Number ticker / count-up stat row** | Fine mechanically, but always paired with invented metrics. |
| **Shimmer/shiny button** | The "sheen sweeps across the button" effect. Every AI wrapper has it. |

### The libraries themselves

**Aceternity UI** — https://ui.aceternity.com · verified live 200 · ~87 components
Copy-paste React + Tailwind + Motion. Genuinely well-built and readable source.
*Reach for it when:* you need to see **how** an effect is constructed and then rebuild it in your own visual language.
*NOT for:* shipping a component unmodified. Everything above came from here.
*Status:* active, some components behind a paid Pro template tier.

**Magic UI** — https://magicui.design · https://github.com/magicuidesign/magicui · pushed 2026-08-11 · 22k stars · MIT
150+ components, shadcn-CLI-installable, largest catalogue in this category.
*Reach for it when:* you need a well-implemented primitive fast — its `AnimatedList`, `Marquee`, and `Dock` are cleanly written.
*NOT for:* the "hero section" components, which are the burned ones.
*Status:* very active. The most professionally maintained of the group.

**React Bits** — https://reactbits.dev · https://github.com/DavidHDev/react-bits · pushed 2026-08-15 · **46k stars** · non-standard license
Ranked #2 in JS Rising Stars 2025, ahead of shadcn/ui. Split into JS/TS × CSS/Tailwind variants.
*Reach for it when:* text animation primitives specifically — its split/scramble/decrypt text components are better factored than Aceternity's.
*NOT for:* backgrounds. The WebGL background components are heavy and, again, everyone has them.
*Note:* check the license before commercial use — GitHub reports it as non-standard (NOASSERTION), not MIT.

**Motion-Primitives** — https://motion-primitives.com · https://github.com/ibelick/motion-primitives · **pushed 2026-03-19** · 6k stars · MIT
The most tasteful of the group — restrained, primitive-level (transitions, morphing dialogs, in-view wrappers) rather than whole-hero-sections.
*Reach for it when:* you want mechanism without aesthetic opinion. This is the closest thing here to "unbranded."
*Concern:* **5 months without a push.** Not dead, but the slowest-moving entry. Copy the source into your repo rather than depending on it.

**Cult UI** — https://cult-ui.com · https://github.com/nolly-studio/cult-ui · pushed 2026-07-22 · 6k stars · MIT
Active. Nicer visual taste than Aceternity, smaller catalogue, less overexposed. Its texture/card and dock components are worth studying.
*Verdict:* the best "borrow the whole component" option in this list, precisely because fewer people use it.

**Origin UI** — https://originui.com · verified live 200
Hundreds of shadcn-compatible **form and input** components — not motion. This is the useful one nobody talks about, because inputs are where AI-generated sites are actually worst (unstyled selects, no error states, no loading state on submit).
*Reach for it when:* any real form. *NOT for:* motion.
*Note:* couldn't resolve a canonical public source repo via the GitHub API — distribution is copy-paste from the site. Treat the code as yours once pasted.

**Hover.dev** — https://hover.dev · verified live 200
Paid ($ one-time) React/Tailwind animated components from Tom (Tom Is Loading). Well-made, taught-not-just-shipped. Smaller footprint in the wild than Aceternity, so less burned.
*Verdict:* worth it mainly for the accompanying explanations. If you already read source fluently, the free libraries above cover the same ground.

**shadcn/ui** — https://ui.shadcn.com
Not an animation library and does not belong in this comparison. It is the **unstyled substrate** the others build on. Use it for structure and accessibility (Radix underneath: focus management, escape handling, ARIA), then supply your own visual language on top. This is the correct base layer.

**Uiverse.io** — 403 to automated fetch, site exists. Community CSS-only buttons/loaders/cards. Enormous variance in quality, no curation. Skip.

---

## 4. TYPOGRAPHY

### Variable fonts — the actual state
Google Fonts carries **556 variable families out of 1,944** (28.6%) as of August 2026. Most expose only `wght`. The ones with real, usable multi-axis ranges:

| Family | Axes worth using | Use for |
|---|---|---|
| **Roboto Flex** | 13 axes — `opsz` 8-144, `wdth` 25-151, `wght` 100-1000, `slnt`, **`GRAD`** | Design systems. `GRAD` changes apparent weight **without changing advance width** — the cure for "the button gets wider on hover." |
| **Inter** | `opsz` 14-32, `wght` 100-900 | Interfaces. `opsz` is the reason to use the variable file over the static. |
| **Fraunces** | `opsz`, `wght`, **`SOFT`** 0-100, **`WONK`** 0-1 | Expressive display serif. `WONK` swaps in deliberately irregular glyphs — the anti-generic axis. |
| **Recursive** | **`MONO`** 0-1, `CASL`, `slnt`, `CRSV` | One family for prose *and* code blocks. `MONO` interpolates proportional→monospace. |
| **DM Sans** | `opsz` 9-40, `wght` 100-1000 | Widest weight range on a simple two-axis file. |
| **Merriweather** | `opsz` 18-144, `wdth` 87-112, `wght` 300-900 | Serif body text at real sizes. |
| **JetBrains Mono** | `wght` 100-800 | Code. |

**Fontshare** — https://www.fontshare.com · verified live 200 · Pangram Pangram's free-for-commercial library. **This is the highest-value free font source in 2026** — Satoshi, General Sans, Clash Display, Switzer, Cabinet Grotesk. Variable files, real quality, and far less used than Inter. If a site needs to not look like a template, changing the typeface away from Inter/Geist is the single cheapest move.
**v-fonts.com** — https://v-fonts.com · verified live 200 · the variable-font catalogue with axis previews. Use it to check what axes a family actually ships before committing.

### Foundries + specimen sites worth studying
All verified live 2026-08-24. Study these for **specimen page craft**, not just the fonts — a specimen page is a foundry proving it can typeset, and it is the densest available lesson in scale, tracking, and optical alignment.

- **Dinamo** — https://www.dinamodarkroom.com — the most technically adventurous specimen work on the web; their tools (Font Gauntlet, ABC Dinamo's variable demos) are the best interactive typography on the internet. Study first.
- **Grilli Type** — https://www.grillitype.com — Swiss precision. Study their spacing and how little decoration they need.
- **OH no Type Co** — https://ohnotype.co — James Edmondson. The most *personality* per glyph anywhere. Study for how a display face carries a brand alone.
- **Klim Type Foundry** — https://klim.co.nz — Kris Sowersby's writing about each typeface's design process is the best free typography education available. Study the essays as much as the fonts.
- **Pangram Pangram** — https://pangrampangram.com — the commercial arm behind Fontshare. Excellent specimen layouts, aggressive art direction.
- **Displaay** — https://displaay.net — Czech foundry, very strong contemporary display work and specimen motion.

### Text splitting
- **GSAP SplitText** — now **free**, actively maintained, handles the hard parts (nested markup, screen-reader `aria-label` restoration, responsive re-splitting on resize, masked line reveals via `linesClass` + wrapper). **This is the answer.**
- **SplitType** — `split-type@0.3.4`, published **2023-10-22**. Nearly three years stale. It existed because SplitText cost money. That reason is gone. **Do not use it in new work.**
- **Splitting.js** — `splitting@1.1.0`, published 2024-05-31. Lightly maintained, CSS-var-driven (`--char-index`) which is genuinely elegant for pure-CSS staggers. Acceptable if you refuse a GSAP dependency; otherwise SplitText.
- **Accessibility rule for all three:** splitting text destroys it for screen readers unless you restore `aria-label` on the container and `aria-hidden` the fragments. SplitText does this; the others do not by default.

### text-wrap
**Baseline since October 2024.** `balance`: Chrome/Edge 114+, Firefox 121+, Safari 17.5+ — but Chromium caps it at ~6 lines, so it is a **headline** tool. `pretty`: Chrome/Edge 117+, Safari 26+, **not in Firefox** — no line cap, so it is the **body copy** tool (kills orphans only). Both degrade to normal wrapping with zero breakage. There is no reason not to ship both today:
```css
h1, h2, h3, blockquote { text-wrap: balance; }
p, li { text-wrap: pretty; }
```

### WHAT MAKES WEB TYPOGRAPHY READ AS AMATEUR

1. **Positive letter-spacing on lowercase prose.** Tracking exists to compensate for size and case. Body copy at 16-18px needs **zero or slightly negative** tracking. `letter-spacing: 0.05em` on a paragraph is the loudest amateur signal there is. Positive tracking belongs on **uppercase** and **small caps** only (`0.05-0.12em`), where it is mandatory.
2. **Negative tracking not applied to large display type.** The inverse error. Type set at 72px+ needs `-0.02em` to `-0.04em` or it looks loose and cheap. Every professional site tightens its headlines.
3. **Uniform line-height across all scales.** `line-height: 1.5` on both a 14px caption and a 96px headline is the single most common tell. Line-height must **fall as size rises**: ~1.6-1.7 at 16px, ~1.4 at 24px, ~1.15 at 48px, **~0.95-1.05** at 96px+.
4. **No optical size compensation.** If the family has an `opsz` axis and you aren't varying it, you're shipping display-cut letterforms at caption size (too tight, too thin) or text-cut at display size (too loose, too heavy). Use `font-optical-sizing: auto` at minimum.
5. **Condensed faces used as body copy.** Condensed exists to fit constrained widths in headlines. As running text it destroys word-shape recognition and reads as a cost-saving measure.
6. **OS-dependent font stacks in a designed context.** `font-family: -apple-system, "Segoe UI", Roboto...` means the site looks different on every machine and you have designed none of them. Acceptable for a docs site; disqualifying for a portfolio.
7. **Measure not controlled.** Body text wider than ~75 characters is unreadable and looks unconsidered. `max-width: 65ch` is the whole fix.
8. **Faux bold and faux italic.** Loading only `400` and then using `<strong>` or `<em>` makes the browser synthesise the weight/slant by smearing and shearing outlines. Load the real cuts or use a variable file.
9. **Too many sizes.** A scale with 11 arbitrary font-sizes is not a system. Six steps on a ratio (see §7) is.
10. **Punctuation not typeset.** Straight quotes (`"`) instead of curly (`"`), hyphens where en/em dashes belong, no hanging punctuation on pull quotes. This is the detail that separates "built by a developer" from "designed."

---

## 5. SHADER / GPU-TEXTURE FOR WEB

### Paper Shaders — the closest thing to metalforge.xyz for the web
- **URL:** https://shaders.paper.design · https://github.com/paper-design/shaders
- **What:** 30+ animated WebGL effects — mesh gradients, grain, liquid metal, god rays, halftone, dithering — shipped as **zero-dependency** React (`@paper-design/shaders-react`) or vanilla (`@paper-design/shaders`) components. Tune them visually in the Paper editor, export the props.
- **Version/status:** repo **pushed 2026-08-24** (same day as this audit). 3.4k stars. **Apache-2.0.**
- **Reach for it when:** you need one expensive-looking animated surface at a real bundle cost. This is exactly the metalforge model: curated, parameterised, opinionated, exportable.
- **NOT for:** using the default mesh-gradient preset unmodified — see §3, that *is* the aurora background. Retune the palette hard, or use the grain/halftone/dither effects instead, which are far less exposed.
- **Verdict: the single highest-value find in this report.**

### three.js + React Three Fiber + postprocessing
- **three** `0.185.1` (2026-07-01, MIT) · **@react-three/fiber** pushed 2026-08-24, 31.8k stars · **@react-three/drei** pushed 2026-08-24, 9.8k stars · **pmndrs/postprocessing** pushed 2026-08-24, Zlib
- **The 2026 shift:** for WebGPU projects, use three.js's **native TSL node-based post-processing**, not pmndrs/postprocessing — pmndrs' EffectComposer is WebGL-oriented and several effects need WebGPU-specific rewrites. R3F v9's `Canvas` supports an async `gl` prop specifically because `WebGPURenderer` initialises asynchronously. WebGPU is at ~95% browser coverage with automatic WebGL2 fallback.
- **TSL (Three Shading Language)** is the thing to learn: node-based shader authoring in JavaScript that compiles to both WGSL and GLSL, so one source targets both renderers. Reference: Maxime Heckel's *Field Guide to TSL and WebGPU* (https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/) — the best writing on this.
- **Reach for it when:** the 3D *is* the product — a configurator, a real scene, physical camera motion.
- **NOT for:** a decorative background blob. You will ship 600KB+ to draw a gradient. Use Paper Shaders or a plain canvas.

### ogl — the lightweight WebGL escape hatch
- https://github.com/oframe/ogl · `ogl@1.0.11` published **2025-01-27**, repo pushed 2025-04-13. 4.6k stars. Unlicense.
- **What:** ~50KB minimal WebGL wrapper. Give it a fullscreen quad and a fragment shader and you're done.
- **Reach for it when:** you want to run **one custom fragment shader** at a fraction of three.js's weight — the standard route for a Shadertoy port.
- **NOT for:** scenes, loaders, PBR, anything with a camera you care about.
- **Status caveat:** **~16 months without a release.** It is stable and small enough that this is survivable (you can read the whole library), but it is not actively developed. Vendor it if you depend on it.

### Shadertoy → web workflow
- **Source:** https://www.shadertoy.com — the corpus. The workflow, honestly: Shadertoy shaders use `mainImage(out vec4 fragColor, in vec2 fragCoord)` with `iResolution`/`iTime`/`iMouse` uniforms. Porting = wrap in a standard fragment `main()`, supply those three uniforms, feed a fullscreen quad via ogl or a raw WebGL context.
- **The real constraint nobody mentions:** most Shadertoy shaders are written for a desktop GPU with no thermal budget. A raymarched scene at 60fps on a 4090 is a battery fire on an iPhone. **Always** cap the render at `min(devicePixelRatio, 1.5)`, pause on `IntersectionObserver` exit, and gate on `prefers-reduced-motion`. A fullscreen shader running off-screen is the most common performance bug in "designer" sites.

### CSS Paint API (Houdini) — not worth his time
Chrome/Edge only. **Safari and Firefox have not shipped it and show no signal of doing so.** It has been "coming" since 2018. Anything you would build with it, build with an SVG filter or a canvas.

### Grain / dither / texture — the cheap high-craft move
Three approaches, in order of what to actually do:
1. **A small tiling PNG at low opacity** — the safest and fastest for large areas, especially mobile.
2. **SVG `feTurbulence` as a data-URI background** — resolution-independent, no network request, negligible cost *as a static pseudo-element background*.
3. **Animated `feTurbulence`** — real film grain, and real paint cost on large areas. Confine it to a small element or accept a mobile perf hit.
Reference: https://css-tricks.com/grainy-gradients/. **Caveat:** the grainy-gradient aesthetic is heavily used in 2026 SaaS design. Grain over *photography* still reads as craft; grain over a purple gradient reads as a template.

---

## 6. AWARD / REFERENCE SITES

All HTTP-verified 2026-08-24.

| Site | URL | Status | What it's actually for |
|---|---|---|---|
| **Codrops** | https://tympanus.net/codrops/ | **200 — active** | The single best free tutorial source for the techniques in §1-2 and §5. Manoela Ilic's demos are the reference implementations most award sites are downstream of. **Read this weekly.** |
| **Awwwards** | https://www.awwwards.com | 200 — active | SOTD archive is useful as a *survey of the current consensus*, which is exactly why it is also a slop generator — the jury rewards a house style. Study it to know what everyone is doing, then don't do it. |
| **Godly** | https://godly.website | 200 — active | Tightest curation of the galleries; the go-to for high-end agency reference. Best signal-to-noise. |
| **Land-book** | https://land-book.com | 403 to bots, **site live** | Now far beyond landing pages — dedicated **Sections**, **Motion**, **Headlines**, and **OG Image** galleries. The Sections gallery is the most practically useful thing in this table: browse by component, not by whole site. |
| **Refero** | https://refero.design | 200 — active | Real shipped **product** UI (flows, empty states, settings screens), not marketing pages. The only entry here that helps with the un-glamorous 80% of a product. |
| **Minimal Gallery** | https://minimal.gallery | 200 — active | Narrow by design: restraint, whitespace, typographic sites. Use when a project is drifting toward decoration. |
| **httpster** | https://httpster.net | 200 — active | Opinionated, personal, biased toward independent studios. Least algorithmic taste in the list. |
| **SiteInspire** | https://www.siteinspire.com | active | Best *filtering* (by type, style, subject) of any gallery. |

**How to use these without absorbing the house style:** never browse for "a nice site." Browse for a *specific unsolved problem* — "how do people handle a 40-item project index," "what does a good pricing table footer look like." Open-ended browsing is how you end up with the aurora background.

---

## 7. THINGS HE ISN'T CONSIDERING

This is the section that matters. Everything above is available to everyone. These are the levers almost nobody pulls.

### 7.1 Page-transition choreography — what happens BETWEEN pages
The highest-leverage untapped item. A site where every navigation is a hard white flash cannot feel expensive no matter how good the pages are. Three routes:
- **View Transitions API** (§1) — cheapest. `view-transition-name` on a project thumbnail and on the project page's hero image, and the browser morphs one into the other across a full page load. Six lines. Works today in Chromium + Safari.
- **Swup** — https://github.com/swup/swup · pushed 2026-08-14 · 5.2k stars · MIT · **the maintained choice.** ~12KB, plugin system, preload + cache, works with any backend.
- **Barba.js** — https://github.com/barbajs/barba · **pushed 2024-12-02** · 13k stars. Two years without a push. Still the most-referenced in tutorials, which is why people keep picking it. **Prefer Swup.**
- **Taxi.js** — https://taxi.js.org · pushed 2025-11-01 · 639 stars · BSD-3. The maintained successor to the abandoned Highway.js. Fine, but smaller community than Swup.
- **The craft point:** the transition's job is **continuity of the thing you clicked**, not a curtain wipe. If the user clicks a red square, a red square should still be on screen 200ms later. Anything else is a loading screen with a costume on.

### 7.2 Loading states as designed moments
Documented finding: teams switching spinners → skeleton screens report **30-50% perceived-performance gains with zero backend change**; users rate skeleton-loaded pages ~30% faster at identical real load times. The mechanism: **a spinner draws attention to the wait, a skeleton draws attention to the content.**
- **Rule:** skeletons for *content* (feeds, grids, dashboards, search). Spinners only for *short discrete actions* (save, auth, payment) where there is no shape to preview.
- **The craft version:** the skeleton should be the *actual layout* — same grid, same aspect ratios, same line counts — so nothing shifts when content lands. A generic grey pill skeleton that reflows on load is worse than a spinner.
- **The thing nobody does:** design the **first paint** of a site as a deliberate moment (a held logo, a mask reveal, a counter) *only if* it's under ~800ms and *never* on repeat visits. An unskippable 3-second preloader in 2026 is a hostile act.

### 7.3 Cursor design
- **Gate it correctly:** `@media (any-hover: hover) and (pointer: fine)`. A custom cursor on a touchscreen leaves stylus and touch users with a stuck or invisible pointer.
- **Never hide the native cursor without replacing it at equal or greater size.** Users with low vision track the pointer by size and contrast. A 6px dot is an accessibility regression sold as taste.
- **Where it actually earns its place:** *state communication* — the cursor becoming "DRAG", "PLAY", "VIEW" over the relevant region. That is information. A trailing blob is decoration and reads as 2019.
- **Motion+ (§1) ships a well-built cursor primitive** if he wants one that isn't hand-rolled.

### 7.4 Sound design / UI audio
Almost entirely unexploited on the web, and the reason is a real one: autoplay policies mean audio requires a user gesture, and unsolicited sound is hostile.
- **The rule that makes it work:** sound must be **paired with a visible state change or haptic**, must be **user-controllable and off by default**, and must be **one-shot for discrete events**, looped only for ongoing states.
- **Library:** Howler.js for audio sprites (one file, many cues, no per-cue request latency).
- **Where it's worth it:** a portfolio's showreel, a product configurator, a game. Not a services page.

### 7.5 Haptics on mobile web — read this before believing anything else
- **Android:** `navigator.vibrate()` works in Chrome. Real, simple, done.
- **iOS: Safari has never implemented the Vibration API.** The widely-shared workaround (`ios-haptics`, https://github.com/tijnjh/ios-haptics, pushed 2026-08-07) exploits a side-effect of `<input type="checkbox" switch>` — creating one hidden, toggling it, removing it, which fires the Taptic Engine. It worked **iOS 17.4 through 26.4**.
- **Apple patched the behaviour in iOS 26.5.** JS-triggered haptics on current iOS are unreliable-to-dead.
- **Practical position:** treat haptics as an Android-only progressive enhancement. A **Web Haptics API** proposal exists at WICG but is not shippable. Do not design an interaction that depends on it.

### 7.6 Focus-visible and keyboard motion
Almost universally neglected, and it is a *visible* quality signal to anyone who tabs.
- `:focus-visible` (not `:focus`) so mouse clicks don't draw rings but keyboard does.
- **Never `outline: none` without a replacement.** The replacement must be visible on **every** background the element sits on — this is why `outline` with `outline-offset` beats `box-shadow` (outline follows border-radius and is immune to `overflow: hidden`).
- **The craft move:** animate the focus ring's *travel* between elements the way a good OS does, and make sure skip-links, modals, and page transitions **move focus deliberately**. A View Transition that doesn't move focus leaves a keyboard user on a destroyed element.

### 7.7 prefers-reduced-motion as a design variant, not an off switch
The documented best practice in 2026 is explicitly **"provide meaningful alternatives rather than simply removing animation."**
- `@media (prefers-reduced-motion: reduce) { * { animation: none !important } }` is a *failure* mode: elements that animate in from `opacity: 0` now never appear.
- **The correct pattern:** reduced-motion is a second design. Cross-fades replace travel. Instant-but-still-staggered replaces scrubbed. Static poster replaces autoplaying video. Lenis is disabled, native scroll takes over, and the layout still reads.
- Coverage must include CSS transitions, CSS animations, JS animation, **scroll-driven effects, and video autoplay**.
- Also: **offer an in-page toggle.** Users on shared machines, or who want motion sometimes, can't reach the OS setting.
- Motion has `useReducedMotion()`; Tailwind has `motion-reduce:`; Lenis honours it natively.

### 7.8 Dark/light as two designs, not a token swap
Inverting `--bg` and `--fg` produces a bad dark mode every time, for physical reasons:
- **Pure white on pure black causes halation** — the text blooms. Use `#0a0a0b`-ish and `#e8e8ea`-ish, never `#000`/`#fff`.
- **Saturated colours read brighter on dark.** An accent that is perfect on white is glaring on black. Dark mode needs its own accent, usually 10-20% desaturated and slightly lighter.
- **Elevation inverts.** In light mode, higher = shadow. In dark mode, shadows are invisible; higher = **lighter surface**. Copying a shadow scale into dark mode produces flat mush.
- **Images need treatment.** Photography with a white background punches a hole in a dark page. Either mask, or add a subtle overlay, or shoot/crop for both.
- **Borders:** a `1px` border that works on white is invisible on near-black; dark mode needs `rgba(255,255,255,0.08-0.12)`, not a token flip.
- **Test:** screenshot both, desaturate both, and check that the *value structure* — what draws the eye first, second, third — is the same. If the hierarchy changes, it's a token swap, not a design.

### 7.9 Image treatment as a brand decision
The fastest way to make disparate content look like one site. Pick **one** and apply it universally: a duotone, a consistent grade, a uniform grain, a fixed aspect-ratio set, a consistent border-radius, a shared halftone/dither. Paper Shaders' halftone and dither effects (§5) do this at runtime. **The tell of an AI-assembled site is that every image has a different treatment** because each came from a different source.

### 7.10 The invisible stuff
- **Spacing scale on a ratio.** Not `4, 8, 12, 16, 20, 24, 28, 32...` (linear = no hierarchy). Use a modular scale — `4, 8, 12, 16, 24, 32, 48, 64, 96, 128` (roughly 1.5×) — so gaps are *distinguishable* rather than merely different. Same for type: six steps on ~1.25 (interfaces) or ~1.333 (editorial), not eleven arbitrary sizes.
- **Optical alignment ≠ mathematical alignment.** A round element (circle, "O", a play triangle) set to the same geometric edge as a square one *looks* inset. Round shapes overshoot by 1-3%; a play triangle inside a circle must be nudged right by ~8% of its width to look centred. This is the difference between "aligned" and "looks right."
- **Baseline grid.** Set `line-height` in a way that all text sits on a common rhythm (e.g. everything a multiple of 4px or 8px) so columns of different sizes line up horizontally. Almost nothing on the web does this, which is exactly why doing it registers as craft.
- **Contrast beyond WCAG minimum.** WCAG 2.x's 4.5:1 is **known to be functionally unreadable** for thin type near black. **APCA** — https://git.apcacontrast.com — measures perceived lightness difference weighted by font size and weight, matching how typography actually behaves. **Status: still a candidate method, removed from the WCAG 3 Working Draft in July 2023, WCAG 3 itself is still a Working Draft in 2026, APCA is not an adopted standard.** So: **ship WCAG 2.2 for compliance, design to APCA for quality.** Practical floor: `Lc 75` for body text, `Lc 60` for large/bold, and never rely on the 4.5:1 pass alone for small light-grey text.
- **Optical size + hover stability.** Use `GRAD` (Roboto Flex) or a text-shadow trick rather than `font-weight` on hover, so nothing reflows.
- **Reduced data / slow connections.** `@media (prefers-reduced-data: reduce)` and `navigator.connection.saveData` — skip the WebGL hero, serve the poster.
- **Print stylesheet.** Nobody does it. Anyone who prints a case study immediately learns whether the site was designed or assembled.

### 7.11 The one nobody names: motion *timing* discipline
Across every library above, the same handful of numbers separate professional from amateur:
- **UI feedback** (button press, toggle, tooltip): **80-150ms**. Anything over 200ms feels laggy.
- **Element enter/exit** (modal, drawer, dropdown): **200-300ms** in, **150-200ms** out. **Exits are always faster than entrances** — the user has already decided.
- **Page/scene transitions:** **400-600ms** total, including any overlap.
- **Easing:** things entering use **ease-out** (fast start, settle). Things leaving use **ease-in** (accelerate away). `ease-in-out` on a UI element is almost always wrong. `linear` is only for continuous/looping motion (spinners, marquees) and scroll scrub.
- **Never animate `width`, `height`, `top`, `left`, or `margin`.** Only `transform` and `opacity` (and `filter`, carefully). This is not a perf nicety — layout-animating properties jank visibly at 60fps and that jank is what "cheap" *is*.

---

## THE ANTI-SLOP RULES

Fifteen rules. Each is checkable on a rendered page or in a diff — no vibes.

1. **At most one full-viewport animated gradient/aurora/mesh background per site, and it must not be a library default.** Check: search the CSS/JSX for `aurora`, `spotlight`, `beam`, `warp`. If any preset palette is unchanged from the source library, it fails.
2. **Body prose has zero or negative letter-spacing.** Check: computed `letter-spacing` on every `p`, `li`, and long-form `div` is `normal` or negative. Positive tracking is permitted **only** on elements whose computed `text-transform` is `uppercase`.
3. **Line-height decreases as font-size increases.** Check: compute `line-height / font-size` at the smallest and largest type on the page. The largest must be lower. A flat 1.5 across all scales fails.
4. **Display type ≥48px carries negative tracking of at least `-0.02em`.**
5. **No typewriter / "text generate" / character-by-character reveal anywhere on the site.** Check: grep for `TextGenerate`, `Typewriter`, `TypeAnimation`. Zero hits required. It literally signals machine-generated.
6. **Scroll-linked reveals travel ≤24px and fade from ≥0.5 opacity.** Check: any `translateY` in a scroll trigger greater than 24px, or an `opacity: 0` start, fails. Big travel from nothing is the template signature.
7. **Exit animations are faster than entrance animations for the same component.** Check: for each modal/drawer/dropdown, exit duration < enter duration.
8. **Only `transform`, `opacity`, and `filter` are animated.** Check: grep animation/transition property lists for `width`, `height`, `top`, `left`, `margin`, `padding`. Zero hits.
9. **`prefers-reduced-motion: reduce` produces a complete, correct page — not a broken one.** Check: enable it, hard-reload, scroll the whole page. Every element that animates in must be visible, in position, and legible. Nothing may remain at `opacity: 0`. A global `animation: none !important` fails this test.
10. **The typeface is not Inter, Geist, or the system stack** — unless there is a written reason. Check: computed `font-family` of `h1` and `p`. Fontshare/Pangram/Klim/OH no/Dinamo all qualify; the default of every AI scaffold does not.
11. **Every image on the site shares one treatment.** Check: screenshot the full page, desaturate it. If backgrounds, grades, grain, radii, or aspect ratios visibly differ between images, they came from different places and it shows.
12. **Dark and light have different accent values and different elevation logic — not one inverted token set.** Check: diff the two token blocks. If the only difference is `--bg`/`--fg` swapped, it fails. Dark mode must not use `#000` or `#fff`, and must convey elevation by surface lightness, not shadow.
13. **Navigating between two pages preserves at least one element on screen.** Check: click a project card and record. If the clicked thing vanishes into a white flash before the next page paints, it fails. `view-transition-name` on the shared image is the minimum bar.
14. **Content loading shows the real layout, not a spinner.** Check: throttle to Slow 3G. Any content region (grid, feed, list) that shows a centred spinner instead of a shape-matched skeleton fails. Discrete actions (save/auth/pay) may use a spinner.
15. **Tab through the entire page with the keyboard.** Every focusable element must show a visible focus ring on *its own* background, focus order must match visual order, and modals/transitions must move focus deliberately. `outline: none` with no replacement is an automatic fail.

**Bonus rule 16 — the marquee test.** If the site contains a horizontally scrolling strip of client/partner logos, it must be: (a) real clients, (b) pausable, and (c) not the only motion on the page. If it fails any of the three, delete it. It is currently the most common decoration-in-place-of-substance on the web.

---

## PRIORITY READING ORDER

1. **Codrops** — https://tympanus.net/codrops/ — weekly, forever. Everything else is downstream.
2. **Klim's typeface essays** — https://klim.co.nz — the best free typography education on the internet.
3. **Maxime Heckel's blog** — https://blog.maximeheckel.com — the deepest current writing on shaders/TSL/WebGPU for the web.
4. **Dinamo's tools** — https://www.dinamodarkroom.com — interactive variable-font craft.
5. **Land-book Sections gallery** — https://land-book.com — browse by component, never by whole site.
