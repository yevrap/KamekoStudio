// deploy.mjs — what the world can actually see.
//
// GitHub Pages serves this repository from the main branch; there is no Actions
// workflow to watch, so these checks poll the live URLs until the new build
// appears. Worst case for studio-live is ctx.pollAttempts x (request timeout +
// POLL_MS) — about five minutes at the defaults — after which it reports a
// failure with the reason rather than hanging indefinitely.

import { fetchUrl } from '../lib/shell.mjs';
import { moduleImports, sameOriginAssets } from '../lib/rules.mjs';

const POLL_MS = 10000;

async function poll(url, predicate, attempts) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    last = await fetchUrl(url);
    if (!last.error && last.status === 200 && predicate(last.body)) return { ok: true, attempts: i + 1, last };
    if (i < attempts - 1) await new Promise(r => setTimeout(r, POLL_MS));
  }
  return { ok: false, attempts, last };
}

export const studioLive = {
  id: 'studio-live',
  stages: ['postdeploy'],
  description: 'The deployed studio URL returns 200 and the new build is really on it',
  async run(ctx) {
    if (ctx.offline) return { status: 'skip', detail: '--offline was passed' };
    const url = `${ctx.siteUrl}/studio/`;
    const marker = ctx.deployMarker;

    // Wait for the page itself first.
    const page = await poll(url, () => true, ctx.pollAttempts);
    if (!page.ok) {
      const why = page.last?.error ? page.last.error : `HTTP ${page.last?.status}`;
      return { status: 'fail', detail: `${url}: ${why} after ${page.attempts} attempt(s)` };
    }
    if (!marker) {
      return { status: 'pass', detail: `${url} serves content (after ${page.attempts} attempt(s))` };
    }

    // Then look for the marker in the page **and in the files the page loads**.
    //
    // The realm's home page is a shell: its shelf, its pulse line and its retro
    // line are all built in the browser from `shelf-data.js`. So the one thing
    // this check exists to prove — that what changed is really on the wire —
    // was the one thing it could not see. Iteration 02 deployed a new game, the
    // page served it correctly, and this reported a failure because the game's
    // name is in a module rather than in the HTML.
    //
    // A deploy check that can only read the shell verifies the shell.
    const assets = sameOriginAssets(page.last.body, url);
    const searched = [url];
    if (page.last.body.includes(marker)) {
      return { status: 'pass', detail: `${url} serves "${marker}" (after ${page.attempts} attempt(s))` };
    }
    // A queue rather than a list: a module the page links can import the file
    // that holds the words. `main.js` imports `shelf-data.js`, and every word
    // the realm shows is in the second one.
    const queue = [...assets];
    while (queue.length) {
      const asset = queue.shift();
      if (searched.includes(asset)) continue;
      searched.push(asset);
      const res = await fetchUrl(asset);
      if (res.error || res.status !== 200) continue;
      if (res.body.includes(marker)) {
        return {
          status: 'pass',
          detail: `"${marker}" served from ${asset} (reached from ${url}; ${searched.length} file(s) checked)`
        };
      }
      if (/\.m?js$/.test(new URL(asset).pathname)) {
        for (const next of moduleImports(res.body, asset)) {
          if (!searched.includes(next)) queue.push(next);
        }
      }
    }
    return {
      status: 'fail',
      detail: `${url}: HTTP 200, marker "${marker}" not found in the page or the `
        + `${searched.length - 1} file(s) it loads after ${page.attempts} attempt(s)`
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
