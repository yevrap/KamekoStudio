// deploy.mjs — what the world can actually see.
//
// GitHub Pages serves this repository from the main branch; there is no Actions
// workflow to watch, so these checks poll the live URLs until the new build
// appears. Worst case for studio-live is ctx.pollAttempts x (the requests of
// one search + POLL_MS) — a few minutes at the defaults — after which it
// reports a failure with the reason rather than hanging indefinitely.

import { fetchUrl, previousIterationTag, refExists, attempt, gitPath } from '../lib/shell.mjs';
import { moduleImports, sameOriginAssets } from '../lib/rules.mjs';
import { textAt } from './path-guard.mjs';

const POLL_MS = 10000;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const isScript = url => /\.m?js$/.test(new URL(url).pathname);

/**
 * One search for `marker`: the page at `url` **and the same-origin files it
 * loads**, following module imports one level at a time.
 *
 * The realm's home page is a shell: its shelf, its pulse line and its retro
 * line are all built in the browser from `shelf-data.js`. So the one thing this
 * check exists to prove — that what changed is really on the wire — was the one
 * thing it could not see. Iteration 02 deployed a new game, the page served it
 * correctly, and this reported a failure because the game's name is in a module
 * rather than in the HTML. A deploy check that can only read the shell verifies
 * the shell.
 *
 * `url` may also be a script, when the change being verified is in one: then
 * the script is searched first and its imports after it.
 *
 * @returns `{ status, found, where, searched }` — `status` is the page's HTTP
 *          status, or an error string when it could not be fetched at all.
 */
export async function searchForMarker(url, marker, fetch = fetchUrl) {
  const page = await fetch(url);
  if (page.error || page.status !== 200) {
    return { status: page.error ?? page.status, found: false, where: null, searched: [] };
  }
  const searched = [url];
  if (page.body.includes(marker)) return { status: 200, found: true, where: url, searched };
  // A queue rather than a list: a module the page links can import the file
  // that holds the words. `main.js` imports `shelf-data.js`, and every word the
  // realm shows is in the second one.
  const queue = isScript(url) ? moduleImports(page.body, url) : sameOriginAssets(page.body, url);
  while (queue.length) {
    const asset = queue.shift();
    if (searched.includes(asset)) continue;
    searched.push(asset);
    const res = await fetch(asset);
    if (res.error || res.status !== 200) continue;
    if (res.body.includes(marker)) return { status: 200, found: true, where: asset, searched };
    if (isScript(asset)) {
      for (const next of moduleImports(res.body, asset)) {
        if (!searched.includes(next)) queue.push(next);
      }
    }
  }
  return { status: 200, found: false, where: null, searched };
}

/**
 * Search again on every attempt until the marker is found or the attempts run
 * out.
 *
 * The first version polled only for the status code and then searched once.
 * The page returns 200 before a deploy as well as after it, so on a fresh push
 * the one search always read the old build and failed a correct deploy — every
 * time, under trunk-based work, where every finished ticket is pushed and
 * checked (TD-010).
 */
export async function pollForMarker(url, marker, { attempts, waitMs = POLL_MS, fetch = fetchUrl, wait = sleep } = {}) {
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    last = await searchForMarker(url, marker, fetch);
    if (last.found) return { ok: true, attempt, ...last };
    if (attempt < attempts) await wait(waitMs);
  }
  return { ok: false, attempt: attempts, ...last };
}

/**
 * The repository path a URL on the site is served from, or null when the URL is
 * not under the site. A directory is served by its `index.html`.
 */
export function repoPathFor(url, siteUrl) {
  const site = new URL(`${siteUrl}/`);
  const u = new URL(url);
  if (u.origin !== site.origin || !u.pathname.startsWith(site.pathname)) return null;
  let rel = decodeURIComponent(u.pathname.slice(site.pathname.length));
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  return rel;
}

/**
 * Why a marker cannot tell the new build from the last release, or null.
 *
 * A marker the previous release's copy of the same file already contained is
 * found on the old build as readily as on the new one, so finding it proves
 * nothing about the deploy — the same shape as a comparison of no commits.
 * Measured against the previous *release*, not the previous push: a marker
 * brought in by an earlier push this iteration still passes, so each push
 * should pick a string it introduces itself (self-checks.md says so).
 */
export function staleMarkerProblem(marker, previousText, where) {
  if (previousText && previousText.includes(marker)) {
    return `"${marker}" is already in ${where}, so finding it cannot tell the new build from the old one — choose a string this push introduces`;
  }
  return null;
}

export const studioLive = {
  id: 'studio-live',
  stages: ['postdeploy'],
  description: 'The deployed site serves the new build: the marker is on the page at --marker-at (the realm\'s home by default) or in a file it loads',
  async run(ctx) {
    if (ctx.offline) return { status: 'skip', detail: '--offline was passed' };
    // Joined, not resolved: `new URL('/studio/', site)` would drop the site's own
    // path and land on the origin's root. The result must still be under the
    // site, so `..` cannot walk the check onto someone else's pages.
    const url = new URL(`${ctx.siteUrl}${ctx.markerAt ?? '/studio/'}`).href;
    if (!url.startsWith(`${ctx.siteUrl}/`)) {
      return { status: 'fail', detail: `--marker-at resolves to ${url}, which is outside ${ctx.siteUrl}/` };
    }
    const marker = ctx.deployMarker;

    if (!marker) {
      // Without a marker there is no new build to look for, only a page, and a
      // page answers before a deploy exactly as it does after one.
      return { status: 'skip', detail: 'no --marker given, so which build is being served was not checked' };
    }

    // `ctx.fetch` exists for tests; the command line never sets it.
    const result = await pollForMarker(url, marker, { attempts: ctx.pollAttempts, fetch: ctx.fetch, wait: ctx.wait });
    if (result.ok) {
      const tag = ctx.previousTag ?? previousIterationTag(ctx.root);
      let file = repoPathFor(result.where, ctx.siteUrl);
      // A directory named without its trailing slash is served by its index.html;
      // read as it stands, `git show` would return a tree listing, which never
      // holds the marker, and every marker would look new.
      if (file && tag && attempt(gitPath(), ['cat-file', '-t', `${tag}:${file}`], { cwd: ctx.root }).out === 'tree') {
        file = `${file}/index.html`;
      }
      let against = 'no previous release to compare the marker with';
      if (tag && refExists(ctx.root, tag) && file) {
        const stale = staleMarkerProblem(marker, textAt(ctx.root, tag, file), `${tag}:${file}`);
        if (stale) return { status: 'fail', detail: stale };
        against = `absent from ${tag}:${file}`;
      }
      const via = result.where === url ? '' : `, reached from ${url}`;
      return {
        status: 'pass',
        detail: `"${marker}" served from ${result.where}${via} — found on attempt ${result.attempt} of ${ctx.pollAttempts}; ${result.searched.length} file(s) checked; ${against}`
      };
    }
    if (result.status !== 200) {
      return { status: 'fail', detail: `${url}: ${typeof result.status === 'number' ? `HTTP ${result.status}` : result.status} on the last of ${result.attempt} attempt(s)` };
    }
    return {
      status: 'fail',
      detail: `${url}: HTTP 200, marker "${marker}" not found in the page or the `
        + `${result.searched.length - 1} file(s) it loads, on any of ${result.attempt} attempt(s)`
    };
  }
};

export const productionLive = {
  id: 'production-live',
  stages: ['postdeploy'],
  description: 'A production game page still returns 200 after the deploy',
  async run(ctx) {
    if (ctx.offline) return { status: 'skip', detail: '--offline was passed' };
    const results = [];
    for (const page of ctx.productionPages) {
      const url = `${ctx.siteUrl}${page}`;
      const res = await fetchUrl(url);
      results.push({ url, ok: !res.error && res.status === 200, why: res.error || `HTTP ${res.status}` });
    }
    const bad = results.filter(r => !r.ok);
    return bad.length
      ? { status: 'fail', detail: bad.map(r => `${r.url}: ${r.why}`).join('\n  ') }
      : { status: 'pass', detail: `${results.length} production page(s) return 200` };
  }
};
