// studio-live's search and its polling, against a fake web server.
//
// The first version of the check polled only for a status code and searched for
// the marker once, so on a fresh push it read the old build and failed a correct
// deploy (TD-010). These tests hold the fixed version to what a deploy looks
// like from outside: the same address serving the old build for a while, then
// the new one.

import test from 'node:test';
import assert from 'node:assert/strict';
import { pollForMarker, searchForMarker, repoPathFor, staleMarkerProblem, studioLive } from './checks/deploy.mjs';
import { scratchRepo } from './lib/scratch-repo.mjs';

const SITE = 'https://example.test/app';
const PAGE = `${SITE}/studio/`;
const HTML = '<script type="module" src="main.js"></script><link rel="stylesheet" href="style.css">';

/**
 * A site that serves `before` until `switchAt` searches have started, then
 * `after`. Each is a map of url → body; a url missing from it is a 404.
 */
function site(before, after = before, switchAt = Infinity) {
  let searches = 0;
  const fetch = async url => {
    if (url === PAGE) searches++;
    const files = searches >= switchAt ? after : before;
    return url in files ? { status: 200, body: files[url] } : { status: 404, body: 'not found' };
  };
  return { fetch, searches: () => searches };
}

const OLD = {
  [PAGE]: HTML,
  [`${SITE}/studio/main.js`]: "import { PULSE } from './shelf-data.js';",
  [`${SITE}/studio/shelf-data.js`]: "export const PULSE = 'iteration 03';",
  [`${SITE}/studio/style.css`]: 'body {}'
};
const NEW = { ...OLD, [`${SITE}/studio/shelf-data.js`]: "export const PULSE = 'iteration 04';" };

const noWait = { waits: 0 };
const wait = async () => { noWait.waits++; };

test('a build that arrives after the first attempt is found on a later one, with no re-run by hand', async () => {
  const web = site(OLD, NEW, 3);
  noWait.waits = 0;
  const result = await pollForMarker(PAGE, 'iteration 04', { attempts: 5, fetch: web.fetch, wait });
  assert.equal(result.ok, true);
  assert.equal(result.attempt, 3, 'found on the attempt the new build arrived on');
  assert.equal(result.where, `${SITE}/studio/shelf-data.js`);
  assert.equal(web.searches(), 3, 'the page was fetched afresh on every attempt, not once');
  assert.equal(noWait.waits, 2, 'waited between attempts, not after the last');
});

test('a build that never arrives fails after exactly the attempts it was given', async () => {
  const web = site(OLD);
  noWait.waits = 0;
  const result = await pollForMarker(PAGE, 'iteration 04', { attempts: 4, fetch: web.fetch, wait });
  assert.equal(result.ok, false);
  assert.equal(result.attempt, 4);
  assert.equal(web.searches(), 4);
  assert.equal(noWait.waits, 3);
  assert.equal(result.status, 200, 'the page was there; the build was not');
});

test('a page that stops answering is reported by its status, not as a missing marker', async () => {
  const web = site(OLD, {}, 2);
  const result = await pollForMarker(PAGE, 'iteration 04', { attempts: 3, fetch: web.fetch, wait });
  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
});

test('the marker is found in a module the page imports, not only in the page', async () => {
  const result = await searchForMarker(PAGE, 'iteration 03', site(OLD).fetch);
  assert.equal(result.found, true);
  assert.equal(result.where, `${SITE}/studio/shelf-data.js`);
  assert.deepEqual(result.searched, [PAGE, `${SITE}/studio/main.js`, `${SITE}/studio/style.css`, `${SITE}/studio/shelf-data.js`]);
});

test('the search can start at a script, for a change that lives in one', async () => {
  const game = `${SITE}/games/g/ui.js`;
  const files = {
    [game]: "import { world } from './state.js'; export function step() {}",
    [`${SITE}/games/g/state.js`]: 'export const world = { fixed: true };'
  };
  const fetch = async url => (url in files ? { status: 200, body: files[url] } : { status: 404, body: '' });
  const inFile = await searchForMarker(game, 'export function step', fetch);
  assert.equal(inFile.found, true);
  assert.equal(inFile.where, game);
  const inImport = await searchForMarker(game, 'fixed: true', fetch);
  assert.equal(inImport.found, true);
  assert.equal(inImport.where, `${SITE}/games/g/state.js`);
});

test('a file on another origin is never searched', async () => {
  const files = {
    [PAGE]: '<script src="https://cdn.example.org/lib.js"></script>',
    'https://cdn.example.org/lib.js': 'iteration 04'
  };
  const fetched = [];
  const fetch = async url => { fetched.push(url); return url in files ? { status: 200, body: files[url] } : { status: 404, body: '' }; };
  const result = await searchForMarker(PAGE, 'iteration 04', fetch);
  assert.equal(result.found, false);
  assert.deepEqual(fetched, [PAGE]);
});

test('a URL on the site maps to the file it is served from', () => {
  assert.equal(repoPathFor(`${SITE}/studio/`, SITE), 'studio/index.html');
  assert.equal(repoPathFor(`${SITE}/games/g/ui.js`, SITE), 'games/g/ui.js');
  assert.equal(repoPathFor('https://example.test/other/x.js', SITE), null);
  assert.equal(repoPathFor('https://elsewhere.test/app/x.js', SITE), null);
});

test('a marker the previous release already had is refused', () => {
  assert.match(staleMarkerProblem('export function step', 'export function step() {}', 'tag:ui.js'), /cannot tell the new build/);
  assert.equal(staleMarkerProblem('dropped (TD-009)', 'export function step() {}', 'tag:ui.js'), null);
  assert.equal(staleMarkerProblem('anything', '', 'tag:new.js'), null, 'a file new in this release cannot hold an old marker');
});

test('studio-live reports "not run" without a marker, and never fetches anything', async () => {
  let fetched = 0;
  const result = await studioLive.run({ siteUrl: SITE, markerAt: '/studio/', deployMarker: null, pollAttempts: 1, fetch: async () => { fetched++; return { status: 200, body: '' }; } });
  assert.equal(result.status, 'skip');
  assert.equal(fetched, 0);
});

test('studio-live fails a marker that the previous release\'s copy of the file already held', async t => {
  const r = scratchRepo(); t.after(r.done);
  r.write('games/g/ui.js', 'export function step() {}\n');
  r.git('add', '--all'); r.git('commit', '--quiet', '-m', 'docs(studio): SHS-050 release');
  r.git('tag', 'studio-iteration-03');
  r.commit(undefined, ['games/g/ui.js']);
  const served = { [`${SITE}/games/g/ui.js`]: 'export function step() {} // new build' };
  const fetch = async url => (url in served ? { status: 200, body: served[url] } : { status: 404, body: '' });
  const ctx = { root: r.root, siteUrl: SITE, markerAt: '/games/g/ui.js', pollAttempts: 1, fetch, previousTag: 'studio-iteration-03' };
  const stale = await studioLive.run({ ...ctx, deployMarker: 'export function step' });
  assert.equal(stale.status, 'fail', stale.detail);
  const fresh = await studioLive.run({ ...ctx, deployMarker: '// new build' });
  assert.equal(fresh.status, 'pass', fresh.detail);
  assert.match(fresh.detail, /absent from studio-iteration-03:games\/g\/ui\.js/);
});
