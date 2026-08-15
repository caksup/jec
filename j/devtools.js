// JEC DevTools v.1.06 | 15/08/2026 | j/devtools.js | Scanner Logic

'use strict';

const DT = {
  targetUrl: '',
  baseUrl: '',
  results: [],
  fixes: [],
  fileTree: {},
  rawHtml: '',
  rawConfig: null,
  startTime: 0,
  filter: 'all',
  
  // ═══════════ INIT ═══════════
  init: function() {
    this.applyTheme();
    this.bindEvents();
  },
  
  bindEvents: function() {
    const btnScan = document.getElementById('btn-scan');
    const btnTheme = document.getElementById('btn-theme');
    const btnExport = document.getElementById('btn-export');
    const input = document.getElementById('target-url');
    
    if (btnScan) btnScan.onclick = () => this.startScan();
    if (btnTheme) btnTheme.onclick = () => this.toggleTheme();
    if (btnExport) btnExport.onclick = () => this.exportReport();
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.startScan();
      });
    }
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.filter = tab.dataset.filter;
        this.renderResults();
      };
    });
  },
  
  // ═══════════ THEME ═══════════
  applyTheme: function() {
    const saved = localStorage.getItem('jec_dt_theme') || 'light';
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('theme-icon').textContent = 'light_mode';
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
  
  // ═══════════ MAIN SCAN ═══════════
  startScan: async function() {
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
    
    this.targetUrl = url;
    this.baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    this.results = [];
    this.fixes = [];
    this.startTime = Date.now();
    
    document.getElementById('progress-section').classList.remove('hidden');
    document.getElementById('summary-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('fixes-section').classList.add('hidden');
    document.getElementById('file-tree-section').classList.add('hidden');
    
    const btn = document.getElementById('btn-scan');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons-round">hourglass_empty</span><span>Scanning...</span>';
    
    try {
      await this.runAllChecks();
    } catch(e) {
      this.addResult('critical', 'Scan Error', 'Terjadi kesalahan saat scan: ' + e.message, 'SYSTEM');
    }
    
    this.renderAll();
    
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-round">search</span><span>Periksa Ulang</span>';
    
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    document.getElementById('scan-time').textContent = 'Scan terakhir: ' + new Date().toLocaleTimeString('id-ID') + ' (' + duration + 's)';
  },
  
  runAllChecks: async function() {
    // Step 1: Fetch HTML target
    this.updateProgress(5, 'Mengambil HTML target...');
    await this.checkTargetHtml();
    
    // Step 2: Check core files
    this.updateProgress(20, 'Memeriksa file core...');
    await this.checkCoreFiles();
    
    // Step 3: Parse config & check registry
    this.updateProgress(40, 'Memeriksa registry fitur...');
    await this.checkFeatureRegistry();
    
    // Step 4: Check feature files
    this.updateProgress(60, 'Memeriksa file fitur...');
    await this.checkFeatureFiles();
    
    // Step 5: Check data files
    this.updateProgress(75, 'Memeriksa data JSON...');
    await this.checkDataFiles();
    
    // Step 6: Ping Apps Script
    this.updateProgress(90, 'Ping Apps Script...');
    await this.checkAppsScript();
    
    // Step 7: Finalize
    this.updateProgress(100, 'Scan selesai!');
  },
  
  updateProgress: function(percent, text) {
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-text').textContent = text;
  },
  
  // ═══════════ CHECK: TARGET HTML ═══════════
  checkTargetHtml: async function() {
    try {
      const res = await fetch(this.targetUrl + '?_=' + Date.now());
      if (!res.ok) {
        this.addResult('critical', 'Target HTML Tidak Dapat Diakses',
          'HTTP ' + res.status + ' saat mengakses ' + this.targetUrl,
          'HTML',
          'Pastikan file sv1.html sudah di-deploy ke GitHub Pages',
          'Deploy ulang via: Settings → Pages → Source: main branch');
        return;
      }
      this.rawHtml = await res.text();
      
      this.addResult('success', 'Target HTML OK',
        'File ' + this.targetUrl + ' berhasil diakses (' + (this.rawHtml.length / 1024).toFixed(1) + ' KB)',
        'HTML');
    } catch(e) {
      this.addResult('critical', 'Gagal Mengakses Target HTML',
        e.message + ' — URL: ' + this.targetUrl,
        'HTML',
        'Cek koneksi internet atau URL',
        'Pastikan URL benar dan GitHub Pages aktif');
    }
  },
  
  // ═══════════ CHECK: CORE FILES ═══════════
  checkCoreFiles: async function() {
    const coreFiles = [
      { path: 'j/c.js', name: 'Config', critical: true },
      { path: 'j/j.js', name: 'Core Engine', critical: true },
      { path: 'j/i18n.js', name: 'i18n Dictionary', critical: true },
      { path: 'j/ui.js', name: 'UI Controllers', critical: false },
      { path: 's/s.css', name: 'Stylesheet', critical: true }
    ];
    
    for (const f of coreFiles) {
      const url = this.baseUrl + f.path;
      const ok = await this.fileExists(url);
      if (ok) {
        this.addResult('success', f.name + ' OK',
          'File ' + f.path + ' tersedia',
          'CORE');
        this.fileTree[f.path] = { status: 'ok' };
      } else {
        const severity = f.critical ? 'critical' : 'warning';
        this.addResult(severity, f.name + ' MISSING',
          'File ' + f.path + ' tidak ditemukan',
          'CORE',
          'Upload file ke repo GitHub di path: ' + f.path,
          'Upload via: github.com/caksup/jec → Add file → ' + f.path);
        this.fileTree[f.path] = { status: 'missing' };
      }
    }
    
    // Try to parse c.js
    if (this.fileTree['j/c.js'] && this.fileTree['j/c.js'].status === 'ok') {
      try {
        const res = await fetch(this.baseUrl + 'j/c.js?_=' + Date.now());
        const text = await res.text();
        this.rawConfig = this.parseConfig(text);
        if (this.rawConfig) {
          this.addResult('success', 'Config Parsed OK',
            'j/c.js berhasil di-parse, ' + Object.keys(this.rawConfig.FEATURES || {}).length + ' fitur terdaftar',
            'CORE');
        }
      } catch(e) {
        this.addResult('warning', 'Config Parse Error',
          'Gagal parse j/c.js: ' + e.message,
          'CORE');
      }
    }
  },
  
  parseConfig: function(text) {
    try {
      // Extract window.JEC_CONFIG = { ... };
      const match = text.match(/window\.JEC_CONFIG\s*=\s*(\{[\s\S]*?\});/);
      if (!match) return null;
      // Safe eval via Function constructor
      return new Function('return ' + match[1])();
    } catch(e) {
      return null;
    }
  },
  
  // ═══════════ CHECK: FEATURE REGISTRY ═══════════
  checkFeatureRegistry: async function() {
    if (!this.rawConfig || !this.rawConfig.FEATURES) {
      this.addResult('warning', 'Registry Fitur Tidak Ditemukan',
        'FEATURES tidak ditemukan di j/c.js',
        'REGISTRY');
      return;
    }
    
    const features = this.rawConfig.FEATURES;
    const featureNames = Object.keys(features);
    
    this.addResult('success', 'Registry OK',
      featureNames.length + ' fitur terdaftar di registry',
      'REGISTRY');
    
    // Check enabled features
    let enabledCount = 0;
    featureNames.forEach(name => {
      const cfg = features[name];
      if (cfg.enabled) enabledCount++;
    });
    
    this.addResult('success', enabledCount + '/' + featureNames.length + ' Fitur Enabled',
      enabledCount + ' fitur aktif, ' + (featureNames.length - enabledCount) + ' maintenance',
      'REGISTRY');
    
    // Check for built-in features that should be skipped
    const builtIn = ['splash', 'login', 'header'];
    builtIn.forEach(name => {
      if (features[name]) {
        this.addResult('success', 'Built-in: ' + name,
          name + ' di-handle built-in oleh j.js (skip load external)',
          'REGISTRY');
      }
    });
  },
  
  // ═══════════ CHECK: FEATURE FILES ═══════════
  checkFeatureFiles: async function() {
    if (!this.rawConfig || !this.rawConfig.FEATURES) return;
    
    const features = this.rawConfig.FEATURES;
    const featureNames = Object.keys(features);
    const builtIn = ['splash', 'login', 'header'];
    
    for (const name of featureNames) {
      if (builtIn.includes(name)) continue;
      
      const cfg = features[name];
      if (!cfg.enabled) {
        this.addResult('success', name + ' (Maintenance Mode)',
          'Fitur ' + name + ' di-disable, akan tampil "Maintenance Service"',
          'FEATURE');
        continue;
      }
      
      const jsFile = cfg.js;
      const url = (this.rawConfig.FEATURES_JS || this.baseUrl + 'j/f/') + jsFile;
      const ok = await this.fileExists(url);
      
      if (ok) {
        // Check if init function is defined in file
        try {
          const res = await fetch(url + '?_=' + Date.now());
          const text = await res.text();
          const expectedInit = 'JEC_' + name.toUpperCase() + '_INIT';
          if (text.indexOf(expectedInit) !== -1) {
            this.addResult('success', name + ' OK',
              'File ' + jsFile + ' ada dan fungsi ' + expectedInit + ' terdefinisi',
              'FEATURE');
            this.fileTree['j/f/' + jsFile] = { status: 'ok' };
          } else {
            this.addResult('warning', name + ' Missing Init Function',
              'File ' + jsFile + ' ada tapi tidak expose ' + expectedInit,
              'FEATURE',
              'Tambahkan function ' + expectedInit + ' di file ' + jsFile,
              'window.' + expectedInit + ' = function(JEC) { /* init code */ };');
            this.fileTree['j/f/' + jsFile] = { status: 'warn' };
          }
        } catch(e) {
          this.addResult('warning', name + ' File Read Error',
            'Gagal baca ' + jsFile + ': ' + e.message,
            'FEATURE');
          this.fileTree['j/f/' + jsFile] = { status: 'warn' };
        }
      } else {
        this.addResult('critical', name + ' JS MISSING',
          'File ' + jsFile + ' tidak ditemukan di ' + url,
          'FEATURE',
          'Buat file j/f/' + jsFile + ' atau set enabled: false di c.js',
          'Upload file: github.com/caksup/jec/j/f/' + jsFile);
        this.fileTree['j/f/' + jsFile] = { status: 'missing' };
        
        this.fixes.push({
          title: 'Create ' + name + ' Feature',
          desc: 'File j/f/' + jsFile + ' tidak ada. Buat file baru atau disable fitur.',
          action: 'disable',
          code: '// Di j/c.js, ubah:\n' + name + ': { js: \'' + jsFile + '\', enabled: false, ... }'
        });
      }
    }
  },
  
  // ═══════════ CHECK: DATA FILES ═══════════
  checkDataFiles: async function() {
    const dataFiles = [
      { path: 'd/spe.json', name: 'Speaking Data' },
      { path: 'd/voc.json', name: 'Vocabulary Data' },
      { path: 'd/gra.json', name: 'Grammar Data' },
      { path: 'd/wri.json', name: 'Writing Data' },
      { path: 'd/lis.json', name: 'Listening Data' },
      { path: 'd/ext.json', name: 'Extra Tools' },
      { path: 'd/lb.json', name: 'Logbook' },
      { path: 'd/u.json', name: 'Users Data' },
      { path: 'd/l.json', name: 'Levels Data' }
    ];
    
    let missing = 0;
    for (const f of dataFiles) {
      const url = this.baseUrl + f.path;
      const ok = await this.fileExists(url);
      if (ok) {
        this.addResult('success', f.name + ' OK',
          f.path + ' tersedia',
          'DATA');
        this.fileTree[f.path] = { status: 'ok' };
      } else {
        missing++;
        this.addResult('warning', f.name + ' MISSING',
          f.path + ' tidak ditemukan',
          'DATA',
          'Upload file ' + f.path + ' ke GitHub',
          'Upload: github.com/caksup/jec/' + f.path);
        this.fileTree[f.path] = { status: 'missing' };
      }
    }
    
    if (missing === 0) {
      this.addResult('success', 'Semua Data Files OK',
        dataFiles.length + ' file JSON data tersedia',
        'DATA');
    }
  },
  
  // ═══════════ CHECK: APPS SCRIPT ═══════════
  checkAppsScript: async function() {
    if (!this.rawConfig || !this.rawConfig.LOG) {
      this.addResult('warning', 'Apps Script URL Tidak Dikonfigurasi',
        'LOG URL tidak ditemukan di j/c.js',
        'BACKEND');
      return;
    }
    
    const logUrl = this.rawConfig.LOG;
    
    try {
      // Test sync_all (GET)
      const testUrl = logUrl + '?action=fetch_sheets_list&_=' + Date.now();
      const res = await fetch(testUrl);
      
      if (!res.ok) {
        this.addResult('critical', 'Apps Script Tidak Merespon',
          'HTTP ' + res.status + ' dari ' + logUrl,
          'BACKEND',
          'Cek deployment Apps Script',
          'Deploy → Manage deployments → Pastikan Execute as: Me, Access: Anyone');
        return;
      }
      
      const data = await res.json();
      
      if (data.status === 'error') {
        this.addResult('warning', 'Apps Script Error',
          data.msg || 'Response error',
          'BACKEND');
        return;
      }
      
      const sheetCount = data.total || 0;
      this.addResult('success', 'Apps Script OK',
        'Terhubung, ' + sheetCount + ' sheet aktif',
        'BACKEND');
      
      // Check if expected sheets exist
      const expectedSheets = ['Users', 'Progress', 'FocusMode', 'Leaderboard', 'DailyChallenge', 'Achievements'];
      const existingSheets = (data.sheets || []).map(s => s.name || s);
      
      expectedSheets.forEach(name => {
        if (existingSheets.includes(name)) {
          this.addResult('success', 'Sheet ' + name + ' Ada',
            'Sheet ' + name + ' aktif di spreadsheet',
            'BACKEND');
        } else {
          this.addResult('warning', 'Sheet ' + name + ' MISSING',
            'Sheet ' + name + ' tidak ditemukan',
            'BACKEND',
            'Jalankan fungsi setupAndMigrate() di Apps Script',
            'Apps Script Editor → Select function: setupAndMigrate → Run');
        }
      });
      
    } catch(e) {
      this.addResult('critical', 'Apps Script Error',
        e.message,
        'BACKEND',
        'Cek CORS & deployment Apps Script',
        'Apps Script → Deploy → New deployment → Web app → Access: Anyone');
    }
  },
  
  // ═══════════ HELPERS ═══════════
  fileExists: async function(url) {
    try {
      const res = await fetch(url + '?_=' + Date.now(), { method: 'HEAD' });
      return res.ok;
    } catch(e) {
      try {
        const res = await fetch(url + '?_=' + Date.now());
        return res.ok;
      } catch(e2) {
        return false;
      }
    }
  },
  
  addResult: function(severity, title, desc, category, fixTitle, fixCode) {
    const result = {
      severity: severity,
      title: title,
      desc: desc,
      category: category,
      fixTitle: fixTitle || null,
      fixCode: fixCode || null,
      timestamp: Date.now()
    };
    this.results.push(result);
  },
  
  // ═══════════ RENDER ═══════════
  renderAll: function() {
    this.renderSummary();
    this.renderResults();
    this.renderFixes();
    this.renderFileTree();
    
    document.getElementById('summary-section').classList.remove('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('progress-section').classList.add('hidden');
    
    if (this.fixes.length > 0) {
      document.getElementById('fixes-section').classList.remove('hidden');
    }
    if (Object.keys(this.fileTree).length > 0) {
      document.getElementById('file-tree-section').classList.remove('hidden');
    }
  },
  
  renderSummary: function() {
    const critical = this.results.filter(r => r.severity === 'critical').length;
    const warning = this.results.filter(r => r.severity === 'warning').length;
    const success = this.results.filter(r => r.severity === 'success').length;
    const total = this.results.length;
    
    // Calculate score: 100 - (critical*15) - (warning*5)
    let score = 100 - (critical * 15) - (warning * 5);
    score = Math.max(0, Math.min(100, score));
    
    document.getElementById('score-value').textContent = score;
    document.getElementById('critical-count').textContent = critical;
    document.getElementById('warning-count').textContent = warning;
    document.getElementById('success-count').textContent = success;
    
    // Update score circle (conic-gradient)
    const deg = (score / 100) * 360;
    let color = 'var(--green)';
    let status = 'excellent';
    let statusText = 'Excellent';
    
    if (score < 50) {
      color = 'var(--red)';
      status = 'critical';
      statusText = 'Critical';
    } else if (score < 70) {
      color = '#e67e22';
      status = 'warning';
      statusText = 'Needs Fix';
    } else if (score < 90) {
      color = 'var(--blue)';
      status = 'good';
      statusText = 'Good';
    }
    
    const circle = document.getElementById('score-circle');
    circle.style.background = 'conic-gradient(' + color + ' ' + deg + 'deg, var(--bg2) ' + deg + 'deg)';
    
    const statusEl = document.getElementById('score-status');
    statusEl.textContent = statusText;
    statusEl.className = 'score-status ' + status;
  },
  
  renderResults: function() {
    const list = document.getElementById('results-list');
    let filtered = this.results;
    
    if (this.filter !== 'all') {
      filtered = this.results.filter(r => r.severity === this.filter);
    }
    
    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state" style="text-align:center;padding:2rem;color:var(--muted)">Tidak ada hasil untuk filter ini</div>';
      return;
    }
    
    // Sort: critical first, then warning, then success
    const order = { critical: 0, warning: 1, success: 2 };
    filtered.sort((a, b) => order[a.severity] - order[b.severity]);
    
    let html = '';
    filtered.forEach(r => {
      let icon = 'check_circle';
      if (r.severity === 'critical') icon = 'error';
      else if (r.severity === 'warning') icon = 'warning';
      
      html += '<div class="result-item ' + r.severity + '">';
      html += '<div class="result-head">';
      html += '<div class="result-icon ' + r.severity + '">';
      html += '<span class="material-icons-round">' + icon + '</span>';
      html += '</div>';
      html += '<div class="result-main">';
      html += '<div class="result-title">' + this.esc(r.title) + '</div>';
      html += '<div class="result-desc">' + this.esc(r.desc) + '</div>';
      if (r.category) {
        html += '<span class="result-category">' + this.esc(r.category) + '</span>';
      }
      html += '</div>';
      html += '</div>';
      
      if (r.fixTitle && r.fixCode) {
        html += '<div class="result-fix">';
        html += '<div class="result-fix-header">';
        html += '<span class="material-icons-round">lightbulb</span>';
        html += '<span>Solusi: ' + this.esc(r.fixTitle) + '</span>';
        html += '</div>';
        html += '<div class="result-fix-code" onclick="DT.copyFix(this)">' + this.esc(r.fixCode) + '</div>';
        html += '</div>';
      }
      
      html += '</div>';
    });
    
    list.innerHTML = html;
  },
  
  renderFixes: function() {
    const list = document.getElementById('fixes-list');
    if (this.fixes.length === 0) return;
    
    let html = '';
    this.fixes.forEach((f, i) => {
      html += '<div class="fix-card">';
      html += '<div class="fix-number">' + (i + 1) + '</div>';
      html += '<div class="fix-content">';
      html += '<div class="fix-title">' + this.esc(f.title) + '</div>';
      html += '<div class="fix-desc">' + this.esc(f.desc) + '</div>';
      html += '<button class="fix-action" onclick="DT.copyText(\'' + this.esc(f.code).replace(/'/g, "\\'") + '\')">';
      html += '<span class="material-icons-round">content_copy</span>';
      html += '<span>Copy Fix</span>';
      html += '</button>';
      html += '</div>';
      html += '</div>';
    });
    
    list.innerHTML = html;
  },
  
  renderFileTree: function() {
    const tree = document.getElementById('file-tree');
    const paths = Object.keys(this.fileTree).sort();
    
    if (paths.length === 0) {
      tree.innerHTML = '<div style="padding:1rem;color:var(--muted);text-align:center">Tidak ada data file</div>';
      return;
    }
    
    // Group by folder
    const folders = {};
    paths.forEach(path => {
      const parts = path.split('/');
      const folder = parts.length > 1 ? parts[0] : 'root';
      if (!folders[folder]) folders[folder] = [];
      folders[folder].push({ path: path, name: parts[parts.length - 1], status: this.fileTree[path].status });
    });
    
    let html = '';
    Object.keys(folders).sort().forEach(folder => {
      html += '<div class="tree-line">';
      html += '<span class="material-icons-round tree-icon folder">folder</span>';
      html += '<span class="tree-name">' + this.esc(folder) + '/</span>';
      html += '</div>';
      
      folders[folder].forEach(f => {
        let icon = 'insert_drive_file';
        let iconClass = 'file-ok';
        let statusClass = 'ok';
        let statusText = 'OK';
        
        if (f.status === 'missing') {
          icon = 'error';
          iconClass = 'file-missing';
          statusClass = 'missing';
          statusText = 'MISSING';
        } else if (f.status === 'warn') {
          icon = 'warning';
          iconClass = 'file-warn';
          statusClass = 'warn';
          statusText = 'WARN';
        }
        
        html += '<div class="tree-line tree-indent">';
        html += '<span class="material-icons-round tree-icon ' + iconClass + '">' + icon + '</span>';
        html += '<span class="tree-name">' + this.esc(f.name) + '</span>';
        html += '<span class="tree-status ' + statusClass + '">' + statusText + '</span>';
        html += '</div>';
      });
    });
    
    tree.innerHTML = html;
  },
  
  // ═══════════ UTILITIES ═══════════
  copyFix: function(el) {
    const text = el.textContent;
    this.copyText(text);
  },
  
  copyText: function(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast('Copied to clipboard!', 'success');
      }).catch(() => {
        this.fallbackCopy(text);
      });
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
      this.toast('Gagal copy', 'error');
    }
    document.body.removeChild(ta);
  },
  
  toast: function(msg, type) {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const msgEl = document.getElementById('toast-msg');
    
    if (type === 'error') {
      icon.textContent = 'error';
      icon.style.color = 'var(--red)';
    } else {
      icon.textContent = 'check_circle';
      icon.style.color = 'var(--green)';
    }
    
    msgEl.textContent = msg;
    toast.classList.add('show');
    
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  },
  
  esc: function(s) {
    return (s || '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
  
  exportReport: function() {
    const report = {
      url: this.targetUrl,
      scanTime: new Date().toISOString(),
      score: document.getElementById('score-value').textContent,
      results: this.results,
      fixes: this.fixes,
      fileTree: this.fileTree
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jec-devtools-report-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    
    this.toast('Report exported!', 'success');
  }
};

// ═══════════ BOOTSTRAP ═══════════
document.addEventListener('DOMContentLoaded', () => {
  DT.init();
});

window.DT = DT;
