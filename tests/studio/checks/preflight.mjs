// preflight.mjs — the state of the world before an iteration starts.

import path from 'node:path';
import { attempt, git, gitPath, exists } from '../lib/shell.mjs';

export const treeClean = {
  id: 'tree-clean',
  // Also at the gate: the document checks read the filesystem, so a clean tree
  // is what makes them statements about what will actually be pushed. Iteration
  // 00's review caught a green gate sitting on nine untracked ticket files.
  stages: ['preflight', 'gate'],
  description: 'No uncommitted work is about to be swept into the iteration, or missed by it',
  run(ctx) {
    const dirty = git(ctx.root, 'status', '--porcelain');
    return dirty
      ? { status: 'fail', detail: `working tree has ${dirty.split('\n').length} uncommitted path(s):\n  ${dirty.split('\n').join('\n  ')}` }
      : { status: 'pass', detail: 'working tree clean' };
  }
};

export const onMain = {
  id: 'on-main',
  stages: ['preflight'],
  description: 'The iteration starts from the branch that deploys',
  run(ctx) {
    const branch = git(ctx.root, 'rev-parse', '--abbrev-ref', 'HEAD');
    if (branch !== 'main') return { status: 'fail', detail: `on "${branch}", expected "main"` };

    const fetched = attempt(gitPath(), ['fetch', '--quiet', 'origin', 'main'], { cwd: ctx.root });
    if (!fetched.ok) return { status: 'skip', detail: `could not reach origin: ${fetched.out || 'network unavailable'}` };

    const behind = git(ctx.root, 'rev-list', '--count', 'HEAD..origin/main');
    const ahead = git(ctx.root, 'rev-list', '--count', 'origin/main..HEAD');
    if (behind !== '0') return { status: 'fail', detail: `main is ${behind} commit(s) behind origin/main` };
    return {
      status: 'pass',
      detail: ahead === '0' ? 'on main, in sync with origin' : `on main, ${ahead} commit(s) ahead of origin (unpushed)`
    };
  }
};

export const noStopFile = {
  id: 'no-stop-file',
  stages: ['preflight'],
  description: 'The executive has not asked for a halt',
  async run(ctx) {
    for (const dir of ctx.stopFileRoots) {
      if (await exists(path.join(dir, 'STOP'))) {
        return { status: 'fail', detail: `STOP file present in ${dir}` };
      }
    }
    return { status: 'pass', detail: `no STOP file in ${ctx.stopFileRoots.length} watched location(s)` };
  }
};
