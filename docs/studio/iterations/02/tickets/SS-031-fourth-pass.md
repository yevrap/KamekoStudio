# SS-031 — The record, the fence, the phone, and the bolt's other three states

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-030
- **Branch:** `ss-031-close-the-fourth-pass`

## Motivation

Opened by the fourth independent review, which rejected the iteration on three things: four
false statements in the record — including a ticked criterion and an explicit "both are
true now" about a `**Verdict:**` line that did not exist; `docs-current` still accepting an
evidence-free Done ticket two ways; and the check's central mobile claim never having been
tested on a mobile viewport.

## Acceptance criteria

- [x] `studio-boot` emulates a **phone** (`isMobile`, touch, 320px), so
      `<meta name="viewport">` is load-bearing, and a page that lays out at the default
      ~980px fails.
- [x] The bolt's four state treatments are read from a fixture and must differ from one
      another, not only the one state a fresh plate happens to be in.
- [x] A locked plate must look different from an open one.
- [x] Focus lands on a bolt after a plate loads; the picker is redrawn when a plate is
      cleared; the outcome panel explains itself; the "next plate" button has a label.
- [x] The coupling the running game uses is checked against the coupling the model
      specifies, **for every plate**.
- [x] A bolt reached with Tab has a visible focus ring.
- [x] `resultSection` strips `~~~` fences and HTML comments as well as backticks, evidence
      shorter than 12 characters is not evidence, and `- [ ]` with a non-breaking space
      counts as unticked.
- [x] The favicon is answered by **exact path**, not by suffix.
- [x] Every false statement the review named is corrected, and the criterion that could not
      be true is removed rather than re-explained.
- [x] `self-checks.md`'s gap list is accurate, and the gaps carry a debt row (TD-008).

## Evidence plan

Each of the review's mutations re-applied to a clean tree, the ticket stage run, reverted.

## Out of scope

- Nothing deferred. One finding is declined below, with the measurement.

---

## Result

- **What changed:**
  - `tests/studio/checks/boot.mjs` — a `PHONE` device descriptor for the ordinary pass; the
    favicon answered by exact path; fixtures reading the bolt's four state treatments and
    the picker's open/locked pair; a focus ring reached with **Tab**; `proveFocusAfterLoad`;
    `proveCouplingPerPlate`, which seeds progress so every plate can be opened; the outcome
    panel's explanation, the advance button's label and the picker's refresh read while a
    cleared plate is on screen.
  - `tests/studio/lib/boot-contract.mjs` — rules for all of the above, plus
    `judgeStateInk` and `judgeLockedPick`, both written as difference tests for the same
    reason the killed card is.
  - `tests/studio/checks/docs.mjs` — any fence style and HTML comments stripped, a minimum
    evidence length, and a checkbox pattern that does not require an ASCII space.
  - `studio/games/overtighten/main.js` — the plate element carries the coupling it is being
    played at, which is the observation that ties the tested tuning to the running one.
  - The record: the false criterion removed, SS-028's "both are true now" corrected, SS-030
    added to the shipped table, the convergence claim in `constants.js` fixed, the changelog
    count, the test-file map, the reserved-capacity paragraph, and `self-checks.md`'s
    `docs-current` row and gap list.

- **Tested by:** the review's mutations, replayed. Eight of nine now fail:

  | Mutation | What the check says now |
  |---|---|
  | `<meta name="viewport">` deleted from both pages | *the page laid out at 980px on a 320px device — it is missing a viewport meta tag and renders zoomed out on a phone* |
  | all three bolt state treatments deleted | *a seated bolt looks exactly like a loose one: the gauge stops reporting what it is* |
  | `.pick[disabled]` emptied | *a locked plate is drawn exactly like an open one: pressing it does nothing for no visible reason* |
  | `focus: true` dropped from every `loadPlate` call | *after loading a plate, focus is not on a bolt* |
  | advance label blanked | *the "next plate" button ships with no label* |
  | `renderPicker()` removed on clear | *the picker still showed the old lock state after a plate was cleared* |
  | outcome explanation blanked | *the outcome panel gives a title and no explanation* |
  | bracket's own coupling ignored | *a plate is being played at a coupling other than its own: the tuning the tests verify is not the tuning that runs* |

  `docs-current`'s two remaining routes are closed and unit-tested: a `~~~` block and an
  HTML comment placed after the real Result no longer supply its evidence.

- **One finding declined, with the measurement.** Deleting `.bolt:focus-visible` was
  reported as leaving keyboard focus invisible. It does not: Chrome draws its own ring for
  a keyboard-focused button, measured as `auto 1px rgb(0, 95, 204)` against the realm's
  `solid 2px rgb(63, 208, 224)`. The player still sees where they are; what is lost is the
  identity, not the affordance. The rule added here requires *a* visible ring, which is the
  right bar — a check that insisted on our ring rather than any ring would be asserting a
  colour, not a capability.

- **The accounting, because the review named twelve and this replays nine.** Eleven were
  reported as passing and one was withdrawn by the reviewer. Of the eleven, nine are
  replayed above — eight now fail and one is declined with a measurement. The other two are
  **disclosed gaps rather than oversights**: inverting the mute toggle, which
  `self-checks.md` records as unobserved because no audio is, and hiding the
  all-plates-cleared ending, which the same list covers because the driver clears one
  plate. Both sit under TD-008. Nothing is deferred silently.

- **What this does not claim:** that nothing is left. The surface is not closed, and the
  four things the check does not collect are listed in `self-checks.md` and carry TD-008 so
  that something schedules them rather than only describing them.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
