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
- **Scrum Master** — *Done:* every planned ticket is live. Eight pushes so far, each
  checked before and after; none broke the live site. *Next:* round 1 of review — QA and
  the Independent Reviewer, on different models. *Blocked:* nothing.
