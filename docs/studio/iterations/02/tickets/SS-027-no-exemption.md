# SS-027 — The exemption is removed rather than anchored, and nine more attacks fail

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-024
- **Branch:** `ss-027-no-exemption`

## Motivation

Opened by the **second** independent review, which rejected the iteration again. SS-024
anchored the boot check's exemption to an origin and an exact path. That was still wrong,
and not by being too loose: a stack frame's URL is minted by the script that throws, so a
`//# sourceURL` comment lets any studio file claim production's identity. The review did it
in six lines. It also found seven mutations inside `studio/**` that break something a player
would notice while the whole ticket stage stayed green, and a bug in `docs-current` that let
a Done ticket ship with an entirely empty Result.

## Acceptance criteria

- [x] **The exemption no longer exists.** The blocked-storage pass serves an empty script in
      place of production's `shared/settings.js`, so every error in that pass is the
      studio's and there is nothing left to forge.
- [x] `firstFrame` survives only to put a path in a failure message, and says so. Nothing
      decides anything from a stack frame.
- [x] Every control on a game page is pressed and something is asserted to have happened —
      restart, the picker (both its refusal *and* its positive case), and "Next plate".
- [x] The plate's labels — name, hint, status line — must not be empty.
- [x] The bolt must repaint while it turns, **and** its gauge must be stroked in visible
      colours. Pixels alone were not enough: the turning highlight repaints even when the
      whole arc is transparent.
- [x] The realm's **own** shelf must offer at least one card, and every card's link must be
      a page this check itself booted.
- [x] `judgeOvertighten` fails closed on its error list and its visibility flag.
- [x] `docs-current` reads evidence with a rule that stops at the next label, and that rule
      is unit-tested against the empty template first.
- [x] The strip-margin test asserts the three units its own sentence claims, not five.
- [x] All nine of the second review's attacks fail, and none of the previous nineteen
      mutations regress.

## Evidence plan

Each attack re-applied to a clean tree, `studio-boot` run, message recorded, reverted.

## Out of scope

- The record corrections (SS-028) and the turn-loop leak (SS-029).

---

## Result

- **What changed:**
  - `tests/studio/lib/boot-contract.mjs` — `isInheritedSettingsThrow` **deleted**;
    `pageErrors` lost its ignore hook; `isInvisibleColour` added; new rules for the plate's
    labels, its controls, the bolt repaint, the gauge's ink, and the realm's real shelf;
    the two fail-open game fields closed.
  - `tests/studio/checks/boot.mjs` — the blocked-storage pass intercepts and stubs
    `/shared/settings.js`; the home pass reads the real shelf's cards and resolves each
    link against the pages the check discovered; the game pass reads the labels and the
    gauge's computed strokes, screenshots the **bolt** before and during a hold, and presses
    every control.
  - `tests/studio/checks/docs.mjs` — `evidenceFor`, replacing the `\s*(.*)` match.
  - `tests/studio/docs-evidence.test.mjs` — new, 7 tests, the empty template first.
  - `docs/studio/self-checks.md` — the `studio-boot` row rewritten, and a new section on
    the one thing the check refuses to trust.

- **Tested by:** all nine attacks from the second review, replayed against the fix. Every
  one now fails:

  | Attack | What the check says now |
  |---|---|
  | forged `//# sourceURL` claiming production's identity | *booted with 1 error(s): uncaught: SecurityError: denied* |
  | restart listener emptied | *the "Start this plate again" control does nothing when pressed* |
  | picker listener emptied | *the "plate picker" control does nothing when pressed* |
  | advance listener emptied | *the "Next plate" control does nothing when pressed* |
  | status line blanked | *the status line is empty* |
  | plate name and hint blanked | *the plate name is empty · the plate hint is empty* |
  | gauge, band and head stroked `transparent` | *the gauge's band is drawn in transparent: the player cannot see it* |
  | shelf card loses its url | *"Overtighten" is on the shelf with no link: there is no way to reach it* |
  | `SHELF` emptied | *the shelf is empty: the realm offers nothing, whatever the component can render* |

  Regression: the original eight, the five bypasses from the first review and the six game
  mutations all still fail — 28 in total, checked against current source. `npm test` green.

- **Two of my own first attempts were too weak, and are recorded because the pattern is the
  point:** the picker was only ever exercised on a fresh profile, where *nothing* may load,
  so a picker that did nothing passed its own test; and the repaint screenshot was taken
  before the bolt was focused, so the focus ring counted as the repaint. Both are the same
  error as the one under review — measuring in the configuration where the thing cannot
  fail.

- **Deferred:** nothing.

- **Fix rounds used:** 2 / 2
