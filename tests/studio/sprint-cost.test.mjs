// The sprint-cost reader (tests/studio/lib/sprint-cost.mjs, retro 08, issue #4): one API
// message counted once however many transcript lines carry it, cache writes and reads
// priced per model, and a model with no price refused rather than guessed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usageByModel, costOf, addCost, zeroCost, stepOf, outputCost } from './lib/sprint-cost.mjs';

const line = (id, model, usage, type = 'assistant') =>
  JSON.stringify({ type, message: { id, model, usage } });

const opus = { input_tokens: 10, cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 2_000_000,
  cache_creation: { ephemeral_5m_input_tokens: 1_000_000, ephemeral_1h_input_tokens: 0 }, output_tokens: 5 };

test('a message split over several lines is counted once', () => {
  const text = [line('m1', 'claude-opus-5-5', opus), line('m1', 'claude-opus-5-5', opus), 'not json',
    line('u1', 'claude-opus-5-5', opus, 'user')].join('\n');
  const u = usageByModel(text)['claude-opus-5-5'];
  assert.equal(u.write5m, 1_000_000);
  assert.equal(u.read, 2_000_000);
});

test('writes and reads are priced per model: Opus 5.5 writes at 1.25 x $4, reads at $0.20', () => {
  const c = costOf(usageByModel(line('m1', 'claude-opus-5-5', opus)));
  assert.equal(c.writes.toFixed(4), (5 + 10 * 4 / 1e6).toFixed(4));
  assert.equal(c.reads.toFixed(4), '0.4000');
  const s = costOf(usageByModel(line('m2', 'claude-sonnet-5', opus)));
  assert.equal(s.writes.toFixed(2), '2.50');
  assert.equal(s.reads.toFixed(2), '0.40');
});

test('a one-hour cache write costs twice the input price', () => {
  const u = { ...opus, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 1_000_000 } };
  assert.equal(costOf(usageByModel(line('m1', 'claude-opus-5-5', u))).writes.toFixed(2), '8.00');
});

test('a model with no price is refused, not guessed', () => {
  assert.throws(() => costOf(usageByModel(line('m1', 'some-other-model', opus))), /no price/);
});

test('costs add, output is priced from measured tokens, and builds keep their ticket as the step', () => {
  const a = costOf(usageByModel(line('m1', 'claude-opus-5-5', opus)));
  assert.equal(addCost(zeroCost(), a).total, a.total);
  assert.equal(outputCost(100_000), 2);
  assert.equal(stepOf({ workflowPhase: 'Build', description: 'build SHS-068' }), 'build SHS-068');
  assert.equal(stepOf({ workflowPhase: 'Review', description: 'Playtester' }), 'review');
});
