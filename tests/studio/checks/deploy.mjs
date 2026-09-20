// deploy.mjs — what the world can actually see.
//
// GitHub Pages serves this repository from the main branch; there is no Actions
// workflow to watch, so these checks poll the live URLs and give up politely
// rather than hanging.

import { fetchUrl } from '../lib/shell.mjs';

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
  description: 'The deployed studio URL returns 200 and serves the new build',
  async run(ctx) {
    if (ctx.offline) return { status: 'skip', detail: '--offline was passed' };
    const url = `${ctx.siteUrl}/studio/`;
    const marker = ctx.deployMarker;
    const res = await poll(url, body => (marker ? body.includes(marker) : true), ctx.pollAttempts);
    if (res.ok) {
      return { status: 'pass', detail: `${url} serves ${marker ? `"${marker}"` : 'content'} (after ${res.attempts} attempt(s))` };
    }
    const why = res.last?.error ? res.last.error : `HTTP ${res.last?.status}${marker ? `, marker "${marker}" not found` : ''}`;
    return { status: 'fail', detail: `${url}: ${why} after ${res.attempts} attempt(s)` };
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
