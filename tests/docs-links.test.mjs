// docs/ is read on GitHub, by agents, and as an Obsidian vault. These checks keep the three
// agreeing: every relative link resolves, game docs and questionnaires carry the frontmatter
// the dashboard and Obsidian's properties rely on, and docs/README.md (the Studio Dashboard)
// lists every one of them.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DOCS = path.join(ROOT, 'docs');
const PAGES = 'https://yevrap.github.io/KamekoStudio/';

function markdownFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

const read = file => fs.readFileSync(file, 'utf8');
const rel = file => path.relative(ROOT, file);

// A deliberately small YAML subset: `key: value`, quoted strings and flow lists.
// Anything richer fails here, which keeps the frontmatter readable everywhere.
function frontmatter(file) {
  const text = read(file);
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([a-z_]+): (.*)$/);
    assert.ok(kv, `${rel(file)}: frontmatter line is not "key: value": ${line}`);
    const [, key, raw] = kv;
    if (raw.startsWith('[')) {
      assert.ok(raw.endsWith(']'), `${rel(file)}: unterminated list for ${key}`);
      data[key] = raw.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else if (raw.startsWith('"')) {
      data[key] = JSON.parse(raw);
    } else {
      data[key] = raw;
    }
  }
  return data;
}

const gameReadmes = fs.readdirSync(path.join(DOCS, 'games'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => path.join(DOCS, 'games', d.name, 'README.md'))
  .filter(f => fs.existsSync(f));
const questionnaires = fs.readdirSync(path.join(DOCS, 'questionnaires'))
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(DOCS, 'questionnaires', f));

test('every relative link in docs/ resolves to a file', () => {
  const broken = [];
  for (const file of markdownFiles(DOCS)) {
    const text = read(file).replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), decodeURIComponent(target.split('#')[0]));
      if (!fs.existsSync(resolved)) broken.push(`${rel(file)} -> ${target}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('every game design doc carries game frontmatter', () => {
  assert.ok(gameReadmes.length >= 9, `expected the game docs, found ${gameReadmes.length}`);
  for (const file of gameReadmes) {
    const fm = frontmatter(file);
    const slug = path.basename(path.dirname(file));
    assert.ok(fm, `${rel(file)} has no frontmatter`);
    assert.equal(fm.type, 'game', `${rel(file)}: type`);
    assert.equal(fm.slug, slug, `${rel(file)}: slug`);
    assert.ok(fm.title, `${rel(file)}: title`);
    assert.ok(['invest', 'maintain', 'park', 'lab', 'killed'].includes(fm.tier), `${rel(file)}: tier ${fm.tier}`);
    assert.ok(['arcade', 'lab', 'draft'].includes(fm.status), `${rel(file)}: status ${fm.status}`);
    assert.equal(fm.play_url, PAGES + fm.code, `${rel(file)}: play_url should be the Pages URL of code`);
    assert.ok(fs.existsSync(path.join(ROOT, fm.code)), `${rel(file)}: code path ${fm.code} missing`);
    assert.ok(Array.isArray(fm.tags) && fm.tags.includes('game'), `${rel(file)}: tags`);
  }
});

test('every open questionnaire carries questionnaire frontmatter', () => {
  for (const file of questionnaires) {
    const fm = frontmatter(file);
    assert.ok(fm, `${rel(file)} has no frontmatter`);
    assert.equal(fm.type, 'questionnaire', `${rel(file)}: type`);
    assert.ok(fm.title, `${rel(file)}: title`);
    assert.ok(['open', 'partly-answered', 'answered'].includes(fm.status), `${rel(file)}: status ${fm.status}`);
    assert.ok(Array.isArray(fm.gates), `${rel(file)}: gates must be a list (empty is fine)`);
    assert.ok(Array.isArray(fm.tags) && fm.tags.includes('questionnaire'), `${rel(file)}: tags`);
    if (fm.game) assert.ok(fs.existsSync(path.join(DOCS, 'games', fm.game)), `${rel(file)}: game ${fm.game}`);
  }
});

test('the Studio Dashboard lists every game doc and questionnaire, with current status', () => {
  const dashboard = read(path.join(DOCS, 'README.md'));
  for (const file of gameReadmes) {
    const link = `(${path.relative(DOCS, file)})`;
    assert.ok(dashboard.includes(link), `docs/README.md does not link ${link}`);
  }
  for (const file of questionnaires) {
    const link = `(${path.relative(DOCS, file)})`;
    const row = dashboard.split('\n').find(line => line.startsWith('|') && line.includes(link));
    assert.ok(row, `docs/README.md has no questionnaire row linking ${link}`);
    const { status } = frontmatter(file);
    assert.ok(row.split('|').map(c => c.trim()).includes(status),
      `docs/README.md row for ${link} should say "${status}"`);
  }
});
