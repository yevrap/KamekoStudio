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

## Iteration 01

- **A rule that decides what may be written to a file is a whitelist, or it is a guess.**
  The exception guarding a production file removed the approved change and compared what
  was left against the base revision. Described as "up to the next bracket", it reverted
  away whatever was smuggled inside the block. Narrowed to "arguments with no parentheses",
  it still did: a tagged template calls without one and an assignment expression assigns
  without one. An independent review put four such payloads into a file that runs on every
  visit to the landing page, with the guard printing *exception used*. Only the third form
  — an enumerated set of permitted tokens — held.
- **An adversarial test must fail against the rule it attacks.** The test written to prove
  the smuggling hole closed used `fetch("http://example.com")`, and was caught by the
  parenthesis rather than by the block's shape. It passed against the broken rule and the
  fixed one equally, so it measured nothing. Iteration 00's lesson was *test the input that
  defeats the rule*; the input has to be one that actually did.
- **Do not write "closed" before the thing that closes it has been attacked.** Three
  documents recorded the hole as fixed while it was open. A confident record is harder to
  doubt than a silent one.
- **A helper that trims is not a helper for comparing files.** Byte-exact comparison
  against `git show` output silently lost every file's final newline. The previous
  exception never noticed because it parses JSON first. A convenience applied one layer
  down defeated a boundary two layers up.
- **Measure the clearance, do not reason about it — and then check which object you
  measured.** The proposed portal row missed the nearest trophy by 0.01 in z. Reading the
  numbers out of the running scene turned "it looks fine" into a number, and the number
  changed the design. But the write-up then named the wrong trophy, and the review's
  correction named the wrong portal; only recomputing every pair settled it. The built
  portals were clear; the *reserved* twelfth slot was the one that overlapped.
- **A gate-stage check has to be run at the gate stage before the work is merged.** Every
  ticket recorded `--stage=ticket` evidence, so `hygiene` first failed after three tickets
  had landed, on a regex the iteration itself had added.
- **An empty state is a deliverable.** The shelf shipped with nothing on it. Building the
  component, testing every state it can reach, and rendering an honest "nothing here yet"
  is finished work; inventing entries to make a screenshot look better would not have been.

## Iteration 02

- **A test that defends a design has to be able to fail.** The hypothesis was that the
  coupling made each plate an ordering puzzle; the test held each bolt once *to the middle
  of its band* and found it insufficient. The hold amount is the one variable the player
  chooses, and fixing it removed the only freedom that mattered. The assertion was true and
  much smaller than the sentence above it claimed. General form: **if the strategy under
  test has a parameter the player chooses, fixing that parameter proves something narrower
  than the claim — usually much narrower.**
- **An exemption ships with its attacks, in the same commit.** Not "is tested": the tests
  are the payloads that defeat the previous version. This iteration wrote "unit-tested both
  ways" about four functions that had no test at all, and both reviews then defeated them.
  Iteration 01 learned *do not write "closed" before the thing that closes it has been
  attacked* — about an exemption — and this iteration repeated it on an exemption. Twice
  now the lesson has been applied everywhere except the place structurally identical to
  where it was learned, which is why it is now a step with an artifact rather than a thing
  to remember.
- **Do not decide anything from what a page says about itself.** A stack frame's URL, a
  console message's location and a script's declared name are all minted by the code that
  produced them: `//# sourceURL` lets any file claim any path at any origin. Three
  successive exemptions were built on that evidence and all three were defeated — first by
  a suffix match, then by anchoring to an origin and exact path, then by the same forgery
  pointed at `/favicon.ico`. **The lesson is not "anchor it harder".** When the only
  evidence available is a claim, change the situation instead: the driver now serves the
  favicon and stubs the inherited script, so there is nothing to recognise and nothing to
  impersonate.
- **A filter over errors is a rule about whose error it is**, and that is the question the
  page gets to answer. Prefer removing the cause to classifying the symptom.
- **A check that drives something must be listening while it drives it.** The phase that
  played the game collected no errors, so "no console errors" was a claim about the page
  load only.
- **Assert a release after a settle, never at the moment of release.** Reading immediately
  after `mouse.up` cannot distinguish a control that stopped from one that never stops.
  Deleting the pointer release made every tap destroy the plate, and everything passed.
- **Prove persistence by coming back, not by writing.** Stubbing the storage wrapper to a
  no-op passed every check. Stated as what the player gets back after a reload, it cannot.
- **Hiding something is a failure, not an exemption from the rule about it.** An invisible
  control was skipped before it was measured, which turned `opacity: 0` into an escape from
  the tap-target rule rather than a violation of it.
- **A difference test needs an absolute alongside it.** "Killed cards must differ from live
  ones" was satisfied by a card that was visually identical and numerically different — a
  double border, a shadow one thousandth of an alpha apart.
- **A plan names the files its own existence invalidates.** Creating `iterations/NN/` makes
  the realm's pulse line stale, because the line is tied to the newest iteration directory.
- **An experiment that returns "no" has succeeded.** Overtighten was built to answer one
  question and answered it, with a measurement. The failure was not the result; it was the
  test that would have hidden it.
- **A rule written to close a defect is the most likely thing to be satisfied by that
  defect.** Three rules written in one round were each defeated by the very behaviour they
  named: a back link rule that rejected `#` and accepted `index.html`; a
  states-must-differ rule satisfied by four greys one unit apart; an unticked-criteria rule
  that missed ordered lists. The author has the defect in mind and writes the narrowest
  thing that excludes the instance in front of them.
  **So: write the rule about the thing, not about the spelling.** Compare pages, not
  hrefs. Compare colours, not strings. Count declarations, not hiding places. When a rule
  can only be stated as a list of forms, it is not finished — the next form is already
  waiting.
- **The one that keeps working is the general one.** `docs-current` was defeated five times
  by five ways of hiding text and once more by a status read from raw text. Stripping each
  hiding place in turn never converged; "a ticket declares its status exactly once" ended
  it, because it is indifferent to how the second declaration was hidden.
