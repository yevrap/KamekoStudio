# SHS-NNN — <one-line outcome>

- **Status:** Ready | In progress | Blocked | Done | Won't do
- **Size:** S | M | L
- **Iteration:** NN
- **Role lead:** <role from team/>
- **Depends on:** <ticket IDs, or none>
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

Two sentences at most. What is wrong or missing, and where the request came from
(a direction, a review finding, a bug, the debt register). Neutral technical language.
Another ticket's number is a link to its file, `[SHS-NNN](../../NN/tickets/SHS-NNN-slug.md)`
(process.md, *Trunk, commits, tags*).

## Acceptance criteria

- [ ] Each one checkable by reading the diff or running something.
- [ ] Written as a statement about the finished system, not as a task.

*A ticket that adds or changes a check* also lists here the inputs the rule must refuse,
each as a criterion ("a commit that … is reported as a violation"). The build starts from
them as tests shown red first (iteration 05 retro).

*The sprint's record ticket* lists only what `close` checks: `plan.md`, `log.md`,
`review.md`, the pulse line, the input ledger and `CHANGELOG.md`. The gate needs the ticket
Done before the retro exists, so retro-step work (`retro.md`, the retro line, the learning
log, `tech-debt.md`, the steering views) goes under a *Done at the retro* line, never as a
criterion (iteration 05 retro).

## Evidence plan

Which test, which page, which command proves each criterion.

## Out of scope

What this ticket deliberately does not do, so the reviewer does not look for it.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
