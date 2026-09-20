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
import { textAt } from './checks/path-guard.mjs';
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
  const unchanged = 'shared/3d/constants.js';
  assert.ok(existsSync(path.join(ROOT, unchanged)));
  assert.equal(textAt(ROOT, BASE, unchanged), readFileSync(path.join(ROOT, unchanged), 'utf8'));
});

test('a path absent at the base revision reads as empty, not as a throw', () => {
  assert.equal(textAt(ROOT, BASE, 'no/such/file/at/that/revision.js'), '');
});
