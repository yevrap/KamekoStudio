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
 */

(function () {
  // ─── Versioning System ────────────────────────────────────────────────────────

  let loadedVersion = null; // Object: {version, buildDate, timestamp}

  function fetchVersionInfo(forceBypassCache = false) {
    const basePath = getGalleryPath().replace('index.html', '');
    const url = basePath + 'version.json' + (forceBypassCache ? '?t=' + Date.now() : '');
    const options = forceBypassCache ? { cache: 'no-store' } : {};
    return fetch(url, options)
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

  function checkForUpdates(isManual = false) {
    if (!loadedVersion) return;
    fetchVersionInfo(true).then(newData => {
      if (newData && newData.timestamp > loadedVersion.timestamp) {
        if (isManual || getGalleryPath() === 'index.html' || (document.getElementById('settings-overlay') && document.getElementById('settings-overlay').classList.contains('open'))) {
          showUpdateBanner(newData);
        } else {
          window.KamekoPendingUpdate = newData;
        }
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
      // High scores / progress
      'gridGameTopScoreScore', 'gridGameTopScoreSurvival',
      'riverRunHighScore', 'keypadQuestHighWave', 'blobZapperHighScore',
      'alchemistHighScore', 'tysiachaHighScore', 'astroSalon_bestStars', 'bestScore_pachinkoBazaar',
      // Last played timestamps
      'lastPlayed_hiddenObject', 'lastPlayed_materialsRun',
      'lastPlayed_keypadQuest', 'lastPlayed_riverRun',
      'lastPlayed_blobZapper', 'lastPlayed_durak',
      'lastPlayed_durakDungeon', 'lastPlayed_durakTactics',
      'lastPlayed_durakAlchemist', 'lastPlayed_tysiacha', 'lastPlayed_astroSalon', 'lastPlayed_pachinkoBazaar',
      // River Run
      'riverRun_autoShoot', 'riverRun_autoAvoid',
      'riverRun_invertControls', 'muted',
      'riverRun_autoPlay', 'riverRun_autoPlaySpeed', 'riverRun_autoRestart',
      // Blob Zapper
      'blobZapper_autoPlay', 'blobZapper_autoRestart',
      // Durak
      'durak_mode', 'durak_playerCount', 'durak_difficulty',
      'durak_wins', 'durak_losses', 'durak_draws',
      'durak_coach', 'durak_perevodnoy', 'durak_first_transfer',
      'durak_sort', 'durak_autoPlay', 'durak_autoPlaySpeed', 'durak_revealHands', 'durak_autoRestart',
      // Durak Dungeon / Tactics
      'durakDungeon_bestFloor', 'durakDungeon_victories',
      'durakDungeon_lastSeed', 'durakTactics_victories',
      // Keypad Quest
      'keypadQuestCheckpoint', 'keypadQuest_decks', 'keypadQuest_customDeck',
      'keypadQuest_activeDeckIds', 'keypadQuest_inputMode',
      'keypadQuest_autoPlay', 'keypadQuest_autoPlaySpeed', 'keypadQuest_autoRestart',
      // Tysiacha
      'tysiacha_lang', 'tysiacha_difficulty', 'tysiacha_muted',
      'tysiacha_settings', 'tysiacha_autoPlay', 'tysiacha_autoPlaySpeed', 'tysiacha_revealHands', 'tysiacha_autoRestart',
      // Astro Salon
      'astroSalon_lang', 'astroSalon_mySign'
    ];
    // Per-seat / per-wave keys have dynamic suffixes — clear by prefix.
    const prefixesToRemove = [
      'tysiacha_name_', 'durak_name_ai_', 'durak_name_hotseat_',
      'keypadQuestBestTime_', 'materialsRun_'
    ];

    let clearedCount = 0;
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (prefixesToRemove.some(p => key.indexOf(p) === 0)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    }

    showSettingsToast(`Cleared ${clearedCount} item(s). Page will reload.`);
    setTimeout(() => location.reload(), 1500);
  }

  // Minimal transient toast (the old one belonged to the removed token system).
  function showSettingsToast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);' +
      'background:rgba(20,20,30,0.95);color:#fff;padding:10px 18px;border-radius:8px;' +
      'font:14px system-ui,sans-serif;z-index:10000;box-shadow:0 4px 16px rgba(0,0,0,0.4)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  // Apply saved theme immediately (body is available since script is before </body>)
  applyTheme(getSavedTheme());

  // One-time cleanup for removed token system (Sprint 2)
  localStorage.removeItem('tokens');
  localStorage.removeItem('tokenHistory');

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
      updateDevModeUI();
      renderAllGameSections();

      if (window.KamekoPendingUpdate) {
        showUpdateBanner(window.KamekoPendingUpdate);
        window.KamekoPendingUpdate = null;
      }

      const body = document.getElementById('settings-drawer-body');
      if (body) {
        body.scrollTop = 0;
        body.dispatchEvent(new Event('scroll'));
      }
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
    const body = document.getElementById('settings-drawer-body');
    const st = body ? body.scrollTop : 0;

    gameSectionRegistry.forEach(function (entry) {
      try { renderGameSection(entry); }
      catch (e) { console.error('KamekoSettings: section "' + entry.id + '" failed to render', e); }
    });

    if (body) body.scrollTop = st;
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
    },
    registerWatchSection: function(gamePrefix, watchOptions) {
      this.registerSection(gamePrefix + '-watch', {
        title: '▶ Watch Mode',
        render: function(container) {
          const isWatching = localStorage.getItem(gamePrefix + '_autoPlay') === 'true';
          
          if (watchOptions.hasSpeed !== false) {
            const speedRow = document.createElement('div');
            speedRow.className = 'settings-row-pair';
            const speedVal = localStorage.getItem(gamePrefix + '_autoPlaySpeed') || 'normal';
            ['slow', 'normal', 'fast'].forEach(function(s) {
              const btn = document.createElement('button');
              btn.className = 'settings-btn compact' + (speedVal === s ? ' active' : '');
              btn.textContent = s.charAt(0).toUpperCase() + s.slice(1);
              if (speedVal === s) btn.style.background = 'rgba(255,255,255,0.2)';
              btn.addEventListener('click', function() {
                localStorage.setItem(gamePrefix + '_autoPlaySpeed', s);
                renderAllGameSections();
              });
              speedRow.appendChild(btn);
            });
            container.appendChild(speedRow);
          }

          if (watchOptions.hasRevealHands) {
            const revealRow = document.createElement('div');
            revealRow.className = 'settings-row';
            revealRow.style.background = 'transparent';
            revealRow.style.border = 'none';
            revealRow.style.padding = '0';
            const revealLabel = document.createElement('label');
            revealLabel.textContent = 'Reveal all hands';
            revealLabel.style.cursor = 'pointer';
            const revealSwitch = document.createElement('label');
            revealSwitch.className = 'kameko-switch';
            const revealInput = document.createElement('input');
            revealInput.type = 'checkbox';
            revealInput.checked = localStorage.getItem(gamePrefix + '_revealHands') === 'true';
            revealInput.addEventListener('change', function(e) {
              localStorage.setItem(gamePrefix + '_revealHands', e.target.checked ? 'true' : 'false');
            });
            const revealSlider = document.createElement('span');
            revealSlider.className = 'kameko-slider';
            revealSwitch.appendChild(revealInput);
            revealSwitch.appendChild(revealSlider);
            revealRow.appendChild(revealLabel);
            revealRow.appendChild(revealSwitch);
            container.appendChild(revealRow);
          }

          // Auto-restart is opt-out: games that don't implement it (keypad-quest,
          // river-run — no discrete game-over/restart to loop) pass hasAutoRestart:false
          // so the drawer doesn't show a dead switch (b-26).
          if (watchOptions.hasAutoRestart !== false) {
            const restartRow = document.createElement('div');
            restartRow.className = 'settings-row';
            restartRow.style.background = 'transparent';
            restartRow.style.border = 'none';
            restartRow.style.padding = '0';
            const restartLabel = document.createElement('label');
            restartLabel.textContent = 'Auto-restart match';
            restartLabel.style.cursor = 'pointer';
            const restartSwitch = document.createElement('label');
            restartSwitch.className = 'kameko-switch';
            const restartInput = document.createElement('input');
            restartInput.type = 'checkbox';
            restartInput.checked = localStorage.getItem(gamePrefix + '_autoRestart') === 'true';
            restartInput.addEventListener('change', function(e) {
              localStorage.setItem(gamePrefix + '_autoRestart', e.target.checked ? 'true' : 'false');
            });
            const restartSlider = document.createElement('span');
            restartSlider.className = 'kameko-slider';
            restartSwitch.appendChild(restartInput);
            restartSwitch.appendChild(restartSlider);
            restartRow.appendChild(restartLabel);
            restartRow.appendChild(restartSwitch);
            container.appendChild(restartRow);
          }

          const btnAction = document.createElement('button');
          btnAction.className = isWatching ? 'settings-primary-btn' : 'settings-btn';
          btnAction.textContent = isWatching ? 'Take Over / Stop' : '▶ Watch';
          btnAction.addEventListener('click', function() {
            localStorage.setItem(gamePrefix + '_autoPlay', isWatching ? 'false' : 'true');
            // Games that mirror the flag in live state sync it in these hooks —
            // localStorage alone is invisible to games that don't re-read it per frame.
            if (isWatching && watchOptions.onStop) watchOptions.onStop();
            if (!isWatching && watchOptions.onStart) watchOptions.onStart();
            window.KamekoSettings.closeDrawer();
            renderAllGameSections();
          });
          container.appendChild(btnAction);
        }
      });
    }
  };

  // ─── Inject UI ───────────────────────────────────────────────────────────────

  function loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const basePath = getGalleryPath().replace('index.html', '');
    link.href = basePath + 'shared/settings.css';
    document.head.appendChild(link);

    if (!document.head.querySelector('link[rel="icon"], link[rel="apple-touch-icon"]')) {
      const fav = document.createElement('link');
      fav.rel = 'icon';
      fav.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🕹️</text></svg>';
      document.head.appendChild(fav);
    }
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
    
    // Scroll affordance
    const affordance = document.createElement('div');
    affordance.id = 'settings-scroll-affordance';
    
    body.addEventListener('scroll', function() {
      const isAtBottom = body.scrollHeight - body.scrollTop <= body.clientHeight + 4;
      affordance.style.opacity = isAtBottom ? '0' : '1';
    });

    // Game Specific Section Container
    const gameSection = document.createElement('div');
    gameSection.id = 'settings-game-section';
    body.appendChild(gameSection);

    const galleryPath = getGalleryPath();
    const basePath = galleryPath.replace('index.html', '');

    // ─── Arcade Cluster ───────────────────────────────────────────────────
    const arcadeCluster = document.createElement('div');
    arcadeCluster.className = 'settings-arcade-cluster';

    const arcadeTitle = document.createElement('h3');
    arcadeTitle.textContent = 'Arcade';
    arcadeTitle.className = 'settings-arcade-cluster-title';
    arcadeCluster.appendChild(arcadeTitle);

    // ─── Quick game switcher ──────────────────────────────────────────────
    // One-tap jumps between games without going through the gallery.
    const GAMES = [
      { slug: 'hidden-object',   emoji: '🔍', title: 'Hidden Object' },
      { slug: 'keypad-quest',    emoji: '⌨️', title: 'Keypad Quest' },
      { slug: 'river-run',       emoji: '🌊', title: 'River Run' },
      { slug: 'blob-zapper',     emoji: '⚡', title: 'Blob Zapper' },
      { slug: 'materials-run',   emoji: '🏃', title: 'Materials Run' },
      { slug: 'durak',           emoji: '🃏', title: 'Durak' },
      { slug: 'tysiacha',        emoji: '🎴', title: 'Tysiacha' },
      { slug: 'astro-salon',     emoji: '🔮', title: 'Astro Salon' }
    ];
    const currentGameMatch = location.pathname.match(/\/games\/([^/]+)/);
    const currentSlug = currentGameMatch ? currentGameMatch[1] : null;

    const switcher = document.createElement('div');
    switcher.id = 'settings-game-switcher';
    GAMES.forEach(function (g) {
      const icon = document.createElement('a');
      icon.className = 'kameko-switcher-icon' + (g.slug === currentSlug ? ' current' : '');
      icon.href = basePath + 'games/' + g.slug + '/';
      icon.title = g.title;
      icon.setAttribute('aria-label', g.title);
      icon.textContent = g.emoji;
      switcher.appendChild(icon);
    });
    arcadeCluster.appendChild(switcher);

    // Theme toggle + gallery link, side by side to keep the drawer short
    const chromeRow = document.createElement('div');
    chromeRow.className = 'settings-row-pair';

    const darkModeBtn = document.createElement('button');
    darkModeBtn.id = 'settings-dark-mode-btn';
    darkModeBtn.className = 'settings-btn compact';
    darkModeBtn.addEventListener('click', function () {
      setTheme(getSavedTheme() === 'dark' ? 'light' : 'dark');
    });
    chromeRow.appendChild(darkModeBtn);

    // Gallery link
    const galleryLink = document.createElement('a');
    galleryLink.id = 'settings-gallery-link';
    galleryLink.href = galleryPath;
    galleryLink.className = 'settings-btn compact';
    galleryLink.innerHTML = '\uD83C\uDFE0 Gallery';
    chromeRow.appendChild(galleryLink);

    arcadeCluster.appendChild(chromeRow);

    // ─── App section (collapsed by default) ───────────────────────────────
    // Dev mode, clear-data, and version/update controls are rarely needed —
    // they fold away behind a disclosure so the drawer stays short.
    const appDetails = document.createElement('details');
    appDetails.id = 'settings-app-details';
    const appSummary = document.createElement('summary');
    appSummary.textContent = '⚙️ App — version, updates & dev tools';
    appDetails.appendChild(appSummary);

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
    appDetails.appendChild(devModeRow);

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
    appDetails.appendChild(devToolsContainer);

    // --- Version & Updates Section ---
    const versionContainer = document.createElement('div');
    versionContainer.style.cssText = 'display:flex; flex-direction:column; gap:10px; margin-top:8px; font-family:sans-serif;';
    
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
        if (newData && loadedVersion && newData.timestamp > loadedVersion.timestamp) {
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
    appDetails.appendChild(versionContainer);

    arcadeCluster.appendChild(appDetails);
    body.appendChild(arcadeCluster);

    panel.appendChild(body);
    panel.appendChild(affordance);
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
