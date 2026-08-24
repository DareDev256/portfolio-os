# September Portfolio Pass — Blindspot Audit

**Date:** 2026-08-24 · **Scope:** read-only. Nothing on any surface was modified.
**Method:** live fetch of all five surfaces, GitHub + PyPI APIs, the served résumé PDF, and local reads of three repos.

---

## 0. The headline

You asked what you're missing. The answer is not a missing surface. It is this:

> **Your portfolio's central thesis is "I don't inflate numbers" — and your own numbers contradict each other in four places, one of which is one click away from the sentence that makes the claim.**

Everything else in this document is downstream of that.

---

## 1. The live surfaces — what each claims, and who it's for

All five return HTTP 200.

| Surface | Claim | Audience | Verdict |
|---|---|---|---|
| `jamesdare.com` | "I build systems that run without me." 7 "cleared gates" + contact | **Recruiter** | Keep. This is the front door. |
| `jamesdare.com/os` | "Passion OS v4.11.0" — vanilla-JS cyberpunk desktop | Nobody specific | **Demote to a demo inside a case study** |
| `passion.jamesdare.com` | "Passion — Autonomous AI Agent", first-person, 10 arcade games | Unclear — fans? | **DELETE** |
| `passion-dashboard.vercel.app` | "PACT — Passion Agent Command Terminal", demo mode | Technical evaluator | **Keep, but move to `jamesdare.com/passion` and gate it behind a case study** |
| `tdotssolutionsz.com` | "We direct the film. We build the machine that sells it." | Creative clients | Keep, separate lane. Correctly separate. |

### Direct contradictions between surfaces

`jamesdare.com` and `passion.jamesdare.com` describe **the same system** with **different numbers**:

| Figure | jamesdare.com | passion.jamesdare.com | Résumé PDF (served from jamesdare.com) | Ground truth |
|---|---|---|---|---|
| Passion modules | **98** (meta description + hero) | **92** | **130+** | — |
| Lines of code | **66K** | **109K** | **100K+** | — |
| Repos managed | **63** (43 active) | **47** | — | — |
| fcp-mcp-server stars | **90** | — | **87** | **94** (GitHub API, 2026-08-24) |
| fcp forks | **18** | — | — | **19** (API) |
| Installs/month | **1,928** | — | **~1,600** | — |
| Public repos | — | — | **34** | **24** (API) |
| Second Opinion sources | **51** | — | **52** | — |
| PACT version | — | — | **v0.111** | **v0.117.0** (`package.json`) |

This is the kill shot, and it is self-inflicted. `jamesdare.com` Gate 02 says, verbatim:

> "the numbers on this page come from the GitHub and PyPI APIs, not from a resume that has claimed this same count as 50+, 70, 73 and 74."

The résumé linked from the footer of that same page says **87**. The API says **94**. So the sentence bragging about API-sourced numbers is (a) falsified by the PDF one click away and (b) itself stale — the "API number" was hardcoded at some point and has drifted 4 stars.

**A recruiter who checks one number finds three. That is worse than never making the claim.** The claim converts a small staleness problem into a credibility problem, because it invites the check.

*Evidence: `curl https://api.github.com/repos/DareDev256/fcp-mcp-server` → 94 stars / 19 forks; `curl .../users/DareDev256` → 24 public repos; `pdftotext` of `https://jamesdare.com/resume/JamesOlusoga-AI-Engineer.pdf`.*

---

## 2. The fragmentation problem

**More surfaces is not the problem. The problem is that two of the four have no inbound path at all.**

I grepped every `href` on the served `jamesdare.com` homepage. The complete outbound set:

```
/coldopen  /fandom-flow  /os  /resume/JamesOlusoga-AI-Engineer.pdf
betmetrics.ca  calendly.com/tdotssolutionsz/30min  github.com/DareDev256
github.com/DareDev256/fcp-mcp-server  linkedin.com/in/james-olusoga
prompts.tdotssolutionsz.com  second-opinion-eta.vercel.app
shopbayhq.com  tdotssolutionsz.com
```

**`passion.jamesdare.com` is not linked. `passion-dashboard.vercel.app` is not linked.** The string "passion-dashboard" appears exactly twice on the page — both inside an `aria-label` describing an SVG node graph. Your two best pieces of evidence that the agent is real are unreachable from the page that asserts it is real.

Meanwhile `passion.jamesdare.com` links *out* to "Open PACT Dashboard" and "James's Portfolio". So the link graph runs backwards: the orphan points at the front door, and the front door points nowhere.

### Where a recruiter should land, and the one thing they walk away with

**Land:** `jamesdare.com`.
**Walk away knowing:** *"He shipped an autonomous agent that has been running unattended for months, and he can prove it with an artifact I can click."*

Right now they walk away with *"he says a lot of impressive things and there are a lot of numbers."* Assertion, not proof.

### The path I'd cut

```
jamesdare.com  (front door — unchanged)
   └── /passion   ← ONE route. The dashboard demo, wrapped in a case study.
                    Absorbs passion.jamesdare.com (deleted) and /os (demoted
                    to an embedded artifact inside the case study).
   └── /resume    (regenerated from the same figures source as the site)
   └── tdotssolutionsz.com  (separate lane, correctly separate)
```

Three destinations. Not five.

---

## 3. Built and not wired

### The emotion set — the clearest waste

`passion-site/` holds 10 emotion GIFs + a portrait (≈13.9 MB). All 10 serve HTTP 200 on prod. The dashboard has an even bigger set: **`public/animations/` holds 17 emotion states in both `.gif` and `.webp`** (webp is 3-5× smaller and already generated).

`components/stage/PassionStage.tsx:35-51` maps all 17 webp states — `working`, `focused`, `frustrated`, `thinking`, `eureka`, `powered_up`, `alert`, `shocked`, `curious`, `offended`, `pleasant`, `exhausted`, `lovestruck`, `mischievous`, `celebrating`, `crying`, `laughing`.

But the NPC dialogue band on the OS home renders a **static PNG**:

```tsx
// components/dialogue/DialogueBox.tsx:129-131
<Image
  src={`/emotions/${currentLine.expression}.png`}
```

`public/emotions/` has 24 static PNGs; `public/animations/` has 17 animated webp of the same states, already optimized, unused by the dialogue band. `DialogueLayer.tsx:50-72` already drives distinct expressions per event (`alert`, `frustrated`, `clever`, `powered_up`, `celebrating`...). **The wiring is done. The state machine is done. It just points at the wrong file extension.** Changing `.png` → `.webp` and the directory is close to a one-line change for a visibly better artifact.

### Orphaned components in `passion-dashboard`

Zero external references (grepped across `app/`, `components/`, `lib/`):

- `components/os/OsBrainBand.tsx`
- `components/os/OsEcosystemBand.tsx`
- `components/os/OsNeedsYouBand.tsx`
- `components/os/OsRosterBand.tsx`
- `components/avatar/ActivityIndicator.tsx`

Five built components rendering nowhere. Either wire or delete — dead components are how the last audit's "56 of 95 panels reading dead JSON" happened.

### `jamesdare.com` hero reel

`dist/assets/system/reel/` holds **20 mp4 + 20 jpg**. `index.html` references **12** mp4s (via data attributes, swapped by `js/hero-reel.js`) and 12 jpg plates. 8 videos built and unreferenced. *(Low priority — flagging for completeness, not action.)*

---

## 4. The recruiter read — 90 seconds on `jamesdare.com`

**Where attention actually goes, in order:**

1. `AI SOLUTIONS ENGINEER · TORONTO` — good. Instantly legible.
2. **"I build systems that run without me."** — strong line. Best copy on the page.
3. "Fourteen years shipping to real audiences. First directing music video, now engineering the system that runs the rest." — *this is where you lose them.* Two sentences in, a hiring manager for an AI Solutions Engineer role is being asked to reconcile a music-video career. It is genuinely your most interesting differentiator, and it is in **the worst possible position** — before any proof of the technical claim. It reads as a pivot story before it has earned the right to be one.
4. The stat block: `63 repos / 98 modules · 66K LOC / 12 client sites / 90 stars · 1,928 installs / 25,332,774 views`. Six numbers, no hierarchy, all equal weight. **25,332,774 views sits beside 66K LOC as if they measure the same kind of thing.** A recruiter cannot tell which one they're supposed to be impressed by, so they're impressed by none.
5. `ENTER →` — an interstitial before the content. On a hiring page, an "enter" gate is a tax.

**Your self-assessment is correct and I'd sharpen it:** the depth is real and the legibility is poor. But the specific failure isn't "too technical." It's **undifferentiated density**. Seven "cleared gates" all styled identically, each with three stats and a "THE DECISION" block. Gate 01 (BetMetrics — real money, real users) and Gate 06 (101 Films) are given the same visual weight. Nothing tells the reader *"if you read one, read this one."*

The "THE DECISION" framing is genuinely excellent — problem → constraint → decision is exactly the case-study shape. **You already invented the right format and then applied it seven times at equal weight, which cancels it out.**

**First-screen fix, in one line:** cut the stat block from six numbers to two, promote one gate to hero position, move the 14-years-of-film line *below* the first proof point where it becomes a flex instead of a question.

---

## 5. What is missing entirely — verified, not assumed

| Candidate | Status | Evidence |
|---|---|---|
| Case-study depth (problem → constraint → decision → outcome) | **Partially present** — "THE DECISION" blocks are the right shape but ~40 words each and flattened by repetition | homepage, 7 gates |
| Writing / blog | **Absent** | `/blog`, `/writing`, `/notes` all return the homepage |
| Visible OSS contribution graph | **Absent from site.** GitHub profile is real (24 public repos, 94-star flagship, 11 followers) but never surfaced | `api.github.com/users/DareDev256` |
| Video / demo walkthrough of the agent running | **Absent.** `grep -c '<video' index.html` → **0** in the gates section. No screen recording of Passion executing anything, anywhere on any surface | — |
| Résumé-to-site consistency | **FAILS on 8 figures** | §1 table |
| Proof the agent works vs. asserts it | **Absent.** Closest is the "SNAPSHOT LOG" — explicitly labelled `SNAPSHOT TAKEN 2026•08•22 · STATIC` | homepage |
| Contact conversion path | **Present and good.** Email + Calendly + a rate-limited LLM chat | `api/chat.js`, `api/_limit.js` |
| Social proof / testimonials | **Absent.** `grep -ci "testimonial\|client says" index.html` → **0** | — |
| SEO / OG on new routes | **BROKEN on both new surfaces** — see below | — |
| Analytics on deep pages | **Absent on 2 of 4.** GA4 `G-TG10CNCMJY` on jamesdare.com + tdotssolutionsz.com only. Nothing on passion.jamesdare.com or the dashboard | — |

### OG / SEO defects (all verified live)

- **`passion-dashboard.vercel.app` OG image is `https://localhost:3000/passion-portrait.png`.** Every LinkedIn/Slack/Discord share of your newest work renders a broken card. *(`app/layout.tsx:41,47` — relative path resolved against a localhost `metadataBase`.)*
- **`passion.jamesdare.com/og-image.png` → HTTP 404.** Blank card on every share.
- **`passion-dashboard.vercel.app/robots.txt` → 404.** No indexing control on a public demo.
- **`jamesdare.com` apex 307-redirects to `www`, but `<link rel=canonical>` points at the apex.** Self-conflicting canonical.
- **Every path on `jamesdare.com` returns HTTP 200 with the homepage body** (44,327 bytes for `/blog`, `/case-studies`, and `/zzzznonsense` alike). No 404. Soft-404s across the whole namespace.

### Security headers — the ironic one

```
jamesdare.com:   strict-transport-security: max-age=63072000     ← that's ALL
dashboard:       CSP, HSTS+preload, X-Frame, nosniff, Referrer-Policy, Permissions-Policy
```

Your **hiring page has no CSP, no `X-Content-Type-Options`, no `X-Frame-Options`, no `Referrer-Policy`, no `Permissions-Policy`** — and weak HSTS (no `includeSubDomains`, no `preload`). Your own security protocol calls these non-negotiable. A security-minded interviewer runs securityheaders.com on your domain during the screen; this is a 20-minute fix that removes an unforced error, and the dashboard proves you already know how.

---

## 6. The honest risk list — what could backfire

**1. The number contradictions (§1). Severity: high.** Already covered. This is the one that costs you an offer, because inconsistency across your own artifacts reads as carelessness at best.

**2. Anime/character branding — the balanced read you asked for.**

Who it *wins*: startups, dev-tools companies, AI labs, anyone hiring a Forward Deployed Engineer where personality and craft are the product. At those places it's a moat — nobody else's portfolio looks like this and it demonstrates taste plus follow-through.

Who it *loses*: enterprise, banks, insurance, government, big consultancies, and — critically — **third-party agency recruiters**, who screen on pattern-match and are the highest-volume channel in a job hunt. `passion.jamesdare.com` opens with **"feeling mischievous"** over an animated character, in first person, with a chat widget saying *"Most people never talk to me."* That is not a filter, it is a wall for a large share of Toronto hiring.

**The resolution is placement, not deletion.** The character belongs *inside* the `/passion` case study, where it reads as "he built an agent with a personality layer and shipped it" — a design decision. It does not belong on a standalone domain a recruiter can land on cold with no framing. Right now the domain has no inbound link from your own site (§2), so the only way anyone reaches it is by finding it — meaning it can only ever hurt you.

**3. Demo-mode credibility.** `lib/demo-os-data.ts` is honest and well-built — timestamps are relative so freshness never rots, and the fixture board deliberately mixes `live`/`aging`/`stale`/`dead` (lines 36-40). Genuinely good work. **But nothing on the deployed page tells the viewer it's a fixture.** A sharp evaluator either assumes it's live (and you've over-claimed) or spots that it's fake (and you look like you were hiding it). A one-line "Demo data — the real board reads a Mac Mini" banner converts the risk into a credibility *gain*, because the honesty is the differentiator.

**4. `/os` is stale.** Serves `v4.11.0` while the ecosystem is at v4.94. It is linked from the homepage twice ("OPEN THE DESKTOP →").

**5. The `SNAPSHOT · STATIC` label.** Honest, and I respect it — but "here is a static picture of a live system" on the page arguing the system is autonomous is an argument against itself. Replace with a 30-second screen recording of it actually running. Motion of a real terminal beats any static number on this page.

**6. Slop risk: low.** Copy is specific, sourced, and voiced. "A vault, a mission file, a streetlight after dark" is not generated prose. This is a genuine strength — don't let a cleanup pass sand it off.

**7. Dead links: none.** All 7 outbound links return 200. Résumé PDFs (both variants) serve correctly.

---

## THE SEPTEMBER CUT

Ranked by impact per hour.

### 1. Reconcile every number to one source — and stop hardcoding them · 3h
**Move:** Build one `data/figures.json`. Generate the GitHub/PyPI figures at build time from the APIs. Regenerate the résumé PDF from it. Fix the 8 divergences in §1.
**Why it matters:** This is the only item that can independently lose you a role. A recruiter who spots one mismatch re-reads everything else as inflated. And your page *invites* the check.
**Replaces:** All hardcoded stats in `index.html`, `passion-site/index.html`, and the résumé.

### 2. DELETE `passion.jamesdare.com` · 1h
**Move:** 301 the domain to `jamesdare.com/passion`. Move the emotion GIFs into the dashboard repo (which already has better `.webp` versions of all 17).
**Why it matters:** It contradicts your main site on three figures, has a 404 OG image, no analytics, no inbound link, and is your single highest-risk surface for enterprise/agency recruiters. It can currently only cost you.
**Replaces/deletes:** One entire domain and 13.9 MB of duplicated assets.

### 3. MERGE `/os` into the `/passion` case study · 2h
**Move:** Stop linking `/os` as a peer destination. Embed it as one artifact inside the case study, captioned. Fix the `v4.11.0` string or remove the version.
**Why it matters:** Five destinations is four too many for 90 seconds. `/os` currently competes with the dashboard to be "the agent surface" and loses — the dashboard is newer, better, and Next.js.
**Replaces:** Two homepage links and a top-nav item.

### 4. Ship `/passion` — one route, with a 30-second screen recording · 6h
**Move:** Case-study page: problem → constraint → decision → outcome, with the dashboard demo embedded, a labelled "demo data" banner, and **a screen recording of Passion executing a real job and posting to Discord.**
**Why it matters:** This is the missing proof. Every surface currently *asserts* the agent runs. Thirty seconds of it actually running is worth more than all six hero stats combined — and it's the only asset here no other candidate can produce.
**Replaces:** The static `SNAPSHOT LOG`, the orphaned dashboard URL, `passion.jamesdare.com`.

### 5. Rebuild the first screen — six stats down to two, one gate promoted · 3h
**Move:** Cut the stat block to two numbers (suggest: `25.3M views directed` + `94 stars / 1.9K installs/mo` — one from each career, both externally verifiable). Promote BetMetrics to hero weight. Move the 14-years line below the first proof point. Kill the `ENTER →` gate.
**Why it matters:** Seven equal-weight gates = zero emphasis. Tell the recruiter what to read first or they read nothing.
**Replaces:** The six-stat block and the interstitial.

### 6. Fix OG + SEO on the new surfaces · 1h
**Move:** Set `metadataBase` in `app/layout.tsx` (kills the `localhost:3000` OG image). Add `robots.txt` to the dashboard. Fix the apex/www canonical conflict. Add a real 404.
**Why it matters:** Highest-leverage hour here. Right now every share of your newest work renders a broken card — and sharing a link is exactly what a recruiter does when passing you to a hiring manager.
**Replaces:** Nothing. Pure defect fix.

### 7. Wire the animated emotions into the NPC dialogue band · 1h
**Move:** `DialogueBox.tsx:130` — point at `/animations/passion-{state}.webp` instead of `/emotions/{state}.png`. Delete or wire the five orphaned components (`OsBrainBand`, `OsEcosystemBand`, `OsNeedsYouBand`, `OsRosterBand`, `ActivityIndicator`).
**Why it matters:** A one-line change turns a static avatar into a system that visibly reacts to its own state — which is the thesis of the whole dashboard. Cheapest "wow" available.
**Replaces:** 24 static PNGs; deletes 5 dead components.

### 8. Security headers on `jamesdare.com` · 1h
**Move:** Port the dashboard's `middleware.ts` header set into `vercel.json`. CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS `includeSubDomains; preload`.
**Why it matters:** A security-conscious interviewer will run a header scan on the domain of a candidate claiming security hardening on their résumé. Removes an unforced own-goal.
**Replaces:** Nothing. Defect fix.

---

**Total: ~18 hours.** Deletes one domain, demotes one route, removes five dead components and 24 redundant assets. Net destinations: 5 → 3.
