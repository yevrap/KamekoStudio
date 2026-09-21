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
      // One Status line, counted in the **raw** file. This is the general form
      // of a defect found twice: a status hidden above the real one in an HTML
      // comment, then in a fenced block, then in a raw `<script>` block, each
      // forging a status outside the vocabulary so that every evidence and
      // criteria check below was skipped. Stripping the known hiding places is
      // a game of spellings; requiring the ticket to declare its status exactly
      // once ends it, whatever the next hiding place turns out to be.
      const declared = statusLineCount(text);
      if (declared > 1) {
        problems.push(`${f}: ${declared} Status lines — a ticket declares its status once`);
        continue;
      }
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
        // One declaration of each thing, counted in the raw file. A second
        // one — wherever it is, however it is hidden, whether or not a reader
        // would see it — is a failure.
        const results = resultHeadingCount(text);
        if (results === 0) problems.push(`${f}: Done with no Result section`);
        else if (results > 1) problems.push(`${f}: ${results} Result sections — a ticket has one`);
        for (const label of ['What changed', 'Tested by']) {
          const n = labelCount(text, label);
          if (n > 1) problems.push(`${f}: "${label}" declared ${n} times — a ticket says it once`);
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

/**
 * How a ticket is read, after ten rounds of getting it wrong.
 *
 * The first nine attempts tried to work out *which text a reader sees* — first
 * by stripping hiding places out of the document, then by scanning it as
 * CommonMark. Both are the same bet: that this checker can decide what a
 * Markdown renderer would show. It lost that bet ten times. Stripping deleted
 * text that renders, which promoted a draft Result over the real one; scanning
 * missed a comment inside a blockquote, an HTML block interrupting a paragraph,
 * and a nested list's indentation. Each round closed one construct and the next
 * round found another, because the surface is the whole of CommonMark and the
 * checker is not a CommonMark implementation.
 *
 * So it stopped trying. **A ticket declares each thing exactly once**, counted
 * in the raw file, and that is the whole rule:
 *
 *   - one `## Result` heading
 *   - one `- **Status:**` line
 *   - one `- **What changed:**` and one `- **Tested by:**`
 *
 * It does not matter where a second one is hidden, or how, or whether a reader
 * would see it — a second declaration is a failure. That is the same shape as
 * the status rule, which is the one rule here that was never defeated, and it
 * is indifferent to every construct CommonMark has or will have.
 *
 * Unticked criteria are counted in the raw text too. A hidden decoy can only
 * make a ticket *fail*, which is the safe direction; a hidden real criterion
 * counts, which is the direction that kept being exploited.
 *
 * All sixteen tickets in this iteration already satisfy the rule, so it costs
 * nothing except saying what you mean once.
 */

// Two patterns for each thing, and the difference is the whole design.
//
// **Counting is permissive**: any indentation, any blockquote depth, anywhere
// in the file. A second declaration is a failure wherever it is, so a hidden
// one has to be *found*, not overlooked.
//
// **Reading is strict**: only a declaration at the margin. So even if counting
// somehow missed a forgery, the value still comes from the real line rather
// than from something buried in a quote or an example.
//
// Permissive where a miss would let something through; strict where a match
// would let something through. Each pattern errs in the safe direction for the
// job it does.
const ANYWHERE = '[ \\t>]*';
const STATUS_LINE = new RegExp(`^${ANYWHERE}-[ \\t]+\\*\\*Status:\\*\\*[ \\t]*(.+)$`, 'm');
const STATUS_STRICT = /^-[ \t]+\*\*Status:\*\*[ \t]*(.+)$/m;
const RESULT_HEADING = new RegExp(`^${ANYWHERE}#{1,6}[ \\t]+Result[ \\t]*$`, 'm');
const LABEL_ANY = label => new RegExp(`^${ANYWHERE}-[ \\t]+\\*\\*${label}:\\*\\*`, 'm');
const LABEL = label => new RegExp(`^-[ \\t]+\\*\\*${label}:\\*\\*[ \\t]*(.*)$`, 'm');

/** Every line in the raw file matching a single-line pattern. */
function occurrences(text, pattern) {
  return (String(text ?? '').match(new RegExp(pattern.source, 'gm')) || []).length;
}

/** The statuses a ticket may carry. Anything else is a mistake, not a synonym. */
export const STATUSES = ['Ready', 'In progress', 'Blocked', 'Done', "Won't do"];

/** Evidence shorter than this is a placeholder, not a record. */
const MIN_EVIDENCE = 12;

/** The ticket's status. */
export function statusOf(text) {
  return String(text ?? '').match(STATUS_STRICT)?.[1]?.trim() ?? '';
}

/** How many `- **Status:**` lines the file contains, hidden or not. */
export function statusLineCount(text) {
  return occurrences(text, STATUS_LINE);
}

/** How many `## Result` headings the file contains, hidden or not. */
export function resultHeadingCount(text) {
  return occurrences(text, RESULT_HEADING);
}

/** How many times one Result label is declared, hidden or not. */
export function labelCount(text, label) {
  return occurrences(text, LABEL_ANY(label));
}

/**
 * What a ticket records under one Result label: the rest of its own line, plus
 * the lines beneath it, up to the next top-level label, heading or rule.
 */
export function evidenceFor(text, label) {
  const source = String(text ?? '');
  const match = LABEL(label).exec(source);
  if (!match) return '';
  const body = [match[1]];
  for (const line of source.slice(match.index + match[0].length).split('\n')) {
    if (/^-[ \t]+\*\*/.test(line) || /^#{1,6} /.test(line) || /^---\s*$/.test(line)) break;
    body.push(line);
  }
  return body.join('\n').trim();
}

/**
 * Unticked acceptance criteria, in the raw text, whatever bullet or indentation
 * they use — including inside a blockquote or a nested list, both of which
 * render as empty boxes and both of which a cleverer reader missed.
 */
export function untickedCriteria(text) {
  return (String(text ?? '')
    .match(/^[ \t>]*(?:[-*+]|\d+[.)])[ \t]+\[[\s\u00a0]\]/gm) || []).length;
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
