# Iteration 07 — retrospective

**Epic:** E1 · The Studio Wing opens · sprint 3 of 3 (+1 reserve, unclaimed), now spent:
3 of 3. E1 is done; the reserve is not claimed.

## Went well

- **The Playtester's Iterate became a Keep in one sprint.** Sprint 06's power-ups were
  hard to read on a phone and counted frames. [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md) fixed both in one session, with
  layout evidence at 320 and 390 and a timer measured at about 29 and 133 fps. The
  Playtester kept it after six runs at two widths.
- **The fork paid for itself in production.** The restart freeze the fork found in 06 is
  fixed in the arcade's River Run ([SHS-066](tickets/SHS-066-production-river-run-restart.md)), with the fork's own fix and a test red 5 of 5
  before it. The production fix waited for review, and `production-fix-reviewed` held the
  push until `reviews/SHS-066.md` named the commit: the first time that rule was used.
- **The retro can now change the files that run the team** ([SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md)). This retro is the
  first to use it (change 1).
- **One step per session, now as a workflow.** Six steps, six fresh agents, each pushed
  its own records. One review round; both passes approved with findings; no second round.
- **Fix rounds: 1**, a dead CSS line removed at review ([SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md), IR-5). There were none
  on a player-facing defect.

## Didn't go well

- **The gate was red on `docs-current` at close for the third sprint running**, each
  time for a different reason: the record ticket's criteria in 05, the close step's order
  in 06, and here [SHS-063](../06/tickets/SHS-063-exempt-adr-0011-commits.md), built between sprints without the template's *What changed*
  and *Tested by* fields. `docs-current` runs only at the gate, so a ticket's missing
  fields surface at the end of the sprint, not at the push that carried them. A lesson
  that recurs becomes a check (change 3).
- **The review step cost the most by far**: 82,272 output tokens, 38% of the sprint
  before this retro. Its three reviewers overlapped. The Independent Reviewer ran 80
  restarts and 40 layout cases; the Playtester ran 20 restarts and six runs at the same
  two widths; the build had already recorded red and green counts for both. Change 1 is
  aimed at this.
- **`process.md` contradicted ADR-0011 on the reviewers' models.** Review fixed the role
  file (IR-2) but not the handbook, which still said the reviewer's model "is deliberately
  not the author's". Fixed here.
- **#21 waited a third time.** The executive's ADR-0011 request (#41) took the process
  slot, for a good reason. Steering edits still have no commit form the checks accept.

## Changes

1. **The reviewers don't repeat evidence the sprint already has** (the costliest step).
   The Independent Reviewer's and QA's prompt, in the workflow and in the `studio-sprint`
   skill's prompts file, now says: don't re-run a count the ticket records or a suite the
   checks ran unless you doubt it, and don't play for the sake of it, since the Playtester
   plays every player-visible change at the same time. Spend the runs on the claims the
   evidence doesn't reach. It removes work rather than adding a step. The next retro
   compares the review step's tokens with 82,272.
2. **E1's rules move into the handbook.** `process.md` gets a *Standing rules* section with
   direction's eight rules under the same numbers, since skills, tests and ADRs cite
   "direction rule 5" and "rule 8"; `direction.md` says so. The same edit fixes the
   reviewer-model paragraph and the protocol table's stale "deploy-checked" line.
3. **Backlog #47: `docs-current` runs at `push` too**, for the tickets that push changes,
   so a missing field fails at that push rather than at the gate. Rule 2 allows a new check
   for a lesson that has recurred, and this one has recurred three times. It is Ready and
   waits for a process slot after #40's first part.
4. **Active rules:** rule 6 (*run `--stage=ticket` before every commit*) is in the skill's
   build step and `process.md`, so it leaves the list. New: *every ticket starts from the
   template, in a sprint or between sprints*, until #47 turns it into a check.

## Feedback and efficiency (direction rule 8)

- **Feedback:** no open `studio` issue labelled `feedback`, and no inbox or Input Ledger
  line on how a run went since the 06 retro. Nothing to act on.
- **Tokens:** sprint 07 is the first sprint the workflow measured. Plan 46,712 · build
  [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md) 28,500 · build [SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md) 26,326 · build [SHS-066](tickets/SHS-066-production-river-run-restart.md) 17,972 · review 82,272 · close
  11,936: **213,718 before this retro**, whose own count only the workflow has. The review
  figure covers its step and all three reviewers; how it splits among them wasn't
  measured. Plan's figure includes the Playtester's check for open verdicts.
- **Against the last sprint:** sprint 06's steps ran by hand and weren't measured, so there
  is nothing to compare with. Sprint 08's retro makes the first comparison.

## Did the last retro's changes help?

- **Held.**
  - *The close step writes the records before the gate.* The order held; the red came from
    a ticket built outside the sprint, not from the order.
  - *A regression test shows red every run, with the count.* [SHS-066](tickets/SHS-066-production-river-run-restart.md)'s cases were red 5
    of 5 (the restart loop 2 of 5, recorded as such), and the reviewer reproduced 3 of 3.
  - *Layout evidence at 320 as well as 390.* [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md) measured both, and the reviewer found
    nothing new at 10 viewports.
  - *A game's clock is not the player's clock* (new rule 9). [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md) applied it to the
    power-up timers. The rest of the fork still counts frames (#46).
- **Didn't happen.** #21 as sprint 07's process ticket (above).
- **Now exercised.** *A production fix waits for review*: `production-fix-reviewed` was red
  at the push until the review record existed, then green. TD-012 and TD-013 were not
  touched.

## Hygiene check — GitHub, the planning notes, the skills

- **GitHub.** 27 commits since `studio-iteration-06`, no merges. The studio's are
  conventional and name their ticket. Eight are the arcade's: the executive's ADR-0011 set
  (the workflow, the skills, CI), one workflow fix, and the p0-17 roadmap row. No `studio`
  issue is open.
- **The planning notes.** The board, handoff, scorecard and index were on iteration 06, as
  expected: regenerated here. The index's *Say this* didn't mention "run the studio" and
  its list of skills lacked `studio-sprint` and `studio-request`: fixed. The scorecard's
  06 row still said *pending* for Keep / Iterate / Kill: it now shows the Playtester's.
- **The skills.** `studio-iteration`, `studio-sprint` and the workflow agree on the review
  step's models (ADR-0011). The prompts file and the workflow carry the same reviewer
  prompt and change together (change 1). `studio-standup` and `studio-promote` weren't
  used.
- **Did the last check's fixes hold?** Yes. The close-step order held, and the Q5 note on
  branches is still true: ADR-0011 brings branches back through #40.

## Epic review — E1, The Studio Wing opens

E1 asked for one forked game behind its 3D portal with a gameplay change a player could
judge, and it finished inside its three sprints without the reserve. Sprint 05 forked River
Run and pointed the 3D page's portal at it, with its own saves. Sprint 06 added the first
experiment, the power-ups, and the Playtester said Iterate. Sprint 07 acted on that and
got a Keep. On the way the fork found a freeze in the arcade's River Run, and the studio
fixed it through its production-fix rule, reviewed before push. What E1 didn't do is make
the game much more interesting: the power-ups made a run readable and gave it a goal, but
the Playtester's notes (#42, #45, #46) are about polish. The executive asked for games
that are interesting to play, and E2 is aimed at that.

| E1 done-when | Where it stands |
|---|---|
| A 3D portal leads to a studio fork; every other portal still leads to production | **Met** in 05 ([SHS-057](../05/tickets/SHS-057-portal-opens-fork.md)) |
| The fork never reads or writes a production save | **Met** in 05, and held through 06 and 07: no new keys |
| One gameplay change with a Keep / Iterate / Kill verdict | **Met**: Iterate on the power-ups in 06, then Keep on the pass that answered it ([SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md)) |
| The epic's rules are in the handbook | **Met** at this retro (change 2) |
| An epic retro proposes E2 | **Met**: E2 is under *Proposed next epic* in `direction.md` |

**E2, proposed: the studio's first original game worth playing.** 3 sprints (08–10) + 1
reserve. Its goal, done-when and out of scope are in `direction.md`. E1 was a fork, so E2
is an original game, as the charter asks epics to vary, with a hook of its own, built core
first and judged by the Playtester. The River Run fork's Ready fixes (#44, #42) can take
the second games slot in a sprint. #40 (branches and pull requests) keeps the process slot.

## Budget

Sprint 07 was **3 of 3** granted; the reserve is unclaimed and E1 closes. Plan 08 adopts
E2 unless the executive strikes or changes it.

## Reserved capacity

The 20% went to the review fixes (IR-1, IR-2, IR-4, IR-5), [SHS-063](../06/tickets/SHS-063-exempt-adr-0011-commits.md)'s relabel at close, the
arcade roadmap row (p0-17), the handbook edits here and this record. Debt: +0 / −0. No
shortcut was taken. The 0.1 s step cap below 10 fps is deliberate and written on the
ticket, and the frame-counted river is #46, a change someone could want rather than debt.
