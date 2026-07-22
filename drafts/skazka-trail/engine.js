/*
 * Skazka Trail — reusable story engine.
 *
 * Tale-agnostic on purpose (Q10): this file knows nothing about Vasilisa,
 * Morozko, or any other tale. It renders whatever scene/choice/flag/ending
 * shape a content-pack object describes. A new tale is a new file under
 * tales/ that registers itself on window.SKAZKA_TALES — no changes here.
 *
 * Content-pack shape:
 *   {
 *     id, title, subtitle,
 *     start: '<node id>',
 *     flags: { ...initial flag values... },
 *     nodes: {
 *       '<id>': {
 *         text: string | function(flags) -> string,   // \n\n = paragraph break
 *         log: string,                                 // short recap label (optional)
 *         ending: true,                                // marks a terminal node
 *         title, moral,                                 // ending-only
 *         choices: [
 *           { label, next, delta: {flag: number|bool}, when: function(flags) -> bool }
 *         ]
 *       }
 *     }
 *   }
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function paragraphs(text) {
    return String(text || '')
      .split(/\n\n+/)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; })
      .join('');
  }

  // Generic content-pack lint: unresolved targets, dead ends, unreachable nodes.
  // Ignores `when` gating (a static prover, not a strict one) — good enough to
  // catch typos and orphaned scenes while a tale is being written.
  function validateTale(tale) {
    var issues = [];
    var ids = Object.keys(tale.nodes || {});
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });

    if (!tale.start || !idSet[tale.start]) {
      issues.push('start node "' + tale.start + '" does not exist');
    }

    ids.forEach(function (id) {
      var n = tale.nodes[id];
      if (!n.ending && (!n.choices || n.choices.length === 0)) {
        issues.push('node "' + id + '" is a dead end (no choices, not marked ending)');
      }
      (n.choices || []).forEach(function (c) {
        if (!idSet[c.next]) {
          issues.push('node "' + id + '" choice "' + c.label + '" points to missing node "' + c.next + '"');
        }
      });
    });

    var reached = {};
    var queue = tale.start ? [tale.start] : [];
    while (queue.length) {
      var id = queue.shift();
      if (reached[id]) continue;
      reached[id] = true;
      var n = tale.nodes[id];
      (n && n.choices || []).forEach(function (c) {
        if (idSet[c.next]) queue.push(c.next);
      });
    }
    ids.forEach(function (id) {
      if (!reached[id]) issues.push('node "' + id + '" is unreachable from start');
    });

    return issues;
  }

  function StoryEngine(rootEl, tale) {
    this.root = rootEl;
    this.tale = tale;
    this.flags = Object.assign({}, tale.flags || {});
    this.history = [];
    this.currentId = tale.start;
    this.storyPanelOpen = false;
    this._onClick = this._onClick.bind(this);
    this.root.addEventListener('click', this._onClick);
  }

  StoryEngine.prototype.node = function (id) {
    var n = this.tale.nodes[id];
    if (!n) throw new Error('Skazka Trail: unknown node "' + id + '"');
    return n;
  };

  StoryEngine.prototype.resolveText = function (node) {
    return typeof node.text === 'function' ? node.text(this.flags) : node.text;
  };

  StoryEngine.prototype.visibleChoices = function (node) {
    var flags = this.flags;
    return (node.choices || []).filter(function (c) {
      return typeof c.when !== 'function' || c.when(flags);
    });
  };

  StoryEngine.prototype.restart = function () {
    this.flags = Object.assign({}, this.tale.flags || {});
    this.history = [];
    this.currentId = this.tale.start;
    this.storyPanelOpen = false;
    this.render();
  };

  StoryEngine.prototype.choose = function (choiceIndex) {
    var node = this.node(this.currentId);
    var choice = this.visibleChoices(node)[choiceIndex];
    if (!choice) return;

    if (choice.delta) {
      var flags = this.flags;
      Object.keys(choice.delta).forEach(function (k) {
        var d = choice.delta[k];
        flags[k] = typeof d === 'number' ? (flags[k] || 0) + d : d;
      });
    }

    this.history.push({
      log: node.log || this.resolveText(node).slice(0, 70),
      choiceLabel: choice.label
    });
    this.currentId = choice.next;
    this.render();
  };

  StoryEngine.prototype.toggleStoryPanel = function () {
    this.storyPanelOpen = !this.storyPanelOpen;
    this.render();
  };

  StoryEngine.prototype.renderRecap = function () {
    if (!this.history.length) {
      return '<p class="st-recap-empty">No choices made yet.</p>';
    }
    var items = this.history.map(function (h) {
      return '<li><span class="st-recap-scene">' + esc(h.log) + '</span>' +
        '<span class="st-recap-choice">→ ' + esc(h.choiceLabel) + '</span></li>';
    }).join('');
    return '<ol class="st-recap-list">' + items + '</ol>';
  };

  StoryEngine.prototype.renderStoryPanel = function () {
    if (!this.storyPanelOpen) return '';
    return (
      '<div class="st-panel" role="dialog" aria-label="Story so far">' +
        '<div class="st-panel-inner">' +
          '<div class="st-panel-header">' +
            '<h2>Story so far</h2>' +
            '<button type="button" class="st-btn st-btn-ghost" data-action="story-so-far">Close ✕</button>' +
          '</div>' +
          this.renderRecap() +
        '</div>' +
      '</div>'
    );
  };

  StoryEngine.prototype.render = function () {
    var node = this.node(this.currentId);
    var text = this.resolveText(node);
    var isEnding = !!node.ending;
    var choices = this.visibleChoices(node);

    var html = '';
    html += '<div class="st-toolbar">';
    html += '<span class="st-tale-title">' + esc(this.tale.title) + '</span>';
    html += '<span class="st-toolbar-actions">';
    html += '<button type="button" class="st-btn st-btn-ghost" data-action="story-so-far">📜 Story so far</button>';
    html += '<button type="button" class="st-btn st-btn-ghost" data-action="restart">↺ Restart</button>';
    html += '</span></div>';

    html += '<div class="st-scene' + (isEnding ? ' st-ending' : '') + '">';
    if (isEnding) {
      html += '<p class="st-ending-eyebrow">Ending</p>';
      html += '<h1 class="st-ending-title">' + esc(node.title || '') + '</h1>';
    }
    html += paragraphs(text);
    if (isEnding && node.moral) {
      html += '<p class="st-moral">&ldquo;' + esc(node.moral) + '&rdquo;</p>';
    }
    html += '</div>';

    if (isEnding) {
      html += '<div class="st-recap-block"><h3>How you got here</h3>' + this.renderRecap() + '</div>';
      html += '<div class="st-choices"><button type="button" class="st-btn st-btn-primary" data-action="restart">↺ Play again</button></div>';
    } else {
      html += '<div class="st-choices">';
      choices.forEach(function (c, i) {
        html += '<button type="button" class="st-btn st-choice" data-choice-index="' + i + '">' + esc(c.label) + '</button>';
      });
      html += '</div>';
    }

    html += this.renderStoryPanel();

    this.root.innerHTML = html;
  };

  StoryEngine.prototype._onClick = function (evt) {
    var el = evt.target.closest('[data-action], [data-choice-index]');
    if (!el) return;
    if (el.hasAttribute('data-choice-index')) {
      this.choose(Number(el.getAttribute('data-choice-index')));
      return;
    }
    var action = el.getAttribute('data-action');
    if (action === 'restart') this.restart();
    else if (action === 'story-so-far') this.toggleStoryPanel();
  };

  // ---- Dev/debug graph view (?debug=1) ------------------------------------

  function renderDebugView(rootEl, tale) {
    var issues = validateTale(tale);
    var html = '';
    html += '<div class="st-toolbar">';
    html += '<span class="st-tale-title">🔧 Debug — ' + esc(tale.title) + '</span>';
    html += '<span class="st-toolbar-actions"><a class="st-btn st-btn-ghost" href="?">← Back to play</a></span>';
    html += '</div>';

    html += '<div class="st-debug">';
    html += '<p><strong>Start node:</strong> ' + esc(tale.start) + '</p>';
    html += '<p><strong>Initial flags:</strong> ' + esc(JSON.stringify(tale.flags || {})) + '</p>';

    if (issues.length) {
      html += '<div class="st-debug-issues"><strong>' + issues.length + ' issue(s):</strong><ul>';
      issues.forEach(function (msg) { html += '<li>' + esc(msg) + '</li>'; });
      html += '</ul></div>';
    } else {
      html += '<p class="st-debug-ok">No structural issues found (all choice targets exist, every node reachable, no silent dead ends).</p>';
    }

    var ids = Object.keys(tale.nodes);
    html += '<p><strong>' + ids.length + ' node(s):</strong></p>';
    ids.forEach(function (id) {
      var n = tale.nodes[id];
      html += '<div class="st-debug-node' + (n.ending ? ' st-debug-ending' : '') + '">';
      html += '<h3>' + esc(id) + (n.ending ? ' <span class="st-debug-tag">ENDING</span>' : '') + '</h3>';
      if (n.ending) {
        html += '<p><em>' + esc(n.title || '') + '</em> — &ldquo;' + esc(n.moral || '') + '&rdquo;</p>';
      }
      var textPreview = typeof n.text === 'function'
        ? '[dynamic text — depends on flags]'
        : String(n.text || '').slice(0, 100).replace(/\n+/g, ' ') + '…';
      html += '<p class="st-debug-text">' + esc(textPreview) + '</p>';
      if (n.choices && n.choices.length) {
        html += '<ul class="st-debug-choices">';
        n.choices.forEach(function (c) {
          var delta = c.delta ? ' delta=' + JSON.stringify(c.delta) : '';
          var gated = typeof c.when === 'function' ? ' [gated: ' + c.when.toString().replace(/\s+/g, ' ') + ']' : '';
          html += '<li>&ldquo;' + esc(c.label) + '&rdquo; → <strong>' + esc(c.next) + '</strong>' + esc(delta) + esc(gated) + '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</div>';

    rootEl.innerHTML = html;
  }

  // ---- Public API ----------------------------------------------------------

  global.SkazkaEngine = {
    mount: function (rootEl, tale) {
      if (typeof location !== 'undefined' && /(?:^|[?&])debug=1(?:&|$)/.test(location.search)) {
        renderDebugView(rootEl, tale);
        return null;
      }
      var engine = new StoryEngine(rootEl, tale);
      engine.render();
      return engine;
    },
    validateTale: validateTale
  };
})(window);
