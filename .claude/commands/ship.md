# /ship — Autonomous Ship Workflow

End-to-end autonomous workflow: pick a roadmap item, implement it, test it, commit it, and push it to production (GitHub Pages).

**Argument:** `$ARGUMENTS` — optional roadmap item ID (e.g. `p0-01`) or short description. If omitted, pick the highest-priority open item from `docs/roadmap.md` (P0 first, then P1, etc.).

---

## Phase 1 — Select target

1. Read `docs/roadmap.md`.
2. If `$ARGUMENTS` provided: find the matching item. If ambiguous, ask to confirm.
3. If no argument: select the highest-priority open item. State your selection and why (one sentence).

## Phase 2 — Research

Read every file relevant to the selected item. This includes:
- The target game's files (all modules)
- `CLAUDE.md` for conventions and patterns
- `tests/` for existing test structure
- Any design docs in `docs/` that apply

Do not skip this step. Surprises mid-implementation are expensive.

## Phase 3 — Plan

Write a plan: what changes, which files, in what order. Max 7 bullet points. Flag any risk or irreversible action.

**Present the plan and wait for explicit approval before writing any code.**

Reply options the user can give:
- "Go" / "Proceed" / "Yes" → execute
- Any other text → treat as feedback, revise plan, re-present

## Phase 4 — Implement

Execute the plan. Follow CLAUDE.md conventions strictly:
- Vanilla JS, no frameworks, no build step
- ES modules for games (`type="module"`)
- Mobile-first, pointer events, 44px tap targets
- No comments unless WHY is non-obvious
- No backwards-compat hacks; delete unused code
- Local testing requires HTTP: `npx serve .` from project root

For UI changes: start `npx serve .` and verify the golden path manually in a browser before proceeding. Document what you tested.

## Phase 5 — Test

Run the test suite:
```
node --test tests/
```

All tests must pass. If any fail:
1. Diagnose the failure.
2. Fix it.
3. Re-run tests.
4. Do not proceed to commit if tests are still failing.

Note: browser-side UI logic is not unit-tested. For UI changes, manual verification in Phase 4 substitutes.

## Phase 6 — Commit

Stage only the files changed for this item. Commit with a clear message:
```
git add <specific files>
git commit -m "<type>: <short description>

<one paragraph body if the change is non-trivial>"
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

## Phase 7 — Push

```
git push origin main
```

GitHub Pages deploys automatically on push to main. Deployment typically takes 30–90 seconds.

## Phase 8 — Mark complete

Update `docs/roadmap.md`: change the item's status from `open` to `✅` and add today's date in the Notes column. Commit this update:
```
git add docs/roadmap.md
git commit -m "chore: mark <item-id> complete in roadmap"
git push origin main
```

## Phase 9 — Report

Summarize in 3-5 sentences:
- What was built
- What files changed
- What was tested and how
- The live URL where it can be verified: https://yevrap.github.io/KamekoStudio/

---

## Safety rules

- Never push if tests fail.
- Never use `--no-verify` or `--force`.
- Never delete files without first confirming they are truly unused (grep for imports/references).
- If anything unexpected is found mid-implementation (e.g. a file is much larger than expected, a dependency is unclear), pause and report to the user before continuing.
