# Self-checks

`npm run studio:check` is the studio's conscience. It is a plain Node script with no
dependencies beyond what the repo already has, it runs identically for anyone who clones
the repo, and every check prints `pass`, `fail` or `not run` — never nothing.

```
npm run studio:check                     # every stage
npm run studio:check -- --stage=gate     # one stage
npm run studio:check -- --list           # what exists, without running it
npm run studio:check -- --json           # machine-readable results
npm run studio:check -- --base=<ref>     # what the path guard and commit lint diff against
npm run studio:check -- --docs-root=<dir># an extra directory for doc-cleanliness
npm run studio:check -- --skip-slow      # skip the test suites (the gate then fails, by design)
npm run studio:check -- --offline        # make no network requests
```

`--base` defaults to the most recent `studio-iteration-*` tag, falling back to
`origin/main`. Iteration 00 has no previous tag, so it passes the pre-studio commit
explicitly.

`--docs-root` exists so that documents kept outside the repository can be held to the same
cleanliness rule without the repository having to name where they live.

Exit code is 0 when no check failed, 1 otherwise. A check that could not run (a missing
prerequisite, a network-dependent step) reports `not run` with a reason and does **not**
turn the run green by omission — the report shows it, and the gate refuses to pass a
`not run` in the `gate` stage.

## Stages

| Stage | When | Checks |
|---|---|---|
| `preflight` | Before planning | `tree-clean`, `on-main`, `no-stop-file`, `baseline-suites` |
| `ticket` | After each ticket | `path-guard`, `storage-keys`, `studio-tests` |
| `gate` | Before pushing | `path-guard`, `storage-keys`, `hygiene`, `full-suites`, `commit-lint`, `docs-current`, `reviewer-verdict` |
| `postdeploy` | After Pages updates | `studio-live`, `production-live`, `production-unchanged` |
| `closeout` | End of the iteration | `iteration-docs`, `doc-cleanliness`, `changelog` |

## What each check proves

| Check | Proves |
|---|---|
| `tree-clean` | No uncommitted work is about to be swept into the iteration |
| `on-main` | The iteration starts from the branch that deploys |
| `no-stop-file` | The executive has not asked for a halt |
| `baseline-suites` | The repo was already green before the studio touched it, so any later red is the studio's |
| `path-guard` | Every changed path is inside the allowed list, or is a recorded exception (reported as used) |
| `storage-keys` | Every `localStorage` key used under `studio/` starts with `studio_`, and no production key is read or written |
| `studio-tests` | The studio's own unit tests pass |
| `hygiene` | No secrets, personal identifiers, private paths, note-vault syntax or oversized files in studio-owned paths |
| `full-suites` | `npm test`, `npm run smoke` and `npm run e2e` are green — production included |
| `commit-lint` | Every studio commit is conventional, scoped `studio`, and names a ticket |
| `docs-current` | Every ticket in the iteration has a file, a status and evidence |
| `reviewer-verdict` | The Independent Reviewer's verdict is recorded in the iteration's review |
| `studio-live` | The deployed studio URL returns 200 and serves the new build |
| `production-live` | A production game page still returns 200 after the deploy |
| `production-unchanged` | No file outside the allowed paths differs from the previous iteration's tag |
| `iteration-docs` | Plan, tickets, log, review and retro all exist for this iteration |
| `doc-cleanliness` | No stacked "superseded" / "revision" / "v2" passages; each document states one current version |
| `changelog` | The iteration has a changelog entry |

## Network-dependent checks

`baseline-suites`, `full-suites` (smoke and e2e need Chrome and a CDN) and the three
`postdeploy` checks touch the network or a browser. When they cannot run they report
`not run` with the reason. The `gate` stage treats that as a failure; the others report it
and continue, so the studio can still work offline.

## Adding a check

A check is an object `{ id, stages, description, run(ctx) }` exported from a module in
`tests/studio/checks/` — a module may export several related ones. `run` returns
`{ status, detail }`, where status is `'pass' | 'fail' | 'skip'`. Register it in
`tests/studio/checks/index.mjs` and add a row to the table above. Put the decision logic in
`tests/studio/lib/rules.mjs` as a pure function and unit-test it there. A check that does
not prove something specific does not get added.
