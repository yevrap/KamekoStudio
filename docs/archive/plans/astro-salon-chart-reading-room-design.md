# Astro Salon — Chart Reading Room Design

> Design pass for **p2-34** (Sprint 2), written and shipped 2026-07-15. Scope set by [Astro Salon Questionnaire — Promotion Decisions](../../questionnaires/astro-salon-promotion-decisions.md) **Q2 = "go bigger — all 12 houses from day one"**. This note records what the room is, the judgment calls made, and what was deliberately simplified. Overview: [Astro Salon](../../games/astro-salon/README.md). Sprint plan: [Astro Salon — Promotion & Depth Sprints (July 2026)](astro-salon-promotion-and-depth-sprints-july-2026.md).

## What a session looks like

A second session type, chosen on the start screen (**🔮 Salon** / **🌅 Chart reading**). Four guests, and this time they're *returning clients* — they arrive undisguised (name + symbol visible), because the puzzle is no longer *who they are* but *what their chart says*. Each guest brings a birth time and asks:

1. **One rising-sign question** — "I was born N hours after sunrise; where was my rising sign?" The player computes it and taps the wheel (same read-then-confirm as the salon).
2. **Three house questions** — a life topic ("Money's been on my mind…") names a house number; the player counts clockwise from the rising sign and taps the sign holding that house.

**The 12 houses are dealt exactly once per session** (shuffled, 3 per guest) — that's how "all 12 houses from day one" stays playable: one ~16-question session teaches the whole chart without any guest overstaying. Unit tests enforce the exactly-once deal.

Scoring is unchanged from the salon: 2⭐ first try, 1⭐ second, streak bonuses, rule-on-miss teaching. Best stars persist separately per room (`astroSalon_bestStars` / `astroSalon_bestStarsChart`) since the maxima differ.

## The two rules it teaches

- **Rising sign (simplified sunrise rule):** at sunrise, the sun sign itself is rising; the ascendant advances **one sign every ~2 hours**. Birth times are quantized to even hours (0–22) so the ÷2 is always whole and every offset 0–11 is reachable.
- **Whole-sign houses:** the rising sign *is* the 1st house; each next sign clockwise takes the next house. The card shows a persistent "⬆️ Rising: …" anchor and the wheel hub holds the rising sign while a house question is open, so "count from here" is always visible.

## Judgment calls (and why)

| Decision | Call | Why |
|---|---|---|
| Session length with 12 houses | **4 guests × (rising + 3 houses) = 16 questions** | 5 guests × 2 houses can't cover 12; 6 guests × 2 drags the guest-arrival overhead. 4×3 covers every house exactly once and stays a one-sitting session (slightly longer than the salon's 10 questions — acceptable per the sprint note's "or a longer session"). |
| Guests disguised? | **No — revealed on arrival** | The salon's incognito mechanic is about identifying the sun sign; here the sun sign is an *input* to the rising computation. Hiding it would just stack two puzzles on one question. |
| Per-sign chart intros | **One shared "I came back for a deeper reading" line** | 24 more localized persona lines for flavor only — cut to keep Sprint 2 scope tight; logged in Improvements as a future rider. |
| House flavor | **One topic question per house** (12 × EN/RU in `HOUSES`) | The topic *is* the teaching (house meanings); one good line each beats three mediocre variants. Pool growth is a natural Improvements item. |
| Scoring | **Identical to salon** | The questionnaire framed the room as "same salon teaching style"; a new scoring scheme would be change for its own sake. |
| Rising at h=0 | **Kept** ("born right at sunrise" → rising = sun sign) | It's the anchor case of the rule, not a degenerate one — a free teaching moment. |

## Known simplifications (deliberate, recorded)

- **Latitude, season, and true dawn time are ignored.** Real ascendants don't advance uniformly; the 2-hours-per-sign rule is the standard beginner approximation, and the arithmetic *is* the lesson. Real-chart accuracy is explicitly out of scope for this room.
- **Whole-sign houses only** — no Placidus, no cusps, no intercepted signs. Cusp handling and decans stay future-room scope (per the sprint plan).
- **Birth place flavor** from the original working answer was dropped — place affects nothing under the simplified rule, so mentioning it would imply precision the game doesn't have.

## Status & where it lives

- **Shipped 2026-07-15** (Sprint 2, with p2-33) — live at https://yevrap.github.io/KamekoStudio/games/astro-salon/, repo `games/astro-salon/`.
- Pure logic (`risingFor`, `houseSignId`, the guest/house deal) unit-tested in `tests/astro-salon.test.mjs`.
- Future ideas → [Improvements](../../games/astro-salon/ideas.md); open product decisions → [Astro Salon Questionnaire — Promotion Decisions](../../questionnaires/astro-salon-promotion-decisions.md).
