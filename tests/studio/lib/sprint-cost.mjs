// sprint-cost.mjs — what a studio sprint would cost on a paid API key, from Claude Code's
// own session transcripts (issue #4, retro 08). Pure functions; the CLI is
// tests/studio/sprint-cost.mjs.
//
// A transcript is JSON lines. Each assistant line carries `message.id`, `message.model`
// and `message.usage`; one API response is split over several lines (one per content
// block) that repeat the same usage, so usage is counted once per message id.
//
// The usage is the one the stream opens with: its input, cache-write and cache-read counts
// are final, but `output_tokens` is only the first few tokens (retro 08 found 18k in the
// transcripts where the workflow measured 237k). So this prices writes and reads only;
// output comes from the workflow's per-step output tokens, priced by the retro.

// API list prices, USD per million tokens (the executive's figures in issue #4, which match
// the published price list for these models). Cache writes: 1.25x input for the 5-minute
// cache, 2x for the 1-hour cache. Cache reads are per model: Opus 5.5 reads at $0.20,
// not a tenth of its input price.
export const PRICES = [
  { match: /opus-5-5/, input: 4, read: 0.2, output: 20 },
  { match: /opus/, input: 5, read: 0.5, output: 25 },
  { match: /sonnet-5/, input: 2, read: 0.2, output: 10 },
  { match: /sonnet/, input: 3, read: 0.3, output: 15 },
  { match: /haiku/, input: 1, read: 0.1, output: 5 },
];

export function priceFor(model) {
  const p = PRICES.find(x => x.match.test(model ?? ''));
  if (!p) throw new Error(`no price for model ${model}`);
  return p;
}

const empty = () => ({ input: 0, write5m: 0, write1h: 0, read: 0, output: 0 });

// Token totals per model for one transcript's text, each API message counted once.
export function usageByModel(jsonlText) {
  const seen = new Map();
  for (const line of jsonlText.split('\n')) {
    if (!line.includes('"usage"')) continue;
    let d;
    try { d = JSON.parse(line); } catch { continue; }
    const m = d?.message;
    if (d?.type !== 'assistant' || !m?.usage || !m.id) continue;
    if (m.model === '<synthetic>') continue;
    seen.set(m.id, { model: m.model, usage: m.usage }); // the last line of a message wins
  }
  const byModel = {};
  for (const { model, usage: u } of seen.values()) {
    const t = (byModel[model] ??= empty());
    const w1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
    const w = u.cache_creation_input_tokens ?? 0;
    t.input += u.input_tokens ?? 0;
    t.write1h += w1h;
    t.write5m += w - w1h;
    t.read += u.cache_read_input_tokens ?? 0;
    t.output += u.output_tokens ?? 0;
  }
  return byModel;
}

// Dollars for writes (with uncached input) and reads, for a usageByModel result. Output
// isn't priced here (see the top of the file).
export function costOf(byModel) {
  const c = { writes: 0, reads: 0, total: 0, tokens: empty() };
  for (const [model, t] of Object.entries(byModel)) {
    const p = priceFor(model);
    const per = x => x / 1e6;
    c.writes += per(t.input) * p.input + per(t.write5m) * p.input * 1.25 + per(t.write1h) * p.input * 2;
    c.reads += per(t.read) * p.read;
    for (const k of Object.keys(t)) c.tokens[k] += t[k];
  }
  c.total = c.writes + c.reads;
  return c;
}

export function addCost(a, b) {
  const tokens = empty();
  for (const k of Object.keys(tokens)) tokens[k] = a.tokens[k] + b.tokens[k];
  return {
    writes: a.writes + b.writes, reads: a.reads + b.reads, total: a.total + b.total, tokens,
  };
}

export const zeroCost = () => ({ writes: 0, reads: 0, total: 0, tokens: empty() });

// Output dollars for a step's measured output tokens, at the model's list price.
export function outputCost(tokens, model = 'opus-5-5') {
  return (tokens / 1e6) * priceFor(model).output;
}

// A workflow agent's step: the builds are named by ticket, the review's reviewers and
// plan's verdict check roll up into their phase's step.
export function stepOf(meta) {
  const phase = (meta.workflowPhase ?? '').toLowerCase();
  if (phase === 'build') return meta.description;
  return phase || meta.description || 'unknown';
}
