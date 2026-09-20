// docs.mjs — the checks that keep the written record true.
//
// These are the ones an agent is most tempted to skip, because nothing visibly
// breaks when the paper trail is thin. That is exactly why they are automated.

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { walk, exists, readIfPresent } from '../lib/shell.mjs';
import { scanDocCleanliness } from '../lib/rules.mjs';

const iterationDir = ctx => path.join(ctx.root, 'docs/studio/iterations', ctx.iteration);
const REQUIRED = ['plan.md', 'log.md', 'review.md', 'retro.md'];

export const iterationDocs = {
  id: 'iteration-docs',
  stages: ['closeout'],
  description: 'Plan, tickets, log, review and retro all exist for this iteration',
  async run(ctx) {
    const dir = iterationDir(ctx);
    if (!(await exists(dir))) return { status: 'fail', detail: `${path.relative(ctx.root, dir)} does not exist` };

    const missing = [];
    for (const f of REQUIRED) if (!(await exists(path.join(dir, f)))) missing.push(f);
    const ticketDir = path.join(dir, 'tickets');
    const tickets = (await exists(ticketDir)) ? (await fs.readdir(ticketDir)).filter(f => f.endsWith('.md')) : [];
    if (!tickets.length) missing.push('tickets/SS-NNN-*.md (none found)');

    return missing.length
      ? { status: 'fail', detail: `iteration ${ctx.iteration} is missing: ${missing.join(', ')}` }
      : { status: 'pass', detail: `iteration ${ctx.iteration}: ${REQUIRED.join(', ')} and ${tickets.length} ticket(s)` };
  }
};

export const docsCurrent = {
  id: 'docs-current',
  stages: ['gate'],
  description: 'Every ticket in the iteration has a file, a status and evidence',
  async run(ctx) {
    const ticketDir = path.join(iterationDir(ctx), 'tickets');
    if (!(await exists(ticketDir))) return { status: 'fail', detail: `no tickets/ directory for iteration ${ctx.iteration}` };

    const files = (await fs.readdir(ticketDir)).filter(f => f.endsWith('.md'));
    if (!files.length) return { status: 'fail', detail: 'no ticket files' };

    const problems = [];
    for (const f of files) {
      const text = await fs.readFile(path.join(ticketDir, f), 'utf8');
      const status = text.match(/^-\s+\*\*Status:\*\*\s*(.+)$/m)?.[1]?.trim();
      if (!status) { problems.push(`${f}: no Status line`); continue; }
      if (/^(Ready|In progress)$/i.test(status)) problems.push(`${f}: still "${status}" at the gate`);
      if (/^(Done)$/i.test(status)) {
        const changed = text.match(/^-\s+\*\*What changed:\*\*\s*(.*)$/m)?.[1]?.trim();
        const tested = text.match(/^-\s+\*\*Tested by:\*\*\s*(.*)$/m)?.[1]?.trim();
        if (!changed) problems.push(`${f}: Done with no "What changed" evidence`);
        if (!tested) problems.push(`${f}: Done with no "Tested by" evidence`);
        const unchecked = (text.match(/^\s*-\s+\[ \]/gm) || []).length;
        if (unchecked) problems.push(`${f}: Done with ${unchecked} unticked acceptance criterion/criteria`);
      }
    }
    return problems.length
      ? { status: 'fail', detail: problems.join('\n') }
      : { status: 'pass', detail: `${files.length} ticket(s) complete` };
  }
};

export const reviewerVerdict = {
  id: 'reviewer-verdict',
  stages: ['gate'],
  description: "The Independent Reviewer's verdict is recorded in the iteration's review",
  async run(ctx) {
    const review = await readIfPresent(path.join(iterationDir(ctx), 'review.md'));
    if (review === null) return { status: 'fail', detail: `no review.md for iteration ${ctx.iteration}` };
    const verdict = review.match(/^-?\s*\*\*Verdict:\*\*\s*(.+)$/m)?.[1]?.trim();
    if (!verdict) return { status: 'fail', detail: 'review.md has no "**Verdict:**" line from the Independent Reviewer' };
    if (/^(pending|tbd|n\/a)$/i.test(verdict)) return { status: 'fail', detail: `verdict is "${verdict}"` };
    return { status: 'pass', detail: `verdict recorded: ${verdict}` };
  }
};

export const changelog = {
  id: 'changelog',
  stages: ['closeout'],
  description: 'The iteration has a changelog entry',
  async run(ctx) {
    const text = await readIfPresent(path.join(ctx.root, 'docs/studio/CHANGELOG.md'));
    if (text === null) return { status: 'fail', detail: 'docs/studio/CHANGELOG.md is missing' };
    const heading = `## [studio-iteration-${ctx.iteration}]`;
    return text.includes(heading)
      ? { status: 'pass', detail: `entry present for studio-iteration-${ctx.iteration}` }
      : { status: 'fail', detail: `no "${heading}" section` };
  }
};

export const docCleanliness = {
  id: 'doc-cleanliness',
  stages: ['closeout'],
  description: 'No stacked "superseded" passages; each document states one current version',
  async run(ctx) {
    const roots = [
      ...ctx.studioRoots.map(r => path.join(ctx.root, r)),
      ...ctx.extraDocRoots
    ];
    const findings = [];
    let scanned = 0;
    for (const dir of roots) {
      if (!(await exists(dir))) continue;
      for (const file of (await walk(dir)).filter(f => f.endsWith('.md'))) {
        scanned++;
        const isDecisionRecord = file.includes(`${path.sep}decisions${path.sep}`);
        for (const f of scanDocCleanliness(await fs.readFile(file, 'utf8'), { isDecisionRecord })) {
          findings.push(`${file.startsWith(ctx.root) ? path.relative(ctx.root, file) : file}:${f.line}: ${f.reason} — ${f.text}`);
        }
      }
    }
    if (!scanned) return { status: 'skip', detail: 'no markdown found in the configured roots' };
    return findings.length
      ? { status: 'fail', detail: `${findings.length} finding(s):\n  ${findings.join('\n  ')}` }
      : { status: 'pass', detail: `${scanned} document(s) state one current version` };
  }
};
