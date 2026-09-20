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

### Pending, not yet approved

| Path | What it would be for | Status |
|---|---|---|
| `shared/3d/constants.js` | One entry in `ARCADE_GAMES` so the realm has a portal in the 3D landing page | Proposed in `iterations/00/findings-3d.md`; **blocked** until approved |
| `shared/3d/gameplay.js` | A portal position for that entry — the existing position table holds 9 portals and is already full | Same |
| `3d.html` | Nothing, as it turns out: the landing page's content lives in `shared/3d/`, not in the HTML | Same |

The portal change is a single reviewed edit, made last, after the design is approved. It
is not in the allowed list until then, and the guard will fail on it.

## The storage rule

`studio/` is served from the same origin as production, so it shares one `localStorage`.

- Every key the studio writes begins with `studio_`.
- The studio never reads or writes a key that does not begin with `studio_`.
- Every key is documented in `studio/README.md` before it is used.

The production "Clear All Game Data" button in `shared/settings.js` does not know about
`studio_` keys, and `shared/settings.js` is outside the path guard. Clearing production
data therefore leaves studio data behind, on purpose, for now. Adding the `studio_` prefix
to that list is a future one-line exception; see `decisions/ADR-0003-storage-namespace.md`.

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
