// The repository is public and its history is permanent. Planning, decisions and
// agent workflows all live here as markdown, so every markdown file gets the same
// hygiene scan the studio applies to its own paths (docs/studio/public-repo-hygiene.md).
// Names of private people can't be pattern-matched without publishing them; that part
// stays a review responsibility (CLAUDE.md, "Public repo").

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { scanHygiene } from './studio/lib/rules.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
// .agents/skills is a symlink to .claude/skills — scanned once, through .claude.
const SKIP = new Set(['node_modules', '.git', '.agents']);

function markdownFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

test('no markdown file carries secrets, personal identifiers, private paths or wikilinks', () => {
  const files = markdownFiles(ROOT);
  assert.ok(files.length > 20, `expected the repo's markdown, found ${files.length} files`);
  const findings = files.flatMap(file =>
    scanHygiene(fs.readFileSync(file, 'utf8')).map(f =>
      `${path.relative(ROOT, file)}:${f.line}: ${f.label} — ${f.text}`));
  assert.deepEqual(findings, []);
});
