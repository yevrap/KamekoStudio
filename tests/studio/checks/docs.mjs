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
      const status = statusOf(text);
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
        if (!hasResultSection(text)) {
          problems.push(`${f}: Done with no Result section`);
        }
        const changed = evidenceFor(text, 'What changed');
        const tested = evidenceFor(text, 'Tested by');
        if (changed.length < MIN_EVIDENCE) {
          problems.push(`${f}: Done with no "What changed" evidence${changed ? ` (only ${JSON.stringify(changed)})` : ''}`);
        }
        if (tested.length < MIN_EVIDENCE) {
          problems.push(`${f}: Done with no "Tested by" evidence${tested ? ` (only ${JSON.stringify(tested)})` : ''}`);
        }
        // `[\s\u00a0]` rather than a literal space: `- [ ]` with a non-breaking
        // space renders as an unticked box and counted as zero.
        const unchecked = untickedCriteria(text);
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
/**
 * Everything a reader would not see as prose: fenced blocks of any style,
 * indented up to three spaces as CommonMark allows, and HTML comments.
 *
 * Unclosed forms run to the end of the document, because that is what they do
 * when rendered — an unclosed fence swallowing the rest of the file was one of
 * the four ways a ticket still shipped with an empty Result.
 */
function withoutHiddenText(text) {
  return text
    .replace(/^[ \t]{0,3}(```+|~~~+)[\s\S]*?^[ \t]{0,3}\1/gm, '')
    .replace(/^[ \t]{0,3}(```+|~~~+)[\s\S]*$/m, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!--[\s\S]*$/, '');
}

/**
 * The ticket's last Result section, or **null** when it has none.
 *
 * Null, not the whole file. The previous version fell back to the raw text
 * whenever its heading pattern missed — and it missed on `## Result (final)`
 * and on a lowercase `## result` — so a ticket could route its evidence through
 * a fenced example or an HTML comment simply by spelling the heading
 * differently, or by omitting it. A fail-open fallback inside the function
 * written to stop evidence coming from the wrong place.
 */
function resultSection(text) {
  const visible = withoutHiddenText(text);
  const headings = [...visible.matchAll(/^##+[ \t]+Result\b[^\n]*$/gim)];
  if (!headings.length) return null;
  return visible.slice(headings[headings.length - 1].index);
}

/**
 * The ticket's status, read from the text a person would see.
 *
 * Read through `withoutHiddenText` and taken as the **first** visible match.
 * The previous version matched the raw file, so an HTML comment or a fenced
 * block placed above the real line supplied the status instead — and since
 * every evidence and criteria check below is gated on the status being `Done`,
 * forging it to anything outside the vocabulary skipped all of them. A ticket
 * could read "Done" to a human, carry an empty Result and no ticked criteria,
 * and pass. The seventh review demonstrated it on this iteration's own tickets.
 */
export function statusOf(text) {
  return withoutHiddenText(String(text ?? '')).match(/^-[ \t]+\*\*Status:\*\*[ \t]*(.+)$/m)?.[1]?.trim() ?? '';
}

/**
 * How many acceptance criteria are still unticked.
 *
 * Any of GFM's three bullet characters, because `*` and `+` render as task
 * items exactly as `-` does — a Done ticket with every criterion unticked as
 * `* [ ]` counted as zero. Non-breaking space included for the same reason it
 * always was: it renders as an empty box.
 */
export function untickedCriteria(text) {
  return (withoutHiddenText(String(text ?? '')).match(/^[ \t]*[-*+][ \t]+\[[\s\u00a0]\]/gm) || []).length;
}

/** Whether a ticket has a Result section at all. A Done ticket must. */
export function hasResultSection(text) {
  return resultSection(text) !== null;
}

/** Evidence shorter than this is a placeholder, not a record. */
const MIN_EVIDENCE = 12;

/**
 * What a ticket records under one Result label: the rest of its own line, plus
 * any lines beneath it, up to the next top-level label, heading or rule.
 * Returns '' when the label is present but nothing follows it.
 */
export function evidenceFor(text, label) {
  const section = resultSection(text);
  if (section === null) return '';
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
