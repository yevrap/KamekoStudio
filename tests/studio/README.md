# Studio tests and self-checks

```
check.mjs              the self-check runner — `npm run studio:check`
checks/                one module per area; each exports one or more check objects
lib/rules.mjs          the pure logic the checks decide with
lib/boot-contract.mjs  what a booted studio page must be true of, as pure predicates
lib/shell.mjs          git, filesystem and network plumbing
lib/browser.mjs        a static server and headless Chrome, for `studio-boot`
lib/scratch-repo.mjs   a throwaway git repository, for tests that need real history
rules.test.mjs         unit tests for lib/rules.mjs
boot-contract.test.mjs unit tests for lib/boot-contract.mjs — no browser needed
docs-evidence.test.mjs unit tests for the Result-evidence rule in checks/docs.mjs
home-page.test.mjs     the realm home's shelf component, every rendered state
pulse-current.test.mjs the pulse and retro lines against the repository's own record
path-guard.test.mjs    the path guard against the repository, not through the pure rule
production-fix.test.mjs the production-fix rule, pure and against a scratch repository
baseline.test.mjs      which tag is "the previous release", against a scratch repository
deploy.test.mjs        studio-live's search and polling, against a fake web server
stages.test.mjs        which checks each stage runs, and how arguments are read
overtighten-gameplay.test.mjs  the torque rules and the progress rules
overtighten-plates.test.mjs    every shipped plate: reachable, and what clears it
overtighten-ui.test.mjs        the game's markup, including the coupling lines
```

`lib/browser.mjs` stands up its own static server rather than calling into
`scripts/smoke.mjs`: that file is a top-level script with no exports, so the studio cannot
import it, and changing it would be a production fix (ADR-0008) made for test plumbing.
The duplication is registered as TD-007.

`node --test tests/` collects `*.test.mjs` from here, so the studio's unit tests run as
part of the repository suite. `check.mjs` is not named like a test file and is therefore
not executed by the test runner — it is invoked by `npm run studio:check`.

## Running the checks

```
npm run studio:check                        # every stage
npm run studio:check -- --stage=gate        # one stage
npm run studio:check -- --stage=push        # before every push to main
npm run studio:check -- --list              # what exists, without running it
npm run studio:check -- --skip-slow         # no test suites (fails gate and push, by design)
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
