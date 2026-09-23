# Iteration 05 — retrospective

**Epic:** E1 · The Studio Wing opens · sprint 1 of 3 (+1 reserve), now spent: 1 of 3.

## Went well

- **The sprint goal is live and a player can walk it.** The River Run portal on the 3D page
  opens the studio's copy of River Run, which keeps its own `studio_riverRun_*` saves. A
  browser test walks into the portal and lands on the fork. Another logs every storage
  write the fork makes and refuses any production key.
- **No fix rounds.** 0 of 2 used on every ticket, against 7 in iteration 04. Three things
  changed at once, so no single one gets the credit:
  - the refusal cases were written into [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md)'s criteria at plan;
  - its tests went red first (six of seven failed on the old checks);
  - the one-round review rule (direction rule 3) means findings go to the backlog rather
    than into a second round.
- **The fork is provably a copy.** Every difference from production River Run is listed in
  `tests/studio/lib/river-run-fork.mjs` and proved byte for byte. The first boot found four
  places where production River Run fails the studio page contract, and the list is what
  made them visible, not a reviewer.
- **The shared `main` works for both.** Arcade commits no longer read as studio violations,
  and the reverse rule caught a migration commit the ticket hadn't named (`7712cf2`).
  History since `studio-iteration-04`: 26 commits, 20 of them the studio's, no merges.
- **Review found things neither author pass saw, again on different axes.** The
  Independent Reviewer found that scope was the only signal that put a production change
  under the guard (IR 1). QA found that an arcade portal edit would trip the exception
  (F2), and that uncommitted work reads as studio work (F3). All 12 distinct findings
  were fixed, put on the backlog or declined with a reason.
- **One step per session held for six sessions.** Each session did its one step and pushed
  its records. Each next session started from `next.md` alone.

## Didn't go well

- **A push went out on a filter's exit code** (session 3). The chain pushed after
  `full-suites` failed, because a `grep` after the stage returned success. The suites
  passed on a rerun, but which one flaked wasn't captured. Session 4 followed the rule
  from the log and gated on the stage itself, and it held.
- **A browser test waited on chance** (session 4). [SHS-056](tickets/SHS-056-river-run-fork.md)'s test waited for the game to do
  something on its own, and one run in three outlived its 60-second wait. Fixed in
  `045f031` so the run ends deterministically.
- **The studio handed arcade doc edits back to the executive** (session 5). The executive
  said not to draw that line. It is now a guardrail: the studio keeps the arcade docs about
  its own work current, in its own arcade `docs:` commit.
- **A 115-character commit subject was caught only by the reviewer.** Ceremony commits
  skipped `--stage=ticket`, which would have refused it.
- **The record ticket's criteria spanned two steps** (session 6). [SHS-058](tickets/SHS-058-iteration-record.md) listed retro-step
  work as criteria, but the gate needs the ticket Done before the retro exists.
  `docs-current` failed twice before the criteria were amended at close, with a note.
  Iteration 04's [SHS-053](../04/tickets/SHS-053-iteration-record.md) had avoided the failure only by ticking `retro.md` early.
- **Iteration 04's unreviewed fix round is still unjudged.** Iteration 04 shipped
  `production-fix-reviewed`'s content comparison without a review and asked this retro to
  judge it. This sprint had no production fix, so the check ran only on a range with
  nothing for it to judge, and it was outside both reviewers' diff. No evidence either
  way. The first production fix will exercise it, and that fix's review should read the
  check too (note on backlog #10).

## Changes

1. **The ticket template separates the record ticket's two steps.** `templates/ticket.md`
   now says: the record ticket's criteria are what close checks; the retro-step work is
   listed under *Done at the retro*, never as a criterion. This retro makes the edit.
2. **The ticket template asks a checker ticket for its refusal cases.** A ticket that adds
   or changes a check lists, in its criteria, the inputs the rule must refuse. The build
   starts from those as red tests. This is what iteration 04 asked to try, in the form
   that was actually tried here (see below). This retro makes the edit.
3. **`learning-log.md` opens with an Active rules list**, ten at most (direction rule 7,
   backlog #13). The three lessons of this sprint that aren't template edits are on it:
   gate a push on the stage's exit code; a browser test waits on what it causes; run
   `--stage=ticket` before every commit, ceremony ones included.
4. **Backlog: the executive's steering edits get a commit form the checks accept** (#21),
   moved into the top five. Today an inbox line or a questionnaire answer committed by the
   executive fails either the path guard or the lint. This is the main way to steer, so it
   should be the machinery ticket for sprint 06.

## Tried this way, next time the other

Iteration 04 said a checker ticket's attack list should come first, written by QA before
the code.

- **What was tried.** Not quite that. No QA pass ran at plan. The Tech Lead wrote the
  refusal cases into [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md)'s criteria: the reverse rule, a mixed merge, an unnumbered
  `(studio)` commit. The tests were written from them and shown red first.
- **What it cost.** Zero fix rounds, against 7 in 04. One review round, against two.
- **What it missed.** A commit naming a studio ticket without the `(studio)` scope, which
  the Independent Reviewer found (IR 1). That is a refusal case a second author might well
  have written, which is the argument for QA writing the list.
- **Verdict: keep refusal cases in the criteria, written at plan and tested red first**
  (change 2). A QA subagent at plan isn't worth a session under the lighter process. The
  review pass still attacks the list afterwards, and that is where IR 1 came from.

## Hygiene check — GitHub, the planning notes, the skills

- **GitHub.**
  - Linear history: 26 commits since `studio-iteration-04`, no merges. `process.md` now
    says to rebase, not merge (IR 7).
  - Every studio commit is conventional and names its ticket; `commit-lint` passed at the
    gate.
  - The root `README.md` is **still one line**, carried a third time (#10). It needs a
    production fix under ADR-0008. It stays in the top ten, behind the sprint 06
    experiment.
- **The planning notes.**
  - They now live in `docs/studio/steering/`, with history, since 2026-09-22.
  - The board, the handoff, the scorecard and the index were all still on iteration 04
    until this retro. None of them is regenerated at close, only here.
  - `public-repo-hygiene.md` still says direction is kept outside the repository (#14,
    unchanged).
- **The skills.**
  - `studio-iteration` moved into the repo with the steering views, so it now has version
    history. That closes the concern iteration 04 raised.
  - It is current with `process.md` on production fixes waiting for review.
  - It says to open a record ticket but not how, so change 1 goes in the template the plan
    step already reads.
- **Did the last check's fixes hold?**
  - Skills current: yes.
  - README: no, as the plan said.

## Did the last retro's changes help?

- **Held.**
  - *A production fix waits for review.* Not exercised: there was no production fix.
  - *Compare content, not history.* [SHS-056](tickets/SHS-056-river-run-fork.md)'s fork list is byte for byte, and [SHS-057](tickets/SHS-057-portal-opens-fork.md)'s
    exception compares the file with the approved value undone.
  - *No comparison of nothing passes.* It was designed in from the start this time:
    `commit-lint` on a range with no studio commit is a skip, not a pass.
  - *A check says what it proves.* [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md) wrote a *What this proves, and what it does
    not* section before review asked for one.
  - *A marker from the diff, a count from a command.* No incident in the log. The counts in
    this retro come from `git log` and the review table.
- **Slipped once.** A test name claimed more than its test proved (IR 1), which is *a check
  says what it proves* at the scale of one test. It was renamed in `b897707`.

This is the first retro where the previous one's changes held without an exception worth
a rule. Most of them were encoded as checks in iteration 04, which is the pattern the last
two retros pointed at.

## Budget and the epic

Sprint 05 is **1 of 3** granted, with the reserve unclaimed.

| E1 done-when | Where it stands |
|---|---|
| A 3D portal leads to a studio fork; every other portal still leads to production | **Met** ([SHS-057](tickets/SHS-057-portal-opens-fork.md); QA checked all 11 portal targets) |
| The fork never reads or writes a production save | **Met** ([SHS-056](tickets/SHS-056-river-run-fork.md); the write log refuses any non-`studio_` key) |
| One gameplay change with a Keep / Iterate / Kill verdict | Open: sprint 06's experiment (Q12, ⭐ power-ups if blank) |
| The epic's rules are in the handbook | Partly: `process.md` and ADR-0009 have one step per session and one review round; the Active rules list lands here. The rest go in with sprint 07's epic review |
| An epic retro proposes E2 | Open: sprint 07 |

On track. The plan for sprint 06 is the direction's: the first experiment in the fork.

## Reserved capacity

The 20% went to review fixes (`b897707`, `607d40b`), the arcade docs about River Run
(`63b8190`), the fork procedure in `forking.md`, ADR-0010, and this record. No debt row
was closed. One was opened: TD-014, the fork test's named Tone.js exemption, which closes
with #22.
