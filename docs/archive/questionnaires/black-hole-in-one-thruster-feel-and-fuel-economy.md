# Black Hole in One — Thruster Feel & Fuel Economy Questionnaire

> **Status: ANSWERED & CONSUMED — sprint shipped and closed 2026-07-17.** All five questions answered the same day they were opened; FUEL-1, INV-3c, and FUEL-2 all shipped against these answers (see [Improvements](../../games/black-hole-in-one/ideas.md)'s ⛽ Fuel Economy & Thruster Feel sprint and [Dev Log](../dev-logs/black-hole-in-one.md)). Q5's flying-vs-flicking verdict is logged in [Kameko Playtest Log](../../playtest-log.md) (agent-observed, flagged for Yev to confirm). Archived here 2026-07-17.
>
> Opened 2026-07-17, triaged from four raw Inbox lines you added the same evening INV-3b (the floating stick) shipped. All four are Explore/Thruster flight-feel and fuel-economy feedback — real playtest signal arriving right as [Black Hole in One — Thruster & Flight Controls](../plans/black-hole-in-one-thruster-and-flight-controls.md)'s INV-3c ("feel pass + the verdict") was coming up next. This questionnaire is the front door to that improvement sprint: your answers below decide what INV-3c (and a couple of new fuel-economy items) actually build. One item is *not* gated on this at all — see the bug note before Q1.
>
> Each question has a stated default the agents will use if it's still blank when the sprint ships. Fill in whenever — nothing here is urgent.

## Not gated — already root-caused, shipping regardless of your answers

**"Running out of fuel makes you stuck. Even when I turn off endless flight."** Read the code before asking you anything: `shouldTowHome(fuel, inventory, phase)` in `explore.js` only forces a tow-home from `phase === 'rest'` when the Thruster item is off (the flick scheme's rest-gated tow, kept deliberately narrow so an immediate tow can't yank you out of a flick you just paid for). But **`'orbit'` phase was never added to that check** — if a near-circular pass snaps you into a station-kept orbit (BH-4's mechanic, live in Explore too) and your tank hits 0 while Thruster is off, there's no fuel left to flick your way out *and* no tow-home trigger fires, because you're not at `'rest'`. You're stuck spinning around that planet forever. That's a real bug, independent of any design opinion, and it's agent-shippable without more input from you: **FUEL-1** below.

**Q1. Does that match what you were hitting, or is there a different "stuck" you meant?** (Doesn't block the fix — it ships regardless — but tell me if I've got the wrong scenario so I don't close this out on a false diagnosis.)
- [ ] **Yes, that's it — the orbit case.** *(default; ships as diagnosed)*
- [ ] No — I meant something else, here's what actually happened:
- [ ] Both — the orbit case, plus something else too:
- [x] Once out of fuel I want the reset button to light up or something to indicate that that's the only option left. I don't need auto go back to town

> **Resolved 2026-07-17.** No auto-tow, anywhere, regardless of phase or the Thruster toggle. This **reverses INV-3a's T8 decision** ([Black Hole in One — Thruster & Flight Controls](../plans/black-hole-in-one-thruster-and-flight-controls.md): "tow home immediately at 0, mid-flight or not") as well as the flick-scheme's rest-gated tow — both are removed, not just patched for the orbit-phase gap. Empty fuel now just means you're stranded wherever you are (no more launches or thrust, exactly as today's fuel-gating already enforces on `launch()`/`step()`), and the restart button lights up / pulses so it reads as the way out instead of the player waiting for a teleport that no longer comes. See **FUEL-1** in [Improvements](../../games/black-hole-in-one/ideas.md) for the rescoped item.

## Q2. Refuel stations

Your words: *"I want way more refuel stations planets. So that when I bounce around some of them refuel me."* Today, fuel only comes from small floating pickups seeded 0–2 per chunk (`getChunkPickups()`) — ordinary planets have no fuel effect at all, bounce or land. You're asking for planets themselves to refuel you, which is a different, new mechanic (a `refuelStation` flag on a body, checked in the bounce/land collision path), not just more pickups.

**How should a refuel-station planet actually work?**
- [ ] **Any bounce or landing tops you up a little** *(default)* — matches "bounce around" literally; frequent, small, forgiving; a body flagged `refuelStation` in the chunk generator, checked in `collide()`
- [ ] Landing only (resting on it), bigger refill — more deliberate "make it to the station" moments, closer to the existing Town mechanic
- [ ] Both bounce (small trickle) and landing (full top-up) — bounce keeps you alive mid-flight, landing is the real refuel
- [x] Write-in: some planets should fully refuel you when you land on them. i want them to be numerous so exploring without unlimited fuel is possible. 

**How common should they be?**
- [x] **Common — most chunks have one** *(default)* — removes fuel anxiety almost entirely, closer to "never think about fuel" than a scarce resource
- [ ] Uncommon — a landmark you route toward, not something you stumble into
- [ ] Write-in:

**Should they be visually distinct** (so you can spot and aim for one), or a surprise you discover by bumping into it?
- [x] **Visually distinct** *(default)* — a glow/color tell like the Town beacon already has, so "route toward a refuel planet" is a real piloting decision
- [ ] Surprise — no tell, part of the exploration
- [ ] Write-in:

## Q3. Thruster power & handling

Your words: *"It feels too fast and I don't like that I can't get out of some gravity."* Both are real, documented properties of what shipped, not bugs — this is exactly the feedback INV-3c's feel-pass was waiting for:

- **"Too fast"** — full throttle hits the `MAX_V=175` speed cap in ~0.44s. Below that cap the design doc predicted the throttle would feel "binary" — mash the stick and you're instantly at top speed, so the analog range only shows up as a live negotiation *near a planet's gravity*, not in open space. That's apparently landing as "too fast" rather than "responsive."
- **"Can't get out of some gravity"** — also predicted, and previously filed as "a good failure mode": `gravityAt()` clamps pull at 625 u/s² once you're close enough to a body's center (deep in its collision zone), which beats `THRUST_A=400` outright. No amount of throttle escapes that specific spot. In practice, that reads as "stuck," not "a fair hazard."

**What should change?**
- [x] **Lower `THRUST_A` (softer accel, more control, slower top-speed ramp) *and* raise the escape floor** so no ordinary gravity well can out-pull full thrust *(default — addresses both complaints directly)*
- [ ] Keep the numbers, but smooth the *ramp* — same top speed, less "instant-on" feel (e.g. a short accel curve instead of a flat `THRUST_A`)
- [ ] Keep the current tuning entirely — some planets should be genuinely inescapable without help; that becomes a hazard to route around, not a bug (pairs with Q4's skill tree as the actual fix — upgrades let you eventually beat it)
- [ ] Write-in:

**Should raw thrust ever be enough to beat every planet, with no upgrade required** — or is "you need an upgrade to escape the biggest planets" fine as intended friction?
- [x] **Base thrust should beat everything on its own** *(default)* — upgrades make you faster/more efficient, not "finally not stuck"
- [ ] Fine for base thrust to lose sometimes — that's what the skill tree (Q4) is for

## Q4. Rocket upgrade skill tree

Your words: *"Upgrades for rocket so that it can fly better. Maybe like a skill tree that can alter settings like thruster strength and allow you to escape all gravity."* There's already a Town Shop upgrade pattern (Fuel Tank / Fuel Siphon / Long-Range Sensor, three tiers each, stardust-priced) the Thruster could plug straight into.

**How big a feature is this, to start?**
- [ ] **Small — one or two new Town Shop tiers, same pattern as Tank/Siphon/Sensor** *(default)* — e.g. "Thrust Power" (raises `THRUST_A` per level) and "Thrust Efficiency" (lowers `THRUST_BURN` per level); no new UI, no branching, just two more rows in the shop you already have
- [ ] Bigger — an actual branching skill tree with its own screen/UI, meaningfully different from a shop list
- [x] Not now — park the idea; let Q3's base-tuning answer be the whole fix for this sprint
- [ ] Write-in:

**If small (the default): what should the tiers actually unlock?** (Pick as many as you want)
- [ ] **Thrust Power** — raises `THRUST_A` per level, more accel and a higher effective "escape any gravity" threshold
- [ ] **Thrust Efficiency** — lowers `THRUST_BURN` per level, more flight time per tank
- [ ] **Handling** — softens the accel ramp (pairs with Q3's "smooth the ramp" option) rather than raising top-line power
- [ ] Write-in:

## Q5. Where does INV-3c's verdict fit now?

INV-3c's original deliverable was a written verdict in [Kameko Playtest Log](../../playtest-log.md): *is Explore better as a flying game than a flicking game?* Your feedback lands squarely on tuning, not on the flying-vs-flicking question itself — the concept might read very differently once Q2–Q4 ship.

- [x] **Hold the verdict until after this improvement sprint ships** *(default)* — tune first, judge the concept on the tuned version, not the rough-cut one
- [ ] Write the verdict now, on what's live today, and revisit if the tuning changes your mind
- [ ] Write-in:
