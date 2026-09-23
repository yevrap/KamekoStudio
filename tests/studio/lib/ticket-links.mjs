// ticket-links.mjs — a ticket number in the docs is a link to its file (SHS-059).
//
// `linkTicketMentions` rewrites each bare `SHS-NNN` in a Markdown text as a
// relative link to that ticket's file. It rewrites prose only, and leaves plain
// everything a check or a reader takes as text:
//
//   code        inline code spans and fenced blocks
//   frontmatter the YAML block at the top of a file
//   comment     HTML comments
//   link        a mention already inside a link's text or url, or an autolink
//   path        part of a file path or name (`reviews/SHS-052.md`, `SHS-052-td-009-fixed`)
//   commit-subject  `type(studio): SHS-NNN …`, which commit-lint reads from the handbook
//   title       the H1 on a file's first line, which the checks read as `# ID — …`
//   no-ticket   a number with no ticket file (the handbook's examples: SHS-001, SHS-999)
//   self        a ticket's mentions of itself, in its own file
//
// This is not a CommonMark parser, and does not need to be one: a construct it
// misreads can only leave a mention plain or link it where a reader would have
// wanted it linked anyway. Nothing here decides what a check passes.
//
// The script that applies it to the repository is tests/studio/link-tickets.mjs.

import path from 'node:path';

const MENTION_RE = /SHS-(\d+)/g;
const TICKET_PATH_RE = /(?:^|\/)(SHS-\d{3})-[^/\\]+\.md$/;

/** `Map<ID, repo path>` for every SHS ticket file among `paths`. */
export function ticketTargets(paths) {
  const out = new Map();
  for (const p of paths) {
    if (!p.includes('/tickets/')) continue;
    const id = TICKET_PATH_RE.exec(p)?.[1];
    if (id) out.set(id, p);
  }
  return out;
}

/** Protected spans of `text`, as `[start, end, reason]`, in no particular order. */
function protectedSpans(text) {
  const spans = [];
  let body = 0;

  const fm = /^---\n[\s\S]*?\n---(?:\n|$)/.exec(text);
  if (fm) { spans.push([0, fm[0].length, 'frontmatter']); body = fm[0].length; }

  const title = /^#[ \t][^\n]*/.exec(text);
  if (title) spans.push([0, title[0].length, 'title']);

  // Fenced blocks, line by line: an opener of three or more backticks or tildes,
  // closed by a line of the same character at least as long, or by the end.
  const fenced = [];
  const lineRe = /[^\n]*(?:\n|$)/g;
  let open = null;
  for (let m = lineRe.exec(text); m && m[0].length; m = lineRe.exec(text)) {
    if (m.index < body) continue;
    const fence = /^[ \t]*(`{3,}|~{3,})/.exec(m[0]);
    if (!open) {
      if (fence) open = { start: m.index, char: fence[1][0], len: fence[1].length };
    } else if (fence && fence[1][0] === open.char && fence[1].length >= open.len && /^[ \t]*[`~]+[ \t]*\n?$/.test(m[0])) {
      fenced.push([open.start, m.index + m[0].length, 'code']);
      open = null;
    }
  }
  if (open) fenced.push([open.start, text.length, 'code']);
  spans.push(...fenced);
  const inFence = i => fenced.some(([s, e]) => i >= s && i < e);

  for (const m of text.matchAll(/<!--[\s\S]*?(?:-->|$)/g)) {
    if (!inFence(m.index)) spans.push([m.index, m.index + m[0].length, 'comment']);
  }

  // Inline code: a run of n backticks closes at the next run of exactly n.
  for (let i = body; i < text.length; i++) {
    if (text[i] !== '`' || inFence(i)) continue;
    let n = 1;
    while (text[i + n] === '`') n++;
    const closer = new RegExp(`(?<!\`)\`{${n}}(?!\`)`, 'g');
    closer.lastIndex = i + n;
    const c = closer.exec(text);
    if (c && !text.slice(i + n, c.index).includes('\n\n')) {
      spans.push([i, c.index + n, 'code']);
      i = c.index + n - 1;
    } else {
      i += n - 1;
    }
  }

  // Links and images: `[text](url)`, `[text][ref]`, and autolinks `<scheme:…>`.
  for (let i = body; i < text.length; i++) {
    if (text[i] !== '[' || inFence(i)) continue;
    let depth = 0, j = i;
    for (; j < text.length && text[j] !== '\n'; j++) {
      if (text[j] === '[') depth++;
      else if (text[j] === ']' && --depth === 0) break;
    }
    if (text[j] !== ']') continue;
    let end = -1;
    if (text[j + 1] === '(') {
      let parens = 0, k = j + 1;
      for (; k < text.length && text[k] !== '\n'; k++) {
        if (text[k] === '(') parens++;
        else if (text[k] === ')' && --parens === 0) break;
      }
      if (text[k] === ')') end = k + 1;
    } else if (text[j + 1] === '[') {
      const k = text.indexOf(']', j + 2);
      if (k !== -1 && !text.slice(j + 2, k).includes('\n')) end = k + 1;
    }
    if (end !== -1) {
      const start = text[i - 1] === '!' ? i - 1 : i;
      spans.push([start, end, 'link']);
      i = end - 1;
    }
  }
  for (const m of text.matchAll(/<[a-z][a-z0-9+.-]*:[^\s<>]*>/gi)) spans.push([m.index, m.index + m[0].length, 'link']);

  return spans;
}

/** Why the mention at `[start, end)` stays plain from its neighbours alone, or null. */
function contextReason(text, start, end, digits) {
  const before = text[start - 1] ?? '';
  const after = text[end] ?? '';
  if (/[\w/\\-]/.test(before) || /[\w-]/.test(after) || (after === '.' && /\w/.test(text[end + 1] ?? ''))) return 'path';
  if (digits.length !== 3) return 'no-ticket';
  if (/\(studio\)!?: $/.test(text.slice(Math.max(0, start - 12), start))) return 'commit-subject';
  return null;
}

/**
 * Link every bare ticket mention in `text`.
 *
 * @param text     the Markdown file's content
 * @param file     its repo-relative path, posix separators
 * @param tickets  `Map<ID, repo path>` from `ticketTargets`
 * @returns        `{ text, linked, plain }`, where `plain` counts the mentions
 *                 left as they were, by reason
 */
export function linkTicketMentions(text, { file, tickets }) {
  const spans = protectedSpans(text);
  const dir = path.posix.dirname(file);
  const plain = {};
  let linked = 0;
  const out = text.replace(MENTION_RE, (match, digits, offset) => {
    const end = offset + match.length;
    const guarded = spans.find(([s, e]) => offset >= s && end <= e);
    let reason = guarded ? guarded[2] : contextReason(text, offset, end, digits);
    const target = tickets.get(match);
    if (!reason && !target) reason = 'no-ticket';
    if (!reason && target === file) reason = 'self';
    if (reason) {
      plain[reason] = (plain[reason] ?? 0) + 1;
      return match;
    }
    linked++;
    return `[${match}](${path.posix.relative(dir, target)})`;
  });
  return { text: out, linked, plain };
}

/** The repo path each inline link in `text` to an SHS ticket file resolves to. */
export function ticketLinkTargets(text, file) {
  const dir = path.posix.dirname(file);
  const out = [];
  for (const [, url] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const bare = url.split('#')[0];
    if (/^[a-z]+:/i.test(bare) || !TICKET_PATH_RE.test(bare)) continue;
    out.push(path.posix.normalize(path.posix.join(dir, bare)));
  }
  return out;
}
