// JEC v.2.00 | 15/08/2026 | j/j.js | Core Engine - Fast First Load
// Arsitektur: Splash → Login → Dashboard (built-in)
// Lazy loading untuk modul non-critical

'use strict';

// ═══════════ GLOBAL STATE ═══════════
const JEC = {
  config: window.JEC_CONFIG || {},
  user: null,
  lang: localStorage.getItem('jec_lang') || 'en',
  theme: localStorage.getItem('jec_theme') || 'light',
  avatar: localStorage.getItem('jec_avatar') || 'default',
  materiData: { spe: {}, voc: {}, gra: {}, wri: {}, lis: {} },
  extData: { tabs: [] },
  lbData: { sessions: [] },
  progressMap: {},
  bookmarkList: [],
  notesMap: {},
  unlockedAch: [],
  currentDC: null,
  dcToday: null,
  featureStates: {},
  featureQueue: [],
  activeView: 'learn',
  currentModule: null,
  currentUnitId: null,
  currentPartId: null,
  leaderboardData: [],
  onlineCount: 0,
  flmTimer: null,
  flmSeconds: 0,
  flmTotalSeconds: 0,
  flmActive: false,
  appState: 'boot',
  featuresLoaded: false,
  dashboardReady: false,
  stats: {
    partsDone: 0, perfectQuiz: false, perfectCount: 0, avgQuiz: 0,
    quizCount: 0, streak: 0, loginCount: 0, focusCount: 0,
    focusHours: 0, focusNoSkip: 0, bmCount: 0, notesCount: 0,
    reactCount: 0, dcCount: 0, dcStreak: 0, speakCount: 0,
    listenCount: 0, hasProfile: false, earlyBird: false,
    nightOwl: false, marathonDay: false, speComplete: false,
    vocComplete: false, graComplete: false, allModules: false
  }
};

// ═══════════ MODULE LOADING STRATEGY ═══════════
// Priority 1: Blocking - harus load sebelum dashboard
JEC.PRIORITY_1 = ['learn'];

// Priority 2: After dashboard - load segera setelah dashboard tampil
JEC.PRIORITY_2 = ['profile', 'dc', 'ach', 'focus'];

// Priority 3: Lazy - load saat user pertama kali akses
JEC.PRIORITY_3 = ['practice', 'extra', 'bm', 'notes', 'logbook', 'react'];

// Built-in: tidak perlu load external
JEC.BUILT_IN = ['splash', 'login', 'header'];

// ═══════════ BOOTSTRAP ═══════════
document.addEventListener('DOMContentLoaded', function() {
  JEC.applyTheme();
  JEC.applyLang();
  JEC.setupOfflineDetection();
  JEC.startClock();
  JEC.initBuiltInLogin();
  JEC.initHashRouter();
  JEC.boot();
});

JEC.boot = async function() {
  JEC.appState = 'splash';
  
  const splash = document.getElementById('feat-splash');
  const loginPage = document.getElementById('feat-login');
  const dashboard = document.getElementById('dashboard');
  
  // Tampilkan splash
  if (splash) {
    splash.style.display = 'flex';
    splash.classList.remove('hide');
  }
  
  // Sembunyikan login dan dashboard dulu
  if (loginPage) loginPage.classList.add('hidden');
  if (dashboard) dashboard.classList.remove('active');
  
  // Mulai load Priority 1 modules di background (non-blocking)
  JEC.loadPriorityModules(JEC.PRIORITY_1);
  
  // Cek saved session
  const savedUser = localStorage.getItem('jec_user');
  let sessionValid = false;
  
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      JEC.user = u;
      sessionValid = await JEC.autoLogin(u);
    } catch(e) {
      console.warn('[JEC] Failed to parse saved user:', e);
      localStorage.removeItem('jec_user');
      JEC.user = null;
    }
  }
  
  // Tunggu minimal 3 detik splash
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Tunggu Priority 1 modules selesai (max 3 detik)
  await JEC.waitForModules(JEC.PRIORITY_1, 3000);
  
  // Fade out splash
  if (splash) {
    splash.classList.add('hide');
    setTimeout(function() {
      splash.style.display = 'none';
    }, 500);
  }
  
  // Tentukan halaman
  if (sessionValid && JEC.user) {
    JEC.enterDashboard();
    // Load Priority 2 modules setelah dashboard tampil
    setTimeout(function() {
      JEC.loadPriorityModules(JEC.PRIORITY_2);
    }, 100);
    // Navigate dari hash jika ada
    setTimeout(function() {
      JEC.navigateFromHash();
    }, 500);
  } else {
    JEC.showLoginPage();
  }
};

// ═══════════ MODULE LOADING ═══════════
JEC.loadPriorityModules = function(moduleNames) {
  const features = JEC.config.FEATURES || {};
  const builtIn = JEC.BUILT_IN;
  
  moduleNames.forEach(function(name) {
    if (builtIn.includes(name)) {
      JEC.featureStates[name] = { loaded: true, builtin: true };
      return;
    }
    
    const cfg = features[name];
    if (!cfg || !cfg.enabled) {
      JEC.featureStates[name] = { loaded: false, disabled: true };
      setTimeout(function() {
        JEC.renderMaintenancePlaceholder(name, 'maintenance');
      }, 100);
      return;
    }
    
    // Jangan load ulang jika sudah di-load
    if (JEC.featureStates[name] && JEC.featureStates[name].loaded) return;
    
    JEC.loadFeatureWithTimeout(name, cfg.js);
  });
};

JEC.loadFeatureWithTimeout = function(name, jsFile) {
  const timeout = setTimeout(function() {
    if (!JEC.featureStates[name] || !JEC.featureStates[name].loaded) {
      console.warn('[JEC] Feature load timeout: ' + name);
      JEC.featureStates[name] = { loaded: false, timeout: true };
      JEC.renderMaintenancePlaceholder(name, 'error');
    }
  }, 5000);
  
  JEC.loadFeature(name, jsFile, function() {
    clearTimeout(timeout);
  });
};

JEC.loadFeature = function(name, jsFile, callback) {
  const baseUrl = JEC.config.FEATURES_JS || (JEC.config.BASE_GH + 'j/f/');
  const url = baseUrl + jsFile + '?v=' + Date.now();
  const script = document.createElement('script');
  
  script.onload = function() {
    const initFn = window['JEC_' + name.toUpperCase() + '_INIT'];
    if (typeof initFn === 'function') {
      try {
        initFn(JEC);
        JEC.featureStates[name] = { loaded: true };
        if (JEC.config.DEBUG_MODE) {
          console.log('[JEC] ✓ Feature loaded: ' + name);
        }
      } catch(err) {
        console.error('[JEC] ✗ Error init feature ' + name + ':', err);
        JEC.featureStates[name] = { loaded: false, error: err.message };
        JEC.renderMaintenancePlaceholder(name, 'error');
        
        // Retry sekali setelah 1 detik
        setTimeout(function() {
          try {
            if (typeof initFn === 'function') {
              initFn(JEC);
              JEC.featureStates[name] = { loaded: true };
              console.log('[JEC] ✓ Feature retry success: ' + name);
            }
          } catch(e2) {
            console.error('[JEC] ✗ Retry failed for ' + name);
          }
          if (callback) callback();
        }, 1000);
        return;
      }
    } else {
      JEC.featureStates[name] = { loaded: true };
      if (JEC.config.DEBUG_MODE) {
        console.log('[JEC] ✓ Feature loaded (no init): ' + name);
      }
    }
    if (callback) callback();
  };
  
  script.onerror = function() {
    console.warn('[JEC] ⚠ Feature JS not found: ' + jsFile);
    JEC.featureStates[name] = { loaded: false, notFound: true };
    JEC.renderMaintenancePlaceholder(name, 'maintenance');
    if (callback) callback();
  };
  
  script.src = url;
  document.head.appendChild(script);
};

JEC.waitForModules = function(moduleNames, timeoutMs) {
  timeoutMs = timeoutMs || 3000;
  return new Promise(function(resolve) {
    const startTime = Date.now();
    const builtIn = JEC.BUILT_IN;
    
    const checkInterval = setInterval(function() {
      const allDone = moduleNames.every(function(name) {
        if (builtIn.includes(name)) return true;
        const state = JEC.featureStates[name];
        if (!state) return false;
        return state.loaded === true || 
               state.disabled === true || 
               state.error || 
               state.notFound ||
               state.timeout;
      });
      
      const elapsed = Date.now() - startTime;
      
      if (allDone || elapsed > timeoutMs) {
        clearInterval(checkInterval);
        if (JEC.config.DEBUG_MODE) {
          console.log('[JEC] Modules loading done in ' + elapsed + 'ms');
        }
        resolve();
      }
    }, 50);
  });
};

JEC.renderMaintenancePlaceholder = function(featureName, type) {
  const containerId = 'feat-' + featureName;
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const msg = JEC.config.I18N || {};
  const lang = JEC.lang;
  
  let title, desc, icon;
  if (type === 'error') {
    title = (msg.error_load && msg.error_load[lang]) || 'Under Repair';
    desc = (msg.error_desc && msg.error_desc[lang]) || 'Feature temporarily unavailable';
    icon = 'build';
  } else {
    title = (msg.maintenance && msg.maintenance[lang]) || 'Maintenance Service';
    desc = (msg.under_construction && msg.under_construction[lang]) || 'This feature is under development';
    icon = 'engineering';
  }
  
  container.innerHTML = '<div class="maintenance-card">' +
    '<span class="material-icons-round maintenance-icon">' + icon + '</span>' +
    '<div class="maintenance-title">' + JEC.esc(title) + '</div>' +
    '<div class="maintenance-desc">' + JEC.esc(desc) + '</div>' +
    '</div>';
};

JEC.isFeatureLoaded = function(name) {
  const state = JEC.featureStates[name];
  return state && state.loaded === true;
};

// Lazy load saat user pertama kali akses view
JEC.lazyLoadForView = function(viewName) {
  const viewModuleMap = {
    'learn': ['learn'],
    'practice': ['practice'],
    'extra': ['extra', 'logbook'],
    'profile': ['profile', 'bm', 'notes', 'ach']
  };
  
  const modules = viewModuleMap[viewName] || [];
  const toLoad = modules.filter(function(m) {
    const state = JEC.featureStates[m];
    return !state || (!state.loaded && !state.disabled && !state.notFound);
  });
  
  if (toLoad.length > 0) {
    JEC.loadPriorityModules(toLoad);
  }
};

// ═══════════ SHOW/HIDE PAGES ═══════════
JEC.showLoginPage = function() {
  JEC.appState = 'login';
  
  const loginPage = document.getElementById('feat-login');
  const dashboard = document.getElementById('dashboard');
  
  if (loginPage) loginPage.classList.remove('hidden');
  if (dashboard) dashboard.classList.remove('active');
};

JEC.enterDashboard = function() {
  JEC.appState = 'dashboard';
  JEC.dashboardReady = true;
  
  const loginPage = document.getElementById('feat-login');
  const dashboard = document.getElementById('dashboard');
  
  if (loginPage) loginPage.classList.add('hidden');
  if (dashboard) dashboard.classList.add('active');
  
  const userName = document.getElementById('user-name');
  if (userName && JEC.user) {
    userName.textContent = JEC.user.nickname ? '@' + JEC.user.nickname : JEC.user.name;
  }
  
  JEC.applyHeaderBg();
  JEC.applyCustomLogo();
  JEC.fetchOnlineCount();
  
  if (typeof JEC_UI !== 'undefined' && JEC_UI.showFLMFab) {
    JEC_UI.showFLMFab();
  }
  
  JEC.refreshActiveFeatureUI();
};

// ═══════════ BUILT-IN LOGIN ═══════════
JEC.initBuiltInLogin = function() {
  const loginBtn = document.getElementById('login-btn');
  const loginPin = document.getElementById('login-pin');
  const loginId = document.getElementById('login-id');
  
  if (loginBtn) {
    loginBtn.onclick = function() { 
      JEC.doLogin(); 
    };
  }
  
  if (loginPin) {
    loginPin.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') JEC.doLogin();
    });
  }
  
  if (loginId) {
    loginId.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') loginPin.focus();
    });
  }
};

JEC.doLogin = async function() {
  const idEl = document.getElementById('login-id');
  const pinEl = document.getElementById('login-pin');
  const errorEl = document.getElementById('login-error');
  const errorMsg = document.getElementById('login-error-msg');
  const loadingEl = document.getElementById('login-loading');
  
  if (!idEl || !pinEl) {
    console.error('[JEC] Login elements not found');
    return;
  }
  
  const id = idEl.value.trim().toLowerCase();
  const pin = pinEl.value.trim();
  
  if (errorEl) errorEl.classList.remove('show');
  
  if (!id || !pin) {
    if (errorMsg) errorMsg.textContent = JEC.t('fill_all_fields') || 'Please fill all fields';
    if (errorEl) errorEl.classList.add('show');
    return;
  }
  
  if (loadingEl) loadingEl.classList.add('show');
  
  try {
    const result = await JEC.login(id, pin);
    if (loadingEl) loadingEl.classList.remove('show');
    
    if (result.success) {
      JEC.enterDashboard();
      // Load Priority 2 modules setelah login
      setTimeout(function() {
        JEC.loadPriorityModules(JEC.PRIORITY_2);
      }, 100);
      setTimeout(function() {
        JEC.navigateFromHash();
      }, 500);
    } else {
      if (errorMsg) errorMsg.textContent = result.msg || JEC.t('login_failed') || 'Login failed';
      if (errorEl) errorEl.classList.add('show');
    }
  } catch(e) {
    if (loadingEl) loadingEl.classList.remove('show');
    if (errorMsg) errorMsg.textContent = JEC.t('network_error') || 'Network error: ' + e.message;
    if (errorEl) errorEl.classList.add('show');
  }
};

// ═══════════ CLOCK ═══════════
JEC.startClock = function() {
  JEC.updateClock();
  setInterval(JEC.updateClock, 1000);
};

JEC.updateClock = function() {
  const el = document.getElementById('datetime');
  if (!el) return;
  
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[now.getDay()];
  const d = now.getDate();
  const m = months[now.getMonth()];
  const y = now.getFullYear();
  let h = now.getHours();
  const min = String(now.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  
  el.textContent = day + ', ' + d + ' ' + m + ' ' + y + ' · ' + h + ':' + min + ' ' + ampm;
  
  const greetEl = document.getElementById('greet-text');
  if (greetEl) {
    const hour = now.getHours();
    let greetKey = 'morning';
    if (hour >= 12 && hour < 15) greetKey = 'afternoon';
    else if (hour >= 15 && hour < 18) greetKey = 'evening';
    else if (hour >= 18 || hour < 5) greetKey = 'night';
    greetEl.textContent = JEC.t('greet.' + greetKey);
  }
};

// ═══════════ URL HASH ROUTING ═══════════
JEC.initHashRouter = function() {
  window.addEventListener('hashchange', JEC.handleHashChange);
};

JEC.handleHashChange = function() {
  if (!JEC.user) return;
  JEC.navigateFromHash();
};

JEC.navigateFromHash = function() {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  
  const parts = hash.split('/');
  if (parts.length < 3) return;
  
  const module = parts[0];
  const unitId = parts[1];
  const partId = parts[2];
  
  if (!JEC.materiData[module]) {
    JEC.toast(JEC.t('invalid_module') || 'Invalid module', 'error');
    return;
  }
  
  const materi = JEC.materiData[module] || {};
  const unit = (materi.materials || {})[unitId];
  if (!unit) {
    JEC.toast(JEC.t('invalid_unit') || 'Invalid unit', 'error');
    return;
  }
  
  const part = (unit.parts || {})[partId];
  if (!part) {
    JEC.toast(JEC.t('invalid_part') || 'Invalid part', 'error');
    return;
  }
  
  JEC.switchView('learn');
  
  if (typeof JEC_LEARN !== 'undefined') {
    JEC.currentModule = module;
    JEC.currentUnitId = unitId;
    JEC.currentPartId = partId;
    
    JEC_LEARN.state.module = module;
    JEC_LEARN.state.unitId = unitId;
    JEC_LEARN.state.partId = partId;
    JEC_LEARN.state.view = 'materi';
    
    JEC_LEARN.renderMateri(module, unitId, partId);
  }
};

JEC.updateHash = function(module, unitId, partId) {
  if (module && unitId && partId) {
    window.location.hash = module + '/' + unitId + '/' + partId;
  } else {
    history.replaceState(null, null, ' ');
  }
};

// ═══════════ THEME ═══════════
JEC.applyTheme = function() {
  const saved = localStorage.getItem('jec_theme') || 'light';
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

JEC.toggleTheme = function() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  if (newTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('jec_theme', newTheme);
  JEC.theme = newTheme;
  JEC.updateThemeIcon();
};

JEC.updateThemeIcon = function() {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  const current = document.documentElement.getAttribute('data-theme');
  icon.textContent = current === 'dark' ? 'light_mode' : 'dark_mode';
};

// ═══════════ LANGUAGE ═══════════
JEC.applyLang = function() {
  const langBtn = document.getElementById('lang-btn');
  const loginLangBtn = document.getElementById('login-lang-btn');
  const langText = JEC.lang.toUpperCase();
  
  if (langBtn) langBtn.textContent = langText;
  if (loginLangBtn) loginLangBtn.textContent = langText;
  
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    const key = el.getAttribute('data-i18n');
    const val = JEC.t(key);
    if (val && val !== key) el.textContent = val;
  });
};

JEC.toggleLang = function() {
  JEC.lang = JEC.lang === 'en' ? 'id' : 'en';
  localStorage.setItem('jec_lang', JEC.lang);
  JEC.applyLang();
  JEC.refreshActiveFeatureUI();
};

JEC.t = function(key) {
  if (!key) return '';
  const i18nObj = window.JEC_I18N || {};
  const parts = key.split('.');
  let obj = i18nObj[JEC.lang] || i18nObj.en || {};
  for (let i = 0; i < parts.length; i++) {
    if (obj[parts[i]] === undefined) return key;
    obj = obj[parts[i]];
  }
  return obj;
};

// ═══════════ OFFLINE DETECTION ═══════════
JEC.setupOfflineDetection = function() {
  const update = function() {
    const bar = document.getElementById('offline-bar');
    if (!bar) return;
    if (!navigator.onLine) {
      bar.classList.add('show');
    } else {
      bar.classList.remove('show');
    }
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
};

// ═══════════ CUSTOM LOGO & HEADER BG ═══════════
JEC.applyCustomLogo = function() {
  const logoUrl = localStorage.getItem('jec_logo_url') || '';
  const loginLogo = document.getElementById('login-logo-img');
  const headerLogo = document.getElementById('header-logo-img');
  const loginFallback = document.getElementById('login-logo-fallback');
  const headerFallback = document.getElementById('header-logo-fallback');
  
  if (logoUrl) {
    if (loginLogo) { loginLogo.src = logoUrl; loginLogo.style.display = 'block'; }
    if (headerLogo) { headerLogo.src = logoUrl; headerLogo.style.display = 'block'; }
    if (loginFallback) loginFallback.style.display = 'none';
    if (headerFallback) headerFallback.style.display = 'none';
  } else {
    if (loginLogo) loginLogo.style.display = 'none';
    if (headerLogo) headerLogo.style.display = 'none';
    if (loginFallback) loginFallback.style.display = 'flex';
    if (headerFallback) headerFallback.style.display = 'flex';
  }
};

JEC.applyHeaderBg = function() {
  const headerBg = document.getElementById('header-bg');
  if (!headerBg) return;
  
  const bgType = localStorage.getItem('jec_header_bg_type') || '';
  const bgUrl = localStorage.getItem('jec_header_bg_url') || '';
  
  headerBg.style.backgroundImage = '';
  headerBg.className = 'header-bg';
  
  if (bgType === 'image' && bgUrl) {
    headerBg.style.backgroundImage = 'url(' + bgUrl + ')';
    headerBg.style.backgroundSize = 'cover';
    headerBg.style.backgroundPosition = 'center';
  }
};

// ═══════════ API WRAPPER ═══════════
JEC.apiGet = async function(params) {
  const url = JEC.config.LOG;
  if (!url) throw new Error('LOG URL not configured');
  const qs = Object.keys(params).map(function(k) {
    return k + '=' + encodeURIComponent(params[k]);
  }).join('&');
  const res = await fetch(url + '?' + qs);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.json();
};

JEC.apiPost = async function(data) {
  const url = JEC.config.LOG;
  if (!url) throw new Error('LOG URL not configured');
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data)
  });
};

// ═══════════ LOGIN & SESSION ═══════════
JEC.login = async function(id, pin) {
  try {
    const data = await JEC.apiGet({ action: 'login', id: id, pin: pin });
    if (data.success) {
      JEC.user = {
        id: String(data.user.id),
        name: data.user.name,
        nickname: data.user.nickname || '',
        class: data.user.class,
        batch: String(data.user.batch),
        startDate: data.user.startDate,
        sessionDuration: data.user.sessionDuration,
        daysLeft: data.session.daysLeft
      };
      localStorage.setItem('jec_user', JSON.stringify(JEC.user));
      await JEC.loadAllData();
      JEC.checkDailyChallenge();
      JEC.checkAllAchievements();
      JEC.logActivity('login', 'Login successful');
      localStorage.setItem('jec_last_login_' + JEC.user.id, Date.now());
      return { success: true };
    } else {
      return { success: false, msg: data.msg };
    }
  } catch(e) {
    return { success: false, msg: e.message };
  }
};

JEC.autoLogin = async function(u) {
  try {
    const data = await JEC.apiGet({ action: 'check_session', id: u.id });
    if (data.active) {
      JEC.user = u;
      JEC.user.daysLeft = data.daysLeft;
      await JEC.loadAllData();
      JEC.checkDailyChallenge();
      JEC.checkAllAchievements();
      return true;
    } else {
      localStorage.removeItem('jec_user');
      JEC.user = null;
      return false;
    }
  } catch(e) {
    console.warn('[JEC] Auto-login check failed:', e);
    try {
      JEC.user = u;
      await JEC.loadAllData();
      return true;
    } catch(e2) {
      return false;
    }
  }
};

JEC.logout = function() {
  if (!confirm('Logout?')) return;
  localStorage.removeItem('jec_user');
  JEC.user = null;
  JEC.appState = 'boot';
  JEC.dashboardReady = false;
  location.reload();
};

// ═══════════ DATA LOADING ═══════════
JEC.loadAllData = async function() {
  try {
    const modules = ['spe', 'voc', 'gra', 'wri', 'lis'];
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      try {
        const r = await fetch(JEC.config.DATA + m + '.json?v=' + Date.now());
        if (r.ok) JEC.materiData[m] = await r.json();
      } catch(e) {}
    }
    
    try {
      const er = await fetch(JEC.config.DATA + 'ext.json?v=' + Date.now());
      if (er.ok) JEC.extData = await er.json();
    } catch(e) {}
    
    try {
      const lr = await fetch(JEC.config.DATA + 'lb.json?v=' + Date.now());
      if (lr.ok) JEC.lbData = await lr.json();
    } catch(e) {}
    
    try {
      const pr = await JEC.apiGet({ action: 'fetch_progress', id: JEC.user.id });
      JEC.progressMap = {};
      if (Array.isArray(pr)) {
        pr.forEach(function(p) {
          JEC.progressMap[p.module + '_' + p.unitId + '_' + p.partId] = p.status;
        });
      }
    } catch(e) {}
    
    try {
      const lbr = await JEC.apiGet({ action: 'fetch_leaderboard', batch: JEC.user.batch });
      if (Array.isArray(lbr)) JEC.leaderboardData = lbr;
    } catch(e) {}
    
    JEC.unlockedAch = JSON.parse(localStorage.getItem('jec_ach_' + JEC.user.id) || '[]');
    JEC.bookmarkList = JSON.parse(localStorage.getItem('jec_bm_' + JEC.user.id) || '[]');
    JEC.notesMap = JSON.parse(localStorage.getItem('jec_notes_' + JEC.user.id) || '{}');
    
    JEC.updateStats();
  } catch(e) {
    console.warn('[JEC] Data load failed:', e);
  }
};

JEC.updateStats = function() {
  const s = JEC.stats;
  s.partsDone = Object.values(JEC.progressMap).filter(function(x) { return x === 'done'; }).length;
  s.bmCount = JEC.bookmarkList.length;
  s.notesCount = Object.keys(JEC.notesMap).length;
  s.hasProfile = !!(JEC.user && JEC.user.name);
  
  const hour = new Date().getHours();
  s.earlyBird = hour < 6;
  s.nightOwl = hour >= 22 || hour < 5;
};

// ═══════════ LOGGING ═══════════
JEC.logActivity = function(type, details) {
  if (!JEC.user) return;
  JEC.apiPost({
    action: 'log',
    id: JEC.user.id,
    batch: JEC.user.batch,
    type: type,
    details: details || ''
  }).catch(function() {});
};

JEC.heartbeat = function() {
  if (!JEC.user) return;
  JEC.apiPost({
    action: 'heartbeat',
    id: JEC.user.id,
    batch: JEC.user.batch,
    page: JEC.activeView
  }).catch(function() {});
};

JEC.fetchOnlineCount = async function() {
  if (!JEC.user) return;
  try {
    const data = await JEC.apiGet({ action: 'fetch_online', batch: JEC.user.batch });
    JEC.onlineCount = Array.isArray(data) ? data.length : 0;
    const el = document.getElementById('online-num');
    if (el) el.textContent = JEC.onlineCount;
  } catch(e) {
    JEC.onlineCount = 0;
  }
};

// ═══════════ DAILY CHALLENGE ═══════════
JEC.checkDailyChallenge = function() {
  if (!JEC.user) return;
  const challenges = JEC.config.DAILY_CHALLENGES || [];
  if (!challenges.length) return;
  
  const today = new Date().toISOString().split('T')[0];
  const lastDone = localStorage.getItem('jec_dc_date_' + JEC.user.id);
  
  if (lastDone === today) {
    JEC.dcToday = null;
    JEC.currentDC = null;
    return;
  }
  
  const seed = new Date().getDate() + new Date().getMonth() * 31;
  JEC.currentDC = challenges[seed % challenges.length];
  JEC.dcToday = {
    challenge: JEC.currentDC,
    completed: false,
    triggerCount: 0,
    modules: {}
  };
};

JEC.triggerDailyChallenge = function(trigger, data) {
  if (!JEC.user || !JEC.currentDC || !JEC.dcToday) return;
  if (JEC.dcToday.completed) return;
  
  const ch = JEC.currentDC;
  if (ch.trigger !== trigger) return;
  
  let shouldComplete = false;
  
  switch(trigger) {
    case 'speak': case 'writing': case 'review': case 'note': case 'bookmark': case 'login':
      shouldComplete = true; break;
    case 'voc_part': shouldComplete = data && data.module === 'voc'; break;
    case 'lis_part': shouldComplete = data && data.module === 'lis'; break;
    case 'quiz_80': shouldComplete = data && data.score >= 80; break;
    case 'quiz_100': shouldComplete = data && data.score === 100; break;
    case 'focus': shouldComplete = data && data.completed; break;
    case 'tts_3':
      JEC.dcToday.triggerCount++;
      shouldComplete = JEC.dcToday.triggerCount >= 3;
      break;
    case 'multi_mod':
      if (data && data.module) {
        JEC.dcToday.modules[data.module] = true;
        shouldComplete = Object.keys(JEC.dcToday.modules).length >= 2;
      }
      break;
    case 'comeback':
      const lastLogin = localStorage.getItem('jec_last_login_' + JEC.user.id);
      if (lastLogin) {
        const days = Math.floor((Date.now() - parseInt(lastLogin)) / 86400000);
        shouldComplete = days >= 2;
      }
      break;
  }
  
  if (shouldComplete) JEC.completeDailyChallenge();
};

JEC.completeDailyChallenge = function() {
  if (!JEC.currentDC || !JEC.dcToday) return;
  if (JEC.dcToday.completed) return;
  
  JEC.dcToday.completed = true;
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('jec_dc_date_' + JEC.user.id, today);
  
  const xp = JEC.currentDC.xp || 20;
  JEC.toast(
    ((JEC.config.I18N.dc_complete && JEC.config.I18N.dc_complete[JEC.lang]) || 'Daily Challenge Completed!') + ' +' + xp + ' XP',
    'success', 3000
  );
  
  JEC.apiPost({
    action: 'save_daily_challenge',
    id: JEC.user.id,
    batch: JEC.user.batch,
    challengeTitle: JEC.currentDC.en,
    xpEarned: xp
  }).catch(function() {});
  
  JEC.checkAllAchievements();
};

// ═══════════ ACHIEVEMENT ENGINE ═══════════
JEC.checkAllAchievements = function() {
  if (!JEC.user) return;
  const achs = JEC.config.ACHIEVEMENTS || [];
  const s = JEC.stats;
  
  achs.forEach(function(ach) {
    if (JEC.unlockedAch.includes(ach.id)) return;
    try {
      if (typeof ach.cond === 'function' && ach.cond(s)) {
        JEC.unlockAchievement(ach.id);
      }
    } catch(e) {}
  });
};

JEC.unlockAchievement = function(achId) {
  if (JEC.unlockedAch.includes(achId)) return;
  JEC.unlockedAch.push(achId);
  localStorage.setItem('jec_ach_' + JEC.user.id, JSON.stringify(JEC.unlockedAch));
  
  const achs = JEC.config.ACHIEVEMENTS || [];
  const ach = achs.find(function(a) { return a.id === achId; });
  if (!ach) return;
  
  JEC.showAchToast(ach);
  
  JEC.apiPost({
    action: 'earn_achievement',
    id: JEC.user.id,
    batch: JEC.user.batch,
    achievementId: achId
  }).catch(function() {});
};

JEC.showAchToast = function(ach) {
  const existing = document.getElementById('ach-toast');
  if (existing) existing.remove();
  
  const title = (JEC.config.I18N.ach_unlocked && JEC.config.I18N.ach_unlocked[JEC.lang]) || 'Achievement Unlocked!';
  const name = JEC.lang === 'id' ? ach.id : ach.en;
  
  const toast = document.createElement('div');
  toast.id = 'ach-toast';
  toast.className = 'ach-toast';
  toast.innerHTML = '<span class="material-icons-round ach-toast-icon">' + ach.icon + '</span>' +
    '<div class="ach-toast-text">' +
    '<div class="ach-toast-title">' + JEC.esc(title) + '</div>' +
    '<div class="ach-toast-name">' + JEC.esc(name) + '</div>' +
    '</div>';
  document.body.appendChild(toast);
  
  setTimeout(function() { toast.classList.add('show'); }, 50);
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 500);
  }, 3500);
};

// ═══════════ PROGRESS & ACTIVITY ═══════════
JEC.markDone = function(module, unitId, partId, score) {
  if (!JEC.user) return;
  const key = module + '_' + unitId + '_' + partId;
  if (JEC.progressMap[key] === 'done') return;
  
  JEC.progressMap[key] = 'done';
  score = score || 100;
  
  JEC.apiPost({
    action: 'mark_done',
    id: JEC.user.id, batch: JEC.user.batch,
    module: module, unitId: unitId, partId: partId, score: score
  }).catch(function() {});
  
  JEC.updateStats();
  JEC.checkAllAchievements();
  JEC.triggerDailyChallenge(module + '_part', { module: module });
  JEC.triggerDailyChallenge('multi_mod', { module: module });
};

JEC.saveScore = function(module, unitId, partId, score, totalQ, correctA) {
  if (!JEC.user) return;
  
  JEC.apiPost({
    action: 'save_score',
    id: JEC.user.id, batch: JEC.user.batch,
    module: module, unitId: unitId, partId: partId,
    score: score, totalQuestions: totalQ, correctAnswers: correctA
  }).catch(function() {});
  
  JEC.stats.quizCount++;
  if (score === 100) {
    JEC.stats.perfectQuiz = true;
    JEC.stats.perfectCount++;
    JEC.triggerDailyChallenge('quiz_100', { score: score });
  }
  if (score >= 80) JEC.triggerDailyChallenge('quiz_80', { score: score });
  JEC.checkAllAchievements();
};

JEC.saveFocusMode = function(module, unitId, partId, duration, completed) {
  if (!JEC.user) return;
  
  JEC.apiPost({
    action: 'save_focus_mode',
    id: JEC.user.id, batch: JEC.user.batch,
    module: module, unitId: unitId, partId: partId,
    duration: duration, completed: completed
  }).catch(function() {});
  
  if (completed) {
    JEC.stats.focusCount++;
    JEC.stats.focusHours += duration / 60;
    JEC.triggerDailyChallenge('focus', { completed: true });
    JEC.checkAllAchievements();
  }
};

JEC.addBookmark = function(module, unitId, partId) {
  if (!JEC.user) return;
  const key = module + '_' + unitId + '_' + partId;
  if (JEC.bookmarkList.includes(key)) return;
  
  JEC.bookmarkList.push(key);
  localStorage.setItem('jec_bm_' + JEC.user.id, JSON.stringify(JEC.bookmarkList));
  
  JEC.apiPost({
    action: 'add_bookmark',
    id: JEC.user.id, batch: JEC.user.batch,
    module: module, unitId: unitId, partId: partId
  }).catch(function() {});
  
  JEC.updateStats();
  JEC.triggerDailyChallenge('bookmark', {});
  JEC.checkAllAchievements();
};

JEC.removeBookmark = function(module, unitId, partId) {
  if (!JEC.user) return;
  const key = module + '_' + unitId + '_' + partId;
  const idx = JEC.bookmarkList.indexOf(key);
  if (idx === -1) return;
  
  JEC.bookmarkList.splice(idx, 1);
  localStorage.setItem('jec_bm_' + JEC.user.id, JSON.stringify(JEC.bookmarkList));
  
  JEC.apiPost({
    action: 'remove_bookmark',
    id: JEC.user.id, batch: JEC.user.batch,
    module: module, unitId: unitId, partId: partId
  }).catch(function() {});
  
  JEC.updateStats();
};

JEC.saveNote = function(module, unitId, partId, content) {
  if (!JEC.user) return;
  const key = module + '_' + unitId + '_' + partId;
  
  if (content && content.trim()) {
    JEC.notesMap[key] = content;
  } else {
    delete JEC.notesMap[key];
  }
  localStorage.setItem('jec_notes_' + JEC.user.id, JSON.stringify(JEC.notesMap));
  
  JEC.apiPost({
    action: 'save_note',
    id: JEC.user.id, batch: JEC.user.batch,
    module: module, unitId: unitId, partId: partId, content: content
  }).catch(function() {});
  
  JEC.updateStats();
  JEC.triggerDailyChallenge('note', {});
  JEC.checkAllAchievements();
};

// ═══════════ VIEW ROUTER ═══════════
JEC.switchView = function(name, btn) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  const target = document.getElementById('view-' + name);
  if (target) target.classList.add('active');
  
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  
  JEC.activeView = name;
  
  // Lazy load modules untuk view ini
  JEC.lazyLoadForView(name);
};

JEC.toggleFullscreen = function() {
  const icon = document.getElementById('fs-icon');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(function() {
      if (icon) icon.textContent = 'fullscreen_exit';
    }).catch(function() {});
  } else {
    document.exitFullscreen().then(function() {
      if (icon) icon.textContent = 'fullscreen';
    }).catch(function() {});
  }
};

JEC.openOv = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
};

JEC.closeOv = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
};

// ═══════════ TOAST ═══════════
JEC.toast = function(msg, type, duration) {
  type = type || 'success';
  duration = duration || 2000;
  
  let toastBar = document.getElementById('toast-bar');
  if (!toastBar) {
    toastBar = document.createElement('div');
    toastBar.id = 'toast-bar';
    toastBar.className = 'toast-bar';
    toastBar.innerHTML = '<span class="material-icons-round toast-icon"></span><span class="toast-msg"></span>';
    document.body.appendChild(toastBar);
  }
  
  const icon = toastBar.querySelector('.toast-icon');
  const msgEl = toastBar.querySelector('.toast-msg');
  
  let iconChar = 'check_circle';
  if (type === 'error') iconChar = 'error';
  else if (type === 'warning') iconChar = 'warning';
  else if (type === 'info') iconChar = 'info';
  
  toastBar.className = 'toast-bar toast-' + type;
  icon.textContent = iconChar;
  msgEl.textContent = msg;
  toastBar.classList.add('show');
  
  if (JEC._toastTimer) clearTimeout(JEC._toastTimer);
  JEC._toastTimer = setTimeout(function() {
    toastBar.classList.remove('show');
  }, duration);
};

// ═══════════ UTILITIES ═══════════
JEC.esc = function(s) {
  return (s || '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

JEC.refreshActiveFeatureUI = function() {
  Object.keys(JEC.featureStates).forEach(function(name) {
    const refreshFn = window['JEC_' + name.toUpperCase() + '_REFRESH'];
    if (typeof refreshFn === 'function' && JEC.featureStates[name].loaded) {
      try { refreshFn(JEC); } catch(e) {}
    }
  });
};

JEC.reportIssue = function(text) {
  if (!text || !text.trim()) {
    JEC.toast('Please describe the problem', 'warning');
    return;
  }
  const wa = JEC.config.WA_ADMIN || '6285335913758';
  const msg = encodeURIComponent('[JEC Report]\nID: ' + JEC.user.id + '\nName: ' + JEC.user.name + '\n\n' + text);
  window.open('https://wa.me/' + wa + '?text=' + msg, '_blank');
  JEC.closeOv('ov-report');
  JEC.toast('Opening WhatsApp...', 'success');
};

JEC.forceRefresh = async function() {
  JEC.toast('Refreshing...', 'info', 1500);
  await JEC.loadAllData();
  JEC.refreshActiveFeatureUI();
  JEC.toast('Refreshed!', 'success');
};

// ═══════════ DEBUG MODE ═══════════
JEC.debug = function() {
  console.log('══════ JEC DEBUG v2.00 ══════');
  console.log('App State:', JEC.appState);
  console.log('Dashboard Ready:', JEC.dashboardReady);
  console.log('User:', JEC.user);
  console.log('Feature States:', JEC.featureStates);
  console.log('Priority 1:', JEC.PRIORITY_1);
  console.log('Priority 2:', JEC.PRIORITY_2);
  console.log('Priority 3:', JEC.PRIORITY_3);
  
  const features = JEC.config.FEATURES || {};
  Object.keys(features).forEach(function(name) {
    const initFn = window['JEC_' + name.toUpperCase() + '_INIT'];
    const container = document.getElementById('feat-' + name);
    console.log(
      name + ':',
      'enabled=' + (features[name].enabled ? 'yes' : 'no'),
      'initFn=' + (typeof initFn === 'function' ? 'OK' : 'MISSING'),
      'container=' + (container ? 'OK' : 'MISSING'),
      'state=' + JSON.stringify(JEC.featureStates[name] || {})
    );
  });
  console.log('══════ END DEBUG ══════');
};

// ═══════════ FLM TIMER DI HEADER ═══════════
JEC.startFLMTimer = function(duration) {
  duration = duration || JEC.config.MFL_DEFAULT || 25;
  JEC.flmTotalSeconds = duration * 60;
  JEC.flmSeconds = JEC.flmTotalSeconds;
  JEC.flmActive = true;
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.remove('hidden');
  
  JEC.updateFLMHeaderTimer();
  
  if (JEC.flmTimer) clearInterval(JEC.flmTimer);
  JEC.flmTimer = setInterval(function() {
    JEC.flmSeconds--;
    JEC.updateFLMHeaderTimer();
    
    if (JEC.flmSeconds <= 0) {
      JEC.completeFLM();
    }
  }, 1000);
};

JEC.updateFLMHeaderTimer = function() {
  const timerEl = document.getElementById('flm-header-timer');
  if (timerEl) {
    const elapsed = JEC.flmTotalSeconds - JEC.flmSeconds;
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    timerEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
};

JEC.completeFLM = function() {
  if (JEC.flmTimer) clearInterval(JEC.flmTimer);
  JEC.flmActive = false;
  JEC.flmTimer = null;
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.add('hidden');
  
  JEC.saveFocusMode(
    JEC.currentModule,
    JEC.currentUnitId,
    null,
    JEC.flmTotalSeconds / 60,
    true
  );
  
  JEC.toast(JEC.t('flm_complete') || 'Focus session completed!', 'success', 3000);
  
  if (typeof JEC_UI !== 'undefined' && JEC_UI.showFLMFab) {
    JEC_UI.showFLMFab();
  }
};

JEC.exitFLM = function() {
  if (!confirm(JEC.t('flm_exit_confirm') || 'Exit Focus Learn Mode?')) return;
  
  if (JEC.flmTimer) clearInterval(JEC.flmTimer);
  JEC.flmActive = false;
  JEC.flmTimer = null;
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.add('hidden');
  
  if (typeof JEC_UI !== 'undefined' && JEC_UI.showFLMFab) {
    JEC_UI.showFLMFab();
  }
};

// ═══════════ INTERVALS ═══════════
setInterval(function() {
  if (JEC.user) {
    JEC.heartbeat();
    JEC.fetchOnlineCount();
  }
}, 30000);

window.JEC = JEC;
