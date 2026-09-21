# SS-020 — Every page under `studio/` boots in a real browser, under assertion

- **Status:** Done
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

- [x] A check `studio-boot` exists, registered in `tests/studio/checks/index.mjs` and in
      the `self-checks.md` table, running at the `ticket` and `gate` stages.
- [x] It discovers pages by walking `studio/**` for `index.html`, so a page added later is
      covered without the check being edited. The detail line names how many pages it found.
- [x] Every discovered page loads with no uncaught error, no unhandled rejection, no
      `console.error` and no failed network request.
- [x] Each of the eight mutations below is demonstrated failing the check, and the
      demonstration is recorded in the Result section with the message the check printed:
      1. the `main.js` script tag removed from `studio/index.html`
      2. the shelf container removed
      3. the back link removed
      4. the `<noscript>` block removed
      5. both grid breakpoints moved
      6. every `min-height` zeroed
      7. the killed-card rule emptied
      8. the `try`/`catch` removed from the storage wrappers
- [x] The page contract is expressed as data with pure predicates in
      `tests/studio/lib/`, unit-tested without a browser, so what is asserted can be read.
- [x] Without Chrome the check reports `skip` with the reason and the binary it looked for,
      never `pass`; `--offline` skips it for the same reason the browser suites are skipped.
- [x] `docs/studio/tech-debt.md` closes TD-004 with this ticket ID, and any debt this
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

- **What changed:**
  - `tests/studio/lib/boot-contract.mjs` — the contract, as pure predicates over an
    "observation" object. Generic rules every studio page gets by being discovered, the
    realm home's own rules, and the two error classifiers.
  - `tests/studio/lib/browser.mjs` — a loopback static server and a headless Chrome, with
    production's `CHROME_PATH` convention.
  - `tests/studio/checks/boot.mjs` — the driver: discovery, three page loads per page
    (ordinary, scripting disabled, site data blocked), and the home page's fixture sweep.
  - `tests/studio/boot-contract.test.mjs` — 17 tests, no browser.
  - Registered in `checks/index.mjs`; rows added to `self-checks.md` and both READMEs.
  - `tech-debt.md`: TD-004 closed, TD-007 opened.

- **Tested by:** each of the eight mutations applied to a clean tree, `studio-boot` run,
  the message recorded, the mutation reverted. All eight fail; none is caught only as a
  side effect of another.

  | # | Mutation | What the check said |
  |---|---|---|
  | 1 | `main.js` script tag removed | *the pulse line is empty: the page did not run its own script* · *the retro line is empty* · *#shelf-region rendered nothing — not even the empty state* · *the shelf section is still hidden: main.js never revealed it* |
  | 2 | shelf container removed | *#shelf-region is missing: there is nowhere for the shelf to render* |
  | 3 | back link removed | *no back link: leaving the page is a hunt* |
  | 4 | `<noscript>` removed | *with JavaScript disabled the page says nothing: no noscript fallback rendered* |
  | 5 | both breakpoints moved (520→620, 900→1000) | *at 520px the shelf has 1 column(s), not 2* · *at 900px the shelf has 2 column(s), not 3* |
  | 6 | every `min-height: 44px` zeroed | *the back link is 25.59px tall, under the 44px floor* · *4 target(s) under 44px at 320px wide* |
  | 7 | killed-card rule emptied | *a killed card has the same background as a live one* · *…still casts the live card's shadow* · *…border is solid, the same as a live one* |
  | 8 | storage `try`/`catch` removed | *with site data blocked the page throws: uncaught: SecurityError: denied* |

  Mutation 8 was also the attack on this check's one exemption, as it stood at this
  commit. `shared/settings.js` throws the *same* `SecurityError: denied` in the same
  configuration (TD-005), and it is production code the studio may not fix, so the check
  exempted it — matching on the throwing file from the stack rather than on the message.
  **That whole approach was later removed.** Three review passes defeated three successive
  versions of it, and the check now changes the situation instead of recognising anything:
  the blocked-storage pass serves an empty script in place of production's. See
  `self-checks.md` and SS-027/SS-030.

  **Corrected after review.** This section originally claimed the exemption was
  "unit-tested both ways". It was not tested at all, and the anchoring was loose enough
  that a studio-owned `shared/settings.js` claimed it. Both independent reviews found
  this and the iteration was rejected on it. Closed by SS-024.

  Also run: `node --test tests/studio/` (101 green at this commit), `--stage=ticket` green,
  `--stage=ticket --offline` reports `studio-boot` as *not run* with the reason.

- **Deferred:** TD-007 — the static server now exists twice, once in `scripts/smoke.mjs`
  and once in `tests/studio/lib/browser.mjs`. Registered rather than fixed: `scripts/` is
  outside the path guard and exports nothing, so the alternative was a production
  exception for test plumbing, which the ticket exists to avoid.

- **Fix rounds used:** 0 / 2
