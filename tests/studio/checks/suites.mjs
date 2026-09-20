// suites.mjs — the repository's own test suites, run as studio checks.
//
// The studio shares a deployment with production, so "our tests pass" is not
// the bar; the bar is that the whole repository is still green.

import { attempt } from '../lib/shell.mjs';

const SUITES = [
  { name: 'npm test', args: ['test', '--silent'] },
  { name: 'npm run smoke', args: ['run', '--silent', 'smoke'] },
  { name: 'npm run e2e', args: ['run', '--silent', 'e2e'] }
];

function runSuites(ctx, suites) {
  if (ctx.skipSlow) return { status: 'skip', detail: '--skip-slow was passed' };

  const failures = [];
  const ran = [];
  for (const suite of suites) {
    const r = attempt('npm', suite.args, { cwd: ctx.root });
    ran.push(suite.name);
    if (!r.ok) failures.push(`${suite.name} exited ${r.code}\n${tail(r.out, 25)}`);
  }
  return failures.length
    ? { status: 'fail', detail: failures.join('\n\n') }
    : { status: 'pass', detail: `${ran.join(', ')} green` };
}

function tail(text, lines) {
  return text.split('\n').slice(-lines).map(l => '    ' + l).join('\n');
}

export const baselineSuites = {
  id: 'baseline-suites',
  stages: ['preflight'],
  description: 'The repo was already green before the studio touched it',
  run: ctx => runSuites(ctx, SUITES)
};

export const fullSuites = {
  id: 'full-suites',
  stages: ['gate'],
  description: 'npm test, smoke and e2e are green — production included',
  run: ctx => runSuites(ctx, SUITES)
};

export const studioTests = {
  id: 'studio-tests',
  stages: ['ticket'],
  description: "The studio's own unit tests pass",
  run(ctx) {
    const r = attempt('node', ['--test', 'tests/studio/'], { cwd: ctx.root });
    return r.ok
      ? { status: 'pass', detail: 'tests/studio/ green' }
      : { status: 'fail', detail: tail(r.out, 30) };
  }
};
