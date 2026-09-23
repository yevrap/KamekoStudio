# Guardrails

Shadow Studio shares a repository and a deployment with the production arcade. Everything
below exists so that a bad iteration is a messy `studio/` folder, or at worst one reviewed
production fix that one revert commit undoes.

## The path guard

The studio may create or modify only these paths:

| Path | Why |
|---|---|
| `studio/**` | The realm itself |
| `docs/studio/**` | Its documentation |
| `tests/studio/**` | Its tests and self-check runner |

Everything else is out of bounds. A change outside the list stops the run and asks,
unless it is a **recorded exception** or a **production fix**, both below.

### Studio commits and arcade commits

The arcade ships on the same `main`, so every range the checks read holds both kinds of
commit. `commitKind` in `tests/studio/lib/rules.mjs` sorts each one, and `commit-lint`,
`path-guard` and `production-unchanged` all ask it:

| Kind | How it is recognised | How it is judged |
|---|---|---|
| Studio | The subject's scope is `(studio)`, whatever the type or ticket, **or** the subject names a studio ticket (`SHS-NNN`, the retired `SS-NNN`), whatever the scope (iteration 05 review) | `commit-lint` requires `type(studio): SHS-NNN …`; the path guard judges every file it changed |
| Arcade | Any other subject: no `(studio)` scope and no studio ticket | Not linted, and free to change anything **except** `studio/**`, `docs/studio/**` and `tests/studio/**`: a studio path it changed is a violation |
| Merge | More than one parent | Judged by what it changes against its first parent: only studio paths or only other paths is that kind, both at once is a violation. The commits it brings in are judged one by one as well |
| Exempt | Its full hash is in `COMMIT_EXEMPTIONS`, with a reason | Neither linted nor guarded, and reported by both checks with its reason. Today: the executive's three 2026-09-22 commits (the migration, the E1 direction, ADR-0009) |

Uncommitted changes count as studio work: the guard cannot tell whose they are.

**What this proves, and what it does not.** The scope and the ticket are claims the author
makes. The checks prove that a commit claiming to be the studio's stayed inside the studio's
paths, and that a commit not claiming it stayed out of them, so dropping the scope and the
ticket moves a change to studio paths from the lint to the path guard rather than past both.
A commit that claims neither and changes only production paths is judged by nothing: that is
the arcade's own work, and the studio's discipline, not a check, keeps its sessions from
disguising a production change that way (iteration 05 review). They do not prove who wrote a commit, and
an arcade commit is free to change any production file: the arcade is not the studio's to
guard. Two edges keep their earlier rules: a recorded exception still compares the whole
file at the base with the file now, so an arcade edit to `package.json` or
`shared/3d/constants.js` in the same range shows up there until the iteration is tagged (a
new arcade portal is the likely case; iteration 05 review, backlog #29); and a production fix is still refused when any commit in the range, arcade
or studio, changed its file without naming its ticket.

### Arcade docs about studio work

When studio work makes an arcade document stale (a game's row in `CLAUDE.md` or
`games/CLAUDE.md`, rows in `docs/roadmap.md`, a game's `docs/games/<slug>/` pages, a
questionnaire the studio has consumed), the studio session updates it itself rather than
handing it to the executive (chat direction, 2026-09-22). The edit goes in its own arcade
commit (`docs: …`, no `(studio)` scope, no studio ticket and no studio path in it), so the
checks sort it as arcade work, and it follows the arcade's rules: regenerate the `GEMINI.md` files, `npm test`
green. It covers **documentation only**. Game code, shared code and tests outside the studio
paths stay under the recorded exceptions and production fixes below.

### Recorded exceptions

An exception is a path outside the list that the executive has explicitly approved, for a
stated reason, once. Each one is listed here and in the guard itself
(`tests/studio/lib/rules.mjs`), so an approved exception is visible both to a reader and to
the check. The check reports an exception as *used*, never silently, and verifies the file's
**content** against the base revision rather than trusting the path.

| Path | Scope of the exception | Approved |
|---|---|---|
| `package.json` | The single `"studio:check"` entry in `scripts`, with exactly the value `node tests/studio/check.mjs`. No other key, and no other value. | Iteration 00 brief, deliverable 4 |
| `shared/3d/gameplay.js` | The `frontPositions` table in `createEnvironment()` — three front-wall positions, spread into `positions` and `rotations`. The scope is the table, not a particular set of coordinates: moving a position within it is inside the exception, a fourth position or any other statement is not. Nothing else in the file. | Iteration 01, as a production bug fix. ADR-0005 |
| `shared/3d/constants.js` | The `url` of the `ARCADE_GAMES` entry named `"River Run Rapids"`, with exactly the value `studio/games/river-run/`. No other entry, no other value, nothing else in the file. The approved forks are listed in `STUDIO_FORK_PORTALS`. | Iteration 05, [SHS-057](iterations/05/tickets/SHS-057-portal-opens-fork.md). The E1 direction's done-when (*a 3D portal leads to a studio fork*) and Q4. ADR-0010 |

The second and third exceptions are checked by removing exactly the approved change and
requiring what remains to equal the base revision byte for byte, so an edit riding along
with it fails the guard. The third undoes its value on both sides, so once the change is
released an unchanged file stays unchanged, and pointing River Run back at production (the
rollback) passes.

The mechanism has been wrong in both directions, and what closed each hole is recorded
because the closing is the only reason to trust it now:

| Hole | How it was closed |
|---|---|
| The base revision was read through a helper that trims, so every file lost its final newline and byte equality could never hold — the exception rejected its own approved edit | Read raw. Tested against the repository in `tests/studio/path-guard.test.mjs`, not through the pure rule, which was never wrong |
| The approved block was matched as "everything up to the next bracket", so anything appended inside it was reverted away and waved through | Narrowed to "no parentheses" — **still wrong**, because a tagged template calls and an assignment expression assigns without one. Narrowed again to the character class `[-+*/\s\w.]+` — **still wrong**, because every keyword is word characters, so `delete engineState.walls`, `new fetch`, `typeof window` and `obj.prop++` all passed; deleting `engineState.walls` blanks the landing page. Two review passes demonstrated sixteen bypasses between them, each end to end with the guard printing *exception used*. An argument is now a **grammar** — operands joined by operators, two adjacent operands forbidden — which is what rejects `new X`, `delete a.b`, `typeof x` and `void x` at once. Every payload is a regression test written against the rule in force |
| The block could be moved verbatim to another point in the file, reverted away from wherever it landed, and accepted | The pattern is anchored to the statement it precedes |
| Positions could be added with no matching rotations, leaving portals facing an arbitrary direction | The guard requires the rotation entry itself, rather than relying on `portal-capacity` having been run |

**What the exception still permits, stated rather than implied.** Up to twelve leading
comment lines inside the block may change without failing the guard. A comment cannot
execute, and `hygiene` scans this file because it is an exception path, so smuggled text is
caught there. This is a bounded, accepted residual, not a closed hole.

### Pending, not yet approved

| Path | What it would be for | Status |
|---|---|---|
| `shared/3d/constants.js` | A new entry in `ARCADE_GAMES` so the realm itself has a portal on the 3D landing page. Not River Run's fork url, which is the recorded exception above | **Held by decision**, not by capacity: the realm gets a door once it has a gallery worth entering. The twelfth slot is free and waiting. TD-001 |
| `3d.html` | Nothing, as it turns out: the landing page's content lives in `shared/3d/`, not in the HTML | Not needed |

### Production fixes

The executive has given the studio standing permission to fix production files, provided
the full sprint process runs with its documentation. [ADR-0008](decisions/ADR-0008-production-fixes.md)
records the permission, what counts as a fix, and what still stops the run.

A production fix is admitted by the guard, not waved past it. `PRODUCTION_FIXES` in
`tests/studio/lib/rules.mjs` lists each production file the studio fixes, with its ticket
and iteration, and `path-guard` admits the file only when:

- an entry for that exact path names the iteration being checked;
- that ticket has a file in the iteration's `tickets/` directory;
- every commit since the previous release that changed the file names that ticket, a
  merge that changed it included.

It refuses a fix file that was deleted, and any change to one after the iteration's own
tag. The check names every fix it admits, with its ticket and line counts; `production-unchanged` applies the
same rule after the deploy; `hygiene` scans the file. A production path without a matching
entry is a violation, exactly as before.

**What this proves is that a production write was planned and recorded, not that the plan
was legitimate.** Everything the guard reads, its own rules included, is written by the
studio. The control against a wrong or fabricated fix is an independent review *before* it
is pushed, recorded in `iterations/NN/reviews/<TICKET>.md` against the commit it saw.
`production-fix-reviewed` refuses a push, or the gate, unless every file the fix owns is
exactly what that commit holds. See ADR-0008.

The list has one home, `PRODUCTION_FIXES` itself, unlike the exceptions above: an entry is
a fact about one ticket, and the ticket is where its reasons are written. An entry for the
iteration being checked takes precedence over an exception on the same file, so a defect
elsewhere in that file goes through the full process instead of being refused by the
narrower rule.

What a production fix still may not be, and so stops and asks: a feature, a design change,
a fix that needs a choice between two reasonable behaviours, a promotion, a change to a
game's listing, a repository-wide dependency or tooling change, anything touching releases,
accounts, credentials or money, or undoing production work the studio did not do.

## The storage rule

`studio/` is served from the same origin as production, so it shares one `localStorage`.

- Every key written by code under `studio/` begins with `studio_`.
- Studio code never reads or writes a key that does not begin with `studio_`, never calls
  `localStorage.clear()` — which would empty the whole origin, production saves included —
  and never builds a key the `storage-keys` check cannot read statically.
- Every key is documented in `studio/README.md` before it is used.

**What this rule does not cover.** Studio pages load `shared/settings.js`, the arcade's
settings drawer, for the light/dark toggle. That script reads and writes `theme` and
`devMode` and provides "Clear All Game Data", which removes the production keys it knows
about. It is production code, inherited deliberately, and it is outside the path guard —
so the rule above is a rule about *studio code*, not about every byte of storage a studio
page touches. Saying otherwise would be a claim the check cannot support: `storage-keys`
scans `studio/**` only.

Clearing all game data therefore leaves studio data behind, since the drawer's key list
does not know about the `studio_` prefix. Adding it would be a production fix under
ADR-0008; see `decisions/ADR-0003-storage-namespace.md`.

## The production safety net

GitHub Pages deploys from `main`, so every studio push also redeploys production. Two
consequences the team lives with:

1. **Before every push**, the full existing suite runs: `npm test`, `npm run smoke`,
   `npm run e2e`. Not the studio's tests — all of them. The `push` stage of the checker
   runs it.
2. **After every deploy**, the run verifies that a production game page still loads, that
   the new build is the one being served, and that no file outside the allowed paths
   differs from the previous release — other than the production fixes this iteration's
   tickets own.

## Stop and ask

The run halts and reports rather than deciding, when it hits:

- a change outside the allowed paths that is neither a recorded exception nor an
  admissible production fix;
- anything touching releases, accounts, credentials or money;
- a destructive or hard-to-reverse git operation (force push, history rewrite, branch
  deletion on the remote, reverting production work);
- a product question whose answers would lead to materially different builds;
- a failing check it cannot fix within the fix-round cap.

## The STOP file

A file named `STOP` in the directory the run was started from halts the run at the next
step boundary. The run then writes the handoff and reports what was and was not finished.
