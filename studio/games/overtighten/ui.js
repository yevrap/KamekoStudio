// Overtighten — markup, as pure functions over model state.
//
// Same split as the realm's home page: nothing here touches the document, so
// every rendered state can be built and inspected without a browser. main.js is
// the only file that puts any of it on the page.

/** Attribute and text values are escaped even though every input here is ours. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * The gauge's geometry, in the SVG's own 64-unit box, exported because main.js
 * repaints the fill arc every frame and must not re-derive it. It did, briefly,
 * from a copy of the radius — two numbers for one circle is one edit away from
 * a gauge that no longer matches its own track.
 *
 * The band is a separate, thinner ring *outside* the fill rather than beneath
 * it. Under it, the fill covered the target the moment it reached it, and the
 * first render put the band at a wash colour that was nearly invisible against
 * the track in both themes — the one thing on the gauge the player is aiming
 * at, and it could not be seen.
 */
export const GAUGE = { r: 22, bandR: 29 };
GAUGE.circum = 2 * Math.PI * GAUGE.r;
GAUGE.bandCircum = 2 * Math.PI * GAUGE.bandR;

/** An arc from one fraction of the circle to another, as a dash pair. */
export function arcDash(from, to, circumference) {
  return `${Math.max(0, to - from) * circumference} ${circumference}`;
}

/**
 * One bolt: a button, a gauge ring, and a hex head.
 *
 * The gauge is an SVG arc rather than a CSS gradient because the band marker has
 * to sit on the same track as the fill, at a fraction the model supplies. The
 * whole control is one button, so a tap anywhere on the bolt turns it.
 */
export function boltMarkup(bolt, state) {
  const value = Math.round(state.value);
  return [
    `<button type="button" class="bolt is-${escapeHtml(state.state)}" data-bolt="${escapeHtml(bolt.id)}"`,
    ` style="--bx:${bolt.x};--by:${bolt.y}"`,
    ` aria-describedby="bolt-readout-${escapeHtml(bolt.id)}">`,
    `<svg class="gauge" viewBox="0 0 64 64" aria-hidden="true">`,
    `<circle class="track" cx="32" cy="32" r="${GAUGE.r}"></circle>`,
    `<circle class="band-track" cx="32" cy="32" r="${GAUGE.bandR}"></circle>`,
    `<circle class="band" cx="32" cy="32" r="${GAUGE.bandR}"`,
    ` stroke-dasharray="${arcDash(state.bandStart, state.bandEnd, GAUGE.bandCircum)}"`,
    ` stroke-dashoffset="${-state.bandStart * GAUGE.bandCircum}"></circle>`,
    `<circle class="fill" cx="32" cy="32" r="${GAUGE.r}"`,
    ` stroke-dasharray="${arcDash(0, state.fill, GAUGE.circum)}" stroke-dashoffset="0"></circle>`,
    `</svg>`,
    `<span class="head" aria-hidden="true"></span>`,
    `<span class="sr-only">Bolt ${escapeHtml(bolt.id.toUpperCase())}</span>`,
    `</button>`,
    // The readout is a sibling rather than button content: it changes on every
    // frame while a bolt is held, and a live region inside the control the user
    // is pressing is announced over the top of itself.
    `<span class="readout mono" id="bolt-readout-${escapeHtml(bolt.id)}" data-readout="${escapeHtml(bolt.id)}"`,
    ` style="--bx:${bolt.x};--by:${bolt.y}">${value} · ${escapeHtml(stateWord(state.state))}</span>`
  ].join('');
}

/** What a bolt's state is called in the interface. One word, no punctuation. */
export function stateWord(state) {
  return { loose: 'loose', seated: 'seated', over: 'over', stripped: 'stripped' }[state] ?? state;
}

/** The coupling lines, drawn once per pair rather than once per direction. */
export function linkMarkup(plate) {
  const drawn = new Set();
  const lines = [];
  for (const bolt of plate.bolts) {
    for (const id of bolt.links) {
      const key = [bolt.id, id].sort().join('|');
      if (drawn.has(key)) continue;
      drawn.add(key);
      const other = plate.bolts.find(b => b.id === id);
      if (!other) continue;
      // Rounded: `0.28 * 100` is 28.000000000000004, and a seventeen-digit
      // coordinate in the markup helps nobody.
      const at = value => Number((value * 100).toFixed(3));
      lines.push(`<line x1="${at(bolt.x)}" y1="${at(bolt.y)}" x2="${at(other.x)}" y2="${at(other.y)}"></line>`);
    }
  }
  return `<svg class="links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines.join('')}</svg>`;
}

/** The whole plate: the coupling lines underneath, the bolts on top. */
export function plateMarkup(plate, state) {
  const byId = new Map(state.bolts.map(b => [b.id, b]));
  const bolts = plate.bolts.map(b => boltMarkup(b, byId.get(b.id))).join('');
  return `${linkMarkup(plate)}${bolts}`;
}

/**
 * The status line. It says what is left, not how well you are doing: a plate is
 * either seated or it is not, and a score would be a progression layer this
 * experiment deliberately does not have.
 */
export function statusLine(plate, state) {
  if (state.outcome === 'stripped') return 'A thread is stripped. This plate is finished.';
  if (state.outcome === 'solved') return 'Every bolt seated. The plate is true.';
  const left = plate.bolts.length - state.seatedCount;
  const over = state.bolts.filter(b => b.state === 'over').length;
  const parts = [`${left} of ${plate.bolts.length} still out`];
  if (over) parts.push(`${over} past the band — turn a neighbour to back ${over === 1 ? 'it' : 'them'} off`);
  return parts.join(' · ');
}

/** The plate picker. A locked plate is present and unpickable, never hidden. */
export function pickerMarkup(plates, { currentIndex, cleared, isUnlocked }) {
  return plates.map((plate, i) => {
    const unlocked = isUnlocked(i, cleared);
    const current = i === currentIndex;
    const done = i < cleared;
    const classes = ['pick', current ? 'is-current' : '', done ? 'is-done' : ''].filter(Boolean).join(' ');
    return [
      `<button type="button" class="${classes}" data-plate="${i}"`,
      unlocked ? '' : ' disabled',
      current ? ' aria-current="true"' : '',
      `>`,
      `<span class="pick-name">${escapeHtml(plate.name)}</span>`,
      `<span class="pick-note mono">${unlocked ? (done ? 'seated' : 'open') : 'locked'}</span>`,
      `</button>`
    ].join('');
  }).join('');
}
