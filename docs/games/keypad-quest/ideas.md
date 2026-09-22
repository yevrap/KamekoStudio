# Keypad Quest — Improvements

> Idea inbox for [Keypad Quest](README.md). Invest-tier ("fun visualiser and learning things"). Active roadmap: `docs/roadmap.md`.

**Triaged 2026-07-22** into a full sprint scoping pass — this game had no dedicated design documentation before this session. The headline finding: Keypad Quest has no lose condition (waves scale forever, nothing punishes not keeping up) and almost no player agency in the tower-defense half (tower type is streak-automatic, placement is auto-greedy, upgrades are random-automatic). Creative-direction forks (stakes, tower-type choice, upgrade currency, enemy variety, sound, deck content) are in [Keypad Quest Questionnaire — Sprint Direction](../../questionnaires/keypad-quest-sprint-direction.md) — answer there, not here.

- [ ] In-game help/rules overlay — no creative fork, roadmap **p1-52**, ready to ship now (no ❓/howto exists today, unlike Maze Warden/Astro Salon).
- [ ] Player-chosen tower type instead of always the highest streak-unlocked tier — roadmap **p2-45** (new), gated on questionnaire Q2.
- [ ] A real fail/pressure state (currently zero — endless orbiting, no consequence) — roadmap **p2-46** (new), gated on Q1.
- [ ] Second enemy type/behavior (currently one archetype, HP/speed-scaling only) — roadmap **p2-47** (new), gated on Q4.
- [ ] Sound layer (currently zero audio anywhere in the game) — roadmap **p2-48** (new), gated on Q5.
- [ ] More built-in decks beyond World Capitals/Multiplication/Elements — roadmap **p2-49** (new), gated on Q6.
- [ ] Tower upgrades as a real player spend, not automatic-random — roadmap **p2-04**, open since 2026-07-07, now enriched with concrete options, gated on Q3.
- [ ] Visual wave-map interstitial between waves — roadmap **p2-03**, open since before this pass; rescoped in the roadmap note — its original "upcoming enemy types" framing needs enemy variety (p2-47) to mean anything; until then it's really just a wave-stat readout (count/HP/speed delta).
