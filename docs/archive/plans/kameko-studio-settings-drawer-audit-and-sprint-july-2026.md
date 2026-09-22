# Kameko Studio — Settings Drawer Audit & Sprint (July 2026)

> **Archived July 12, 2026 — sprint complete.** All findings shipped July 11, 2026 (p0-12, p0-13, p1-17…p1-20, b-14, b-15); full narrative in the [Dev Log](../dev-logs/arcade.md).

> **Status: ✅ sprint shipped July 11, 2026** — all seven items plus p1-20 (quick switcher, from questionnaire Q4), commits `972820c` → `b2e70a3`, live as v13. Yev answered [Kameko Studio Questionnaire — Settings & Drawer UX](../questionnaires/kameko-studio-settings-and-drawer-ux.md) (Q1/Q2/Q3/Q4 = A, Q5 = B) and every answer is implemented. Ship details: [Dev Log](../dev-logs/arcade.md) entry for 2026-07-11. The findings below are kept as the record of what was wrong and why the design is shaped this way.

**Context:** On July 10 2026 the games were migrated to a unified settings Drawer API (`641732d refactor: Migrate games to unified Drawer API for settings`, follow-up `7f87b3c fix: resolve settings crash`). Yev playtested afterward and reported: can't rename players in Tysiacha, and the settings UI "looks very busy and doesn't make much sense." This note is the audit of that change (verified in-browser at HEAD on July 10) and the improvement sprint that came out of it. Roadmap rows live in the repo: `docs/roadmap.md` (p0-12, p0-13, p1-17, p1-18, p1-19, b-14, b-15).

---

## Finding 1 — Tysiacha is broken at boot, and it's live (P0)

The migration deleted the old settings modal and the `btn-howto` / `btn-coach` topbar buttons from `games/tysiacha/index.html`, but `localizeStatic()` in `ui.js` still writes `.textContent` to them. `$()` is bare `getElementById`, so the first missing element throws `Cannot set properties of null`.

That one stale function kills the game twice:

1. **At boot** — `main.js` calls `localizeStatic()` before starting a match. It throws, module execution halts, `newMatch()`/`showHowto()` never run. The game loads to an **empty table** (verified: no cards, no players dealt). Only the ↺ restart button (bound earlier in the file) can rescue it.
2. **In the drawer** — the Tysiacha settings section's render calls `localizeStatic()` *before* binding any event handlers. The throw aborts the render mid-way, so every control below renders but is **dead**: player-name inputs (the rename bug Yev hit), language select, AI difficulty, sound toggle, 1-Tap Play, target score, all six Classic Rules checkboxes, and the Apply & Restart button. Verified: typed a name → no `onchange` fired, nothing persisted, Apply had no `onclick`.

The bug regresses features the roadmap has marked shipped: p2-21 (custom names), and the drawer controls for p2-18 (difficulty), p1-13 (sound), p1-14 (language).

`7f87b3c` ("resolve settings crash") only fixed `shared/settings.js`; the game-side crash was untouched. **HEAD == origin/main, so the deployed site serves this.**

Fix shape (p0-12): split `localizeStatic()` into page-chrome localization (elements that exist in `index.html`) and drawer localization (called from the drawer render, only for elements that exist there), and/or use a null-safe `setText` helper so a missing element can never take down boot or bindings again.

Why tests didn't catch it: the 149-test suite runs gameplay headless (`typeof document === 'undefined'` guards) — nothing exercises a real page load. Hence p0-13: a page-load smoke test for every game.

## Finding 2 — the drawer is busy because it mixes four kinds of content

Tysiacha's drawer at HEAD is one flat scrolling list, ~2.4 screens tall:

1. Quick Actions (Rules, Coach toggle-button)
2. Match settings — instant-apply (language, difficulty, sound, 1-tap)
3. Player names (apply-on-change)
4. Target score + 6 Classic Rules checkboxes (apply only via button)
5. **Apply & Restart** — styled as a *danger* button, and it **silently spends a token** and restarts the match (nothing says so)
6. Shared chrome: tokens row, Light Mode, Back to Gallery, Developer Mode, App Version + Check for Updates

Three different apply models sit adjacent in one list with no visual distinction — that's the "doesn't make much sense." The shared chrome tail makes every game's drawer long — that's the "busy."

## Finding 3 — the games disagree with each other

| | Tysiacha | Durak | River Run |
|---|---|---|---|
| Player rename | in drawer (broken) | "Edit Names" on setup screen | n/a |
| Settings apply | mixed instant / on-change / Apply&Restart | instant toggles | instant toggles |
| Restart from drawer | "Apply & Restart" (red, costs token, unlabeled) | "End round & back to menu" (red) | none |
| Context awareness | none | none — shows "Current Match: vs Computer (2 players)" and "End round" **even on the start menu** | n/a |
| Coach hints | Quick-Action button with changing label | settings toggle | n/a |

River Run is the model: a short section of instant toggles, nothing else. Durak's setup-screen "Edit Names" is the better rename pattern (name changes are a new-match concern).

Smaller findings: Tysiacha's target score + Classic Rules are never persisted (survive neither reload nor the boot flow); `registerSection()` renders once ever, so Tysiacha hacks around staleness by deleting its sections on drawer close; `clearAllGameData` in `shared/settings.js` misses every localStorage key added since it was written (`tysiacha_*`, durak stats/coach/names, etc.).

## The sprint (mirrored in `docs/roadmap.md`)

| ID | Item | Effort | Why |
|---|---|---|---|
| **p0-12** | Tysiacha: fix boot crash + dead settings bindings (stale `localizeStatic` refs) | S | Live game boots to an empty table; rename/Apply/language/difficulty all dead. **Ship first.** |
| **p0-13** | Page-load smoke test: every game loads with zero uncaught errors | M | The headless suite was green while the game was unbootable. |
| **p1-17** | Tysiacha: drawer restructure — split "Settings" (instant, persisted) from "New Match" (names, target, rules behind one primary-styled button labeled with its token cost); persist match settings | M | The core "doesn't make sense" fix. Depends on p0-12; see questionnaire before changing rename placement. |
| **p1-18** | Durak: context-aware drawer — no "Current Match"/"End round" on the start menu | S | Confusing state leak. |
| **p1-19** | Shared drawer chrome de-clutter — compact tokens/theme/gallery rows, collapse Dev Mode + Version into an "App" subsection | S | Shortens every game's drawer. |
| **b-14** | Drawer API: re-render game sections on each open (lifecycle), remove Tysiacha's remove-on-close hack | S | Prevents the next staleness bug. |
| **b-15** | `clearAllGameData`: cover post-migration localStorage keys | S | Dev-tool correctness. |

Open product decisions are in [Kameko Studio Questionnaire — Settings & Drawer UX](../questionnaires/kameko-studio-settings-and-drawer-ux.md) — p1-17/p1-19 should be shipped after (or adjusted by) Yev's answers there; p0-12, p0-13, p1-18, b-14, b-15 are unambiguous and agent-shippable now.

Related capture: [Improvements](../../planning/ideas.md) (the "better settings button and navigation ui" and "reset button in 1000" inbox items are absorbed by this sprint) · [Tysiacha (1000)](../../games/tysiacha/README.md) · [Kameko Playtest Log](../../playtest-log.md)
