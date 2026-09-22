# Kameko Studio Questionnaire — Settings & Drawer UX

> **Archived July 12, 2026 — fully answered and consumed.** All five answers shipped July 11, 2026 in the Settings Drawer Recovery sprint (p1-17…p1-20); see [Kameko Studio — Settings Drawer Audit & Sprint (July 2026)](../plans/kameko-studio-settings-drawer-audit-and-sprint-july-2026.md) and the Dev Log.

> **✅ Answered July 11, 2026 and fully implemented the same day** (settings sprint, live as v13): Q1=A names on the New Match screen (p1-17) · Q2=A settings-restarts free (p1-17) · Q3=A compact chrome + App disclosure (p1-19) · Q4=A quick game switcher (p1-20) · Q5=B coach as quick action in both card games (p1-18). Kept as the record of the decisions.

*Check one box per question (or add a line of your own). Feeds sprint items p1-17 and p1-19 — see [Kameko Studio — Settings Drawer Audit & Sprint (July 2026)](../plans/kameko-studio-settings-drawer-audit-and-sprint-july-2026.md). The P0 crash fix does not wait on these answers.*

## Q1 — Where should player rename live in Tysiacha?

- [x] **A. Durak pattern (recommended):** an "Edit Names" step on a start/new-match screen; drawer stays for settings only. Names are a new-match concern and this unifies the two card games.
- [ ] **B. Keep in the drawer**, but move under the "New Match" group so it's clear names apply to the next match.
- [ ] **C. Keep in the drawer, applying live mid-match** (the original p2-21 behavior).

## Q2 — Changing match rules in Tysiacha currently restarts the match AND silently spends a token. What should it cost?

- [x] **A. Free (recommended):** a settings-triggered restart never costs a token; only starting/continuing play does.
- [ ] **B. Keep the token cost, but say so on the button** ("Start new match · 1 🪙").
- [ ] **C. Rules apply from the next deal without a restart** (bigger change, needs design).

## Q3 — How much app chrome (tokens, theme, gallery link, version, dev mode) belongs in every game's drawer?

- [x] **A. Keep all of it, but compacted** — one tight "App" block, Dev Mode + Version collapsed behind a disclosure (what p1-19 assumes).
- [ ] **B. Slim drawer:** game settings + tokens + Back to Gallery only; theme/version/dev tools live only on the gallery page.
- [ ] **C. Leave as is** — the busy-ness is fine once Tysiacha's section is fixed.

## Q4 — Quick switcher between games inside the drawer (your inbox idea)?

- [x] **A. Yes** — a row of game icons in the drawer to jump directly between games.
- [ ] **B. No** — "Back to Gallery" is enough; keep drawers short.
- [ ] **C. Later** — park it until the tier questionnaire decides which games survive.

## Q5 — Coach hints control: Tysiacha uses a Quick-Action button, Durak uses a settings toggle. Pick one pattern for both:

- [ ] **A. Settings toggle** (durak style) — it's a preference, not an action.
- [x] **B. Quick-Action button** (tysiacha style) — it's something you flip mid-game.

## Notes / anything else about the settings UX

- 
