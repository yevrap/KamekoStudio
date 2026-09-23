---
title: "Astro Salon"
type: game
slug: astro-salon
tier: invest
status: arcade
play_url: https://yevrap.github.io/KamekoStudio/games/astro-salon/
code: games/astro-salon/
tags: [game, teaching]
---

# Astro Salon 🔮

**Links:** [Studio Dashboard](../../README.md) · [Lineup](../README.md) · [Roadmap](../../roadmap.md) · [Playtest log](../../playtest-log.md) · [Ideas](ideas.md) · [Open questionnaire](../../questionnaires/astro-salon-promotion-decisions.md)

> Jammed July 13, 2026 from the arcade-wide inbox ask: *"new game to teach astrology with dialogue and rules… major names and rules… relationships and times of year… daily horoscope?"* Promoted to the arcade July 14, 2026; depth sprint (Chart Reading room + year-of-horoscopes) shipped July 15, 2026.

**Play it:** https://yevrap.github.io/KamekoStudio/games/astro-salon/ · repo `games/astro-salon/`

## Current state (as of 2026-07-18)

**Live in the main arcade gallery.** Two session types, chosen on the start screen, both full EN/RU:

- **🔮 Salon** — the original mode. Five of the twelve zodiac signs visit in disguise each session; you guess who they are on the zodiac wheel, then answer one follow-up per guest (element, modality, ruling planet, opposite sign, or element-compatibility). Read-then-confirm wheel picker (tap previews the sign big in the hub, tap again commits). Scoring: 2⭐ first try, 1⭐ second try, streak bonuses, rule-on-miss teaching.
- **🌅 Chart Reading** — four *returning*, undisguised guests, each with a birth time. Per guest: place their **rising sign** (simplified sunrise rule: sun sign rises at dawn, ascendant advances one sign per ~2 hours), then answer three **whole-sign house** questions (count clockwise from the rising sign). All 12 houses are dealt exactly once per session. Same scoring model as the Salon; separate best-score tracking.
- **✨ Daily horoscope** — pick your sign once, get a date-seeded daily read colored by a named, versioned **year theme** (`YEAR_THEME` v1, 2026 = "The Year of Quiet Momentum"). The end-screen fortune quotes the same deterministic read the daily panel shows. No streak mechanic (considered, explicitly cut).

Best-session-stars persist per room; dark/light mode; settings-drawer integration (pause, quick game switcher); pointer events throughout.

**Open decision:** expert-mode shape (roadmap p2-35) — Yev has answered Q4 of [Astro Salon Questionnaire — Promotion Decisions](../../questionnaires/astro-salon-promotion-decisions.md) (build something an astrology-literate player would find worth testing their knowledge against, and would also learn from) but it hasn't been picked up into a build yet; needs a short design pass first. That questionnaire is the one live open thread for this game.

**History (condensed):** jam → v19 (round-1 "meh": teaching felt like guessing) → v20 (round-2 "meh": readability/depth) → v21 (round-3 "keep", promoted same day) → Sprint 1 promotion (module split, tests, dark/light, settings integration) → Sprint 2 (Chart Reading room + year-of-horoscopes). Full sprint-by-sprint detail is archived: [Astro Salon — Promotion & Depth Sprints (July 2026)](../../archive/plans/astro-salon-promotion-and-depth-sprints-july-2026.md) (sprint plan, both sprints shipped) and [Astro Salon — Chart Reading Room Design](../../archive/plans/astro-salon-chart-reading-room-design.md) (Chart Reading room design pass, shipped as designed). Earlier verdict questionnaires (rounds 1–3): [Astro Salon Questionnaire — Verdict & Direction](../../archive/questionnaires/astro-salon-verdict-and-direction.md) (archived).

## Design decisions and why (still live reference)

- **Read-then-confirm over one-tap answers** — inspection and commitment are different intents; splitting them makes the wheel browsable for a beginner at the cost of one extra tap. Reconfirmed multiple times (round-3 Q3, and again for any future expert mode) — this stays in every mode, it is not up for revisiting.
- **Start date only on wedges** — "from Mar 21" per wedge; the boundary between wedges *is* the cusp, so ranges are readable from the ring itself, and the full range shows big in the hub on tap.
- **Signs-as-personas, incognito (Salon only)** — the guess reveals the character, so personality traits become a *hint channel* for the date drill instead of decoration. Chart Reading guests are undisguised on purpose: there the sun sign is an input to the rising computation, not the puzzle.
- **Aries at 12 o'clock, clockwise** — friendlier than chart-authentic 9-o'clock/counterclockwise.
- **Modern rulers** (Scorpio→Pluto etc.) — kept; traditional/modern toggle stays a cut idea.
- **Compatibility = element pairing only** — kept; one teachable rule per session.
- **Whole-sign houses only, simplified rising rule** — no Placidus, no cusps, no latitude/season/true-dawn. The arithmetic (2 hours per sign) *is* the lesson for the beginner room; real-chart accuracy is explicitly out of scope there. Deeper accuracy is one of the ideas feeding the expert-mode decision.
- **Russian persona grammar follows the sign's grammatical gender** — Дева speaks with feminine verb forms, Весы/Рыбы use genderless phrasing; cheap authenticity a literal translation would miss.
- **Language switch re-renders in place** — game state stores keys (sign ids, element/planet keys), never display strings, so mid-question toggling rebuilds the exact view including feedback and wedge marks.

## Open threads

- **Expert mode (p2-35)** — see "Open decision" above; tracked in [Astro Salon Questionnaire — Promotion Decisions](../../questionnaires/astro-salon-promotion-decisions.md).
- Smaller ideas (per-sign chart intros, richer house-question pools, cusp/decan depth, sign personas with memory, sounds, cosmetics) live in [Improvements](ideas.md).
