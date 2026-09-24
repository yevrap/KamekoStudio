// preflight.mjs — the state of the world before an iteration starts.

import path from 'node:path';
import { attempt, git, gitPath, exists } from '../lib/shell.mjs';
import { branchProblem } from '../lib/rules.mjs';

export const treeClean = {
  id: 'tree-clean',
  // Also at the gate: the document checks read the filesystem, so a clean tree
  // is what makes them statements about what will actually be pushed. Iteration
  // 00's review caught a green gate sitting on nine untracked ticket files.
  stages: ['preflight', 'gate', 'push'],
  description: 'No uncommitted work is about to be swept into the iteration, or missed by it',
  run(ctx) {
    const dirty = git(ctx.root, 'status', '--porcelain');
    return dirty
      ? { status: 'fail', detail: `working tree has ${dirty.split('\n').length} uncommitted path(s):\n  ${dirty.split('\n').join('\n  ')}` }
      : { status: 'pass', detail: 'working tree clean' };
  }
};

export const onBranch = {
  // Was `on-main` until SHS-070: ADR-0011 §4 gives each ticket a branch and a
  // pull request, so a ticket branch is as good a place to start as `main`.
  id: 'on-branch',
  stages: ['preflight', 'push'],
  description: 'On main or a ticket branch (studio/SHS-NNN-slug), and not behind origin/main',
  run(ctx) {
    const branch = git(ctx.root, 'rev-parse', '--abbrev-ref', 'HEAD');
    const problem = branchProblem(branch);
    if (problem) return { status: 'fail', detail: problem };
    const where = branch === 'main' ? 'on main' : `on ticket branch ${branch}`;

    const fetched = attempt(gitPath(), ['fetch', '--quiet', 'origin', 'main'], { cwd: ctx.root });
    if (!fetched.ok) return { status: 'skip', detail: `could not reach origin: ${fetched.out || 'network unavailable'}` };

    const behind = git(ctx.root, 'rev-list', '--count', 'HEAD..origin/main');
    const ahead = git(ctx.root, 'rev-list', '--count', 'origin/main..HEAD');
    if (behind !== '0') {
      return { status: 'fail', detail: `${where}, ${behind} commit(s) behind origin/main — rebase first` };
    }
    // A ticket branch stays ahead of origin/main after it is pushed, until its
    // pull request merges: "unpushed" is only true on main (sprint 08 review, IR08-6).
    const why = branch === 'main' ? 'unpushed' : 'not merged into main yet';
    return {
      status: 'pass',
      detail: ahead === '0' ? `${where}, in sync with origin` : `${where}, ${ahead} commit(s) ahead of origin/main (${why})`
    };
  }
};

export const noStopFile = {
  id: 'no-stop-file',
  stages: ['preflight', 'push'],
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
