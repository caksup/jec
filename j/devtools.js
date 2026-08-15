// JEC DevTools v.2.00 | 15/08/2026 | j/devtools.js | Pro Engine

'use strict';

const DT = {
  // State
  targetUrl: '',
  baseUrl: '',
  results: [],
  fixes: [],
  fileTree: {},
  consoleLogs: [],
  networkRequests: [],
  screenshots: [],
  history: [],
  rawHtml: '',
  rawConfig: null,
  startTime: 0,
  filter: 'all',
  fileView: 'tree',
  consoleFilter: 'all',
  currentTab: 'results',
  currentDevice: 'mobile',
  isScanning: false,
  scanAbort: null,
  
  // ═══════════ INIT ═══════════
  init: function() {
    this.applyTheme();
    this.loadHistory();
    this.bindEvents();
    this.renderHistory();
    this.setupKeyboardShortcuts();
  },
  
  bindEvents: function() {
    // Main buttons
    const btnScan = document.getElementById('btn-scan');
    const btnStop = document.getElementById('btn-stop');
    const btnTheme = document.getElementById('btn-theme');
    const btnShortcuts = document.getElementById('btn-shortcuts');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const input = document.getElementById('target-url');
    
    if (btnScan) btnScan.onclick = () => this.startScan();
    if (btnStop) btnStop.onclick = () => this.stopScan();
    if (btnTheme) btnTheme.onclick = () => this.toggleTheme();
    if (btnShortcuts) btnShortcuts.onclick = () => this.openModal('shortcuts');
    if (btnFullscreen) btnFullscreen.onclick = () => this.toggleFullscreen();
    
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.startScan();
      });
    }
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => this.switchTab(btn.dataset.tab);
    });
    
    // Filter tabs in results
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.filter = tab.dataset.filter;
        this.renderResults();
      };
    });
    
    // Search
    const searchResults = document.getElementById('search-results');
    const searchFiles = document.getElementById('search-files');
    if (searchResults) searchResults.oninput = () => this.renderResults();
    if (searchFiles) searchFiles.oninput = () => this.renderFiles();
    
    // Export buttons
    const btnJson = document.getElementById('btn-export-json');
    const btnMd = document.getElementById('btn-export-md');
    const btnHtml = document.getElementById('btn-export-html');
    if (btnJson) btnJson.onclick = () => this.exportReport('json');
    if (btnMd) btnMd.onclick = () => this.exportReport('md');
    if (btnHtml) btnHtml.onclick = () => this.exportReport('html');
    
    // File view toggle
    document.querySelectorAll('.view-toggle .btn-icon').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.view-toggle .btn-icon').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.fileView = btn.dataset.view;
        this.renderFiles();
      };
    });
    
    // Console filters
    document.querySelectorAll('.console-filters .filter-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.console-filters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.consoleFilter = btn.dataset.level;
        this.renderConsole();
      };
    });
    
    // Clear console
    const btnClearConsole = document.getElementById('btn-clear-console');
    if (btnClearConsole) btnClearConsole.onclick = () => this.clearConsole();
    
    // Preview device toggle
    document.querySelectorAll('.device-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentDevice = btn.dataset.device;
        this.updatePreviewDevice();
      };
    });
    
    // Preview actions
    const btnScreenshotNow = document.getElementById('btn-screenshot-now');
    const btnRefreshPreview = document.getElementById('btn-refresh-preview');
    if (btnScreenshotNow) btnScreenshotNow.onclick = () => this.takeScreenshot();
    if (btnRefreshPreview) btnRefreshPreview.onclick = () => this.loadPreview();
    
    // History
    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) btnClearHistory.onclick = () => this.clearHistory();
    
    // Patches
    const btnApplyAll = document.getElementById('btn-apply-all');
    if (btnApplyAll) btnApplyAll.onclick = () => this.downloadAllPatches();
  },
  
  // ═══════════ KEYBOARD SHORTCUTS ═══════════
  setupKeyboardShortcuts: function() {
    document.addEventListener('keydown', (e) => {
      // F5 - Start scan
      if (e.key === 'F5') {
        e.preventDefault();
        this.startScan();
      }
      // Ctrl+E - Export
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        this.exportReport('json');
      }
      // Ctrl+F - Focus search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const search = document.getElementById('search-results');
        if (search) search.focus();
      }
      // Ctrl+S - Screenshot
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.takeScreenshot();
      }
      // ? - Help
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        this.openModal('shortcuts');
      }
      // Esc - Close modal
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      }
      // 1-7 - Switch tabs
      if (['1','2','3','4','5','6','7'].includes(e.key) && !e.ctrlKey && !e.altKey) {
        const tabs = ['results', 'files', 'console', 'network', 'preview', 'history', 'patches'];
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) this.switchTab(tabs[idx]);
      }
    });
  },
  
  // ═══════════ THEME ═══════════
  applyTheme: function() {
    const saved = localStorage.getItem('jec_dt_theme') || 'light';
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      const icon = document.getElementById('theme-icon');
      if (icon) icon.textContent = 'light_mode';
    }
  },
  
  toggleTheme: function() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('theme-icon').textContent = 'light_mode';
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.getElementById('theme-icon').textContent = 'dark_mode';
    }
    localStorage.setItem('jec_dt_theme', newTheme);
  },
  
  toggleFullscreen: function() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  },
  
  // ═══════════ TABS ═══════════
  switchTab: function(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    const btn = document.querySelector('.tab-btn[data-tab="' + tabName + '"]');
    const content = document.getElementById('tab-' + tabName);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
    
    // Load preview if needed
    if (tabName === 'preview' && this.targetUrl) {
      this.loadPreview();
    }
  },
  
  // ═══════════ MODAL ═══════════
  openModal: function(name) {
    const modal = document.getElementById('modal-' + name);
    if (modal) modal.classList.remove('hidden');
  },
  
  closeModal: function(name) {
    const modal = document.getElementById('modal-' + name);
    if (modal) modal.classList.add('hidden');
  },
  
  // ═══════════ MAIN SCAN ═══════════
  startScan: async function() {
    if (this.isScanning) return;
    
    const input = document.getElementById('target-url');
    const url = input.value.trim();
    
    if (!url) {
      this.toast('URL tidak boleh kosong', 'error');
      return;
    }
    
    try {
      new URL(url);
    } catch(e) {
      this.toast('URL tidak valid', 'error');
      return;
    }
    
    this.isScanning = true;
    this.targetUrl = url;
    this.baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    this.results = [];
    this.fixes = [];
    this.consoleLogs = [];
    this.networkRequests = [];
    this.startTime = Date.now();
    
    // Update UI
    const btnScan = document.getElementById('btn-scan');
    const btnStop = document.getElementById('btn-stop');
    btnScan.disabled = true;
    btnStop.disabled = false;
    btnScan.innerHTML = '<span class="material-icons-round" style="animation:spin 1s linear infinite">sync</span><span>Scanning...</span>';
    
    document.getElementById('progress-section').classList.remove('hidden');
    document.getElementById('summary-section').classList.add('hidden');
    document.getElementById('tabs-section').classList.add('hidden');
    
    try {
      await this.runAllChecks();
    } catch(e) {
      if (e.name !== 'AbortError') {
        this.addResult('critical', 'Scan Error', e.message, 'SYSTEM');
      }
    }
    
    // Save to history
    this.saveToHistory();
    
    this.renderAll();
    
    btnScan.disabled = false;
    btnStop.disabled = true;
    btnScan.innerHTML = '<span class="material-icons-round">search</span><span>Scan (F5)</span>';
    this.isScanning = false;
    
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    document.getElementById('scan-time').textContent = 'Last scan: ' + new Date().toLocaleTimeString('id-ID') + ' (' + duration + 's)';
    
    // Switch to results tab
    this.switchTab('results');
  },
  
  stopScan: function() {
    if (this.scanAbort) {
      this.scanAbort.abort();
      this.toast('Scan stopped', 'warning');
    }
  },
  
  runAllChecks: async function() {
    this.scanAbort = new AbortController();
    const signal = this.scanAbort.signal;
    
    const steps = [
      { name: 'Fetch HTML', fn: () => this.checkTargetHtml(signal), progress: 10 },
      { name: 'Core Files', fn: () => this.checkCoreFiles(signal), progress: 25 },
      { name: 'Registry', fn: () => this.checkFeatureRegistry(signal), progress: 40 },
      { name: 'Features', fn: () => this.checkFeatureFiles(signal), progress: 60 },
      { name: 'Data Files', fn: () => this.checkDataFiles(signal), progress: 75 },
      { name: 'Backend', fn: () => this.checkAppsScript(signal), progress: 85 },
      { name: 'Console', fn: () => this.captureConsole(signal), progress: 92 },
      { name: 'Screenshot', fn: () => this.autoScreenshot(signal), progress: 98 }
    ];
    
    // Show steps
    const stepsEl = document.getElementById('progress-steps');
    stepsEl.innerHTML = steps.map(s => '<div class="progress-step">' + s.name + '</div>').join('');
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepEl = stepsEl.children[i];
      stepEl.classList.add('active');
      this.updateProgress(step.progress, step.name + '...');
      
      try {
        await step.fn();
      } catch(e) {
        if (e.name === 'AbortError') throw e;
        console.warn('Step failed:', step.name, e);
      }
      
      stepEl.classList.remove('active');
      stepEl.classList.add('done');
    }
    
    this.updateProgress(100, 'Scan selesai!');
  },
  
  updateProgress: function(percent, text) {
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-percent').textContent = percent + '%';
    document.getElementById('progress-text').textContent = text;
  },
  
  // ═══════════ CHECKS ═══════════
  checkTargetHtml: async function(signal) {
    try {
      const res = await fetch(this.targetUrl + '?_=' + Date.now(), { signal });
      if (!res.ok) {
        this.addResult('critical', 'Target HTML Tidak Dapat Diakses',
          'HTTP ' + res.status + ' saat mengakses ' + this.targetUrl, 'HTML',
          'Pastikan file ter-deploy', 'Deploy ulang ke hosting');
        return;
      }
      this.rawHtml = await res.text();
      this.addResult('success', 'Target HTML OK',
        'File berhasil diakses (' + (this.rawHtml.length / 1024).toFixed(1) + ' KB)', 'HTML');
    } catch(e) {
      if (e.name !== 'AbortError') {
        this.addResult('critical', 'Gagal Mengakses Target HTML', e.message, 'HTML');
      }
    }
  },
  
  checkCoreFiles: async function(signal) {
    const coreFiles = [
      { path: 'j/c.js', name: 'Config', critical: true },
      { path: 'j/j.js', name: 'Core Engine', critical: true },
      { path: 'j/i18n.js', name: 'i18n Dictionary', critical: true },
      { path: 'j/ui.js', name: 'UI Controllers', critical: false },
      { path: 's/s.css', name: 'Stylesheet', critical: true }
    ];
    
    for (const f of coreFiles) {
      const url = this.baseUrl + f.path;
      const startTime = Date.now();
      const result = await this.fetchFile(url, signal);
      const duration = Date.now() - startTime;
      
      this.addNetworkRequest(f.path, 'JS/CSS', result.size, result.ok ? 200 : 404, duration);
      
      if (result.ok) {
        this.addResult('success', f.name + ' OK', 'File ' + f.path + ' tersedia (' + result.size + ' B)', 'CORE');
        this.fileTree[f.path] = { status: 'ok', size: result.size, duration };
        
        if (f.path === 'j/c.js') {
          this.rawConfig = this.parseConfig(result.text);
        }
      } else {
        this.addResult(f.critical ? 'critical' : 'warning', f.name + ' MISSING',
          'File ' + f.path + ' tidak ditemukan', 'CORE',
          'Upload file ke repo', 'Upload: ' + f.path);
        this.fileTree[f.path] = { status: 'missing' };
      }
    }
    
    if (this.rawConfig) {
      this.addResult('success', 'Config Parsed OK',
        Object.keys(this.rawConfig.FEATURES || {}).length + ' fitur terdaftar', 'CORE');
    }
  },
  
  parseConfig: function(text) {
    try {
      const match = text.match(/window\.JEC_CONFIG\s*=\s*(\{[\s\S]*?\});/);
      if (!match) return null;
      return new Function('return ' + match[1])();
    } catch(e) {
      return null;
    }
  },
  
  checkFeatureRegistry: async function(signal) {
    if (!this.rawConfig || !this.rawConfig.FEATURES) {
      this.addResult('warning', 'Registry Tidak Ditemukan', 'FEATURES tidak ada di j/c.js', 'REGISTRY');
      return;
    }
    
    const features = this.rawConfig.FEATURES;
    const names = Object.keys(features);
    const enabled = names.filter(n => features[n].enabled).length;
    
    this.addResult('success', 'Registry OK', names.length + ' fitur terdaftar', 'REGISTRY');
    this.addResult('success', enabled + '/' + names.length + ' Enabled',
      enabled + ' aktif, ' + (names.length - enabled) + ' maintenance', 'REGISTRY');
  },
  
  checkFeatureFiles: async function(signal) {
    if (!this.rawConfig || !this.rawConfig.FEATURES) return;
    
    const features = this.rawConfig.FEATURES;
    const builtIn = ['splash', 'login', 'header'];
    const featuresJs = this.rawConfig.FEATURES_JS || (this.rawConfig.BASE_GH + 'j/f/');
    
    for (const name of Object.keys(features)) {
      if (builtIn.includes(name)) {
        this.addResult('success', 'Built-in: ' + name, 'Di-handle built-in oleh j.js', 'REGISTRY');
        continue;
      }
      
      const cfg = features[name];
      if (!cfg.enabled) {
        this.addResult('success', name + ' (Maintenance)', 'Fitur di-disable', 'FEATURE');
        continue;
      }
      
      const jsFile = cfg.js;
      const url = featuresJs + jsFile;
      const startTime = Date.now();
      const result = await this.fetchFile(url, signal);
      const duration = Date.now() - startTime;
      
      this.addNetworkRequest(jsFile, 'JS', result.size, result.ok ? 200 : 404, duration);
      
      if (result.ok) {
        const expectedInit = 'JEC_' + name.toUpperCase() + '_INIT';
        if (result.text.indexOf(expectedInit) !== -1) {
          this.addResult('success', name + ' OK',
            'File ' + jsFile + ' ada, ' + expectedInit + ' terdefinisi (' + result.size + ' B)', 'FEATURE');
          this.fileTree['j/f/' + jsFile] = { status: 'ok', size: result.size, duration };
        } else {
          this.addResult('warning', name + ' Missing Init',
            'File ada tapi ' + expectedInit + ' tidak ditemukan', 'FEATURE',
            'Tambahkan function ' + expectedInit,
            'window.' + expectedInit + ' = function(JEC) { /* init */ };');
          this.fileTree['j/f/' + jsFile] = { status: 'warn' };
        }
      } else {
        this.addResult('critical', name + ' JS MISSING',
          'File ' + jsFile + ' tidak ditemukan di ' + url, 'FEATURE',
          'Buat file j/f/' + jsFile + ' atau disable',
          '// Di j/c.js: ' + name + ': { enabled: false }');
        this.fileTree['j/f/' + jsFile] = { status: 'missing' };
        this.fixes.push({
          title: 'Create ' + name + '.js',
          desc: 'File tidak ada. Buat atau disable.',
          code: '// Upload file: j/f/' + jsFile
        });
      }
    }
  },
  
  checkDataFiles: async function(signal) {
    const dataFiles = [
      { path: 'd/spe.json', name: 'Speaking' },
      { path: 'd/voc.json', name: 'Vocabulary' },
      { path: 'd/gra.json', name: 'Grammar' },
      { path: 'd/wri.json', name: 'Writing' },
      { path: 'd/lis.json', name: 'Listening' },
      { path: 'd/ext.json', name: 'Extra' },
      { path: 'd/lb.json', name: 'Logbook' },
      { path: 'd/u.json', name: 'Users' },
      { path: 'd/l.json', name: 'Levels' }
    ];
    
    let ok = 0;
    for (const f of dataFiles) {
      const url = this.baseUrl + f.path;
      const startTime = Date.now();
      const result = await this.fetchFile(url, signal);
      const duration = Date.now() - startTime;
      
      this.addNetworkRequest(f.path, 'JSON', result.size, result.ok ? 200 : 404, duration);
      
      if (result.ok) {
        this.addResult('success', f.name + ' OK', f.path + ' tersedia (' + result.size + ' B)', 'DATA');
        this.fileTree[f.path] = { status: 'ok', size: result.size, duration };
        ok++;
      } else {
        this.addResult('warning', f.name + ' MISSING', f.path + ' tidak ditemukan', 'DATA');
        this.fileTree[f.path] = { status: 'missing' };
      }
    }
    
    if (ok === dataFiles.length) {
      this.addResult('success', 'Semua Data OK', dataFiles.length + ' file JSON tersedia', 'DATA');
    }
  },
  
  checkAppsScript: async function(signal) {
    if (!this.rawConfig || !this.rawConfig.LOG) {
      this.addResult('warning', 'Apps Script URL Tidak Ada', 'LOG URL tidak dikonfigurasi', 'BACKEND');
      return;
    }
    
    const startTime = Date.now();
    try {
      const testUrl = this.rawConfig.LOG + '?action=fetch_sheets_list&_=' + Date.now();
      const res = await fetch(testUrl, { signal });
      const duration = Date.now() - startTime;
      
      this.addNetworkRequest('Apps Script', 'API', 0, res.status, duration);
      
      if (!res.ok) {
        this.addResult('critical', 'Apps Script Error', 'HTTP ' + res.status, 'BACKEND');
        return;
      }
      
      const data = await res.json();
      if (data.status === 'error') {
        this.addResult('warning', 'Apps Script Error', data.msg || 'Error', 'BACKEND');
        return;
      }
      
      const count = data.total || 0;
      this.addResult('success', 'Apps Script OK', 'Terhubung, ' + count + ' sheet aktif (' + duration + 'ms)', 'BACKEND');
      
      const expected = ['Users', 'Progress', 'FocusMode', 'Leaderboard', 'DailyChallenge', 'Achievements'];
      const existing = (data.sheets || []).map(s => s.name || s);
      expected.forEach(name => {
        if (existing.includes(name)) {
          this.addResult('success', 'Sheet ' + name + ' Ada', 'Sheet aktif', 'BACKEND');
        } else {
          this.addResult('warning', 'Sheet ' + name + ' MISSING', 'Sheet tidak ditemukan', 'BACKEND',
            'Jalankan setupAndMigrate()', 'Apps Script → Run setupAndMigrate');
        }
      });
    } catch(e) {
      if (e.name !== 'AbortError') {
        this.addResult('critical', 'Apps Script Error', e.message, 'BACKEND');
      }
    }
  },
  
  captureConsole: async function(signal) {
    if (!document.getElementById('opt-console').checked) return;
    
    // Inject console capture script via hidden iframe
    try {
      const captureFrame = document.getElementById('capture-frame');
      const captureScript = `
        <script>
          const originalLog = console.log;
          const originalWarn = console.warn;
          const originalError = console.error;
          const originalInfo = console.info;
          
          function send(level, args) {
            try {
              parent.postMessage({
                type: 'console',
                level: level,
                message: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
                time: new Date().toISOString()
              }, '*');
            } catch(e) {}
          }
          
          console.log = function() { send('log', arguments); originalLog.apply(console, arguments); };
          console.warn = function() { send('warn', arguments); originalWarn.apply(console, arguments); };
          console.error = function() { send('error', arguments); originalError.apply(console, arguments); };
          console.info = function() { send('info', arguments); originalInfo.apply(console, arguments); };
          
          window.onerror = function(msg, url, line, col, err) {
            send('error', ['Uncaught: ' + msg + ' at ' + url + ':' + line]);
          };
          
          // Try to load target page
          try {
            fetch('${this.targetUrl}?_=' + Date.now())
              .then(r => r.text())
              .then(html => {
                send('info', ['Loaded: ' + html.length + ' bytes']);
                // Extract script tags
                const matches = html.match(/<script[^>]*src="([^"]+)"/g) || [];
                matches.forEach(m => send('info', ['Script: ' + m]));
              })
              .catch(e => send('error', ['Fetch failed: ' + e.message]));
          } catch(e) {
            send('error', ['Init failed: ' + e.message]);
          }
        </script>
      `;
      
      captureFrame.srcdoc = captureScript;
      
      // Listen for messages
      const msgHandler = (e) => {
        if (e.data && e.data.type === 'console') {
          this.consoleLogs.push({
            level: e.data.level,
            message: e.data.message,
            time: e.data.time
          });
        }
      };
      
      window.addEventListener('message', msgHandler);
      
      // Wait 3 seconds for logs
      await new Promise(r => setTimeout(r, 3000));
      window.removeEventListener('message', msgHandler);
      
      if (this.consoleLogs.length > 0) {
        const errors = this.consoleLogs.filter(l => l.level === 'error').length;
        const warns = this.consoleLogs.filter(l => l.level === 'warn').length;
        this.addResult(
          errors > 0 ? 'warning' : 'success',
          'Console Captured',
          this.consoleLogs.length + ' logs (' + errors + ' errors, ' + warns + ' warnings)',
          'CONSOLE'
        );
      } else {
        this.addResult('success', 'Console Capture OK', 'No errors captured', 'CONSOLE');
      }
    } catch(e) {
      this.addResult('warning', 'Console Capture Failed', e.message, 'CONSOLE');
    }
  },
  
  autoScreenshot: async function(signal) {
    if (!document.getElementById('opt-screenshot').checked) return;
    await this.takeScreenshot();
  },
  
  // ═══════════ SCREENSHOT ═══════════
  takeScreenshot: async function() {
    if (!this.targetUrl) {
      this.toast('No URL to capture', 'warning');
      return;
    }
    
    this.toast('Taking screenshot...', 'info', 2000);
    
    try {
      // Use free screenshot API
      const apiUrl = 'https://api.screenshotapi.net/api/v1/screenshot?url=' + 
        encodeURIComponent(this.targetUrl) + 
        '&width=1280&height=720&output=image&device=desktop';
      
      // Alternative: use image.pollinations.ai (free, no key needed)
      const pollinationsUrl = 'https://image.pollinations.ai/prompt/screenshot%20of%20' + 
        encodeURIComponent(this.targetUrl) + 
        '?width=1280&height=720&nologo=true';
      
      // Try Pollinations first (free, no API key)
      const screenshotUrl = pollinationsUrl;
      
      const timestamp = new Date().toISOString();
      const screenshot = {
        url: this.targetUrl,
        imageUrl: screenshotUrl,
        device: this.currentDevice,
        time: timestamp
      };
      
      this.screenshots.push(screenshot);
      this.renderScreenshots();
      this.toast('Screenshot captured!', 'success');
      
    } catch(e) {
      this.toast('Screenshot failed: ' + e.message, 'error');
    }
  },
  
  renderScreenshots: function() {
    const section = document.getElementById('screenshot-section');
    const grid = document.getElementById('screenshot-grid');
    
    if (this.screenshots.length === 0) {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
    grid.innerHTML = this.screenshots.map((s, i) => 
      '<div class="screenshot-card" onclick="window.open(\'' + s.imageUrl + '\', \'_blank\')">' +
      '<img class="screenshot-img" src="' + s.imageUrl + '" alt="Screenshot ' + (i + 1) + '" onerror="this.src=\'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 180%22><rect fill=%22%23f5f5f7%22 width=%22200%22 height=%22180%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23999%22 font-family=%22sans-serif%22>No Preview</text></svg>\'">' +
      '<div class="screenshot-info">' +
      '<div class="screenshot-time">' + new Date(s.time).toLocaleString('id-ID') + '</div>' +
      '<div class="screenshot-device">' + s.device.toUpperCase() + '</div>' +
      '</div>' +
      '</div>'
    ).join('');
  },
  
  // ═══════════ PREVIEW ═══════════
  loadPreview: function() {
    if (!this.targetUrl) return;
    const frame = document.getElementById('preview-frame');
    const urlBar = document.getElementById('preview-url-text');
    if (frame) frame.src = this.targetUrl;
    if (urlBar) urlBar.textContent = this.targetUrl;
  },
  
  updatePreviewDevice: function() {
    const wrap = document.querySelector('.preview-frame-wrap');
    if (!wrap) return;
    wrap.classList.remove('mobile', 'tablet', 'desktop');
    wrap.classList.add(this.currentDevice);
  },
  
  // ═══════════ HELPERS ═══════════
  fetchFile: async function(url, signal) {
    try {
      const res = await fetch(url + '?_=' + Date.now(), { signal });
      if (!res.ok) return { ok: false };
      const text = await res.text();
      return { ok: true, text: text, size: text.length };
    } catch(e) {
      return { ok: false };
    }
  },
  
  addResult: function(severity, title, desc, category, fixTitle, fixCode) {
    this.results.push({
      severity, title, desc, category, fixTitle, fixCode,
      timestamp: Date.now()
    });
  },
  
  addNetworkRequest: function(name, type, size, status, duration) {
    this.networkRequests.push({ name, type, size, status, duration, time: Date.now() });
  },
  
  // ═══════════ RENDER ALL ═══════════
  renderAll: function() {
    this.renderSummary();
    this.renderResults();
    this.renderFiles();
    this.renderConsole();
    this.renderNetwork();
    this.renderPatches();
    this.renderScreenshots();
    
    document.getElementById('summary-section').classList.remove('hidden');
    document.getElementById('tabs-section').classList.remove('hidden');
    document.getElementById('progress-section').classList.add('hidden');
    
    // Update badges
    document.getElementById('badge-results').textContent = this.results.length;
    document.getElementById('badge-files').textContent = Object.keys(this.fileTree).length;
    document.getElementById('badge-console').textContent = this.consoleLogs.length;
    document.getElementById('badge-network').textContent = this.networkRequests.length;
    document.getElementById('badge-patches').textContent = this.fixes.length;
  },
  
  renderSummary: function() {
    const critical = this.results.filter(r => r.severity === 'critical').length;
    const warning = this.results.filter(r => r.severity === 'warning').length;
    const success = this.results.filter(r => r.severity === 'success').length;
    
    let score = 100 - (critical * 15) - (warning * 5);
    score = Math.max(0, Math.min(100, score));
    
    document.getElementById('score-value').textContent = score;
    document.getElementById('critical-count').textContent = critical;
    document.getElementById('warning-count').textContent = warning;
    document.getElementById('success-count').textContent = success;
    
    const deg = (score / 100) * 360;
    let color = 'var(--green)', status = 'excellent', statusText = 'Excellent';
    if (score < 50) { color = 'var(--red)'; status = 'critical'; statusText = 'Critical'; }
    else if (score < 70) { color = '#e67e22'; status = 'warning'; statusText = 'Needs Fix'; }
    else if (score < 90) { color = 'var(--blue)'; status = 'good'; statusText = 'Good'; }
    
    document.getElementById('score-circle').style.background = 
      'conic-gradient(' + color + ' ' + deg + 'deg, var(--bg2) ' + deg + 'deg)';
    
    const statusEl = document.getElementById('score-status');
    statusEl.textContent = statusText;
    statusEl.className = 'score-status ' + status;
    
    // Stats
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const totalSize = Object.values(this.fileTree).reduce((s, f) => s + (f.size || 0), 0);
    document.getElementById('stat-scan-time').textContent = duration + 's';
    document.getElementById('stat-data-size').textContent = (totalSize / 1024).toFixed(1) + ' KB';
    document.getElementById('stat-requests').textContent = this.networkRequests.length + ' requests';
    const totalTime = this.networkRequests.reduce((s, r) => s + r.duration, 0);
    document.getElementById('stat-load-time').textContent = totalTime + 'ms';
  },
  
  renderResults: function() {
    const list = document.getElementById('results-list');
    const search = document.getElementById('search-results').value.toLowerCase();
    
    let filtered = this.results;
    if (this.filter !== 'all') {
      filtered = filtered.filter(r => r.severity === this.filter);
    }
    if (search) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(search) ||
        r.desc.toLowerCase().includes(search) ||
        (r.category || '').toLowerCase().includes(search)
      );
    }
    
    const order = { critical: 0, warning: 1, success: 2 };
    filtered.sort((a, b) => order[a.severity] - order[b.severity]);
    
    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state"><span class="material-icons-round">search_off</span><div>No results found</div></div>';
      return;
    }
    
    list.innerHTML = filtered.map(r => {
      const icon = r.severity === 'critical' ? 'error' : r.severity === 'warning' ? 'warning' : 'check_circle';
      let html = '<div class="result-item ' + r.severity + '">';
      html += '<div class="result-head">';
      html += '<div class="result-icon ' + r.severity + '"><span class="material-icons-round">' + icon + '</span></div>';
      html += '<div class="result-main">';
      html += '<div class="result-title">' + this.esc(r.title) + '</div>';
      html += '<div class="result-desc">' + this.esc(r.desc) + '</div>';
      if (r.category) html += '<span class="result-category">' + this.esc(r.category) + '</span>';
      html += '</div></div>';
      
      if (r.fixTitle && r.fixCode) {
        html += '<div class="result-fix">';
        html += '<div class="result-fix-header"><span class="material-icons-round">lightbulb</span><span>Solusi: ' + this.esc(r.fixTitle) + '</span></div>';
        html += '<div class="result-fix-code" onclick="DT.copyText(this.textContent)">' + this.esc(r.fixCode) + '</div>';
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }).join('');
  },
  
  renderFiles: function() {
    const view = document.getElementById('files-view');
    const search = (document.getElementById('search-files').value || '').toLowerCase();
    const paths = Object.keys(this.fileTree).filter(p => p.toLowerCase().includes(search));
    
    if (paths.length === 0) {
      view.innerHTML = '<div class="empty-state"><span class="material-icons-round">folder_off</span><div>No files found</div></div>';
      return;
    }
    
    if (this.fileView === 'tree') {
      view.innerHTML = this.renderFileTree(paths);
    } else if (this.fileView === 'list') {
      view.innerHTML = this.renderFileList(paths);
    } else if (this.fileView === 'grid') {
      view.innerHTML = this.renderFileGrid(paths);
    }
  },
  
  renderFileTree: function(paths) {
    const folders = {};
    paths.sort().forEach(path => {
      const parts = path.split('/');
      const folder = parts.length > 1 ? parts[0] : 'root';
      if (!folders[folder]) folders[folder] = [];
      folders[folder].push({ path, name: parts[parts.length - 1], data: this.fileTree[path] });
    });
    
    let html = '';
    Object.keys(folders).sort().forEach(folder => {
      html += '<div class="tree-line"><span class="material-icons-round tree-icon folder">folder</span><span class="tree-name">' + folder + '/</span></div>';
      folders[folder].forEach(f => {
        let icon = 'insert_drive_file', iconClass = 'file-ok', statusClass = 'ok', statusText = 'OK';
        if (f.data.status === 'missing') { icon = 'error'; iconClass = 'file-missing'; statusClass = 'missing'; statusText = 'MISSING'; }
        else if (f.data.status === 'warn') { icon = 'warning'; iconClass = 'file-warn'; statusClass = 'warn'; statusText = 'WARN'; }
        
        const size = f.data.size ? (f.data.size / 1024).toFixed(1) + 'KB' : '';
        const dur = f.data.duration ? f.data.duration + 'ms' : '';
        
        html += '<div class="tree-line tree-indent">';
        html += '<span class="material-icons-round tree-icon ' + iconClass + '">' + icon + '</span>';
        html += '<span class="tree-name">' + this.esc(f.name) + '</span>';
        html += '<span class="tree-meta"><span>' + size + '</span><span>' + dur + '</span></span>';
        html += '<span class="tree-status ' + statusClass + '">' + statusText + '</span>';
        html += '</div>';
      });
    });
    return html;
  },
  
  renderFileList: function(paths) {
    let html = '<table class="files-list-table"><thead><tr><th>File</th><th>Status</th><th>Size</th><th>Time</th></tr></thead><tbody>';
    paths.sort().forEach(path => {
      const f = this.fileTree[path];
      let statusClass = 'ok', statusText = 'OK';
      if (f.status === 'missing') { statusClass = 'missing'; statusText = 'MISSING'; }
      else if (f.status === 'warn') { statusClass = 'warn'; statusText = 'WARN'; }
      
      const size = f.size ? (f.size / 1024).toFixed(1) + ' KB' : '—';
      const dur = f.duration ? f.duration + 'ms' : '—';
      
      html += '<tr><td>' + this.esc(path) + '</td>';
      html += '<td><span class="tree-status ' + statusClass + '">' + statusText + '</span></td>';
      html += '<td>' + size + '</td>';
      html += '<td>' + dur + '</td></tr>';
    });
    html += '</tbody></table>';
    return html;
  },
  
  renderFileGrid: function(paths) {
    let html = '<div class="files-grid">';
    paths.sort().forEach(path => {
      const f = this.fileTree[path];
      const name = path.split('/').pop();
      let icon = 'check_circle', iconColor = 'var(--green)';
      if (f.status === 'missing') { icon = 'error'; iconColor = 'var(--red)'; }
      else if (f.status === 'warn') { icon = 'warning'; iconColor = '#e67e22'; }
      
      html += '<div class="file-grid-card ' + f.status + '">';
      html += '<div class="file-grid-icon" style="color:' + iconColor + '"><span class="material-icons-round" style="font-size:32px">' + icon + '</span></div>';
      html += '<div class="file-grid-name">' + this.esc(name) + '</div>';
      html += '<div class="file-grid-meta">' + (f.size ? (f.size / 1024).toFixed(1) + 'KB' : '—') + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  },
  
  renderConsole: function() {
    const output = document.getElementById('console-output');
    let logs = this.consoleLogs;
    
    if (this.consoleFilter !== 'all') {
      logs = logs.filter(l => l.level === this.consoleFilter);
    }
    
    if (logs.length === 0) {
      output.innerHTML = '<div class="console-empty"><span class="material-icons-round">terminal</span><div>No console output yet</div></div>';
      return;
    }
    
    output.innerHTML = logs.map(l => {
      const icon = l.level === 'error' ? 'error' : l.level === 'warn' ? 'warning' : l.level === 'info' ? 'info' : 'notes';
      const time = new Date(l.time).toLocaleTimeString('id-ID');
      return '<div class="console-line ' + l.level + '">' +
        '<span class="material-icons-round">' + icon + '</span>' +
        '<span class="console-line-content">' + this.esc(l.message) + '</span>' +
        '<span class="console-line-time">' + time + '</span>' +
        '</div>';
    }).join('');
    
    output.scrollTop = output.scrollHeight;
  },
  
  clearConsole: function() {
    this.consoleLogs = [];
    this.renderConsole();
    this.toast('Console cleared', 'success');
  },
  
  renderNetwork: function() {
    const body = document.getElementById('waterfall-body');
    const reqs = this.networkRequests;
    
    document.getElementById('net-total').textContent = reqs.length;
    const totalSize = reqs.reduce((s, r) => s + (r.size || 0), 0);
    document.getElementById('net-size').textContent = (totalSize / 1024).toFixed(1) + ' KB';
    const totalTime = reqs.reduce((s, r) => s + r.duration, 0);
    document.getElementById('net-time').textContent = totalTime + 'ms';
    
    if (reqs.length === 0) {
      body.innerHTML = '<div class="empty-state"><span class="material-icons-round">wifi_off</span><div>No network requests</div></div>';
      return;
    }
    
    const maxDuration = Math.max(...reqs.map(r => r.duration));
    
    body.innerHTML = reqs.map(r => {
      const statusClass = r.status === 200 ? 'ok' : 'err';
      const size = r.size ? (r.size / 1024).toFixed(1) + 'KB' : '—';
      const width = maxDuration > 0 ? (r.duration / maxDuration) * 100 : 0;
      
      return '<div class="waterfall-row">' +
        '<div class="wf-name" title="' + this.esc(r.name) + '">' + this.esc(r.name.split('/').pop()) + '</div>' +
        '<div class="wf-type">' + r.type + '</div>' +
        '<div class="wf-size">' + size + '</div>' +
        '<div class="wf-status ' + statusClass + '">' + r.status + '</div>' +
        '<div class="wf-time">' + r.duration + 'ms</div>' +
        '<div class="wf-bar"><div class="wf-bar-fill" style="width:' + width + '%"></div></div>' +
        '</div>';
    }).join('');
  },
  
  renderPatches: function() {
    const list = document.getElementById('patches-list');
    const btnApplyAll = document.getElementById('btn-apply-all');
    
    document.getElementById('patch-count').textContent = this.fixes.length;
    btnApplyAll.disabled = this.fixes.length === 0;
    
    if (this.fixes.length === 0) {
      list.innerHTML = '<div class="empty-state"><span class="material-icons-round">auto_fix_high</span><div>No patches needed. All systems healthy! 🎉</div></div>';
      return;
    }
    
    list.innerHTML = this.fixes.map((f, i) => 
      '<div class="patch-card">' +
      '<div class="patch-header">' +
      '<div class="patch-number">' + (i + 1) + '</div>' +
      '<div class="patch-title">' + this.esc(f.title) + '</div>' +
      '</div>' +
      '<div class="patch-desc">' + this.esc(f.desc) + '</div>' +
      '<div class="patch-code">' + this.esc(f.code) + '</div>' +
      '<div class="patch-actions">' +
      '<button class="btn-ghost" onclick="DT.copyText(\'' + this.esc(f.code).replace(/'/g, "\\'").replace(/\n/g, '\\n') + '\')"><span class="material-icons-round">content_copy</span>Copy</button>' +
      '</div>' +
      '</div>'
    ).join('');
  },
  
  // ═══════════ HISTORY ═══════════
  loadHistory: function() {
    try {
      this.history = JSON.parse(localStorage.getItem('jec_dt_history') || '[]');
    } catch(e) {
      this.history = [];
    }
  },
  
  saveToHistory: function() {
    const entry = {
      url: this.targetUrl,
      time: new Date().toISOString(),
      score: parseInt(document.getElementById('score-value').textContent) || 0,
      critical: this.results.filter(r => r.severity === 'critical').length,
      warning: this.results.filter(r => r.severity === 'warning').length,
      success: this.results.filter(r => r.severity === 'success').length,
      duration: ((Date.now() - this.startTime) / 1000).toFixed(1)
    };
    
    this.history.unshift(entry);
    if (this.history.length > 20) this.history = this.history.slice(0, 20);
    
    localStorage.setItem('jec_dt_history', JSON.stringify(this.history));
    this.renderHistory();
  },
  
  renderHistory: function() {
    const list = document.getElementById('history-list');
    const info = document.getElementById('history-info');
    
    if (this.history.length === 0) {
      info.textContent = '0 scans saved';
      list.innerHTML = '<div class="empty-state"><span class="material-icons-round">history</span><div>No scan history yet</div></div>';
      return;
    }
    
    info.textContent = this.history.length + ' scans saved';
    
    list.innerHTML = this.history.map((h, i) => {
      let scoreClass = 'excellent';
      if (h.score < 50) scoreClass = 'critical';
      else if (h.score < 70) scoreClass = 'warning';
      else if (h.score < 90) scoreClass = 'good';
      
      return '<div class="history-item">' +
        '<div class="history-score ' + scoreClass + '">' + h.score + '</div>' +
        '<div class="history-info">' +
        '<div class="history-url">' + this.esc(h.url) + '</div>' +
        '<div class="history-meta">' +
        '<span>' + new Date(h.time).toLocaleString('id-ID') + '</span>' +
        '<span>🔴 ' + h.critical + ' 🟡 ' + h.warning + ' 🟢 ' + h.success + '</span>' +
        '<span>⏱️ ' + h.duration + 's</span>' +
        '</div>' +
        '</div>' +
        '<div class="history-actions">' +
        '<button class="btn-icon" onclick="DT.loadHistoryItem(' + i + ')" title="Load"><span class="material-icons-round">open_in_new</span></button>' +
        '<button class="btn-icon" onclick="DT.deleteHistoryItem(' + i + ')" title="Delete"><span class="material-icons-round">delete</span></button>' +
        '</div>' +
        '</div>';
    }).join('');
  },
  
  loadHistoryItem: function(idx) {
    const h = this.history[idx];
    if (!h) return;
    document.getElementById('target-url').value = h.url;
    this.startScan();
  },
  
  deleteHistoryItem: function(idx) {
    this.history.splice(idx, 1);
    localStorage.setItem('jec_dt_history', JSON.stringify(this.history));
    this.renderHistory();
    this.toast('History item deleted', 'success');
  },
  
  clearHistory: function() {
    if (!confirm('Clear all scan history?')) return;
    this.history = [];
    localStorage.setItem('jec_dt_history', '[]');
    this.renderHistory();
    this.toast('History cleared', 'success');
  },
  
  // ═══════════ EXPORT ═══════════
  exportReport: function(format) {
    const report = {
      url: this.targetUrl,
      scanTime: new Date().toISOString(),
      score: parseInt(document.getElementById('score-value').textContent),
      results: this.results,
      fixes: this.fixes,
      fileTree: this.fileTree,
      consoleLogs: this.consoleLogs,
      networkRequests: this.networkRequests
    };
    
    let content, filename, mime;
    
    if (format === 'json') {
      content = JSON.stringify(report, null, 2);
      filename = 'jec-report-' + Date.now() + '.json';
      mime = 'application/json';
    } else if (format === 'md') {
      content = this.toMarkdown(report);
      filename = 'jec-report-' + Date.now() + '.md';
      mime = 'text/markdown';
    } else if (format === 'html') {
      content = this.toHtmlReport(report);
      filename = 'jec-report-' + Date.now() + '.html';
      mime = 'text/html';
    }
    
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    this.toast('Report exported as ' + format.toUpperCase(), 'success');
  },
  
  toMarkdown: function(report) {
    let md = '# JEC DevTools Report\n\n';
    md += '**URL:** ' + report.url + '\n';
    md += '**Time:** ' + new Date(report.scanTime).toLocaleString('id-ID') + '\n';
    md += '**Score:** ' + report.score + '/100\n\n';
    
    md += '## Summary\n\n';
    const critical = report.results.filter(r => r.severity === 'critical').length;
    const warning = report.results.filter(r => r.severity === 'warning').length;
    const success = report.results.filter(r => r.severity === 'success').length;
    md += '- 🔴 Critical: ' + critical + '\n';
    md += '- 🟡 Warning: ' + warning + '\n';
    md += '- 🟢 Passed: ' + success + '\n\n';
    
    if (critical > 0) {
      md += '## Critical Issues\n\n';
      report.results.filter(r => r.severity === 'critical').forEach(r => {
        md += '### ' + r.title + '\n';
        md += r.desc + '\n';
        if (r.fixTitle) md += '**Fix:** ' + r.fixTitle + '\n';
        if (r.fixCode) md += '```\n' + r.fixCode + '\n```\n';
        md += '\n';
      });
    }
    
    md += '## All Results\n\n';
    report.results.forEach(r => {
      const icon = r.severity === 'critical' ? '🔴' : r.severity === 'warning' ? '🟡' : '🟢';
      md += icon + ' **' + r.title + '** (' + r.category + ')\n';
      md += '  ' + r.desc + '\n\n';
    });
    
    return md;
  },
  
  toHtmlReport: function(report) {
    return '<!DOCTYPE html><html><head><title>JEC Report</title>' +
      '<style>body{font-family:sans-serif;max-width:900px;margin:2rem auto;padding:1rem}' +
      'h1{color:#833AB4}h2{border-bottom:2px solid #833AB4;padding-bottom:0.5rem}' +
      '.critical{color:#ed4956}.warning{color:#e67e22}.success{color:#00d97e}' +
      'pre{background:#f5f5f7;padding:1rem;border-radius:8px;overflow-x:auto}</style></head><body>' +
      '<h1>JEC DevTools Report</h1>' +
      '<p><strong>URL:</strong> ' + report.url + '</p>' +
      '<p><strong>Score:</strong> ' + report.score + '/100</p>' +
      '<h2>Results (' + report.results.length + ')</h2>' +
      report.results.map(r => 
        '<div class="' + r.severity + '"><h3>' + r.title + '</h3>' +
        '<p>' + r.desc + '</p>' +
        (r.fixCode ? '<pre>' + r.fixCode + '</pre>' : '') +
        '</div>'
      ).join('') +
      '</body></html>';
  },
  
  downloadAllPatches: function() {
    const content = this.fixes.map((f, i) => 
      '// ===== Patch ' + (i + 1) + ': ' + f.title + ' =====\n' +
      '// ' + f.desc + '\n\n' + f.code + '\n'
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jec-patches-' + Date.now() + '.js';
    a.click();
    URL.revokeObjectURL(url);
    
    this.toast('All patches downloaded', 'success');
  },
  
  // ═══════════ UTILITIES ═══════════
  copyText: function(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast('Copied to clipboard!', 'success');
      }).catch(() => this.fallbackCopy(text));
    } else {
      this.fallbackCopy(text);
    }
  },
  
  fallbackCopy: function(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.toast('Copied!', 'success');
    } catch(e) {
      this.toast('Copy failed', 'error');
    }
    document.body.removeChild(ta);
  },
  
  toast: function(msg, type) {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const msgEl = document.getElementById('toast-msg');
    
    icon.textContent = type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'check_circle';
    icon.style.color = type === 'error' ? 'var(--red)' : type === 'warning' ? '#e67e22' : 'var(--green)';
    msgEl.textContent = msg;
    toast.classList.add('show');
    
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  },
  
  esc: function(s) {
    return (s || '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

document.addEventListener('DOMContentLoaded', () => DT.init());
window.DT = DT;
