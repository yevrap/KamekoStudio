# SS-024 — The boot check's exemption is anchored, and its blind spots are closed

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-020
- **Branch:** `ss-024-boot-check-blind-spots`

## Motivation

Opened by the independent review and the QA pass, which **rejected the iteration**. Both
found the same primary defect independently: `studio-boot`'s one exemption was unanchored,
so a studio-owned `shared/settings.js` — a file the studio may create anywhere under
`studio/**` — claimed production's exemption and threw uncaught while the check printed
`pass`. Both also found mutations to `studio/**` that break something a player would notice
and that the check survived.

## Acceptance criteria

- [x] The exemption is anchored to the page's **origin and exact path**, and fails closed on
      a missing origin, an unparseable frame, or any other file.
- [x] `firstFrame` returns the first frame that names a URL, scanned in order — not the
      first parenthesised one found anywhere in the stack.
- [x] All five classifiers are unit-tested, including every bypass the reviews built. This
      is the criterion SS-020 claimed and did not meet.
- [x] A control that is laid out but invisible **fails** the contract instead of being
      excluded from it. A control that is `display: none` or `[hidden]` is still not a
      failure: the page is choosing not to offer it.
- [x] The driven game phase collects errors.
- [x] The **pointer** release is asserted by re-reading after a settle, not immediately.
- [x] Progress is proved to survive a **reload**, not merely to be written.
- [x] The killed-card rule asserts the named treatment absolutely as well as by difference.
- [x] `serve()` compares at the path boundary, not by prefix.
- [x] Every bypass from both reviews is demonstrated failing, and the original eight
      mutations still fail.

## Evidence plan

Each bypass re-applied to a clean tree, `studio-boot` run, the message recorded, reverted.

## Out of scope

- The design hypothesis. That is SS-026.
- The game's own input defects. Those are SS-025.

---

## Result

- **What changed:**
  - `tests/studio/lib/boot-contract.mjs` — `sourceUrl` (new), `firstFrame` rewritten to scan
    in order, `isInheritedSettingsThrow` anchored to origin + `INHERITED_SETTINGS` and
    failing closed, `isBrowserInitiated` matching the URL path rather than any text.
    Hidden-but-laid-out controls fail. Killed-card treatment asserted absolutely and by
    difference. Four new game rules: errors, plate visibility, gauge liveness, pointer
    release, persistence.
  - `tests/studio/checks/boot.mjs` — visibility measured with `checkVisibility` so an
    `opacity: 0` **ancestor** counts; the origin passed to the exemption; `observeOvertighten`
    collects errors, re-reads after the pointer release, and proves persistence by winning
    the first plate through the page's own input and reloading.
  - `tests/studio/lib/browser.mjs` — path-boundary comparison in `serve()`.
  - `tests/studio/boot-contract.test.mjs` — 35 tests, up from 21; ten of them on the
    classifiers, which had none.

- **Tested by:** every bypass both reviews demonstrated, replayed against the hardened
  check. All five now fail:

  | Bypass | What the check says now |
  |---|---|
  | studio-owned `shared/settings.js` throwing uncaught | *with site data blocked the page throws: uncaught: SecurityError: denied* |
  | pointer release listeners deleted — every tap strips the plate | *the bolt kept turning after the pointer was released: every tap runs the bolt to its strip point* |
  | `write()` made a no-op — nothing persists | *clearing a plate did not survive a reload: the game has no persistence* |
  | the whole plate hidden with `opacity: 0` | *2 control(s) take up space but cannot be seen · the plate takes up space but cannot be seen* |
  | killed card made visually identical to a live one | *a killed card still casts a shadow … a killed card's border is double, not dashed* |

  The original eight all still fail. `npm test` 637 green (was 623).

- **The correction worth recording:** SS-020's Result said the exemption was "unit-tested
  both ways". It was not tested at all, and the amendment this iteration made to
  `self-checks.md` — that a decision kept out of driver code can be attacked — was true of
  where the code sat and false of whether anyone had attacked it. Iteration 01's lesson was
  *do not write "closed" before the thing that closes it has been attacked*. It was written
  down and then not applied, one iteration later, to the same kind of object.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
