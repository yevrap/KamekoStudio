# SS-021 — The guard's rotation check and the url check cover what they claim

- **Status:** Done
- **Size:** S
- **Iteration:** 01
- **Role lead:** Tech Lead / Architect
- **Depends on:** SS-019
- **Branch:** `ss-021-close-third-pass`

## Motivation

The third review pass approved the diff and left two low findings, both cases of a check
being satisfied by something other than the thing it was checking for.

## Acceptance criteria

- [x] The guard's rotation requirement is satisfied only by the real statement, not by the
      same text in a comment inside the approved block.
- [x] A protocol-relative url does not become a link.
- [x] A url whose scheme is broken by interior whitespace does not become a link.
- [x] Each is a test that fails against the previous version.

## Evidence plan

`rules.test.mjs` and `home-page.test.mjs`, each payload run against the old version first.

## Out of scope

The accepted inert arguments (`this.x`, an undefined identifier). Both throw or produce a
wrong coordinate, both are visible in a three-line diff, and telling an identifier from a
typo needs scope analysis the guard does not have.

---

## Result

- **What changed:** `allowOnlyFrontPortalRow` tests `ROTATIONS_WITH_FRONT`, the anchored
  pattern, instead of grepping the file for the rotation text — and the comment claiming
  the guard "does not depend on another check having been run" is corrected, because it
  did. `safeUrl` strips whitespace and control characters *before* reading the scheme
  rather than trimming the ends, and rejects a leading `//`.

- **Tested by:** the comment-hidden rotation marker, confirmed accepted before the fix and
  rejected after, leaving 12 positions against 9 rotations in the accepted version;
  `//evil.example/x` and `java\nscript:alert(1)`, both confirmed passing before and null
  after. 84 studio unit tests.

- **Deferred:** nothing.

- **Fix rounds used:** 0 / 2
