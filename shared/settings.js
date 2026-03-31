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
  // --- Theme helpers (run immediately so class is applied before paint) ---

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

  // Apply saved theme immediately (body is available since script is before </body>)
  applyTheme(getSavedTheme());

  // --- Gallery path resolution ---

  function getGalleryPath() {
    const scripts = document.querySelectorAll('script[src*="settings.js"]');
    const script = scripts[scripts.length - 1];
    const depth = parseInt(script && script.dataset.galleryDepth || '0', 10);
    if (depth === 0) return 'index.html';
    return '../'.repeat(depth) + 'index.html';
  }

  // --- Panel open/close ---

  function openSettings() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      updateDarkModeButton();
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

  // --- Inject UI after DOM is ready ---

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
      'transition:background 0.2s ease',
      'padding:0', 'line-height:1'
    ].join(';');
    gearBtn.addEventListener('pointerover', () => {
      gearBtn.style.background = 'rgba(0,0,0,0.7)';
    });
    gearBtn.addEventListener('pointerout', () => {
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
      'padding:28px 28px 24px', 'min-width:270px', 'max-width:90vw',
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
    closeBtn.addEventListener('pointerover', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.15)';
    });
    closeBtn.addEventListener('pointerout', () => {
      closeBtn.style.background = 'none';
    });
    closeBtn.addEventListener('click', closeSettings);

    // Heading
    const heading = document.createElement('h2');
    heading.textContent = 'Settings';
    heading.style.cssText = 'margin:0 0 4px 0; font-size:1.25em; font-family:sans-serif;';

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
    darkModeBtn.addEventListener('pointerover', () => {
      darkModeBtn.style.background = 'rgba(255,255,255,0.2)';
    });
    darkModeBtn.addEventListener('pointerout', () => {
      darkModeBtn.style.background = 'rgba(255,255,255,0.1)';
    });
    darkModeBtn.addEventListener('click', () => {
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
    galleryLink.addEventListener('pointerover', () => {
      galleryLink.style.background = 'rgba(255,255,255,0.2)';
    });
    galleryLink.addEventListener('pointerout', () => {
      galleryLink.style.background = 'rgba(255,255,255,0.1)';
    });

    panel.appendChild(closeBtn);
    panel.appendChild(heading);
    panel.appendChild(darkModeBtn);
    panel.appendChild(galleryLink);
    overlay.appendChild(panel);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSettings();
    });

    document.body.appendChild(overlay);

    updateDarkModeButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }
})();
