# Learning log

What the team learned, iteration by iteration. Entries are about the codebase, the tools
or the process — things a future iteration would otherwise have to rediscover. Findings
that are really decisions go to `decisions/` instead.

## Iteration 00

- **The 3D landing page is not in `3d.html`.** The HTML file is 32 lines of scaffolding.
  The scene, the portal list and the interaction handling all live in `shared/3d/`
  (`constants.js`, `gameplay.js`, `controls.js`, `main.js`, `state.js`). A plan that says
  "edit `3d.html` to add a link" is wrong about where the work is. Details in
  `iterations/00/findings-3d.md`.
- **Portal capacity is 9, and the game list is 11.** `createEnvironment()` walks
  `ARCADE_GAMES` against a fixed table of 9 positions and drops the overflow with a silent
  `return`. Two production games are already invisible on that page. Recorded as TD-002.
- **`node --test tests/` does not pick up non-`*.test.*` files**, verified on Node 26, so a
  runner can live at `tests/studio/check.mjs` without being executed by `npm test`, while
  `tests/studio/*.test.mjs` is collected normally.
- **Pages deploys from the `main` branch, not from an Actions workflow.** There is no
  `.github/` directory in this repo, so a post-deploy check cannot watch a workflow run —
  it has to poll the live URL until the content changes, with a timeout.
- **`git log --grep` needs `--all` or a branch range to see unmerged work.** The commit
  lint therefore reads the merge-base range for the iteration rather than `main` alone.
