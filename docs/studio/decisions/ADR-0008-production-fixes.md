# ADR-0008 — The studio fixes production, under the full process, one ticket per file

- **Status:** Accepted
- **Date:** 2026-09-21
- **Iteration:** 04

## Context

Until now the studio could write only inside `studio/`, `docs/studio/` and `tests/studio/`,
plus two exceptions each approved once for one narrow edit (ADR-0002, ADR-0005). A
production defect the studio found could be diagnosed and specified, and then had to wait.

That happened with TD-009. Iteration 03 traced a Black Hole in One defect that players hit
by every route tried, reproduced it deterministically, and specified a one-line fix it was
not allowed to make. The same defect makes the repository suite fail some of the time,
which weakens the studio's own "the whole suite is green before a push" guarantee.

The executive then gave the studio standing permission to make fixes to production files,
on one condition: that the whole sprint process runs, with its documentation, the way a
real engineering team works. They asked that the permission be written into the handbook
by a decision record before it is first used.

A sentence in a handbook does not stop a stray write. The path guard does, so the
permission has to be something the guard can check.

## Decision

**The studio may change a production file as a fix, through the full process.** Each one:

1. **Is a ticket** that passes the Definition of Ready and lists every production file it
   will change.
2. **Is recorded in `PRODUCTION_FIXES`** (`tests/studio/lib/rules.mjs`): one entry per
   file, naming the ticket and the iteration.
3. **Is proved** by a regression test that fails without the fix and passes with it,
   shown on the ticket.
4. **Is independently reviewed before it is pushed**, and then passes everything a studio
   change passes: the whole repository suite before the push, the iteration's review
   rounds, the gate, and the post-deploy checks — with a marker proving the fixed file is
   the one being served. See *Reviewed before it is pushed*, below.
5. **Is written up** on its ticket, in the changelog, in the debt register when it closes
   a row, and in the retrospective.

**The path guard admits a production file only when all three hold:**

- an entry for that exact path names the iteration being checked;
- that entry's ticket has a file in that iteration's `tickets/` directory;
- every commit since the previous release that changed the file names that ticket — a
  merge commit included, when the merge itself made a change to the file.

It also refuses a fix file that was **deleted**, and any commit to a fix file made **after
the iteration's own tag** exists: once an iteration is released, its fixes are closed.

Anything else outside the studio's paths is a violation, as before. `production-unchanged`
applies the same rule after the deploy. Every admitted file is named in the check's output
with its ticket and its line counts, and `hygiene` scans it. The rule decides from entries,
file names and git history only; it reads no Markdown.

An entry for the current iteration takes precedence over a narrow exception on the same
file: a defect elsewhere in a file with an exception is fixed through the full process
rather than refused by the narrower rule. In any other iteration the exception governs the
file again. The narrow exception's grammar exists because that edit needs no review; a fix
gets a review before it is pushed, so it does not need the grammar.

### What the guard proves, and what it cannot

The guard proves that a production write was **planned and recorded**: an entry, a ticket
file and the commits that made the change all agree. A write that nobody planned fails it.
That is the kind of mistake it exists to catch.

It **cannot** prove that the plan was legitimate. The entry, the ticket file and the
commit subjects are all written by the studio. So are the guard's own rules, which live in
`tests/studio/`. A fabricated fix that is consistent with itself passes. Iteration 04's
first review demonstrated exactly that, with a made-up ticket and an edit to `index.html`.
Nothing inside the repository can close this, because the party being checked can write
everything the check reads.

What stands between a production fix and the live site is therefore an **independent
review before the fix is pushed**, below. The studio records that review too, so the
check that enforces it makes the review impossible to *forget*, not impossible to *fake*.
Making it impossible to fake would take a signal from outside the repository, such as an
approval the executive gives on the hosting platform. That choice is the executive's.

### Reviewed before it is pushed

Under trunk-based work a finished ticket is pushed at once, and so is live at once
(ADR-0007). For a production fix that put a change players see live before any
independent review had seen it. The first fix, SHS-052, went out that way. So **a
production fix is the one exception to "push when a ticket is done"**:

- its commits are committed and stay local until an independent review has passed them —
  fresh context, and a different model from the author for at least one pass;
- the review is recorded in `iterations/NN/reviews/<TICKET>.md`, naming the full hash of
  the commit it saw on one `**Reviewed:**` line and its verdict on one `**Verdict:**` line;
- `production-fix-reviewed`, in the `push` and `gate` stages, refuses the push unless:
  - the verdict begins with `APPROVED`;
  - the reviewed commit is in `HEAD`'s history;
  - **every commit that changed one of the ticket's production files is contained in the
    reviewed commit**.

  A fix changed after its review is refused until it is reviewed again.

The check makes the review impossible to forget. It cannot make it impossible to fake,
for the reason given above.

**What counts as a fix:**

- correcting a defect in production — behaviour a player can hit, or a test that fails
  because of production code;
- a debt-register row whose remedy lies in production;
- production documentation that is wrong or missing, such as the repository's root
  `README.md`;
- the tests that prove any of those.

**What does not, and still stops the run to ask:**

- new features, and any change to how a game plays or looks beyond restoring the behaviour
  it was meant to have;
- a fix that needs a design choice between two reasonable behaviours — that is a
  questionnaire, not a ticket;
- moving a studio game into the arcade, which keeps its own process (`promotion.md`);
- removing, renaming or re-listing a production game;
- dependency, build or tooling changes to the whole repository;
- anything touching releases, accounts, credentials or money;
- rewriting history, or reverting production work the studio did not do.

## Consequences

- The studio can finish what it diagnoses. TD-009 is the first use, in this iteration.
  TD-005 and TD-006, both production-side debt, become eligible.
- **The studio's worst case gets bigger.** It used to be a messy `studio/` folder. Now it
  includes a production fix that is wrong. That is contained by the regression test, the
  whole suite, review and the post-deploy checks. It is undone with one revert commit whose
  subject names a ticket, since `commit-lint` reads every subject:
  `git revert --no-commit <sha>`, then `fix(studio): SHS-NNN revert <short sha>`. A revert
  that restores the previous release exactly leaves no production file changed since
  then, so it needs no entry and no review.
  Every production fix is also listed in one place.
- A production fix goes through the whole sprint: plan, ticket, review, retrospective. For
  a one-line fix that is a lot of ceremony. The executive asked for exactly that.
- `PRODUCTION_FIXES` grows with every fix and is never pruned. It is the record of every
  production file the studio has changed, and why.
- A production file that another ticket also changed in the same iteration fails the
  guard. Two tickets fixing one file must both be listed for it.

## Alternatives considered

| Option | Why not |
|---|---|
| A one-time exception per fix, as ADR-0005 did | The executive's permission is standing. A new exception per fix means one-off approvals and a content rule per file. ADR-0005's rule took two review rounds and sixteen demonstrated bypasses to get right. |
| Admit every production path once the permission exists | That would turn the path guard into a sentence. The guard's job is to catch a write nobody meant to make, and "the studio may fix production" doesn't say which write was meant. |
| Declare the files on the ticket and have the guard read the ticket | That means the guard reads Markdown. The studio's last checker to do that was defeated ten times. |
| Leave production to its own workflow, outside the studio | That was the situation before, and it left a player-facing defect specified but unfixed. |
