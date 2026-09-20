# SS-020 — Every page under `studio/` boots in a real browser, under assertion

- **Status:** Ready
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** none
- **Branch:** `ss-020-studio-boot-coverage`

## Motivation

`scripts/smoke.mjs` discovers pages under `games/` and `drafts/` only, so `studio/` is in
no boot suite and `studio/index.html` and `studio/style.css` have no automated coverage at
all (TD-004). An independent QA pass in iteration 01 named **eight mutations the entire
repository suite survives**. `scripts/` is outside the path guard, so the fix is a
studio-owned check rather than a second production exception.

## Acceptance criteria

- [ ] A check `studio-boot` exists, registered in `tests/studio/checks/index.mjs` and in
      the `self-checks.md` table, running at the `ticket` and `gate` stages.
- [ ] It discovers pages by walking `studio/**` for `index.html`, so a page added later is
      covered without the check being edited. The detail line names how many pages it found.
- [ ] Every discovered page loads with no uncaught error, no unhandled rejection, no
      `console.error` and no failed network request.
- [ ] Each of the eight mutations below is demonstrated failing the check, and the
      demonstration is recorded in the Result section with the message the check printed:
      1. the `main.js` script tag removed from `studio/index.html`
      2. the shelf container removed
      3. the back link removed
      4. the `<noscript>` block removed
      5. both grid breakpoints moved
      6. every `min-height` zeroed
      7. the killed-card rule emptied
      8. the `try`/`catch` removed from the storage wrappers
- [ ] The page contract is expressed as data with pure predicates in
      `tests/studio/lib/`, unit-tested without a browser, so what is asserted can be read.
- [ ] Without Chrome the check reports `skip` with the reason and the binary it looked for,
      never `pass`; `--offline` skips it for the same reason the browser suites are skipped.
- [ ] `docs/studio/tech-debt.md` closes TD-004 with this ticket ID, and any debt this
      ticket *takes* is opened in the same edit.

## Evidence plan

| Criterion | Proof |
|---|---|
| The check exists and is wired | `npm run studio:check -- --list` shows it under `ticket` and `gate` |
| Pages are discovered, not listed | The detail line's page count, plus the count rising when SS-022 lands |
| The eight mutations | Each applied to a working tree, `npm run studio:check -- --stage=ticket` run, the failure message pasted into the Result section, the mutation reverted |
| The contract is readable and tested | `node --test tests/studio/` covers the predicates with no browser |
| Honest skip | `npm run studio:check -- --stage=ticket --offline` reports `not run` with a reason |

## Out of scope

- **Editing `scripts/smoke.mjs`** or any production discovery list. That is the exception
  this ticket exists to avoid.
- **Screenshots or visual regression.** This proves a page boots and holds its contract,
  not that it looks right.
- **Production pages.** `full-suites` already covers those and this check does not duplicate it.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
