# Skazka Trail Questionnaire — Visual Design

> **Status: ANSWERED & SHIPPED — July 22, 2026.** Q1=C (consistent frame, per-tale accent), Q2=D (widen column + background treatment), Q3=B (card grid tale-select), Q4=C (cross-fade + button feedback), Q5=B (display face for titles/endings only), Q6=B (tale-specific accent colors), Q7=B (light-touch debug view). Q8 free space left blank. Shipped same day: per-tale accent colors, wider desktop layout, card-grid tale-select, scene motion — see `drafts/skazka-trail/` and [Dev Log](../dev-logs/arcade.md). Companion to [Skazka Trail Questionnaire — Design Decisions](skazka-trail-design-decisions.md) (narrative/mechanic decisions, all answered) — this one covers the **presentation-only pass** Yev asked for the same day: "a real visual design pass for both mobile and laptop screens — it currently reads fine but plain, and laptop in particular just centers the same narrow mobile column in a sea of empty space instead of using the extra room well." See [Skazka Trail — Concept & Directions](../../games/skazka-trail/plans/concept-and-directions.md) for the game itself and [Skazka Trail Backlog](../../games/skazka-trail/backlog.md) for what's shipped.
>
> Fill this in (~10 min). Mark checkboxes with `x`. ⭐ marks the agent's recommendation, not a pre-picked answer — check whichever option you actually want.

## Non-negotiable, regardless of answers

- **Zero-backend static site** — no build step, no server, no runtime AI.
- **`engine.js` and both content packs (`tales/vasilisa.js`, `tales/morozko.js`) stay presentation-agnostic** — this pass is CSS/HTML only. The one exception already in-bounds: `index.html`'s small bootstrap script already reads each tale's existing `id`/`title` to build the select screen, so having it set a `data-tale="<id>"` attribute for CSS hooks is fine — no new content-pack fields, no tale-aware branching inside `engine.js` itself.
- **Every existing screen keeps working exactly as it does today, functionally** — both tales, tale-select, `?debug=1`, and the "story so far" panel. Presentation changes only.
- **Mobile comfort can't regress** — today's 44px+ touch targets (choice buttons, primary button) and single-hand reachability hold no matter what desktop gains.

---

## Q1 — Visual identity: per-tale motifs vs. one consistent identity 🔑

*Current state: identical palette/type for both tales, no per-tale variation at all.*

- [ ] **A** — **One fully consistent identity.** Same palette, type, and layout regardless of tale — the frame never changes, only the words do. Cheapest to extend as the anthology grows (a new tale is zero design work).
- [ ] **B** — **Distinct per-tale motifs** (the original Q7=B idea) — a cold-blue wash for Morozko, a hut/forest wash for Vasilisa, fully different accent + maybe background treatment per tale. Richest "anthology" feel, but every future tale now carries a small design task, not just a writing task.
- [x] **C** ⭐ — **Middle path** — one consistent frame and type, but the accent color (buttons, links, ending-screen emphasis) shifts per tale. Most of B's "this tale feels distinct" payoff for close to A's ongoing cost. Pairs with Q6.
- [ ] **Write-in:** ______

## Q2 — How the laptop/desktop layout uses its width 🔑

*Current state: `#app` is capped at `max-width: 620px` and centered — on a laptop screen that's a narrow column in a wide field of blank background.*

- [ ] **A** — **Just widen the reading column** (e.g. ~760–820px) and bump type size/line-height slightly at that breakpoint. Simplest change, lowest risk.
- [ ] **B** — **Add a persistent side rail** on wide viewports showing "story so far" live instead of a full-screen overlay panel — turns unused width into something functional. More logic/CSS to verify (two presentations of the same panel).
- [x] **D** ⭐ — **Both of the above except the rail: widen the column *and* give the surrounding space a deliberate background treatment** (subtle texture, gradient, or per-tale wash from Q1/Q6) instead of blank void. Addresses "not using the room well" directly without the side-rail's extra complexity.
- [ ] **C** — **Background treatment only** — keep the column near today's width, just stop the margins from reading as empty.
- [ ] **Write-in:** ______

## Q3 — Tale-select screen on wide viewports

*Current state: a plain list of rows (title, subtitle, Play/Debug) — the screen most exposed to "empty space," since today it's 2 short rows in a 620px column.*

- [ ] **A** — **Enhanced list** — same row-per-tale structure, just visually refined (spacing, a small glyph, hover state).
- [x] **B** ⭐ — **Card grid** — each tale becomes a card (title, subtitle, small motif/swatch, actions) in a responsive grid; collapses to one column on mobile. Standard, low-risk pattern that scales naturally as more tales are added.
- [ ] **Write-in:** ______

## Q4 — Scene transitions & motion

- [ ] **A** — **Instant, no animation** — matches the calm, "pausable by construction" identity; zero jank risk, nothing new to verify.
- [ ] **B** — **A subtle cross-fade or slide between scenes** (~150–250ms).
- [x] **C** ⭐ — **B, plus small local feedback on choice buttons** (a gentle press/hover state beyond today's flat `:active` swap) — most "designed" feel without becoming showy.
- [ ] **Write-in:** ______

*(Whatever's picked, `prefers-reduced-motion: reduce` gets honored regardless — basically free, no reason not to.)*

## Q5 — Typography

*Current state: Georgia/Times New Roman serif throughout, no display face.*

- [ ] **A** — **Stay all-Georgia**, just refine the treatment (scale, tracking, spacing) — cheapest, already reads as warm/literary.
- [x] **B** ⭐ — **Add a display face for titles/endings only** (tale title in the toolbar, ending titles) — body copy stays Georgia for reading comfort; the ending screen is each tale's emotional payoff and is where a little typographic drama earns its keep most.
- [ ] **C** — **Display face more broadly** (toolbar, section headers, choice buttons too).
- [ ] **Write-in:** ______

*(If B or C: **self-host the font file in the repo** vs. **link to a CDN** like Google Fonts. A CDN link is a runtime dependency on an external host — a small deviation from this arcade's fully self-contained/offline-capable static sites. Flag your preference: ______)*

## Q6 — Color

*Current state: one neutral achromatic palette (`--bg`/`--text`/`--border`/`--surface`/`--accent`), same in light and dark, no hue anywhere.*

- [ ] **A** — **Extend the neutral palette only** — maybe an added shade or two for hierarchy, but stays achromatic.
- [x] **B** ⭐ — **Tale-specific accent colors** (e.g. a cold blue for Morozko, a warm amber/forest green for Vasilisa) layered onto the same neutral base — this is the concrete color behind Q1=C's "accent shifts per tale."
- [ ] **C** — **One new accent color, not per-tale** — a single hue used consistently anthology-wide for interactive elements, distinct from the neutral ink tone.
- [ ] **Write-in:** ______

*(If Q1=A, the natural pairing here is A. If Q1=B, the natural pairing is B with full per-tale backgrounds too, not just the accent.)*

## Q7 — Debug view (`?debug=1`) treatment

*Current state: intentionally "plain, dense, functional; not part of the play experience" per `engine.js`'s own comment — monospace, minimal.*

- [ ] **A** — **Leave it exactly as-is.** It's a dev tool, not the narrative experience — no reason to invest here.
- [x] **B** ⭐ — **Light-touch only** — it already inherits the new CSS variables (same stylesheet), so just make sure it doesn't look abandoned next to a freshly designed play screen. No motifs, no display font, no motion — stays dense/utilitarian on purpose.
- [ ] **Write-in:** ______

## Q8 — Free space

*Anything from a specific reference (a game/site whose "text-first but designed" look you like), a hard "don't do this," a color you already know you want, anything missing above.*

- ______

---

*Answers → backlog items in [Backlog](../../games/skazka-trail/backlog.md) → implement → verify in-browser (phone width + laptop width, light + dark, zero console errors) before shipping. See [Skazka Trail — Concept & Directions](../../games/skazka-trail/plans/concept-and-directions.md) and [Skazka Trail Questionnaire — Design Decisions](skazka-trail-design-decisions.md) for full background.*

**Ready-to-paste prompt for implementation (once this questionnaire is answered):**
> *"Read `Skazka Trail — Concept & Directions`, the answered `Skazka Trail Questionnaire — Visual Design`, and `Backlog.md` (`docs/games/skazka-trail/`) for the visual-design decisions and constraints. Turn the answers into backlog items in `Backlog.md`, then implement the pass in `drafts/skazka-trail/`: CSS/HTML changes in `index.html` only (per-tale hooks, if the answers call for them, via a `data-tale` attribute set from each tale's existing `id` in the bootstrap script already there). `engine.js` and both content packs (`tales/vasilisa.js`, `tales/morozko.js`) must not change functionally — this is presentation only. Every existing screen (both tales, tale-select, `?debug=1`, story-so-far) must keep working exactly as today, and mobile touch targets (44px+) and single-hand reachability can't regress. Verify in-browser before shipping: a phone-width viewport and a laptop-width viewport, both light and dark, zero console errors. Ship it through the normal loop — commit, push, verify the deploy, and log it (Backlog's Shipped section, Dev Log, Improvements-inbox entries for anything you discover or defer along the way)."*
