# Iteration 04 — stand-up log

Three lines per entry: done / next / blocked, per role that acted. Written between tickets,
not reconstructed afterwards. Under trunk-based work each entry is pushed when it is
committed.

## Before planning — preflight

- **Scrum Master** — *Done:* preflight ran red once and green once, on a clean `main` level
  with the remote and no `STOP` file. The first run's `baseline-suites` failed on one test,
  `running out of fuel mid-flight while aiming does not permanently freeze the comet
  (FUEL-3)`, with uncaught `Cannot read properties of null (reading 'x')` — TD-009's exact
  signature, in a Black Hole in One test that enters Explore. Under iteration 03's rule it
  was run once more: all four checks passed, the baseline suites in 93 s. Both results are
  recorded here and nothing was exempted. *Next:* the plan. *Blocked:* nothing.

## After SHS-053's first commit — the plan

- **Product Owner** — *Done:* three committed tickets, all from the carried queue: the
  post-deploy gaps and the `push` stage (SHS-050), the production-fix permission
  (SHS-051), and TD-009's fix (SHS-052). The root README and the design of the studio's
  window on the 3D landing page are carried to the next iteration rather than squeezed in
  over the cap. *Next:* SHS-050. *Blocked:* nothing.
- **Scrum Master** — *Done:* three committed against the cap of 2–3, plus the record
  ticket. First trunk-based iteration: small commits to `main`, each finished ticket and
  each ceremony record pushed as it lands. Review capped at two rounds. *Next:* keep the
  pushes small and checked. *Blocked:* nothing.
- **Tech Lead** — *Done:* ordered SHS-050 first, against ADR-0007's suggestion of TD-009
  first: every push this iteration runs the post-deploy stage, and TD-010 would make each
  of those report a correct deploy as a failure. The plan says so. *Next:* SHS-050's
  polling and baseline default. *Blocked:* nothing.
- **QA Engineer** — *Done:* the plan's push was the first trunk-based deploy. Post-deploy
  run 8 s after the push, with the old check: `studio-live` failed a correct deploy —
  *"marker … not found … after 1 attempt(s)"* — TD-010 once more. The new build was
  served 27 s after the push, and the same command then passed 3 of 3. *Next:* SHS-050.
  *Blocked:* nothing.

## After SHS-050 — checks every push can trust

- **QA Engineer** — *Done:* `studio-live` searches afresh on every attempt; the baseline is
  the newest tag that is not `HEAD`, and a comparison of no commits is `not run`. Each new
  test was run against a mutation restoring the defect it covers, and each failed. On the
  way, `--marker` values were found cut at their second `=`, and fixed. This ticket's push:
  `--stage=push` 10 of 10 on its first run; `--stage=postdeploy` started the moment the
  push returned, with `--marker-at` on the check file itself, found the new build on
  attempt 3 of 12 with no waiting by hand — 3 of 3 passed. *Next:* SHS-051. *Blocked:*
  nothing.
- **Scrum Master** — *Done:* noticed that `no-stop-file` watches only the repository, while
  a run is started from a directory outside it, where the executive's `STOP` file would go.
  The checker cannot name that directory in a public repository. Checked by hand before
  each push for now; the retrospective decides whether it needs more. *Next:* SHS-051.

## After SHS-051 — production fixes, admitted per ticket

- **Tech Lead** — *Done:* ADR-0008 writes down the executive's standing permission, and
  the path guard enforces it. A production file is admitted only for an entry naming this
  iteration, a ticket file in this iteration, and commits that all name that ticket.
  Decided from git and file names only; no Markdown is read. Six mutations, each putting
  back one hole, each failed the tests. The search for passages that said production was
  untouchable found seven documents to change and four decision records to leave as
  history. *Next:* SHS-052, the first use. *Blocked:* nothing.
- **QA Engineer** — *Done:* `push` 10 of 10; post-deploy, started the moment the push
  returned, found the new ADR on attempt 3 of 12 — 3 of 3. One correction before the push:
  the ticket named test files that do not exist and called ADR-0001 unchanged while its
  status line had changed; both fixed in the unpushed commit. *Next:* SHS-052's red run.

## After SHS-052 — the first production fix

- **Front-end / Gameplay Dev** — *Done:* one line in `stepParticles`: with no black hole,
  spirals are dropped. Three e2e tests, each in its own browser profile and each proving
  spirals were alive before acting, were run first against the unfixed file: exactly
  those three failed, each with TD-009's error. With the fix, 26 of 26, then five runs in a
  row, 26 of 26 each. Two partial fixes tried and reverted; the direct test failed both,
  while both route tests passed both — the direct test is the one that decides. *Next:*
  review. *Blocked:* nothing.
- **QA Engineer** — *Done:* the diagnostic's last run exited 0, every route clean, and it
  was retired. `push` 10 of 10, the guard naming both production files as SHS-052's.
  Post-deploy started when the push returned and found the fixed line in the served
  `ui.js` on attempt 3 of 12. *Next:* hand the diff to review. *Blocked:* nothing.
- **Tech Lead** — *Done:* that post-deploy run said *"nothing outside the guard changed"*
  above a list of two admitted production files. Fixed as SHS-051's first fix round: an
  admitted change is now reported as a change. *Next:* review. *Blocked:* nothing.
- **Scrum Master** — *Done:* every planned ticket is live. Five pushes before this one,
  each checked before and after; none broke the live site. *Next:* round 1 of review — QA and
  the Independent Reviewer, on different models. *Blocked:* nothing.

## After review round 1 — both passes rejected

- **Scrum Master** — *Done:* both passes ran on fresh context: the Independent Reviewer on
  a different model from the author, and QA on the author's. The reviewer **rejected** and
  QA **failed** the iteration. Neither found a problem with TD-009's fix. QA confirmed it on
  all four player routes, with real taps and a fresh profile per trial: 20 of 20 trials
  threw on the unfixed build and 0 of 20 on the fixed one, and golf is unchanged. Both
  found holes in the production-fix guard, and QA found checks that still pass having
  compared nothing. Every finding has a disposition, below. *Next:* the fix rounds, then
  round 2, the last. *Blocked:* nothing.
- **Tech Lead** — *Done:* the reviewer's blocker is right about what matters. The guard
  decides from an entry, a ticket file and commit subjects, and the studio writes all
  three, so it catches an unplanned production write but cannot tell a real fix from a
  fabricated one. Worse, under trunk-based work a production fix is live before any review
  has seen it, and SHS-052 was. The answer is not more cleverness in the guard. It is an
  independent review between a production fix and the live site. **SHS-054, opened by the
  review:** a production fix is reviewed before it is pushed, and the `push` stage refuses
  one whose review does not cover its latest commit. *Next:* the fixes. *Blocked:*
  nothing.
- **Product Owner** — *Done:* where each finding goes:
  - *SHS-050, fix round 1:*
    - `path-guard` and `commit-lint` pass on a comparison of no commits (QA B2);
    - `studio-live` passes with no marker, or with one the last release already had (QA M1);
    - `postdeploy` exits 0 having verified nothing (QA m7);
    - an untracked directory changes the iteration (QA m6);
    - the stages table lost a row (QA m3).
  - *SHS-051, fix round 2, its last:*
    - a merge commit carries a change past the guard (reviewer minor, QA B1);
    - a commit after the iteration's tag is still admitted (QA B3);
    - deleting a fix file is admitted (QA M2);
    - what the guard proves, stated plainly (reviewer blocker);
    - a rollback the documents describe that `commit-lint` refuses (QA m2);
    - two passages the search missed (QA m4);
    - two nits (QA n1, n2).
  - *SHS-052, fix round 1:*
    - the direct test accepts an over-broad fix that also drops the Explore bursts (QA m1);
    - the fix line allocates on every Explore frame (QA n3).
  - *SHS-053:* the push count above was wrong — it said eight; there had been five (QA m5).
    Corrected in place.
  - *SHS-054:* the reviewer's blocker.
  - *Declined, with reasons in the review:*
    - a fix entry taking precedence over the narrow exception on the same file;
    - a test-name rule for production's harness, registered as debt instead (QA M2b).

  *Next:* SHS-050. *Blocked:* nothing.

## After the round-1 fixes

- **QA Engineer** — *Done:* SHS-050's fix round is pushed. No check passes on a comparison
  of no commits, on a stale marker, or on a stage that verified nothing. SHS-051's second
  and last fix round and SHS-054 went out in one push: merges, post-release changes and
  deletions are refused, and a production fix is now reviewed before it is pushed. Each
  new rule was run against a mutation that put the hole back. One mutation survived — the
  history check, which the only test for it could not reach — until the test used a real
  commit on another branch. `push` 11 of 11, `production-fix-reviewed` admitting SHS-052
  as reviewed at `7b8a0fe`. *Next:* SHS-052's fix round. *Blocked:* nothing.
- **QA Engineer** — *Done:* the first post-deploy run after that push **failed**, and it was
  right to. The marker was a phrase that exists in the source only across a line break,
  so no deployed file contained it; the check polled all twelve attempts and said so.
  Run again with a string the file does contain: found on attempt 1, and absent from
  iteration 03's copy. Recorded because a check that fails on the operator's mistake is
  the check working. *Next:* SHS-052. *Blocked:* nothing.
- **Front-end / Gameplay Dev** — *Done:* SHS-052's fix round is written and **not pushed**:
  it changes the ticket's production files, so under SHS-054 it waits for round 2. The
  direct test now also bursts particles in a colour nothing else draws and requires them
  to survive; QA's over-broad decoy, `if (!bh) particles = [];`, fails it. The fix line
  skips the filter when there are no spirals to drop. *Next:* round 2. *Blocked:* on
  review, by design.
