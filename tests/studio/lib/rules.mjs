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
  }
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
// The block is matched by its exact shape, and the shape is a whitelist.
//
// An earlier version described an element as "a Vector3 call whose arguments
// contain no parentheses". JavaScript does not need parentheses to have an
// effect: a tagged template (fetch`...`) calls, and an assignment expression
// (window.x = document.cookie) assigns. Both fit inside the argument list, both
// were reverted away with the block, and the guard reported "exception used"
// while arbitrary code went into a production file that runs on every visit to
// the landing page. Four such payloads are in rules.test.mjs as regression
// tests; they are the reason the argument charset below is a whitelist of
// arithmetic rather than a blacklist of brackets.
//
// An argument may be a number, an identifier, a property path, and the four
// arithmetic operators. No parentheses, no backticks, no assignment, no comma:
// anything that could call, assign or sequence is outside the set.
const ARG = String.raw`[-+*/\s\w.]+`;
const VECTOR = String.raw`new THREE\.Vector3\(\s*${ARG},\s*${ARG},\s*${ARG}\s*\)`;

// Exactly three elements, because the approved scope in guardrails.md is three
// front-wall positions. A row of thirty is a different change and needs its own
// approval. Leading comment lines are permitted and bounded: a comment cannot
// execute, and the hygiene check scans this file because it is an exception
// path, so text smuggled into one is caught there rather than here.
const FRONT_ROW_BLOCK = new RegExp(
  String.raw`\n(?:[ \t]*//[^\n]*\n){0,12}[ \t]*const frontPositions = \[\n` +
  String.raw`[ \t]*${VECTOR},\n[ \t]*${VECTOR},\n[ \t]*${VECTOR}\n[ \t]*\];(?=\n)`
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
  if (revertFrontPortalRow(after) === before) return null;
  return 'changes beyond the front-wall portal row in createEnvironment()';
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
export function portalCapacity(gameplay, constants) {
  const problems = [];

  const gameList = /ARCADE_GAMES\s*=\s*\[([\s\S]*?)\];/.exec(String(constants ?? ''));
  const games = gameList ? (gameList[1].match(/\{\s*name\s*:/g) ?? []).length : null;
  if (games === null) problems.push('could not find ARCADE_GAMES in the constants source');

  const source = String(gameplay ?? '');
  const positionsDecl = /const\s+positions\s*=\s*\[([^\]]*)\]/.exec(source);
  const rotationsDecl = /const\s+rotations\s*=\s*\[([\s\S]*?)\];/.exec(source);

  const spreads = text => [...String(text).matchAll(/\.\.\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]);
  const positionTables = positionsDecl ? spreads(positionsDecl[1]) : [];
  const rotationTables = rotationsDecl ? spreads(rotationsDecl[1]) : [];

  if (!positionsDecl) problems.push('could not find the positions table in the gameplay source');
  if (!rotationsDecl) problems.push('could not find the rotations table in the gameplay source');

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
 * Classify changed paths against the guard.
 * @param {string[]} paths
 * @returns {{allowed: string[], exceptions: string[], violations: string[]}}
 */
export function classifyPaths(paths) {
  const allowed = [];
  const exceptions = [];
  const violations = [];
  for (const p of paths) {
    if (ALLOWED_PREFIXES.some(prefix => p.startsWith(prefix))) allowed.push(p);
    else if (PATH_EXCEPTIONS.some(e => e.path === p)) exceptions.push(p);
    else violations.push(p);
  }
  return { allowed, exceptions, violations };
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
 * Commit-message lint. Studio commits are conventional, scoped `studio`, and
 * name their ticket.
 *
 * Merge commits are exempt because git writes them — but that is decided by the
 * commit having more than one parent, not by its subject starting with "Merge".
 * Subject matching made the whole lint opt-out: any message could begin with
 * that word.
 */
export const COMMIT_RE = /^(feat|fix|docs|test|refactor|chore|perf|style|build)\(studio\): (SS-\d{3}) .+/;

export function lintCommitSubject(subject, { parentCount = 1 } = {}) {
  if (parentCount > 1) return null;
  if (!COMMIT_RE.test(subject)) {
    return 'expected "type(studio): SS-NNN description"';
  }
  if (subject.length > 80) return `subject is ${subject.length} characters (max 80)`;
  return null;
}
