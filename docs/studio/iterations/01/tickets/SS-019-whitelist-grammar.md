# SS-019 — The exception's whitelist is a grammar, and the shelf survives having something on it

- **Status:** Done
- **Size:** M
- **Iteration:** 01
- **Role lead:** Tech Lead / Architect
- **Depends on:** SS-016, SS-018
- **Branch:** `ss-019-whitelist-grammar`

## Motivation

A second independent review rejected the diff again. SS-016 replaced "no parentheses" with
a character class, and a character class cannot express a token grammar: `delete
engineState.walls`, `new fetch`, `typeof window` and `obj.prop++` are all word characters,
dots and operators. Deleting `engineState.walls` blanks the production landing page while
the guard prints *exception used*. The same review, and the QA pass, also found the
whitelist's regression tests were all written against the **previous** rule — so nothing in
the suite attacked the rule actually in force. QA separately found the realm page ships
broken the moment a shelf entry exists.

## Acceptance criteria

- [x] An argument is operands joined by operators, expressed as a grammar rather than a
      character class, and two adjacent operands are rejected.
- [x] Every payload is tested **against the rule in force**, not against the one it replaced.
- [x] The approved row cannot be relocated to another point in the file.
- [x] A position row with no matching rotation entry is rejected by the guard itself, not
      only by `portal-capacity`.
- [x] Every argument the shipped edit uses is still accepted.
- [x] A shelf card's link meets the realm's 44px floor.
- [x] A long unbreakable title or status does not push the page wider than the viewport
      at 320px.
- [x] A shelf url that is not a link to a page does not become one.
- [x] The visit counter cannot render a number outside the safe integer range.
- [x] The no-JS page does not show empty headings.
- [x] No acceptance criterion in this iteration asserts something the repository disproves.

## Evidence plan

`rules.test.mjs` against the current rule; the browser at 320/360/760/1280 with a
**populated** shelf; the page with `localStorage` throwing; `npm test`.

## Out of scope

`updatePlayer`'s prompt priority (TD-006) and `shared/settings.js`'s throw (TD-005), both
production-side. `scripts/smoke.mjs` not covering `studio/` (TD-004) — raised again by QA
and carried to iteration 02 as SS-020.

---

## Result

- **What changed:** `ARG` in `tests/studio/lib/rules.mjs` became
  `-?\s*OPERAND(?:\s*[-+*/]\s*-?\s*OPERAND)*`, where an `OPERAND` is a number or a property
  path. Forbidding two adjacent operands is what rejects `new X`, `delete a.b`, `typeof x`
  and `void x` in one stroke; requiring an operand after every operator rejects `x++` and
  `--x`. `FRONT_ROW_BLOCK` gained a lookahead tying it to the statement it precedes, so the
  row cannot be relocated. `allowOnlyFrontPortalRow` now requires the matching rotation
  entry itself.

  On the page: `.item h3 a` carries the 44px floor; `overflow-wrap: anywhere` and
  `min-width: 0` on the card and its parts; `safeUrl()` in `shelf.js` rejects any scheme
  that is not `http(s)` before a url becomes an `href`; the visit count is coerced after
  the increment as well as before it; the shelf and retro sections are `hidden` until
  `main.js` fills them, so the no-JS page shows its explanation instead of two empty
  headings.

- **Tested by:**
  - Twelve payloads run against the live rule **before** the change: all twelve accepted.
    After: the nine that act are rejected, and the three that remain — `this.x`,
    `import.meta.url.length`, `roomDepth/2 - 2.0 + 0` — are inert reads and arithmetic that
    can only change a coordinate. Kept as tests written against this rule.
  - The approved row relocated verbatim: rejected. Rotations omitted: rejected with
    *"the front-wall row has no matching rotation entry"*. Every argument form the shipped
    edit uses: still accepted.
  - The browser with **six entries on the shelf**, including a 50-character unbreakable
    title, at 320, 360, 760 and 1280px in both themes: 1/1/2/3 columns, no horizontal
    overflow at any width, nothing below 44px. The previous run verified these against the
    *empty* shelf — the one configuration in which they cannot fail.
  - With `localStorage` throwing: the pulse, shelf, retro line and back link all render and
    the visit line hides itself; the only uncaught error is production's (TD-005).
  - 82 studio unit tests, 548 across the repository.

- **Deferred:** TD-004 — `studio/` has no page-boot coverage in any suite, so `index.html`
  and `style.css` are asserted only by a human having looked. QA demonstrated eight
  mutations that survive the whole suite. `scripts/smoke.mjs` is outside the path guard;
  carried to iteration 02 as SS-020, which will add a studio-owned boot check.

- **Fix rounds used:** 1 / 2 — the relocation test first drove the synthetic fixture with a
  function name only the real file has, so it removed the block instead of moving it and
  proved nothing.
