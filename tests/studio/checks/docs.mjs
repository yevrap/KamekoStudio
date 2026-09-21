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
      const status = text.match(/^-\s+\*\*Status:\*\*[ \t]*(.+)$/m)?.[1]?.trim();
      if (!status) { problems.push(`${f}: no Status line`); continue; }
      // The vocabulary is closed. Without this, `Done ✅`, `Done.` or `Shipped`
      // slipped past every evidence and criteria check below — forging the
      // status word simply replaced forging the evidence.
      if (!STATUSES.some(s => s.toLowerCase() === status.toLowerCase())) {
        problems.push(`${f}: unknown status "${status}" (expected one of: ${STATUSES.join(', ')})`);
        continue;
      }
      if (/^(Ready|In progress)$/i.test(status)) problems.push(`${f}: still "${status}" at the gate`);
      if (/^(Done)$/i.test(status)) {
        // `[ \t]` rather than `\s`, which matches a newline: `\s*(.*)` ate the
        // line break and captured the *next* line, so an entirely unfilled
        // Result section read as evidence — `**What changed:**` was "answered"
        // by the literal text `- **Tested by:**` below it. A whole ticket
        // shipped Done with an empty template and the check reported it
        // complete. Evidence may also continue on the following lines, so a
        // bare label is checked against what follows it rather than only
        // against the rest of its own line.
        const changed = evidenceFor(text, 'What changed');
        const tested = evidenceFor(text, 'Tested by');
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

/** The statuses a ticket may carry. Anything else is a mistake, not a synonym. */
export const STATUSES = ['Ready', 'In progress', 'Blocked', 'Done', "Won't do"];

/**
 * The ticket's Result section — the **last** one, with fenced code removed.
 *
 * Three things the first version got wrong, each found by taking evidence from
 * somewhere that is not the Result:
 *  - it searched the whole file, so a label inside a fenced Markdown example
 *    elsewhere in the ticket answered for an empty Result;
 *  - it took the first match, so a draft Result answered for the final one;
 *  - and `\s*(.*)` matched a newline, so each label was answered by the label
 *    below it.
 */
function resultSection(text) {
  const withoutFences = text.replace(/^```[\s\S]*?^```/gm, '');
  const headings = [...withoutFences.matchAll(/^##+[ \t]+Result[ \t]*$/gm)];
  if (!headings.length) return '';
  return withoutFences.slice(headings[headings.length - 1].index);
}

/**
 * What a ticket records under one Result label: the rest of its own line, plus
 * any lines beneath it, up to the next top-level label, heading or rule.
 * Returns '' when the label is present but nothing follows it.
 */
export function evidenceFor(text, label) {
  const section = resultSection(text) || text;
  const pattern = new RegExp(`^-[ \\t]+\\*\\*${label}:\\*\\*[ \\t]*(.*)$`, 'm');
  const match = pattern.exec(section);
  if (!match) return '';
  const rest = section.slice(match.index + match[0].length).split('\n');
  const body = [match[1]];
  for (const line of rest) {
    // A new top-level bullet, a heading, or a rule ends this label's evidence.
    if (/^-[ \t]+\*\*/.test(line) || /^#{1,6} /.test(line) || /^---\s*$/.test(line)) break;
    body.push(line);
  }
  return body.join('\n').trim();
}

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
