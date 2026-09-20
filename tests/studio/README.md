# Studio tests and self-checks

```
check.mjs          the self-check runner — `npm run studio:check`
checks/            one module per area; each exports one or more check objects
lib/rules.mjs      the pure logic the checks decide with
lib/shell.mjs      git, filesystem and network plumbing
rules.test.mjs     unit tests for lib/rules.mjs
```

`node --test tests/` collects `*.test.mjs` from here, so the studio's unit tests run as
part of the repository suite. `check.mjs` is not named like a test file and is therefore
not executed by the test runner — it is invoked by `npm run studio:check`.

## Running the checks

```
npm run studio:check                        # every stage
npm run studio:check -- --stage=gate        # one stage
npm run studio:check -- --list              # what exists, without running it
npm run studio:check -- --skip-slow         # no test suites (fails the gate, by design)
npm run studio:check -- --offline           # no network requests
npm run studio:check -- --base=<ref>        # what the path guard diffs against
```

Full reference, including what each check proves: [`../../docs/studio/self-checks.md`](../../docs/studio/self-checks.md).

## Adding a check

Export a `{ id, stages, description, run(ctx) }` object from a module in `checks/`, whose
`run` returns `{ status: 'pass' | 'fail' | 'skip', detail }`. Register it in
`checks/index.mjs` and add its row to `self-checks.md`. Put the decision logic in
`lib/rules.mjs` as a pure function and unit-test it there; keep the check itself to
gathering input and reporting.
