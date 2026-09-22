# SHS-050 — Every push is checked by one stage before it and one after, and the after-stage cannot pass on a stale build or a vacuous baseline

- **Status:** Done
- **Size:** M
- **Iteration:** 04
- **Role lead:** QA Engineer
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

Under trunk-based work every finished ticket is pushed and deploy-checked, and two gaps
registered at the end of iteration 03 make that check wrong on a correct deploy (TD-010:
`studio-live` looks for the new build once and never waits for it) or right for no reason
(TD-011: after tagging, `production-unchanged` compares the release with itself).
ADR-0007 also committed this iteration to a `push` stage, so that "safe to push" is one
command rather than three.

## Acceptance criteria

- [x] `studio-live` fetches the page, and the files it loads, again on every attempt until
      the marker is found or the attempts run out. A build that arrives after the first
      attempt passes with no re-run by hand, and the report says which attempt found it.
      (TD-010)
- [x] `studio-live` takes `--marker-at=<site path>`, defaulting to `/studio/`, so a push
      that changes only a file outside the realm can still prove its build is being served.
- [x] Without `--previous-tag`, `production-unchanged` compares with the newest
      `studio-iteration-*` tag that does not point at `HEAD`. Run straight after tagging,
      it compares with the previous iteration. The same default applies to `--base`.
      (TD-011)
- [x] A comparison that covers no commits at all — the baseline *is* `HEAD` — reports
      `not run` with the reason, never `pass`, in every check that compares with a base.
- [x] A `push` stage runs the gate's checks except `docs-current` and `reviewer-verdict`,
      the two that only make sense once the iteration is reviewed, plus `on-main` and
      `no-stop-file`, since the push goes straight to the branch that deploys and must
      respect a halt; like the gate, it treats `not run` as a failure.
- [x] `self-checks.md` documents the stage, `--marker-at` and the new defaults;
      `process.md` names the stage where it says what runs before a push; TD-010 and
      TD-011 are closed in `tech-debt.md` with this ticket's ID.

## Evidence plan

- Unit tests with an injected fetch and wait: the marker found on a later attempt, never
  found (fails, naming the attempt count), and a page that stops returning 200.
- Unit tests over a throwaway git repository for the default baseline: the newest tag on
  `HEAD`, the newest tag behind `HEAD`, two tags on `HEAD`, no tags at all.
- A test that the `push` stage's membership is the gate's minus exactly those two checks.
- This ticket's own push: `--stage=push` before it, then `--stage=postdeploy` straight
  after it, without waiting by hand.

## Out of scope

- Comparing every deployed file with the committed one. The marker is enough to show the
  new build is being served; a byte-for-byte comparison is a larger change with its own
  failure modes (caching, encodings) and is not needed to close either row.
- Any change to what the gate itself runs.

---

## Result

- **What changed:**
  - `tests/studio/checks/deploy.mjs` — `studio-live` is `searchForMarker` (one search of a
    page and the same-origin files it loads, starting from a script when the page is one)
    inside `pollForMarker` (a fresh search on every attempt). Its report names the attempt
    that found the build. It takes `--marker-at`, joined to the site's address and refused
    if the result leaves the site.
  - `tests/studio/lib/shell.mjs` — `previousIterationTag` (the newest iteration tag not on
    `HEAD`) and `commitsSince`. `latestIterationTag` is gone; nothing else used it.
  - `tests/studio/checks/path-guard.mjs` — `production-unchanged` defaults to the previous
    release, fails on a baseline that names no commit, reports `not run` on one that covers
    no commits, and says how many commits it compared.
  - `tests/studio/check.mjs` — `--base` defaults to the previous release; `--marker-at`;
    `not run` fails the `push` stage as it fails the gate.
  - `tests/studio/checks/index.mjs` — the `push` stage and `CONCLUSIVE_STAGES`, and
    `push` added to the ten checks that belong in it.
  - **Found on the way:** arguments were split with `split('=')`, so a `--marker` holding a
    `=` was silently cut at it — the line that fixes TD-009 would have been searched for as
    `if (!bh) particles `. `splitArg` in `lib/rules.mjs` splits at the first `=` only.
  - Docs: `self-checks.md` (usage, stage table, both checks' rows, the defaults), `process.md`,
    `definition-of-done.md`, ADR-0007's decision points 2 and 3, `tests/studio/README.md`;
    TD-010 and TD-011 closed in `tech-debt.md`.
- **Tested by:**
  - `tests/studio/deploy.test.mjs` (6 tests), `tests/studio/baseline.test.mjs` (7, over a
    throwaway git repository tagged the way an iteration is), `tests/studio/stages.test.mjs`
    (4). 17 of 17 pass.
  - Each was run against a mutation putting back the defect it exists for, in this
    working tree, and each mutation failed it: the newest tag even when it is `HEAD` (3 of
    7 baseline tests fail), no zero-commit guard (1 of 7), a search on the first attempt
    only (3 of 6 deploy tests), splitting at every `=` (1 of 4 stage tests). Files
    restored after each.
  - TD-010 itself, seen live on this iteration's first push, with the old check: run 8 s
    after pushing, *"marker … not found … after 1 attempt(s)"*; the new build was being
    served 27 s after the push, and the same command then passed.
  - This ticket's own push: `--stage=push`, then `--stage=postdeploy` straight after, with
    `--marker-at` pointed at the check file this ticket changed — results in `log.md`.
- **Fix round 1 — from review round 1.** QA found the ticket's title claim true of one
  comparison in three, and a stage that verified nothing exiting 0:
  - **A comparison of no commits passed `path-guard` and `commit-lint`** (QA B2) — with
    `--base=HEAD`, or with the `origin/main` fallback just after a push. Both now report
    `not run`: `commit-lint` on an empty range, `path-guard` when nothing is committed or
    uncommitted since the base. The report's first line says where the base came from.
  - **`studio-live` passed with no marker, or with one the last release already had**
    (QA M1). No marker is now `not run`; a marker the previous release's copy of the file
    held is refused (`staleMarkerProblem`, `repoPathFor`). The comparison is with the
    previous *release*, not the previous push, and `self-checks.md` says so.
  - **`postdeploy` exited 0 with all three checks not run** (QA m7). It is conclusive now,
    like `gate` and `push`.
  - **An empty or untracked iteration directory changed the iteration** (QA m6). The
    default is now the newest iteration with a tracked file (`newestTrackedIteration`).
  - **The stages table lost its `closeout` row** under the `push` paragraph (QA m3); and
    the paragraph saying only the gate is conclusive, missed by this ticket, now names all
    three.
  - Tests: `baseline.test.mjs` +3 (path-guard empty and dirty, commit-lint empty, tracked
    iteration), `deploy.test.mjs` +4 (URL to file, stale marker, no marker never fetches,
    stale marker refused against a scratch repository's release), `stages.test.mjs`
    (postdeploy conclusive).
- **Fix round 2 — from review round 2, the last this ticket may use (QA N4).** The
  stale-marker check compared a directory named without its trailing slash —
  `--marker-at=/games/black-hole-in-one` — with the tree listing `git show` returns for a
  directory. The listing never holds a marker, so every marker looked new. A path that is
  a tree at the release is now compared by its `index.html`. It is held by a test in
  `deploy.test.mjs`, and removing the tree handling fails it. No review has seen this
  round.
- **Deferred:** nothing.
- **Fix rounds used:** 2 / 2
