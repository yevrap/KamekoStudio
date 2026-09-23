// ticket-links.test.mjs — SHS-059: a ticket number in the docs is a link to its file.
//
// The linker rewrites prose only. Everything a check or a reader takes as text
// stays exactly as it was: code, frontmatter, comments, existing links, file
// names, commit subjects, a file's title line, numbers with no ticket file, and
// a ticket's mentions of itself.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linkTicketMentions, ticketTargets, ticketLinkTargets } from './lib/ticket-links.mjs';

const TICKETS = ticketTargets([
  'docs/studio/iterations/04/tickets/SHS-052-td-009-fixed.md',
  'docs/studio/iterations/05/tickets/SHS-056-river-run-fork.md',
  'docs/studio/iterations/02/tickets/SS-041-flaky-production-e2e.md',
  'docs/studio/iterations/04/review.md'
]);
const IN_LOG = 'docs/studio/iterations/05/log.md';
const TO_052_FROM_05 = '../04/tickets/SHS-052-td-009-fixed.md';

const link = (text, file = IN_LOG) => linkTicketMentions(text, { file, tickets: TICKETS });

test('only SHS ticket files are targets, keyed by their ID', () => {
  assert.deepEqual([...TICKETS.keys()].sort(), ['SHS-052', 'SHS-056']);
});

test('a bare mention becomes a relative link to its ticket file', () => {
  const r = link('Fixed in SHS-052, then forked in SHS-056.\n');
  assert.equal(r.text,
    `Fixed in [SHS-052](${TO_052_FROM_05}), then forked in [SHS-056](tickets/SHS-056-river-run-fork.md).\n`);
  assert.equal(r.linked, 2);
});

test('the relative path is right from any depth', () => {
  const cases = {
    'docs/studio/process.md': 'iterations/04/tickets/SHS-052-td-009-fixed.md',
    'docs/studio/steering/board.md': '../iterations/04/tickets/SHS-052-td-009-fixed.md',
    'docs/studio/iterations/04/tickets/SHS-053-x.md': 'SHS-052-td-009-fixed.md',
    'docs/studio/iterations/04/reviews/SHS-053.md': '../tickets/SHS-052-td-009-fixed.md',
    'studio/README.md': '../docs/studio/iterations/04/tickets/SHS-052-td-009-fixed.md',
    'docs/games/black-hole-in-one/ideas.md': '../../studio/iterations/04/tickets/SHS-052-td-009-fixed.md'
  };
  for (const [file, target] of Object.entries(cases)) {
    assert.equal(link('See SHS-052.', file).text, `See [SHS-052](${target}).`, file);
  }
});

test('mentions in prose shapes still link: bold, a list, a table, a range, a pair', () => {
  const text = '**SHS-052** — - SHS-056 | SHS-052 | (SHS-056) SHS-052…058 SHS-052/056\n';
  assert.equal(link(text).linked, 6);
});

test('left plain: inline code and fenced blocks', () => {
  const text = [
    'A `fix(SHS-052)` span, a ``double `SHS-052` span``.',
    '```',
    'SHS-052',
    '```',
    '~~~md',
    'SHS-056',
    '~~~',
    '  ````',
    '  SHS-052 ``` still inside',
    '  ````',
    ''
  ].join('\n');
  const r = link(text);
  assert.equal(r.text, text);
  assert.equal(r.plain.code, 5);
});

test('left plain: frontmatter and HTML comments', () => {
  const text = '---\ntitle: SHS-052\n---\n<!-- SHS-056 -->\n';
  const r = link(text);
  assert.equal(r.text, text);
  assert.deepEqual([r.plain.frontmatter, r.plain.comment], [1, 1]);
});

test('left plain: a mention that is already a link, or inside a link text or url', () => {
  const text = [
    `[SHS-052](${TO_052_FROM_05})`,
    '[the fix in SHS-052 and its [nested] note](https://example.invalid/SHS-056)',
    '![SHS-056 screenshot](shot.png)',
    '[SHS-052][ref] and <https://example.invalid/SHS-052>',
    ''
  ].join('\n');
  const r = link(text);
  assert.equal(r.text, text);
  assert.equal(r.plain.link, 7);
});

test('left plain: part of a file path or file name', () => {
  const text = 'reviews/SHS-052.md, SHS-052-td-009-fixed, SHS-052.md and dir\\SHS-056 and x-SHS-052\n';
  const r = link(text);
  assert.equal(r.text, text);
  assert.equal(r.plain.path, 5);
});

test('a sentence-ending full stop is not a file extension', () => {
  assert.equal(link('Done as SHS-052.\n').linked, 1);
  assert.equal(link('Done as SHS-052.md\n').linked, 0);
});

test('left plain: a number with no ticket file', () => {
  const text = 'SHS-001, SHS-003, SHS-999, SHS-0501, SHS-0 and SS-041\n';
  const r = link(text);
  assert.equal(r.text, text);
  assert.equal(r.plain['no-ticket'], 5);
});

test("left plain: a ticket's mentions of itself, in its own file", () => {
  const file = 'docs/studio/iterations/04/tickets/SHS-052-td-009-fixed.md';
  const r = link('Body: SHS-052 did it, after SHS-056.\n', file);
  assert.equal(r.text, 'Body: SHS-052 did it, after [SHS-056](../../05/tickets/SHS-056-river-run-fork.md).\n');
  assert.equal(r.plain.self, 1);
});

test("left plain: a file's title line, which the checks read as `# ID — …`", () => {
  const r = link('# SHS-052 — pre-push review\n\nBoth approved SHS-052.\n', 'docs/studio/iterations/04/reviews/SHS-052.md');
  assert.equal(r.text, '# SHS-052 — pre-push review\n\nBoth approved [SHS-052](../tickets/SHS-052-td-009-fixed.md).\n');
  assert.equal(r.plain.title, 1);
});

test('left plain: a commit subject, which commit-lint reads', () => {
  const text = 'Committed as docs(studio): SHS-052 plan, and feat(studio)!: SHS-056 fork.\n';
  const r = link(text);
  assert.equal(r.text, text);
  assert.equal(r.plain['commit-subject'], 2);
});

test('running it twice changes nothing the second time', () => {
  const once = link('SHS-052 and `SHS-056` and SHS-056.\n').text;
  const twice = link(once);
  assert.equal(twice.text, once);
  assert.equal(twice.linked, 0);
});

test('every ticket link in a text is listed with the file it resolves to', () => {
  const text = `[SHS-052](${TO_052_FROM_05}) and [x](../04/tickets/SHS-099-gone.md) and [y](other.md)`;
  assert.deepEqual(ticketLinkTargets(text, IN_LOG), [
    'docs/studio/iterations/04/tickets/SHS-052-td-009-fixed.md',
    'docs/studio/iterations/04/tickets/SHS-099-gone.md'
  ]);
});
