# SS-025 — Overtighten survives a second input, and never loses the player

- **Status:** Done
- **Size:** S
- **Iteration:** 02
- **Role lead:** Front-end / Gameplay Dev
- **Depends on:** SS-022
- **Branch:** `ss-025-input-and-focus`

## Motivation

Opened by the QA pass and the independent review. Seven defects in `main.js`, all in the
paths the author did not walk: a second input, a pointer followed by a keyboard, a plate
chosen from the picker on a phone, and a screen reader.

## Acceptance criteria

- [x] A bolt is held by a **set** of causes — pointer ids and keys — and the turn ends only
      when the last one lets go. Tapping Enter while Space is down does not stop the turn;
      lifting a second finger does not stop the first.
- [x] Starting a hold on a different bolt releases the previous one, so no bolt is left
      drawn as turning with nothing holding it.
- [x] `pointerdown` focuses the bolt, so the keyboard still works after a pointer is used.
- [x] `setPointerCapture` is guarded against the exception it is specified to throw.
- [x] Choosing a plate from the picker brings the bench on screen and puts focus on a bolt.
- [x] Advancing to the next plate leaves focus on a bolt, not on `<body>`.
- [x] The status line is assigned only when its text changes.

## Evidence plan

Each defect reproduced by QA's own steps against the fix, in a real browser.

## Out of scope

- **Turning two bolts at once.** One bolt turns at a time, deliberately — see the Result.
- The design hypothesis (SS-026) and the check's blind spots (SS-024).

---

## Result

- **What changed:** `studio/games/overtighten/main.js` only. `session.heldBy` became
  `session.causes`, a Set; `hold()` releases the previous bolt before taking a new one and
  joins rather than replaces on the same one; `release(cause)` removes one cause and stops
  only when none is left; `pointerdown` focuses and guards the capture; `loadPlate()` takes
  `{ scroll, focus }` and a new `showBench()` applies them; `paint()` assigns the status
  line only on change.

- **Tested by:** reproducing each of QA's steps against the fix, in a real browser:

  | Defect | Before | After |
  |---|---|---|
  | Enter tapped while Space held | the turn stopped with Space still down | still turning |
  | A second input leaves a bolt lit | `bolt is-turning is-loose` forever | `bolt is-loose` |
  | Pointer click then keyboard | `activeElement` was `BODY`, holding a key did nothing | focus on the bolt, the key turns it |
  | Picker at 320×568 | 0 of 5 bolts on screen | 5 of 5, focus on a bolt |
  | Advancing a plate | focus dropped to `BODY` | focus on a bolt |
  | `aria-live` during a 1s hold | 62 mutations, 61 identical | 0 |

  `npm test` 637 green; `--stage=ticket` 5/5.

- **One finding answered rather than fixed, with the reason:** QA also observed that lifting
  a second finger does not *resume* the first bolt. It should not. One bolt turns at a time
  — turning two at once would change the coupling puzzle into a different game — so a second
  input takes the turn over rather than queueing behind it. What was a defect was the state
  it left behind, and that is fixed: nothing is left marked as turning, and the next input
  behaves normally. Recorded here rather than silently declined.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
