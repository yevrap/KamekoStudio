# SHS-NNN — <one-line outcome>

- **Status:** Ready | In progress | Blocked | Done | Won't do
- **Size:** S | M | L
- **Iteration:** NN
- **Role lead:** <role from team/>
- **Depends on:** <ticket IDs, or none>
- **Branch:** `studio/SHS-NNN-slug` → pull request #N, squash-merged at the end of the build (ADR-0011 §5; a production fix: `main`, until backlog #56)

## Motivation

Two sentences at most. What is wrong or missing, and where the request came from
(a direction, a review finding, a bug, the debt register). Neutral technical language.
Another ticket's number is a link to its file, `[SHS-NNN](../../NN/tickets/SHS-NNN-slug.md)`
(process.md, *Branches, commits, tags*).

## Acceptance criteria

- [ ] Each one checkable by reading the diff or running something.
- [ ] Written as a statement about the finished system, not as a task.

*A ticket that adds or changes a check* also lists here the inputs the rule must refuse,
each as a criterion ("a commit that … is reported as a violation"). The build starts from
them as tests shown red first (iteration 05 retro).

*A ticket that builds or changes a game's core decision* also states its design
hypothesis with the numbers behind it: for each case the player meets (each cup, each
enemy, each width), the window or quantity the decision turns on, worked out before the
build. A hook that the numbers don't support is caught here, not at review (iteration 08
retro: Samovar's "the cup's size is the cue" didn't hold, and only review's arithmetic
showed it).

*The sprint's record ticket* lists only what `close` checks: `plan.md`, `log.md`,
`review.md`, the pulse line, the input ledger and `CHANGELOG.md`. The gate needs the ticket
Done before the retro exists, so retro-step work (`retro.md`, the retro line, the learning
log, `tech-debt.md`, the steering views) goes under a *Done at the retro* line, never as a
criterion (iteration 05 retro).

## Evidence plan

Which test, which page, which command proves each criterion.

*A regression test* is shown red against the unfixed code in every run of several, and
the Result gives the count ("red 5 of 5"). Red most of the time means it waits for the
bug instead of causing it (iteration 06 retro).

*Layout evidence* is taken at the narrowest width the game supports (320) as well as a
typical phone (390) (iteration 06 retro).

## Out of scope

What this ticket deliberately does not do, so the reviewer does not look for it.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
