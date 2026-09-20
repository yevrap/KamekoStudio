// hygiene.mjs — this repository is public and its history is permanent.
// See docs/studio/public-repo-hygiene.md for the reasoning behind each pattern.

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { walk, exists } from '../lib/shell.mjs';
import { scanHygiene } from '../lib/rules.mjs';

const MAX_BYTES = 1024 * 1024;
const TEXT = /\.(md|js|mjs|cjs|html|css|json|txt|svg|yml|yaml)$/;

export const hygiene = {
  id: 'hygiene',
  stages: ['gate'],
  description: 'No secrets, personal identifiers, private paths, note-vault syntax or oversized files',
  async run(ctx) {
    const findings = [];
    let scanned = 0;

    for (const rel of ctx.studioRoots) {
      const dir = path.join(ctx.root, rel);
      if (!(await exists(dir))) continue;
      for (const file of await walk(dir)) {
        const shown = path.relative(ctx.root, file);
        const { size } = await fs.stat(file);
        if (size > MAX_BYTES) {
          findings.push(`${shown}: ${(size / 1024 / 1024).toFixed(2)} MB exceeds the 1 MB limit`);
        }
        if (!TEXT.test(file)) continue;
        scanned++;
        for (const f of scanHygiene(await fs.readFile(file, 'utf8'))) {
          findings.push(`${shown}:${f.line}: ${f.label} — ${f.text}`);
        }
      }
    }

    return findings.length
      ? { status: 'fail', detail: `${findings.length} finding(s):\n  ${findings.join('\n  ')}` }
      : { status: 'pass', detail: `${scanned} text file(s) clean` };
  }
};
