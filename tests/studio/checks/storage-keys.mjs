// storage-keys.mjs — the studio shares an origin, and therefore a localStorage,
// with the production arcade. Every key it touches carries the studio_ prefix,
// and it never reaches the shared store by a route the rule cannot read.
// See docs/studio/decisions/ADR-0003-storage-namespace.md.

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { walk, exists } from '../lib/shell.mjs';
import { findStorageViolations } from '../lib/rules.mjs';

const SOURCE = /\.(js|mjs|html)$/;

export const storageKeys = {
  id: 'storage-keys',
  stages: ['ticket', 'gate', 'push'],
  description: 'Studio code reaches storage only through studio_-prefixed keys it can be shown to use',
  async run(ctx) {
    const dir = path.join(ctx.root, 'studio');
    if (!(await exists(dir))) return { status: 'skip', detail: 'studio/ does not exist yet' };

    const files = (await walk(dir)).filter(f => SOURCE.test(f));
    const offenders = [];
    let scanned = 0;
    for (const file of files) {
      scanned++;
      for (const v of findStorageViolations(await fs.readFile(file, 'utf8'))) {
        offenders.push(`${path.relative(ctx.root, file)}: ${v}`);
      }
    }
    return offenders.length
      ? { status: 'fail', detail: `${offenders.length} violation(s):\n  ${offenders.join('\n  ')}` }
      : { status: 'pass', detail: `${scanned} source file(s) scanned, storage use compliant` };
  }
};
