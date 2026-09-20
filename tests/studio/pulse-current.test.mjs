// The realm's home page states which iteration the company is on. That line is
// the one thing on the page that goes out of date by itself — every iteration
// that ships past it makes it a lie — so it is tied to the repository's own
// record rather than trusted.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PULSE, LEARNED } from '../../studio/shelf-data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** The iteration directories, as two-digit strings, in order. */
function iterationDirs() {
  return readdirSync(path.join(ROOT, 'docs/studio/iterations'), { withFileTypes: true })
    .filter(e => e.isDirectory() && /^\d{2}$/.test(e.name))
    .map(e => e.name)
    .sort();
}

/** Iterations with a changelog section, newest last. */
function changelogIterations() {
  const text = readFileSync(path.join(ROOT, 'docs/studio/CHANGELOG.md'), 'utf8');
  return [...text.matchAll(/^##\s*\[studio-iteration-(\d{2})\]/gm)].map(m => m[1]).sort();
}

test('the pulse line names the newest iteration in the repository', () => {
  const newest = iterationDirs().at(-1);
  assert.ok(newest, 'no iteration directories found');
  assert.equal(PULSE.iteration, newest,
    `the home page says iteration ${PULSE.iteration}, the repository's newest is ${newest}`);
});

test('the changelog is never ahead of the pulse line', () => {
  // The page may be one iteration ahead while that iteration is being built —
  // its changelog entry is written at the end. It may never be behind: that
  // would mean something shipped and the realm still advertises the last one.
  const shipped = changelogIterations().at(-1);
  if (!shipped) return;
  assert.ok(shipped <= PULSE.iteration,
    `the changelog records iteration ${shipped} but the home page still says ${PULSE.iteration}`);
});

test('the pulse line is complete: an iteration, a date and a sentence', () => {
  assert.match(PULSE.iteration, /^\d{2}$/);
  assert.match(PULSE.shipped, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(PULSE.summary.trim().length > 20, 'the pulse summary says nothing');
});

test('the retro line names the newest iteration that has written a retro', () => {
  // PULSE may run one iteration ahead of the changelog while that iteration is
  // being built. LEARNED may not: it quotes a retrospective, and a retro exists
  // only once the iteration it belongs to is being closed out.
  const withRetro = iterationDirs()
    .filter(n => existsSync(path.join(ROOT, 'docs/studio/iterations', n, 'retro.md')))
    .at(-1);
  assert.ok(withRetro, 'no iteration has a retro');
  assert.equal(LEARNED.iteration, withRetro,
    `the page quotes iteration ${LEARNED.iteration}'s retro, but iteration ${withRetro} has since written one`);
  assert.ok(LEARNED.line.trim().length > 20, 'the retro line says nothing');
});
