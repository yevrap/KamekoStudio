export const meta = {
  name: 'studio-sprint',
  description: 'Run the Shadow Studio sprint step by step, one fresh agent per step, from next.md to the end of the sprint',
  whenToUse: 'When Yevster says "run the studio", "run a studio sprint" or "kick off the studio". Args (optional): a focus string, or { focus, sprints, steps }. See docs/studio/decisions/ADR-0011-the-studio-runs-itself.md.',
  phases: [
    { title: 'Start', detail: 'read where the studio is' },
    { title: 'Plan', detail: 'Playtester on open verdicts, then sprint planning' },
    { title: 'Build', detail: 'one ticket per agent' },
    { title: 'Review', detail: 'QA, Independent Reviewer and Playtester in parallel, then the record' },
    { title: 'Close', detail: 'records, gate, publish' },
    { title: 'Retro', detail: 'retrospective and steering views' },
  ],
}

// Shadow Studio — ADR-0011. The executive starts this and watches it in /workflows.
// Each step of the sprint is a fresh agent that follows the studio-iteration skill for the
// one step docs/studio/steering/next.md names (ADR-0009). The workflow owns the order, the
// reviewers and the stop conditions; the agents own the work.

const opts = typeof args === 'string' ? { focus: args } : (args || {})
const MAX_SPRINTS = opts.sprints || 1
const MAX_STEPS = opts.steps || 14
const RUNNABLE = /^\*\*Next:\*\*\s*`(plan|build|review|close|retro)\b/
const SKILL = '.claude/skills/studio-iteration/SKILL.md'
const LIVE = 'https://yevrap.github.io/KamekoStudio/studio/'

const STEP_RESULT = {
  type: 'object',
  properties: {
    step: { type: 'string', description: 'the step you did, e.g. "build SHS-063"' },
    ok: { type: 'boolean', description: 'true only if the step finished and next.md was rewritten, committed and pushed' },
    summary: { type: 'string', description: '2-4 plain sentences for the executive: what you did, and what a player can now see or play' },
    checks: { type: 'string', description: 'each check you ran: pass / fail / not run' },
    live: { type: 'string', description: 'the live URL of anything player-visible that changed, or empty' },
    nextLine: { type: 'string', description: 'the **Next:** line of docs/studio/steering/next.md after your rewrite, verbatim' },
  },
  required: ['step', 'ok', 'summary', 'nextLine'],
}

const FINDINGS = {
  type: 'object',
  properties: {
    verdict: { type: 'string', description: 'your **Verdict:** line: Approve, Approve with findings, or Reject, with one line why' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', description: 'player-facing, production, save, process, test strength, or nit' },
          finding: { type: 'string' },
          evidence: { type: 'string', description: 'reproduction steps, commands and their output, file:line' },
        },
        required: ['id', 'finding', 'evidence'],
      },
    },
  },
  required: ['verdict', 'findings'],
}

const VERDICTS = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          item: { type: 'string', description: 'ticket id and name' },
          verdict: { type: 'string', enum: ['Keep', 'Iterate', 'Kill'] },
          evidence: { type: 'string', description: 'what happened on screen, and what it means for the game' },
          next: { type: 'string', description: 'for Iterate: the one or two changes that would most improve it; for Kill: what to remove and why' },
          screenshots: { type: 'string', description: 'paths of the screenshots you saved outside the repository' },
        },
        required: ['item', 'verdict', 'evidence'],
      },
    },
    forTheExecutive: { type: 'string', description: 'anything only a real hand on a real phone can answer, or empty' },
  },
  required: ['items'],
}

const STEP_PROMPT = extra => `You are one step of the Shadow Studio sprint, run by the studio-sprint workflow in Yevster's Claude Code session (docs/studio/decisions/ADR-0011-the-studio-runs-itself.md). Yevster is watching the run but not answering questions: never ask or wait for input — an open product question goes to docs/studio/steering/questionnaire.md with its ⭐ and you proceed on the ⭐.

Read ${SKILL} and follow it exactly for the ONE step docs/studio/steering/next.md names — nothing more. Do not spawn subagents: where the skill asks for QA, the Independent Reviewer or the Playtester, this workflow has run them and their results are below. End the way the skill says (next.md rewritten, records committed and pushed through the checks), then return the structured result. Report checks honestly: never "pass" for a check that did not run.
${extra}`

const PLAYTESTER = task => `You are the Playtester of Shadow Studio. Read docs/studio/team/playtester.md (your role) and docs/brief.md (the studio's taste) first.

${task}

How to play: drive headless Chrome with puppeteer-core, which is installed in this repository (Chrome is at $CHROME_PATH, or /Applications/Google Chrome.app/Contents/MacOS/Google Chrome). Play at 390x780 and at 320x640, with a fresh browser profile each time, using real pointer and key input, over several full runs: the first minute, a long run, a restart, game over and back. Take screenshots at the moments that matter.

Rules: write your throwaway scripts and screenshots OUTSIDE the repository, in the system temp directory. Do not create, modify or commit any file in the repository. Do not read the diff, the tickets' Result sections or review notes before you have played. Judge the game as a player, against the taste brief, not against the ticket.`

const REVIEWER = (role, file) => `You are the ${role} of Shadow Studio, with fresh context. Read docs/studio/team/${file} (your role) first.

Review the current sprint: its diff is \`git diff <tag>..HEAD\`, where <tag> is the newest \`studio-iteration-*\` tag (\`git describe --tags --match 'studio-iteration-*' --abbrev=0\`), and its tickets are in the newest docs/studio/iterations/NN/tickets/. Check each ticket's claims against the code and against real runs; a finding is a reproduction or a file:line, not an opinion. Production fixes (ADR-0008) get extra care: name the full commit hash you reviewed.

Read-only: do not create, modify or commit any file in the repository; put any scratch files in the system temp directory. Return your verdict line and your findings.`

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

// --- where is the studio? --------------------------------------------------
phase('Start')
const start = await agent(
  'Read docs/studio/steering/next.md and return its **Next:** line verbatim, and whether a file named STOP exists at the repository root. Change nothing.',
  { label: 'read next.md', phase: 'Start', model: 'haiku', effort: 'low',
    schema: { type: 'object', properties: { nextLine: { type: 'string' }, stopFile: { type: 'boolean' } }, required: ['nextLine', 'stopFile'] } })
if (!start) return { stopped: 'could not read next.md' }
if (start.stopFile) {
  log('A STOP file is at the repo root. Delete it (or say "resume the studio") and run again.')
  return { stopped: 'STOP file' }
}

let nextLine = start.nextLine
let focus = opts.focus ? `Executive direction for this step ($ARGUMENTS): focus: ${opts.focus}` : ''
let sprintsDone = 0
const done = []
log(`The studio is at: ${nextLine.replace(/^\*\*Next:\*\*\s*/, '')}${opts.focus ? ` — focus: ${opts.focus}` : ''}`)

while (done.length < MAX_STEPS) {
  const m = nextLine.match(RUNNABLE)
  if (!m) { log(`Stopping: the studio is waiting on you — ${nextLine.replace(/^\*\*Next:\*\*\s*/, '')}`); break }
  const kind = m[1]
  const name = (nextLine.match(/`([^`]+)`/) || [null, kind])[1]
  if (kind === 'plan' && sprintsDone >= MAX_SPRINTS) {
    log(`Sprint finished. Stopping before ${name}; say "run the studio" to start the next one.`)
    break
  }
  phase(cap(kind))
  let extra = focus
  focus = ''

  if (kind === 'plan') {
    const pt = await agent(PLAYTESTER(
      `Open the newest docs/studio/iterations/NN/review.md and find its Keep / Iterate / Kill section. For each player-visible item there that has no verdict from the Playtester or from the executive (a line the team wrote about its own work does not count), play it on the live site (the review's demo list has the URLs; the realm is ${LIVE}) and give your verdict. If every item already has one, return an empty items list without playing.`),
      { label: 'Playtester: open verdicts', phase: 'Plan', model: 'opus', schema: VERDICTS })
    if (pt && pt.items.length) {
      log(`Playtester: ${pt.items.map(i => `${i.item} → ${i.verdict}`).join('; ')}`)
      extra += `\n\nThe Playtester's verdicts on the last sprint's open items (ADR-0011: the team acts on them; the executive may override). Record them in that review.md's Keep / Iterate / Kill section with their evidence, and turn every Iterate or Kill into backlog items before pulling:\n${JSON.stringify(pt, null, 2)}`
    }
  }

  if (kind === 'review') {
    const [ir, qa, pt] = await parallel([
      () => agent(REVIEWER('Independent Reviewer', 'independent-reviewer.md'),
        { label: 'Independent Reviewer', phase: 'Review', model: 'fable', schema: FINDINGS }),
      () => agent(REVIEWER('QA Engineer', 'qa-engineer.md'),
        { label: 'QA Engineer', phase: 'Review', model: 'opus', schema: FINDINGS }),
      () => agent(PLAYTESTER(
        `Play every player-visible change this sprint made. The newest docs/studio/iterations/NN/plan.md says what will be visible (read only that section); the live realm is ${LIVE}. Give each one a Keep / Iterate / Kill.`),
        { label: 'Playtester', phase: 'Review', model: 'opus', schema: VERDICTS }),
    ])
    const missing = [['Independent Reviewer', ir], ['QA Engineer', qa], ['Playtester', pt]].filter(([, r]) => !r).map(([n]) => n)
    if (missing.length) log(`Did not return: ${missing.join(', ')} — the review step records that`)
    if (ir) log(`Independent Reviewer: ${ir.verdict}`)
    if (qa) log(`QA: ${qa.verdict}`)
    if (pt) log(`Playtester: ${pt.items.map(i => `${i.item} → ${i.verdict}`).join('; ') || 'nothing player-visible'}`)
    extra += `\n\nThe reviewers this workflow ran for you (one round). Record each verdict line in review.md as the skill says, turn every finding into a fix now (if S), a backlog item, or a recorded decline, and put the Playtester's verdicts in the Keep / Iterate / Kill section. A reviewer that is missing did not return: say so, don't invent its verdict.\n\nIndependent Reviewer (fable):\n${JSON.stringify(ir, null, 2)}\n\nQA Engineer (opus):\n${JSON.stringify(qa, null, 2)}\n\nPlaytester (opus):\n${JSON.stringify(pt, null, 2)}`
  }

  const r = await agent(STEP_PROMPT(extra), { label: name, phase: cap(kind), schema: STEP_RESULT })
  if (!r) { log(`Stopping: the ${name} agent didn't return. next.md says where the studio is.`); break }
  done.push(r)
  log(`${r.ok ? '✓' : '✗'} ${r.step}: ${r.summary}${r.live ? ` — ${r.live}` : ''}`)
  if (!r.ok) { log('Stopping: that step did not finish cleanly. Its report is above; next.md says what remains.'); break }
  if (r.nextLine === nextLine) { log('Stopping: next.md did not move, so the step made no progress.'); break }
  if (kind === 'retro') sprintsDone++
  nextLine = r.nextLine
}
if (done.length >= MAX_STEPS) log(`Stopping: reached the ${MAX_STEPS}-step limit for one run.`)

return {
  steps: done.map(d => ({ step: d.step, ok: d.ok, summary: d.summary, checks: d.checks, live: d.live })),
  next: nextLine,
}
