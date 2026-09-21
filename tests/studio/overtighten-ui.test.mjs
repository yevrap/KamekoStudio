// Overtighten — the markup, without a browser.
//
// The page is driven end to end by the `studio-boot` check; this file covers
// the states that are awkward to reach by driving — a stripped bolt, a locked
// plate, a title with a bracket in it — and the arithmetic behind the gauge,
// which is the one place a silent off-by-one would look like a design choice.

import test from 'node:test';
import assert from 'node:assert/strict';
import { PLATES } from '../../studio/games/overtighten/constants.js';
import { boltState, initialTorque, plateState } from '../../studio/games/overtighten/gameplay.js';
import {
  GAUGE, arcDash, boltMarkup, escapeHtml, linkMarkup, pickerMarkup, plateMarkup, statusLine, stateWord
} from '../../studio/games/overtighten/ui.js';
import { isUnlocked } from '../../studio/games/overtighten/state.js';

const BOLT = { id: 'a', x: 0.3, y: 0.5, lo: 40, hi: 60, strip: 100, links: ['b'] };

test('the gauge geometry is one set of numbers, not two', () => {
  assert.equal(GAUGE.circum, 2 * Math.PI * GAUGE.r);
  assert.equal(GAUGE.bandCircum, 2 * Math.PI * GAUGE.bandR);
  assert.ok(GAUGE.bandR > GAUGE.r, 'the band ring must sit outside the fill, or the fill hides it');
  // The whole gauge has to fit the 64-unit box it is drawn in, band stroke included.
  assert.ok(GAUGE.bandR + 2 <= 32, 'the band ring is clipped by its own viewBox');
});

test('an arc of nothing is nothing, and a full arc is the whole circle', () => {
  assert.equal(arcDash(0, 0, 100), '0 100');
  assert.equal(arcDash(0, 1, 100), '100 100');
  assert.equal(arcDash(0.25, 0.75, 100), '50 100');
  assert.equal(arcDash(0.75, 0.25, 100), '0 100', 'a reversed arc draws nothing rather than wrapping');
});

test('a bolt renders as one button, with the readout outside it', () => {
  const markup = boltMarkup(BOLT, boltState(BOLT, 50));
  assert.match(markup, /<button type="button" class="bolt is-seated" data-bolt="a"/);
  assert.match(markup, /aria-describedby="bolt-readout-a"/);
  assert.match(markup, /data-readout="a"[^>]*>50 · seated</);
  // One button per bolt: the gauge and the head are inside it, so a tap
  // anywhere on the bolt turns it rather than missing between two elements.
  assert.equal((markup.match(/<button/g) || []).length, 1);
  assert.ok(markup.indexOf('data-readout') > markup.indexOf('</button>'));
});

test('each bolt state reaches the markup as its own class and word', () => {
  for (const [value, state] of [[10, 'loose'], [50, 'seated'], [80, 'over'], [120, 'stripped']]) {
    assert.match(boltMarkup(BOLT, boltState(BOLT, value)), new RegExp(`class="bolt is-${state}"`));
    assert.equal(stateWord(state), state);
  }
  assert.equal(stateWord('something-new'), 'something-new', 'an unknown state is shown, not swallowed');
});

test('the readout rounds rather than printing a float', () => {
  assert.match(boltMarkup(BOLT, boltState(BOLT, 49.6)), />50 · seated</);
});

test('a coupling is drawn once, not once per direction', () => {
  const plate = {
    bolts: [
      { id: 'a', x: 0, y: 0, links: ['b'] },
      { id: 'b', x: 1, y: 1, links: ['a'] }
    ]
  };
  assert.equal((linkMarkup(plate).match(/<line/g) || []).length, 1);
});

test('a link to a bolt that does not exist is skipped rather than drawn to nowhere', () => {
  const plate = { bolts: [{ id: 'a', x: 0, y: 0, links: ['ghost'] }] };
  assert.equal((linkMarkup(plate).match(/<line/g) || []).length, 0);
});

test('every shipped plate renders a button per bolt', () => {
  for (const plate of PLATES) {
    const markup = plateMarkup(plate, plateState(plate, initialTorque(plate)));
    assert.equal((markup.match(/<button/g) || []).length, plate.bolts.length, plate.id);
  }
});

test('the status line says what is left, and names the problem you cannot fix directly', () => {
  const plate = PLATES[1];
  const fresh = plateState(plate, initialTorque(plate));
  assert.match(statusLine(plate, fresh), /4 of 4 still out/);

  const over = plateState(plate, Object.fromEntries(plate.bolts.map(b => [b.id, b.strip - 1])));
  assert.match(statusLine(plate, over), /past the band — turn a neighbour/);
  assert.match(statusLine(plate, over), /them off/, 'more than one reads as plural');

  const one = { ...Object.fromEntries(plate.bolts.map(b => [b.id, 50])), a: plate.bolts[0].hi + 5 };
  assert.match(statusLine(plate, plateState(plate, one)), /back it off/, 'exactly one reads as singular');
});

test('the status line reports the two endings and does not count during them', () => {
  const plate = PLATES[0];
  const stripped = plateState(plate, { a: 500, b: 50 });
  assert.match(statusLine(plate, stripped), /thread is stripped/i);
  const solved = plateState(plate, Object.fromEntries(plate.bolts.map(b => [b.id, b.lo])));
  assert.match(statusLine(plate, solved), /Every bolt seated/);
});

test('a locked plate is rendered and disabled, never hidden', () => {
  const markup = pickerMarkup(PLATES, { currentIndex: 0, cleared: 0, isUnlocked });
  assert.equal((markup.match(/<button/g) || []).length, PLATES.length, 'every plate is on the page');
  assert.equal((markup.match(/ disabled/g) || []).length, PLATES.length - 1);
  assert.match(markup, /aria-current="true"/);
  assert.match(markup, />locked</);
});

test('a cleared plate is marked seated and stays pickable', () => {
  const markup = pickerMarkup(PLATES, { currentIndex: 2, cleared: PLATES.length, isUnlocked });
  assert.equal((markup.match(/ disabled/g) || []).length, 0);
  assert.equal((markup.match(/>seated</g) || []).length, PLATES.length);
});

test('markup escapes its inputs even though every input is ours', () => {
  assert.equal(escapeHtml('<img src=x onerror=1>'), '&lt;img src=x onerror=1&gt;');
  assert.equal(escapeHtml(`"'&`), '&quot;&#39;&amp;');
  assert.equal(escapeHtml(null), '');
  const markup = pickerMarkup([{ name: '<script>alert(1)</script>' }], {
    currentIndex: 0, cleared: 0, isUnlocked
  });
  assert.ok(!markup.includes('<script>'), 'a plate name reached the page as markup');
  assert.match(markup, /&lt;script&gt;/);
  const bolt = boltMarkup({ ...BOLT, id: 'a" onfocus="x' }, boltState(BOLT, 10));
  assert.ok(!bolt.includes('onfocus="x"'), 'a bolt id escaped its attribute');
});

test('a coupling line carries no floating-point noise', () => {
  // `0.28 * 100` is 28.000000000000004.
  const markup = linkMarkup({ bolts: [{ id: 'a', x: 0.3, y: 0.28, links: ['b'] }, { id: 'b', x: 0.7, y: 0.72, links: ['a'] }] });
  assert.ok(!/\d{6,}/.test(markup), `a coordinate carries float noise: ${markup}`);
});

test('a coupling line runs between the two bolts it couples, not between transposed points', () => {
  // The third review swapped x for y in `linkMarkup` and nothing noticed: the
  // existing tests counted `<line>` elements and never read a coordinate. The
  // line is the only statement the plate makes about which bolt pulls on which,
  // so drawing it from the wrong point is a lie the player has no way to check.
  const plate = {
    bolts: [
      { id: 'a', x: 0.3, y: 0.28, links: ['b'] },
      { id: 'b', x: 0.7, y: 0.72, links: ['a'] }
    ]
  };
  const markup = linkMarkup(plate);
  assert.match(markup, /x1="30"/);
  assert.match(markup, /y1="28"/);
  assert.match(markup, /x2="70"/);
  assert.match(markup, /y2="72"/);
  // Transposing is the specific defect, so name it: with x and y swapped the
  // first point would read x1="28" y1="30".
  assert.ok(!markup.includes('x1="28"'), 'the line starts from a transposed point');
});

test('every shipped plate draws each line between its real bolt positions', () => {
  for (const plate of PLATES) {
    const markup = linkMarkup(plate);
    const drawn = [...markup.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g)];
    for (const [, x1, y1, x2, y2] of drawn) {
      const from = plate.bolts.find(b => Math.abs(b.x * 100 - Number(x1)) < 0.01 && Math.abs(b.y * 100 - Number(y1)) < 0.01);
      const to = plate.bolts.find(b => Math.abs(b.x * 100 - Number(x2)) < 0.01 && Math.abs(b.y * 100 - Number(y2)) < 0.01);
      assert.ok(from, `${plate.id}: a line starts at (${x1}, ${y1}), which is no bolt`);
      assert.ok(to, `${plate.id}: a line ends at (${x2}, ${y2}), which is no bolt`);
      assert.ok(from.links.includes(to.id), `${plate.id}: a line joins ${from.id} and ${to.id}, which are not coupled`);
    }
    assert.equal(drawn.length, new Set(plate.bolts.flatMap(b => b.links.map(id => [b.id, id].sort().join('|')))).size);
  }
});
