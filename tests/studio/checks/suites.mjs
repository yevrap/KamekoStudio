// suites.mjs — the repository's own test suites, run as studio checks.
//
// The studio shares a deployment with production, so "our tests pass" is not
// the bar; the bar is that the whole repository is still green.
//
// The three suites are not equivalent: `npm test` is pure Node, while smoke and
// e2e drive a real Chrome and load three.js from a CDN. When those two cannot
// run, saying so is the honest answer — reporting them as failures would be
// indistinguishable from a real regression.

import { existsSync } from 'node:fs';
import { attempt } from '../lib/shell.mjs';

const DEFAULT_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const SUITES = [
  { name: 'npm test', args: ['test', '--silent'], needsBrowser: false },
  { name: 'npm run smoke', args: ['run', '--silent', 'smoke'], needsBrowser: true },
  { name: 'npm run e2e', args: ['run', '--silent', 'e2e'], needsBrowser: true }
];

function chromePath() {
  return process.env.CHROME_PATH || DEFAULT_CHROME;
}

function tail(text, lines) {
  return text.split('\n').slice(-lines).map(l => '    ' + l).join('\n');
}

function runSuites(ctx) {
  if (ctx.skipSlow) return { status: 'skip', detail: '--skip-slow was passed' };

  const browserAvailable = existsSync(chromePath());
  const failures = [];
  const ran = [];
  const skipped = [];

  for (const suite of SUITES) {
    if (suite.needsBrowser && ctx.offline) {
      skipped.push(`${suite.name} (needs a browser and the three.js CDN; --offline was passed)`);
      continue;
    }
    if (suite.needsBrowser && !browserAvailable) {
      skipped.push(`${suite.name} (no Chrome at ${chromePath()}; set CHROME_PATH)`);
      continue;
    }
    const r = attempt('npm', suite.args, { cwd: ctx.root });
    ran.push(suite.name);
    if (!r.ok) failures.push(`${suite.name} exited ${r.code}\n${tail(r.out, 25)}`);
  }

  if (failures.length) return { status: 'fail', detail: failures.join('\n\n') };
  if (skipped.length) {
    return { status: 'skip', detail: `${ran.join(', ') || 'nothing'} green; not run: ${skipped.join('; ')}` };
  }
  return { status: 'pass', detail: `${ran.join(', ')} green` };
}

export const baselineSuites = {
  id: 'baseline-suites',
  stages: ['preflight'],
  description: 'The repo was already green before the studio touched it',
  run: runSuites
};

export const fullSuites = {
  id: 'full-suites',
  stages: ['gate', 'push'],
  description: 'npm test, smoke and e2e are green — production included',
  run: runSuites
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
