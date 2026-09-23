// rules.mjs — the pure logic behind the studio self-checks.
//
// Everything here is a plain function over strings and arrays: no filesystem,
// no git, no network. That keeps the rules unit-testable (see rules.test.mjs)
// and keeps the check modules thin wrappers that gather input and report.

/** Paths the studio may create or modify. See docs/studio/guardrails.md. */
export const ALLOWED_PREFIXES = [
  'studio/',
  'docs/studio/',
  'tests/studio/'
];

/**
 * Paths outside the allowed list that the executive has approved, each narrowed
 * to a specific content change. `allow(diff)` receives the unified diff for that
 * file and returns null when the change is within the exception, or a string
 * explaining why it is not.
 */
export const EXPECTED_STUDIO_SCRIPT = 'node tests/studio/check.mjs';

/**
 * Paths outside the allowed list that the executive has approved, each narrowed
 * to a specific content change. `allow(before, after)` receives the file's text
 * at the base revision and its text now, and returns null when the change is
 * within the exception or a string explaining why it is not.
 *
 * Content, not diff text: an earlier version parsed `+`/`-` lines, which meant
 * it saw nothing at all once the change was committed and the tree was clean.
 */
export const PATH_EXCEPTIONS = [
  {
    path: 'package.json',
    reason: 'the single "studio:check" scripts entry (ADR-0002)',
    allow: allowOnlyStudioCheckScript
  },
  {
    path: 'shared/3d/gameplay.js',
    reason: 'the front-wall portal row that restores the dropped games (ADR-0005)',
    allow: allowOnlyFrontPortalRow
  },
  {
    path: 'shared/3d/constants.js',
    reason: "River Run's portal url opens the studio fork (ADR-0010)",
    allow: allowOnlyStudioForkPortal
  }
];

/**
 * The studio's own workflow — its skills and the Claude Code conductor — which a
 * retro must be able to change (direction rule 8). ADR-0011 §6 makes them a
 * recorded exception (backlog #41, SHS-065), different in kind from the ones
 * above: a whole family of files rather than one approved edit, admitted only
 * in a **ticketed** studio commit (`sortCommitsByKind`), and reported as used
 * every time. They are not studio paths: an arcade commit that changes them is
 * the arcade's own work, judged by the arcade's rules and never reported here.
 */
export const WORKFLOW_EXCEPTION = {
  reason: "the studio's own skills and conductor, in ticketed studio commits (ADR-0011 §6)"
};

/** Any file under a `.claude/skills/studio-` directory, or `.claude/workflows/studio-sprint.js`. */
export function isWorkflowPath(p) {
  const text = String(p ?? '');
  if (text.split('/').some(seg => seg === '' || seg === '.' || seg === '..')) return false;
  return /^\.claude\/skills\/studio-[^/]+\/./.test(text) || text === '.claude/workflows/studio-sprint.js';
}

/**
 * Files inside the studio's own paths that ADR-0011 §6 keeps the executive's.
 * A studio commit, or an uncommitted change, to one is a violation; the
 * executive's own commits reach them through `COMMIT_EXEMPTIONS`.
 *
 * Only ADR-0011 itself is listed. The rest of what §6 keeps executive-only — the
 * hard-stop list, the guard's allowed paths and exceptions, the storage and
 * hygiene rules — lives in files the studio edits for other reasons (this one
 * included), so no path rule can hold it; the independent review does
 * (guardrails.md).
 */
export const EXECUTIVE_ONLY_PATHS = [
  { path: 'docs/studio/decisions/ADR-0011-the-studio-runs-itself.md', reason: 'ADR-0011 itself, which its section 6 keeps the executive\'s' }
];

/** Every dotted key path at which two JSON values differ. */
export function jsonDiffPaths(before, after, prefix = '') {
  const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!plain(before) || !plain(after)) {
    return JSON.stringify(before) === JSON.stringify(after) ? [] : [prefix || '(root)'];
  }
  const paths = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    paths.push(...jsonDiffPaths(before[key], after[key], prefix ? `${prefix}.${key}` : key));
  }
  return paths;
}

/**
 * The package.json exception, checked against the parsed file rather than the
 * diff: the only difference permitted between the base revision and now is
 * scripts["studio:check"], and its value must be exactly the expected command.
 *
 * Checking the value matters as much as the key — "studio:check" is a script
 * this repository runs, so an arbitrary command smuggled into it would execute.
 */
export function allowOnlyStudioCheckScript(before, after) {
  let base, now;
  try {
    base = JSON.parse(before && before.trim() ? before : '{}');
    now = JSON.parse(after && after.trim() ? after : '{}');
  } catch (err) {
    return `package.json is not parseable JSON: ${err.message}`;
  }

  const offending = jsonDiffPaths(base, now).filter(p => p !== 'scripts.studio:check');
  if (offending.length) return `changes beyond scripts["studio:check"]: ${offending.join(', ')}`;

  const value = now.scripts && now.scripts['studio:check'];
  if (value !== undefined && value !== EXPECTED_STUDIO_SCRIPT) {
    return `scripts["studio:check"] must be exactly "${EXPECTED_STUDIO_SCRIPT}", found "${value}"`;
  }
  return null;
}

/**
 * The approved edit to shared/3d/gameplay.js, undone.
 *
 * The exception is for one change and no other, so rather than describing what
 * may change, this removes exactly that change from the current text and
 * requires the result to equal the base revision byte for byte. Anything else
 * edited anywhere in the file — a line above, a number below, a stray space —
 * breaks the equality and the guard fails. That is the intended sharpness: an
 * exception is approved once, for one edit.
 */
// The block is matched by its exact shape, and the shape is a token grammar.
//
// Two earlier versions failed, each in the same way: they described what an
// argument may not contain instead of what it is.
//
//   "no brackets"     — anything appended inside the block was reverted with it.
//   "no parentheses"  — a tagged template calls and an assignment assigns
//                       without one. Three exfiltration payloads went through.
//   a character class — `[-+*/\s\w.]+` still admits `delete engineState.walls`,
//                       `new fetch`, `typeof window` and `obj.prop++`, because
//                       every keyword is made of word characters. Deleting
//                       `engineState.walls` blanks the production landing page
//                       while the guard prints "exception used". Twelve payloads.
//
// A character class cannot express "a number, an identifier, a property path, or
// an operator", because it cannot forbid two operands sitting next to each other
// — and `new X`, `delete a.b`, `typeof x` and `void x` are all exactly that. So
// the grammar is spelled out: an argument is operands joined by operators, and
// nothing else. `x++` fails because nothing follows the operator; `--x` fails
// because an operand cannot begin with `-`; `1 /* p */ + 1` fails because `*` is
// not an operand.
const OPERAND = String.raw`(?:\d+(?:\.\d+)?|[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)`;
const ARG = String.raw`-?\s*${OPERAND}(?:\s*[-+*/]\s*-?\s*${OPERAND})*`;
const VECTOR = String.raw`new THREE\.Vector3\(\s*${ARG},\s*${ARG},\s*${ARG}\s*\)`;

// Exactly three elements, because the approved scope in guardrails.md is three
// front-wall positions. Leading comment lines are permitted and bounded: only
// `//` line comments, so nothing after them can be commented out, and `hygiene`
// scans this file as an exception path, so smuggled text is caught there.
//
// The trailing lookahead anchors the block to the statement it belongs in front
// of. Without it the whole row could be moved verbatim into another function —
// reverted away from wherever it landed, and accepted.
const FRONT_ROW_BLOCK = new RegExp(
  String.raw`\n(?:[ \t]*//[^\n]*\n){0,12}[ \t]*const frontPositions = \[\n` +
  String.raw`[ \t]*${VECTOR},\n[ \t]*${VECTOR},\n[ \t]*${VECTOR}\n[ \t]*\];` +
  String.raw`(?=\n[ \t]*const positions = \[)`
);

const POSITIONS_WITH_FRONT = /(const positions = \[[^\]]*?),\s*\.\.\.frontPositions(\])/;  // studio-check:allow
const ROTATIONS_WITH_FRONT = /(\.\.\.backPositions\.map\(\(\) => 0\)),\n[ \t]*\.\.\.frontPositions\.map\(\(\) => Math\.PI\)/;

export function revertFrontPortalRow(after) {
  return String(after)
    .replace(FRONT_ROW_BLOCK, '')
    .replace(POSITIONS_WITH_FRONT, '$1$2')
    .replace(ROTATIONS_WITH_FRONT, '$1');
}

export function allowOnlyFrontPortalRow(before, after) {
  if (before === after) return null;          // unchanged since the base revision
  if (!before) return 'the file did not exist at the base revision';
  // A row of positions with no matching rotations renders portals facing an
  // arbitrary direction. Tested through the anchored pattern, not by grepping
  // the file for the text: the loose version was satisfied by that string
  // sitting in a comment *inside the approved block*, which is reverted away —
  // so the real rotation entry could be deleted and the guard would accept it.
  if (!ROTATIONS_WITH_FRONT.test(after)) {
    return 'the front-wall row has no matching rotation entry';
  }
  if (revertFrontPortalRow(after) === before) return null;
  return 'changes beyond the front-wall portal row in createEnvironment()';
}

/**
 * The portals on the 3D landing page that open a studio fork instead of the
 * production game, by the entry's name. One today (ADR-0010). A second fork's
 * portal is a new approval and a new row, never an edit to this one.
 */
export const STUDIO_FORK_PORTALS = [
  { name: 'River Run Rapids', from: 'games/river-run/', to: 'studio/games/river-run/' }
];

const quoted = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The approved edits to shared/3d/constants.js, undone: each fork's `url` goes
 * back to its production game, matched on that entry's own line — the name
 * immediately before the url — so the fork's url on any other entry is not
 * undone and fails the comparison.
 */
export function revertStudioForkPortal(text) {
  let out = String(text ?? '');
  for (const { name, from, to } of STUDIO_FORK_PORTALS) {
    const entry = new RegExp(`(\\{ name: "${quoted(name)}", url: ")${quoted(to)}(")`);
    out = out.replace(entry, `$1${from}$2`);
  }
  return out;
}

/**
 * The frontPositions rule's shape, for one value: remove the approved change
 * from both sides and require byte equality. Both sides, because once the
 * change is released it is in the base, and the next iteration must see it as
 * unchanged rather than as a url the base "did not have". Pointing River Run
 * back at production passes too: that is the rollback, not a new change.
 */
export function allowOnlyStudioForkPortal(before, after) {
  if (before === after) return null;
  if (!before) return 'the file did not exist at the base revision';
  if (revertStudioForkPortal(after) === revertStudioForkPortal(before)) return null;
  return "changes beyond River Run's portal url in ARCADE_GAMES";
}

/**
 * How many portals the 3D landing page can show, and how many games want one.
 *
 * The landing page builds its portal positions by concatenating named tables and
 * then iterates the game list against them, skipping any index with no position:
 *
 *     ARCADE_GAMES.forEach((game, index) => {
 *         if (!positions[index]) return;
 *
 * That `return` is silent, so for two years the page could show nine portals
 * while the list held eleven games and nothing said so — two shipped games had
 * no door and nobody noticed (TD-002). This rule is what says so.
 *
 * @returns {{games: number|null, slots: number|null, positionTables: string[],
 *            rotationTables: string[], problems: string[]}}
 */
/**
 * Comments are not code. A commented-out position was counted as a slot, which
 * made the rule report more room than the page has — the exact direction of
 * error it exists to prevent. Stripped before anything is counted.
 *
 * The `[^:]` guard keeps `https://` in a URL from being read as a comment. No
 * string in either file contains `/*` or a brace, which is what lets this be a
 * scanner rather than a parser; if that stops being true, this needs to become
 * one.
 */
function stripComments(source) {
  return String(source ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Brace-balanced objects at the top level of an array body. */
function countEntries(body) {
  let depth = 0, count = 0;
  for (const ch of body) {
    if (ch === '{') { if (depth === 0) count += 1; depth += 1; }
    else if (ch === '}') depth -= 1;
  }
  return count;
}

export function portalCapacity(gameplay, constants) {
  const problems = [];
  const consts = stripComments(constants);
  const source = stripComments(gameplay);

  const gameList = /ARCADE_GAMES\s*=\s*\[([\s\S]*?)\];/.exec(consts);
  // Entries are counted as objects, not as occurrences of `name:`. Counting the
  // key meant an entry written { url, name, color } was invisible, and the rule
  // reported a full room while the page dropped two games.
  const games = gameList ? countEntries(gameList[1]) : null;
  if (games === null) problems.push('could not find ARCADE_GAMES in the constants source');

  const positionsDecl = /const\s+positions\s*=\s*\[([^\]]*)\]\s*;/.exec(source);
  const rotationsDecl = /const\s+rotations\s*=\s*\[([\s\S]*?)\];/.exec(source);

  const spreads = text => [...String(text).matchAll(/\.\.\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]);
  const positionTables = positionsDecl ? spreads(positionsDecl[1]) : [];
  const rotationTables = rotationsDecl ? spreads(rotationsDecl[1]) : [];

  if (!positionsDecl) {
    // Includes `= [...].slice(0, 9);`, which reads as nine slots at runtime
    // however many the tables hold.
    problems.push('could not find the positions table as a plain array of spreads ending in "];"');
  } else if (!/^\s*(?:\.\.\.[A-Za-z_$][\w$]*\s*,\s*)*\.\.\.[A-Za-z_$][\w$]*\s*$/.test(positionsDecl[1])) {
    problems.push(`the positions table holds something other than spreads: ${positionsDecl[1].trim().slice(0, 60)}`);
  }
  if (!rotationsDecl) problems.push('could not find the rotations table in the gameplay source');

  // A table can be built correctly and then shortened. `positions.length = 9`
  // is two words and undoes the whole row.
  if (/\bpositions\s*\.\s*(?:length\s*=|splice\s*\(|pop\s*\(|shift\s*\()/.test(source)) {
    problems.push('positions is shortened after it is built, so the table the rule counts is not the table the page uses');
  }

  let slots = positionsDecl ? 0 : null;
  for (const name of positionTables) {
    const decl = new RegExp(`const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`).exec(source);
    if (!decl) { problems.push(`positions spreads ${name}, which is not declared as an array literal`); slots = null; break; }
    slots += (decl[1].match(/new\s+THREE\.Vector3\s*\(/g) ?? []).length;
  }

  // A position with no rotation renders a portal facing an arbitrary direction,
  // which is the mistake a new row invites. The tables are compared in order,
  // not as sets: `positions` and `rotations` are indexed by the same counter, so
  // listing the same tables in a different order points every portal on two
  // walls the wrong way while covering exactly the same names.
  const missing = positionTables.filter(n => !rotationTables.includes(n));
  for (const name of missing) problems.push(`${name} has positions but no matching rotations`);
  if (!missing.length && positionTables.join() !== rotationTables.join()) {
    problems.push(`positions and rotations list the same tables in different orders (${positionTables.join(', ')} vs ${rotationTables.join(', ')}) — every portal after the first difference would face the wrong way`);
  }

  if (games !== null && slots !== null && games > slots) {
    problems.push(`${games} games but only ${slots} portal slots — the last ${games - slots} would be dropped silently`);
  }

  return { games, slots, positionTables, rotationTables, problems };
}

/**
 * Production files the studio is fixing, under the executive's standing
 * permission to fix production through the full sprint process (ADR-0008).
 * One entry per file per ticket: `{ path, ticket, iteration }`.
 *
 * An entry is a fact about one iteration, not a licence. The guard admits the
 * path only while that iteration is the one being checked, only when the ticket
 * has a file in that iteration's `tickets/`, and only when every commit that
 * changed the path names that ticket — see `productionFixProblem`. Entries stay
 * after their iteration ships: together they are the record of every production
 * file the studio has changed, and why.
 */
export const PRODUCTION_FIXES = [
  // TD-009: spirals left orbiting a removed black hole threw on every frame.
  { path: 'games/black-hole-in-one/ui.js', ticket: 'SHS-052', iteration: '04' },
  // Its regression tests, in production's own suite.
  { path: 'scripts/e2e.mjs', ticket: 'SHS-052', iteration: '04' },
  // p0-17: River Run's Restart Game could freeze the river until reload.
  { path: 'games/river-run/index.html', ticket: 'SHS-066', iteration: '07' },
  // Its regression tests, in production's own suite.
  { path: 'scripts/e2e.mjs', ticket: 'SHS-066', iteration: '07' }
];

/**
 * Classify changed paths against the guard.
 *
 * A production-fix entry for the iteration being checked comes before a recorded
 * exception: an exception narrows one file to one approved edit, and a defect
 * elsewhere in that file is fixed through the full process, not refused by the
 * narrow rule. An entry for another iteration only routes the path to
 * `productionFixProblem`, which says why it is not admitted.
 *
 * @param {string[]} paths
 * @param {{ iteration?: string, fixes?: object[] }} [opts]
 * A workflow path (ADR-0011 §6) is its own kind, `workflow`; a path in
 * `EXECUTIVE_ONLY_PATHS` is a violation although it sits under `docs/studio/`.
 *
 * @returns {{allowed: string[], exceptions: string[], workflow: string[], fixes: string[], violations: string[]}}
 */
export function classifyPaths(paths, { iteration, fixes = PRODUCTION_FIXES } = {}) {
  const allowed = [];
  const exceptions = [];
  const workflow = [];
  const fixed = [];
  const violations = [];
  for (const p of paths) {
    const executive = EXECUTIVE_ONLY_PATHS.find(e => e.path === p);
    if (executive) violations.push(`${p} (executive-only: ${executive.reason})`);
    else if (ALLOWED_PREFIXES.some(prefix => p.startsWith(prefix))) allowed.push(p);
    else if (isWorkflowPath(p)) workflow.push(p);
    else if (fixes.some(f => f.path === p && f.iteration === iteration)) fixed.push(p);
    else if (PATH_EXCEPTIONS.some(e => e.path === p)) exceptions.push(p);
    else if (fixes.some(f => f.path === p)) fixed.push(p);
    else violations.push(p);
  }
  return { allowed, exceptions, workflow, fixes: fixed, violations };
}

/**
 * Why a changed production path is not admissible as a fix, or null when it is.
 *
 * Decided only from what the checker observes: the entries, the file names in
 * the iteration's `tickets/` directory, and the subjects of the commits that
 * changed the path. It reads no Markdown — the studio has watched a checker that
 * interpreted Markdown be defeated ten times, and this one decides a boundary.
 *
 * @param path       a changed path outside the allowed prefixes
 * @param iteration  the iteration being checked, as `NN`
 * @param ticketIds  the IDs the file names in that iteration's `tickets/` declare
 * @param commits    `[{ sha, subject, afterRelease }]` — every commit in the range that
 *                   changed `path`, a merge included when the merge itself changed it;
 *                   `afterRelease` when the iteration's own tag exists and does not
 *                   contain the commit. Empty while the change is still uncommitted.
 * @param deleted    the path no longer exists
 * @param fixes      the entries to decide by
 */
export function productionFixProblem(path, { iteration, ticketIds = [], commits = [], deleted = false, fixes = PRODUCTION_FIXES } = {}) {
  const entries = fixes.filter(f => f.path === path && f.iteration === iteration);
  if (!entries.length) {
    const elsewhere = fixes.filter(f => f.path === path).map(f => `${f.ticket} in iteration ${f.iteration}`);
    return elsewhere.length
      ? `its production-fix entries are for ${elsewhere.join(', ')}, not iteration ${iteration}`
      : `no production-fix entry names it for iteration ${iteration}`;
  }
  // Removing a production file is not a fix (ADR-0008), whatever the entry says.
  if (deleted) return 'it was deleted, and deleting a production file is not a fix';
  const tickets = [...new Set(entries.map(f => f.ticket))];
  const missing = tickets.filter(t => !ticketIds.includes(t));
  if (missing.length) {
    return `${missing.join(', ')} has no ticket file in iterations/${iteration}/tickets/`;
  }
  for (const { sha, subject, afterRelease } of commits) {
    // Once an iteration is tagged its fixes are closed: a later change has had no
    // review and no gate, and belongs to a new ticket in a new iteration.
    if (afterRelease) {
      return `commit ${String(sha ?? '').slice(0, 7)} changed it after studio-iteration-${iteration} was tagged; a change after the release needs a new ticket in a new iteration`;
    }
    const id = commitTicketId(subject);
    if (!tickets.includes(id)) {
      return `commit ${String(sha ?? '').slice(0, 7)} changed it and names ${id ?? 'no ticket'}; only ${tickets.join(' or ')} may`;
    }
  }
  return null;
}

/** Problems with the entries themselves, so a malformed one fails loudly rather than never matching. */
export function productionFixEntryProblems(fixes = PRODUCTION_FIXES) {
  const problems = [];
  for (const f of fixes) {
    const where = JSON.stringify(f);
    if (typeof f.path !== 'string' || !f.path || f.path.startsWith('/') || f.path.includes('..')) {
      problems.push(`${where}: path must be a repository-relative file path`);
    } else if (ALLOWED_PREFIXES.some(prefix => f.path.startsWith(prefix))) {
      problems.push(`${where}: ${f.path} is inside the studio's own paths and needs no entry`);
    }
    const m = /^(SHS|SS)-(\d{3})$/.exec(String(f.ticket ?? ''));
    if (!m) problems.push(`${where}: ticket must be an ID such as SHS-052`);
    else if (ticketIdProblem(m[1], Number(m[2]))) problems.push(`${where}: ${ticketIdProblem(m[1], Number(m[2]))}`);
    if (!/^\d{2}$/.test(String(f.iteration ?? ''))) problems.push(`${where}: iteration must be two digits, such as '04'`);
  }
  return problems;
}

/**
 * Storage keys used in a source file.
 *
 * Handles the shapes that appear in this codebase: a plain literal, a literal
 * concatenated with a variable (`'prefix_' + id`), and a template literal with
 * an interpolation (`` `prefix_${id}` ``). For the latter two the key recorded
 * is the static prefix, which is what a namespace rule cares about.
 *
 * Each result carries the kind of expression it came from, which is what the
 * namespace rule needs: a literal prefix really is in the source and can be
 * trusted, while a computed expression cannot be, however it happens to read.
 *
 * @returns {{key: string, kind: 'literal'|'prefix'|'computed', dynamic: boolean}[]} unique by key
 */
export function extractStorageKeys(code) {
  const found = new Map();
  const call = /(?:window\s*\.\s*)?(?:local|session)Storage\s*\??\.\s*(?:getItem|setItem|removeItem)\s*\(\s*([^,)]+)/g;

  for (const m of code.matchAll(call)) {
    const arg = m[1].trim();

    const concatenated = arg.match(/^['"]([^'"]*)['"]\s*\+/);
    const interpolated = arg.match(/^`([^`$]*)\$\{/);
    const literal = arg.match(/^'([^']*)'$|^"([^"]*)"$|^`([^`$]*)`$/);

    let key, kind;
    if (literal) { key = literal[1] ?? literal[2] ?? literal[3]; kind = 'literal'; }
    else if (concatenated) { key = concatenated[1]; kind = 'prefix'; }
    else if (interpolated) { key = interpolated[1]; kind = 'prefix'; }
    else { key = arg.slice(0, 40); kind = 'computed'; }

    if (!found.has(key)) found.set(key, { key, kind, dynamic: kind !== 'literal' });
  }
  return [...found.values()];
}

/**
 * Every way studio code could reach the shared storage, and whether the rule
 * can verify it.
 *
 * The prefix rule is only as good as this list. Three of these were found by an
 * adversarial review of iteration 00's first version, which checked the three
 * named methods and nothing else: `localStorage['key'] = v` and
 * `delete localStorage.key` both slipped through, and `localStorage.clear()` —
 * which wipes every production save, since the studio shares one origin with
 * the arcade — was reported as compliant.
 *
 * @returns {string[]} one message per violation; empty means compliant
 */
export function findStorageViolations(code, prefix = 'studio_') {
  const violations = [];
  const add = m => { if (!violations.includes(m)) violations.push(m); };
  const store = '(?:window\\s*\\.\\s*)?(?:local|session)Storage';

  // 1. The three named accessors, whose key the extractor can read.
  for (const { key, kind } of extractStorageKeys(code)) {
    if (kind === 'computed') {
      add(`key is computed, so the rule cannot see its value: \`${key}\` — build it from a literal "${prefix}" prefix instead`);
    } else if (!key.startsWith(prefix)) {
      add(`key without the ${prefix} prefix: "${key}"`);
    }
  }

  // 2. Bracket access: localStorage['key'] / localStorage[expr]
  for (const m of code.matchAll(new RegExp(`${store}\\s*\\??\\[\\s*([^\\]]+)\\]`, 'g'))) {
    const arg = m[1].trim();
    const literal = arg.match(/^'([^']*)'$|^"([^"]*)"$|^`([^`$]*)`$/);
    const key = literal ? (literal[1] ?? literal[2] ?? literal[3]) : null;
    if (key === null) add(`bracket access with a computed key: \`${arg.slice(0, 40)}\` — the rule cannot see its value`);
    else if (!key.startsWith(prefix)) add(`bracket access to a key without the ${prefix} prefix: "${key}"`);
  }

  // 3. delete localStorage.key / delete localStorage['key']
  for (const m of code.matchAll(new RegExp(`delete\\s+${store}\\s*(?:\\.\\s*([\\w$]+)|\\[\\s*['"\`]([^'"\`]*)['"\`]\\s*\\])`, 'g'))) {
    const key = m[1] ?? m[2] ?? '';
    if (!key.startsWith(prefix)) add(`delete of a key without the ${prefix} prefix: "${key}"`);
  }

  // 4. clear() empties the whole origin, production saves included. Never allowed.
  if (new RegExp(`${store}\\s*\\??\\.\\s*clear\\s*\\(`).test(code)) {
    add('clear() wipes the whole origin, production saves included — never permitted in studio code');
  }

  // 5. Aliasing hides everything above from a static rule.
  for (const m of code.matchAll(new RegExp(`(?:const|let|var)\\s+([\\w$]+)\\s*=\\s*${store}\\s*[;,\\n]`, 'g'))) {
    add(`storage aliased to \`${m[1]}\` — the rule cannot follow the alias; call the accessor directly`);
  }

  return violations;
}

/** Literal keys that do not carry the studio namespace. Kept for the key-level tests. */
export function badStorageKeys(code, prefix = 'studio_') {
  return extractStorageKeys(code)
    .filter(k => !k.key.startsWith(prefix))
    .map(k => k.key);
}

/**
 * Public-repo hygiene patterns. Each has an id, a human label and a regex.
 * A line ending in the pragma below is exempt, so that the documents which
 * *describe* these rules can quote them.
 */
export const HYGIENE_PRAGMA = 'studio-check:allow';

export const HYGIENE_PATTERNS = [
  { id: 'private-key', label: 'private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'aws-key', label: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'bearer-secret', label: 'hard-coded token or secret', re: /\b(api[_-]?key|secret|passwd|password|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*['"][^'"]{8,}['"]/i },
  { id: 'gh-token', label: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { id: 'email', label: 'email address', re: /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i },
  { id: 'phone', label: 'phone number', re: /(?:^|[^\d\w])(?:\+1[ -]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}(?!\d)/ },
  { id: 'home-path', label: 'absolute personal path', re: /(?:^|[^\w])(?:\/Users\/|\/home\/|C:\\Users\\)[A-Za-z0-9._-]+/ },
  { id: 'cloud-drive', label: 'private cloud-drive path', re: /(?:Mobile Documents|iCloud~|Google Drive\/|Dropbox\/|OneDrive\/)/ },  // studio-check:allow
  { id: 'wikilink', label: 'note-vault wikilink', re: /\[\[[^\]]+\]\]/ },  // studio-check:allow
  { id: 'street-address', label: 'street address', re: /\b\d{2,5}\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way)\b/ }
];

/**
 * Scan one file's text.
 * @returns {{line: number, id: string, label: string, text: string}[]}
 */
export function scanHygiene(text) {
  const findings = [];
  text.split('\n').forEach((line, i) => {
    if (line.includes(HYGIENE_PRAGMA)) return;
    for (const p of HYGIENE_PATTERNS) {
      if (p.re.test(line)) findings.push({ line: i + 1, id: p.id, label: p.label, text: line.trim().slice(0, 120) });
    }
  });
  return findings;
}

/**
 * Document cleanliness: a studio document states one current version of the
 * truth. Stacked corrections — a "superseded" section, a revision history, an
 * "UPDATE:" paragraph bolted onto the end — are what this catches.
 *
 * Decision records are exempt from the superseded-status wording, because
 * recording that a decision was superseded is exactly their job.
 */
const STALE_HEADING = /^#{1,6}\s+(?:v\d+\b|.*\b(?:superseded|revision history|change history|old version|previous version|deprecated|outdated|v\d+\s*\(old\)|archive[d]?)\b)/i;
const STACKED_NOTE = /^\s*(?:>\s*)?(?:\*\*)?(?:UPDATE|EDIT|CORRECTION|NOTE TO SELF|SUPERSEDED|WAS|OLD)\b\s*(?:\(|:|\*\*)/i;

export function scanDocCleanliness(text, { isDecisionRecord = false } = {}) {
  const findings = [];
  text.split('\n').forEach((line, i) => {
    if (line.includes(HYGIENE_PRAGMA)) return;
    if (STALE_HEADING.test(line)) {
      if (isDecisionRecord && /superseded/i.test(line)) return;
      findings.push({ line: i + 1, reason: 'stacked or historical section heading', text: line.trim().slice(0, 120) });
    } else if (STACKED_NOTE.test(line)) {
      findings.push({ line: i + 1, reason: 'correction stacked onto the document', text: line.trim().slice(0, 120) });
    }
  });
  return findings;
}

/**
 * Ticket IDs: one sequence of numbers under two prefixes.
 *
 * `SS-001` to `SS-042` were issued under a prefix made by abbreviating the
 * realm's name without reading the result, and the initials turned out to be
 * those of the Nazi Schutzstaffel. The prefix is retired and the numbering
 * carries on: `SHS-043` onward. The old IDs keep their names, because history
 * refers to them. See ADR-0006.
 *
 * So the rule is about the *sequence*, not about which strings look right: an
 * `SS-` number above the last one issued is a new ticket under the retired
 * prefix, and an `SHS-` number at or below it would give one number to two
 * tickets.
 */
export const LAST_SS_TICKET = 42;

const pad3 = n => String(n).padStart(3, '0');

/** Why this ID may not be used, or null. `prefix` is `SS` or `SHS`. */
export function ticketIdProblem(prefix, number) {
  if (prefix === 'SS' && number > LAST_SS_TICKET) {
    return `SS-${pad3(number)}: the SS- prefix is retired after SS-${pad3(LAST_SS_TICKET)} — name new tickets SHS-NNN`;
  }
  if (prefix === 'SHS' && number <= LAST_SS_TICKET) {
    return `SHS-${pad3(number)}: numbers up to ${pad3(LAST_SS_TICKET)} belong to SS- tickets — SHS- numbering starts at ${pad3(LAST_SS_TICKET + 1)}`;
  }
  return null;
}

/**
 * Commit-message lint. Studio commits are conventional, scoped `studio`, and
 * name their ticket.
 *
 * Merge commits are exempt because git writes them — but that is decided by the
 * commit having more than one parent, not by its subject starting with "Merge".
 * Subject matching made the whole lint opt-out: any message could begin with
 * that word.
 */
export const COMMIT_RE = /^(feat|fix|docs|test|refactor|chore|perf|style|build)\(studio\): ((SHS|SS)-(\d{3})) .+/;

/** The ticket ID a conforming commit subject names, or null. */
export function commitTicketId(subject) {
  return COMMIT_RE.exec(String(subject ?? ''))?.[2] ?? null;
}

/**
 * The ticket each non-merge commit names, from log entries `{ sha, parents, subject }`
 * where `parents` is git's space-separated parent list.
 *
 * A merge is skipped: git wrote it, its subject names a branch as well as a
 * ticket, and the ticket is named by the commit below it. Decided by the parent
 * count, as `commit-lint` decides it, not by the subject's wording. A commit
 * names the ticket in its subject's ticket position only — `docs(studio):
 * SHS-046 record the SHS-099 finding` names SHS-046, and mentions SHS-099.
 */
export function ticketsNamedByLog(entries) {
  const named = [];
  for (const { sha, parents, subject } of entries) {
    if (String(parents ?? '').trim().split(/\s+/).filter(Boolean).length > 1) continue;
    const id = commitTicketId(subject);
    if (id) named.push({ id, sha });
  }
  return named;
}

/**
 * A ticket file's name: its ID, a hyphen, a slug. The ID is followed by a
 * hyphen, so `SS-0411-x.md` is not a file for `SS-041` — it is a malformed name.
 */
export const TICKET_FILE_RE = /^((?:SHS|SS)-\d{3})-[^/\\]+\.md$/;

/** The ID a ticket file's name declares, or null. */
export function ticketFileId(name) {
  return TICKET_FILE_RE.exec(String(name ?? ''))?.[1] ?? null;
}

/**
 * Every ticket the history names has exactly one file, and every file says
 * which ticket it is.
 *
 * `docs-current` used to read only the files that existed, so a ticket with no
 * file was invisible to it: three IDs on `main` had commits and no file while
 * the gate reported the iteration complete. This is decided from two things the
 * checker observes rather than interprets — commit subjects, and file names with
 * their first line — so no Markdown is read here at all.
 *
 * @param files  `[{ path, name, firstLine }]` — every `.md` under any
 *               `iterations/NN/tickets/` directory.
 * @param named  `[{ id, sha }]` — the ID each non-merge studio commit names.
 * @returns      one message per problem; empty when the record is whole.
 */
export function ticketFileProblems(files, named) {
  const problems = [];
  const byId = new Map();
  for (const file of files) {
    const id = ticketFileId(file.name);
    if (!id) {
      problems.push(`${file.path}: not named <ID>-<slug>.md, so it is no ticket's file`);
      continue;
    }
    // The file's ID obeys the same sequence as a commit's: no new `SS-` number,
    // no `SHS-` number that belongs to an `SS-` ticket.
    const [prefix, number] = id.split('-');
    const sequence = ticketIdProblem(prefix, Number(number));
    if (sequence) problems.push(`${file.path}: ${sequence}`);
    // The file's first line is its H1, and the H1 names the same ticket. A file
    // named for one ticket and headed with another is a record that disagrees
    // with itself; neither half can be trusted.
    const heading = new RegExp(`^#[ \\t]+${id}(?![\\w-])`);
    if (!heading.test(String(file.firstLine ?? ''))) {
      problems.push(`${file.path}: first line should be "# ${id} — …", found ${JSON.stringify(String(file.firstLine ?? '').slice(0, 60))}`);
    }
    byId.set(id, [...(byId.get(id) ?? []), file.path]);
  }
  for (const [id, paths] of byId) {
    if (paths.length > 1) problems.push(`${id}: ${paths.length} ticket files (${paths.join(', ')}) — a ticket has one`);
  }
  const reported = new Set();
  for (const { id, sha } of named) {
    if (byId.has(id) || reported.has(id)) continue;
    reported.add(id);
    problems.push(`${id} is named by commit ${String(sha ?? '').slice(0, 7)} and has no ticket file`);
  }
  return problems;
}

/**
 * Commits that fail the lint and cannot be fixed: they are on the remote's
 * `main`, and amending them would rewrite published history, which the studio
 * does not do.
 *
 * Keyed by the **full** commit hash. A hash is computed by git from the
 * commit's content, subject included, so a waiver names one subject forever
 * and cannot be claimed by another commit copying it. That is the difference
 * between this and the exemptions the studio has learned to distrust: nothing
 * here is something a commit says about itself.
 *
 * Every waiver applied is reported by the check. An entry is a fact about
 * history, and is added only with a ticket that says why it could not be fixed.
 */
export const LINT_WAIVERS = new Map([
  ['5416876baceb4d4de3ff3b5536a720800e06f9e8',
    'SS-042: subject is 81 characters; it reached the remote after the iteration-02 gate ran, and fixing it would rewrite main (SHS-047)']
]);

/**
 * One commit's lint outcome: `ok`, `waived` (with the recorded reason) or
 * `fail` (with the problem). A waiver applies only to the exact hash it names.
 */
export function lintCommit({ sha, parentCount = 1, subject }) {
  const problem = lintCommitSubject(subject, { parentCount });
  if (!problem) return { status: 'ok' };
  const waiver = LINT_WAIVERS.get(String(sha ?? ''));
  return waiver ? { status: 'waived', reason: waiver } : { status: 'fail', problem };
}

export function lintCommitSubject(subject, { parentCount = 1 } = {}) {
  if (parentCount > 1) return null;
  const match = COMMIT_RE.exec(subject);
  if (!match) {
    return 'expected "type(studio): SHS-NNN description"';
  }
  const problem = ticketIdProblem(match[3], Number(match[4]));
  if (problem) return problem;
  if (subject.length > 80) return `subject is ${subject.length} characters (max 80)`;
  return null;
}

/**
 * The studio and the arcade share `main`, so every range the checks read holds
 * both kinds of commit. A commit is a **studio commit** when its subject's scope
 * is `(studio)`, whatever its type or ticket, or when its subject names a studio
 * ticket (`SHS-NNN`, or the retired `SS-NNN`), whatever its scope — a malformed
 * studio subject is still the studio's, and `commit-lint` says what is wrong
 * with it.
 *
 * Both are claims the author makes, so neither is the only test: an arcade
 * commit that changes a studio path is itself a violation (see
 * `sortCommitsByKind`). Dropping the scope and the ticket moves a commit out of
 * the lint and into that rule. A commit that names neither and changes only
 * production paths is the arcade's, and the checks do not judge it: the arcade
 * is not the studio's to guard (iteration 05 review, finding 1).
 */
export const STUDIO_SCOPE_RE = /^[A-Za-z]+\(studio\)!?:/;
export const STUDIO_TICKET_RE = /(?<![A-Za-z0-9-])(SHS|SS)-\d{3}\b/;

/**
 * Commits on the remote's `main` that fit neither kind and cannot be rewritten.
 * Keyed by the full hash, like `LINT_WAIVERS`, so an entry names one commit
 * forever. An exempt commit is judged by neither `commit-lint` nor the path
 * guard, and every check that meets one reports it with its reason.
 */
export const COMMIT_EXEMPTIONS = new Map([
  ['7712cf2e30e0db4e049feb90e84490e5df7946e7',
    'the executive\'s 2026-09-22 migration: moved the steering views into docs/studio/steering/ in an arcade commit (SHS-055)'],
  ['fecf7eafc8e36ba65a11c341edc43f94209bb357',
    'the executive\'s direction for epic E1: scoped (studio) with no ticket, and edits .claude/ skills and the arcade docs (SHS-055)'],
  ['d454f79c835aa52d4c4ce9466e70c766b87f73cc',
    'the executive\'s ADR-0009, one step per session: scoped (studio) with no ticket, and edits .claude/ and the arcade docs (SHS-055)'],
  ['412163133f0b83b5cd014bc6cb5bc539d40ef077',
    'the executive\'s 2026-09-23 direction, ADR-0011 (the studio runs itself): scoped (studio) with no ticket (SHS-063)'],
  ['49e21c6a93d5dbf48a9cebcde89e378f4a2b8026',
    'the executive\'s 2026-09-23 direction, ADR-0011 (local first, Opus as the largest model): scoped (studio) with no ticket (SHS-063)'],
  ['7492551bdc2af945e2747a4f07591ef19c6d784b',
    'the executive\'s 2026-09-23 direction, ADR-0011 (every sprint a little better and cheaper, direction rule 8): scoped (studio) with no ticket (SHS-063)'],
  ['6376a2f53a16c72de1061789190c003eaf9439d4',
    'the executive\'s 2026-09-23 direction, ADR-0011 (running the studio from Antigravity): scoped (studio) with no ticket (SHS-063)'],
  ['00bd3a5f57758515a1bea75793dc788a304f2261',
    'the executive\'s 2026-09-23 direction, ADR-0011 (self-improvement within limits, ADR-0011 section 6): scoped (studio) with no ticket (SHS-063)']
]);

/**
 * Which kind a commit is: `merge` (more than one parent), `exempt` (its hash is
 * in `COMMIT_EXEMPTIONS`, with the `reason`), `studio` or `arcade`. The one place
 * this is decided; `commit-lint`, `path-guard` and `production-unchanged` all
 * ask here.
 */
export function commitKind({ sha, parentCount = 1, subject }) {
  if (parentCount > 1) return { kind: 'merge' };
  const reason = COMMIT_EXEMPTIONS.get(String(sha ?? ''));
  if (reason) return { kind: 'exempt', reason };
  const text = String(subject ?? '');
  return { kind: STUDIO_SCOPE_RE.test(text) || STUDIO_TICKET_RE.test(text) ? 'studio' : 'arcade' };
}

const isStudioPath = p => ALLOWED_PREFIXES.some(prefix => p.startsWith(prefix));

/**
 * Sort a range's commits by kind, for the path guard.
 *
 * - A studio commit's paths are the ones the guard judges (`studioPaths`).
 * - An arcade commit may change anything except the studio's own paths; one
 *   that does is a problem.
 * - A merge is judged by what it changes against its first parent: only studio
 *   paths, or only other paths, is that kind; both at once is a problem, since
 *   the merge itself cannot say which side a file came from. The commits it
 *   brings in are in the range too and are judged one by one.
 * - An exempt commit is reported, never silently passed.
 *
 * @param commits `[{ sha, parentCount, subject, paths }]`, `paths` against the first parent
 * @returns `{ studioPaths, problems, notes, counts }`
 */
export function sortCommitsByKind(commits) {
  const studioPaths = new Set();
  const problems = [];
  const notes = [];
  const counts = { studio: 0, arcade: 0, merge: 0, exempt: 0 };
  for (const { sha, parentCount, subject, paths = [] } of commits) {
    const short = String(sha ?? '').slice(0, 7);
    const { kind, reason } = commitKind({ sha, parentCount, subject });
    counts[kind]++;
    if (kind === 'exempt') {
      notes.push(`exempt commit ${short}: ${reason}`);
    } else if (kind === 'studio') {
      // ADR-0011 §6: the studio's skills and conductor only in a ticketed commit.
      const ticketed = commitTicketId(subject) !== null;
      for (const p of paths) {
        if (isWorkflowPath(p) && !ticketed) {
          problems.push(`${p} (changed by studio commit ${short}, which names no ticket: ${WORKFLOW_EXCEPTION.reason})`);
        } else {
          studioPaths.add(p);
        }
      }
    } else if (kind === 'arcade') {
      for (const p of paths.filter(isStudioPath)) {
        problems.push(`${p} (changed by arcade commit ${short}, which is not scoped (studio) and names no studio ticket: only a studio commit may change the studio's paths)`);
      }
    } else {
      // A workflow file (ADR-0011 §6) sides with the studio paths it arrives with,
      // so merging a studio branch that changed a skill is a studio merge; the
      // commits it brings in answer for their tickets one by one.
      const inside = paths.filter(isStudioPath);
      const workflow = paths.filter(isWorkflowPath);
      const outside = paths.length - inside.length - workflow.length;
      if (inside.length && outside) {
        problems.push(`merge ${short} changes studio paths and other paths together (${inside.length + workflow.length} and ${outside}), so neither kind can be assumed`);
      } else if (inside.length) {
        for (const p of [...inside, ...workflow]) studioPaths.add(p);
      }
    }
  }
  return { studioPaths: [...studioPaths], problems, notes, counts };
}

/**
 * The same-origin scripts and stylesheets a page loads, as absolute urls.
 *
 * Used by `studio-live`, because the realm's home page is a shell: everything
 * it shows is built in the browser from `shelf-data.js`. A deploy check that
 * reads only the HTML can prove the shell arrived and nothing about what is in
 * it — which is exactly the state iteration 02 shipped into, with a correct
 * deploy and a check that could not see it.
 *
 * Off-origin urls are dropped: a CDN copy of three.js says nothing about
 * whether *this* build is on the wire.
 */
export function sameOriginAssets(html, pageUrl) {
  const found = [];
  const base = new URL(pageUrl);
  const patterns = [
    /<script[^>]+src=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]*>/gi
  ];
  for (const pattern of patterns) {
    for (const match of String(html ?? '').matchAll(pattern)) {
      if (pattern.source.startsWith('<link') && !/rel=["']?stylesheet/i.test(match[0])) continue;
      let url;
      try { url = new URL(match[1], base); } catch { continue; }
      if (url.origin !== base.origin) continue;
      const clean = url.origin + url.pathname;
      if (!found.includes(clean)) found.push(clean);
    }
  }
  return found;
}

/**
 * The same-origin modules a JavaScript file imports, as absolute urls.
 *
 * One level is enough to reach what matters here and stops this from becoming a
 * bundler: the realm's page links `main.js`, and `main.js` imports
 * `shelf-data.js`, which is where every word the page actually shows lives.
 */
export function moduleImports(source, fromUrl) {
  const found = [];
  const base = new URL(fromUrl);
  const patterns = [
    /\bimport\s[^;]*?from\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bexport\s[^;]*?from\s*["']([^"']+)["']/g
  ];
  for (const pattern of patterns) {
    for (const match of String(source ?? '').matchAll(pattern)) {
      let url;
      try { url = new URL(match[1], base); } catch { continue; }
      if (url.origin !== base.origin) continue;
      const clean = url.origin + url.pathname;
      if (!found.includes(clean)) found.push(clean);
    }
  }
  return found;
}

/**
 * `--key=value` into `[key, value]`, splitting at the **first** `=` only.
 *
 * `split('=')` kept the text before the second `=` and dropped the rest, so a
 * marker such as a line of code — `a = b` — was searched for as `a ` without a
 * word of warning, and a shorter string is easier to find by accident.
 */
export function splitArg(arg) {
  if (!arg.startsWith('--')) return [null, null];
  const eq = arg.indexOf('=');
  return eq === -1 ? [arg.slice(2), undefined] : [arg.slice(2, eq), arg.slice(eq + 1)];
}

/**
 * A production fix's pre-push review record, read strictly: `{ sha }` when it is
 * well formed and approves, `{ problem }` otherwise.
 *
 * A production fix is reviewed before it is pushed (ADR-0008), and the review is
 * recorded in `iterations/NN/reviews/<TICKET>.md`. The record is written by the
 * studio, like everything else here, so the check built on it makes the review
 * impossible to forget rather than impossible to fake — ADR-0008 says so.
 *
 * Read the way `docs-current` reads a ticket: each thing is declared **exactly
 * once**, counted in the raw text, wherever a second one is hidden. What the
 * record's commit must match is decided by the check, from file content.
 */
export function readReviewRecord(ticket, text) {
  if (text === null || text === undefined) return { problem: `${ticket} changed production files and has no pre-push review record` };
  const lines = String(text).split('\n');
  if (!new RegExp(`^#[ \\t]+${ticket}(?![\\w-])`).test(lines[0])) {
    return { problem: `${ticket}'s review record should begin "# ${ticket} — …"` };
  }
  const reviewed = lines.filter(line => line.includes('**Reviewed:**'));
  if (reviewed.length !== 1) return { problem: `${ticket}'s review record declares "**Reviewed:**" ${reviewed.length} times; it declares it once` };
  const sha = /^- \*\*Reviewed:\*\* `?([0-9a-f]{40})`?\s*$/.exec(reviewed[0])?.[1];
  if (!sha) return { problem: `${ticket}'s "**Reviewed:**" line must be "- **Reviewed:** <the full 40-character commit hash>"` };
  const verdicts = lines.filter(line => line.includes('**Verdict:**'));
  if (verdicts.length !== 1) return { problem: `${ticket}'s review record declares "**Verdict:**" ${verdicts.length} times; it declares it once` };
  if (!/^- \*\*Verdict:\*\* APPROVED(?: WITH FINDINGS)?(?:\s|$)/.test(verdicts[0])) {
    return { problem: `${ticket}'s verdict is not an approval: ${JSON.stringify(verdicts[0].trim().slice(0, 80))}` };
  }
  return { sha };
}
