# Iteration 02 — the shelf gets its first experiment, and the realm gets boot coverage

**Goal:** put the studio's first game on the shelf, and close the debt that means the
realm's own pages are in no boot suite — so the game ships under coverage rather than
adding to the uncovered surface.

## Committed tickets

| ID | Title | Size | Role lead |
|---|---|---|---|
| SS-020 | Boot coverage for every page under `studio/` | M | QA Engineer |
| SS-022 | *Overtighten* — the first experiment | M | Game Designer |

| ID | Title | Size | Role lead |
|---|---|---|---|
| SS-023 | The shelf's first entry and this iteration record | S | Technical Writer |

Two committed tickets against the standing cap of 2–3, plus SS-023, which is the
iteration's own paperwork carried as a ticket so the commits that write it have an ID to
name — the same arrangement as SS-009 in iteration 00 and SS-015 in iteration 01. Recorded
here rather than quietly exceeded.

**Order is deliberate.** SS-020 lands first. Its page contract is generic, so it covers
`studio/games/overtighten/` the moment that page exists — which means the new game is
built against a check that already exists rather than one written afterwards to fit it.

## Decisions this iteration builds on

Three questions were open at the end of iteration 01. The executive took the recommended
default on each, explicitly rather than by silence: the defaults were put to them with
their costs stated, and left standing.

| Question | Answer | What depends on it |
|---|---|---|
| Whether the realm gets its own portal on the 3D landing page now | **Not yet.** The room behind the door is real, but the shelf is empty until this iteration ends. Deferring also avoids a production edit and the trophy masking it would cause while TD-006 is open | Out of scope. TD-001 and TD-006 stay open, the twelfth slot stays reserved |
| Whether iteration 02 builds the first experiment or pays down debt | **Both, in that order of dependency.** The standing work mix puts maintenance and debt first and runs new development on a cadence; this is the first iteration where that cadence fires, and the carried-in debt row is the one that makes the new work safe | SS-020, SS-022 |
| The realm's name | **Keep both.** "Shadow Studio", folder `studio/` | Nothing changes |

The first row is the reason no file under `shared/3d/` is touched by this iteration, and
the reason no new path exception is opened.

## Reserved capacity

SS-020 is the debt share and closes **TD-004**. It is over a fifth of the iteration by
size, and it was carried in from iteration 01's board rather than invented here.

The instruction attached to it was to add a **studio-owned** check rather than a second
production exception: `scripts/smoke.mjs` discovers pages under `games/` and `drafts/`
only, and it is outside the path guard. The studio therefore grows its own boot check
instead of widening production's.

## The design hypothesis

Recorded before the build, per the Definition of Done's Game Designer column.

> *Overtighten* is a bench of bolts. Holding a bolt turns it, and turning any bolt loosens
> the bolts it is coupled to. Every bolt has a tolerance band; every bolt must end inside
> its band at the same time.
>
> **The hypothesis:** the interesting part is the coupling, not the timing. Because torque
> can only be added to a bolt directly, and only ever removed from it by turning one of its
> neighbours, a plate is a small ordering puzzle with an analog release on top. Overshooting
> is recoverable — turn a neighbour — so the player keeps tuning instead of restarting,
> and the failure state that matters is stripping a thread, which is not recoverable.
>
> **It is wrong if** the plates can be cleared by holding each bolt once in any order. That
> would mean the coupling is decoration and the game is a reaction test.

The hypothesis is checked in `review.md`, not assumed.

## Reserved for later, deliberately

There is no meta-progression: no score, no stars, no unlock economy beyond remembering the
furthest plate cleared. A first experiment should establish whether the core mechanic holds
before anything is built on top of it, and a progression layer built over a mechanic that
does not hold is the expensive kind of waste.

## The base ref

`studio-iteration-01` exists, so the checks default to it and `--base` is unnecessary.

## Risks

| Risk | Response |
|---|---|
| A boot check that drives a real browser cannot run without Chrome, and the gate turns any "not run" into a failure | The gate already requires Chrome for `full-suites`, so the new check adds no new precondition to a green gate. It reports "not run" with the reason at the ticket stage, exactly as the suites do |
| A boot check that asserts only "the page loaded" would close TD-004 on paper while leaving the eight named mutations alive | The ticket lists all eight and requires each to be demonstrated failing the check. The contract is written as data, so what is asserted is readable rather than buried in driver code |
| Hand-authored plates can be unsolvable, or solvable only by an order nobody would find | The torque model is pure and a solver test proves each shipped plate reachable from zero without stripping. A plate the solver cannot clear does not ship |
| A plate clearable by holding each bolt once would falsify the design hypothesis silently | A test asserts the opposite for each plate: the naive single-pass strategy fails. If it ever passes, the plate is decoration and the test says so |
| The game shares an origin with production, and a new game is new storage | Two keys, both `studio_`-prefixed, both documented in `studio/README.md` before use, both covered by `storage-keys` |
| Audio in a page that can be opened from the arcade | Synthesized only, no binary assets, muted until a pointer gesture creates the context, and a mute toggle persisted under a `studio_` key |

## Out of scope

- **The realm's own portal.** Held by decision. TD-001 stays open and the twelfth slot stays
  reserved.
- **Any production file.** No new path exception is opened this iteration; the two recorded
  ones are not used.
- **TD-003, TD-005, TD-006.** Unchanged, recorded, none blocks this work. Two of the three
  are production-side and need an approval this iteration does not have.
- **Meta-progression in the game.** See above.
- **Promotion.** *Overtighten* ships as a PROTOTYPE on the studio shelf. Moving it into the
  production arcade is a separate, executive-approved process.
