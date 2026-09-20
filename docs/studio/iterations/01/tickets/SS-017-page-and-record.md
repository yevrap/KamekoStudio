# SS-017 — The realm page and the iteration's record say what is true

- **Status:** Done
- **Size:** S
- **Iteration:** 01
- **Role lead:** Technical Writer
- **Depends on:** SS-013
- **Branch:** `ss-017-page-and-record`

## Motivation

The independent review found the realm page carrying about fifty lines of CSS for elements
that no longer exist, shipping with no top-level heading, and leaving its one free-text
line unguarded against going stale — and found the iteration's own record overstating two
test counts and marking tickets Done with every criterion unticked.

## Acceptance criteria

- [x] No CSS rule targets an element or class that no page in `studio/` renders.
- [x] The page has exactly one `h1`, and it names the realm.
- [x] The retro line carries the iteration it came from, and a test fails when a newer
      iteration writes a retro without it being updated.
- [x] Every test and file count in the iteration's tickets matches the repository.
- [x] Every acceptance criterion on a ticket marked Done is ticked, with its evidence in
      the ticket's Result.

## Evidence plan

A selector sweep of `style.css` against the rendered markup, the browser check at three
widths in both themes, `node --test tests/studio/`, and `--stage=gate` for `docs-current`.

## Out of scope

Redesigning the page's visual hierarchy. The heading outline is fixed; the decision that
the pulse line is the page's dominant text stands.

---

## Result

- **What changed:** Removed `.eyebrow`, `.lede`, `.pill` and its two states, the generic
  `h1`, `hr`, `ul`/`li`, `code` and `.card + .card` from `studio/style.css` — every one
  served markup that SS-013 deleted, and `hr` had never had any markup at all. The wordmark
  in `studio/index.html` became the page's `h1`. `LEARNED` in `studio/shelf-data.js` became
  `{ iteration, line }` and gained the same staleness guard `PULSE` has, tied to the newest
  iteration that has actually written a `retro.md`. Two counts corrected: SS-013 claimed 18
  new tests where the suite went 31 → 47, so 16; SS-014 claimed 13 new tests in
  `rules.test.mjs` where the diff adds 12. All three build tickets' criteria are ticked.

- **Tested by:** a selector sweep reports no unused class selector remains and `<h1>` is
  present; headless Chrome at 360px, 760px and 1280px in both themes — no console errors,
  no overflow, nothing under 44px; 70 studio unit tests green.

- **Deferred:** nothing.

- **Fix rounds used:** 0 / 2
