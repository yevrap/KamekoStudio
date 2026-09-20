# Iteration 00 — review

**Goal:** stand up the team, the paper trail and the self-checks, and put a placeholder
page live — no games.
**Live:** https://yevrap.github.io/KamekoStudio/studio/
**Base ref for all checks:** `697385f` (no previous iteration tag exists; see `plan.md`).

## Demo

1. **The handbook** — `docs/studio/README.md`, and from it the process, the two
   definitions, the guardrails and the twelve roles. Read as a stranger would.
2. **The checks, running** — `npm run studio:check -- --list`, then
   `npm run studio:check -- --stage=gate --base=697385f`. Every check prints pass, fail or
   *not run* with a reason.
3. **The checks, catching things** — see the table below. This is the real demo of the
   iteration: not that the checks exist, but that they fail when they should.
4. **The placeholder page** — the live URL above, at phone width, in both themes.
5. **The findings note** — `iterations/00/findings-3d.md`, and the two diffs it proposes
   without applying.

## Verdicts — Yev's call

Answer by editing the bracket. Blank takes the safest reading, and the next run says which.

| Item | What it does | Your verdict |
|---|---|---|
| SS-001 — the handbook | 15 process documents + 4 ADRs + templates, in the public repo | [ Keep / Iterate / Kill ] |
| SS-002 — twelve roles | One file per lens; two run with fresh context | [ Keep / Iterate / Kill ] |
| SS-003/010 — `studio:check` | 18 checks, 5 stages, hardened after review | [ Keep / Iterate / Kill ] |
| SS-004/011 — the placeholder page | Live, themed, honest that there is nothing to play | [ Keep / Iterate / Kill ] |
| SS-005 — the 3D findings | Two unapplied diffs, one of them a production bug fix | [ Keep / Iterate / Kill ] |
| SS-006/007 — the vault views and design brief | Board, scorecard, ledger, three identity directions | [ Keep / Iterate / Kill ] |
| SS-008 — the three skills | "run a studio iteration", "studio status", "promote X" | [ Keep / Iterate / Kill ] |

## Checks

Run at `--base=697385f`, with the full suites.

| Check | Result |
|---|---|
| `tree-clean` | pass |
| `on-main` | pass — on `main`, ahead of origin by the iteration's commits |
| `no-stop-file` | pass |
| `baseline-suites` | pass — 466 unit, 13 smoke pages, 23 e2e, before the studio touched anything |
| `path-guard` | pass — everything inside the three studio paths, plus the recorded `package.json` exception, reported as used |
| `storage-keys` | pass |
| `studio-tests` | pass |
| `hygiene` | pass |
| `full-suites` | pass — 497 unit tests, smoke and e2e green |
| `commit-lint` | pass |
| `docs-current` | pass — 11 tickets |
| `reviewer-verdict` | pass |
| `studio-live` | see the handoff — run after the deploy |
| `production-live` | see the handoff — run after the deploy |
| `production-unchanged` | not run — no previous iteration tag to compare against, which is correct for iteration 00 |
| `iteration-docs` | pass |
| `doc-cleanliness` | pass — run over the vault documents as well, via `--docs-root` |
| `changelog` | pass |

### What the checks caught while being built

The point of the iteration, so it is recorded rather than summarised: a `git` binary Node
could not spawn (`EBADARCH`), a porcelain off-by-one that shifted every path by one
character, the comma churn a JSON insert creates, an unverifiable indirect storage key in
the page, six self-referential hygiene hits in the documents that quote the rules, and a
missing iteration-document set.

## Not done

Nothing committed was dropped. Two things are deliberately unbuilt: the realm's visual
identity, which is Yev's decision (`Shadow Studio — Realm Design Brief` in the vault), and
the 3D portal, which is outside the path guard and needs approval.

## Independent review

QA and the Independent Reviewer each ran as a separate agent with fresh context, given the
diff and the tickets and nothing else. They reported independently and agreed on the two
most serious findings.

**Findings, and what was done about each:**

| # | Finding | Response |
|---|---|---|
| 1 | The `package.json` exception read diff text, which is empty once a change is committed — so any committed change to that file passed while the check printed "exception used". Both reviewers found this independently. | Fixed in SS-010: the rule now compares the parsed file between the base revision and now, and checks the script's value as strictly as its key. Regression tests for a dependency, an extra script, a removed script, a rewritten script, and a hijacked value. |
| 2 | `git diff --name-only` prints only a rename's destination, so `git mv games/durak/main.js studio/stolen.js` would delete a production file and report "inside the guard". | Fixed in SS-010: `--name-status -M -z`, both sides counted. |
| 3 | The storage rule checked three named accessors only. `localStorage['key']`, `delete localStorage.key` and `localStorage.clear()` all passed — and `clear()` empties the whole shared origin, production saves included. `setItem(studio_key, v)` also passed, where the key is a variable. | Fixed in SS-010: every route checked; a computed key is a violation whatever its text. |
| 4 | Five places, one of them public-facing copy, claimed the realm never touches an unprefixed key. Studio pages inherit `shared/settings.js`, which owns `theme` and `devMode` and ships Clear All Game Data. | Fixed in SS-011: every statement scoped to studio code, and ADR-0003 gained a decision point so it cannot widen back. The behaviour was correct; the claim was the defect. |
| 5 | SS-009 ticked the `review.md` and `retro.md` criteria before either document existed. | Fixed: the documents exist, the ticket records the fix round, and the retro carries the lesson. |
| 6 | The gate was green while nine ticket files were untracked — the document checks read the filesystem. | Fixed in SS-010: `tree-clean` runs at the gate. |
| 7 | The default `--base` produces two false failures for iteration 00, and no document recorded the value to use. | Fixed: `plan.md` and this review record `697385f`; from iteration 01 the tag makes it the default. |
| 8 | A missing Chrome reported as a suite *failure*, indistinguishable from a regression; `--offline` did not skip the browser suites. | Fixed in SS-010. |
| 9 | Commit lint exempted anything whose subject began with "Merge", making it opt-out. | Fixed in SS-010: parent count. |
| 10 | `hygiene` used a text-extension allowlist, so a `.pem` or `.env` was skipped; and it never scanned the one file outside the guard. | Fixed in SS-010: binary denylist, exception paths included. |
| 11 | A base ref that did not resolve made `path-guard` skip and the ticket stage exit 0. | Fixed in SS-010: it fails. |
| 12 | Footer links were 16px against a 44px criterion, and the evidence line had measured only the element that passed. | Fixed in SS-011; every link and button re-measured. |
| 13 | A corrupted `studio_visitCount` rendered "Visit number 4.7" and "Visit number Infinity". | Fixed in SS-011, with a test per observed input. |
| 14 | Count drift in the written record — test and document counts written before the docs grew. | Corrected in the tickets and the changelog. |
| 15 | `shared/settings.js` throws an uncaught `SecurityError` with site data blocked, on every page including studio's. Production-side, outside the guard. | Registered as TD-005. |
| 16 | Nits: a dead import, `--stage` with no value crashing, a misaligned detail indent, an inaccurate `v2` claim, a colour described without its theme, a template saying "four files", an inaccurate learning-log line, an over-confident comment about polling. | All fixed. |
| 17 | Alias tracking (`const ls = localStorage`) cannot be followed without a parser. | Out of scope; the alias is detected and refused instead. |

Both reviewers also verified, independently, that the diff touches nothing outside the
three studio paths and the one `package.json` line; that no production behaviour changed
and `npm test` grew additively; that hygiene is genuinely clean of private content; that
every relative link resolves; and that every factual claim in `findings-3d.md` is accurate,
including the 9-versus-11 portal count and the geometry of the proposed fix.

**Verdict:** Approved with findings — the Independent Reviewer's verdict on the original
diff was *Rejected*, on findings 1, 2, 5 and 7; all of them are fixed in SS-010 and SS-011,
verified by regression tests written from the reviewers' own reproductions, and the
corrected diff is approved.
