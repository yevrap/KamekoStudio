# SHS-069 — River Run fork: a far-off pickup is easy to spot, and the power-up label keeps one height

- **Status:** Done
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

- [x] At 390×780 and 320×640, a pickup at its spawn distance covers at least 12 px on
      screen (its projected size today is a few), by drawing it larger or with a glow while
      it is far off; it still reads as cyan (shield) or pink (spread).
- [x] The boat's pickup box is unchanged: taking a pickup needs the same contact as before.
- [x] At 390×780 and 320×640 the power-up label's height is the same (±1 px) with the shield
      only, the spread shot only, and both.
- [x] The fork's recorded edit list names both changes, and the existing fork subtests
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

- **What changed:** (`9c00a38`) A pickup now wears a glow of its own colour: a soft sprite,
  a separate scene object (never the mesh's child), sized each update to about 26 px on
  screen, full at 30 units from the camera and beyond and gone by 18, where the pickup reads
  on its own. At spawn it measured 8×8 px (320) and 9×10 px (390) before; now each type
  covers at least 12 px and its brightest quarter is within 30° of its hue. The pickup box is
  still `Box3.setFromObject(mesh)`, the mesh alone. The power-up label has a set
  `line-height`/`height` of 16 px: it was 28 px with the shield's emoji and 23 px without,
  now 26 px in all three states at both widths. Both changes are recorded in the fork's
  section of `studio/README.md` (the fork's record of how it differs, since [SHS-060](../../06/tickets/SHS-060-river-run-power-ups.md) retired
  the byte-for-byte edit list) and in comments tagged SHS-069 in the file.
- **Tested by:** `tests/studio/river-run-fork.test.mjs` section 6, red first against the old
  fork (8.0×8.0 and 9.0×10.0 px; label 28/23/28 px), then green: the pickup is measured by
  rendering the frame with and without what `spawnPowerUp()` added and bounding the pixels
  that differ; the label's height across shield / spread / both at 390×780 and 320×640; a
  pickup passing 0.3 units clear of the boat's box, inside its glow, is not taken, and one
  on the boat still is. `--stage=ticket` 5/5 (studio-tests with every existing fork subtest
  green). Screenshots at 390 and 320, read once: the pink pickup reads as a glowing dot at
  the far end of the river, the label on one line.
- **Deferred:** nothing. The pickup's drift is still counted in frames (#46, out of scope).
- **Fix rounds used:** 0 / 2 (one local amend: the first commit's subject was 84
  characters, over `commit-lint`'s 80, caught at `--stage=push` before anything was pushed)
