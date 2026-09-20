// storage-keys.mjs — the studio shares an origin, and therefore a localStorage,
// with the production arcade. Every key it touches carries the studio_ prefix.
// See docs/studio/decisions/ADR-0003-storage-namespace.md.

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { walk, exists } from '../lib/shell.mjs';
import { badStorageKeys } from '../lib/rules.mjs';

const SOURCE = /\.(js|mjs|html)$/;

export const storageKeys = {
  id: 'storage-keys',
  stages: ['ticket', 'gate'],
  description: 'Every localStorage key used under studio/ starts with studio_',
  async run(ctx) {
    const dir = path.join(ctx.root, 'studio');
    if (!(await exists(dir))) return { status: 'skip', detail: 'studio/ does not exist yet' };

    const files = (await walk(dir)).filter(f => SOURCE.test(f));
    const offenders = [];
    let scanned = 0;
    for (const file of files) {
      scanned++;
      const bad = badStorageKeys(await fs.readFile(file, 'utf8'));
      for (const key of bad) offenders.push(`${path.relative(ctx.root, file)}: "${key}"`);
    }
    return offenders.length
      ? { status: 'fail', detail: `keys without the studio_ prefix:\n  ${offenders.join('\n  ')}` }
      : { status: 'pass', detail: `${scanned} source file(s) scanned, all storage keys namespaced` };
  }
};
