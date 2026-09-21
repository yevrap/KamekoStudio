# SS-030 — There is no error filter left, and the third review's ten mutations fail

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-027
- **Branch:** `ss-030-close-the-second-exemption`

## Motivation

Opened by the third independent review, which rejected the iteration again. SS-027 deleted
the `shared/settings.js` exemption and left a second one in place: `pageErrors` still
filtered the browser's own `/favicon.ico` 404, and that filter read `error.source` too —
which for an uncaught throw is `firstFrame(err.stack)`, a string the page mints. A studio
file throwing `//# sourceURL=<origin>/favicon.ico` had its error dropped **in every pass**,
and the test suite asserted the hole as intended. The review also found ten more mutations
inside `studio/**` that break the game while the ticket stage stays green, three further
routes past `docs-current`, and a wrong number on the live page.

## Acceptance criteria

- [x] **There is no error filter.** `pageErrors` maps texts and nothing else;
      `isBrowserInitiated` is deleted.
- [x] The browser's favicon request is **answered** by the driver rather than recognised
      afterwards, so there is no 404 to explain.
- [x] The blocked-storage pass proves it was in that configuration: storage really throws,
      and the inherited script really was stubbed.
- [x] All ten of the third review's mutations fail the ticket stage.
- [x] `docs-current` validates the status vocabulary, reads only the **last** Result
      section, and ignores fenced examples.
- [x] `studio-boot`'s own limits are written down in `self-checks.md`, rather than the
      documents claiming nothing is left.
- [x] No regression: every earlier mutation still fails.

## Evidence plan

Each attack re-applied to a clean tree, the ticket stage run, the message recorded.

## Out of scope

- The record corrections that follow from this review — folded into SS-028's successor
  notes in `review.md`, `log.md`, the changelog and the learning log, since they are edits
  to documents rather than a build.

---

## Result

- **What changed:**
  - `tests/studio/lib/boot-contract.mjs` — `isBrowserInitiated` deleted; `pageErrors` is now
    `errors.map(e => e.text)`. New rules: the keyboard after a pointer press, release on
    focus loss, state classes tracking, the bench on screen after a pick, stroke *width* as
    well as colour, and the blocked-storage configuration proving itself.
  - `tests/studio/checks/boot.mjs` — `openPage()`, which answers the favicon request in every
    pass and stubs the inherited settings script in the blocked-storage pass; the new
    observations; a real `page.click` on the picker instead of `element.click()`.
  - `tests/studio/checks/docs.mjs` — `STATUSES`, a closed vocabulary; `resultSection()`,
    which strips fenced code and takes the last `## Result`.
  - `studio/games/overtighten/ui.js` — coupling-line coordinates rounded.
  - `docs/studio/self-checks.md` — the three-exemption story, the general rule, and a new
    section on what the check does **not** cover.

- **Tested by:** every attack from the third review, replayed. All ten now fail:

  | Attack | Caught by |
  |---|---|
  | forged `//# sourceURL` claiming `/favicon.ico` | *booted with 1 error(s): uncaught: SecurityError: studio defect* |
  | `pointerdown` no longer focuses | *holding a key did nothing after the pointer was used* |
  | focus-loss releases deleted | *the bolt kept turning after focus left it* |
  | mute button dead | *the "Sound on/off" control does nothing when pressed* |
  | state classes never cleared | *a bolt kept its old state class as it seated* |
  | coupling line endpoints transposed | `studio-tests` — two unit tests on the coordinates |
  | picking a plate leaves nothing in view | *after choosing a plate, its bolts are off screen* |
  | band at `stroke-width: 0` | *the gauge's band is 0px wide* |
  | coupling lines `transparent` | *the gauge's coupling line is drawn in rgba(0, 0, 0, 0)* |
  | torque readouts `transparent` | *the gauge's torque readout is drawn in rgba(0, 0, 0, 0)* |

  Regression: the earlier 28 still fail. `npm test` green, 197 studio tests.

- **Three of my own attempts were too weak before they worked**, and the pattern is the same
  one under review each round — measuring where the thing cannot fail. The keyboard test
  passed because an earlier phase had left focus on the bolt. The scroll test passed
  because `element.click()` does not scroll a control into view, which is precisely what a
  real press does. The `block: 'end'` mutation I first tried was not a defect at all, so it
  proved nothing either way; the real regression is the picker neither scrolling nor
  focusing, and that is what is now asserted.

- **What this ticket does not claim:** that nothing is left. Three passes each found
  mutations the previous round survived, so the honest statement is a count of what has
  been tried — 38 across five sets — plus a written list of what the check does not look
  at. That list is now in `self-checks.md`.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
