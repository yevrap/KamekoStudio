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
- **A rule that has to interpret a format is competing with that format.** Ten review
  rounds defeated `docs-current` ten times, and every fix but the last tried to decide what
  a Markdown renderer would show — first by stripping hiding places out of the text, then by
  scanning it as CommonMark. Stripping deleted text that renders; scanning missed
  constructs a real parser handles. The surface was the whole of CommonMark and the checker
  was three hundred lines.
  **So: need less from the reading.** "A ticket declares each thing exactly once, counted
  raw" is indifferent to every construct the format has or will ever have, and it caught
  every one of the thirteen payloads that had beaten the previous designs. When a rule keeps
  losing, the question is not how to read better but how to depend on reading less.

## Iteration 03

- **A flaky test can be a deterministic defect sampled by a race.** TD-009 failed about one
  suite run in three, so it was registered as a flaky test. The cause was in the game:
  `stepParticles` moves spiral particles around `world.blackHole`, Explore's world reset
  sets it to `null` and leaves the particles, and the start menu draws a golf hole with a
  black hole behind itself. A player entering Explore with spirals alive hits it every
  time; the test only when a particle happens to spawn in the few frames it waits. **Run
  the player's path before calling a test flaky.**
- **A check that says "fixed" has to test the defect, not a route to it.** The TD-009
  reproduction was defeated twice by partial fixes: first because it tried the route it was
  built from, then because the direct test added to close that ran in the start menu's
  state — the very state a route-specific fix keys off — and never confirmed that a spiral
  existed before removing the black hole. The direct test now runs in a golf round and
  counts the spirals it spawned, by swapping in a black hole whose `x` counts its reads and
  subtracting a no-particle baseline. **A clean result is only evidence if the check proved
  its precondition first.**
- **A script's own failure must not share an exit code with a verdict.** The first version
  exited 1 — *present* — when a selector was missing.
- **Games remember things between visits, so every browser trial gets its own profile.**
  Black Hole in One draws the last mode played behind its menu; with one shared profile,
  only the first trial of each batch had a golf hole behind it.
- **A check that reads only what exists cannot see what is missing.** `docs-current` read
  the ticket files that existed, so three tickets named by commits on `main` had no file
  and the gate reported their iteration complete. Existence has to be decided from an
  independent source — here, every commit subject in the history — and that part of the
  rule reads no Markdown at all.
- **When a convention changes, check for violations of the new rule, not leftovers of the
  old spelling.** The search after the prefix change looked for `SS-NNN` and missed an
  `SHS-003` example, which the new rule rejects, in the paragraph that states the rule. The
  check is now a test that lints every example in the handbook.
- **A commit already on the remote cannot be fixed; it can be waived by its hash.** A hash
  is computed from the commit's content, subject included, so a waiver keyed by it names
  one subject forever and cannot be claimed by copying. That is the difference from the
  exemptions iteration 02 removed: nothing in it is something a commit says about itself.
- **Say where a number was measured.** Two counts in a Result were taken on uncommitted
  trees and did not say so, and a rate was stated from three runs. A number in the public
  record names where it came from and is reproducible from the repository, or it is left
  out.
- **Agreement between reviewers on different models is stronger evidence than agreement
  between two on the same one.** In iteration 02, two passes on the author's model found
  the same defects — corroboration, or a shared blind spot. In round 2 here the reviewer, on
  a different model, and QA, on the author's, found the same defect independently.

## Iteration 04

- **A check that reads only what the checked party writes proves consistency, not
  legitimacy.** The production-fix guard reads an entry, a ticket file and commit subjects.
  The studio writes all three, and the guard's own rules besides. A fabricated fix that
  agrees with itself passes. The guard is still worth having, because it catches a
  production write nobody planned. But a check has to say which of the two it proves, and
  the control for the other lives elsewhere: here, an independent review before the push.
- **Where the thing matters, compare content, not the shape of history.** Three checks in a
  row were defeated by history that looked right while the content was wrong:
  - excluding merges hid a change made in a merge;
  - git's history simplification hid a merge that took a file from its side parent;
  - "every commit is an ancestor of the reviewed one" missed a file put back to the
    release after its review.

  "Is every file exactly what the reviewers saw?" has none of those holes.
- **A comparison of nothing must never pass, anywhere.** Closing TD-011 in one check left
  the same shape in four others: an empty commit range, a missing marker, a marker the old
  build already had, a stage that ran nothing, a release compared with itself. The rule is
  about any two things being compared: if they are the same thing, or nothing, the answer
  is *not run*.
- **A trial finds the exceptions a plan did not.** Trunk-based work put the first
  production fix live before review. For studio pages that was an accepted cost; for a
  production game it was the wrong order. The exception — production fixes wait for
  review — came from running the trial, not from designing it.
- **Two reviewers on different models found different kinds of thing.** The reviewer on the
  other model found that the guard proves nothing about legitimacy. The reviewer on the
  author's model found the merge, release, empty-range and stale-marker holes. Neither
  found the other's.
- **A mutation that survives can mean the test cannot reach the rule.** The review check's
  history test used a commit that exists nowhere, which a different rule refuses first.
  Removing the history check changed nothing until the test used a real commit on another
  branch.
- **Copy a marker from the diff, and a count from a command.** A marker typed from memory
  wrapped across two lines in the source and was found nowhere. A push count typed from
  memory was a different number that happened to be on screen.

