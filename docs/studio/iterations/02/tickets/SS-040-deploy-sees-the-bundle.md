# SS-040 — The deploy check can see what actually changed

- **Status:** Done
- **Size:** S
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-039
- **Branch:** `ss-040-deploy-sees-the-bundle`

## Motivation

Found by the publish step itself. `studio-live` fetched `/studio/` and searched the HTML
for the deploy marker — but the realm's home page is a shell: its shelf, its pulse line and
its retro line are all built in the browser from `shelf-data.js`. So the one thing the
check exists to prove, that what changed is really on the wire, was the one thing it could
not see. The deploy was correct and the check reported a failure.

A deploy check that reads only the shell verifies only the shell.

## Acceptance criteria

- [x] `studio-live` searches the page **and the same-origin files it loads**, following
      module imports far enough to reach the data the page renders.
- [x] Off-origin urls are ignored — a CDN copy of a library says nothing about this build.
- [x] The two helpers are pure, in `lib/rules.mjs`, and unit-tested.
- [x] A missing marker reports how many files were searched, so a failure is diagnosable.

## Evidence plan

`--stage=postdeploy --marker="Overtighten"` against the live site.

## Out of scope

- Rendering the page. This reads what is served, which is what "deployed" means.

---

## Result

- **What changed:** `tests/studio/lib/rules.mjs` — `sameOriginAssets` and `moduleImports`,
  both pure. `tests/studio/checks/deploy.mjs` — `studio-live` walks the page's scripts and
  stylesheets, then one level of module imports, stopping at the first file containing the
  marker.

- **Tested by:** the live site, immediately after the iteration-02 deploy:

  > `"Overtighten" served from https://yevrap.github.io/KamekoStudio/studio/shelf-data.js`
  > `(reached from https://yevrap.github.io/KamekoStudio/studio/; 5 file(s) checked)`

  Before this change the same deploy reported *"marker not found after 12 attempts"* while
  serving the game correctly at a 200. `npm test` green, 208 studio tests.

- **Why this is the same mistake as the rest of the iteration.** The rule was right and the
  observation was taken from the wrong place — the shell rather than the thing the shell
  builds. That is the fourth variety of it this iteration: a rule fed input that cannot
  falsify it. It is now in the retro's numbered changes.

- **Where this sits relative to the tag.** `studio-iteration-02` points at the commit the
  gate passed and the deploy was made from. This ticket landed two commits later, because
  the publish step is what found the defect. The tag has **not** been moved: it marks what
  was gated and shipped, and moving a pushed tag rewrites a ref other clones may hold. The
  live site is `main`, so the fix is deployed either way.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
