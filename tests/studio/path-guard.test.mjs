// The path guard's reader, exercised against real git output rather than
// through a pure function.
//
// The exception mechanism compares a file's content at the base revision with
// its content now, byte for byte. It was fed by a helper that trims, so every
// file arrived without its final newline and the comparison could never hold —
// the guard rejected the very edit it was written to allow. The pure rule was
// never wrong, so a test of the pure rule would not have caught it. This one
// reads the repository.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { textAt, pathGuard, productionUnchanged } from './checks/path-guard.mjs';
import { commitLint } from './checks/commit-lint.mjs';
import { hygiene } from './checks/hygiene.mjs';
import { scratchRepo } from './lib/scratch-repo.mjs';
import { refExists } from './lib/shell.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = 'studio-iteration-00';

test('the base revision is read whole, trailing newline included', { skip: !refExists(ROOT, BASE) && 'no base tag in this clone' }, () => {
  const text = textAt(ROOT, BASE, 'package.json');
  assert.ok(text.length > 0, 'package.json came back empty at the base revision');
  assert.ok(text.endsWith('\n'), 'the file lost its final newline on the way out of git');
  assert.equal(JSON.parse(text).name, 'kameko-studio');
});

test('a file unchanged since the base revision compares equal to the file on disk', () => {
  // This is the comparison every content-checked exception performs. If it
  // cannot hold for an untouched file, no exception can ever pass.
  // A file no studio exception covers. It was constants.js until SHS-057 gave
  // that file an exception and changed it.
  const unchanged = 'shared/3d/state.js';
  assert.ok(existsSync(path.join(ROOT, unchanged)));
  assert.equal(textAt(ROOT, BASE, unchanged), readFileSync(path.join(ROOT, unchanged), 'utf8'));
});

test('a path absent at the base revision reads as empty, not as a throw', () => {
  assert.equal(textAt(ROOT, BASE, 'no/such/file/at/that/revision.js'), '');
});

// --- Studio commits and arcade commits on one main (SHS-055) -------------------
//
// The arcade and the studio share `main`, so the range since a studio tag holds
// both. Each verdict below is read from a real repository, merges included.

/** A repository tagged `studio-iteration-04`, and the context every check needs. */
function sharedMain(t) {
  const r = scratchRepo();
  t.after(r.done);
  r.commit('docs(studio): SHS-053 the release');
  r.git('tag', 'studio-iteration-04');
  const ctx = { root: r.root, base: 'studio-iteration-04', previousTag: 'studio-iteration-04', iteration: '05', productionFixes: [] };
  return { r, ctx };
}

test('an arcade commit outside the studio paths is not a studio violation', async t => {
  const { r, ctx } = sharedMain(t);
  r.commit('docs(studio): SHS-055 studio work', ['studio/a.js', 'docs/studio/b.md']);
  r.commit('chore: the arcade moves its skills', ['.claude/settings.json', 'CLAUDE.md', 'games/g/main.js']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'pass', guard.detail);
  assert.match(guard.detail, /2 path\(s\) inside the guard/);
  assert.match(guard.detail, /commits: 1 studio, 1 arcade, 0 merge, 0 exempt/);
  const deployed = await productionUnchanged.run(ctx);
  assert.equal(deployed.status, 'pass', deployed.detail);
  const lint = commitLint.run(ctx);
  assert.equal(lint.status, 'pass', lint.detail);
  assert.match(lint.detail, /1 studio commit\(s\) conventional; 1 arcade commit\(s\) not linted/);
});

test('a studio commit outside the studio paths is still a violation', async t => {
  const { r, ctx } = sharedMain(t);
  r.commit('feat(studio): SHS-055 reaches into the arcade', ['games/g/main.js']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /games\/g\/main\.js/);
  assert.equal((await productionUnchanged.run(ctx)).status, 'fail');
});

test('an arcade commit that changes a studio path is a violation', async t => {
  const { r, ctx } = sharedMain(t);
  const sha = r.commit('chore: just a tidy-up', ['studio/index.html', 'tests/studio/x.mjs']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, new RegExp(`studio/index\\.html \\(changed by arcade commit ${sha.slice(0, 7)}`));
  assert.match(guard.detail, /tests\/studio\/x\.mjs \(changed by arcade commit/);
  const deployed = await productionUnchanged.run(ctx);
  assert.equal(deployed.status, 'fail');
  assert.match(deployed.detail, /changed by arcade commit/);
});

test('dropping the scope but naming the ticket does not get a production change past the guard', async t => {
  // Iteration 05 review, finding 1: a production-only change is judged only
  // when the commit is sorted as the studio's.
  const { r, ctx } = sharedMain(t);
  r.commit('fix: SHS-060 clamp the drawer width', ['shared/settings.js']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /shared\/settings\.js/);
  assert.equal(commitLint.run(ctx).status, 'fail');
});

test('a merge that brings in studio and arcade paths together is a violation', async t => {
  const { r, ctx } = sharedMain(t);
  r.git('checkout', '--quiet', '-b', 'side');
  r.commit('docs(studio): SHS-055 on a branch', ['studio/side.js']);
  r.commit('feat: p1-99 also on the branch', ['games/g/side.js']);
  r.git('checkout', '--quiet', 'main');
  r.commit('docs(studio): SHS-055 on main', ['studio/main.js']);
  r.git('merge', '--quiet', '--no-ff', '-m', 'Merge side', 'side');
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /merge .{7} changes studio paths and other paths together \(1 and 1\)/);
  // Each commit the merge brings in is judged on its own too, and both are clean.
  assert.doesNotMatch(guard.detail, /changed by arcade commit/);
});

test('a merge that brings in one kind only is that kind', async t => {
  const { r, ctx } = sharedMain(t);
  r.git('checkout', '--quiet', '-b', 'side');
  r.commit('feat: p1-99 arcade on a branch', ['games/g/side.js']);
  r.git('checkout', '--quiet', 'main');
  r.commit('docs(studio): SHS-055 on main', ['studio/main.js']);
  r.git('merge', '--quiet', '--no-ff', '-m', 'Merge side', 'side');
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'pass', guard.detail);
  assert.match(guard.detail, /commits: 1 studio, 1 arcade, 1 merge, 0 exempt/);
});

test('commit-lint fails a new unnumbered (studio) commit and ignores arcade subjects', t => {
  const { r, ctx } = sharedMain(t);
  r.commit('feat: p1-22 an arcade subject the studio lint would reject', ['games/g/a.js']);
  const bad = r.commit('docs(studio): direction for epic E2', ['docs/studio/steering/direction.md']);
  const lint = commitLint.run(ctx);
  assert.equal(lint.status, 'fail');
  assert.match(lint.detail, new RegExp(`^1 of 1 studio commit\\(s\\):\\n  ${bad.slice(0, 7)} expected`));
  assert.doesNotMatch(lint.detail, /p1-22/);
});

test('commit-lint does not call a range with no studio commit a pass', t => {
  const { r, ctx } = sharedMain(t);
  r.commit('feat: p1-22 arcade only', ['games/g/a.js']);
  const lint = commitLint.run(ctx);
  assert.equal(lint.status, 'skip');
  assert.match(lint.detail, /no studio commits since studio-iteration-04, so nothing was linted; 1 arcade commit\(s\) not linted/);
});

// --- The studio's own skills and conductor (ADR-0011 §6, SHS-065) --------------
//
// A retro changes how the team works in the files that run the work: the
// studio's skills and the Claude Code conductor. The path guard admits them in
// a ticketed studio commit, names the exception every time, and still refuses
// the files §6 keeps the executive's.

const WORKFLOW_FILES = [
  '.claude/skills/studio-sprint/SKILL.md',
  '.claude/skills/studio-iteration/SKILL.md',
  '.claude/workflows/studio-sprint.js'
];

test('a ticketed studio commit may change the studio\'s skills and conductor, and the report names the exception', async t => {
  const { r, ctx } = sharedMain(t);
  r.commit('docs(studio): SHS-065 the retro changes how the team works', [...WORKFLOW_FILES, 'docs/studio/process.md']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'pass', guard.detail);
  for (const file of WORKFLOW_FILES) {
    assert.match(guard.detail, new RegExp(`exception used: ${file.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')} — .*ADR-0011 §6`));
  }
  const deployed = await productionUnchanged.run(ctx);
  assert.equal(deployed.status, 'pass', deployed.detail);
  assert.match(deployed.detail, /the 3 admitted below/);
});

test('an uncommitted change to a studio skill is admitted at the ticket stage, and says it is uncommitted', async t => {
  const { r, ctx } = sharedMain(t);
  r.commit('docs(studio): SHS-065 start', ['docs/studio/a.md']);
  r.write('.claude/skills/studio-iteration/SKILL.md', 'edited');
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'pass', guard.detail);
  assert.match(guard.detail, /exception used: \.claude\/skills\/studio-iteration\/SKILL\.md — .*ADR-0011 §6.*uncommitted/);
});

test('the same change in an unticketed (studio) commit is a violation', async t => {
  const { r, ctx } = sharedMain(t);
  const sha = r.commit('docs(studio): tidy the conductor', ['.claude/workflows/studio-sprint.js']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, new RegExp(`\\.claude/workflows/studio-sprint\\.js \\(changed by studio commit ${sha.slice(0, 7)}, which names no ticket`));
  assert.doesNotMatch(guard.detail, /exception used/);
  assert.equal((await productionUnchanged.run(ctx)).status, 'fail');
});

test('a studio commit that names a ticket outside the conventional subject is still unticketed for the exception', async t => {
  const { r, ctx } = sharedMain(t);
  r.commit('fix: SHS-065 tidy the skill', ['.claude/skills/studio-sprint/SKILL.md']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /\.claude\/skills\/studio-sprint\/SKILL\.md \(changed by studio commit .{7}, which names no ticket/);
});

test('an arcade commit to the studio\'s skills is judged by the arcade\'s rules, not waved through by the exception', async t => {
  const { r, ctx } = sharedMain(t);
  r.commit('chore: the arcade edits the studio skills', WORKFLOW_FILES);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'pass', guard.detail);
  assert.match(guard.detail, /commits: 0 studio, 1 arcade/);
  assert.doesNotMatch(guard.detail, /exception used/);
  // And the exception lends it nothing: the studio path beside it is still refused.
  r.commit('chore: and the handbook too', ['.claude/skills/studio-sprint/SKILL.md', 'docs/studio/process.md']);
  const mixed = await pathGuard.run(ctx);
  assert.equal(mixed.status, 'fail');
  assert.match(mixed.detail, /docs\/studio\/process\.md \(changed by arcade commit/);
  assert.doesNotMatch(mixed.detail, /SKILL\.md/);
});

test('a studio commit to the arcade\'s skills, CI or ADR-0011 is a violation, each one named', async t => {
  const { r, ctx } = sharedMain(t);
  const adr = 'docs/studio/decisions/ADR-0011-the-studio-runs-itself.md';
  r.commit('docs(studio): SHS-065 reaches past section 6', ['.claude/skills/ship/SKILL.md', '.github/workflows/checks.yml', adr]);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /\.claude\/skills\/ship\/SKILL\.md/);
  assert.match(guard.detail, /\.github\/workflows\/checks\.yml/);
  assert.match(guard.detail, /ADR-0011-the-studio-runs-itself\.md \(executive-only: /);
  assert.doesNotMatch(guard.detail, /exception used/);
  assert.equal((await productionUnchanged.run(ctx)).status, 'fail');
});

test('an uncommitted edit to ADR-0011 is a violation too', async t => {
  const { r, ctx } = sharedMain(t);
  r.commit('docs(studio): SHS-065 start', ['docs/studio/a.md']);
  r.write('docs/studio/decisions/ADR-0011-the-studio-runs-itself.md', 'rewritten');
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /ADR-0011-the-studio-runs-itself\.md \(executive-only: /);
});

test('hygiene scans the studio\'s skills and conductor, and not the arcade\'s skills', async t => {
  const { r } = sharedMain(t);
  const leak = ['/Us', 'ers/someone/notes'].join('');  // built here, so this file stays clean
  r.write('.claude/skills/studio-sprint/references/prompts.md', `see ${leak}\n`);
  r.write('.claude/workflows/studio-sprint.js', `// ${leak}\n`);
  r.write('.claude/skills/ship/SKILL.md', `see ${leak}\n`);
  const result = await hygiene.run({ root: r.root, studioRoots: [], iteration: '07', productionFixes: [] });
  assert.equal(result.status, 'fail');
  assert.match(result.detail, /\.claude\/skills\/studio-sprint\/references\/prompts\.md:1: absolute personal path/);
  assert.match(result.detail, /\.claude\/workflows\/studio-sprint\.js:1: absolute personal path/);
  assert.doesNotMatch(result.detail, /ship\/SKILL\.md/);
});
