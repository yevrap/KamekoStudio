# Samovar — design note

**Status:** PROTOTYPE, core mechanic only · built in iteration 08 ([SHS-068](../iterations/08/tickets/SHS-068-samovar-core.md)), second
pass in iteration 09 (glasses of three shapes, [SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md); a forgiving brim and the best evening from
the start, [SHS-073](../iterations/09/tickets/SHS-073-samovar-forgiving-brim.md)) · play it at `studio/games/samovar/`
(the realm's shelf) · epic E2, *the studio's first original game worth playing*
([Direction](../steering/direction.md)).

## What it is

An evening at the tea table. Ten guests come one at a time; each brings a straight tea
glass, a tulip glass or a wide bowl and wants their tea at a strength, shown as a colour
swatch (Light, Golden, Amber, Dark) beside the cup. One button, one thumb: hold to pour the dark brew
from the samovar's teapot, let go; hold again to top up with hot water, let go to serve.
The liquid in the cup is always the colour of what is in it, drawn in the glass's shape,
and its surface sits where that much tea reaches in that glass.

A cup scores 0–3 stars from the gap between the poured and the wanted strength, less one
star if it is short of the dashed fill line at 90 % of the brim (two if it is under three
quarters full), and less one if it went a drop over the brim: up to 8 % of the cup over,
the tea drips down the glass's side. Past that the cup spills, tea runs down both sides,
and it scores nothing; a brew poured over the brim serves at once, since there is no room
left for water. The result card shows the wanted and the poured
colour side by side for a moment, low on the table so the glass's rim and dashed line stay
in view, then the next guest comes. The best evening so far sits under the running stars
from the first screen on. After ten cups: the evening's stars out of 30, the best evening
(a new best says so, a first one included), a strip of each cup's stars, and *Pour again*.

## The hook

Tea is strong or weak by its **ratio**, not its amount. The brew goes in first and the
water only tops it up, so the one real decision is where to stop the brew; once the water
goes in the strength is fixed. The glasses have shapes of their own, a straight tea glass,
a tulip glass and a wide bowl, and every one fills from empty to the brim in the same
2.5 s. They are round, so a slice of tea's volume goes as the square of the glass's width
there: the level climbs slowly where the glass is wide and quickly where it is narrow.
While the brew pours, the liquid is pure brew colour and its level is the cue, so the
right place to stop for one strength is a different height in each glass: about half-way
up the straight glass for Amber, well under half-way in the tulip (its wide lower half
holds the tea low), two thirds of the way up the bowl (its narrow foot fills fast). The
result shows at once as a colour.

Against the genre: pour-the-drink phone games fill one liquid to a line. Here there are two
liquids, a stop that is never drawn and sits at a different height in each glass, and a
brim that punishes by degrees: too much brew leaves no room for the water, too little
leaves the cup pale or short, a drop over costs a star and only a real overflow costs the
cup. No game named in the brief was used as a blueprint.

**Where the hook is weak (sprint 09's review).** Every cup fills in the same time, so one
strength's hold is the same on every glass, and a player can count instead of watching.
The Playtester's player who never looked at the glass and held for the strength times
2.5 s scored 23–26 of 30 on a first evening, better than any first evening played by
watching the level. The shapes can be learned (a player adjusting after each verdict moved
the tulip's stop about 20 points lower within an evening), but counting walks around them.
Backlog #57, on [questionnaire](../steering/questionnaire.md) Q18's ⭐, gives each guest's
pour its own flow from the tap, shown by the stream's thickness, so no fixed hold works and
the level is the cue again. Sprint 08's review found the same weakness in another form:
with one shape for every cup the stop sat at the same share of each cup's height (IR08-1),
which sprint 09's shapes fixed.

## The hypothesis (recorded before the build)

**Sprint 08.** **It is fun if** a player's misses shrink over an evening (they can see the
estimate improving) and they start a second evening straight away. **It is not** if the
cups feel random or the colour match can't be read at a glance on a phone. The Playtester
judged it at iteration 08's review: Iterate (below).

**Sprint 09** (from [SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md), worked out at plan). **It is better than sprint 08 if** no
cup is much harder than another, and a player's misses on the tulip and the bowl shrink
across an evening as they learn where each one's stop sits. **It is not** if the shapes feel
arbitrary, or the liquid's level can't be read in the tulip's narrow top at 320 wide. The
Playtester judges it at iteration 09's review, and says whether players watch the glass or
count seconds.

## Tuning, and why

| Number | Value | Why |
|---|---|---|
| Pour rate | Every cup fills from empty to the brim in 2.5 s (each holds 100 units, poured at 40 units/s), brew and water alike | *Sprint 09 (#52):* the same time on every cup makes the windows fair: three stars on strength is ±125 ms on every cup, where sprint 08's 80 units/s gave ±75 ms on the small cup and ±162 ms on the tall glass. An evening still lasts about a minute |
| Cups | A straight tea glass (half-width `1`), a tulip glass (`1 − 0.42 · sin(π·h / 1.6)`: a wide belly, a waist at 80 % of the height, a slight flare) and a wide bowl (`0.5 + 0.5·h`: the foot half the rim's width), `h` from foot 0 to rim 1, in `constants.js` | *Sprint 09 (#53, Q15 ⭐ A):* one profile per glass, read by the drawing and the rules alike. The three-star brew stop, as built, in % of the glass's height (for a cup topped up to the brim; filling only to the dashed line lowers each stop by a tenth of its volume): **Light** 25 / 14 / 40, **Golden** 40 / 25 / 56, **Amber** 55 / 39 / 69, **Dark** 70 / 56 / 81 for straight / tulip / bowl; the dashed line at 90 / 85.5 / 94. For every strength two glasses' stops are at least 10.5 points apart (a test holds 10). *Review 08, before:* one shape for every cup put the stop at the same share of each cup's height (IR08-1) |
| Strengths | 25 %, 40 %, 55 %, 70 % brew | Four colours far enough apart on the ramp to tell at a glance (a test holds their luminance at least 25 apart) |
| Star bands | within 5 / 10 / 17 points of the wanted ratio | Three stars needs the brew within ±125 ms on every cup (sprint 09); in sprint 08 it was ±75 ms on the small cup and ±162 ms on the tall glass, so small weak cups were the hard ones |
| Fill line | 90 % of the cup's volume, drawn at the height that is in each glass; a drip band of 8 % of the cup over the brim (`DRIP_BAND`) | **The water is now the smaller skill** (sprint 09, #51, [SHS-073](../iterations/09/tickets/SHS-073-samovar-forgiving-brim.md)): stopping anywhere from the dashed line to the brim is free for 250 ms, the next 200 ms over the brim cost one star and show a drip down the glass's side, and only then does the cup spill: 450 ms before a spill, against ±125 ms for three stars on the brew. Letting go at the dashed line with a 200 ms lag lands at 98 % (full); at the brim with a 150–200 ms lag, 106–108 % (a drip, a star less, not a zero). 8 % and not the backlog's first 5 %: a release lag of 150–200 ms is 6–8 % of a 2.5 s fill, so at 5 % letting go at the brim would still spill. That lag is an assumption, not a measurement: sprint 08's Playtester simulated it in headless Chrome, which can't account for touch latency (review 09, IR09-2). Letting go at the brim itself spills from about 220 ms; letting go at the dashed line, as the page's hint says, doesn't spill until 450 ms. Sprint 09's Playtester, releasing at the dashed line, never spilled in about 80 cups, even at a 260 ms lag; a real thumb is the executive's check. The band as built is the table below. *Review 08, before:* the band was as long in time as the three-star brew window, and a miss over the brim cost every star while a strength miss cost one per band (IR08-2) |
| An evening | 10 of the 12 cup-and-strength pairs, drawn without replacement | Every cup and every strength turns up, and no pour is asked twice |

**The brim, as built** (the same on every cup, which all fill in 2.5 s):

| Where the water stops | Share of the cup | Time in it | Costs |
|---|---|---|---|
| The fill band, dashed line to brim | 90–100 % | 250 ms | nothing |
| The drip band, just over the brim | over 100 %, up to 108 % | 200 ms | one star (never below 0), `drip`; a drip runs down the glass's right side, longer the further over |
| Over the drip band | above 108 % | — | the cup: a spill, 0 stars, tea heaped over the rim and down both sides; a hold that passes it serves at once |

Pours are timed from `performance.now()` at press and release, not counted in frames, so a
120 Hz phone pours at the same rate as a 60 Hz one (Active rule 9). Hiding the page or
opening the settings drawer stops a pour where it is (the next hold carries on with the
same liquid) and holds the result card's timer.

## Verdict

**Iterate** (the Playtester, sprint 08 review, 2026-09-24). The loop reads at once and
becomes a skill curve once the player anticipates the stop (one evening 5 → 24 of 30 at
390 wide, 0 → 21 at 320), but a first evening with a normal reaction lag scored 0 of 30:
every cup spilled by a hair, some with the colour matched. What sprint 09 changes, from the
verdict and the review: a forgiving brim (#51), the same fill time on every cup and a result
card that leaves the rim in view (#52), and a decision the cup's size or shape really
changes (#53, Q15). Also noted: an evening lasts about a minute, and the best evening only
shows at its end (#54).

**Done in sprint 09:** #52 and #53, glasses of three shapes filling in the same time
([SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md)); #51, the forgiving brim, a drop over costing a star and showing a drip, and
#54, the best evening under the running stars from the first screen, a first evening above
0 ending as a new best ([SHS-073](../iterations/09/tickets/SHS-073-samovar-forgiving-brim.md)). The evening's length is unchanged, waiting on a Keep.

**Sprint 09's verdicts** (the Playtester, sprint 09 review, 2026-09-24; [review](../iterations/09/review.md)):
**Keep** on the forgiving brim: letting go at the dashed line never spilled, a drop over
cost exactly one star with a drip down the glass, and first evenings scored 8 to 25 of 30
instead of 0. **Keep** on the best evening from the first screen. **Iterate** on the
glasses' shapes: they read apart at 320 and 390 and can be learned, but a player who
counts the hold beats one who watches the glass (above). Next: a flow per guest (#57,
Q18 ⭐ A), and glasses drawn true to their names and aspect (#58).

## What was cut

Out of scope for the core, and waiting on a Keep: progression (harder guests, a tray of
several cups), guest personalities, sugar or lemon, a pour sound, a 3D portal on the
landing page (production code, `shared/3d/`), and the arcade gallery. A tap on the result
card to skip ahead was left out so a thumb still on the button can't brew the next cup by
accident.

## Tests

`tests/studio/samovar.test.mjs`: the rules without a browser (sprint 09 adds the three
profiles, each one's volume-to-height mapping and its inverse, the stops at least 10 % of
a cup apart for every strength, the same fill time on every cup, and the brim at 100 %,
just over, 108 % and just past it with the strength matched, a band off and far off), then in headless Chrome a
full evening poured by real pointer holds (30 of 30 stars, a first best), a spill mid-hold
of either liquid, a pour ending about 4 % over the brim (a drip down the side, one star less, said on the card), a brew let go over the brim
serving at once, the best on the first screen (and none when none is saved), the best evening
surviving a reload under `studio_samovar_best` with no other key written, the pour at two
frame rates, pausing when hidden, the open drawer still holding the result after a hide
and show, Space pouring guest after guest without a Tab, and the layout at 320 and 390 wide with every cup in
both themes: the tea's surface and the dashed line where each glass's profile puts them,
the tea clipped to the glass (tea on its axis near the foot, none just outside a narrower
wall),
and the result card clear of the glass's top 15 %, with a drip and a spill each drawn outside the glass's walls, beside the card and on screen.
