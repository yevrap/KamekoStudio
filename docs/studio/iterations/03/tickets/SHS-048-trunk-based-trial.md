# SHS-048 — Trunk-based development is written down as a trial for iteration 04

- **Status:** Done
- **Size:** S
- **Iteration:** 03
- **Role lead:** Scrum Master
- **Depends on:** none
- **Branch:** `shs-048-trunk-based-trial`

## Motivation

Opened after the second review round, on the executive's direction: try trunk-based
development instead of a branch per ticket, and let a retrospective judge each way. This
iteration was built branch-per-ticket from start to finish, so the comparison is only fair
if the next one is built the other way — which means the handbook has to say so before the
next run reads it.

## Acceptance criteria

- [x] A decision record states what trunk-based development means for this repository —
      where Pages deploys every push and there is no CI — what the trial is testing, and
      the questions the next retrospective answers from what happened.
- [x] `process.md` describes the practice the next iteration follows, and no longer
      describes the branch-per-ticket model as current.
- [x] Nothing in the checks has to change for the trial to run; the decision record says
      why, and names the one addition the next iteration makes.

## Evidence plan

Reading the documents; `git grep` for the branch-per-ticket model outside records and
decision history.

## Out of scope

- Changing any check. The `push` stage is the next iteration's first piece of work.
- This iteration's own history, which stays branch-per-ticket so the two can be compared.

---

## Result

- **What changed:** new `decisions/ADR-0007-trunk-based-development.md`, indexed.
  `process.md` — the protocol's build, gate and publish steps and the section on commits
  now describe trunk-based work: commit to `main`, each commit green, push and deploy-check
  each ticket when it is done, keep unready pages off the shelf, fix review findings
  forward, revert rather than rewrite, tag the reviewed state.
- **Tested by:** `grep` over `docs/studio/` for `--no-ff`, "one branch per ticket" and
  "merge bubble", outside `iterations/`: the only matches are in ADR-0007 itself, which
  describes the model it replaces. ADR-0006's mention of branch names is a decision record
  describing its own time. `npm test` and the ticket stage green. This
  ticket was written after the review cap and has not been reviewed.
- **Deferred:** the checker's `push` stage, to iteration 04.
- **Fix rounds used:** 0 / 2
