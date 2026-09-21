// markdown.mjs — which lines of a document a reader actually sees.
//
// `docs-current` needs to read a ticket's Result, its status and its unticked
// criteria from the text a person reads, not from the raw file. The first six
// attempts at that *stripped* the hiding places out — backticks, then `~~~`,
// then HTML comments, then indented fences, then `<script>` — and every round
// found another spelling.
//
// The seventh attempt stripped more aggressively, and that turned out to be
// worse than stripping less: the regex deleted text CommonMark **renders**, and
// because the Result is taken from the *last* heading in the stripped copy and
// criteria are counted in it, over-stripping promoted a draft Result to final
// and made unticked criteria disappear. Five payloads walked through, one of
// them invisible when rendered. A rule that decides from a mutilated copy of a
// document is the same error as one that decides from a stack frame: the thing
// it reads is not the thing it is reasoning about.
//
// So this scans instead. It walks the document once, tracking the block
// constructs that hide their contents, and reports for each line whether a
// reader sees it — with blockquote markers removed, because a task item inside
// a blockquote renders as a task item. When a block is left **unterminated**,
// the document is ambiguous and that is reported rather than guessed at: a
// ticket nobody can read is a failure, not a pass.
//
// It is not a CommonMark implementation and does not try to be. It covers the
// constructs that hide text, which is the entire question here.

/** Up to three leading spaces still counts as "at the margin" in CommonMark. */
const FENCE = /^ {0,3}(`{3,}|~{3,})([^\n]*)$/;
/** Four spaces, or a tab, starts an indented code block after a blank line. */
const INDENTED = /^(?: {4,}|\t)/;
/** Block-level HTML whose contents are raw until a blank line (CommonMark type 6/7). */
const HTML_OPEN = /^ {0,3}<\/?([A-Za-z][A-Za-z0-9-]*)(?:\s|\/?>|$)/;
/** These hide their contents until an explicit closing tag (CommonMark type 1). */
const RAW_UNTIL_CLOSE = new Set(['script', 'style', 'pre', 'textarea']);

/**
 * Walk a document and report what a reader sees.
 *
 * @returns {{ lines: string[], unterminated: string|null }}
 *   `lines` holds one entry per source line: the text a reader sees, or `''`
 *   for a line that is hidden. Indexes match the source, so a caller can still
 *   reason about order. `unterminated` names a block that never closed.
 */
export function readableLines(text) {
  const source = String(text ?? '').split('\n');
  const lines = [];
  let fence = null;          // { char, length }
  let html = null;           // 'comment' | tag name | 'block'
  let indented = false;
  let blank = true;
  let unterminated = null;

  for (const raw of source) {
    const line = raw.replace(/\r$/, '');
    const isBlank = line.trim() === '';

    // --- inside a fenced code block
    if (fence) {
      const close = FENCE.exec(line);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length && close[2].trim() === '') {
        fence = null;
      }
      lines.push('');
      blank = false;
      continue;
    }

    // --- inside an HTML block
    if (html) {
      if (html === 'comment') {
        if (line.includes('-->')) html = null;
      } else if (RAW_UNTIL_CLOSE.has(html)) {
        if (new RegExp(`</${html}\\s*>`, 'i').test(line)) html = null;
      } else if (isBlank) {
        html = null;
      }
      lines.push('');
      blank = isBlank;
      continue;
    }

    // --- inside an indented code block
    if (indented) {
      if (isBlank) { lines.push(''); continue; }
      if (INDENTED.test(line)) { lines.push(''); blank = false; continue; }
      indented = false;
    }

    // --- openings
    const open = FENCE.exec(line);
    // A backtick fence's info string may not contain a backtick — with one, the
    // line is an ordinary paragraph, and treating it as a fence deleted the
    // rest of the document.
    if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
      fence = { char: open[1][0], length: open[1].length };
      lines.push('');
      blank = false;
      continue;
    }
    if (/^ {0,3}<!--/.test(line)) {
      if (!line.includes('-->')) html = 'comment';
      lines.push('');
      blank = false;
      continue;
    }
    const tag = HTML_OPEN.exec(line);
    if (tag && blank) {
      const name = tag[1].toLowerCase();
      if (RAW_UNTIL_CLOSE.has(name)) {
        if (!new RegExp(`</${name}\\s*>`, 'i').test(line)) html = name;
      } else if (!isBlank) {
        html = 'block';
      }
      lines.push('');
      blank = false;
      continue;
    }
    // An indented code block only starts where a paragraph is not continuing.
    if (blank && INDENTED.test(line) && !isBlank) {
      indented = true;
      lines.push('');
      blank = false;
      continue;
    }

    // --- visible. Blockquote markers come off: a task item inside a quote
    // renders as a task item, and counting line prefixes missed it.
    lines.push(line.replace(/^ {0,3}(?:>[ \t]?)+/, ''));
    blank = isBlank;
  }

  if (fence) unterminated = `a ${fence.char === '`' ? 'backtick' : 'tilde'} code fence`;
  else if (html === 'comment') unterminated = 'an HTML comment';
  else if (html && html !== 'block') unterminated = `a <${html}> block`;

  return { lines, unterminated };
}

/** The document as a reader sees it, hidden lines blanked out. */
export function readableText(text) {
  return readableLines(text).lines.join('\n');
}
