# SS-018 — The new portals do not silence the trophy shelf, and the capacity rule counts entries

- **Status:** Done
- **Size:** M
- **Iteration:** 01
- **Role lead:** Tech Lead / Architect
- **Depends on:** SS-014
- **Branch:** `ss-018-trophy-masking`

## Motivation

An independent QA pass found that the front-wall row this iteration added **broke the
trophy shelf**: standing at a trophy showed a portal's prompt instead of the trophy's
description, for 4 of 5 trophies. It also fooled `portal-capacity` five ways into reporting
a full room while the landing page would still drop games — the same defect the check was
written to prevent.

## Acceptance criteria

- [x] With 2, 3 and 5 achievements earned, every trophy shows its own description when the
      player stands at it.
- [x] All eleven games are still reachable and still show their own prompt.
- [x] The reserved twelfth slot's effect on the middle trophy is recorded, so whoever fills
      it decides knowingly.
- [x] `portal-capacity` counts an entry written `{ url, name, color }`.
- [x] `portal-capacity` reports a positions table truncated as it is built, shortened
      afterwards, or holding anything but spreads.
- [x] A commented-out position is not counted as a slot.
- [x] Each of the above is a test that fails against the previous rule.

## Evidence plan

The running landing page with achievements seeded at three counts; `rules.test.mjs` for the
capacity attacks; `npm run studio:check` at the ticket and gate stages.

## Out of scope

**Changing how the landing page chooses a prompt.** `updatePlayer` prefers a portal to a
trophy at any range, which is why proximity alone decides this. That is production logic
outside the recorded exception, and changing it needs its own approval. This ticket routes
around it by placing the portals where the conflict does not arise. Raised as TD-006.

---

## Result

- **What changed:** the front row's outer two positions moved from `±roomWidth/4` (x ±4.5,
  directly above the trophy shelf) to `±(roomWidth/2 - 2)` (x ±7, flanking it, clear of the
  shelf's 10-unit span). Height and depth are unchanged. `portalCapacity` now strips
  comments before counting, counts game entries as brace-balanced objects rather than
  occurrences of `name:`, requires the positions table to be a plain array of spreads
  ending in `];`, and reports a table shortened after it is built.

- **The regression, measured before and after.** The prompt is chosen by 2D distance and a
  portal beats a trophy at any range, so a portal within 3.0 of where a player stands to
  read a trophy replaces its description. Standing at each trophy in turn:

  | Achievements earned | Trophies masked, before | After |
  |---|---|---|
  | 2 | 2 of 2 | 0 of 2 |
  | 3 | 2 of 3 | 0 of 3 |
  | 5 | 4 of 5 | 0 of 5 |

  Before, standing at the Blob Zapper trophy read *"Press E to enter Black Hole in One"*.
  The nearest a player now gets to one of these portals while reading a trophy is 3.68,
  against an interaction distance of 3.0.

- **Tested by:** the three achievement counts above, on the running page; all 11 portals
  still show their own prompt; 75 studio unit tests, including four capacity attacks each
  confirmed to pass against the old rule and fail against the new one; `--stage=ticket`
  green with the exception still reported as *used*.

- **Deferred:** TD-006 — the landing page's prompt priority. The reserved centre slot still
  sits within interaction range of the middle trophy, so filling it will mask that one
  until the priority is changed. Recorded on TD-001 and in the source comment.

- **Fix rounds used:** 1 / 2 — the first capacity test for the comment case commented a
  position *out* while leaving the real one in place, so the count was unchanged either way
  and the test proved nothing. Rewritten to remove two real positions.
