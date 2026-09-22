# Shadow Studio — Product Backlog

**Ordered: the top is next.** This is the main way to steer without writing a word. Move a
row up to make it happen sooner, delete it to drop it, or add a row anywhere in plain
words; the Product Owner refines it at the next `plan`. Your ordering is kept unless a
retro writes down why not.

The Product Owner adds rows from the [Feedback Inbox](inbox.md), reviews, retros, the debt
register (`docs/studio/tech-debt.md`) and the games' idea files. It keeps the top five
**Ready** (sized, with acceptance criteria — `docs/studio/definition-of-ready.md`). The
epic and its budget are in [Direction](direction.md).

**Type:** feature · fix · test · docs · debt · process (the studio's own machinery — at most
one per sprint). **Size:** S or M; an L is split before it's pulled.

| # | Item | Type | Size | Source | Status |
|---|---|---|---|---|---|
| 1 | Studio checks tell studio work from arcade work (by commit scope), so arcade commits on the shared `main` don't read as studio violations in `path-guard`, `production-unchanged` or `commit-lint` | process | M | Inbox 2026-09-22 — blocks the next gate | Ready |
| 2 | Fork mechanism: copy a game into `studio/games/<slug>/` with every storage key renamed under `studio_`, shared paths re-pointed, and boot coverage; the first fork is Q11's pick (⭐ Maze Warden) | feature | M | Direction E1 · Q11 | Ready |
| 3 | The first fork's 3D portal opens the studio copy; every other portal still opens its production game. Needs a recorded exception for `shared/3d/constants.js`, approved in principle by Q4 | feature | S | Direction E1 · Q4 | Ready |
| 4 | Maze Warden fork — calm the board: towers animate only when they fire, glow stops being redrawn for every entity every frame, Volt Coil gets its own shot and sound | feature | M | Maze Warden's planned Iteration 8, moved into the fork by Q11 ⭐ | Ready once #2 lands |
| 5 | Maze Warden fork — the shooting experiment: one real choice per tower (such as targeting), under a hard cap on effects on screen at once | feature | M | Q11 ⭐ · `docs/questionnaires/maze-warden-iteration-8.md` Q1=B, Q3=A | Needs refinement |
| 6 | Let the studio add tests and docs for production games: widen the path guard to test and doc paths only, never game code, with a decision record | process | S | Executive, 2026-09-22 — tests, docs and debt are welcome work | Needs refinement |
| 7 | A real repository README (production documentation, so it goes through the production-fix rule) | docs | S | Inbox 2026-09-21 audit — carried twice | Ready |
| 8 | Tighten the TD-009 direct test: refuse a fix that keeps only one burst particle | test | S | QA, iteration 04 review round 2 | Ready |
| 9 | TD-013: `path-guard` refuses a fix file changed by a merge it can't see | debt | S | Tech-debt register | Ready |
| 10 | `learning-log.md` gets an **Active rules** list at the top, ten at most | process | S | Direction E1, rule 7 | Ready |
| 11 | Ratify the move to the repo as the studio's single home with a decision record; fix `public-repo-hygiene.md`, which still says direction is kept outside the repository | docs | S | Inbox 2026-09-22 | Ready |
| 12 | Decide whether `studio:check`'s `hygiene` stays studio-scoped or defers to the repo-wide scan in `npm test` | debt | S | Inbox 2026-09-22 | Needs refinement |
| 13 | Overtighten's torque readout rounds while the state doesn't: 45.6 shows "46 · loose" | fix | S | Board, noticed in iteration 04 | Ready |
| 14 | TD-005: with site data blocked, `shared/settings.js` throws on every page (production fix) | debt | S | Tech-debt register | Needs refinement |
| 15 | TD-006: the 3D page's interaction prompt always prefers a portal to a nearby trophy | debt | S | Tech-debt register | Needs refinement |
| 16 | TD-007: the studio's browser harness duplicates `scripts/smoke.mjs`'s static server | debt | S | Tech-debt register | Needs refinement |

---

*Related: [Direction](direction.md) · [Next step](next.md) · [Board](board.md) · [Feedback Inbox](inbox.md)*
