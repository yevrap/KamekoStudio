/**
 * settings.js — Global settings panel for Kameko Studio
 *
 * Include in every page before </body>:
 *   <script src="path/to/shared/settings.js" data-gallery-depth="N"></script>
 *
 * data-gallery-depth: how many directory levels deep the page is relative to the root.
 *   0 = root (index.html, 3d.html)
 *   2 = games/<name>/index.html
 *
 * Dispatches window events:
 *   'settingsOpened' — game should pause
 *   'settingsClosed' — game should resume
 *
 * Manages dark mode via:
 *   localStorage key: 'theme' = 'dark' | 'light'
 *   CSS class: body.dark-mode
 *
 * Token system (window.KamekoTokens):
 *   localStorage key: 'tokens' = integer
 *   localStorage key: 'tokenHistory' = JSON array of {ts, amount, reason}, capped at 50 entries
 *   KamekoTokens.get()             — returns current count
 *   KamekoTokens.add(n=1)          — adds n tokens (no history entry; used by the settings-panel faucet)
 *   KamekoTokens.earn(n, reason)   — adds n tokens and records a history entry; used by games rewarding play
 *   KamekoTokens.spend()           — deducts 1; returns true on success, false if none
 *   KamekoTokens.toast(msg)        — shows a brief no-tokens notice
 */

(function () {
  // ─── Token system ───────────────────────────────────────────────────────────

  function getTokenCount() {
    return parseInt(localStorage.getItem('tokens') || '0', 10);
  }
  function saveTokenCount(n) {
    localStorage.setItem('tokens', Math.max(0, n));
  }
  function updateTokenDisplay() {
    const count = getTokenCount();
    const el = document.getElementById('settings-token-count');
    if (el) el.textContent = count;
    const header = document.getElementById('headerTokenCount');
    if (header) header.textContent = count;
  }

  function recordTokenHistory(amount, reason) {
    let history;
    try { history = JSON.parse(localStorage.getItem('tokenHistory') || '[]'); }
    catch (e) { history = []; }
    history.push({ ts: Date.now(), amount: amount, reason: reason || '' });
    if (history.length > 50) history = history.slice(history.length - 50);
    localStorage.setItem('tokenHistory', JSON.stringify(history));
  }

  window.KamekoTokens = {
    get: getTokenCount,
    add: function (n) {
      if (n === undefined) n = 1;
      saveTokenCount(getTokenCount() + n);
      updateTokenDisplay();
    },
    earn: function (n, reason) {
      if (n === undefined) n = 1;
      saveTokenCount(getTokenCount() + n);
      recordTokenHistory(n, reason);
      updateTokenDisplay();
    },
    spend: function () {
      const t = getTokenCount();
      if (t <= 0) return false;
      saveTokenCount(t - 1);
      updateTokenDisplay();
      return true;
    },
    toast: function (msg) {
      msg = msg || 'No tokens! Open ☰ Menu to get one.';
      let toast = document.getElementById('kameko-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'kameko-toast';
        toast.style.cssText = [
          'position:fixed', 'bottom:24px', 'left:50%',
          'transform:translateX(-50%)',
          'background:rgba(20,20,40,0.95)', 'color:white',
          'padding:12px 22px', 'border-radius:10px',
          'font-family:sans-serif', 'font-size:0.95em',
          'z-index:20000', 'pointer-events:none',
          'transition:opacity 0.4s ease',
          'box-shadow:0 4px 16px rgba(0,0,0,0.5)',
          'text-align:center', 'max-width:80vw'
        ].join(';');
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.opacity = '1';
      clearTimeout(toast._hideTimeout);
      toast._hideTimeout = setTimeout(function () {
        toast.style.opacity = '0';
      }, 2500);
    }
  };

  // ─── Versioning System ────────────────────────────────────────────────────────

  let loadedVersion = null; // Object: {version, buildDate, timestamp}

  function fetchVersionInfo(forceBypassCache = false) {
    const basePath = getGalleryPath().replace('index.html', '');
    const url = basePath + 'version.json' + (forceBypassCache ? '?t=' + Date.now() : '');
    return fetch(url)
      .then(res => res.json())
      .catch(() => null);
  }

  function initVersioning() {
    try {
      const stored = sessionStorage.getItem('kameko_version');
      if (stored) loadedVersion = JSON.parse(stored);
    } catch (e) {}

    if (!loadedVersion) {
      fetchVersionInfo().then(data => {
        if (data) {
          loadedVersion = data;
          sessionStorage.setItem('kameko_version', JSON.stringify(loadedVersion));
          updateSettingsVersionDisplay();
        }
      });
    }

    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) checkForUpdates();
    });
    window.addEventListener('pageshow', function(e) {
      if (e.persisted) checkForUpdates();
    });
  }

  function checkForUpdates() {
    if (!loadedVersion) return;
    fetchVersionInfo(true).then(newData => {
      if (newData && newData.version > loadedVersion.version) {
        showUpdateBanner(newData);
      }
    });
  }

  function showUpdateBanner(newData) {
    if (document.getElementById('kameko-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'kameko-update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    
    const text = document.createElement('div');
    text.style.cssText = 'font-size:0.95em; font-weight:500; display:flex; flex-direction:column; gap:2px;';
    text.innerHTML = '<span>New version available (v' + newData.version + ')</span>' +
                     '<span style="font-size:0.8em; opacity:0.7">Refresh to update</span>';

    const updateBtn = document.createElement('button');
    updateBtn.textContent = 'Update';
    updateBtn.style.cssText = [
      'background:#4f46e5', 'color:white', 'border:none', 'border-radius:6px',
      'padding:8px 16px', 'font-weight:600', 'cursor:pointer',
      'transition:background 0.2s, transform 0.1s'
    ].join(';');
    updateBtn.addEventListener('pointerover', function() { updateBtn.style.background = '#4338ca'; });
    updateBtn.addEventListener('pointerout', function() { updateBtn.style.background = '#4f46e5'; });
    updateBtn.addEventListener('pointerdown', function() { updateBtn.style.transform = 'scale(0.95)'; });
    updateBtn.addEventListener('click', function() {
      sessionStorage.setItem('kameko_version', JSON.stringify(newData));
      location.reload(true);
    });

    const dismissBtn = document.createElement('button');
    dismissBtn.innerHTML = '&times;';
    dismissBtn.style.cssText = [
      'background:transparent', 'color:rgba(255,255,255,0.6)', 'border:none',
      'font-size:1.4em', 'cursor:pointer', 'padding:0 4px', 'line-height:1'
    ].join(';');
    dismissBtn.addEventListener('click', function() { banner.remove(); });

    banner.appendChild(text);
    banner.appendChild(updateBtn);
    banner.appendChild(dismissBtn);
    
    document.body.appendChild(banner);
  }

  function updateSettingsVersionDisplay() {
    const el = document.getElementById('settings-version-display');
    if (el && loadedVersion) {
      el.textContent = 'v' + loadedVersion.version + ' (' + loadedVersion.buildDate + ')';
    }
  }

  // ─── Theme helpers ───────────────────────────────────────────────────────────

  function getSavedTheme() {
    return localStorage.getItem('theme') || 'dark';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    updateDarkModeButton();
  }

  // ─── Dev Mode helpers ───────────────────────────────────────────────────────

  function isDevMode() {
    return localStorage.getItem('devMode') === 'true';
  }

  function setDevMode(enabled) {
    localStorage.setItem('devMode', String(enabled));
    updateDevModeUI();
  }

  function updateDevModeUI() {
    const devContainer = document.getElementById('developer-tools-container');
    const devToggle = document.getElementById('dev-mode-checkbox');
    const gearBtn = document.getElementById('settings-hamburger-btn');

    // Always set checkbox state based on isDevMode()
    if (devToggle) {
      devToggle.checked = isDevMode();
    }
    
    // Toggle visibility of the container for extra dev tools
    if (devContainer) {
      devContainer.style.display = isDevMode() ? 'flex' : 'none';
    }

    // Toggle a class on the gear icon for visual feedback
    if (gearBtn) {
      if (isDevMode()) {
        gearBtn.classList.add('dev-mode-active');
      } else {
        gearBtn.classList.remove('dev-mode-active');
      }
    }
  }

  function clearAllGameData() {
    if (!confirm('Are you sure you want to clear ALL game data? This cannot be undone.')) {
      return;
    }

    const keysToRemove = [
      'theme', 'tokens', 'tokenHistory', 'devMode',
      // Game progress
      'gridGameTopScoreScore', 'gridGameTopScoreSurvival',
      'riverRunHighScore', 'keypadQuestHighWave',
      // Last played timestamps
      'lastPlayed_hiddenObject', 'lastPlayed_materialsRun',
      'lastPlayed_keypadQuest', 'lastPlayed_riverRun',
      'lastPlayed_blobZapper', 'lastPlayed_durak',
      'lastPlayed_durakDungeon',
      // Game-specific settings
      'riverRun_autoShoot', 'riverRun_autoAvoid',
      'riverRun_invertControls', 'muted',
      'durak_mode',
      'durakDungeon_bestFloor', 'durakDungeon_victories',
      'durakDungeon_lastSeed'
    ];

    let clearedCount = 0;
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    window.KamekoTokens.toast(`Cleared ${clearedCount} item(s). Page will reload.`);
    setTimeout(() => location.reload(), 1500);
  }

  // Apply saved theme immediately (body is available since script is before </body>)
  applyTheme(getSavedTheme());

  // Init versioning system (fetch initial version or hook into visibility change)
  initVersioning();

  // ─── Gallery path resolution ─────────────────────────────────────────────────

  function getGalleryPath() {
    const scripts = document.querySelectorAll('script[src*="settings.js"]');
    const script = scripts[scripts.length - 1];
    const depth = parseInt(script && script.dataset.galleryDepth || '0', 10);
    if (depth === 0) return 'index.html';
    return '../'.repeat(depth) + 'index.html';
  }

  // ─── Panel open/close ────────────────────────────────────────────────────────

  function openSettings() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
      overlay.style.display = 'block';
      // Force reflow for transition
      void overlay.offsetWidth;
      overlay.classList.add('open');
      updateDarkModeButton();
      updateTokenDisplay();
      updateDevModeUI();
      renderAllGameSections();
    }
    window.dispatchEvent(new CustomEvent('settingsOpened'));
  }

  function closeSettings() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300); // Wait for transition
    }
    window.dispatchEvent(new CustomEvent('settingsClosed'));
  }

  function updateDarkModeButton() {
    const btn = document.getElementById('settings-dark-mode-btn');
    if (!btn) return;
    const isDark = getSavedTheme() === 'dark';
    btn.innerHTML = isDark ? '\u2600\uFE0F Light Mode' : '\uD83C\uDF19 Dark Mode';
  }

  // ─── Game Settings API ────────────────────────────────────────────────────────
  // Sections are registered once (any time, typically at game boot) and
  // re-rendered from scratch on EVERY drawer open, so control values always
  // reflect live game state. Games must not remove their sections on
  // settingsClosed — the drawer owns the lifecycle.
  //
  // registerSection(id, options):
  //   title:  string, or function returning a string (re-evaluated per open)
  //   when:   optional function returning boolean — section is skipped when false
  //   render: function(container) — build the section's controls
  const gameSectionRegistry = []; // {id, options} in registration order

  function renderGameSection(entry) {
    const gameSection = document.getElementById('settings-game-section');
    if (!gameSection) return;

    let wrapper = document.getElementById('game-settings-' + entry.id);
    const visible = entry.options.when ? !!entry.options.when() : true;
    if (!visible) {
      if (wrapper) wrapper.remove();
      return;
    }

    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'game-settings-' + entry.id;
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = '12px';
    }
    wrapper.innerHTML = '';

    const titleText = typeof entry.options.title === 'function' ? entry.options.title() : entry.options.title;
    if (titleText) {
      const title = document.createElement('h3');
      title.textContent = titleText;
      title.style.margin = '0';
      title.style.fontSize = '1.1em';
      title.style.fontFamily = 'sans-serif';
      title.style.color = 'rgba(255,255,255,0.85)';
      wrapper.appendChild(title);
    }

    const contentContainer = document.createElement('div');
    contentContainer.style.display = 'flex';
    contentContainer.style.flexDirection = 'column';
    contentContainer.style.gap = '8px';
    wrapper.appendChild(contentContainer);

    // appendChild moves an existing wrapper to the end; iterating the
    // registry in order re-establishes registration order on every pass.
    gameSection.appendChild(wrapper);

    entry.options.render(contentContainer);
  }

  function renderAllGameSections() {
    gameSectionRegistry.forEach(function (entry) {
      try { renderGameSection(entry); }
      catch (e) { console.error('KamekoSettings: section "' + entry.id + '" failed to render', e); }
    });
  }

  window.KamekoSettings = {
    openDrawer: openSettings,
    closeDrawer: closeSettings,
    registerSection: function(id, options) {
      const existing = gameSectionRegistry.find(function (s) { return s.id === id; });
      if (existing) existing.options = options;
      else gameSectionRegistry.push({ id: id, options: options });

      // If the drawer is already open (e.g. registration from a
      // settingsOpened listener), render right away.
      const overlay = document.getElementById('settings-overlay');
      if (overlay && overlay.classList.contains('open')) {
        try { renderGameSection(gameSectionRegistry.find(function (s) { return s.id === id; })); }
        catch (e) { console.error('KamekoSettings: section "' + id + '" failed to render', e); }
      }
    }
  };

  // ─── Inject UI ───────────────────────────────────────────────────────────────

  function loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const basePath = getGalleryPath().replace('index.html', '');
    link.href = basePath + 'shared/settings.css';
    document.head.appendChild(link);
  }

  function injectUI() {
    loadCSS();

    // Drawer Trigger Button (Hamburger)
    const gearBtn = document.createElement('button');
    gearBtn.id = 'settings-hamburger-btn';
    gearBtn.setAttribute('aria-label', 'Menu');
    gearBtn.textContent = '\u2630'; // Hamburger menu icon
    gearBtn.addEventListener('click', openSettings);
    document.body.appendChild(gearBtn);

    // Settings overlay (full-screen backdrop)
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';

    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    
    // Header
    const header = document.createElement('div');
    header.id = 'settings-drawer-header';
    const heading = document.createElement('h2');
    heading.textContent = 'Menu';
    const closeBtn = document.createElement('button');
    closeBtn.id = 'settings-close-btn';
    closeBtn.innerHTML = '\u00D7'; // multiply sign
    closeBtn.addEventListener('click', closeSettings);
    header.appendChild(heading);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Body (scrollable)
    const body = document.createElement('div');
    body.id = 'settings-drawer-body';
    
    // Game Specific Section Container
    const gameSection = document.createElement('div');
    gameSection.id = 'settings-game-section';
    body.appendChild(gameSection);

    const galleryPath = getGalleryPath();

    // Token row: count + Get Token button
    const tokenRow = document.createElement('div');
    tokenRow.className = 'settings-row';
    const tokenLabel = document.createElement('span');
    tokenLabel.innerHTML = '\uD83E\uDE99 Tokens: <strong id="settings-token-count">' + getTokenCount() + '</strong>';
    const getTokenBtn = document.createElement('button');
    getTokenBtn.id = 'settings-get-token-btn';
    getTokenBtn.textContent = '+ 1 \uD83E\uDE99';
    getTokenBtn.addEventListener('click', function () {
      window.KamekoTokens.add(1);
    });
    tokenRow.appendChild(tokenLabel);
    tokenRow.appendChild(getTokenBtn);
    body.appendChild(tokenRow);

    // Dark mode toggle button
    const darkModeBtn = document.createElement('button');
    darkModeBtn.id = 'settings-dark-mode-btn';
    darkModeBtn.className = 'settings-btn';
    darkModeBtn.addEventListener('click', function () {
      setTheme(getSavedTheme() === 'dark' ? 'light' : 'dark');
    });
    body.appendChild(darkModeBtn);

    // Gallery link
    const galleryLink = document.createElement('a');
    galleryLink.id = 'settings-gallery-link';
    galleryLink.href = galleryPath;
    galleryLink.className = 'settings-btn';
    galleryLink.innerHTML = '\uD83C\uDFE0 Back to Gallery';
    body.appendChild(galleryLink);

    // ─── Developer Tools ──────────────────────────────────────────────────
    const devToolsSeparator = document.createElement('div');
    devToolsSeparator.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.15); margin-top: 8px;';
    body.appendChild(devToolsSeparator);

    // --- Developer Mode Toggle ---
    const devModeRow = document.createElement('div');
    devModeRow.className = 'settings-row';
    devModeRow.style.background = 'transparent';
    devModeRow.style.border = 'none';
    devModeRow.style.padding = '0';
    
    const devModeLabel = document.createElement('label');
    devModeLabel.textContent = '\uD83D\uDCBB Developer Mode';
    devModeLabel.setAttribute('for', 'dev-mode-checkbox');
    devModeLabel.style.cursor = 'pointer';

    const devModeToggleSwitch = document.createElement('label');
    devModeToggleSwitch.className = 'kameko-switch';

    const devModeInput = document.createElement('input');
    devModeInput.type = 'checkbox';
    devModeInput.id = 'dev-mode-checkbox';
    devModeInput.addEventListener('change', (e) => {
        setDevMode(e.target.checked);
    });
    
    const devModeSlider = document.createElement('span');
    devModeSlider.className = 'kameko-slider';

    devModeToggleSwitch.appendChild(devModeInput);
    devModeToggleSwitch.appendChild(devModeSlider);

    devModeRow.appendChild(devModeLabel);
    devModeRow.appendChild(devModeToggleSwitch);
    body.appendChild(devModeRow);

    // --- Clear Data Button (in its own container) ---
    const devToolsContainer = document.createElement('div');
    devToolsContainer.id = 'developer-tools-container';
    devToolsContainer.style.cssText = 'display:none; flex-direction:column; gap:10px; margin-top: 8px;';

    const clearDataBtn = document.createElement('button');
    clearDataBtn.id = 'clear-data-btn';
    clearDataBtn.className = 'settings-danger-btn';
    clearDataBtn.textContent = '\uD83D\uDDD1\uFE0F Clear All Game Data';
    clearDataBtn.addEventListener('click', clearAllGameData);

    devToolsContainer.appendChild(clearDataBtn);
    body.appendChild(devToolsContainer);

    // --- Version & Updates Section ---
    const versionContainer = document.createElement('div');
    versionContainer.style.cssText = 'display:flex; flex-direction:column; gap:10px; margin-top:8px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.15); font-family:sans-serif;';
    
    const versionHeaderRow = document.createElement('div');
    versionHeaderRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; color:rgba(255,255,255,0.7); font-size:0.9em;';
    
    const versionLabel = document.createElement('span');
    versionLabel.textContent = 'App Version';
    
    const versionDisplay = document.createElement('strong');
    versionDisplay.id = 'settings-version-display';
    versionDisplay.style.cssText = 'color:white;';
    versionDisplay.textContent = loadedVersion ? ('v' + loadedVersion.version + ' (' + loadedVersion.buildDate + ')') : 'v?';
    
    versionHeaderRow.appendChild(versionLabel);
    versionHeaderRow.appendChild(versionDisplay);
    
    const checkUpdatesBtn = document.createElement('button');
    checkUpdatesBtn.className = 'settings-btn';
    checkUpdatesBtn.textContent = 'Check for Updates';
    checkUpdatesBtn.style.textAlign = 'center';
    
    const updateResultBox = document.createElement('div');
    updateResultBox.style.cssText = 'display:none; flex-direction:column; gap:8px; background:rgba(0,0,0,0.3); border-radius:8px; padding:12px; border:1px solid rgba(100,100,255,0.3); font-size:0.85em;';
    
    checkUpdatesBtn.addEventListener('click', function() {
      checkUpdatesBtn.textContent = 'Checking...';
      fetchVersionInfo(true).then(function(newData) {
        if (newData && loadedVersion && newData.version > loadedVersion.version) {
          checkUpdatesBtn.style.display = 'none';
          
          updateResultBox.style.display = 'flex';
          updateResultBox.innerHTML = '';
          
          const title = document.createElement('div');
          title.textContent = '\u2728 New version available!';
          title.style.cssText = 'color:#a88aff; font-weight:700; margin-bottom:2px; font-size:1.1em;';
          
          const compareRow = document.createElement('div');
          compareRow.style.cssText = 'display:flex; justify-content:space-between; color:rgba(255,255,255,0.8); margin-bottom:6px;';
          compareRow.innerHTML = '<span>Current: v' + loadedVersion.version + '</span> \u2192 <span style="color:white; font-weight:bold;">Latest: v' + newData.version + '</span>';
          
          const applyBtn = document.createElement('button');
          applyBtn.className = 'settings-primary-btn';
          applyBtn.textContent = 'Update Now';
          applyBtn.addEventListener('click', function() {
            sessionStorage.setItem('kameko_version', JSON.stringify(newData));
            location.reload(true);
          });
          
          updateResultBox.appendChild(title);
          updateResultBox.appendChild(compareRow);
          updateResultBox.appendChild(applyBtn);
          
          showUpdateBanner(newData); // Also spawn the toast in case they leave settings
          
        } else {
          checkUpdatesBtn.textContent = 'App is up to date \u2714\uFE0F';
          setTimeout(function() { checkUpdatesBtn.textContent = 'Check for Updates'; }, 2500);
        }
      }).catch(function() {
        checkUpdatesBtn.textContent = 'Error checking for updates';
        setTimeout(function() { checkUpdatesBtn.textContent = 'Check for Updates'; }, 2500);
      });
    });

    versionContainer.appendChild(versionHeaderRow);
    versionContainer.appendChild(checkUpdatesBtn);
    versionContainer.appendChild(updateResultBox);
    body.appendChild(versionContainer);
    
    panel.appendChild(body);
    overlay.appendChild(panel);

    // Close on backdrop click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSettings();
    });

    document.body.appendChild(overlay);

    updateDarkModeButton();
    updateDevModeUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }
})();
