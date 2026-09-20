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
- **Node cannot always spawn the `git` on PATH.** On this machine `/usr/local/bin/git` is
  an x86-only binary; `posix_spawn` from an arm64 Node fails with `EBADARCH`
  ("Unknown system error -86") even though the same command works from an interactive
  shell. The checks resolve a git binary by probing and falling back to the universal
  `/usr/bin/git`, overridable with `STUDIO_GIT`.
- **`git status --porcelain` lines start with a space** for unstaged changes, so trimming
  the command's output before splitting shifts every path by one character. The runner
  keeps porcelain output untrimmed and parses it with an explicit two-character status
  field.
- **`git diff --name-only` prints only the destination of a rename.** A `git mv` out of a
  production directory into `studio/` therefore looked like a studio-only change while
  deleting a production file. The guard now reads `--name-status -M -z` and counts both
  sides. This was the most serious thing the independent review found.
- **A diff-text check sees nothing once the change is committed.** The `package.json`
  exception parsed `+`/`-` lines, so it was only ever exercised against an uncommitted
  change — at the gate, with a clean tree, it compared an empty string and passed. Rules
  that guard a file should compare *content* between two revisions, not diff text.
- **A static storage rule is only as good as its list of routes.** Checking
  `getItem`/`setItem`/`removeItem` missed `localStorage['key']`, `delete localStorage.key`
  and — worst — `localStorage.clear()`, which would wipe every production save on a shared
  origin. It also passed `setItem(studio_key, v)`, where the key is a variable that merely
  *reads* like a compliant one. A computed key is now a violation whatever its text.
- **A green gate can sit on untracked files.** The document checks read the filesystem, so
  they certified nine ticket files that were not in the repository. `tree-clean` now runs at
  the gate too, which is what makes those checks statements about what will be pushed.
- **"Not run" must be reserved for things that genuinely could not run.** Reporting a
  missing Chrome as a suite *failure* makes an environment problem indistinguishable from a
  regression. The suites now skip with the reason and name what did run.
