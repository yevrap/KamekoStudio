#!/usr/bin/env node
// sprint-cost.mjs — a studio sprint's cost on a paid API key, per step and per agent, in
// two of its three parts: cache writes (with uncached input) and cache reads (issue #4).
// The third, output, is the workflow's per-step output tokens at list price; the
// transcripts don't hold final output counts (lib/sprint-cost.mjs).
//
//   node tests/studio/sprint-cost.mjs                 the newest studio-sprint workflow run
//   node tests/studio/sprint-cost.mjs --run=wf_…      one run by id
//   node tests/studio/sprint-cost.mjs --list          every run found, newest first
//
// It reads Claude Code's local transcripts for this checkout (under the home directory's
// .claude/projects/), which never leave the machine. Only totals go into the scorecard;
// never commit a transcript or its path. The retro runs it (process.md, retro step).
// The conductor is the session that launched the run, counted whole: a session that
// did other work before the run over-counts, and the table says so.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { usageByModel, costOf, addCost, zeroCost, stepOf } from './lib/sprint-cost.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const projects = path.join(os.homedir(), '.claude', 'projects', ROOT.replace(/[^A-Za-z0-9]/g, '-'));
const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1];

function runs() {
  if (!existsSync(projects)) return [];
  const found = [];
  for (const session of readdirSync(projects)) {
    const dir = path.join(projects, session, 'subagents', 'workflows');
    if (!existsSync(dir)) continue;
    for (const run of readdirSync(dir)) {
      const runDir = path.join(dir, run);
      found.push({ run, session, runDir, mtime: statSync(runDir).mtimeMs });
    }
  }
  return found.sort((a, b) => b.mtime - a.mtime);
}

const all = runs();
if (process.argv.includes('--list')) {
  for (const r of all) console.log(r.run, new Date(r.mtime).toISOString(), readdirSync(r.runDir).filter(f => f.endsWith('.meta.json')).length, 'agents');
  process.exit(0);
}
const pick = arg('run') ? all.find(r => r.run === arg('run')) : all[0];
if (!pick) { console.error('No studio-sprint workflow run found in the local transcripts.'); process.exit(1); }

const agents = [];
for (const f of readdirSync(pick.runDir).filter(f => f.endsWith('.meta.json'))) {
  const meta = JSON.parse(readFileSync(path.join(pick.runDir, f), 'utf8'));
  const jsonl = path.join(pick.runDir, f.replace('.meta.json', '.jsonl'));
  const cost = existsSync(jsonl) ? costOf(usageByModel(readFileSync(jsonl, 'utf8'))) : zeroCost();
  agents.push({ name: meta.description, step: stepOf(meta), model: meta.model ?? 'default', cost });
}
const conductorFile = path.join(projects, `${pick.session}.jsonl`);
const conductor = existsSync(conductorFile) ? costOf(usageByModel(readFileSync(conductorFile, 'utf8'))) : zeroCost();

const $ = x => `$${x.toFixed(2)}`;
const k = x => `${Math.round(x / 1000)}k`;
const row = (label, c) => `| ${label} | ${$(c.writes)} | ${$(c.reads)} | **${$(c.total)}** | ${k(c.tokens.write5m + c.tokens.write1h + c.tokens.input)} / ${k(c.tokens.read)} |`;
const head = '| | Writes | Reads | Writes + reads | Tokens written / read |\n|---|---|---|---|---|';

const steps = new Map();
for (const a of agents) steps.set(a.step, addCost(steps.get(a.step) ?? zeroCost(), a.cost));
let sprint = conductor;
for (const c of steps.values()) sprint = addCost(sprint, c);

console.log(`Run ${pick.run}: ${agents.length} agents\n\nBy step\n\n${head}`);
for (const [s, c] of [...steps].sort((a, b) => b[1].total - a[1].total)) console.log(row(s, c));
console.log(row('conductor (whole session)', conductor));
console.log(row('**sprint**', sprint));
console.log(`\nBy agent\n\n${head}`);
for (const a of agents.sort((x, y) => y.cost.total - x.cost.total)) console.log(row(`${a.name} (${a.model})`, a.cost));
