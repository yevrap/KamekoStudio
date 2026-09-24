# Shadow Studio

An experimental realm inside Kameko Studio that an agent "company" builds and runs like a scrum team: plan, build, test, document, report, hand off. Yev is the executive. He steers through chat, starts each iteration with one sentence, and decides what graduates to the real arcade. The work is version-controlled in the public `KamekoStudio` repo, so it has to read like professional engineering.

**Status:** running. The hub is [Shadow Studio Index](README.md) and the latest report is [Shadow Studio — Handoff](handoff.md). Open decisions are in [Shadow Studio — Questionnaire](questionnaire.md); everything not listed there is decided in this note.

*This note describes the current design only. When a decision changes, the passage is edited in place and the reason goes into the repo's decision log. See [Keeping the docs clean](#keeping-the-docs-clean).*

---

## How you work with it

You only need chat. The files in this folder are optional places to leave comments.

| You say | What happens |
|---|---|
| **"run a studio iteration"** | One bounded iteration runs to the protocol below, then stops and reports back in chat. |
| **"studio status"** | Read-only: where the company is, open decisions, and the scorecard trend. |
| **Any direction, in chat** ("make it moodier", "stop touching durak") | Logged in the Input Ledger (restated neutrally), triaged into a ticket, a deferral, or a reasoned "won't do", and reported back so you can see what became of it. |
| **"promote X"** | Prepares moving a studio game into the production arcade. Only on your word. |
| **"stop"** | Halts at the next step (a `STOP` file at the repo root does the same). |

Optional, in this folder: lines in [Shadow Studio — Feedback Inbox](inbox.md), `> Yev:` comments inside a ticket, and Keep / Iterate / Kill verdicts on an iteration review. Every run reads all of these before planning.

**Versions:** each iteration ends with a git tag `studio-iteration-NN` in the repo, so any iteration is one checkout away.

## Principles

1. **One home per artifact.** Nothing is maintained in two places (see the table below).
2. **State lives in files, not in chat.** A fresh chat can always pick up from the Handoff.
3. **Production changes only through the full process.** The studio may fix production files as long as the whole sprint process runs — plan, ticket, two-round review, gate, retro (Q9). The repo's ADR-0008 writes that down, and the path guard enforces it: a production file is admitted only for the ticket that owns it, in its own iteration.
4. **Public-repo quality.** Everything committed is something a stranger could read and respect.
5. **Bounded runs.** One iteration, small caps, clean stop.
6. **Checks are built in and evidence-based.** A check that did not run is reported as "not run", never silently skipped.
7. **Personas are lenses, not processes.** Only QA and the independent reviewer run as separate subagents, since fresh eyes are the point. That also keeps plan usage sane.

## Where the realm lives

The realm lives inside the existing `KamekoStudio` repo and its one GitHub Pages deploy, in a top-level `studio/` folder (`yevrap.github.io/KamekoStudio/studio/`). It is entered through one new portal in the 3D landing page (`3d.html`, Three.js), and it gets its own identity: palette, name, gallery-of-games feel. Iteration 00 designs that identity.

- **Path guard.** The company may create or modify only `studio/**`, `docs/studio/**` and `tests/studio/**`, plus the recorded exceptions listed in the repo's `guardrails.md` — the `studio:check` entry in `package.json` and the front-wall portal row in `shared/3d/gameplay.js` — plus **production fixes** (ADR-0008). A fix is admitted only when an entry in `PRODUCTION_FIXES` names the file for the current iteration, its ticket has a file in that iteration, and every commit that changed the file names that ticket. The first was TD-009's, in iteration 04. A feature, a design choice, a promotion, or anything touching releases, accounts or money is still stop-and-ask.
- **Production safety net.** Pages deploys from `main`, so every company push also redeploys production. Every push therefore passes the whole existing suite (`node --test`, `npm run smoke`, `npm run e2e`) first — the checker's `push` stage — and is verified afterwards: the new build is being served, a production game page still loads, and no production file changed except the fixes the iteration's tickets own.
- **Saved data.** `studio/` shares an origin with production, so every `localStorage` key it uses carries a `studio_` prefix and it never reads or writes production keys.
- **Trail in git.** Conventional commits scoped `studio` with ticket IDs (`feat(studio): SHS-050 …`), one tag per iteration. Iterations 00–03 used a branch per ticket with `--no-ff` merges; iteration 04 trialled trunk-based development — small commits straight to `main`, each finished ticket and each ceremony record pushed and deploy-checked as it lands (ADR-0007). The whole history filters with `git log --grep "(studio)"` or `git log -- studio/`.

## Where things live

| Artifact | Home | Why |
|---|---|---|
| Studio code, tests | Repo `studio/` | It is the product |
| Team personas, process docs, guardrails, Definition of Ready/Done | Repo `docs/studio/` | Public engineering docs |
| Tickets, iteration plans, reviews, retros | Repo `docs/studio/iterations/NN/` | Versioned with the code they describe |
| Decision log (ADRs), tech-debt register, learning log | Repo `docs/studio/` | Same |
| Your direction, verbatim | [Shadow Studio — Input Ledger](input-ledger.md) | Private; the repo only records the resulting decisions |
| Feedback Inbox, questionnaires, verdicts | [Shadow Studio — Feedback Inbox](inbox.md), [Shadow Studio — Questionnaire](questionnaire.md) | Where you steer |
| Board, Scorecard, Handoff, review digests | [Shadow Studio — Board](board.md), [Shadow Studio — Scorecard](scorecard.md), [Shadow Studio — Handoff](handoff.md) | Executive view, regenerated by each run from the repo; never edited by hand except verdict lines |
| Studio index and this design | [Shadow Studio Index](README.md) and this note | The hub you read |

Each steering view links to the handbook file it summarizes. If the two ever disagree, the handbook wins and the run fixes the view.

## Public-repo standards

- READMEs for `studio/` and `docs/studio/` that make sense to a stranger.
- Nothing private: no household, health, family or financial information, no note-vault syntax, no private paths. Your steering appears in the repo only as neutral decisions and tickets.
- No secrets, tokens, keys, or personal identifiers. Checked automatically (see Self-checks).
- Conventional, technical commit messages; tickets with acceptance criteria; changelog kept.
- Accessible and mobile-first; assets optimized and sized sensibly; the existing license applies.

## The team

Each persona has a file in the repo (`docs/studio/team/`): name and one-line role, what they own, what they review, voice, what they refuse to do, and their checklist in the Definition of Done. The steering index links to them and holds no copies.

| Role | Owns |
|---|---|
| **Product Owner** | Backlog, iteration goal, acceptance criteria; turns your input into tickets; says "no" with reasons |
| **Scrum Master** | Runs the ceremonies, enforces caps and stop rules, keeps the Board honest, writes the handoff |
| **Game Designer** | Mechanics, feel, balance, "is this fun" hypotheses |
| **Level / Content Designer** | Levels, maps, tales, waves, difficulty curves |
| **Front-end / Gameplay Dev** | Canvas, DOM, Three.js, input, rendering, the 3D portal and gallery |
| **Data & Systems Dev** | "No backend" persistence: `localStorage`/IndexedDB schemas, save migration, storage size, performance, asset budgets |
| **Tech Lead / Architect** | Tech-debt register, refactoring plans, conventions, dependency and structure decisions |
| **QA Engineer** | Test plans, unit/smoke/e2e, screenshots, regression, bug triage (independent subagent) |
| **UX / Art Direction** | Visual identity, consistency, accessibility, mobile-first checks |
| **Audio / Juice** | Web-audio synthesis, screen shake, feedback feel |
| **Technical Writer / Learning Lead** | Docs, changelog, learning log, keeps the steering views and the handbook in sync |
| **Independent Reviewer** | Fresh-context critique of the iteration's diff (later: Gemini via Antigravity) |

## How the work is chosen

- **Iteration size:** 2–3 *planned* tickets, so the trail and the plan usage stay
  judgeable. The cap is on planned work only; tickets a review opens are allowed, and
  recorded as review-opened. (Q8, iteration 03.)
- **Shipping:** the gate needs the Independent Reviewer's verdict recorded. Review is **one round
  by default**; a second runs only when the first rejects on something a player would hit, a
  production file or a save, and there is never a third (ADR-0009, 22 Sept). If the last round still
  rejects, the run asks you — and in iteration 03 you handed the call back: *decide by the
  team's goals and practices, try it, and let a retro judge it.* So the team decides, writes
  down why in `review.md`, and the next retro checks whether the call held. `docs-current`
  stays a gate check. (Q8, and your answer on 21 Sept.)
- **Try one way, retro, try another.** Practices are experiments, not habits: one iteration
  runs a practice, its retro judges it, and the next may run the alternative. Iteration 03
  ran branch-per-ticket; **iteration 04 ran trunk-based development** as a trial — commit
  to `main`, each commit green, each finished ticket pushed and deploy-checked, the tag on
  the reviewed state (ADR-0007 in the repo says what the trial tests; 04's retro judges it).
  Every ceremony record — plan, stand-ups, review, retro — is pushed as it lands, so work
  in flight is visible on GitHub (your Q5 addition, 21 Sept).
- **The studio is the dev team, not a sandbox.** It may make fixes to production files as
  long as it follows the full sprint process and documentation (Q9, 21 Sept). The repo's
  ADR-0008 writes that down: each fix is a ticket and an entry in `PRODUCTION_FIXES`, with a
  regression test shown red then green, and **an independent review before it is pushed**.
  That review is recorded against the exact commit, and the push is refused until the
  review covers it. The studio writes that record itself, so the check makes the review
  impossible to forget but not impossible to fake. Whether you also approve each fix from
  outside the repo is Q10. TD-009's fix was the first.
- **The 3D zone becomes the studio's window** (Q4, 21 Sept) — "a sort of fork but in the
  same repo", pointing at the games and work the studio is doing: its workflow and results,
  not production fixes or maintenance. The regular gallery keeps showing the games. Iteration
  04 designs its shape. The TD-006 trophy interaction is still open.
- **The quality bar** (Q5, 21 Sept): professional and good practice on all three surfaces —
  GitHub (clean history, conventional commits with ticket IDs, no junk or secrets, docs a
  stranger could follow, checks green), planning docs (steering views regenerated, indexes current,
  naming conventions followed, no stale contradictions — the repo is the source of truth),
  and skills/agent files (kept current with `process.md`). Every retro includes a hygiene
  check of all three, and asks whether the last one's fixes held.
- **A falsified experiment stays on the shelf** as a PROTOTYPE that says what it found. It
  is not re-tuned to rescue its hypothesis; changing the mechanic is a new decision, not a
  maintenance ticket. *Overtighten* is the first. (Q7, iteration 03.)
- **The name** is "Shadow Studio", and the realm stays in `studio/` (Q1, ticked
  2026-09-24). The live URL does not move.
- **Ticket IDs** are `SHS-NNN`; `SS-001`–`SS-042` keep the retired prefix. Every name the
  studio coins gets read as a stranger would first. See [Shadow Studio — Naming Conventions](naming-conventions.md).
- **The standing mix:** maintenance and tech debt lead. Improving the existing games —
  bugs, polish, the questionnaires already waiting — is the default lane. New development
  happens on a cadence rather than on impulse: it is planned in, not squeezed in. Anything
  in chat or the Feedback Inbox outranks all of it.
- **Killed work** stays in git history, marked killed, and out of the gallery. Nothing is
  reverted from `main`.
- **Reports** stay compact: the fields under [Reporting back](#reporting-back-and-getting-more-efficient),
  about fifteen lines, with links for the detail.

## Ceremonies

Adapted so one run holds a whole iteration.

| Ceremony | When | Artifact |
|---|---|---|
| Backlog refinement | Start | Tickets sized S/M/L with acceptance criteria; tech-debt items pulled in |
| Iteration planning | Start | Goal, committed tickets, capacity, risks |
| Async stand-up | Between tickets | Three lines in the Studio Log: done / next / blocked, per role that acted |
| Build and test loop | Middle | Small commits to `main`, each ticket pushed and deploy-checked when done, test results on the ticket |
| Review / demo | End | Demo list, live URLs, screenshots, a Keep / Iterate / Kill line per item for you |
| Retrospective | End | Went well / didn't / change next time; every change becomes a ticket or an edit to a process doc |

Reserved capacity: roughly 20% of each iteration goes to tech debt, refactoring, documentation and learning, and the retro checks that it happened. Learning, documentation and debt are first-class work.

## The iteration protocol

An iteration is a sprint of 2–3 planned tickets, run **one step per session** (ADR-0009): `plan`, `build` (one ticket per session), `review`, `close`, `retro`. You say `studio next` in a fresh session each time; `steering/next.md` says which step is due, and a SessionStart hook loads it. What to pull comes from the ordered [backlog](backlog.md); how many sprints the current epic gets comes from [Direction](direction.md). The numbered steps below are the protocol those sessions share out.

0. **Preflight.** Read the last Handoff, the Board, the Feedback Inbox and any chat direction. Log each input in the Input Ledger *before* acting. Confirm the working tree is clean, `main` is up to date, `STOP` is absent, and the baseline tests are green.
1. **Refine and plan.** Write the iteration goal and tickets, including the reserved debt/docs/learning work.
2. **Build.** Per ticket, on `main`: implement, add tests, run the per-ticket checks, commit; when the ticket is done, run the `push` stage, push, and run the post-deploy checks.
3. **Fix, bounded.** At most 2 fix rounds per ticket, then mark it Blocked.
4. **Independent review.** QA and the Independent Reviewer examine the diff with fresh context; their findings become tickets or fixes.
5. **Document.** Tickets closed, docs and changelog updated, Studio Log entries written.
6. **Gate.** Run the gate (below). Red means the iteration is not tagged.
7. **Publish.** The last push, tag `studio-iteration-NN`, run the post-deploy checks.
8. **Review and retro.** Write both. Update the Board, Scorecard and Handoff.
9. **Stop.** Do not start another iteration "because there is room". Also stop early on: a red gate, two failed fix rounds, a blocker that needs you, long context, or the `STOP` file.

## Self-checks

The checks live in the repo as an executable `npm run studio:check` (built in Iteration 00), so they run identically every time and are visible to anyone reading the repo.

| Stage | Checks |
|---|---|
| **Preflight** | Clean tree; on `main`, up to date; baseline `node --test`, `smoke`, `e2e` green; no `STOP`; Handoff read; inputs logged |
| **Per ticket** | New behavior has tests; path guard (changed paths are inside the allowed list); `studio_` storage-key guard; lint and format |
| **Push** (before every push) | The gate below minus the two review checks, plus on `main` and no `STOP` |
| **Gate** (before the tag) | Full suites green; path guard across the whole diff; **public-repo hygiene scan** (secrets, tokens, personal identifiers, vault paths or wikilinks, oversized files); every changed behavior has a ticket, doc and log entry; commit-message lint; Independent Reviewer verdict recorded |
| **Post-deploy** (after every push) | The new build is being served (polled until it is); a production game page loads; no production file differs from the previous release except the fixes the iteration's tickets own |
| **Close-out** | Retro written; Scorecard, Board and Handoff updated; steering views match the handbook; **doc-cleanliness check** (no stacked "revision", "superseded" or "v1" passages; each doc has one current version) |

A failed check is fixed within the caps or ends the run with a report. The report lists every check as passed, failed or not run.

## Reporting back and getting more efficient

Each iteration ends with a report in chat and the same content in `Handoff.md`:

- **Where the docs are:** exact paths added or changed.
- **Summary:** 3–5 lines on what shipped, what was cut, what is blocked.
- **Checks:** each one, with result.
- **Live URL** of what changed.
- **Trend:** this iteration against the last three, from the Scorecard.
- **Efficiency changes:** what the retro changed about how the team works, and its effect so far.
- **Needs you:** only decisions that are genuinely yours (one or two lines).
- **Say next:** the exact sentence to send, usually "run a studio iteration".

The **Scorecard** gets one row per iteration: goal, tickets committed/done, fix rounds, check failures caught, debt added/paid, docs coverage, rough usage (subagents spawned, files touched), times the run had to stop for you, and the Keep/Iterate/Kill tally. Efficiency work comes from the retro: a repeated slowdown becomes a ticket to change a process doc or the check script, and the next Scorecard row shows whether it helped.

## Keeping the docs clean

- Docs describe the **current** state only. A changed decision is edited in place; the reason goes into the repo decision log, not into a stacked note.
- Kickoff prompts are not kept once used, and only the current brief exists.
- The doc-cleanliness check above enforces this at every close-out, so a note can never quietly turn into a pile of overrides.

## Graduating a game

Only through `studio-promote`, only when you say so. Promotion is a move from `studio/games/x/` to `games/x/` following the production repo's `docs/promotion-checklist.md`, with its own ticket, gate and review. Killed work stays in git history, marked killed, and out of the gallery.

## Skills

Built in iteration 00. Since 2026-09-22 they live in this repo's `.claude/skills/` (shared with Antigravity through the `.agents/skills` symlink) and are listed in `CLAUDE.md`.

| Skill | Say | Does |
|---|---|---|
| `studio-iteration` | "run a studio iteration" | The orchestrator: the protocol above |
| `studio-standup` | "studio status" | Read-only status and trend |
| `studio-promote` | "promote X" | Prepares a promotion for your approval |

## Who runs what

Claude Code runs the orchestrator and the dev roles. The Independent Reviewer and QA are separate subagents. Gemini via Antigravity can take the reviewer lane once `agy` is installed and on PATH (not installed as of September 19). Since both share files and skills, either can run any role.

### Models and effort

Settled after iteration 02, and pinned in `.claude/skills/studio-iteration/SKILL.md` and `docs/studio/team/independent-reviewer.md`.

| Role | Model | Effort | Why |
|---|---|---|---|
| Orchestrator (the session you type in) | Opus 5 | `xhigh` | The documented sweet spot for agentic coding and Claude Code's own default. Iteration 02's failures were long-horizon *consistency* failures, not reasoning-depth failures — `max` would not have fixed the record drift; generating the record did. |
| Independent Reviewer (subagent) | **Fable 5.1** | `high` | Deliberately **not** the author's model. Fresh context buys independence of memory, not of priors. |
| QA Engineer (subagent) | Opus 5 | `max` | Correctness is the entire job of this role, and "`max` when correctness matters more than cost" is exactly that case. |
| `studio-standup` | Haiku 4.5 or Sonnet 5 | `low` | Read-only status with a delta rule. Genuinely simple. |
| `studio-promote` | Opus 5 | `high` | Touches production and stops for approval. |

**Do not run the reviewer subagents cheap.** The general advice to use low effort for subagents is written for bulk workers. Here the subagent is the most intelligence-sensitive role in the system, and it repeatedly found things the author could not see — including in code the author had just written to close the previous finding.

**What actually costs.** The binding constraint in iteration 02 was plan usage and rate limits, not dollars — three subagents died mid-review on session limits, and ten passes ran to roughly $15 in API terms. The lever that matters is the **two-round cap**, not the model.

`/fast` (Opus 5, ~2.5× output speed at premium pricing) is worth toggling on for mechanical phases — doc sweeps, record regeneration, close-out — and off for planning and for reading review findings.

## Cost and risk

- **Cost:** plan usage, not dollars. A multi-agent iteration uses much more than a single chat, so early iterations stay small and the Scorecard tracks usage.
- **Time:** one iteration per kickoff, while your laptop is open. No scheduler in v1.
- **Risk:** the studio folder, plus whatever production fix a full iteration ships under Q9. The path guard, the whole repository suite before every push, and the post-deploy production check contain it; the worst studio-only case is a messy `studio/` folder you can delete.

---

*Hub: [Shadow Studio Index](README.md) · Related: [Kameko Arcade](../../games/README.md) · [Kameko Studio — Agent Game Loop Roadmap](../../planning/agent-game-loop.md) · [Kameko Playtest Log](../../playtest-log.md)*
