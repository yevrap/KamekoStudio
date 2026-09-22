# Materials Run — Improvements

> Idea inbox for [Materials Run](README.md). Invest-tier ("I like the mechanic and somewhat chaotic play"). Active roadmap: `docs/roadmap.md`.

**Triaged 2026-07-22** into a full modernization pass — visual/juice polish (roadmap **p1-42…p1-47**) plus mechanic depth (**p2-06, p2-37…p2-39**). Materials Run turned out to be the one Invest-tier game with zero visual-effects layer (no particles, trail, impact feedback, or sound anywhere), which is the main gap behind "make it feel more modern." Creative-direction forks (combo intensity, new-enemy behavior, sound scope, visual-identity scope) are in [Materials Run Questionnaire — Modernization Direction](../../questionnaires/materials-run-modernization.md) — answer there, not here.

- [ ] Add material combo mechanics (e.g. crossing ice then sand creates a skid) — roadmap **p2-06**, still open. Implementation path is now concrete (reuses the crossing-detection hook p1-44 ships); intensity gated on the questionnaire (Q1).
- [ ] Better pathfinding (e.g., A* or larger lookahead) for Auto Play Bot — the greedy Pathfinder Bot itself shipped **p2-25** (2026-07-11, `72cd18a`); this follow-up is now **p2-39**, still open, correctly lower priority (spectate/Watch Mode quality, not core player feel).
- [ ] more full screen on phone — now **p1-47**, still open. Agent verifies what's actually cramped on a real phone viewport before fixing (not yet confirmed whether it's a CSS layout gap or a missing Fullscreen API toggle).
