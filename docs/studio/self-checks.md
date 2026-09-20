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
| `ticket` | After each ticket | `path-guard`, `storage-keys`, `portal-capacity`, `studio-tests` |
| `gate` | Before pushing | `tree-clean`, `path-guard`, `storage-keys`, `portal-capacity`, `hygiene`, `full-suites`, `commit-lint`, `docs-current`, `reviewer-verdict` |
| `postdeploy` | After Pages updates | `studio-live`, `production-live`, `production-unchanged` |
| `closeout` | End of the iteration | `iteration-docs`, `doc-cleanliness`, `changelog` |

## What each check proves

| Check | Proves |
|---|---|
| `tree-clean` | No uncommitted work is about to be swept into the iteration — and, at the gate, that the document checks are describing what will actually be pushed rather than untracked files |
| `on-main` | The iteration starts from the branch that deploys |
| `no-stop-file` | The executive has not asked for a halt |
| `baseline-suites` | The repo was already green before the studio touched it, so any later red is the studio's |
| `path-guard` | Every changed path is inside the allowed list, or is a recorded exception (reported as used). Both sides of a rename count, so a file cannot be moved out of production unnoticed, and an exception is checked by comparing the file's content at the base revision with its content now — not by reading diff text, which is empty once a change is committed |
| `storage-keys` | Studio code reaches the shared origin only through keys it can be shown to use, all `studio_`-prefixed. It checks the three named accessors, bracket access, `delete`, and `clear()`, and refuses a key it cannot read statically — a computed expression or an aliased store. It scans `studio/**` only, so it says nothing about the production settings drawer that studio pages inherit (see [ADR-0003](decisions/ADR-0003-storage-namespace.md)) |
| `portal-capacity` | The 3D landing page has a portal position for every entry in `ARCADE_GAMES`, and every position table has a matching rotation table. It counts rather than trusts, because the page drops a game it has no position for with a bare `return` and says nothing — which is how two promoted games went portal-less unnoticed (TD-002). It reads production source the studio may not edit: the studio cannot fix that page at will, but it can refuse to be quiet about it |
| `studio-tests` | The studio's own unit tests pass |
| `hygiene` | No secrets, personal identifiers, private paths, note-vault syntax or oversized files in studio-owned paths, or in the paths the studio may touch by exception |
| `full-suites` | `npm test`, `npm run smoke` and `npm run e2e` are green — production included |
| `commit-lint` | Every studio commit is conventional, scoped `studio`, and names a ticket. Merge commits are exempt by having more than one parent, not by their subject line |
| `docs-current` | Every ticket in the iteration has a file, a status and evidence |
| `reviewer-verdict` | The Independent Reviewer's verdict is recorded in the iteration's review |
| `studio-live` | The deployed studio URL returns 200 and serves the new build |
| `production-live` | A production game page still returns 200 after the deploy |
| `production-unchanged` | No file outside the allowed paths differs from the previous iteration's tag |
| `iteration-docs` | Plan, tickets, log, review and retro all exist for this iteration |
| `doc-cleanliness` | No stacked "superseded" / "revision" / "v2" passages; each document states one current version |
| `changelog` | The iteration has a changelog entry |

## Network-dependent checks

`npm test` is pure Node and always runs. `npm run smoke` and `npm run e2e` drive a real
Chrome and load three.js from a CDN, and the three `postdeploy` checks make HTTP requests.

When a browser or the network is unavailable, those report `not run` **with the reason**,
naming which suites were skipped and which still ran. They are not reported as failures:
a missing Chrome and a real regression must not look the same. `--offline` skips the two
browser suites as well as the deploy checks, so it means what it says.

The `gate` stage converts any `not run` into a failure, because the gate exists to be
conclusive. The other stages report and continue, so the studio can still work offline.

## Adding a check

A check is an object `{ id, stages, description, run(ctx) }` exported from a module in
`tests/studio/checks/` — a module may export several related ones. `run` returns
`{ status, detail }`, where status is `'pass' | 'fail' | 'skip'`. Register it in
`tests/studio/checks/index.mjs` and add a row to the table above. Put the decision logic in
`tests/studio/lib/rules.mjs` as a pure function and unit-test it there. A check that does
not prove something specific does not get added.

Two habits, learned from the review of iteration 00, are worth keeping: test the rule
against the input that *defeats* it, not only the input it was written for; and make sure
the check is wired to real data, since a rule can be perfectly correct while the check
feeding it passes an empty string.
