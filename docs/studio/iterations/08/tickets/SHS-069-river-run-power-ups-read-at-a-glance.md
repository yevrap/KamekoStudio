# SHS-069 — River Run fork: a far-off pickup is easy to spot, and the power-up label keeps one height

- **Status:** Ready
- **Size:** M
- **Iteration:** 08
- **Role lead:** Frontend Developer (UX / Art Direction reviews)
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

Two notes from the Playtester on the fork's power-ups, one pass on how they read: a pickup
at its spawn distance is only a few pixels on a small phone, too late to steer for (the
Iterate on [SHS-060](../../06/tickets/SHS-060-river-run-power-ups.md), backlog #42), and the
power-up label is 28 px tall with the shield's emoji and 23 px with the spread shot alone,
so it jumps as power-ups come and go (the Keep on
[SHS-064](../../07/tickets/SHS-064-river-run-power-up-hud-real-time.md), backlog #44).

## Acceptance criteria

- [ ] At 390×780 and 320×640, a pickup at its spawn distance covers at least 12 px on
      screen (its projected size today is a few), by drawing it larger or with a glow while
      it is far off; it still reads as cyan (shield) or pink (spread).
- [ ] The boat's pickup box is unchanged: taking a pickup needs the same contact as before.
- [ ] At 390×780 and 320×640 the power-up label's height is the same (±1 px) with the shield
      only, the spread shot only, and both.
- [ ] The fork's recorded edit list names both changes, and the existing fork subtests
      (storage, power-ups, restarts, layout) stay green.

## Evidence plan

`tests/studio/river-run-fork.test.mjs`: a new subtest measures a fresh pickup's projected
size in pixels at spawn at both widths (red first against today's pickup); the layout
subtest asserts the label's height across the three states at both widths (red first
against today's label). Screenshots at 320 and 390, read back once.

## Out of scope

The spread shot's own shots (#45), Watch Mode steering for pickups (#25), how often
pickups come or how strong they are, the frame-counted river (#46). If the session can't
hold both halves, the far-off pickup lands first and the label goes back to the backlog as
#44.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
