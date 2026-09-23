# Iteration 04 — retrospective

## Went well

- **The studio made its first production fix, and it holds.** It is one line in Black
  Hole in One.
  - The tests went red on the unfixed file and green on the fixed one.
  - They refuse every partial and over-broad fix tried.
  - Both review rounds approved it on its own. QA measured it with real taps: 0 of 20
    trials threw as a player on the fixed build, and 20 of 20 on the unfixed one.
  - A defect that iteration 02 registered as a flaky test is gone from the live game.
- **Every push was checked before it went out and after it landed, and none broke the
  live site.**
  - The fixed `studio-live` found each new build between its first attempt and its eighth,
    with no waiting by hand.
  - The one post-deploy failure was the operator's: a marker copied from a line that wraps
    in the source. The check was right to fail it.
- **The new review rule worked on its first real use.** It refused [SHS-052](tickets/SHS-052-td-009-fixed.md)'s fix round,
  quoting the commit it had not seen, until round 2 approved that exact commit. Only then
  was the fix round pushed.
- **The two reviewers found different kinds of thing.**
  - The Independent Reviewer, on a different model, found the conceptual hole: the guard
    proves nothing about legitimacy, because the studio writes everything it reads.
  - QA found the mechanical ones: merges, releases, empty comparisons, stale markers, and
    a way round the new check.
  - Neither found the other's. That is the case for keeping them on different models,
    measured rather than argued.
- **Every reproduction a reviewer handed over became a regression test.** Each rule it
  closed was checked by a mutation that puts the hole back. When one mutation survived, it
  showed that a test could not reach the rule it was written for.

## Didn't go well

- **The production-fix guard claimed more than it proved.** The plan said it "decides
  from facts git records". It decides from an entry, a ticket file and commit subjects,
  all of which the studio writes, and the guard's own rules are in studio paths too. A
  fabricated fix that is consistent with itself passes. The lesson: a check that reads
  only what the checked party writes proves consistency, not legitimacy. Say which one it
  proves.
- **The trunk-based trial put the first production fix live before any review saw it.**
  ADR-0007 accepted "review sees work that is already live" for a realm with no player
  saves at stake, then applied it without asking whether a production game is the same
  case. [SHS-052](tickets/SHS-052-td-009-fixed.md) went live at 15:58 and was first reviewed after 16:01. Nothing broke. But
  the ordering was wrong, and review found it rather than the plan.
- **Checks that decided from the shape of history were defeated three times in one
  iteration.**
  - `--no-merges` hid a change made in a merge.
  - History simplification hid a merge that took a file from its side parent.
  - Ancestry coverage missed a file put back to the release after its review.

  Comparing content closed all three.
- **The vacuous comparison came back four times.** TD-011 was closed for
  `production-unchanged`. The same shape — a check passing on a comparison of nothing —
  was then found in:
  - `path-guard` and `commit-lint` on an empty range;
  - `studio-live` with no marker, or a marker the old build already had;
  - `postdeploy` exiting 0 having run nothing;
  - the new review check told to compare the release with `HEAD`.

  That is iteration 02's lesson 15, *write the rule about the thing, not the instance*,
  missed on the next structurally identical thing, for the third iteration running.
- **A number from memory, again.** The log said eight pushes where there had been five.
  The number came from another figure in view, not from a command.
- **The cap bound for the second iteration in a row, on checker code.**
  - Seven fix rounds, across four tickets.
  - [SHS-050](tickets/SHS-050-checks-every-push-can-trust.md), [SHS-051](tickets/SHS-051-production-fixes-under-full-process.md) and [SHS-054](tickets/SHS-054-production-fixes-reviewed-before-push.md) each used both of their rounds.
  - [SHS-051](tickets/SHS-051-production-fixes-under-full-process.md) ended with a known gap it may not fix (TD-013).
  - As in iteration 03, the final fix round shipped unreviewed. This time it was the
    rewritten review check.

## Changes, made in this iteration

1. **A production fix waits for an independent review before it is pushed, and is pushed
   exactly as reviewed.** `production-fix-reviewed`, ADR-0008, ADR-0007, `process.md`.
   [SHS-054](tickets/SHS-054-production-fixes-reviewed-before-push.md).
2. **A check that asks "is this what was reviewed, or released?" compares content, not
   history.** ADR-0008 and the learning log.
3. **No check passes on a comparison of nothing.** It is encoded in each check that
   compares two revisions: `path-guard`, `commit-lint`, `production-unchanged`,
   `studio-live`, `production-fix-reviewed`. `postdeploy` is conclusive, so a `not run`
   fails it. [SHS-050](tickets/SHS-050-checks-every-push-can-trust.md) and [SHS-054](tickets/SHS-054-production-fixes-reviewed-before-push.md).
4. **A check says what it proves.** ADR-0008's *What the guard proves, and what it
   cannot* is the model. The learning log.
5. **A marker is copied from the diff, a number from a command.** The learning log. The
   marker rule is also enforced now: a marker the last release already had is refused.

## Tried this way, next time the other

Iteration 03 said two practices would be tried the other way here. Each is judged from
what happened.

**Branch per ticket → trunk-based.** ADR-0007 asked five questions.

- **How many pushes, and how soon was the first deploy?**
  - Eleven pushes before the one carrying this retrospective.
  - The iteration's first commit was at 15:25. It was pushed and live by 15:28.
  - In iteration 03, nothing reached the live site until the end.
- **Did any push break the live site?** No. Every push passed its post-deploy checks.
- **Did a post-deploy check on a ticket's push catch something an end-of-iteration push
  would have caught later?** Yes, twice.
  - TD-010 showed on the very first push.
  - [SHS-052](tickets/SHS-052-td-009-fixed.md)'s post-deploy output said "nothing outside the guard changed" above a list of
    two admitted production files. That was fixed as [SHS-051](tickets/SHS-051-production-fixes-under-full-process.md)'s first fix round.
- **Did review find more or less than in 03, and of what kind?** More: 24 findings against
  19.
  - Round 1: 17. Round 2: 7.
  - Almost all were about the new production-fix mechanism and about checks passing on
    nothing. None was a defect a player would hit.
- **Is the history easier to read?** Yes. It is linear, each ticket's commits are one
  `git log --grep` away, and there are no merge bubbles.

**Verdict: keep trunk-based for studio work, with the exception review taught it.** A
production fix waits for review. The trial found that exception rather than planning it,
which is what a trial is for.

**The executive breaks a rejected round → the team does.**

- **Did iteration 03's call hold?** Its unreviewed fix round was the TD-009 diagnostic's
  final form. In this iteration:
  - it was run on the fixed tree, and exited 0;
  - QA re-ran it independently, with the same result word for word;
  - its checks now live in production's suite, where both round-2 passes tried decoys
    against them.

  Nothing in it turned out wrong. The call held.
- **This iteration made the same call again.** The Independent Reviewer approved, QA
  rejected, and the team shipped for the reasons in `review.md`. Iteration 05 judges it.

**What 05 tries the other way.** Checker changes here were built first and attacked
after. Seven fix rounds followed, and the cap bound twice. Next time, a checker ticket's
attack list comes first: QA writes the cases the rule must refuse before the code is
written, and the build starts from them as tests. Iteration 05's retrospective judges
whether that cost fewer rounds.

## Hygiene check — GitHub, the planning notes, the skills

The executive's quality bar asks every retro to check the three surfaces the work lands on,
and whether the last check's fixes held.

- **GitHub.**
  - The history is linear, and every commit is conventional and names its ticket
    (`commit-lint`).
  - `hygiene` finds no secret, private path or personal identifier, and it now also scans
    the two production files the studio changed.
  - The root `README.md` is **still one line**. Carried a second time. It is production
    documentation, so it is now a production fix under ADR-0008: the first item for 05.
- **The planning notes.**
  - Regenerated from the repository at close-out.
  - The design note was brought up to date mid-iteration: trunk-based work, the production
    fix, review before push.
  - The questionnaire gained one decision that is the executive's alone (Q10).
- **The skills.**
  - The iteration skill was updated to the `push` stage, `--marker-at`, production fixes
    and the STOP-file gap. The rule that production fixes wait for review still needs to
    go into it.
  - The skill files live outside this repository and have no version history. That makes
    them the one steering document with no record of how it changed. The executive's
    question this iteration about keeping the repository and the planning notes apart
    raised it. Worth deciding outside the studio.
- **Did the last check's fixes hold?**
  - The skills were brought up to the new prefix last time, and are current again.
  - The README was not written, as the plan said it would not be.

## Did the last retro's changes help?

Partly, and the pattern held once more.

- **Held.**
  - *A diagnostic's "fixed" tests the defect itself and proves its precondition first.*
    Every new TD-009 test proves its precondition, and the strengthened one proves a marked
    burst is drawn before requiring it to survive.
  - *Before calling a test flaky, run the player's path.* QA did, with real taps, in both
    rounds.
  - *Every browser trial gets its own profile.* This was designed into the new tests from
    the start, because the game remembers the last mode played.
- **Did not hold.**
  - *A convention change is checked for violations of the new rule — as a test, not a
    search.* The production-permission sweep was a search, and it missed two passages and
    a paragraph saying only the gate is conclusive.
  - *A number in the record names where it was measured.* The push count broke it.

Both are the same failure as before. The lesson was applied to the thing it was learned
on, and missed on the next one. The response that has worked is a test, not a sentence.
This iteration's lessons 2 and 3 are encoded in checks for that reason.

## Reserved capacity

All of it went to debt and process: TD-009, TD-010 and TD-011 were closed, and TD-012 and
TD-013 were opened and registered. Documentation had its share: ADR-0008, a sweep of the
handbook, and this record. Learning is in the learning log. None of it was cut.
