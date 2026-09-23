# Iteration 03 — retrospective

## Went well

- **The planned work was small and stayed small.** Three committed tickets, one opened by
  the build, and none opened by a review: every finding went into a fix round on the ticket
  it was about. Iteration 02 had fifteen review-opened tickets.
- **A "flaky test" turned out to be a real defect, and was measured before it was named.**
  TD-009 was registered in 02 as a test that fails one run in three. Running the player's
  path instead of the test's showed that a player reaches it every time, by four routes,
  and that New Map — the test's subject — has nothing to do with it. The one-line fix was
  tried on scratch copies and never on the real tree.
- **A check found its own history wrong on its first run.** Reading every commit subject
  in the repository, `docs-current` named the three tickets that had shipped without files,
  and a full-history lint found a pushed commit the previous gate had never seen.
- **The review cap did what it was written to do.** Two rounds, then a stop. The second
  round's rejection goes to the executive rather than into a third round.
- **Model diversity produced evidence, not just a policy.** In round 2 the reviewer, on a
  different model, and QA, on the author's, found the same primary defect independently.
  In iteration 02 the same agreement between two passes on one model was ambiguous: it
  could have been a shared blind spot. This time it cannot be one of *priors*, which makes
  the finding stronger.

## Didn't go well

- **The TD-009 check was wrong twice in the same way.** Round 1: it tried the route it was
  built from, so a fix for that route alone read as *fixed*. Round 2: the direct check added
  to close that gap ran in the start menu's state — the same state a route-specific fix
  keys off — and never confirmed its own precondition. Both are iteration 02's lesson 12, *a
  rule needs an observation in the configuration where it can fail*, missed on the check
  written in the round that was meant to apply it.
- **A convention change was checked for the old spelling, not for the new rule.** After
  the prefix change, the search for leftovers looked for `SS-NNN`, and missed `SHS-003` — an
  example the new rule rejects, sitting in the paragraph that states the rule. Lesson 15
  from iteration 02, *write the rule about the thing, not about the spelling*, applied to
  the lint and not to the check for leftovers.
- **Numbers again.** [SHS-047](tickets/SHS-047-pushed-commit-waiver.md)'s counts were taken on uncommitted trees and did not say so;
  TD-009's first write-up stated a one-in-three rate measured over three runs, and its
  second stated counts from a harness outside the repository. Lesson 9, *a number in a
  Result is evidence*, needed a sharper form: say where it was measured, and don't put a
  number in the public record that the repository cannot reproduce.
- **The first real-tap measurement read 1 in 5, then 1 in 20**, because every trial shared
  one browser profile and the game remembers the last mode played. Caught before anything
  was written down, but only because both hits were on the first run of a batch.
- **Preflight went red on a clean start.** The executive's change of prefix arrived as
  uncommitted edits while the baseline suites ran. The run stopped and asked, which was
  right; the two-minute window it opened is worth knowing about.

## Changes, made in this iteration

1. **A diagnostic's *fixed* verdict tests the defect itself, in a state the fix cannot key
   off, and proves its own precondition first.** Added to `team/qa-engineer.md`'s working
   notes and the learning log. [SHS-046](tickets/SHS-046-iteration-record.md).
2. **Before calling a test flaky, run the player's path.** `team/qa-engineer.md`. [SHS-046](tickets/SHS-046-iteration-record.md).
3. **A convention change is checked for violations of the new rule, not for leftovers of
   the old spelling** — and the check is a test, not a search. Made concrete by [SHS-043](tickets/SHS-043-ticket-prefix.md)'s
   example-subject test; stated in the learning log. [SHS-046](tickets/SHS-046-iteration-record.md).
4. **Every browser trial gets its own profile.** Learning log. [SHS-046](tickets/SHS-046-iteration-record.md).
5. **A number in the public record names where it was measured, and is reproducible from
   the repository or left out.** Learning log. [SHS-046](tickets/SHS-046-iteration-record.md).

## Tried this way, next time the other

The executive's direction for how the company improves: try one way, hold a retro, try
another, hold a retro. Two things this iteration did one way are tried the other way next.

- **Branch per ticket → trunk-based.** Every ticket here was a branch merged with `--no-ff`,
  and the whole iteration reached the live site in one push at the end. Iteration 04
  commits to `main` and pushes each ticket when it is green. ADR-0007 says what that is
  testing and the questions its retro answers. [SHS-048](tickets/SHS-048-trunk-based-trial.md).
- **The executive breaks a rejected review's tie → the team does.** Asked to break this
  one, the executive handed it back to the team. The team shipped, and gave its reasons in
  `review.md`. Iteration 04's retro asks whether that was right: did anything in the
  unreviewed fix round turn out wrong?

## Carried to the next iteration

- **TD-009's fix**, under the executive's new standing permission for production fixes —
  which first needs a decision record and an edit to `guardrails.md`, since the path guard
  currently forbids it.
- **A real repository README** (from the hygiene audit, below). The root `README.md` is
  outside the path guard, so it falls under the same permission.
- **The 3D zone as the studio's window**, the executive's answer on the portal question:
  its shape is the next iteration's to design.
- **A decision record for the `docs-current` rewrite in iteration 02**, and a
  **claim-evidence rule** — a Result that says *tested* or *closed* names the artifact that
  proves it. Both suggested by an automated process review during this iteration; both are
  good, neither was planned here.

## Hygiene check — GitHub, the planning notes, the skills

The executive's quality bar asks every retro to check the three surfaces the studio's work
lands on, and whether the last check's fixes held. This is the first.

- **GitHub.** Conventional commits with ticket IDs across the whole iteration, every one
  linted; one earlier commit waived by hash, visibly. No secret, private path or personal
  identifier in any studio-owned file (`hygiene`). The repository's root `README.md` is a
  single line — a bare URL — which tells a stranger nothing: carried forward, above.
- **The planning notes.** Regenerated from the repository at close-out, as every
  iteration.
- **The skill files.** The iteration skill named the old ticket prefix and was updated in
  this iteration. The audit reported the three studio skills as missing; they exist, in
  the private planning workspace rather than in this repository, and are not linked from
  the public handbook because the link would be a private path. They are the executive's
  tooling; this handbook is the process they follow.

## Did the last retro's changes help?

Partly, and the pattern named in iteration 02 held again.

- **Held:** *an exemption ships with its attacks in the same commit* — [SHS-047](tickets/SHS-047-pushed-commit-waiver.md)'s waiver
  shipped with four, and no review defeated it. *A claim about another document is checked
  against that document in the same edit* — the reconstructed tickets' first draft claimed
  everything in them was read off the commit, and that was caught and corrected before
  review. The review cap, new since the last retro, held at two.
- **Did not hold:** lessons 9, 12 and 15, above. Each was applied to the thing it was first
  learned on and missed on the next structurally identical thing — the check written to
  close a finding, the search written to verify a rule, the count written to support a
  claim.

The response last time was to make each lesson a step with an artifact. That worked where
the artifact was a test: the prefix rule, the ticket-file rule and the waiver all held
against both reviews. It did not work where the artifact was a sentence in a document. So
changes 1 and 3 above are written as things a test or a check can enforce, where that is
possible, and the TD-009 check's own verdict logic now encodes change 1.

## Reserved capacity

Used, and more than a fifth: [SHS-044](tickets/SHS-044-td-009-diagnosed.md) worked an open debt row and [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) closed a gap in a
gate check before it was ever registered. Two of three committed tickets were debt.
