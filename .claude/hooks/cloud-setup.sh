#!/bin/bash
# cloud-setup.sh — makes a fresh Claude Code cloud session match CI, so tests,
# smoke, e2e and the studio's browser checks run there as they do on a laptop.
#
# Runs at SessionStart only in cloud sessions (CLAUDE_CODE_REMOTE=true); local
# sessions are untouched. Each step is idempotent and never fails the session:
#   1. Full git history — the clone starts shallow, and the studio's checks read
#      old commits (base revisions, recorded edits).
#   2. node_modules — puppeteer-core for smoke, e2e and tests/studio browser tests.
#   3. Node 20, as CI runs it — on Node 22 `node --test tests/` no longer expands
#      a directory, so `npm test` would find nothing.
#   4. CHROME_PATH — the container's Chromium, wrapped with --no-sandbox because
#      the session runs as root and Chrome refuses to start as root otherwise.

[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

if [ "$(git rev-parse --is-shallow-repository 2>/dev/null)" = "true" ]; then
  git fetch --unshallow --quiet origin >/dev/null 2>&1 || echo "[cloud-setup] git fetch --unshallow failed; studio checks that read old commits may fail"
fi

if [ -d /opt/node20/bin ]; then
  export PATH="/opt/node20/bin:$PATH"
  [ -n "$CLAUDE_ENV_FILE" ] && echo 'export PATH="/opt/node20/bin:$PATH"' >> "$CLAUDE_ENV_FILE"
fi

if [ ! -d node_modules/puppeteer-core ]; then
  npm ci --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || echo "[cloud-setup] npm ci failed; run it by hand"
fi

chrome=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | sort -V | tail -1)
if [ -n "$chrome" ]; then
  wrapper="$HOME/.cache/kameko/chrome-no-sandbox"
  mkdir -p "$(dirname "$wrapper")"
  printf '#!/bin/sh\nexec "%s" --no-sandbox "$@"\n' "$chrome" > "$wrapper"
  chmod +x "$wrapper"
  [ -n "$CLAUDE_ENV_FILE" ] && echo "export CHROME_PATH=\"$wrapper\"" >> "$CLAUDE_ENV_FILE"
fi

echo "[cloud-setup] cloud session ready: full git history, node $(node --version), node_modules, CHROME_PATH=${wrapper:-unset}"
exit 0
