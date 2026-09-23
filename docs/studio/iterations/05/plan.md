# Iteration 05 — the Studio Wing opens with River Run

**Epic:** E1 · The Studio Wing opens · **sprint 1 of 3 (+1 reserve)**

**Sprint goal:** on the 3D landing page, the River Run portal opens the studio's own copy of
River Run, which plays like the arcade version but keeps its own saves.

## Tickets

| # | ID | Title | Type | Size | Source |
|---|---|---|---|---|---|
| 1 | [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md) | The studio checks tell studio commits from arcade commits on the shared `main` | process | M | Inbox 2026-09-22, blocks the next gate · backlog #1 |
| 2 | [SHS-056](tickets/SHS-056-river-run-fork.md) | River Run is forked into `studio/games/river-run/` with only `studio_` saves | feature | M | Direction E1 · chat focus 2026-09-22 (Q11 → River Run) · backlog #2 |
| 3 | [SHS-057](tickets/SHS-057-portal-opens-fork.md) | The 3D landing page's River Run portal opens the studio fork | feature | S | Direction E1 done-when · Q4 · backlog #3 |
| — | [SHS-058](tickets/SHS-058-iteration-record.md) | This iteration's record | docs | S | Ceremony commits |

Three planned tickets, at the cap. One of them ([SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md)) is work on the studio's own
machinery, which uses up this sprint's allowance of one.

**Order.** [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md) first. Until it lands, `path-guard`, `production-unchanged` and
`commit-lint` count the arcade commits made since `studio-iteration-04` as studio
violations, so no gate can pass. [SHS-056](tickets/SHS-056-river-run-fork.md) next, then [SHS-057](tickets/SHS-057-portal-opens-fork.md), because the portal needs
somewhere to point. Each is one build session.

## What will be visible

- `https://yevrap.github.io/KamekoStudio/studio/games/river-run/`: River Run, forked. It
  plays like the original, and its high score, mute and Watch Mode settings are separate
  from the arcade's.
- `https://yevrap.github.io/KamekoStudio/3d.html`: walking into the River Run portal opens
  the fork. The other portals still open their production games.
- The realm's home page lists the fork on its shelf.

## Focus from the prompt

The executive said in chat that the first game the studio works on should be River Run.
That answers Q11 with option C, River Run in place of the ⭐ Maze Warden. River Run is on
the arcade's Invest list and its modernization questionnaire is answered but not built
(power-ups, a streak, moving obstacles, biomes that change play), so it comes with a queue
of experiments. The first of them is sprint 06's, and Q12 in the questionnaire asks which
one goes first.

## Risks

| Risk | Response |
|---|---|
| [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md) loosens the path guard so far that a studio commit dressed as an arcade commit gets past it | Commit scope is a claim the author makes, so it cannot be the only test. The ticket holds both directions: a commit scoped `(studio)` may touch only studio paths, and a commit without that scope that touches `studio/**`, `docs/studio/**` or `tests/studio/**` is itself a violation. Tests use a scratch repository with both kinds of commit |
| River Run's inline script reads the shared `theme` key and writes the unnamespaced `muted` key | The fork drops the `theme` read and takes the theme from the class `settings.js` sets on `body`; `muted` becomes `studio_riverRun_muted`. `storage-keys` must pass with no exemption |
| `registerWatchSection('riverRun', …)` makes the production `settings.js` write `riverRun_autoPlay` | The fork passes the prefix `studio_riverRun`. The ticket proves it in a browser: starting Watch Mode in the fork leaves every production key unchanged |
| The portal edit is a production file (`shared/3d/constants.js`) | A recorded exception scoped to the one `url` value of the River Run entry, checked like the `frontPositions` exception (ADR-0005). The executive's direction for E1 approves it: its done-when requires a portal that leads to a fork, and Q4 approved the 3D page as the studio's window. The ticket records that approval |
| The arcade roadmap still lists River Run feature rows (p1-05, p1-48…p1-51, p2-10, p2-29, p2-40…p2-44, b-01) | Under direction rule 5 that feature work now happens in the fork, and production River Run gets bug fixes only. `docs/roadmap.md` is outside the path guard, so the studio does not edit it. The executive is told in the report |
| Three.js r128 and Tone.js load from a CDN in the fork too | Nothing new: same URLs as production, and `npm run smoke` already loads the production page |

## Out of scope

- Any gameplay change to River Run. The fork starts as a faithful copy, and the first
  experiment is sprint 06's.
- Splitting the fork into ES modules (arcade row b-01). It is on the backlog as fork debt.
- A general fork script. [SHS-056](tickets/SHS-056-river-run-fork.md) writes the procedure down in the handbook so the second
  fork can follow it; a tool is built only if the second fork shows it is needed.
- Maze Warden. It stays in the arcade, and its planned Iteration 8 stays on the arcade's
  roadmap.
- Adding `studio_` keys to production's "Clear All Game Data" (ADR-0003). Unchanged.
