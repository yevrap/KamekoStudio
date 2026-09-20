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
export const PATH_EXCEPTIONS = [
  {
    path: 'package.json',
    reason: 'the single "studio:check" scripts entry (ADR-0002)',
    allow: allowOnlyStudioCheckScript
  }
];

/**
 * The package.json exception, content-checked rather than path-checked.
 *
 * Adding a key to a JSON object also puts a comma on the line above it, so the
 * diff always contains one line that is removed and re-added unchanged except
 * for that comma. Those pairs are cancelled out first; whatever is left must be
 * the studio:check entry and nothing else.
 */
export function allowOnlyStudioCheckScript(diff) {
  const norm = l => l.slice(1).trim().replace(/,$/, '');
  const removed = [];
  const added = [];
  for (const line of diff.split('\n')) {
    if (/^(\+\+\+|---)/.test(line)) continue;
    if (line.startsWith('+')) added.push(line);
    else if (line.startsWith('-')) removed.push(line);
  }

  const removedRest = removed.map(norm);
  const leftovers = [];
  for (const line of added) {
    const key = norm(line);
    const i = removedRest.indexOf(key);
    if (i !== -1) { removedRest.splice(i, 1); continue; } // comma-only churn
    leftovers.push(key);
  }
  leftovers.push(...removedRest.map(l => `removed: ${l}`));

  const offending = leftovers.filter(l => l !== '' && !/"studio:check"\s*:/.test(l));
  return offending.length
    ? `changes beyond the studio:check entry: ${offending.join(' | ')}`
    : null;
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
 * Handles the three shapes that appear in this codebase: a plain literal, a
 * literal concatenated with a variable (`'prefix_' + id`), and a template
 * literal with an interpolation (`` `prefix_${id}` ``). For the latter two the
 * key recorded is the static prefix, which is what a namespace rule cares about.
 *
 * @returns {{key: string, dynamic: boolean}[]} unique by key
 */
export function extractStorageKeys(code) {
  const found = new Map();
  const call = /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*([^,)]+)/g;

  for (const m of code.matchAll(call)) {
    const arg = m[1].trim();
    let key = null;
    let dynamic = false;

    const concatenated = arg.match(/^['"]([^'"]*)['"]\s*\+/);
    const interpolated = arg.match(/^`([^`$]*)\$\{/);
    const literal = arg.match(/^'([^']*)'$|^"([^"]*)"$|^`([^`$]*)`$/);

    if (concatenated) { key = concatenated[1]; dynamic = true; }
    else if (interpolated) { key = interpolated[1]; dynamic = true; }
    else if (literal) { key = literal[1] ?? literal[2] ?? literal[3]; }

    // Anything else is a fully computed key — a variable, a function call. The
    // rule cannot see through it, so it is reported as an unnameable key.
    else { key = arg.slice(0, 40); dynamic = true; }

    if (key !== null && !found.has(key)) found.set(key, { key, dynamic });
  }
  return [...found.values()];
}

/** Keys that do not carry the studio namespace. */
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
const STALE_HEADING = /^#{1,6}\s+.*\b(superseded|revision history|change history|old version|previous version|deprecated|outdated|v\d+\s*\(old\)|archive[d]?)\b/i;
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
 * name their ticket. Merge commits are exempt — git writes those.
 */
export const COMMIT_RE = /^(feat|fix|docs|test|refactor|chore|perf|style|build)\(studio\): (SS-\d{3}) .+/;

export function lintCommitSubject(subject) {
  if (/^Merge /.test(subject)) return null;
  if (!COMMIT_RE.test(subject)) {
    return 'expected "type(studio): SS-NNN description"';
  }
  if (subject.length > 80) return `subject is ${subject.length} characters (max 80)`;
  return null;
}
