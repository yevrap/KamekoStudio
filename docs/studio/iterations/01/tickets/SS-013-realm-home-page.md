# SS-013 — The realm's home page: a pulse line, a shelf built from data, and a way back out

- **Status:** Done
- **Size:** M
- **Iteration:** 01
- **Role lead:** Front-end / Gameplay Dev
- **Depends on:** SS-012
- **Branch:** `ss-013-realm-home-page`

## Motivation

The realm's page is a placeholder that explains itself in prose. The approved design
replaces it with a single page that shows the company's pulse, a shelf of work with a
status tag on each item, and a persistent way back to the arcade.

## Acceptance criteria

- [ ] A data module is the only place a shelf entry is declared: adding an item is one
      entry, and the page adds no markup for it.
- [ ] Each entry renders a card with a status tag, a title, one sentence, the iteration it
      arrived in, and the date it last changed. The tag is one of PROTOTYPE, ITERATING,
      KILLED, PROMOTED, and an unknown status is rendered as a visible fallback rather than
      crashing the page or being dropped silently.
- [ ] A KILLED entry renders dimmed and is not a link; it stays on the shelf.
- [ ] The shelf with no entries renders an honest empty state saying there is nothing on it
      yet — no invented items ship.
- [ ] The grid is one column below 520px, two below 900px, three above.
- [ ] A pulse line at the top names the current iteration and what it did, in one sentence,
      from the same data module.
- [ ] The pulse line's iteration number matches the newest iteration in the repository,
      and a test fails if it does not. *(Refined during the build: the check is against the
      newest `docs/studio/iterations/NN/` directory, not the changelog. The changelog entry
      for an iteration is written at the end of it, so a changelog comparison would have
      failed for the whole of every iteration — it would have measured how far through the
      iteration the team was, not whether the page was current. The changelog is still
      checked, in the weaker direction that actually holds: it may never be ahead of the
      page.)*
- [ ] Back to the arcade is a persistent link in the realm's own chrome, top-left, with a
      44px minimum target, present on the page without scrolling.
- [ ] The page loads with no uncaught console errors, including with site data blocked.
- [ ] Every storage key the page's own code touches still carries the `studio_` prefix, and
      `studio/README.md`'s key table still matches the code.

## Evidence plan

- Unit tests in `tests/studio/` for the card renderer (each status, the unknown status, the
  empty shelf) and for the pulse-to-changelog agreement.
- `npm run studio:check -- --stage=ticket` green.
- The page loaded at 360px, 800px and 1280px, in both themes, with the console open and
  with site data blocked; what was seen recorded on the ticket.

## Out of scope

- Any actual game on the shelf. The realm has none yet; the empty state is the honest
  result and is what ships.
- Sub-navigation, a second page, or a per-item detail view.
- The entrance from the 3D landing page — the realm's own portal is held by decision
  (TD-001).

---

## Result

- **What changed:** `studio/index.html` rebuilt to the approved layout — persistent chrome
  with the way back, the pulse line, the shelf, the retro line, the handbook link, and a
  `<noscript>` fallback pointing at the handbook. Two new files carry it:
  `studio/shelf-data.js`, the only place an entry, the pulse or the retro line is declared,
  and `studio/shelf.js`, pure data-to-markup functions with no DOM. `studio/main.js` keeps
  the visit logbook and is now the only file that touches the document; the visit line
  moved from a card to a footnote. `studio/style.css` gained the chrome, pulse, shelf grid,
  card, empty-state and tag rules. `studio/README.md` documents the new files and the tag
  vocabulary. The old `tests/studio/placeholder-page.test.mjs` is renamed
  `home-page.test.mjs`.

- **Tested by:**
  - 47 unit tests in `tests/studio/`, 18 of them new: each declared status; an unrecognised
    status rendered rather than dropped; a missing status; case-insensitive matching; a
    KILLED entry refusing to become a link *even though its data carries a url*; linked and
    unlinked cards; the iteration and changed-date line; the empty shelf; a shelf that is
    `undefined`, `null`, a string or a number; a populated shelf; HTML escaping of a
    `<script>` title; date passthrough for `2026-13-01` and `soon`; the pulse line.
  - `tests/studio/pulse-current.test.mjs`, and it was proved to bite: setting the pulse to
    iteration 00 fails with *"the home page says iteration 00, the repository's newest is
    01"*. Restored and green.
  - Headless Chrome at 360px, 760px and 1280px in both themes: no uncaught errors, no
    console errors, no horizontal overflow, nothing below a 44px target.
  - The grid measured through `getComputedStyle`, with five sample entries injected at
    runtime rather than shipped: 1 column at 360px, 2 at 760px, 3 at 1280px, in both
    themes. All five treatments were looked at — the KILLED card recessed and unlinked, the
    unknown status outlined in the worklight colour.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2 — the standalone "How it works" link rendered 18px tall,
  below the realm's own 44px floor. Caught by the automated target sweep, not by eye; fixed
  with the same treatment the footer links already carry.
