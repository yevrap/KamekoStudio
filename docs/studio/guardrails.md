# Guardrails

Shadow Studio shares a repository and a deployment with the production arcade. Everything
below exists so that a bad iteration is a messy `studio/` folder and nothing worse.

## The path guard

The studio may create or modify only these paths:

| Path | Why |
|---|---|
| `studio/**` | The realm itself |
| `docs/studio/**` | Its documentation |
| `tests/studio/**` | Its tests and self-check runner |

Everything else is out of bounds. A change outside the list stops the run and asks,
unless it is a **recorded exception** below.

### Recorded exceptions

An exception is a path outside the list that the executive has explicitly approved, for a
stated reason, once. Each one is listed here and in the guard itself
(`tests/studio/lib/rules.mjs`), so an approved exception is visible both to a reader and to
the check. The check reports an exception as *used*, never silently, and verifies the file's
**content** against the base revision rather than trusting the path.

| Path | Scope of the exception | Approved |
|---|---|---|
| `package.json` | The single `"studio:check"` entry in `scripts`, with exactly the value `node tests/studio/check.mjs`. No other key, and no other value. | Iteration 00 brief, deliverable 4 |
| `shared/3d/gameplay.js` | The `frontPositions` table in `createEnvironment()` — three front-wall positions, spread into `positions` and `rotations`. Nothing else in the file. | Iteration 01, as a production bug fix. ADR-0005 |

The second exception is checked by removing exactly that change from the file's current
text and requiring what remains to equal the base revision byte for byte, so an edit
riding along with it fails the guard.

The mechanism has been wrong in both directions, and what closed each hole is recorded
because the closing is the only reason to trust it now:

| Hole | How it was closed |
|---|---|
| The base revision was read through a helper that trims, so every file lost its final newline and byte equality could never hold — the exception rejected its own approved edit | Read raw. Tested against the repository in `tests/studio/path-guard.test.mjs`, not through the pure rule, which was never wrong |
| The approved block was matched as "everything up to the next bracket", so anything appended inside it was reverted away and waved through | Narrowed to "no parentheses" — which was **still wrong**, because a tagged template and an assignment expression need none. An independent review demonstrated four working bypasses end to end, with the guard printing *exception used*. The element is now a whitelist: exactly three `Vector3` calls, each with exactly three arguments drawn from numbers, identifiers, property paths and the four arithmetic operators. The four payloads are regression tests |

**What the exception still permits, stated rather than implied.** Up to twelve leading
comment lines inside the block may change without failing the guard. A comment cannot
execute, and `hygiene` scans this file because it is an exception path, so smuggled text is
caught there. This is a bounded, accepted residual, not a closed hole.

### Pending, not yet approved

| Path | What it would be for | Status |
|---|---|---|
| `shared/3d/constants.js` | One entry in `ARCADE_GAMES` so the realm has its own portal on the 3D landing page | **Held by decision**, not by capacity: the realm gets a door once it has a gallery worth entering. The twelfth slot is free and waiting. TD-001 |
| `3d.html` | Nothing, as it turns out: the landing page's content lives in `shared/3d/`, not in the HTML | Not needed |

A production edit is a single reviewed change, made last in the iteration, in its own
commit, after it is approved. It is not in the allowed list until then, and the guard will
fail on it.

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
does not know about the `studio_` prefix. Adding it is a future one-line exception; see
`decisions/ADR-0003-storage-namespace.md`.

## The production safety net

GitHub Pages deploys from `main`, so every studio push also redeploys production. Two
consequences the team lives with:

1. **Before merging**, the full existing suite runs: `npm test`, `npm run smoke`,
   `npm run e2e`. Not the studio's tests — all of them.
2. **After deploying**, the run verifies that a production game page still loads and that
   no file outside the allowed paths differs from the previous iteration's tag.

## Stop and ask

The run halts and reports rather than deciding, when it hits:

- a change outside the allowed paths that has no recorded exception;
- anything touching releases, accounts, credentials or money;
- a destructive or hard-to-reverse git operation (force push, history rewrite, branch
  deletion on the remote, reverting production work);
- a product question whose answers would lead to materially different builds;
- a failing check it cannot fix within the fix-round cap.

## The STOP file

A file named `STOP` in the directory the run was started from halts the run at the next
step boundary. The run then writes the handoff and reports what was and was not finished.
