// What a reader sees, and what they do not.
//
// Six rounds tried to answer this by *stripping* hiding places out of the text,
// and each round found another spelling. The seventh stripped harder and was
// worse: the regex deleted text CommonMark renders, and since the Result is
// taken from the last heading in the processed copy and criteria are counted in
// it, deleting too much promoted a draft Result to final and made unticked
// criteria disappear. Five payloads walked through, one of them invisible when
// rendered.
//
// The cases below are those five, plus the ones the stripping versions did get
// right, so a future rewrite has to keep both halves.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readableLines, readableText } from './lib/markdown.mjs';

const criteria = text => readableLines(text).lines.filter(l => /\[ \]/.test(l)).length;

test('a real fenced block hides its contents, in every fence style', () => {
  for (const fence of ['```', '~~~', '````', '```js']) {
    const close = fence.replace(/[a-z]+$/, '');
    assert.equal(criteria(`${fence}\n- [ ] hidden\n${close}\n\n- [ ] seen`), 1, fence);
  }
});

test('a fence indented up to three spaces is a fence; four spaces is a code block', () => {
  assert.equal(criteria('   ```\n- [ ] hidden\n   ```\n\n- [ ] seen'), 1);
  // Four spaces after a blank line is an indented code block, and its contents
  // are equally hidden.
  assert.equal(criteria('\n    - [ ] hidden\n\n- [ ] seen'), 1);
});

test('a tab-indented fence is an indented code block, not a fence', () => {
  // The payload: treating it as a fence deleted everything after it, which is
  // how a draft Result was promoted over the real one.
  assert.equal(criteria('\t```\n- [ ] seen\n'), 1);
});

test('a backtick fence whose info string contains a backtick is not a fence', () => {
  // CommonMark forbids a backtick in a backtick fence's info string, so this
  // line is an ordinary paragraph and everything after it renders.
  assert.equal(criteria('```x`y\n- [ ] seen\n'), 1);
  // A tilde fence has no such restriction.
  assert.equal(criteria('~~~x`y\n- [ ] hidden\n~~~\n\n- [ ] seen'), 1);
});

test('an HTML block hides its own contents and nothing beyond them', () => {
  // The invisible payload: a fence inside a `display:none` div. The div hides
  // the fence; the fence must not then hide the rest of the document.
  assert.equal(criteria('<div style="display:none">\n```\n</div>\n\n- [ ] seen'), 1);
  assert.equal(criteria('<table><tr><td>\n```\n</td></tr></table>\n\n- [ ] seen'), 1);
});

test('script, style and pre hide their contents until they close', () => {
  for (const tag of ['script', 'style', 'pre', 'textarea']) {
    assert.equal(criteria(`<${tag}>\n- [ ] hidden\n</${tag}>\n\n- [ ] seen`), 1, tag);
  }
});

test('an HTML comment hides its contents, on one line or many', () => {
  assert.equal(criteria('<!-- - [ ] hidden -->\n\n- [ ] seen'), 1);
  assert.equal(criteria('<!--\n- [ ] hidden\n-->\n\n- [ ] seen'), 1);
});

test('a task item inside a blockquote is a task item', () => {
  // It renders as an empty box, and counting line prefixes missed it.
  assert.equal(criteria('> - [ ] quoted'), 1);
  assert.equal(criteria('> > - [ ] nested'), 1);
  assert.match(readableText('> - **Status:** Done'), /- \*\*Status:\*\* Done/);
});

test('an unterminated block is reported, not guessed at', () => {
  assert.equal(readableLines('```\n- [ ] hidden forever').unterminated, 'a backtick code fence');
  assert.equal(readableLines('~~~\nx').unterminated, 'a tilde code fence');
  assert.equal(readableLines('<!--\nx').unterminated, 'an HTML comment');
  assert.equal(readableLines('<script>\nx').unterminated, 'a <script> block');
  assert.equal(readableLines('# A normal ticket\n\n- [ ] one').unterminated, null);
  // A type-6 HTML block legitimately ends at a blank line, so it is not
  // unterminated.
  assert.equal(readableLines('<div>\nx\n\ny').unterminated, null);
});

test('ordinary prose is returned unchanged, line for line', () => {
  const doc = '# Title\n\n- **Status:** Done\n\n## Result\n\n- **What changed:** the thing\n';
  assert.equal(readableText(doc), doc, 'prose comes back byte for byte, trailing newline included');
  assert.equal(readableLines(doc).lines.length, doc.split('\n').length, 'one entry per source line');
});

test('an empty or absent document is readable and empty', () => {
  assert.deepEqual(readableLines('').lines, ['']);
  assert.equal(readableLines(null).unterminated, null);
  assert.equal(readableText(undefined), '');
});
