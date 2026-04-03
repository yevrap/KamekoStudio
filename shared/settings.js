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
 *   KamekoTokens.get()     — returns current count
 *   KamekoTokens.add(n=1)  — adds n tokens
 *   KamekoTokens.spend()   — deducts 1; returns true on success, false if none
 *   KamekoTokens.toast(msg)— shows a brief no-tokens notice
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

  window.KamekoTokens = {
    get: getTokenCount,
    add: function (n) {
      if (n === undefined) n = 1;
      saveTokenCount(getTokenCount() + n);
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
      msg = msg || 'No tokens! Open \u2699\uFE0F Settings to get one.';
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
    const gearBtn = document.getElementById('settings-gear-btn');

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
      'theme', 'tokens', 'devMode',
      // Game progress
      'gridGameTopScoreScore', 'gridGameTopScoreSurvival',
      'riverRunHighScore', 'memoryTowerHighWave',
      // Last played timestamps
      'lastPlayed_hiddenObject', 'lastPlayed_materialsRun',
      'lastPlayed_memoryTower', 'lastPlayed_riverRun',
      'lastPlayed_blobZapper',
      // Game-specific settings
      'riverRun_autoShoot', 'riverRun_autoAvoid',
      'riverRun_invertControls', 'muted'
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
      overlay.style.display = 'flex';
      updateDarkModeButton();
      updateTokenDisplay();
      updateDevModeUI();
    }
    window.dispatchEvent(new CustomEvent('settingsOpened'));
  }

  function closeSettings() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.style.display = 'none';
    window.dispatchEvent(new CustomEvent('settingsClosed'));
  }

  function updateDarkModeButton() {
    const btn = document.getElementById('settings-dark-mode-btn');
    if (!btn) return;
    const isDark = getSavedTheme() === 'dark';
    btn.textContent = isDark ? '\u2600\uFE0F Light Mode' : '\uD83C\uDF19 Dark Mode';
  }

  // ─── Inject UI ───────────────────────────────────────────────────────────────

  function injectUI() {
    // Gear button
    const gearBtn = document.createElement('button');
    gearBtn.id = 'settings-gear-btn';
    gearBtn.setAttribute('aria-label', 'Settings');
    gearBtn.textContent = '\u2699\uFE0F';
    gearBtn.style.cssText = [
      'position:fixed', 'top:15px', 'right:15px', 'z-index:9999',
      'width:44px', 'height:44px', 'border-radius:50%',
      'background:rgba(0,0,0,0.45)', 'color:white',
      'border:1px solid rgba(255,255,255,0.35)',
      'font-size:1.25em', 'cursor:pointer',
      'display:flex', 'align-items:center', 'justify-content:center',
      'box-shadow:0 2px 8px rgba(0,0,0,0.4)',
      'transition:all 0.2s ease', // Animate all properties
      'padding:0', 'line-height:1'
    ].join(';');
    gearBtn.addEventListener('pointerover', function () {
      gearBtn.style.background = 'rgba(0,0,0,0.7)';
    });
    gearBtn.addEventListener('pointerout', function () {
      gearBtn.style.background = 'rgba(0,0,0,0.45)';
    });
    gearBtn.addEventListener('click', openSettings);
    document.body.appendChild(gearBtn);

    // Settings overlay (full-screen backdrop)
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.style.cssText = [
      'display:none', 'position:fixed', 'top:0', 'left:0',
      'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.65)',
      'z-index:10000',
      'align-items:center', 'justify-content:center'
    ].join(';');

    const galleryPath = getGalleryPath();

    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.style.cssText = [
      'background:#1a1a2e', 'color:white', 'border-radius:14px',
      'padding:28px 28px 24px', 'min-width:280px', 'max-width:90vw',
      'box-shadow:0 8px 32px rgba(0,0,0,0.6)',
      'display:flex', 'flex-direction:column', 'gap:14px',
      'position:relative', 'box-sizing:border-box'
    ].join(';');

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.id = 'settings-close-btn';
    closeBtn.setAttribute('aria-label', 'Close settings');
    closeBtn.textContent = '\u00D7';
    closeBtn.style.cssText = [
      'position:absolute', 'top:10px', 'right:12px',
      'background:none', 'border:none', 'color:rgba(255,255,255,0.7)',
      'font-size:1.6em', 'cursor:pointer',
      'width:36px', 'height:36px',
      'display:flex', 'align-items:center', 'justify-content:center',
      'border-radius:50%', 'transition:background 0.2s', 'padding:0'
    ].join(';');
    closeBtn.addEventListener('pointerover', function () {
      closeBtn.style.background = 'rgba(255,255,255,0.15)';
    });
    closeBtn.addEventListener('pointerout', function () {
      closeBtn.style.background = 'none';
    });
    closeBtn.addEventListener('click', closeSettings);

    // Heading
    const heading = document.createElement('h2');
    heading.textContent = 'Settings';
    heading.style.cssText = 'margin:0 0 2px 0; font-size:1.25em; font-family:sans-serif;';

    // Token row: count + Get Token button
    const tokenRow = document.createElement('div');
    tokenRow.style.cssText = [
      'display:flex', 'align-items:center', 'justify-content:space-between',
      'background:rgba(255,255,255,0.07)',
      'border:1px solid rgba(255,255,255,0.18)',
      'border-radius:8px', 'padding:10px 14px',
      'font-family:sans-serif', 'font-size:1em', 'min-height:44px'
    ].join(';');

    const tokenLabel = document.createElement('span');
    tokenLabel.innerHTML = '\uD83E\uDE99 Tokens: <strong id="settings-token-count">' + getTokenCount() + '</strong>';

    const getTokenBtn = document.createElement('button');
    getTokenBtn.textContent = '+ 1 \uD83E\uDE99';
    getTokenBtn.style.cssText = [
      'background:#d97706', 'color:#fff',
      'border:1px solid #f59e0b',
      'border-radius:8px', 'padding:7px 14px',
      'font-size:0.85em', 'font-weight:700', 'cursor:pointer',
      'transition:background 0.15s, box-shadow 0.15s', 'font-family:sans-serif',
      'white-space:nowrap', 'min-height:36px',
      'box-shadow:0 0 8px rgba(245,158,11,0.35)',
      'letter-spacing:0.02em'
    ].join(';');
    getTokenBtn.addEventListener('pointerover', function () {
      getTokenBtn.style.background = '#b45309';
      getTokenBtn.style.boxShadow = '0 0 14px rgba(245,158,11,0.6)';
    });
    getTokenBtn.addEventListener('pointerout', function () {
      getTokenBtn.style.background = '#d97706';
      getTokenBtn.style.boxShadow = '0 0 8px rgba(245,158,11,0.35)';
    });
    getTokenBtn.addEventListener('click', function () {
      window.KamekoTokens.add(1);
    });

    tokenRow.appendChild(tokenLabel);
    tokenRow.appendChild(getTokenBtn);

    // Dark mode toggle button
    const darkModeBtn = document.createElement('button');
    darkModeBtn.id = 'settings-dark-mode-btn';
    darkModeBtn.style.cssText = [
      'background:rgba(255,255,255,0.1)', 'color:white',
      'border:1px solid rgba(255,255,255,0.25)',
      'border-radius:8px', 'padding:12px 16px',
      'font-size:1em', 'cursor:pointer',
      'text-align:left', 'transition:background 0.2s',
      'min-height:44px', 'font-family:sans-serif', 'width:100%'
    ].join(';');
    darkModeBtn.addEventListener('pointerover', function () {
      darkModeBtn.style.background = 'rgba(255,255,255,0.2)';
    });
    darkModeBtn.addEventListener('pointerout', function () {
      darkModeBtn.style.background = 'rgba(255,255,255,0.1)';
    });
    darkModeBtn.addEventListener('click', function () {
      setTheme(getSavedTheme() === 'dark' ? 'light' : 'dark');
    });

    // Gallery link
    const galleryLink = document.createElement('a');
    galleryLink.id = 'settings-gallery-link';
    galleryLink.href = galleryPath;
    galleryLink.textContent = '\uD83C\uDFE0 Back to Gallery';
    galleryLink.style.cssText = [
      'display:flex', 'align-items:center',
      'background:rgba(255,255,255,0.1)', 'color:white',
      'border:1px solid rgba(255,255,255,0.25)',
      'border-radius:8px', 'padding:12px 16px',
      'font-size:1em', 'text-decoration:none',
      'transition:background 0.2s',
      'min-height:44px', 'font-family:sans-serif', 'box-sizing:border-box'
    ].join(';');
    galleryLink.addEventListener('pointerover', function () {
      galleryLink.style.background = 'rgba(255,255,255,0.2)';
    });
    galleryLink.addEventListener('pointerout', function () {
      galleryLink.style.background = 'rgba(255,255,255,0.1)';
    });

    panel.appendChild(closeBtn);
    panel.appendChild(heading);
    panel.appendChild(tokenRow);
    panel.appendChild(darkModeBtn);
    panel.appendChild(galleryLink);

    // ─── Developer Tools ──────────────────────────────────────────────────
    const devToolsSeparator = document.createElement('div');
    devToolsSeparator.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.15); margin-top: 14px;';
    panel.appendChild(devToolsSeparator);

    // --- Developer Mode Toggle ---
    const devModeRow = document.createElement('div');
    devModeRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; font-family:sans-serif; min-height:44px; padding: 14px 4px 0;';
    
    const devModeLabel = document.createElement('label');
    devModeLabel.textContent = '\uD83D\uDCBB Developer Mode';
    devModeLabel.setAttribute('for', 'dev-mode-checkbox');
    devModeLabel.style.cursor = 'pointer';

    const devModeToggleSwitch = document.createElement('label');
    devModeToggleSwitch.className = 'switch';
    devModeToggleSwitch.style.cssText = 'position: relative; display: inline-block; width: 48px; height: 28px;';

    const devModeInput = document.createElement('input');
    devModeInput.type = 'checkbox';
    devModeInput.id = 'dev-mode-checkbox';
    devModeInput.style.cssText = 'opacity: 0; width: 0; height: 0;';
    devModeInput.addEventListener('change', (e) => {
        setDevMode(e.target.checked);
    });
    
    const devModeSlider = document.createElement('span');
    devModeSlider.className = 'slider';
    devModeSlider.style.cssText = [
      'position: absolute;', 'cursor: pointer;', 'top: 0;', 'left: 0;', 'right: 0;', 'bottom: 0;',
      'background-color: rgba(255,255,255,0.25);', 'transition: .4s;', 'border-radius: 28px;'
    ].join('');

    const sliderBefore = document.createElement('span');
    sliderBefore.style.cssText = [
      'position: absolute;', 'content: "";', 'height: 20px;', 'width: 20px;', 'left: 4px;', 'bottom: 4px;',
      'background-color: white;', 'transition: .4s;', 'border-radius: 50%;'
    ].join('');
    devModeSlider.appendChild(sliderBefore);

    devModeToggleSwitch.appendChild(devModeInput);
    devModeToggleSwitch.appendChild(devModeSlider);

    devModeRow.appendChild(devModeLabel);
    devModeRow.appendChild(devModeToggleSwitch);

    // --- Clear Data Button (in its own container) ---
    const devToolsContainer = document.createElement('div');
    devToolsContainer.id = 'developer-tools-container';
    devToolsContainer.style.cssText = [
        'display:none', // Initially hidden
        'flex-direction:column', 'gap:10px',
        'padding-top: 14px'
    ].join(';');

    const clearDataBtn = document.createElement('button');
    clearDataBtn.id = 'clear-data-btn';
    clearDataBtn.textContent = '\uD83D\uDDD1\uFE0F Clear All Game Data';
    clearDataBtn.style.cssText = [
        'background:rgba(220, 38, 38, 0.8)', 'color:white',
        'border:1px solid rgba(239, 68, 68, 1)',
        'border-radius:8px', 'padding:12px 16px',
        'font-size:1em', 'cursor:pointer', 'text-align:left',
        'transition:background 0.2s', 'min-height:44px',
        'font-family:sans-serif', 'width:100%'
    ].join(';');
    clearDataBtn.addEventListener('pointerover', function() {
        clearDataBtn.style.background = 'rgba(185, 28, 28, 1)';
    });
    clearDataBtn.addEventListener('pointerout', function() {
        clearDataBtn.style.background = 'rgba(220, 38, 38, 0.8)';
    });
    clearDataBtn.addEventListener('click', clearAllGameData);

    devToolsContainer.appendChild(clearDataBtn);

    // Wrap separator + dev mode toggle + dev tools in a named section so games can insert before it
    const devSection = document.createElement('div');
    devSection.id = 'dev-mode-section';
    devSection.appendChild(devToolsSeparator);
    devSection.appendChild(devModeRow);
    devSection.appendChild(devToolsContainer);
    panel.appendChild(devSection);

    overlay.appendChild(panel);

    // Close on backdrop click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSettings();
    });

    document.body.appendChild(overlay);

    // --- Final UI setup ---
    const finalStyle = document.createElement('style');
    finalStyle.textContent = `
        #settings-gear-btn.dev-mode-active {
            box-shadow: 0 0 12px #2196F3, 0 0 4px #2196F3;
            border-color: #2196F3;
        }
        #dev-mode-checkbox:checked + .slider { background-color: #2196F3; }
        #dev-mode-checkbox:checked + .slider > span { transform: translateX(20px); }
    `;
    document.head.appendChild(finalStyle);
    
    updateDarkModeButton();
    updateDevModeUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }
})();
