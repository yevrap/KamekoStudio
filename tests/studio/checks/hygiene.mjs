// hygiene.mjs — this repository is public and its history is permanent.
// See docs/studio/public-repo-hygiene.md for the reasoning behind each pattern.

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { walk, exists } from '../lib/shell.mjs';
import { scanHygiene, PATH_EXCEPTIONS, PRODUCTION_FIXES, isWorkflowPath } from '../lib/rules.mjs';

const MAX_BYTES = 1024 * 1024;

// A denylist, not an allowlist. An allowlist of "text" extensions meant that a
// stray .pem, .env or .key was size-checked and then skipped before the
// private-key pattern could ever fire on it.
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|bmp|mp3|wav|ogg|m4a|mp4|webm|woff2?|ttf|otf|eot|pdf|zip|gz|tgz|bz2|7z|wasm)$/i;

export const hygiene = {
  id: 'hygiene',
  stages: ['gate', 'push'],
  description: 'No secrets, personal identifiers, private paths, note-vault syntax or oversized files',
  async run(ctx) {
    const findings = [];
    let scanned = 0;

    const files = [];
    for (const rel of ctx.studioRoots) {
      const dir = path.join(ctx.root, rel);
      if (await exists(dir)) files.push(...await walk(dir));
    }
    // The paths the studio may touch by exception are the ones most worth
    // scanning, and were previously the only ones never scanned.
    // So are the production files this iteration is fixing (ADR-0008): the
    // studio is about to publish its own edits to them.
    const touched = [
      ...PATH_EXCEPTIONS.map(e => e.path),
      ...(ctx.productionFixes ?? PRODUCTION_FIXES).filter(f => f.iteration === ctx.iteration).map(f => f.path)
    ];
    // So are the studio's own skills and conductor, which its commits may now
    // change (ADR-0011 §6, SHS-065).
    const skills = path.join(ctx.root, '.claude/skills');
    if (await exists(skills)) {
      for (const name of await fs.readdir(skills)) {
        if (!isWorkflowPath(`.claude/skills/${name}/x`)) continue;
        for (const full of await walk(path.join(skills, name))) touched.push(path.relative(ctx.root, full));
      }
    }
    touched.push('.claude/workflows/studio-sprint.js');
    for (const rel of new Set(touched)) {
      const full = path.join(ctx.root, rel);
      if (await exists(full)) files.push(full);
    }

    for (const file of files) {
      const shown = path.relative(ctx.root, file);
      const { size } = await fs.stat(file);
      if (size > MAX_BYTES) {
        findings.push(`${shown}: ${(size / 1024 / 1024).toFixed(2)} MB exceeds the 1 MB limit`);
      }
      if (BINARY.test(file)) continue;
      scanned++;
      for (const f of scanHygiene(await fs.readFile(file, 'utf8'))) {
        findings.push(`${shown}:${f.line}: ${f.label} — ${f.text}`);
      }
    }

    return findings.length
      ? { status: 'fail', detail: `${findings.length} finding(s):\n  ${findings.join('\n  ')}` }
      : { status: 'pass', detail: `${scanned} file(s) clean` };
  }
};
