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
import { STATUSES, evidenceFor } from './checks/docs.mjs';

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

// ---- The three routes the third review found ---------------------------------

test('evidence comes from the Result section, not from a fenced example elsewhere', () => {
  const text = [
    '## Evidence plan',
    '',
    'Fill the Result in like this:',
    '',
    '```markdown',
    '- **What changed:** the files this ticket touched',
    '- **Tested by:** the check that proves it',
    '```',
    '',
    '## Result',
    '',
    '- **What changed:**',
    '- **Tested by:**'
  ].join('\n');
  assert.equal(evidenceFor(text, 'What changed'), '');
  assert.equal(evidenceFor(text, 'Tested by'), '');
});

test('the last Result wins, so a draft cannot answer for the final section', () => {
  const text = [
    '## Result',
    '',
    '- **What changed:** an early draft',
    '',
    '## Result',
    '',
    '- **What changed:**'
  ].join('\n');
  assert.equal(evidenceFor(text, 'What changed'), '');
});

test('a filled final Result is still read when an earlier draft exists', () => {
  const text = '## Result\n\n- **What changed:** a draft\n\n## Result\n\n- **What changed:** the real thing';
  assert.equal(evidenceFor(text, 'What changed'), 'the real thing');
});

test('a ticket with no Result heading falls back to the whole file', () => {
  assert.equal(evidenceFor('- **What changed:** something', 'What changed'), 'something');
});

test('the status vocabulary is closed, so forging the word cannot replace forging evidence', () => {
  // With the status unvalidated, everything below it was gated on the literal
  // word "Done" — so `Done ✅`, `Done.`, `Done (merged)` and `Shipped` all
  // skipped every evidence and criteria check and the ticket reported complete.
  assert.deepEqual(STATUSES, ['Ready', 'In progress', 'Blocked', 'Done', "Won't do"]);
  for (const forged of ['Done ✅', 'Done.', 'Done (merged)', 'Shipped', 'done!']) {
    assert.ok(!STATUSES.some(s => s.toLowerCase() === forged.toLowerCase()), forged);
  }
  // Case is not the point; the vocabulary is.
  assert.ok(STATUSES.some(s => s.toLowerCase() === 'done'));
  assert.ok(STATUSES.some(s => s.toLowerCase() === "won't do"));
});

test('any fence style, and an HTML comment, are stripped before the Result is found', () => {
  // The backtick case was closed a round earlier; `~~~` and `<!-- -->` were the
  // same finding with a different character in it. Each of these places a fake
  // Result *after* the real one, so it would otherwise win as "the last".
  const real = '## Result\n\n- **What changed:**\n- **Tested by:**\n';
  const tilde = real + '\n~~~markdown\n## Result\n\n- **What changed:** the driver and the contract\n- **Tested by:** every attack replayed\n~~~\n';
  const comment = real + '\n<!--\n## Result\n\n- **What changed:** the driver and the contract\n- **Tested by:** every attack replayed\n-->\n';
  const backtick = real + '\n```markdown\n## Result\n\n- **What changed:** the driver and the contract\n```\n';
  for (const [name, text] of [['~~~', tilde], ['<!-- -->', comment], ['```', backtick]]) {
    assert.equal(evidenceFor(text, 'What changed'), '', name);
    assert.equal(evidenceFor(text, 'Tested by'), '', name);
  }
});

test('a fence still works as a fence when the Result genuinely follows it', () => {
  const text = '~~~js\nconst x = 1;\n~~~\n\n## Result\n\n- **What changed:** the torque model and its tests';
  assert.equal(evidenceFor(text, 'What changed'), 'the torque model and its tests');
});
