# Black Hole in One — Orbit Tuning Questionnaire

> **Status: ANSWERED & ARCHIVED July 15, 2026 — all three defaults, no code change.** Q1 = frequent is right (keep the ~28% capture rate), Q2 = toast + free speed is enough (**no ⭐ on orbit — that BH-1 follow-up is declined**), Q3 = keep orbit-into-cup. The shipped v27 behavior is confirmed correct as-is; nothing to build. Mechanic + spec: [Black Hole in One](../../games/black-hole-in-one/README.md) "Orbits" · [Black Hole in One — Stable Orbits Exploration](../plans/black-hole-in-one-stable-orbits-exploration.md).

**Context:** an automated aim-sweep found orbits reachable on all holes, with **~28% of tee shots settling into an orbit**. That's frequent — which fits "I want orbits and complicated motion to be prominent," but it's a dial. The knobs are `ORBIT_SPEED_TOL` and `ORBIT_RADIAL_TOL` in `constants.js` (wider = easier to capture, more orbits; tighter = orbits become a rarer, more-earned flourish).

**Q1. How often should orbits happen?**

- [x] **Frequent is right — keep it** *(default — matches "I want more of this")*
- [ ] A bit less often — make orbits feel more *earned* (tighten the capture band)
- [ ] Even more often — I want to be flinging between orbits constantly (widen it)
- [ ] Write-in:

**Q2. Should an orbit reward you?** Right now it's a "🛰 ORBIT!" toast + a free tangential launch (you keep orbital speed). No score effect.

- [x] **Toast + free speed is enough** *(default)* — it's already a nice tactical option
- [ ] Bank a ⭐ style star when BH-1 ships (I answered Q2 of the polish questionnaire = style stars — orbits should count)
- [ ] Mark orbited holes on the scorecard like planet-hops (🛰)
- [ ] Write-in:

**Q3. Orbit-into-the-cup.** An orbit that skims the black hole sinks the comet (a lucky ace-ish finish). Keep that?

- [x] **Keep — emergent and delightful** *(default)*
- [ ] Remove — an orbit shouldn't sink you by accident
- [ ] Write-in:

---

*When answered: the picks become a small tuning ship (constants + optional ⭐/scorecard hook) and this note archives to `docs/archive/`.*
