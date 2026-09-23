# Iteration 06 — retrospective

**Epic:** E1 · The Studio Wing opens · sprint 2 of 3 (+1 reserve, unclaimed), now spent: 2 of 3.

## Went well

- **The fork changed for the first time, and a player can judge it.** A shield and a spread
  shot float down the River Run fork's river ([SHS-060](tickets/SHS-060-river-run-power-ups.md)). Both landed in one session, so the
  split the backlog allowed wasn't needed. Each has a browser subtest shown red by a
  mutation first.
- **A bug was reproduced before it was fixed, and the reproduction changed the fix.**
  [SHS-061](tickets/SHS-061-river-run-tone-start-time.md) was planned as a Tone.js start-time clamp. The stack said the throw was
  `Sequence.stop()` against a stopped Transport, and that it aborted the restart before the
  game loop. A clamp would have hidden a frozen river.
- **The fork found a production bug.** The Independent Reviewer ran the fork's restart loop
  against the arcade's River Run and got the same freeze (28 of 39 restarts). It is queued
  in both lanes (arcade 🐞 p0-17, studio #33). Having a copy next to the original is a way
  to test the original, not only to change it.
- **The executive's focus shipped the sprint it was asked for.** [SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md) linked 378 ticket
  mentions in 48 files. Two cases a check reads (a file's title line, commit subjects) were
  found at build by reading what the checks parse, before anything failed.
- **One review round, both passes approving with findings.** The one new player-facing
  defect (fast taps with the spread shot firing nothing, QA F1) was fixed in the review
  step. Every finding became a fix, a backlog row or a reasoned decline. Fix rounds: 1, on
  [SHS-060](tickets/SHS-060-river-run-power-ups.md), against 0 in 05 and 7 in 04.
- **One step per session held for a second sprint.** Six sessions, six steps, each pushed
  its own records, and each started from `next.md` alone.

## Didn't go well

- **The gate was red on `docs-current` at close, for the second sprint running.** In 05
  the cause was the record ticket's criteria. The template fixed that, and the criteria
  held this time. The cause now was order: the `studio-iteration` skill's `close` step said
  *gate, publish, then write the records*, while `process.md` says *document, gate,
  publish*. The gate needs the record ticket Done, so following the skill fails it every
  time. A lesson that recurs becomes a skill edit (change 1).
- **A regression test that catches its bug by chance.** [SHS-061](tickets/SHS-061-river-run-tone-start-time.md)'s 20-restart test was red
  before the fix and green after, as rule 4 asks. But against the fix reverted it went red
  only 6 of 7 runs (IR) and 4 of 6 (QA): it waits for a race to happen rather than making
  it happen. That is Active rule 6 again, one sprint after it was written (#37 makes the
  test deterministic).
- **Layout evidence at one width.** [SHS-060](tickets/SHS-060-river-run-power-ups.md)'s phone screenshots were taken at 390 wide. At
  320 and 375 the score wraps to two lines and the power-up HUD covers it (#35). The build
  saw the controls overlap at 390 and filed it, but never tried a narrower phone.
- **The shelf still said the fork "plays exactly like the original".** The realm's River
  Run card was written at 05 and nothing at close asked for it to change when the
  experiment shipped. The pulse and retro lines are tied to the iteration by a test; the
  shelf's blurbs aren't. Found here and fixed in this step.
- **The seconds on the power-up HUD are frames.** River Run counts everything in frames, so
  on a 120 Hz phone "6.0s" lasts 3 s (QA F5). The build copied the game's clock without
  asking what a player reads from it. Declined at review because it predates the sprint; it
  is now #38, waiting on the executive's verdict.
- **The process slot went twice to something other than #21.** The executive's focus
  took it this sprint, for a good reason, and the executive's steering edits still have no
  commit form the checks accept.

## Changes

1. **The `studio-iteration` skill's `close` step writes the records before the gate**
   (`review.md`, the changelog, the pulse line, the shelf entries of games that changed, the
   tickets closed), then runs the gate, then publishes. That matches `process.md`. This
   retro makes the edit, in its own arcade `docs:` commit, since the skill sits outside the
   studio paths and is documentation about the studio's own work.
2. **The ticket template's evidence plan asks for two things:** a regression test's red
   count against the unfixed code (red every time, with the number of runs), and layout
   evidence at the narrowest width the game supports (320) as well as a typical phone. This
   retro makes the edit.
3. **Active rules: one converted, one split, one promoted.** Rule 1 (*a comparison of nothing never
   passes*) is encoded in every check that compares two revisions, so it leaves the list.
   Rule 6 (*a browser test waits on what it causes*) recurred: its first half becomes the
   template edit above, and its second half (every browser trial gets its own profile)
   stays on the list on its own. The new rule is *a game's clock is not the player's
   clock*.
4. **Backlog.** #35 moves up with #33 and #37, since the team's verdict on the power-ups is
   Iterate. #38 is new: power-up timers in real time. #21 stays in the top five, for
   sprint 07's process slot.

## Did the last retro's changes help?

- **Held.**
  - *The record ticket's criteria belong to `close`.* [SHS-062](tickets/SHS-062-iteration-record.md) lists retro work under *Done at
    the retro*. The gate's red was a different cause (the order of the close step).
  - *Run `--stage=ticket` before every commit.* `commit-lint` passed at the gate, and no
    subject was over length.
  - *Gate a push on the stage's own exit code.* No incident in the log.
  - *The Active rules list.* It exists, it was read at build, and this retro is the first
    to convert rules out of it.
- **Held in part.** *A checker ticket lists its refusal cases.* [SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md) isn't a check, but
  its linker is a rule over text, and the same idea applied: the build listed the shapes to
  leave plain and tested each. Review still found seven shapes it would mislink (IR 3). The
  lib now names them (`c361b17`) and #36 decides between guarding and parsing.
- **Didn't happen.** #21 as sprint 06's process ticket. The executive's focus took the
  slot. It is first in line for sprint 07's.
- **Still unexercised.** *A production fix waits for review*, and iteration 04's unreviewed
  content comparison in `production-fix-reviewed`. There was no production fix again. #33 is
  the first in line, and its review should read that check too.

## Hygiene check — GitHub, the planning notes, the skills

- **GitHub.** 16 commits since `studio-iteration-05` (`git log --oneline
  studio-iteration-05..HEAD`), no merges. The studio's are conventional and name their
  ticket. Three are the arcade's: p0-16, the two linked Black Hole in One docs, the p0-17
  bug row. The root `README.md` is still one line (#10), carried a fourth time; it waits
  for a production-fix slot, and #33 has that slot in sprint 07.
- **The planning notes.**
  - The board, handoff, scorecard and index were on iteration 05 until this retro, as
    expected: they are regenerated here.
  - `SHS-061`'s Result still carried the template's *"Empty until then"* line under its
    filled fields. Removed here.
  - Q5's standing answer in the questionnaire says work "may live on a branch". That was
    written before ADR-0007 made the studio trunk-based. It is the executive's text, so it
    isn't rewritten; a note under it says ADR-0007 supersedes the branch part.
- **The skills.** `studio-iteration` was out of step with `process.md` on the close step's
  order (change 1). `studio-standup` and `studio-promote` weren't used this sprint; nothing
  in the sprint changed what they read.
- **Did the last check's fixes hold?** The skill moved into the repo at 05 and has history.
  That is what made the close-step mismatch findable: `git log` shows the skill's close
  order has been the same since the executive's ADR-0009 commit.

## Budget and the epic

Sprint 06 is **2 of 3** granted, with the reserve unclaimed.

| E1 done-when | Where it stands |
|---|---|
| A 3D portal leads to a studio fork; every other portal still leads to production | **Met** in 05 ([SHS-057](../05/tickets/SHS-057-portal-opens-fork.md)) |
| The fork never reads or writes a production save | **Met** in 05, and held: [SHS-060](tickets/SHS-060-river-run-power-ups.md) added no key, and QA's write log saw only `studio_riverRun_*` |
| One gameplay change with a Keep / Iterate / Kill verdict | **Shipped, waiting on the verdict.** The team's is Iterate; the executive's is asked in [review.md](review.md) |
| The epic's rules are in the handbook | Partly, unchanged since 05. Sprint 07's epic review moves the rest from `direction.md` into `process.md` |
| An epic retro proposes E2 | Open: sprint 07's retro |

On track, with one dependency the team doesn't control: the verdict. Sprint 07 is E1's last
granted sprint, so its plan should hold #33 (a production bug players can hit), act on
whatever verdict has arrived (#35 and #38 on Iterate or Keep, a removal on Kill), and leave
the retro room to write the epic review and propose E2. The reserve isn't claimed now. If
the verdict arrives after sprint 07's plan, the 07 retro decides whether a reserve sprint
is worth acting on it.

## Reserved capacity

The 20% went to the two review fixes (`8a7a604`, `c361b17`), the arcade docs (`c98e8b2`
linking two Black Hole in One docs, `6911474` the p0-17 bug row), closing TD-014 inside
[SHS-061](tickets/SHS-061-river-run-tone-start-time.md), and this record. Debt: +0 / −1 (TD-014 closed). No row was opened; the
frame-counted timers and the linker's misread shapes are backlog items (#38, #36), because
each is a change someone could want, not a shortcut taken.
