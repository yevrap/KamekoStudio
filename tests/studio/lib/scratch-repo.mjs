// scratch-repo.mjs — a throwaway git repository for tests that need real history.
//
// Checks that decide from git — which tag is the previous release, which
// commits touched a file — are tested against a repository built for the test
// rather than against this one, whose history keeps moving.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { gitPath } from './shell.mjs';

// No real identity: a committer only has to exist, and `@localhost` is not an
// address anyone owns. No user or system configuration, so a signing or hook
// setting on the machine running the tests cannot change the result.
const ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'studio test', GIT_AUTHOR_EMAIL: 'studio@localhost',
  GIT_COMMITTER_NAME: 'studio test', GIT_COMMITTER_EMAIL: 'studio@localhost',
  GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1'
};

/**
 * A new repository on `main`. `write(file, text)` writes a file; `commit(subject,
 * files)` writes each file (default: a fresh one under `studio/`) and commits;
 * `git(...args)` runs git in it; `done()` deletes it.
 */
export function scratchRepo() {
  const root = mkdtempSync(path.join(tmpdir(), 'studio-scratch-'));
  const git = (...args) => execFileSync(gitPath(), args, { cwd: root, env: ENV, encoding: 'utf8' }).trim();
  git('init', '--quiet', '--initial-branch=main');
  let n = 0;
  const write = (file, text = String(n)) => {
    const full = path.join(root, file);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, text);
  };
  const commit = (subject = `docs(studio): SHS-050 commit ${n}`, files = [`studio/f${n}.txt`]) => {
    for (const file of files) write(file, `${file} ${n}`);
    n++;
    git('add', '--all');
    git('commit', '--quiet', '-m', subject);
    return git('rev-parse', 'HEAD');
  };
  return { root, git, write, commit, done: () => rmSync(root, { recursive: true, force: true }) };
}
