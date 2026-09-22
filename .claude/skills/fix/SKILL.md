---
name: fix
description: "Kameko Studio bug lane: log a bug as a roadmap row, or reproduce, root-cause, regression-test, fix and ship it end to end. Use whenever broken behavior is reported ('the drawer still says How to play', 'durak hangs after a transfer', 'the score shows NaN'), when asked to debug or investigate a defect, or to log a bug for later — even if the word 'bug' never appears."
---

# Fix

Bugs arrive as observed behavior rather than a spec, and *done* means the broken behavior
provably can't come back. Once the fix exists, everything else — test, document, commit,
push, verify — is the `ship` skill's phases 5–9.

**Argument:** `$ARGUMENTS` — the bug as reported.

## Mode

- **Capture** — Yevster is reporting, not asking for work now ("log this", a bug mentioned in
  passing during something else). Write the row and stop.
- **Fix** — anything else. Capture first, then fix. The default when in doubt.

## Capture

Add a row to `docs/roadmap.md` in the tier its severity puts it — **P0** broken now (crash,
lost progress, core flow blocked), **P1** wrong but has a workaround, **P2** cosmetic:

```
| <next id in the tier> | 🐞 <game>: <symptom, one line> | S | open | *Repro:* <steps, device, mode> *Expected:* <…> *Actual:* <…> *Done when:* root-caused, regression test green, repro no longer reproduces. |
```

Missing details go in as what's known, marked *needs repro*.

## Fix

### 1. Reproduce before touching code

Make the bug happen: a failing test, the game in a browser (`npx serve .`), or a trace of the
code path with the reported inputs. Say what you saw.

Walk **the exact surface the report names**. If it says "the arcade menu, where you enable and
disable items", open that drawer, not the in-game menu that looks similar. A "not
reproducible" verdict is only as good as what was actually opened.

Can't reproduce → don't guess-fix. Check it isn't already fixed on `main`, write what was
tried on the row, add instrumentation if it would help next time, and report.

### 2. Root cause, not symptom

Ask why the code allows the bad state, not where a check would hide it. Then grep for the same
pattern elsewhere — one bug is often one instance of a class. Fix or log the siblings.

### 3. Prove it

A test that fails because of the bug, written before or alongside the fix, at whatever level
reaches it: `tests/` for pure logic, `scripts/e2e.mjs` for flows. Where no harness reaches the
surface (canvas rendering, feel), write the manual repro check on the row so *Done when*
stays verifiable.

### 4. Smallest safe fix

The smallest diff that fixes the root cause. Cleanups noticed along the way go into
`docs/games/<slug>/ideas.md`, not into this diff.

### 5. Ship

`ship` phases 5–9. Commit as `fix: <symptom> — <root cause>`. Close the row with the date and
a **one-line root cause** — that line is how past bugs teach future sessions.

If the correct behavior turns out to be an open product decision, don't decide it silently:
fix any crash-level symptom now, write the options into `docs/questionnaires/`, and report.

## Autonomy

A reproducible bug with clear correct behavior is fixed and shipped end to end without
pausing. The stop conditions are `ship`'s.
