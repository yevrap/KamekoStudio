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
import { STATUSES, evidenceFor, hasResultSection, statusOf, untickedCriteria } from './checks/docs.mjs';

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
  const text = '## Result\n\n- **What changed:** the torque model\n- **Tested by:** the plate suite';
  assert.equal(evidenceFor(text, 'What changed'), 'the torque model');
  assert.equal(evidenceFor(text, 'Tested by'), 'the plate suite');
});

test('evidence may continue on the lines beneath the label', () => {
  const text = [
    '## Result',
    '',
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
  const text = '## Result\n\n- **What changed:**\n- **Tested by:** a suite';
  assert.equal(evidenceFor(text, 'What changed'), '');
});

test('a table or a paragraph under the label counts', () => {
  const text = [
    '## Result',
    '',
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
  const text = '## Result\n\n- **Fix rounds used:** 1 / 2\n\n---\n\n## Something else\n\nnot evidence';
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

test('a ticket with no Result section records nothing, rather than falling back to the file', () => {
  // The fallback was fail-open: with no heading match, evidence came from the
  // raw text with fences and comments *not* stripped, so a ticket could route
  // its evidence through a fenced example simply by omitting the heading — or
  // by spelling it `## Result (final)` or `## result`.
  assert.equal(hasResultSection('- **What changed:** something'), false);
  assert.equal(evidenceFor('- **What changed:** something', 'What changed'), '');
  assert.equal(hasResultSection('## Result\n\n- **What changed:** x'), true);
  assert.equal(hasResultSection('## Result (final)\n\n- **What changed:** x'), true);
  assert.equal(hasResultSection('## result\n\n- **What changed:** x'), true);
});

test('a heading spelled differently is still the Result, and an unclosed fence still hides', () => {
  const body = '- **What changed:** a forged evidence line long enough\n- **Tested by:** another forged line\n';
  const empty = '- **What changed:**\n- **Tested by:**\n';
  for (const heading of ['## Result (final)', '## result', '### Result']) {
    const text = `${heading}\n\n${empty}\n<!--\n## Result\n\n${body}-->\n`;
    assert.equal(evidenceFor(text, 'What changed'), '', heading);
  }
  // An unclosed fence runs to the end of the document when rendered, so it must
  // here too.
  const unclosed = `## Result\n\n${empty}\n\`\`\`md\n## Result\n\n${body}`;
  assert.equal(evidenceFor(unclosed, 'What changed'), '');
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

test('a fence indented by up to three spaces is still a fence', () => {
  // CommonMark allows up to three spaces of indentation before a fence, and it
  // still renders as a code block. The strip pattern was anchored at column
  // zero, so one space defeated it — the same hole as the backtick and `~~~`
  // rounds, moved over by a character.
  const real = '## Result\n\n- **What changed:**\n- **Tested by:**\n';
  for (const indent of ['', ' ', '  ', '   ']) {
    for (const fence of ['```markdown', '~~~']) {
      const text = real + `\n${indent}${fence}\n## Result\n\n`
        + '- **What changed:** a forged evidence line long enough to pass\n'
        + `- **Tested by:** another forged line long enough to pass\n${indent}${fence.slice(0, 3)}\n`;
      assert.equal(evidenceFor(text, 'What changed'), '', `${JSON.stringify(indent)} + ${fence}`);
      assert.equal(evidenceFor(text, 'Tested by'), '', `${JSON.stringify(indent)} + ${fence}`);
    }
  }
});

test('four or more fence characters are still a fence', () => {
  const text = '## Result\n\n- **What changed:**\n\n````\n## Result\n\n- **What changed:** a forged evidence line\n````\n';
  assert.equal(evidenceFor(text, 'What changed'), '');
});

// ---- The status word, and the criteria count -------------------------------

test('the status is read from what a reader sees, not from the raw file', () => {
  // Every evidence and criteria check is gated on the status being `Done`, and
  // the status was matched against the raw text — so a hidden line above the
  // real one forged it to something outside the vocabulary and skipped all of
  // them. The ticket still read "Done" to a person.
  const real = '- **Status:** Done\n';
  assert.equal(statusOf(real), 'Done');
  assert.equal(statusOf(`<!--\n- **Status:** Won't do\n-->\n\n${real}`), 'Done');
  assert.equal(statusOf('```\n- **Status:** Won\'t do\n```\n\n' + real), 'Done');
  assert.equal(statusOf('~~~\n- **Status:** Blocked\n~~~\n\n' + real), 'Done');
  assert.equal(statusOf('   ```\n- **Status:** Blocked\n   ```\n\n' + real), 'Done');
  assert.equal(statusOf(''), '');
  assert.equal(statusOf(null), '');
});

test('an unticked criterion counts whichever bullet it uses', () => {
  // `*` and `+` are valid GFM task-list bullets and render as empty boxes, so a
  // Done ticket with every criterion unticked that way counted as zero.
  assert.equal(untickedCriteria('- [ ] a\n* [ ] b\n+ [ ] c'), 3);
  assert.equal(untickedCriteria('- [x] a\n* [x] b'), 0);
  assert.equal(untickedCriteria('  - [ ] indented'), 1);
  assert.equal(untickedCriteria('- [ ] non-breaking space'), 1);
  // And a criterion hidden in a fence is not a criterion.
  assert.equal(untickedCriteria('```\n- [ ] hidden\n```'), 0);
  assert.equal(untickedCriteria(''), 0);
});
