# Astro Salon — Promotion & Depth Sprints (July 2026)

> **Status: Sprint 1 + Sprint 2 SHIPPED. Sprint 1 (2026-07-14, `5abf5b4`); Sprint 2 (2026-07-15, `87e1a94`, v26) — both live at `games/astro-salon/`.** Round-3 questionnaire answered **keep** ([Astro Salon Questionnaire — Verdict & Direction](../questionnaires/astro-salon-verdict-and-direction.md), consumed and archived); this note is the sprint plan that consumed it. Roadmap rows: `docs/roadmap.md` (p1-38/39/40 ✅, p2-33/34 ✅). Overview + Sprint 2 details: [Astro Salon](../../games/astro-salon/README.md); chart room design: [Astro Salon — Chart Reading Room Design](astro-salon-chart-reading-room-design.md). Follow-up questionnaire Q1–Q3 all consumed by Sprint 2 (Q2 → all 12 houses, Q3 → streak cut); **new open thread is Q4 (expert mode) → roadmap p2-35**: [Astro Salon Questionnaire — Promotion Decisions](../../questionnaires/astro-salon-promotion-decisions.md).

## Decisions (round-3 questionnaire, answered July 14, 2026)

| Q | Decision | Consequence |
|---|---|---|
| **Q1 = keep** | Promote to the arcade | Sprint 1 = the promotion checklist (p1-38) |
| Q2 = better, but | "I like the text showing the ranges when selected. **No need for text on each slice**" | p1-39 — strip per-wedge date text; the hub preview owns the ranges. Default keeps symbol + name on wedges (Q1 of the new questionnaire can veto) |
| Q3 = right | Read-then-confirm browsing feels right | No expert single-tap mode — that Improvements item moves to Parked |
| Q4 = grow it | Daily horoscope: "I'd actually check it" — more phrases, streaks, tie into end-screen fortune | p2-33, folded together with Yev's year-of-horoscopes inbox idea |
| Q5 = second room | Deeper chart reading as a **separate session type chosen at start** | p2-34 — design pass + v1, Sprint 2's anchor |
| Q6 = blank | Nothing factually off | No work |

Plus one new inbox item from Yev (July 14): *"Continue in quiz should not need scroll on laptop or phone. better layout"* → p1-40.

## Sprint 1 — Promotion & readability polish ✅ shipped 2026-07-14

Goal: astro-salon graduates from `drafts/` to `games/` as a first-class arcade game, and the two round-3 UX gripes ship in its new module home. Shipped as a single commit (`5abf5b4`) — p1-39/p1-40 landed inside the same module split rather than as follow-up commits, since splitting first and then patching twice would've been pure churn.

- [x] **P1 (p1-38)** Promote astro-salon per `docs/promotion-checklist.md`, phases 1–6 — L. **Done.** Module split into `constants/i18n/content/state/gameplay/ui/main.js` (`content.js` wasn't in the original plan — added to hold pure text-generation shared by `ui.js` and its tests, keeping `gameplay.js` → `ui.js` one-directional). 24 unit tests in `tests/astro-salon.test.mjs`. Settings drawer section, `lastPlayed_astroSalon` + `astroSalon_bestStars` persistence, pause via `state.js`'s `isPaused()`, dark/light mode (the draft had none), pointer events (was `click`), registered everywhere including the settings-drawer quick game switcher (a gap not called out in the checklist — caught during in-browser verification, not by any test). Guests-per-session setting skipped (kept Sprint 1 scope tight, per the plan's own "skip without guilt"). Full test suite + smoke green, deploy verified live, drove a full session + EN/RU + dark/light + drawer pause through the browser.
- [x] **P1 (p1-39)** Wheel wedge de-clutter (round-3 Q2) — S. **Done**, bundled into p1-38. Per-wedge date text removed; symbol/name sizes bumped (32px/14.5px). Questionnaire Q1 default (keep names+symbols) applied.
- [x] **P1 (p1-40)** Quiz layout: continue without scrolling — S. **Done**, bundled into p1-38. Continue button is now a `.stage` sibling outside the scrolling feedback card, verified at 375×812 and ~800×450 with a long RU feedback string forcing internal card scroll.

## Sprint 2 — Depth: a year of horoscopes & the second room ✅ shipped 2026-07-15 (v26 `87e1a94`)

Goal: the two growth bets from Q4/Q5, both built on the Sprint 1 module split. Follow-up questionnaire answers reshaped scope before build (Q2 "go bigger", Q3 "no streak"). Full write-up in [Astro Salon](../../games/astro-salon/README.md) Sprint 2 section; chart design in [Astro Salon — Chart Reading Room Design](astro-salon-chart-reading-room-design.md).

- [x] **P2 (p2-33)** Year-of-horoscopes + fortune tie-in — M. **Done.** Versioned `YEAR_THEME` (2026 · *The Year of Quiet Momentum*) shown on the daily panel and folded into the read seed (`date + sign + version`); pools tripled to 30 themes / 24 advice per language (all unique, EN/RU length-matched); end-screen fortune quotes the same deterministic read the ✨ panel shows via a shared `dailyReadIndices`. **Streak cut** per Q3. Determinism + pool sizes + agreement unit-tested.
- [x] **P2 (p2-34)** Chart Reading room — second session type — L. **Done, scope upgraded to all 12 houses** per Q2. Start-screen Salon / Chart Reading choice; 4 returning (undisguised) guests × [rising placement + 3 whole-sign house questions]; all 12 houses dealt exactly once per session; simplified sunrise rule for rising (sun sign at dawn, +1 sign / 2h); same 2⭐/1⭐/streak scoring + rule-on-miss teaching; separate best (`astroSalon_bestStarsChart`); full EN/RU. Design note written and linked from [Astro Salon](../../games/astro-salon/README.md). Pure logic (`risingFor`, `houseSignId`, `buildChartGuests`) unit-tested; full chart session driven in a headless browser pass.

## Not scheduled (moved to Parked in [Improvements](../../games/astro-salon/ideas.md))

Expert single-tap (Q3 says read-then-confirm is right), persona memory/storylines + profile cards (unanswered three rounds — questionnaire stopped asking), label-fade mastery ladder (partially superseded by p1-39), traditional-rulers toggle, sounds, modality compatibility, month tick ring (clutter — against the Q2 direction).
