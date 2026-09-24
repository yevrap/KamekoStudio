# SHS-070 — The studio's checks accept a ticket branch and a squash-merged pull request

- **Status:** Ready
- **Size:** S
- **Iteration:** 08
- **Role lead:** Tech Lead
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

[ADR-0011](../../../decisions/ADR-0011-the-studio-runs-itself.md) §4–5 moves the studio to
a branch and a pull request per ticket (backlog #40, size L, split at plan 08). Today
`on-main` fails on any branch but `main`, and a GitHub squash-merge adds ` (#N)` to the
subject, which can push a valid subject past `commit-lint`'s 80 characters. This first
part makes the checks ready for the new flow; the skill change and the first ticket
through a pull request are the later parts (#49, #50).

## Acceptance criteria

- [ ] At preflight and push, a clean branch named `studio/SHS-NNN-slug` (a valid ticket
      number, a lowercase slug) passes the branch check as well as `main`, and its detail
      says which; the check's id and description say it is about the branch, not only
      `main`.
- [ ] On a `studio/*` branch, being behind `origin/main` still fails (rebase first), and
      being ahead passes.
- [ ] The branch check fails on any other branch name: `feature/x`, `studio/x` with no
      ticket, `studio/SHS-12-x`, `shs-070-x`.
- [ ] A squash-merged subject `type(studio): SHS-NNN description (#N)` passes `commit-lint`
      when the subject without its ` (#N)` fits in 80 characters; the same subject with no
      ticket, or with a description over 80 without the suffix, still fails.
- [ ] A squash-merged studio commit is judged by `path-guard` like any other studio commit:
      inside the paths it passes, a production path in it fails.
- [ ] Each of the refusals above is shown red first: on a scratch repository for the branch
      check (`tests/studio/lib/scratch-repo.mjs`), as unit cases for the lint.
- [ ] `stages.test.mjs`, `guardrails.md` and `process.md` name the renamed check; nothing
      else about the push stage changes.

## Evidence plan

New cases in `tests/studio/rules.test.mjs` and a scratch-repository test for the branch
check, each red against today's code before the change; `--stage=push` green on `main`
after it.

## Out of scope

Changing the `studio-iteration` skill's `build` and `review` steps, superseding ADR-0007
(#49), running a real ticket through a pull request with CI (#50), and the steering-edit
commit form (#21). The studio keeps working on `main` this sprint.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
