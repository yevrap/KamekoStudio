#!/usr/bin/env node
// check.mjs — Shadow Studio's self-checks.
//
//   npm run studio:check                     every stage
//   npm run studio:check -- --stage=gate     one stage
//   npm run studio:check -- --list           what exists, without running it
//   npm run studio:check -- --json           machine-readable results
//
// Every check reports pass, fail or "not run" with a reason. A check that could
// not run is never silently dropped: the gate and push stages treat "not run"
// as a failure, because a guarantee nobody verified is not a guarantee.
//
// Reference: docs/studio/self-checks.md

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGES, CONCLUSIVE_STAGES, checksForStage } from './checks/index.mjs';
import { previousIterationTag } from './lib/shell.mjs';
import { splitArg } from './lib/rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const DEFAULTS = {
  studioRoots: ['studio', 'docs/studio', 'tests/studio'],
  siteUrl: 'https://yevrap.github.io/KamekoStudio',
  productionPages: ['/', '/games/durak/'],
  pollAttempts: 12,
  // INIT_CWD is where `npm run` was invoked from; process.cwd() under npm is
  // always the package root, so on its own it could never differ from ROOT.
  stopFileRoots: [...new Set([ROOT, process.cwd(), process.env.INIT_CWD].filter(Boolean))]
};

function parseArgs(argv) {
  const opts = {
    stages: null, list: false, json: false, skipSlow: false, offline: false,
    base: null, iteration: null, previousTag: null, deployMarker: null,
    markerAt: '/studio/', extraDocRoots: []
  };
  const needsValue = new Set(['stage', 'stages', 'base', 'iteration', 'previous-tag', 'marker', 'marker-at', 'docs-root']);
  for (const arg of argv) {
    const [key, value] = splitArg(arg);
    if (needsValue.has(key) && (value === undefined || value === '')) {
      console.error(`--${key} needs a value, as --${key}=<value>`);
      usage();
      process.exit(2);
    }
    switch (key) {
      case 'stage': case 'stages': opts.stages = value.split(','); break;
      case 'list': opts.list = true; break;
      case 'json': opts.json = true; break;
      case 'skip-slow': opts.skipSlow = true; break;
      case 'offline': opts.offline = true; break;
      case 'base': opts.base = value; break;
      case 'iteration': opts.iteration = value; break;
      case 'previous-tag': opts.previousTag = value; break;
      case 'marker': opts.deployMarker = value; break;
      case 'marker-at':
        // A path on the site, not a URL: the check only ever looks at this
        // repository's own deploy, so another origin is refused rather than
        // quietly searched.
        if (!value.startsWith('/') || value.startsWith('//')) {
          console.error(`--marker-at takes a path on the site, starting with one "/" (got "${value}")`);
          process.exit(2);
        }
        opts.markerAt = value;
        break;
      case 'docs-root': opts.extraDocRoots.push(path.resolve(value)); break;
      case 'help': usage(); process.exit(0); break;
      default:
        console.error(`unknown argument: ${arg}`);
        usage();
        process.exit(2);
    }
  }
  return opts;
}

function usage() {
  console.log(`studio:check — Shadow Studio self-checks

  --stage=<name[,name]>  run only these stages (${STAGES.join(', ')})
  --base=<ref>           git ref the path guard and commit lint diff against
                         (default: the newest studio-iteration tag that is
                         not HEAD itself)
  --iteration=NN         iteration number for the document checks
                         (default: inferred from the latest iteration folder)
  --previous-tag=<tag>   tag that production-unchanged compares against
                         (default: as for --base)
  --marker=<text>        string the new build has and the old one does not
  --marker-at=<path>     where on the site to look for it, and in the files
                         that page loads (default: /studio/)
  --docs-root=<dir>      extra directory for doc-cleanliness (repeatable)
  --skip-slow            do not run the test suites
  --offline              do not make network requests
  --list                 list the checks and exit
  --json                 emit JSON instead of a table`);
}

async function inferIteration(root) {
  const { promises: fs } = await import('node:fs');
  try {
    const dirs = (await fs.readdir(path.join(root, 'docs/studio/iterations'), { withFileTypes: true }))
      .filter(d => d.isDirectory() && /^\d+$/.test(d.name))
      .map(d => d.name)
      .sort();
    return dirs[dirs.length - 1] ?? '00';
  } catch {
    return '00';
  }
}

const ICON = { pass: '✓', fail: '✗', skip: '–' };
const WORD = { pass: 'pass', fail: 'FAIL', skip: 'not run' };

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const stages = opts.stages ?? STAGES;

  for (const stage of stages) {
    if (!STAGES.includes(stage)) {
      console.error(`unknown stage: ${stage} (known: ${STAGES.join(', ')})`);
      process.exit(2);
    }
  }

  if (opts.list) {
    for (const stage of stages) {
      console.log(`\n${stage}`);
      for (const c of checksForStage(stage)) console.log(`  ${c.id.padEnd(22)} ${c.description}`);
    }
    return 0;
  }

  const ctx = {
    root: ROOT,
    ...DEFAULTS,
    // Not simply the newest tag: once the iteration's own tag is on HEAD, the
    // newest tag is the release itself, and every comparison with it is empty
    // and passes having proved nothing (TD-011).
    base: opts.base ?? previousIterationTag(ROOT) ?? 'origin/main',
    iteration: opts.iteration ?? await inferIteration(ROOT),
    previousTag: opts.previousTag,
    deployMarker: opts.deployMarker,
    markerAt: opts.markerAt,
    extraDocRoots: opts.extraDocRoots,
    skipSlow: opts.skipSlow,
    offline: opts.offline
  };

  const results = [];
  for (const stage of stages) {
    for (const check of checksForStage(stage)) {
      // A check listed in two stages runs once per stage it was asked for, but
      // the result is reused so a slow suite is not run twice in one invocation.
      const already = results.find(r => r.id === check.id);
      if (already) { results.push({ ...already, stage, reused: true }); continue; }
      let outcome;
      const started = Date.now();
      try {
        outcome = await check.run(ctx);
      } catch (err) {
        outcome = { status: 'fail', detail: `the check itself threw: ${err && err.stack ? err.stack.split('\n')[0] : err}` };
      }
      results.push({ id: check.id, stage, ms: Date.now() - started, ...outcome });
    }
  }

  // "not run" is a failure at the gate and before a push: both exist to be
  // conclusive.
  for (const r of results) {
    if (CONCLUSIVE_STAGES.includes(r.stage) && r.status === 'skip') {
      r.status = 'fail';
      r.detail = `not run, and the ${r.stage} stage cannot pass on an unverified check — ${r.detail}`;
    }
  }

  if (opts.json) {
    console.log(JSON.stringify({ base: ctx.base, iteration: ctx.iteration, results }, null, 2));
  } else {
    report(ctx, stages, results);
  }
  return results.some(r => r.status === 'fail') ? 1 : 0;
}

function report(ctx, stages, results) {
  console.log(`studio:check — base ${ctx.base}, iteration ${ctx.iteration}\n`);
  for (const stage of stages) {
    console.log(stage);
    for (const r of results.filter(x => x.stage === stage)) {
      const timing = r.reused ? '(reused)' : `${r.ms}ms`;
      console.log(`  ${ICON[r.status]} ${r.id.padEnd(22)} ${WORD[r.status].padEnd(8)} ${timing}`);
      if (r.detail) console.log(`      ${r.detail.split('\n').join('\n      ')}`);
    }
    console.log('');
  }
  const seen = results.filter(r => !r.reused);
  const count = s => seen.filter(r => r.status === s).length;
  console.log(`${count('pass')} passed, ${count('fail')} failed, ${count('skip')} not run.`);
}

process.exitCode = await main();
