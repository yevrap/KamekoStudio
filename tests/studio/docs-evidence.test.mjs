// How a ticket is read — and why it is no longer read as Markdown.
//
// Ten rounds of independent review defeated this check ten times, and every
// fix but the last was the same bet: that the checker could work out which text
// a reader sees. First it stripped hiding places out of the document —
// backticks, `~~~`, HTML comments, indented fences, `<script>`. Then it scanned
// the document as CommonMark. Stripping deleted text that renders, which
// promoted a draft Result over the real one. Scanning missed a comment inside a
// blockquote, an HTML block interrupting a paragraph, and a nested list's
// indentation.
//
// The surface is the whole of CommonMark and this is not a CommonMark
// implementation, so it stopped competing. **A ticket declares each thing
// exactly once**, counted in the raw file. A second declaration is a failure
// wherever it is and however it is hidden — which is the same shape as the
// status rule, the one rule here that was never defeated.
//
// Every payload that beat a previous version is below. They all beat it by
// adding a second declaration, so they are all caught by one rule.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUSES, evidenceFor, labelCount, resultHeadingCount, statusLineCount, statusOf, untickedCriteria
} from './checks/docs.mjs';

const REAL = '- **Status:** Done\n\n## Result\n\n- **What changed:**\n- **Tested by:**\n';
const FORGED = '## Result\n\n- **What changed:** forged evidence long enough to pass\n'
  + '- **Tested by:** forged evidence long enough to pass\n';

/** Every way ten rounds of review found to hide a second declaration. */
const HIDING_PLACES = {
  'an HTML comment': t => `<!--\n${t}-->\n`,
  'a backtick fence': t => `\`\`\`\n${t}\`\`\`\n`,
  'a tilde fence': t => `~~~\n${t}~~~\n`,
  'an indented fence': t => `   \`\`\`\n${t}   \`\`\`\n`,
  'a tab-indented fence': t => `\t\`\`\`\n${t}\`\`\`\n`,
  'a backtick info string': t => `\`\`\`x\`y\n${t}\`\`\`\n`,
  'a script block': t => `<script>\n${t}</script>\n`,
  'a script interrupting a paragraph': t => `Notes.\n<script>\n${t}</script>\n`,
  'a display:none div': t => `<div style="display:none">\n${t}</div>\n`,
  'a table cell': t => `<table><tr><td>\n${t}</td></tr></table>\n`,
  'a blockquote': t => t.split('\n').map(l => (l ? `> ${l}` : '>')).join('\n') + '\n',
  'a blockquoted comment': t => `> <!--\n${t.split('\n').map(l => `> ${l}`).join('\n')}\n> -->\n`,
  'an unclosed fence': t => `\`\`\`\n${t}`
};

test('a second Result, hidden any of ten ways, is a second Result', () => {
  for (const [name, hide] of Object.entries(HIDING_PLACES)) {
    const doc = REAL + '\n' + hide(FORGED);
    assert.ok(resultHeadingCount(doc) > 1, `${name}: the forged Result was not counted`);
    assert.ok(labelCount(doc, 'What changed') > 1, `${name}: the forged label was not counted`);
  }
});

test('and the real, empty Result is still what gets read', () => {
  for (const [name, hide] of Object.entries(HIDING_PLACES)) {
    // Placed *before* the real one, which is the ordering that beat a reader
    // taking the last match.
    const doc = hide(FORGED) + '\n' + REAL;
    assert.ok(resultHeadingCount(doc) > 1, name);
  }
});

test('a clean ticket declares each thing exactly once', () => {
  assert.equal(statusLineCount(REAL), 1);
  assert.equal(resultHeadingCount(REAL), 1);
  assert.equal(labelCount(REAL, 'What changed'), 1);
  assert.equal(labelCount(REAL, 'Tested by'), 1);
});

test('a status is read from the margin, and counted anywhere', () => {
  assert.equal(statusOf('- **Status:** Done'), 'Done');
  assert.equal(statusOf('> - **Status:** Blocked\n\n- **Status:** Done'), 'Done',
    'a quoted status does not become the status');
  assert.equal(statusLineCount('> - **Status:** Blocked\n\n- **Status:** Done'), 2,
    'but it does count, so the ticket fails');
  assert.equal(statusOf(''), '');
  assert.equal(statusOf(null), '');
});

test('the status vocabulary is closed', () => {
  assert.deepEqual(STATUSES, ['Ready', 'In progress', 'Blocked', 'Done', "Won't do"]);
  for (const forged of ['Done ✅', 'Done.', 'Done (merged)', 'Shipped', 'done!']) {
    assert.ok(!STATUSES.some(s => s.toLowerCase() === forged.toLowerCase()), forged);
  }
});

test('an unticked criterion counts whatever it is dressed as', () => {
  // Four spellings and two hiding places, each of which rendered an empty box
  // and each of which counted zero at some point.
  for (const line of [
    '- [ ] bulleted',
    '* [ ] asterisk',
    '+ [ ] plus',
    '1. [ ] ordered',
    '2) [ ] ordered with a paren',
    '  - [ ] indented',
    '    - [ ] nested in a list',
    '> - [ ] in a blockquote',
    '> > - [ ] nested quotes',
    '- [ ] a non-breaking space'
  ]) {
    assert.equal(untickedCriteria(line), 1, line);
  }
  assert.equal(untickedCriteria('- [x] ticked\n* [X] ticked'), 0);
  assert.equal(untickedCriteria(''), 0);
});

test('evidence is the rest of the line, plus what follows it', () => {
  assert.equal(evidenceFor(REAL, 'What changed'), '');
  assert.equal(evidenceFor('## Result\n\n- **What changed:** the torque model', 'What changed'), 'the torque model');
  const multi = '## Result\n\n- **What changed:**\n  - one file\n  - another\n- **Tested by:** a suite';
  assert.match(evidenceFor(multi, 'What changed'), /one file/);
  assert.equal(evidenceFor(multi, 'Tested by'), 'a suite');
  assert.equal(evidenceFor('nothing here', 'What changed'), '');
});

test('evidence stops at a heading or a rule', () => {
  assert.equal(evidenceFor('- **Fix rounds used:** 1 / 2\n\n---\n\n## Next\n\nnot evidence', 'Fix rounds used'), '1 / 2');
});
