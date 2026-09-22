> **Idea Inbox — Tysiacha (1000)**
> Raw ideas for the game. Promoted to the arcade on 2026-07-09 based on a **keep** playtest verdict. Overview: [Tysiacha (1000)](README.md).

*(inbox empty — cleared July 12, 2026)*

## Triaged → repo roadmap (July 12, 2026)

Each verified against the code before filing:

- [x] Turn/phase indicator ("it's your turn to act and what I need to do") + show the bet you need to beat → merged into **p1-26** (turn/phase + contract HUD). Confirmed: the only cues today are the transient banner and per-seat bid chips that render only during bidding — nothing persistent says whose turn, what's expected, or the live number.
- [x] Side menu scrollable but hard to tell, and doesn't reset → **b-16** (shared drawer: scroll affordance + reset scroll on open — fixes it in every game, not just here).
- [x] Should the bet be different? start lower? → **answered same day (Q8=D)** → repo roadmap **p2-30**: classic forced-100 stays the default, plus a "relaxed bidding" New Match toggle where the opener isn't forced. All-pass rule detail: Q1 in [Tysiacha Questionnaire — Open Decisions (July 2026)](../../archive/questionnaires/tysiacha-open-decisions-july-2026.md).
- [x] Match-end "New match" token charge → **answered same day (Q9=A, free everywhere)** → repo roadmap **p1-28**.

## Phase 1: Game Feel & Polish (Immediate UX)
- [x] Card-play animations (slide to trick, sweep to winner), 1-tap play, and selection spacing (`p1-12` — ✅ shipped 2026-07-10, commit `efa8cde`; FLIP pattern ported from Durak)
- [x] Sound: card snap, marriage chime, bid gavel (`p1-13` — ✅ shipped 2026-07-10, commit `a460e8b`; synthesized WebAudio, mute toggle in ⚙️)
- [x] **Russian language toggle** (`p1-14` — ✅ shipped 2026-07-10, commit `d0dc684`; full string table incl. rules, coach, and Т В Д К rank letters; applies live, log history re-renders. Wording review → [Tysiacha Questionnaire — Language, Difficulty & Sound](../../archive/questionnaires/tysiacha-language-difficulty-and-sound.md))

## Language & Opponents sprint (shipped 2026-07-10 → p1-14 / p2-18 / p2-21 / p1-13)
Questionnaire-driven sprint: Q5 (Russian incl. rules+coach), Q6 (AI ability as a setting), plus player renaming requested at kickoff. All four shipped same-day, deployed as v10; open decisions in [Tysiacha Questionnaire — Language, Difficulty & Sound](../../archive/questionnaires/tysiacha-language-difficulty-and-sound.md).
- [x] Russian toggle (`p1-14`, commit `d0dc684`)
- [x] AI difficulty setting Easy/Normal/Hard (`p2-18`, commit `0794526`)
- [x] Custom player names, live rename (`p2-21`, commit `0794526`)
- [x] Audio layer (`p1-13`, commit `a460e8b`)

### Inbox (from the sprint) — triaged July 12, 2026 against the filled [Tysiacha Questionnaire — Language, Difficulty & Sound](../../archive/questionnaires/tysiacha-language-difficulty-and-sound.md)
- [x] AI personalities as flavor on top of difficulty (cautious Vera vs aggressive Boris) — cut from `p2-18`; distinct bid thresholds + play styles per bot — **confirmed 2026-07-12 by Q3 of the [open-decisions questionnaire](../../archive/questionnaires/tysiacha-open-decisions-july-2026.md)** → repo roadmap **p2-31**
- [x] Auto-detect language on first launch — **won't do**: Q4 answered "keep English default"
- [x] «Хвалюсь!» and other authentic table-talk — **won't do**: Q2 answered "keep «объявляет марьяж»"
- [x] More sounds: trick-sweep whoosh, match-win fanfare, your-turn nudge — **confirmed by Q6** → repo roadmap **p1-27**
- [x] Sound polish pass on a real phone speaker — folded into **p1-27**

## Game Log & Clarity (sprint planned 2026-07-09 → roadmap p1-15 / p1-16 / p2-20)
Playtest finding: a correctly resolved trick looked like a bug — led suit invisible, banners overwrite each other, tricks sweep away with no record. Full design: [Tysiacha — Game Log & Clarity Design](../../archive/plans/tysiacha-game-log-and-clarity-design.md).
- [x] Event stream foundation + ambient clarity: led marker + led-suit chip, trick-result reasons, winner pulse (`p1-15` — ✅ shipped 2026-07-09, commit `9c92b1b`)
- [x] 📜 log drawer — whole-match deal-grouped history of plays, bids, marriages; hints always captured (`p1-16` — ✅ shipped 2026-07-09, commit `3fad1c1`)
- [x] Audit rows + deal recap from the scoring screen (`p2-20` — ✅ shipped 2026-07-09, commit `f424587`; sprint complete)

## Phase 2: Teaching & Onboarding (New Players)
- [ ] **Scripted first deal** (`p2-15`) — a stacked tutorial hand that forces one marriage, one forced-trump moment, one bid decision
- [ ] Post-deal "what you could have done" hint (`p2-16`) — one line, biggest missed play
- [ ] Bilingual labels while learning (Russian terms with English hints) — not on the roadmap; Q5 of the rules questionnaire chose the full Russian toggle instead

## Triaged → repo roadmap (July 12, 2026, evening — [open-decisions questionnaire](../../archive/questionnaires/tysiacha-open-decisions-july-2026.md))

Fully answered same day, no open items left; questionnaire archived.

- [x] Q1 all-pass rule → **p2-30 confirmed as-is** — raspasy if Classic Rules enabled, else redeal
- [x] Q2 teaching layer order → **p2-15 promoted** to the priority teaching item, plus added scope: a tutorial setting that expands the in-game rules explanations, not just the stacked hand. **p2-16 deprioritized** behind it
- [x] Q3 AI personalities as flavor → **p2-31** (new) — cautious Vera vs aggressive Boris, distinct bid thresholds + play styles on top of the existing difficulty setting
- [x] Q4 hot-seat mode → **p3-05 confirmed** — build it, not just keep on the roadmap

## Phase 3: Depth & Longevity (Veterans)
- [ ] Match stats (`p2-17`) — bids made/failed rate, avg points per deal — mirroring durak p2-13
- [x] AI difficulty levels (`p2-18` — ✅ shipped 2026-07-10, commit `0794526`; personalities-as-flavor confirmed 2026-07-12 → `p2-31`)
- [ ] AI personalities as flavor — cautious Vera vs aggressive Boris, distinct bid thresholds + play styles on top of the existing difficulty (`p2-31`) — confirmed wanted 2026-07-12, still open per roadmap as of 2026-07-18; pairs with durak's `p2-07` (same ask, other game).
- [ ] Seeded deals + share link (`p2-19`) — durak-dungeon's mulberry32 is the in-repo prior art, cf. durak p2-12
- [ ] Hot-seat mode (`p3-05`) — 2–3 humans, pass the device — durak's pass-device cover is the pattern. Confirmed "build it" 2026-07-12 (not just keep-on-roadmap) — still the biggest open item (L) on either game's board as of 2026-07-18.

*(created 2026-07-09, during the docs backfill for the first jam session)*
