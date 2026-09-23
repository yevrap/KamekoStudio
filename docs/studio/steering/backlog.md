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
| 1 | Studio checks tell studio work from arcade work (by commit scope), so arcade commits on the shared `main` don't read as studio violations in `path-guard`, `production-unchanged` or `commit-lint` | process | M | Inbox 2026-09-22 — blocks the next gate | in sprint 05 (SHS-055) — built |
| 2 | Fork mechanism, and the first fork: River Run copied into `studio/games/river-run/` with every storage key renamed under `studio_`, shared paths re-pointed, boot coverage, and the procedure written down | feature | M | Direction E1 · chat 2026-09-22: River Run first (Q11 → C) | in sprint 05 (SHS-056) — built |
| 3 | The River Run portal on the 3D page opens the studio fork; every other portal still opens its production game. A recorded exception for `shared/3d/constants.js` | feature | S | Direction E1 · Q4 | in sprint 05 (SHS-057) |
| 4 | River Run fork — the first experiment: floating power-ups, a shield (one extra hit) and rapid-fire / spread shot, one at a time on the river | feature | M | Q12 ⭐ · arcade `docs/archive/questionnaires/river-run-modernization.md` Q1 (other: power-ups) and Q2=A · arcade p2-40, p2-41 | Needs refinement: waits on Q12 |
| 5 | River Run fork — split the inline script into ES modules (constants/state/gameplay/main) and add its first unit tests, so experiments are testable. Size L: split per module at plan | debt | L | Arcade roadmap b-01, now the fork's | Needs refinement |
| 6 | River Run fork — a near-miss streak: tight dodges build a streak the HUD shows, a hit or a wide pass resets it | feature | M | River Run questionnaire Q3=C · arcade p2-43, and p1-51's near-miss cue (whoosh + edge flash) as its first half | Needs refinement: Q12 |
| 7 | River Run fork — biomes that change play: the stretch of river changes how the boat handles (friction) and what floats in it, and the change is noticeable | feature | M | River Run questionnaire Q6=B, Q4=A/C · arcade p2-10, p2-42 | Needs refinement: Q12 |
| 8 | River Run fork — the game-over screen shows the best score, with a "New Best" mark | feature | S | Arcade roadmap p1-48, now the fork's | Ready once #2 lands |
| 9 | Let the studio add tests and docs for production games: widen the path guard to test and doc paths only, never game code, with a decision record | process | S | Executive, 2026-09-22 — tests, docs and debt are welcome work | Needs refinement |
| 10 | A real repository README (production documentation, so it goes through the production-fix rule) | docs | S | Inbox 2026-09-21 audit — carried twice | Ready |
| 11 | Tighten the TD-009 direct test: refuse a fix that keeps only one burst particle | test | S | QA, iteration 04 review round 2 | Ready |
| 12 | TD-013: `path-guard` refuses a fix file changed by a merge it can't see | debt | S | Tech-debt register | Ready |
| 13 | `learning-log.md` gets an **Active rules** list at the top, ten at most | process | S | Direction E1, rule 7 | Ready |
| 14 | Ratify the move to the repo as the studio's single home with a decision record; fix `public-repo-hygiene.md`, which still says direction is kept outside the repository | docs | S | Inbox 2026-09-22 | Ready |
| 15 | Decide whether `studio:check`'s `hygiene` stays studio-scoped or defers to the repo-wide scan in `npm test` | debt | S | Inbox 2026-09-22 | Needs refinement |
| 16 | Overtighten's torque readout rounds while the state doesn't: 45.6 shows "46 · loose" | fix | S | Board, noticed in iteration 04 | Ready |
| 17 | TD-005: with site data blocked, `shared/settings.js` throws on every page (production fix) | debt | S | Tech-debt register | Needs refinement |
| 18 | TD-006: the 3D page's interaction prompt always prefers a portal to a nearby trophy | debt | S | Tech-debt register | Needs refinement |
| 19 | TD-007: the studio's browser harness duplicates `scripts/smoke.mjs`'s static server | debt | S | Tech-debt register | Needs refinement |
| 20 | Maze Warden fork — calm the board, then one real choice per tower under a cap on effects. Held: E1's first fork went to River Run, so Maze Warden's Iteration 8 stays on the arcade roadmap unless a later fork takes it | feature | M | Former #4 and #5, Q11 ⭐ not taken | Parked |
| 21 | An executive edit to `docs/studio/steering/` (an inbox line, a questionnaire answer) has a commit form the checks accept, recorded in `process.md`: today it is either an arcade commit touching a studio path or an unnumbered `(studio)` commit, and both fail | process | S | SHS-055 build, iteration 05 | Needs refinement |
| 22 | River Run fork: its music restarts a Tone.js sequence on every new run, and now and then Tone rejects a start time a hair below zero (`RangeError … got: -1e-12`, uncaught in promise). Inherited from production, not caused by the fork. Fix in the fork (clamp or schedule from `Tone.now()`) and drop the named exemption in `tests/studio/river-run-fork.test.mjs`; production gets the same fix under ADR-0008 if still identical | fix | S | SHS-056 build, iteration 05 | Needs refinement |
| 23 | River Run fork — ghost run: record the best run's boat positions and replay them as a transparent ghost on the next attempt | feature | M | Arcade roadmap p1-05, now the fork's | Needs refinement |
| 24 | River Run fork — impact feel: a fatal hit shakes the camera, flashes red and plays a synthesized crash; a shot obstacle plays a short destroy sound; both respect mute | feature | S | Arcade roadmap p1-49 + p1-50, now the fork's | Needs refinement |
| 25 | River Run fork — a livelier Watch Mode: the auto boat carves across the whole river and weaves between obstacles instead of hugging an edge, surviving no worse than today | feature | M | Arcade roadmap p2-29, now the fork's | Needs refinement |

---

*Related: [Direction](direction.md) · [Next step](next.md) · [Board](board.md) · [Feedback Inbox](inbox.md)*
