> **Idea Inbox**
> These are raw ideas. The active roadmap is in the repo at `docs/roadmap.md`.

## Inbox
- [x] **No Russian/i18n at all** → **p2-36**, shipped 2026-07-20. Full EN/RU toggle, live drawer switch, no restart. Plan archived: [Durak — Russian Localization Sprint](../../archive/plans/durak-russian-localization-sprint-july-2026.md). See [Dev Log](../../archive/dev-logs/arcade.md).

Pass when nothing I can do should be skipped 
*(empty — cleared July 12, 2026, aside from the i18n item above)*

## Currently open on the repo roadmap (verified 2026-07-18)
- [ ] Tap-to-target defense (`p1-22`) — with 2+ open attacks after a transfer, tap a card then tap the attack it should cover; single-open-attack stays instant.
- [ ] Inline transfer/beat choice (`p1-23`) — replace the centered modal with small inline Transfer/Beat buttons above the hand.
- [ ] Coach lines in the 📜 log — distinct styling + hide toggle (`p1-25`).
- [ ] Smarter AI with tells (`p2-07`) — per-seat personality variation (one hoards trumps, one attacks recklessly) on top of hesitation delays that already exist; pairs with tysiacha's `p2-31`.
- [ ] Seeded deals + share link (`p2-12`) — confirmed "I'd use this, build it soon" (2026-07-12).
- [ ] Extended stats (`p2-13`) — wins as attacker vs defender, take rate, avg game length, streak, plus placement counts (1st/2nd/…/Durak) — classic W/L semantics stay unchanged.
- [ ] Cosmetics — card backs / table themes, free picker (`p2-32`) — rescoped from a token sink to a free picker after tokens were removed entirely.

*(`b-29`, renaming the stale `spendTokenAndStart()` → `startMatch()`, is a cosmetic internal follow-up, not user-facing — not tracked here.)*

## Triaged → repo roadmap (July 12, 2026, evening — [open-decisions questionnaire](../../archive/questionnaires/durak-open-decisions-july-2026.md))

Fully answered same day, no open items left; questionnaire archived.

- [x] Q1 AI personalities/tells → **p2-07 confirmed** ("named opponents with distinct styles makes the table feel alive") — build it, difficulty alone isn't enough
- [x] Q2 what tokens should buy in durak → **p2-32** (new) — cosmetics: card backs + table themes, durak's first real token sink
- [x] Q3 seeded deals + share link → **p2-12 confirmed** ("I'd use this") — build soon
- [x] Q4 spectate reveal default → **p2-27 unblocked** — separate toggle from Auto Play, default off ("sometimes I want to watch blind like a real game")
