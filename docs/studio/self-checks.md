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
npm run studio:check -- --previous-tag=<tag> # what production-unchanged compares with
```

`--base` defaults to the most recent `studio-iteration-*` tag, falling back to
`origin/main`. `production-unchanged` compares with `--previous-tag`, which also defaults to
the most recent tag — so **after the iteration's own tag exists, pass `--previous-tag`
explicitly**, or it compares the release with itself (TD-011). Iteration 00 has no previous tag, so it passes the pre-studio commit
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
| `ticket` | After each ticket | `path-guard`, `storage-keys`, `portal-capacity`, `studio-tests`, `studio-boot` |
| `gate` | Before pushing | `tree-clean`, `path-guard`, `storage-keys`, `portal-capacity`, `studio-boot`, `hygiene`, `full-suites`, `commit-lint`, `docs-current`, `reviewer-verdict` |
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
| `studio-boot` | Every page found by walking `studio/**` for an `index.html` opens in a real Chrome and holds the contract in `tests/studio/lib/boot-contract.mjs` — in three configurations: ordinary, scripting disabled, and site data blocked. It proves no uncaught error, no `console.error`, no failed request, a back link, 44px targets, that the page asks for the device's width and that nothing
inside it forces the layout viewport wider, that it does not scroll sideways inside its own
layout, that no control is laid out but invisible, and a `noscript` fallback that actually says something. On the realm home: that the page ran its own script, that the shelf's three column counts hold either side of both breakpoints, that a killed card both reads differently from a live one and matches its named treatment, and that the **real** shelf offers at least one card, and every live card links to a page this check itself booted and not to the shelf's own page. On a game page it also drives the thing — pointer, keyboard, release, coupling, stripping, every control pressed, progress proved by a reload — and checks the bolt actually repaints, that its gauge is stroked in visible colours at a
non-zero width, that the four bolt states are stroked in colours a person can tell apart — compared as colours against an absolute gap, not as strings — that a turn
survives one of two inputs letting go, that the status line changes while a bolt seats but
not on every frame, and that the back link resolves to a different page that is really there — compared after decoding, case-folding and normalising `index.html` away. Pages are **discovered, not listed**, so a page added later arrives covered; the report names any page that got only the generic contract. In the blocked-storage pass it serves an **empty script** in place of production's `shared/settings.js`, so what that pass proves is about studio code only (see the note below) |
| `hygiene` | No secrets, personal identifiers, private paths, note-vault syntax or oversized files in studio-owned paths, or in the paths the studio may touch by exception |
| `full-suites` | `npm test`, `npm run smoke` and `npm run e2e` are green — production included |
| `commit-lint` | Every studio commit is conventional, scoped `studio`, and names a ticket in the one ticket sequence: `SHS-NNN` from 043, `SS-NNN` only up to the 042 already issued (ADR-0006). Merge commits are exempt by having more than one parent, not by their subject line. A commit already on the remote that fails and cannot be amended without rewriting `main` is **waived by its full hash** in `LINT_WAIVERS`, with the ticket that explains it, and every waiver applied is printed — a hash is computed from the commit's content, so a waiver cannot be claimed by another commit copying its subject. There is one: SS-042's subject, at 81 characters |
| `docs-current` | **Every ticket a commit names has exactly one file.** The ticket each non-merge studio commit names — the ID in its subject's ticket position, not a mention later in the description — anywhere in the history, has one file under `iterations/*/tickets/`, named `<ID>-<slug>.md` with an ID that obeys the ticket sequence, whose first line is a heading naming the same ID; a missing file, a second file, a malformed name (an upper-case `.MD` included), an out-of-sequence ID or a heading naming another ticket fails. Before this, the check read only the files that existed, so a ticket with no file was invisible to it — and three shipped that way. This part is decided from commit subjects and file names, and reads no Markdown. **Then, content:** every ticket the iteration names or edits — its own directory, the file of any ticket a commit in its range names, and any ticket file its commits changed, wherever it lives — has a status declared **exactly once** and drawn from a **closed vocabulary**, and evidence under both `What changed` and `Tested by`. A ticket **declares each thing exactly once** — one `## Result`, one `Status`, one `What changed`, one `Tested by` — counted in the raw file, so a second declaration fails wherever it is and however it is hidden. Evidence is read from the declaration at the margin and stops at the next label; unticked criteria are counted in the raw text, in any bullet, indentation or blockquote. Ten rounds of review defeated the two previous designs — stripping hiding places out of the text, then scanning it as CommonMark — because both bet that this checker could decide what a Markdown renderer would show. Each of those is a hole a review found: `\s*(.*)` matched a newline so one label answered for the next; an unvalidated status let `Done ✅` skip every check below it; and a fenced or commented block placed after the real Result became the last one and supplied its evidence |
| `reviewer-verdict` | The Independent Reviewer's verdict is recorded in the iteration's review |
| `studio-live` | The deployed studio URL returns 200 and the new build is really on it. It searches the page **and the same-origin files the page loads**, following one level of module imports — because the realm's home page is a shell and everything it shows is built in the browser from `shelf-data.js`. Reading only the HTML proved the shell arrived and nothing about what was in it |
| `production-live` | A production game page still returns 200 after the deploy |
| `production-unchanged` | No file outside the allowed paths differs from the previous iteration's tag |
| `iteration-docs` | Plan, tickets, log, review and retro all exist for this iteration |
| `doc-cleanliness` | No stacked "superseded" / "revision" / "v2" passages; each document states one current version |
| `changelog` | The iteration has a changelog entry |

## The one thing `studio-boot` refuses to trust

Studio pages load `shared/settings.js`, production's settings drawer, which throws an
uncaught `SecurityError` when site data is blocked (TD-005) and is outside the path guard.

Three answers were tried and the first two were wrong in the same way.

1. An exemption matching any path ending in `shared/settings.js` — defeated by creating
   `studio/…/shared/settings.js`, which is inside the path guard.
2. The same exemption anchored to the page's origin *and* the exact path — defeated by
   `//# sourceURL`, because **a stack frame's URL is minted by the script that throws.**
3. A filter for the browser's own `/favicon.ico` 404 survived both rounds, and was defeated
   the same way: it also read `error.source`, so a studio file could throw
   `//# sourceURL=<origin>/favicon.ico` and have the error dropped in every pass.

The third review found (3) after (1) and (2) had been fixed. The pattern is the finding: a
filter over errors is a rule about *whose* error it is, and the only evidence available is
what the page says about itself.

So there is **no error filter in this check**. The two things that needed excusing are
*changed* instead, in `openPage`: the blocked-storage pass serves an empty script in place
of production's settings drawer, and every pass answers the browser's favicon request so
there is no 404 to explain. Both are decided by exact path, before the page runs, and
neither looks at an error — so no error can be dressed up as one that would be excused.
(The favicon rule was first written as a *suffix* match, which answered
`studio/anything/favicon.ico` too and would have hidden a real 404. That was the fourth
instance of the same mistake, in the code written to end it.) The
claim the blocked-storage pass supports is narrower and true: *studio code* survives blocked
storage, and it now also proves it was in that configuration rather than assuming it.
TD-005 remains recorded as production's defect.

The general rule, which applies to any check added here: **decide only from what the driver
did or observed, never from what the page said about itself.** A URL the driver served, a
measured box, a computed style and a screenshot are observations. A stack frame, a console
message's location and a script's declared name are claims. When a claim is the only thing
available, change the situation rather than trusting it.

## What `studio-boot` does not cover

Worth stating, because ten rounds of review each found mutations it survived and the
honest position is a bounded one rather than "nothing is left".

It covers what it collects. Everything asserted above is collected from a real page; a
property nobody collects is a property nobody checks. Adding a rule here means adding an
**observation** first — a rule over an observation the driver never took is the failure
mode this check has had in every round.

Known gaps, registered as TD-008 rather than only described here:

- **No audio is observed.** `sfx.js` is exercised by being imported and by the mute
  toggle's label and `aria-pressed` flipping. Inverting the toggle so the button reads
  "Sound off" while sound keeps playing is not caught.
- **No layout or visual regression.** The only pixels compared are one bolt's, before and
  during a turn. A page can be laid out badly and pass.
- **One plate is played.** The driver clears the first plate; the all-plates-cleared ending
  is never reached, so a mutation that hides it is not caught.
- **The realm home is not driven**, only rendered and measured. It has no controls beyond
  its links.

The mobile viewport *was* a gap and is no longer one: the driver emulates a phone
(`isMobile`, touch, 320px), which is what makes `<meta name="viewport">` load-bearing.
Before that, every mobile assertion here was measured in a desktop window, where that tag
does nothing.

## Network-dependent checks

`npm test` is pure Node and always runs. `npm run smoke`, `npm run e2e` and `studio-boot`
drive a real Chrome — the first two also load three.js from a CDN — and the three
`postdeploy` checks make HTTP requests. `studio-boot` serves the repository from loopback
and needs no network, but it still needs the browser.

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
`tests/studio/lib/rules.mjs` as a pure function and unit-test it there — or, for a check
with a contract of its own, in a sibling module beside it, as `studio-boot` does with
`lib/boot-contract.mjs`. Either way the decision is pure and tested without the machinery
that feeds it: an exemption is the part of a check most worth attacking, and one buried in
driver code cannot be attacked at all. A check that does
not prove something specific does not get added.

Two habits, learned from the review of iteration 00, are worth keeping: test the rule
against the input that *defeats* it, not only the input it was written for; and make sure
the check is wired to real data, since a rule can be perfectly correct while the check
feeding it passes an empty string.
