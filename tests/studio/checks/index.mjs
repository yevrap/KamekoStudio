// index.mjs — the check registry.
//
// A check is an object { id, stages, description, run(ctx) } whose run returns
// { status: 'pass' | 'fail' | 'skip', detail }. A module may export several.
// Order here is the order they run in.

import { treeClean, onMain, noStopFile } from './preflight.mjs';
import { baselineSuites, fullSuites, studioTests } from './suites.mjs';
import { pathGuard, productionUnchanged } from './path-guard.mjs';
import { storageKeys } from './storage-keys.mjs';
import { portalCapacityCheck } from './portal-capacity.mjs';
import { hygiene } from './hygiene.mjs';
import { commitLint } from './commit-lint.mjs';
import { iterationDocs, docsCurrent, reviewerVerdict, changelog, docCleanliness } from './docs.mjs';
import { studioLive, productionLive } from './deploy.mjs';

export const CHECKS = [
  treeClean,
  onMain,
  noStopFile,
  baselineSuites,
  pathGuard,
  storageKeys,
  portalCapacityCheck,
  studioTests,
  hygiene,
  fullSuites,
  commitLint,
  docsCurrent,
  reviewerVerdict,
  studioLive,
  productionLive,
  productionUnchanged,
  iterationDocs,
  docCleanliness,
  changelog
];

export const STAGES = ['preflight', 'ticket', 'gate', 'postdeploy', 'closeout'];

/** Checks belonging to a stage, in registry order. */
export function checksForStage(stage) {
  return CHECKS.filter(c => c.stages.includes(stage));
}
