#!/usr/bin/env node
// Generates each GEMINI.md from its CLAUDE.md counterpart. Never hand-edit a
// GEMINI.md file — edit the CLAUDE.md (and context-src/gemini-overrides.md
// for Gemini-specific sections) instead. See CLAUDE.md's "Sync discipline".

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OVERRIDES_PATH = path.join(ROOT, 'context-src', 'gemini-overrides.md');

const PAIRS = [
  { name: 'root', claude: 'CLAUDE.md', gemini: 'GEMINI.md' },
  { name: 'docs', claude: 'docs/CLAUDE.md', gemini: 'docs/GEMINI.md' },
  { name: 'drafts', claude: 'drafts/CLAUDE.md', gemini: 'drafts/GEMINI.md' },
  { name: 'games', claude: 'games/CLAUDE.md', gemini: 'games/GEMINI.md' },
];

const OVERRIDE_MARKER_RE = /<!-- GEMINI-OVERRIDE:([\w-]+) -->([\s\S]*?)<!-- \/GEMINI-OVERRIDE -->/g;

function parseOverrides(text) {
  const map = new Map();
  const markerRe = /<!-- OVERRIDE:([\w-]+:[\w-]+) -->\n/g;
  const matches = [...text.matchAll(markerRe)];
  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][1];
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    map.set(key, text.slice(start, end).replace(/\n+$/, ''));
  }
  return map;
}

function generate(pair, overrides) {
  const claudePath = path.join(ROOT, pair.claude);
  const source = fs.readFileSync(claudePath, 'utf8');

  const generated = source.replace(OVERRIDE_MARKER_RE, (match, key, _originalBody) => {
    const overrideKey = `${pair.name}:${key}`;
    if (!overrides.has(overrideKey)) {
      throw new Error(`Missing override "${overrideKey}" referenced in ${pair.claude} — add it to context-src/gemini-overrides.md`);
    }
    return overrides.get(overrideKey);
  });

  const header = `<!-- AUTO-GENERATED from ${pair.claude} by scripts/generate-context-docs.js — DO NOT EDIT DIRECTLY. Edit ${pair.claude} (and context-src/gemini-overrides.md for Gemini-specific sections) instead. -->\n\n`;

  return header + generated;
}

function main() {
  const check = process.argv.includes('--check');
  const overrides = parseOverrides(fs.readFileSync(OVERRIDES_PATH, 'utf8'));

  let stale = [];
  for (const pair of PAIRS) {
    const generated = generate(pair, overrides);
    const geminiPath = path.join(ROOT, pair.gemini);

    if (check) {
      const existing = fs.existsSync(geminiPath) ? fs.readFileSync(geminiPath, 'utf8') : null;
      if (existing !== generated) stale.push(pair.gemini);
    } else {
      fs.writeFileSync(geminiPath, generated);
      console.log(`Wrote ${pair.gemini}`);
    }
  }

  if (check) {
    if (stale.length > 0) {
      console.error(`Stale (run without --check to regenerate): ${stale.join(', ')}`);
      process.exit(1);
    }
    console.log('All GEMINI.md files are in sync.');
  }
}

main();
