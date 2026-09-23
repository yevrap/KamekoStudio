#!/usr/bin/env node
// link-tickets.mjs — link every bare SHS-NNN mention in the repo's Markdown to its ticket file.
//
//   node tests/studio/link-tickets.mjs            rewrite, then report
//   node tests/studio/link-tickets.mjs --dry-run  report what it would change; exit 1 if anything
//
// It reads every tracked `.md` file, so run it on a clean tree and commit what it
// changes. Studio docs go in a `(studio)` commit; an arcade doc it touches goes in its
// own `docs:` commit (guardrails.md, *Arcade docs about studio work*). Running it twice
// changes nothing. It also fails when any link to a ticket file, new or old, points at
// a file that does not exist. The rules for what stays plain: lib/ticket-links.mjs.
// The retro runs it before regenerating the steering views (process.md).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, gitPath } from './lib/shell.mjs';
import { linkTicketMentions, ticketLinkTargets, ticketTargets } from './lib/ticket-links.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dryRun = process.argv.includes('--dry-run');

const files = run(gitPath(), ['ls-files', '*.md'], { cwd: ROOT }).split('\n').filter(Boolean);
const tickets = ticketTargets(files.filter(f => f.startsWith('docs/studio/iterations/')));

const changed = [];
const plain = {};
const broken = [];
let linked = 0;
for (const file of files) {
  const abs = path.join(ROOT, file);
  if (!existsSync(abs)) continue;
  const before = readFileSync(abs, 'utf8');
  const r = linkTicketMentions(before, { file, tickets });
  linked += r.linked;
  for (const [reason, n] of Object.entries(r.plain)) plain[reason] = (plain[reason] ?? 0) + n;
  for (const target of ticketLinkTargets(r.text, file)) {
    if (!existsSync(path.join(ROOT, target))) broken.push(`${file} -> ${target}`);
  }
  if (r.text !== before) {
    changed.push(`${file} (${r.linked})`);
    if (!dryRun) writeFileSync(abs, r.text);
  }
}

const reasons = Object.entries(plain).sort(([a], [b]) => a.localeCompare(b)).map(([k, n]) => `${k} ${n}`).join(', ');
console.log(`${dryRun ? 'would link' : 'linked'} ${linked} mention(s) in ${changed.length} file(s); `
  + `${tickets.size} ticket file(s); left plain: ${reasons || 'none'}`);
for (const line of changed) console.log(`  ${line}`);
if (broken.length) {
  console.error(`${broken.length} ticket link(s) point at no file:\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
if (dryRun && changed.length) process.exit(1);
