# Iteration 05 — review

**Verdict:** Approve with findings (Independent Reviewer, `fable`, round 1 of 1)

QA (`opus`, round 1 of 1): **Approve with findings.** Neither pass rejected, so there is no
second round (direction rule 3).

*In plain words and the demo list are added at `close`.*

## What was reviewed

The 13 studio commits of sprint 05, `studio-iteration-04..9d48713`: SHS-055 (the checks
tell studio commits from arcade commits), SHS-056 (River Run forked into
`studio/games/river-run/` with `studio_` saves only), SHS-057 (the 3D page's River Run
portal opens the fork, recorded exception ADR-0010), and SHS-058's records. The arcade
commits in the same range were out of scope. There are no ADR-0008 production fixes this
sprint, so no `reviews/<TICKET>.md`.

Each reviewer ran with fresh context and the studio-only patch.

- **Independent Reviewer.** Ran `node --test tests/studio/` (327/327), ran path-guard and
  commit-lint on the real range, fed the portal rule edge cases (CRLF, a comment decoy with
  the fork url, rollback), and mutation-tested the fork's browser test in a throwaway clone.
- **QA.** Walked every acceptance criterion of SHS-055/056/057 (all met), ran the suites
  and the `ticket` and `gate` stages in a clean clone, walked the fork in headless Chrome
  with a storage-write log across reloads, checked all 11 portal targets on `3d.html`, and
  confirmed the live fork, `constants.js` and production River Run are byte-identical to
  `HEAD`.

## Findings and what became of them

| # | Finding | Severity | Became |
|---|---|---|---|
| IR 1 · QA F1 | Scope was the only signal that put a production-path change under the guard: `fix: SHS-060 …` touching only `shared/settings.js` was judged by nothing, and a test name claimed more than it proved | process, production file | **Fixed now (S)**, `b897707`: a subject naming `SHS-NNN`/`SS-NNN` is a studio commit whatever its scope, so it is linted and guarded; the test is renamed to what it proves; `guardrails.md` says plainly that a commit claiming neither is the arcade's and judged by nothing. Enforcing the arcade-docs route's path list is **backlog #28** (M) |
| IR 3 | The fork's browser test compared the store before and after, so it could not see a write that put a production key back to its seeded value (shown by mutation) | process | **Fixed now (S)**, `607d40b`: the test logs every `localStorage` write and refuses any non-`studio_` key except `settings.js`'s two load-time token removals. Shown red by making the fork also write `muted`, then green |
| IR 2 | The 3D page's River Run trophy reads the arcade's `riverRunHighScore`, which the fork never writes; the gallery's recently-played sort ignores the fork | player-facing | Recorded in ADR-0010's consequences; **backlog #26** (production code, stop-and-ask) |
| IR 4 · QA F4 | The drawer's game switcher highlights 🌊 on the fork page, and tapping it leaves for the production build | player-facing nit | ADR-0010; **backlog #26** |
| IR 5 | `STUDIO_FORK_PORTALS` lives in a studio-writable file, so a studio commit could approve its own portal | process nit | **Backlog #27** (S) |
| IR 6 | The Tone.js `RangeError` exemption is narrow, but its reasoning (audio byte-identical to production) expires at the first experiment | nit | **Backlog #22** amended: retire it at #22 or when the equality test retires, whichever is first |
| IR 7 | An ordinary pull-merge bringing in both kinds fails the path guard | process nit | **Fixed now (docs)**: `process.md` says rebase, don't merge |
| QA F2 | An arcade edit to `shared/3d/constants.js` (a new portal) fails the path guard until the iteration is tagged, because the exception compares the whole file | process | `guardrails.md` names the edge; **backlog #29** (S) |
| QA F3 | Uncommitted changes count as studio work, and the guard's output doesn't say they are uncommitted | process | **Backlog #30** (S). QA hit it on this session's arcade doc edits in progress, committed since as `63b8190` |
| QA F5 | `settings.js` removes `tokens`/`tokenHistory` on every load | save nit | No change: covered by ADR-0003's carve-out; allowlisted by name in the new write log |
| QA F6 | A player who came through the 3D portal has no way back to it but the browser's back button | nit | **Backlog #31** (S) |
| IR · heads-up | `b864a09`'s subject was 115 characters, over the lint's cap | process | Reworded before push, now `6f858da` |

## Also in this step

On the executive's direction in chat, the studio made the arcade doc updates it had
handed back in the sprint report instead of asking for them: `63b8190` (arcade `docs:`)
names both River Run builds in `CLAUDE.md` and `games/CLAUDE.md`, moves River Run's
feature rows from `docs/roadmap.md` to the studio backlog (#4–#8, #23–#25; p2-44 closed on
its answer), and archives the answered River Run questionnaire. `guardrails.md` makes it
standing: the studio keeps the arcade docs about its own work current, docs only, in its
own arcade commit.

## What a second round would likely have found

None is due. Neither pass rejected, and nothing a player hits, no production file and no
save was left open: the two player-facing findings are production code, now on the backlog
behind a stop-and-ask.
