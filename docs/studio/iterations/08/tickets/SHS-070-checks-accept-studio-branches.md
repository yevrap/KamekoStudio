# SHS-070 — The studio's checks accept a ticket branch and a squash-merged pull request

- **Status:** Done
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

- [x] At preflight and push, a clean branch named `studio/SHS-NNN-slug` (a valid ticket
      number, a lowercase slug) passes the branch check as well as `main`, and its detail
      says which; the check's id and description say it is about the branch, not only
      `main`.
- [x] On a `studio/*` branch, being behind `origin/main` still fails (rebase first), and
      being ahead passes.
- [x] The branch check fails on any other branch name: `feature/x`, `studio/x` with no
      ticket, `studio/SHS-12-x`, `shs-070-x`.
- [x] A squash-merged subject `type(studio): SHS-NNN description (#N)` passes `commit-lint`
      when the subject without its ` (#N)` fits in 80 characters; the same subject with no
      ticket, or with a description over 80 without the suffix, still fails.
- [x] A squash-merged studio commit is judged by `path-guard` like any other studio commit:
      inside the paths it passes, a production path in it fails.
- [x] Each of the refusals above is shown red first: on a scratch repository for the branch
      check (`tests/studio/lib/scratch-repo.mjs`), as unit cases for the lint.
- [x] `stages.test.mjs`, `guardrails.md` and `process.md` name the renamed check; nothing
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

- **What changed:** (`4b8dd72`) `on-main` is now `on-branch` (`tests/studio/checks/preflight.mjs`),
  at preflight and push as before. It passes on `main` or on a branch matching
  `studio/SHS-NNN-slug` (`STUDIO_BRANCH_RE` and `branchProblem` in `rules.mjs`: three digits,
  an SHS number past 042, a lowercase slug of hyphen-joined words), and names which in its
  detail (*on main, in sync* / *on ticket branch studio/SHS-…, 1 commit(s) ahead of
  origin/main*). Behind `origin/main` fails on either, with *rebase first*. Every other
  name fails, a detached head too. `lintCommitSubject` measures the subject without a
  trailing ` (#N)` (`SQUASH_SUFFIX_RE`); the rest of the lint is unchanged. The path
  guard needed no change: `commitKind` sorts by the `(studio)` scope, so a squash-merged
  subject is a studio commit already. `stages.test.mjs`, `checks/index.mjs`,
  `self-checks.md`, `guardrails.md` (the production safety net) and `process.md` (trunk,
  commits, tags) name `on-branch`. The push stage's list is otherwise unchanged.
- **Tested by:** `tests/studio/branch-check.test.mjs` (new, 18 cases, each on a scratch
  repository with a second scratch repository as its `origin`): main in sync passes, main
  behind fails, a ticket branch ahead passes and is named, a ticket branch behind fails with
  *rebase*, twelve other names fail (`feature/x`, `studio/x`, `studio/SHS-12-x`,
  `shs-070-x`, `studio/SHS-070`, a trailing hyphen, an upper-case slug, four digits,
  `SHS-042`, `SS-041`, a nested path, `main-2`), and a detached head fails. Red first, three
  ways: under the new id all 18 failed (no such check). Run against the old `on-main` code,
  the two ticket-branch cases failed and the refusals passed, since the old check refused
  every branch but `main`. Against a looser rule, `main` or anything under `studio/`,
  all ten `studio/…` refusals failed. Three cases in `rules.test.mjs`: a squash subject at
  80 + ` (#12)` passes (red before: 86 characters); no ticket, no scope, 81 + suffix, and a
  suffix without its space, with trailing text or not a number all still fail (red before
  on the 81 case, which reported 87); a squash-merged studio commit with a production path
  is a path-guard violation, and one inside the paths is not (green before and after, the
  guard already right). `--stage=ticket` 5/5; `--stage=push` green on `main` (below).
- **Deferred:** nothing. The skill's `build` and `review` steps and ADR-0007's successor
  stay with #49, the first real pull request with #50. ADR-0011 (executive-only) still says
  `on-main` in its §4 note; it is left as written.
- **Fix rounds used:** 0 / 2 (one fixture fix before the first commit: the working
  repository's first commit wrote the same file its origin already had, so there was
  nothing to commit)
