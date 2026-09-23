// river-run-fork.mjs — exactly how studio/games/river-run/ differs from its source.
//
// The fork is a copy of production's River Run at one named commit, with a
// short, closed list of edits. The list lives here as data so a test can prove
// the claim rather than restate it: applying these edits to the source at that
// commit must reproduce the fork byte for byte. An edit that is not on the list
// — a gameplay tweak riding along with a key rename — fails that equality.
//
// Each edit names how many times its `from` text occurs in the source, so a
// rename cannot silently miss an occurrence or catch one it was not meant to.
// The fork diverged on purpose at SHS-060 (power-ups, sprint 06's first
// experiment), and the equality test was retired with a note. This file is now
// the record of how the copy was made, not a description of the fork as it is:
// it proves the fork *started* faithful, not that it stays identical.
//
// Procedure: docs/studio/forking.md.

export const SOURCE_PATH = 'games/river-run/index.html';
export const SOURCE_COMMIT = '082943a6a874c1a3d9200fbf17087c62261e14ac';
export const FORK_PATH = 'studio/games/river-run/index.html';

/** Every storage key the fork uses. All of them are documented in studio/README.md. */
export const FORK_KEYS = [
  'studio_riverRun_highScore',
  'studio_riverRun_muted',
  'studio_riverRun_invertControls',
  'studio_riverRun_lastPlayed',
  'studio_riverRun_autoPlay'
];

export const PROVENANCE = `<!-- Shadow Studio fork of ${SOURCE_PATH} at ${SOURCE_COMMIT}. `
  + 'Every difference from that file is listed in tests/studio/lib/river-run-fork.mjs; '
  + 'the procedure is docs/studio/forking.md. -->';

export const EDITS = [
  {
    why: 'provenance: the source path and commit, in the file itself',
    from: '<!DOCTYPE html>\n',
    to: `<!DOCTYPE html>\n${PROVENANCE}\n`,
    count: 1
  },
  {
    why: 'high score: production riverRunHighScore → studio_riverRun_highScore',
    from: "'riverRunHighScore'",
    to: "'studio_riverRun_highScore'",
    count: 2
  },
  {
    why: 'mute: production writes the unnamespaced muted key',
    from: "localStorage.setItem('muted', isMuted)",
    to: "localStorage.setItem('studio_riverRun_muted', isMuted)",
    count: 1
  },
  {
    why: 'mute: and reads it at load',
    from: "localStorage.getItem('muted')",
    to: "localStorage.getItem('studio_riverRun_muted')",
    count: 1
  },
  {
    why: 'Watch Mode flag, every read and write in the inline script',
    from: "'riverRun_autoPlay'",
    to: "'studio_riverRun_autoPlay'",
    count: 7
  },
  {
    why: 'Watch Mode flag, as written by shared/settings.js from the prefix it is given',
    from: "registerWatchSection('riverRun',",
    to: "registerWatchSection('studio_riverRun',",
    count: 1
  },
  {
    why: 'last played: production lastPlayed_riverRun → studio_riverRun_lastPlayed',
    from: "'lastPlayed_riverRun'",
    to: "'studio_riverRun_lastPlayed'",
    count: 2
  },
  {
    why: 'invert drag: read at load',
    from: "localStorage.getItem('riverRun_invertControls')",
    to: "localStorage.getItem('studio_riverRun_invertControls')",
    count: 1
  },
  {
    // Production writes it as `localStorage.setItem(opt.key, …)`, a computed key
    // storage-keys cannot read. The write moves into the option's own setter,
    // with its key as a literal. There is one option, so nothing else changes.
    why: 'invert drag: the write, with its key made a literal',
    from: "{ key: 'riverRun_invertControls',  label: '\\uD83D\\uDD04 Invert Drag', get: () => invertControls,  set: (v) => { invertControls = v; } },",
    to: "{ label: '\\uD83D\\uDD04 Invert Drag', get: () => invertControls,  set: (v) => { invertControls = v; localStorage.setItem('studio_riverRun_invertControls', v); } },",
    count: 1
  },
  {
    why: 'invert drag: the computed-key write it replaces',
    from: '                            opt.set(newVal);\n                            localStorage.setItem(opt.key, newVal);\n',
    to: '                            opt.set(newVal);\n',
    count: 1
  },
  {
    why: 'theme at load: from the class shared/settings.js sets, not the arcade\'s theme key',
    from: "            const savedTheme = localStorage.getItem('theme');\n            isDarkMode = savedTheme !== 'light';\n",
    to: "            isDarkMode = document.body.classList.contains('dark-mode');\n",
    count: 1
  },
  {
    why: 'theme after the drawer closes: the same',
    from: "isDarkMode = localStorage.getItem('theme') !== 'light';",
    to: "isDarkMode = document.body.classList.contains('dark-mode');",
    count: 1
  },
  {
    why: 'shared paths: one directory deeper',
    from: '<script src="../../shared/settings.js" data-gallery-depth="2"></script>',
    to: '<script src="../../../shared/settings.js" data-gallery-depth="3"></script>',
    count: 1
  },

  // ---- The page contract ------------------------------------------------------
  //
  // Every page under studio/ is booted by the studio-boot check and held to the
  // generic contract in lib/boot-contract.mjs. Production River Run fails it in
  // four places, none of them gameplay: no way back, a 21px-tall mute button, a
  // blank page without JavaScript, and an uncaught throw when site data is
  // blocked. These edits close exactly those four and nothing else.

  {
    why: 'contract: a way back to the realm, sized as a target',
    from: '    <div id="top-controls">\n',
    to: '    <div id="top-controls">\n        <a class="back" data-back href="../../">\u2190 Studio</a>\n',
    count: 1
  },
  {
    why: 'contract: the back link\'s look, and a 44px floor under the mute button',
    from: '\n    </style>\n',
    to: '\n        /* Studio fork: the page contract every studio page holds (docs/studio/forking.md). */\n'
      + '        #mute-toggle { min-height: 44px; }\n'
      + '        #top-controls .back { display: inline-flex; align-items: center; min-height: 44px; padding: 0 10px;'
      + ' font-size: 0.7em; color: #fff; background-color: #555; text-decoration: none; border-radius: 4px; }\n'
      + '        body.dark-mode #top-controls .back { background-color: #aaa; color: #333; }\n'
      + '\n    </style>\n',
    count: 1
  },
  {
    why: 'contract: a page that explains itself with scripting off',
    from: '<body>\n',
    to: '<body>\n    <noscript><p style="color: var(--text-color-dark); padding: 16px; text-align: center; line-height: 1.6;">'
      + 'River Runner 3D is drawn in the browser, so it needs JavaScript. Turn it on and reload to play.</p></noscript>\n',
    count: 1
  },
  {
    why: 'contract: blocked site data — the one helper every read goes through',
    from: '        // --- Initial Setup ---\n',
    to: '        // Studio fork: with site data blocked every storage call throws. A read\n'
      + '        // falls back to "never saved" and a write is skipped, so play goes on.\n'
      + '        function readStored(read) { try { return read(); } catch (e) { return null; } }\n\n'
      + '        // --- Initial Setup ---\n',
    count: 1
  },
  {
    // The key stays a literal inside the call, so storage-keys still reads it.
    why: 'contract: blocked site data — every read',
    pattern: /localStorage\.getItem\(('[^']*')\)/g,
    to: 'readStored(() => localStorage.getItem($1))',
    count: 5
  },
  {
    why: 'contract: blocked site data — every write',
    pattern: /localStorage\.setItem\(([^;]*)\);/g,
    to: 'try { localStorage.setItem($1); } catch (e) { /* site data blocked: play on unsaved */ }',
    count: 10
  }
];

/** Occurrences of `needle` — a string or a global RegExp — in `text`, non-overlapping. */
export function occurrences(text, needle) {
  if (needle instanceof RegExp) return [...text.matchAll(needle)].length;
  return needle ? text.split(needle).length - 1 : 0;
}

/**
 * The source with every edit applied, in order. Throws when an edit's `from`
 * does not occur exactly `count` times at the point it is applied, so a source
 * that has moved underneath the list is reported rather than half-applied.
 */
export function applyEdits(source, edits = EDITS) {
  let text = source;
  for (const edit of edits) {
    const found = occurrences(text, edit.pattern ?? edit.from);
    if (found !== edit.count) {
      throw new Error(`edit "${edit.why}": expected ${edit.count} occurrence(s) of its text, found ${found}`);
    }
    text = edit.pattern ? text.replace(edit.pattern, edit.to) : text.split(edit.from).join(edit.to);
  }
  return text;
}
