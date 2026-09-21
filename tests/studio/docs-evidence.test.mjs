// `docs-current` decides whether a Done ticket actually records its evidence.
// It used `\s*(.*)` after the label, and `\s` matches a newline — so the
// capture ate the line break and returned the *next line* as the answer. An
// entirely unfilled Result section passed: "**What changed:**" was satisfied by
// the literal text "- **Tested by:**" underneath it, and a ticket shipped Done
// with an empty template while the check reported it complete.
//
// The case that matters is the empty one, so it is first.

import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenceFor } from './checks/docs.mjs';

const EMPTY_TEMPLATE = [
  '## Result',
  '',
  '*Filled in as the ticket is worked. Empty until then.*',
  '',
  '- **What changed:**',
  '- **Tested by:**',
  '- **Deferred:**',
  '- **Fix rounds used:** 0 / 2'
].join('\n');

test('an unfilled template records nothing, whatever follows the label', () => {
  assert.equal(evidenceFor(EMPTY_TEMPLATE, 'What changed'), '');
  assert.equal(evidenceFor(EMPTY_TEMPLATE, 'Tested by'), '');
  assert.equal(evidenceFor(EMPTY_TEMPLATE, 'Deferred'), '');
});

test('a label on the same line as its evidence is read', () => {
  const text = '- **What changed:** the torque model\n- **Tested by:** the plate suite';
  assert.equal(evidenceFor(text, 'What changed'), 'the torque model');
  assert.equal(evidenceFor(text, 'Tested by'), 'the plate suite');
});

test('evidence may continue on the lines beneath the label', () => {
  const text = [
    '- **What changed:**',
    '  - `gameplay.js` — the torque rules',
    '  - `state.js` — progress',
    '- **Tested by:** 21 tests'
  ].join('\n');
  assert.match(evidenceFor(text, 'What changed'), /gameplay\.js/);
  assert.match(evidenceFor(text, 'What changed'), /state\.js/);
  assert.equal(evidenceFor(text, 'Tested by'), '21 tests');
});

test('one label never borrows the next label as its answer', () => {
  // The defeat case, stated directly: the bug was that this returned
  // "- **Tested by:**".
  const text = '- **What changed:**\n- **Tested by:** a suite';
  assert.equal(evidenceFor(text, 'What changed'), '');
});

test('a table or a paragraph under the label counts', () => {
  const text = [
    '- **Tested by:** each mutation applied and reverted:',
    '',
    '  | # | Mutation | Result |',
    '  |---|---|---|',
    '  | 1 | script tag removed | fails |',
    '',
    '- **Deferred:** nothing'
  ].join('\n');
  assert.match(evidenceFor(text, 'Tested by'), /script tag removed/);
  assert.equal(evidenceFor(text, 'Deferred'), 'nothing');
});

test('evidence stops at a heading or a rule, not only at the next label', () => {
  const text = '- **Fix rounds used:** 1 / 2\n\n---\n\n## Something else\n\nnot evidence';
  assert.equal(evidenceFor(text, 'Fix rounds used'), '1 / 2');
});

test('a label that is not there records nothing rather than throwing', () => {
  assert.equal(evidenceFor('', 'What changed'), '');
  assert.equal(evidenceFor('## Result\n\nnothing here', 'What changed'), '');
});
