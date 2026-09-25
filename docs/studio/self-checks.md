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
npm run studio:check -- --skip-slow      # skip the test suites (gate and push then fail, by design)
npm run studio:check -- --offline        # make no network requests
npm run studio:check -- --previous-tag=<tag> # what production-unchanged compares with
npm run studio:check -- --marker=<text>  # a string only the new build has
npm run studio:check -- --marker-at=<path> # where on the site to look for it (default /studio/)
```

`--base` and `--previous-tag` both default to **the previous release**: the newest
`studio-iteration-*` tag that does not point at `HEAD`, falling back to `origin/main` for
`--base`. While an iteration is being built that is the last iteration's tag; once the
iteration's own tag is on `HEAD`, it is the one before. Defaulting to the newest tag
outright compared a freshly tagged release with itself, and `production-unchanged` passed
having compared nothing (TD-011). A comparison that still covers no commits — an explicit
baseline that is `HEAD` itself, or the `origin/main` fallback just after a push — reports
`not run`, never `pass`, in `path-guard` (when nothing is uncommitted either),
`commit-lint` and `production-unchanged` alike. The report's first line says where the
base came from, because the fallback compares only unpushed commits.

`--iteration` defaults to the newest iteration with a file git tracks, not the newest
directory on disk: an empty or untracked directory used to change which production fixes
the guard admits. Iteration 00 had no
previous tag, so it passed the pre-studio commit explicitly.

A value may contain `=`: an argument is split at its first one only, so a line of code
can be a marker.

`--docs-root` exists so that documents kept outside the repository can be held to the same
cleanliness rule without the repository having to name where they live.

Exit code is 0 when no check failed, 1 otherwise. A check that could not run (a missing
prerequisite, a network-dependent step) reports `not run` with a reason and does **not**
turn the run green by omission — the report shows it, and the `gate`, `push` and
`postdeploy` stages refuse to pass a `not run`.

## Stages

| Stage | When | Checks |
|---|---|---|
| `preflight` | Before planning | `tree-clean`, `on-branch`, `no-stop-file`, `baseline-suites` |
| `ticket` | After each ticket | `path-guard`, `storage-keys`, `portal-capacity`, `studio-tests`, `studio-boot` |
| `gate` | Before the iteration is tagged | `tree-clean`, `path-guard`, `storage-keys`, `portal-capacity`, `studio-boot`, `hygiene`, `full-suites`, `commit-lint`, `production-fix-reviewed`, `docs-current`, `reviewer-verdict` |
| `push` | Before every push, to `main` or a ticket branch | `tree-clean`, `on-branch`, `no-stop-file`, `path-guard`, `storage-keys`, `portal-capacity`, `studio-boot`, `hygiene`, `full-suites`, `commit-lint`, `production-fix-reviewed` |
| `postdeploy` | After Pages updates, after every push | `studio-live`, `production-live`, `production-unchanged` |
| `closeout` | End of the iteration | `iteration-docs`, `doc-cleanliness`, `changelog` |

`push` exists because under trunk-based work ([ADR-0007](decisions/ADR-0007-trunk-based-development.md))
every finished ticket is pushed, and every push deploys the whole arcade. It is the gate
without the two checks that only make sense once the iteration is reviewed —
`docs-current`, which requires every ticket to be closed with evidence, and
`reviewer-verdict` — plus `on-branch` and `no-stop-file`, because the push goes to the
branch that deploys, or to a ticket branch merged into it, and must respect a halt. A
test holds the list to that rule, so a check added to the gate later lands in `push` too
unless it is a review check.

`gate`, `push` and `postdeploy` are **conclusive**: a check they could not run fails them.
`postdeploy` used to exit 0 with all three of its checks not run.

## What each check proves

| Check | Proves |
|---|---|
| `tree-clean` | No uncommitted work is about to be swept into the iteration — and, at the gate, that the document checks are describing what will actually be pushed rather than untracked files |
| `on-branch` | The work starts from `main`, the branch that deploys, or from a ticket branch named `studio/SHS-NNN-slug` (a valid ticket number, a lowercase slug; ADR-0011 §4), and is not behind `origin/main` — a ticket branch is rebased first, as `main` is. Any other name, a detached head included, fails. It was `on-main` until [SHS-070](iterations/08/tickets/SHS-070-checks-accept-studio-branches.md) |
| `no-stop-file` | The executive has not asked for a halt |
| `baseline-suites` | The repo was already green before the studio touched it, so any later red is the studio's |
| `path-guard` | Every changed path is inside the allowed list, a recorded exception (reported as used), or a production fix its own ticket owns — an entry in `PRODUCTION_FIXES` for this iteration, a ticket file for it in this iteration, and every commit that changed the file naming that ticket (reported as a fix, with the ticket and line counts; ADR-0008). A merge counts as a commit when git's history lists it for the file — when its result differs from every parent — and names no ticket; a merge taking the file from one parent is not listed and is admitted with no commit examined (TD-013), which `production-fix-reviewed` refuses by content; a deleted fix file, or a change after the iteration's own tag, is refused. What this proves is that the write was planned and recorded, not that the plan was legitimate — see ADR-0008. Both sides of a rename count, so a file cannot be moved out of production unnoticed, and an exception is checked by comparing the file's content at the base revision with its content now — not by reading diff text, which is empty once a change is committed |
| `storage-keys` | Studio code reaches the shared origin only through keys it can be shown to use, all `studio_`-prefixed. It checks the three named accessors, bracket access, `delete`, and `clear()`, and refuses a key it cannot read statically — a computed expression or an aliased store. It scans `studio/**` only, so it says nothing about the production settings drawer that studio pages inherit (see [ADR-0003](decisions/ADR-0003-storage-namespace.md)) |
| `portal-capacity` | The 3D landing page has a portal position for every entry in `ARCADE_GAMES`, and every position table has a matching rotation table. It counts rather than trusts, because the page drops a game it has no position for with a bare `return` and says nothing — which is how two promoted games went portal-less unnoticed (TD-002). It reads production source the studio changes only as a reviewed fix (ADR-0008): the studio cannot fix that page at will, but it can refuse to be quiet about it |
| `studio-tests` | The studio's own unit tests pass |
| `studio-boot` | Every page found by walking `studio/**` for an `index.html` opens in a real Chrome and holds the contract in `tests/studio/lib/boot-contract.mjs` — in three configurations: ordinary, scripting disabled, and site data blocked. It proves no uncaught error, no `console.error`, no failed request, a back link, 44px targets, that the page asks for the device's width and that nothing
inside it forces the layout viewport wider, that it does not scroll sideways inside its own
layout, that no control is laid out but invisible, and a `noscript` fallback that actually says something. On the realm home: that the page ran its own script, that the shelf's three column counts hold either side of both breakpoints, that a killed card both reads differently from a live one and matches its named treatment, and that the **real** shelf offers at least one card, and every live card links to a page this check itself booted and not to the shelf's own page. On a game page it also drives the thing — pointer, keyboard, release, coupling, stripping, every control pressed, progress proved by a reload — and checks the bolt actually repaints, that its gauge is stroked in visible colours at a
non-zero width, that the four bolt states are stroked in colours a person can tell apart — compared as colours against an absolute gap, not as strings — that a turn
survives one of two inputs letting go, that the status line changes while a bolt seats but
not on every frame, and that the back link resolves to a different page that is really there — compared after decoding, case-folding and normalising `index.html` away. Pages are **discovered, not listed**, so a page added later arrives covered; the report names any page that got only the generic contract. In the blocked-storage pass it serves an **empty script** in place of production's `shared/settings.js`, so what that pass proves is about studio code only (see the note below) |
| `hygiene` | No secrets, personal identifiers, private paths, note-vault syntax or oversized files in studio-owned paths, in the paths the studio may touch by exception, or in the production files this iteration is fixing |
| `full-suites` | `npm test`, `npm run smoke` and `npm run e2e` are green — production included |
| `commit-lint` | Every studio commit is conventional, scoped `studio`, and names a ticket in the one ticket sequence: `SHS-NNN` from 043, `SS-NNN` only up to the 042 already issued (ADR-0006). Merge commits are exempt by having more than one parent, not by their subject line. A commit already on the remote that fails and cannot be amended without rewriting `main` is **waived by its full hash** in `LINT_WAIVERS`, with the ticket that explains it, and every waiver applied is printed — a hash is computed from the commit's content, so a waiver cannot be claimed by another commit copying its subject. There is one: SS-042's subject, at 81 characters. A trailing ` (#N)`, which GitHub's squash-merge adds, is not counted towards the 80 ([SHS-070](iterations/08/tickets/SHS-070-checks-accept-studio-branches.md)); everything else about the subject is judged as before, and the path guard judges a squash-merged studio commit like any other. An empty range reports `not run`: it proves nothing about the history |
| `production-fix-reviewed` | Every production fix that differs from the previous release was reviewed before it was pushed, and is pushed exactly as reviewed. For each such ticket, `iterations/NN/reviews/<TICKET>.md` declares exactly once the full hash of the commit its reviewers saw, and exactly once a verdict beginning `APPROVED`. That commit is in `HEAD`'s history, and **every file the ticket owns is, at `HEAD`, exactly what it holds** — decided from content, so a file put back to the release after the review, or taken from a merge's side parent, is refused as surely as a new change. Measured from the previous release rather than `--base`, so a narrow base cannot hide an unpushed fix. The record is written by the studio: this makes the review impossible to forget, not impossible to fake (ADR-0008) |
| `docs-current` | **Every ticket a commit names has exactly one file.** The ticket each non-merge studio commit names — the ID in its subject's ticket position, not a mention later in the description — anywhere in the history, has one file under `iterations/*/tickets/`, named `<ID>-<slug>.md` with an ID that obeys the ticket sequence, whose first line is a heading naming the same ID; a missing file, a second file, a malformed name (an upper-case `.MD` included), an out-of-sequence ID or a heading naming another ticket fails. Before this, the check read only the files that existed, so a ticket with no file was invisible to it — and three shipped that way. This part is decided from commit subjects and file names, and reads no Markdown. **Then, content:** every ticket the iteration names or edits — its own directory, the file of any ticket a commit in its range names, and any ticket file its commits changed, wherever it lives — has a status declared **exactly once** and drawn from a **closed vocabulary**, and evidence under both `What changed` and `Tested by`. A ticket **declares each thing exactly once** — one `## Result`, one `Status`, one `What changed`, one `Tested by` — counted in the raw file, so a second declaration fails wherever it is and however it is hidden. Evidence is read from the declaration at the margin and stops at the next label; unticked criteria are counted in the raw text, in any bullet, indentation or blockquote. Ten rounds of review defeated the two previous designs — stripping hiding places out of the text, then scanning it as CommonMark — because both bet that this checker could decide what a Markdown renderer would show. Each of those is a hole a review found: `\s*(.*)` matched a newline so one label answered for the next; an unvalidated status let `Done ✅` skip every check below it; and a fenced or commented block placed after the real Result became the last one and supplied its evidence |
| `reviewer-verdict` | The Independent Reviewer's verdict is recorded in the iteration's review |
| `studio-live` | The new build is really being served. It looks for `--marker` on the page at `--marker-at` — the realm's home by default, or any path on the site, a script included — **and in the same-origin files that page loads**, following module imports, because the realm's home page is a shell and everything it shows is built in the browser from `shelf-data.js`. It searches **afresh on every attempt** until the marker appears or the attempts run out, and says which attempt found it: a page returns 200 before a deploy as well as after, so polling for the status code and searching once read the old build every time (TD-010). A marker the previous release's copy of the file already held is **refused** — it is found on the old build as readily as on the new one — and without `--marker` the check reports `not run`. The comparison is with the previous *release*, not the previous push, so each push picks a string it introduces |
| `production-live` | A production game page still returns 200 after the deploy |
| `production-unchanged` | No file outside the allowed paths differs from the previous release — the newest iteration tag that is not `HEAD`, or `--previous-tag` — except the production fixes this iteration owns, admitted by the same rule as `path-guard`. It reports how many commits it compared, and `not run` when that number is zero |
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

The `gate`, `push` and `postdeploy` stages convert any `not run` into a failure, because
each exists to be conclusive. The other stages report and continue, so the studio can
still work offline.

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
