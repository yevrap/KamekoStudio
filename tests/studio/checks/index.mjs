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
import { studioBoot } from './boot.mjs';

export const CHECKS = [
  treeClean,
  onMain,
  noStopFile,
  baselineSuites,
  pathGuard,
  storageKeys,
  portalCapacityCheck,
  studioTests,
  studioBoot,
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

export const STAGES = ['preflight', 'ticket', 'gate', 'push', 'postdeploy', 'closeout'];

/**
 * Stages whose purpose is to be conclusive: a check they could not run is a
 * failure, not a gap. The gate decides whether an iteration is tagged; `push`
 * decides whether a finished ticket goes to `main`, and under trunk-based work
 * every push is a deploy of the whole arcade (ADR-0007); `postdeploy` is the only
 * evidence that the deploy is the one intended, and used to exit 0 with all three
 * of its checks not run.
 *
 * `push` is the gate without the two checks that only make sense once the
 * iteration has been reviewed — `docs-current` and `reviewer-verdict` — plus
 * `on-main` and `no-stop-file`, because the push goes straight to the branch
 * that deploys and must respect a halt.
 */
export const CONCLUSIVE_STAGES = ['gate', 'push', 'postdeploy'];

/** Checks belonging to a stage, in registry order. */
export function checksForStage(stage) {
  return CHECKS.filter(c => c.stages.includes(stage));
}
