# Iteration 07 — power-ups you can read, and a River Run that restarts

**Epic:** E1 · The Studio Wing opens · **sprint 3 of 3 (+1 reserve, unclaimed)** — the
last granted sprint.

**Sprint goal:** you can play the River Run fork's power-ups at phone width with your score
always readable and the spread shot lasting the 6 s it says, and the arcade's River Run no
longer freezes when you restart.

## Tickets

| # | ID | Title | Type | Size | Source |
|---|---|---|---|---|---|
| 1 | [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md) | River Run fork: the score and the power-up timer stay readable at phone width and count real seconds | fix | M | The Playtester's Iterate on [SHS-060](../06/tickets/SHS-060-river-run-power-ups.md) (ADR-0011) · backlog #35 + #38 |
| 2 | [SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md) | A ticketed studio commit may change the studio's own skills and conductor | process | S | Executive, [ADR-0011](../../decisions/ADR-0011-the-studio-runs-itself.md) §6 · backlog #41 |
| 3 | [SHS-066](tickets/SHS-066-production-river-run-restart.md) | Production River Run: Restart Game never freezes the river | fix (production, ADR-0008) | S | 06 review, IR 1 · backlog #33 · arcade 🐞 p0-17 |
| — | [SHS-067](tickets/SHS-067-iteration-record.md) | This iteration's record | docs | S | Ceremony commits |

Three planned tickets, at the cap. Two change what a player sees or plays (the fork's
power-ups, the arcade's restart). [SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md) is the one ticket on the studio's own machinery;
#21 waits a third time, and #40 takes the slot from sprint 08.

**Why #35 and #38 are one ticket.** The Playtester's Iterate asks for one pass on the
power-up HUD: readable, and telling the truth about time. Both are S and touch the same
few lines of the fork's `index.html`; as one M they fit the cap alongside #33 and #41. If
the session can't hold both, the layout lands first (the thing a player hits first) and
#38 goes back to the backlog.

**Order.** [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md) first: the verdict's fix, and what the executive will play. [SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md) second, so
this sprint's retro can land its change to how the team works in the skills. [SHS-066](tickets/SHS-066-production-river-run-restart.md)
last, because a production fix's commits stay local until the review step pushes them
(ADR-0008): built earlier, the next build's push would carry them out unreviewed, and its
preflight would fail `on-main`. Its build session commits locally and pushes nothing,
records included; `next.md` names the commits.

## Verdicts acted on

The Playtester's verdicts on sprint 06, recorded with their evidence in
[06's review](../06/review.md): **Iterate** on the power-ups
([SHS-060](../06/tickets/SHS-060-river-run-power-ups.md)), **Keep** on the fork's restart
fix ([SHS-061](../06/tickets/SHS-061-river-run-tone-start-time.md)). The Iterate became
#35 and #38 (pulled as [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md)) and a new #42, a far-off pickup that reads at a glance.
No verdict issue from the executive was open.

## What will be visible

- `studio/games/river-run/` (and the River Run portal on `3d.html`): with a shield or a
  spread shot active, the score stays on one line and readable at 320 and 390 wide, the
  power-up label has a place of its own, and "✦ SPREAD 6.0s" counts down real seconds on
  any refresh rate.
- `games/river-run/` (the arcade's gallery build): die and restart as often as you like;
  every run starts, with its music.
- For the reader: the studio's skills and its conductor are a recorded exception, so the
  retro can change how the team works in the files that run it.

## Risks

| Risk | Response |
|---|---|
| Moving the power-up timers to real time half-way leaves them out of step with a game that counts frames | Only the power-up timers and their spawn clock change; the drawer's pause must pause them (a criterion). The rest of the game stays on frames, and the ticket says so |
| The HUD fix moves "← Studio" or Mute and breaks their 44 px targets or the fork's back-link tests | A criterion keeps 44 px; the bounding-box subtest covers the buttons too |
| The production fix is pushed before review by a later push | Built last; its session pushes nothing; review writes `reviews/SHS-066.md`, then pushes through `--stage=push` |
| A regression test that is red only sometimes (Active rule, 06 retro) | Both the timing and the restart tests make the fault happen (a doubled frame rate; a `Sequence.stop` that throws) and give a red count over several runs |
| E1 ends this sprint with rules still only in `direction.md` | The retro's epic review moves them into `process.md` and writes E2 (game-first, per the executive's wish) under *Proposed next epic* |

## Out of scope

- The far-off pickup's size or glow (#42), Watch Mode steering for pickups, tuning the
  power-ups' strength or frequency.
- The fork's deterministic restart test (#37): it reuses [SHS-066](tickets/SHS-066-production-river-run-restart.md)'s case next sprint.
- Branches and pull requests (#40), the steering-edit commit form (#21).
- Any other change to production River Run, and any other production game.
