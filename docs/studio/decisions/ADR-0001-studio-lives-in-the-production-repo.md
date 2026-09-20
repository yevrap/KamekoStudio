# ADR-0001 — The studio lives in the production repo, behind a path guard

- **Status:** Accepted
- **Date:** 2026-09-19
- **Iteration:** 00

## Context

Shadow Studio is an experiment run by a simulated team. It needs somewhere to build,
deploy and be looked at. The production arcade is a static site deployed from `main` of
this repository to GitHub Pages, with no build step and no second environment available.

The alternatives were a separate repository, a separate branch, or a folder inside this
one.

## Decision

The studio lives in `studio/` inside this repository, deployed by the same Pages
deployment, and is contained by a path guard that allows it to write only to `studio/`,
`docs/studio/` and `tests/studio/` (plus recorded exceptions).

## Consequences

- The studio is one URL away from the arcade, and promotion of a studio game to production
  is a file move plus a checklist rather than a migration.
- Every studio push redeploys production. This is the real cost. It is paid for by running
  the *entire* existing test suite before any merge, and by verifying after the deploy that
  a production page still loads and that no production file changed.
- The studio shares an origin, and therefore a `localStorage`, with production. See
  ADR-0003.
- The public repository now contains the studio's process documents. Everything the studio
  writes has to meet the hygiene rules in `../public-repo-hygiene.md`.
- Git history stays filterable: `git log --grep "(studio)"` and `git log -- studio/`.

## Alternatives considered

| Option | Why not |
|---|---|
| A separate repository | A second Pages site and a second deploy to babysit, and promotion becomes a cross-repo port. The isolation it buys is the isolation the path guard already buys. |
| A long-lived branch | Never deployed, so nothing is ever actually looked at; and a merge to `main` at the end is exactly the risky big-bang the guard is meant to avoid. |
| A `drafts/` subfolder | `drafts/` already means "production work not yet linked" and is swept by the production smoke test. Overloading it would blur both meanings. |
