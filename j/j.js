// JEC v.10.01 MASTER | 17/08/2026 | j/j.js | Core Engine
// Built-in: Learn, Practice, Extra (Tools+Games+Logbook+Overview), Profile
// FLM hanya di unit | Dual-gate login | 40 Achievements | Avatar Boy/Girl

'use strict';

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════
const JEC = {
  config: window.JEC_CONFIG || {},
  user: null,
  lang: localStorage.getItem('jec_lang') || 'en',
  theme: localStorage.getItem('jec_theme') || 'light',
  avatar: localStorage.getItem('jec_avatar') || 'boy',
  materiData: { spe: {}, voc: {}, gra: {}, wri: {}, lis: {} },
  extData: { tabs: [] },
  lbData: { sessions: [] },
  progressMap: {},
  bookmarkList: [],
  notesMap: {},
  unlockedAch: [],
  currentDC: null,
  dcToday: null,
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
  dashboardReady: false,
  ttsOn: false,
  ttsIdx: 0,
  ttsRate: 0.7,
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

// ═══════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════
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
  
  if (splash) {
    splash.style.display = 'flex';
    splash.classList.remove('hide');
  }
  if (loginPage) loginPage.classList.add('hidden');
  if (dashboard) dashboard.classList.remove('active');
  
  // Cek saved session
  const savedUser = localStorage.getItem('jec_user');
  let sessionValid = false;
  
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      JEC.user = u;
      sessionValid = await JEC.autoLogin(u);
    } catch (e) {
      console.warn('[JEC] Failed to parse saved user:', e);
      localStorage.removeItem('jec_user');
      JEC.user = null;
    }
  }
  
  // Tunggu minimal 3 detik splash
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Fade out splash
  if (splash) {
    splash.classList.add('hide');
    setTimeout(function() { splash.style.display = 'none'; }, 500);
  }
  
  // Tentukan halaman
  if (sessionValid && JEC.user) {
    JEC.enterDashboard();
  } else {
    JEC.showLoginPage();
  }
};

// ═══════════════════════════════════════════════════
// SHOW/HIDE PAGES
// ═══════════════════════════════════════════════════
JEC.showLoginPage = function() {
  JEC.appState = 'login';
  const loginPage = document.getElementById('feat-login');
  const dashboard = document.getElementById('dashboard');
  if (loginPage) loginPage.classList.remove('hidden');
  if (dashboard) dashboard.classList.remove('active');
  
  // Update login mode indicator
  JEC.updateLoginModeIndicator();
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
  JEC.updateHeaderChips();
  JEC.updateNavAvatar();
  JEC.fetchOnlineCount();
  
  // Render default view
  JEC.renderLearn();
  
  // Show DC balloon jika belum done
  setTimeout(function() { JEC.showDCBalloon(); }, 2000);
  
  JEC.logActivity('dashboard_enter', 'User entered dashboard');
};

JEC.updateLoginModeIndicator = async function() {
  const indicator = document.getElementById('login-mode-indicator');
  const icon = document.getElementById('login-mode-icon');
  const text = document.getElementById('login-mode-text');
  if (!indicator || !icon || !text) return;
  
  try {
    const res = await fetch(JEC.config.FIREBASE_URL + '/server_status.json');
    const mode = await res.json();
    
    if (mode === 'firebase') {
      indicator.style.display = 'flex';
      indicator.style.background = 'rgba(239, 68, 68, 0.1)';
      indicator.style.color = 'var(--danger)';
      icon.textContent = 'local_fire_department';
      text.textContent = JEC.lang === 'id' ? 'Mode Ujian (Firebase)' : 'Exam Mode (Firebase)';
    } else {
      indicator.style.display = 'flex';
      indicator.style.background = 'rgba(0, 217, 126, 0.1)';
      indicator.style.color = 'var(--green)';
      icon.textContent = 'public';
      text.textContent = JEC.lang === 'id' ? 'Mode Normal' : 'Normal Mode';
    }
  } catch (e) {
    indicator.style.display = 'none';
  }
};

// ═══════════════════════════════════════════════════
// BUILT-IN LOGIN
// ═══════════════════════════════════════════════════
JEC.initBuiltInLogin = function() {
  const loginBtn = document.getElementById('login-btn');
  const loginPin = document.getElementById('login-pin');
  const loginId = document.getElementById('login-id');
  
  if (loginBtn) loginBtn.onclick = function() { JEC.doLogin(); };
  if (loginPin) loginPin.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') JEC.doLogin();
  });
  if (loginId) loginId.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') loginPin.focus();
  });
};

JEC.doLogin = async function() {
  const idEl = document.getElementById('login-id');
  const pinEl = document.getElementById('login-pin');
  const errorEl = document.getElementById('login-error');
  const errorMsg = document.getElementById('login-error-msg');
  const loadingEl = document.getElementById('login-loading');
  
  if (!idEl || !pinEl) return;
  
  const id = idEl.value.trim().toLowerCase();
  const pin = pinEl.value.trim();
  
  if (errorEl) errorEl.classList.remove('show');
  
  if (!id || !pin) {
    if (errorMsg) errorMsg.textContent = JEC.t('fill_all_fields');
    if (errorEl) errorEl.classList.add('show');
    return;
  }
  
  if (loadingEl) loadingEl.classList.add('show');
  
  try {
    const result = await JEC.login(id, pin);
    if (loadingEl) loadingEl.classList.remove('show');
    
    if (result.success) {
      JEC.enterDashboard();
    } else {
      if (errorMsg) errorMsg.textContent = result.msg || JEC.t('login_failed');
      if (errorEl) errorEl.classList.add('show');
    }
  } catch (e) {
    if (loadingEl) loadingEl.classList.remove('show');
    if (errorMsg) errorMsg.textContent = JEC.t('network_error') + ': ' + e.message;
    if (errorEl) errorEl.classList.add('show');
  }
};

// ═══════════════════════════════════════════════════
// LOGIN (DUAL-GATE: GitHub + Firebase)
// ═══════════════════════════════════════════════════
JEC.login = async function(id, pin) {
  try {
    // Step 1: Cek mode login dari Firebase
    let loginMode = 'github';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const statusRes = await fetch(JEC.config.FIREBASE_URL + '/server_status.json', { signal: controller.signal });
      clearTimeout(timeout);
      loginMode = await statusRes.json() || 'github';
    } catch (err) {
      console.warn('[JEC] Gagal cek mode, fallback github');
    }
    
    localStorage.setItem('jec_login_mode', loginMode);
    
    let userData = null;
    
    if (loginMode === 'firebase') {
      // GERBANG B: MODE UJIAN (Firebase)
      const fbRes = await fetch(JEC.config.FIREBASE_URL + '/students/' + id + '.json');
      const fbData = await fbRes.json();
      
      if (!fbData) return { success: false, msg: JEC.lang === 'id' ? 'ID tidak ditemukan di server ujian.' : 'ID not found in exam server.' };
      if (String(fbData.pin) !== String(pin)) return { success: false, msg: JEC.lang === 'id' ? 'PIN salah.' : 'Invalid PIN.' };
      if (fbData.active === false) return { success: false, msg: JEC.lang === 'id' ? 'Akun tidak aktif.' : 'Account inactive.' };
      
      userData = {
        id: String(id),
        name: fbData.name,
        nickname: fbData.nickname || '',
        class: fbData.class,
        batch: String(fbData.batch),
        startDate: fbData.startDate,
        sessionDuration: fbData.sessionDuration,
        daysLeft: 30
      };
    } else {
      // GERBANG A: MODE NORMAL (GitHub u.json)
      const ghRes = await fetch(JEC.config.DATA + 'u.json?v=' + Date.now());
      const ghData = await ghRes.json();
      
      const student = (ghData.students || []).find(s => String(s.id) === String(id));
      
      if (!student) return { success: false, msg: JEC.lang === 'id' ? 'ID tidak ditemukan.' : 'ID not found.' };
      if (String(student.pin) !== String(pin)) return { success: false, msg: JEC.lang === 'id' ? 'PIN salah.' : 'Invalid PIN.' };
      if (student.active === false) return { success: false, msg: JEC.lang === 'id' ? 'Akun tidak aktif.' : 'Account inactive.' };
      
      userData = {
        id: String(student.id),
        name: student.name,
        nickname: student.nickname || '',
        class: student.class,
        batch: String(student.batch),
        startDate: student.startDate,
        sessionDuration: student.sessionDuration,
        daysLeft: student.sessionDuration || 30
      };
    }
    
    // Step 2: Login berhasil
    JEC.user = userData;
    localStorage.setItem('jec_user', JSON.stringify(JEC.user));
    
    await JEC.loadAllData();
    JEC.checkDailyChallenge();
    JEC.checkAllAchievements();
    JEC.logActivity('login', 'Login successful via ' + loginMode);
    localStorage.setItem('jec_last_login_' + JEC.user.id, Date.now());
    
    // Update stats
    JEC.stats.loginCount = (JEC.stats.loginCount || 0) + 1;
    JEC.stats.hasProfile = true;
    
    return { success: true };
    
  } catch (e) {
    console.error('[JEC] Login Error:', e);
    return { success: false, msg: JEC.t('network_error') + ': ' + e.message };
  }
};

// ═══════════════════════════════════════════════════
// AUTO-LOGIN (ROBUST - tidak paksa login ulang)
// ═══════════════════════════════════════════════════
JEC.autoLogin = async function(u) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const data = await JEC.apiGet({ action: 'check_session', id: u.id });
    clearTimeout(timeout);
    
    if (data && data.active === true) {
      JEC.user = u;
      JEC.user.daysLeft = data.daysLeft || u.daysLeft || 30;
      await JEC.loadAllData();
      JEC.checkDailyChallenge();
      JEC.checkAllAchievements();
      console.log('[JEC] Auto-login sukses (session valid)');
      return true;
    } else if (data && data.active === false) {
      console.warn('[JEC] Session expired');
      localStorage.removeItem('jec_user');
      JEC.user = null;
      return false;
    } else {
      // Response aneh, lanjut dengan data lokal
      JEC.user = u;
      await JEC.loadAllData();
      return true;
    }
  } catch (e) {
    // API gagal → JANGAN hapus user, lanjut dengan data lokal
    console.warn('[JEC] check_session gagal, fallback lokal:', e.message);
    
    try {
      JEC.user = u;
      JEC.user.daysLeft = u.daysLeft || 30;
      await JEC.loadAllData();
      JEC.checkDailyChallenge();
      JEC.checkAllAchievements();
      console.log('[JEC] Auto-login sukses (fallback lokal)');
      return true;
    } catch (e2) {
      // Semua gagal, tetap masuk dashboard
      console.error('[JEC] Semua load gagal, tetap masuk:', e2.message);
      JEC.user = u;
      return true;
    }
  }
};

// ═══════════════════════════════════════════════════
// LOGOUT (FIXED - berfungsi)
// ═══════════════════════════════════════════════════
JEC.logout = function() {
  localStorage.removeItem('jec_user');
  localStorage.removeItem('jec_login_mode');
  JEC.user = null;
  JEC.appState = 'boot';
  JEC.dashboardReady = false;
  
  // Stop FLM jika aktif
  if (JEC.flmTimer) {
    clearInterval(JEC.flmTimer);
    JEC.flmTimer = null;
  }
  JEC.flmActive = false;
  
  // Close logout overlay
  JEC.closeOv('ov-logout');
  
  // Reload page
  location.reload();
};

// ═══════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════
JEC.loadAllData = async function() {
  try {
    // Load 5 modul materi dari GitHub
    const modules = ['spe', 'voc', 'gra', 'wri', 'lis'];
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      try {
        const r = await fetch(JEC.config.DATA + m + '.json?v=' + Date.now());
        if (r.ok) JEC.materiData[m] = await r.json();
      } catch (e) {}
    }
    
    // Load ext.json
    try {
      const er = await fetch(JEC.config.DATA + 'ext.json?v=' + Date.now());
      if (er.ok) JEC.extData = await er.json();
    } catch (e) {}
    
    // Load lb.json (logbook)
    try {
      const lr = await fetch(JEC.config.DATA + 'lb.json?v=' + Date.now());
      if (er.ok) JEC.lbData = await lr.json();
    } catch (e) {}
    
    // Load progress dari Apps Script
    try {
      const pr = await JEC.apiGet({ action: 'fetch_progress', id: JEC.user.id });
      JEC.progressMap = {};
      if (Array.isArray(pr)) {
        pr.forEach(function(p) {
          JEC.progressMap[p.module + '_' + p.unitId + '_' + p.partId] = p.status;
        });
      }
    } catch (e) {}
    
    // Load leaderboard dari Apps Script
    try {
      const lbr = await JEC.apiGet({ action: 'fetch_leaderboard', batch: JEC.user.batch });
      if (Array.isArray(lbr)) JEC.leaderboardData = lbr;
    } catch (e) {}
    
    // Load local data
    JEC.unlockedAch = JSON.parse(localStorage.getItem('jec_ach_' + JEC.user.id) || '[]');
    JEC.bookmarkList = JSON.parse(localStorage.getItem('jec_bm_' + JEC.user.id) || '[]');
    JEC.notesMap = JSON.parse(localStorage.getItem('jec_notes_' + JEC.user.id) || '{}');
    
    JEC.updateStats();
  } catch (e) {
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

// ═══════════════════════════════════════════════════
// CLOCK & GREETING
// ═══════════════════════════════════════════════════
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
    let greetKey = 'greet.morning';
    if (hour >= 12 && hour < 15) greetKey = 'greet.afternoon';
    else if (hour >= 15 && hour < 18) greetKey = 'greet.evening';
    else if (hour >= 18 || hour < 5) greetKey = 'greet.night';
    greetEl.textContent = JEC.t(greetKey);
  }
};

// ═══════════════════════════════════════════════════
// HASH ROUTER
// ═══════════════════════════════════════════════════
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
  
  if (!JEC.materiData[module]) return;
  
  const materi = JEC.materiData[module] || {};
  const unit = (materi.materials || {})[unitId];
  if (!unit) return;
  
  const part = (unit.parts || {})[partId];
  if (!part) return;
  
  JEC.switchView('learn');
  JEC.currentModule = module;
  JEC.currentUnitId = unitId;
  JEC.currentPartId = partId;
  JEC.renderPlayer(module, unitId, partId);
};

JEC.updateHash = function(module, unitId, partId) {
  if (module && unitId && partId) {
    window.location.hash = module + '/' + unitId + '/' + partId;
  } else {
    history.replaceState(null, null, ' ');
  }
};

// ═══════════════════════════════════════════════════
// THEME & LANGUAGE
// ═══════════════════════════════════════════════════
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
  
  // Re-render active view
  if (JEC.dashboardReady) {
    JEC.renderActiveView();
  }
};

JEC.t = function(key) {
  if (!key) return '';
  const i18nObj = (JEC.config.I18N) || {};
  const parts = key.split('.');
  let obj = i18nObj;
  for (let i = 0; i < parts.length; i++) {
    if (obj[parts[i]] === undefined) return key;
    obj = obj[parts[i]];
  }
  // Handle {en: ..., id: ...} format
  if (obj && typeof obj === 'object' && (obj.en || obj.id)) {
    return obj[JEC.lang] || obj.en || key;
  }
  return obj;
};

// ═══════════════════════════════════════════════════
// OFFLINE DETECTION
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
// CUSTOM LOGO & HEADER BG
// ═══════════════════════════════════════════════════
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
  
  if (bgType === 'image' && bgUrl) {
    headerBg.style.backgroundImage = 'url(' + bgUrl + ')';
    headerBg.style.backgroundSize = 'cover';
    headerBg.style.backgroundPosition = 'center';
  }
};

// ═══════════════════════════════════════════════════
// HEADER CHIPS & NAV AVATAR
// ═══════════════════════════════════════════════════
JEC.updateHeaderChips = function() {
  if (!JEC.user) return;
  
  const chipId = document.getElementById('chip-id');
  const chipClass = document.getElementById('chip-class');
  const chipDays = document.getElementById('chip-days');
  const chipProgress = document.getElementById('chip-progress');
  const chipStreak = document.getElementById('chip-streak');
  
  if (chipId) chipId.textContent = (JEC.user.id || '-').toUpperCase();
  if (chipClass) chipClass.textContent = (JEC.user.class || '-').toUpperCase();
  if (chipDays) chipDays.textContent = (JEC.user.daysLeft || 0) + 'd';
  
  const total = JEC.countTotalParts();
  if (chipProgress) chipProgress.textContent = (JEC.stats.partsDone || 0) + '/' + total;
  if (chipStreak) chipStreak.textContent = JEC.stats.streak || 0;
};

JEC.countTotalParts = function() {
  let total = 0;
  Object.keys(JEC.materiData).forEach(function(m) {
    const materi = JEC.materiData[m] || {};
    const materials = materi.materials || {};
    Object.keys(materials).forEach(function(u) {
      const unit = materials[u] || {};
      total += Object.keys(unit.parts || {}).length;
    });
  });
  return total;
};

JEC.updateNavAvatar = function() {
  const navAvIcon = document.getElementById('nav-av-icon');
  if (!navAvIcon) return;
  
  const av = JEC.avatar || 'boy';
  navAvIcon.textContent = av === 'girl' ? 'girl' : 'boy';
};

// ═══════════════════════════════════════════════════
// API WRAPPER
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
// LOGGING & HEARTBEAT
// ═══════════════════════════════════════════════════
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
  } catch (e) {
    JEC.onlineCount = 0;
  }
};

// Heartbeat interval
setInterval(function() {
  if (JEC.user) {
    JEC.heartbeat();
    JEC.fetchOnlineCount();
  }
}, 30000);

// ═══════════════════════════════════════════════════
// VIEW ROUTER
// ═══════════════════════════════════════════════════
JEC.switchView = function(name, btn) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  const target = document.getElementById('view-' + name);
  if (target) target.classList.add('active');
  
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  
  JEC.activeView = name;
  
  // Render view content
  JEC.renderActiveView();
  
  // Hide FLM FAB saat tidak di learn
  JEC.updateFLMVisibility();
};

JEC.renderActiveView = function() {
  if (JEC.activeView === 'learn') JEC.renderLearn();
  else if (JEC.activeView === 'practice') JEC.renderPractice();
  else if (JEC.activeView === 'extra') JEC.renderExtra();
  else if (JEC.activeView === 'profile') JEC.renderProfile();
};

// ═══════════════════════════════════════════════════
// RENDER LEARN (5 modul, units grid)
// ═══════════════════════════════════════════════════
JEC.renderLearn = function() {
  const container = document.getElementById('feat-learn');
  if (!container) return;
  
  const modules = JEC.config.MODULES || {};
  let html = '<div class="grid">';
  
  Object.keys(modules).forEach(function(mKey) {
    const mInfo = modules[mKey];
    const materi = JEC.materiData[mKey] || {};
    const materials = materi.materials || {};
    const unitCount = Object.keys(materials).length;
    
    // Count done parts
    let doneCount = 0, totalParts = 0;
    Object.keys(materials).forEach(function(uId) {
      const unit = materials[uId] || {};
      const parts = unit.parts || {};
      Object.keys(parts).forEach(function(pId) {
        totalParts++;
        if (JEC.progressMap[mKey + '_' + uId + '_' + pId] === 'done') doneCount++;
      });
    });
    
    const pct = totalParts ? Math.round(doneCount / totalParts * 100) : 0;
    const mName = JEC.lang === 'id' ? (mInfo.id || mKey) : (mInfo.en || mKey);
    
    html += '<div class="card" onclick="JEC.openModule(\'' + mKey + '\')">';
    html += '<h4><span class="material-icons-round">' + mInfo.icon + '</span>';
    html += '<span style="flex:1">' + JEC.esc(mName) + '</span></h4>';
    html += '<div class="sub">' + unitCount + ' units · ' + doneCount + '/' + totalParts + ' parts done</div>';
    
    if (totalParts > 0) {
      html += '<div style="margin:.3rem 0"><div style="background:var(--sf2);height:5px;border-radius:3px;overflow:hidden">';
      html += '<div style="background:var(--p);height:100%;width:' + pct + '%;border-radius:3px"></div></div></div>';
    }
    
    html += '</div>';
  });
  
  html += '</div>';
  container.innerHTML = html;
};

JEC.openModule = function(mKey) {
  JEC.currentModule = mKey;
  JEC.renderUnitsList(mKey);
};

JEC.renderUnitsList = function(mKey) {
  const container = document.getElementById('feat-learn');
  if (!container) return;
  
  const modules = JEC.config.MODULES || {};
  const mInfo = modules[mKey] || {};
  const materi = JEC.materiData[mKey] || {};
  const materials = materi.materials || {};
  const mName = JEC.lang === 'id' ? (mInfo.id || mKey) : (mInfo.en || mKey);
  
  let html = '<div class="compact-hdr">';
  html += '<button class="icon-btn" onclick="JEC.renderLearn()"><span class="material-icons-round">arrow_back</span></button>';
  html += '<h3>' + JEC.esc(mName) + '</h3>';
  html += '</div>';
  
  const unitIds = Object.keys(materials);
  if (!unitIds.length) {
    html += '<div class="load-state"><span class="material-icons-round" style="animation:none">inbox</span><div>No units yet</div></div>';
    container.innerHTML = html;
    return;
  }
  
  unitIds.forEach(function(uId) {
    const unit = materials[uId] || {};
    if (unit.hidden) return;
    
    const locked = unit.locked === true;
    const parts = unit.parts || {};
    const partIds = Object.keys(parts);
    
    let doneCount = 0;
    partIds.forEach(function(pId) {
      if (JEC.progressMap[mKey + '_' + uId + '_' + pId] === 'done') doneCount++;
    });
    
    const pct = partIds.length ? Math.round(doneCount / partIds.length * 100) : 0;
    
    html += '<div class="row' + (pct === 100 ? ' done' : '') + '" ' + (locked ? '' : 'onclick="JEC.openUnit(\'' + mKey + '\',\'' + uId + '\')"') + '>';
    html += '<div class="row-main">';
    html += '<span class="material-icons-round">' + (locked ? 'lock' : (pct === 100 ? 'check_circle' : 'folder')) + '</span>';
    html += '<div><div class="row-t">' + JEC.esc(unit.title || uId) + '</div>';
    html += '<div class="row-s">' + partIds.length + ' parts · ' + doneCount + ' done</div></div>';
    html += '</div>';
    html += '<span class="material-icons-round tx-m">chevron_right</span>';
    html += '</div>';
  });
  
  container.innerHTML = html;
};

JEC.openUnit = function(mKey, uId) {
  JEC.currentModule = mKey;
  JEC.currentUnitId = uId;
  JEC.renderPartsList(mKey, uId);
};

JEC.renderPartsList = function(mKey, uId) {
  const container = document.getElementById('feat-learn');
  if (!container) return;
  
  const materi = JEC.materiData[mKey] || {};
  const unit = (materi.materials || {})[uId] || {};
  const parts = unit.parts || {};
  
  let html = '<div class="compact-hdr">';
  html += '<button class="icon-btn" onclick="JEC.renderUnitsList(\'' + mKey + '\')"><span class="material-icons-round">arrow_back</span></button>';
  html += '<h3>' + JEC.esc(unit.title || uId) + '</h3>';
  html += '</div>';
  
  const partIds = Object.keys(parts);
  if (!partIds.length) {
    html += '<div class="load-state"><span class="material-icons-round" style="animation:none">inbox</span><div>No parts yet</div></div>';
    container.innerHTML = html;
    return;
  }
  
  partIds.forEach(function(pId) {
    const part = parts[pId] || {};
    if (part.hidden) return;
    
    const locked = part.locked === true;
    const done = JEC.progressMap[mKey + '_' + uId + '_' + pId] === 'done';
    
    html += '<div class="row' + (done ? ' done' : '') + '" ' + (locked ? '' : 'onclick="JEC.openPart(\'' + mKey + '\',\'' + uId + '\',\'' + pId + '\')"') + '>';
    html += '<div class="row-main">';
    html += '<span class="material-icons-round">' + (locked ? 'lock' : (done ? 'check_circle' : 'play_circle')) + '</span>';
    html += '<div><div class="row-t">' + JEC.esc(part.title || pId) + '</div>';
    html += '<div class="row-s">' + pId + (done ? ' · done' : '') + '</div></div>';
    html += '</div>';
    html += '<span class="material-icons-round tx-m">chevron_right</span>';
    html += '</div>';
  });
  
  container.innerHTML = html;
};

JEC.openPart = function(mKey, uId, pId) {
  JEC.currentModule = mKey;
  JEC.currentUnitId = uId;
  JEC.currentPartId = pId;
  JEC.updateHash(mKey, uId, pId);
  JEC.renderPlayer(mKey, uId, pId);
  
  // Show FLM FAB karena sudah di dalam part
  JEC.updateFLMVisibility();
};

// ═══════════════════════════════════════════════════
// RENDER PLAYER (Materi + TTS)
// ═══════════════════════════════════════════════════
JEC.renderPlayer = function(mKey, uId, pId) {
  const container = document.getElementById('feat-learn');
  if (!container) return;
  
  const materi = JEC.materiData[mKey] || {};
  const unit = (materi.materials || {})[uId] || {};
  const part = (unit.parts || {})[pId] || {};
  
  let html = '<div class="compact-hdr">';
  html += '<button class="icon-btn" onclick="JEC.renderPartsList(\'' + mKey + '\',\'' + uId + '\')"><span class="material-icons-round">arrow_back</span></button>';
  html += '<div style="flex:1;text-align:left">';
  html += '<div style="font-size:.64rem;opacity:.85;text-transform:uppercase;letter-spacing:1px">' + JEC.esc(unit.title || uId) + '</div>';
  html += '<div style="font-size:.92rem;font-weight:800">' + JEC.esc(part.title || pId) + '</div>';
  html += '</div>';
  html += '</div>';
  
  // TTS button
  html += '<div class="au">';
  html += '<button class="btn" onclick="JEC.playTTS()"><span class="material-icons-round">volume_up</span> ' + (JEC.lang === 'id' ? 'Putar Audio' : 'Play Audio') + '</button>';
  
  const done = JEC.progressMap[mKey + '_' + uId + '_' + pId] === 'done';
  html += '<div id="pl-done" class="done-ind"' + (done ? '' : ' style="display:none"') + '>';
  html += '<span class="material-icons-round">check_circle</span> Done!</div>';
  html += '</div>';
  
  // Content
  html += '<div class="trans-box">';
  html += '<div class="sec-t"><span class="material-icons-round">auto_stories</span> Material</div>';
  
  const vocab = JEC.parseVocab(part);
  if (vocab.length) {
    html += '<table class="vocab"><thead><tr><th>English</th><th>Indonesian</th></tr></thead><tbody>';
    vocab.forEach(function(v) {
      const bm = JEC.bookmarkList.find(function(x) { return x.indexOf(v.en) >= 0; });
      html += '<tr><td>';
      html += '<span class="material-icons-round ic' + (bm ? ' on' : '') + '" onclick="JEC.toggleBookmarkWord(\'' + JEC.esc(v.en) + '\',\'' + JEC.esc(v.id) + '\',\'' + mKey + '\',\'' + uId + '\',\'' + pId + '\')">';
      html += (bm ? 'bookmark' : 'bookmark_border') + '</span>';
      html += JEC.esc(v.en);
      html += ' <span class="material-icons-round ic" onclick="JEC.speakWord(\'' + JEC.esc(v.en) + '\')">volume_up</span>';
      html += '</td><td>' + JEC.esc(v.id) + '</td></tr>';
    });
    html += '</tbody></table>';
    window._jecTts = vocab.map(function(v) { return v.en; });
  } else {
    const sentences = JEC.buildSentences(part.transcript || '');
    window._jecTts = sentences;
    html += sentences.map(function(s) {
      return '<div style="margin-bottom:.6rem">' + JEC.esc(s) + '</div>';
    }).join('');
  }
  
  html += '</div>';
  
  // Notes
  const noteKey = mKey + '_' + uId + '_' + pId;
  const noteContent = JEC.notesMap[noteKey] || '';
  html += '<div class="note-box">';
  html += '<div class="tx-m" style="font-weight:700;font-size:.7rem;margin-bottom:.4rem">';
  html += '<span class="material-icons-round" style="font-size:14px;color:var(--p)">edit_note</span> MY NOTES</div>';
  html += '<textarea id="note-ta" placeholder="Write notes..." oninput="JEC.saveNote(\'' + mKey + '\',\'' + uId + '\',\'' + pId + '\')">' + JEC.esc(noteContent) + '</textarea>';
  html += '</div>';
  
  container.innerHTML = html;
  
  JEC.logActivity('open_materi', mKey + '/' + uId + '/' + pId);
};

JEC.parseVocab = function(part) {
  const v = part.vocab;
  if (Object.prototype.toString.call(v) === '[object Array]') return v;
  return JEC.parseLines(part.transcript || '');
};

JEC.parseLines = function(t) {
  const L = String(t).split(/\n/).map(function(l) { return l.trim(); }).filter(Boolean);
  if (!L.some(function(l) { return /(\||=|->)/.test(l); })) return [];
  return L.map(function(l) {
    const sep = l.indexOf('|') >= 0 ? '|' : (l.indexOf('->') >= 0 ? '->' : '=');
    const i = l.indexOf(sep);
    return { en: l.slice(0, i).trim(), id: l.slice(i + sep.length).trim() };
  });
};

JEC.buildSentences = function(t) {
  const c = String(t || '').replace(/\[\d{1,2}:\d{2}\]/g, ' ');
  const m = c.match(/[^.!?\n]+[.!?]*/g) || [];
  return m.map(function(s) { return s.trim(); }).filter(Boolean);
};

JEC.speakWord = function(w) {
  const u = new SpeechSynthesisUtterance(w);
  u.lang = 'en-US';
  speechSynthesis.speak(u);
};

JEC.playTTS = function() {
  if (!window._jecTts || !window._jecTts.length) {
    JEC.toast(JEC.t('no_audio') || 'No audio content', 'warning');
    return;
  }
  
  if (JEC.ttsOn) {
    JEC.ttsOn = false;
    speechSynthesis.cancel();
    return;
  }
  
  JEC.ttsOn = true;
  JEC.ttsIdx = 0;
  JEC.speakAt(0);
};

JEC.speakAt = function(i) {
  if (!JEC.ttsOn) return;
  if (i >= window._jecTts.length) {
    JEC.ttsOn = false;
    JEC.onTTSDone();
    return;
  }
  
  JEC.ttsIdx = i;
  const u = new SpeechSynthesisUtterance(window._jecTts[i]);
  u.lang = 'en-US';
  u.rate = JEC.ttsRate;
  u.onend = function() { if (JEC.ttsOn) JEC.speakAt(i + 1); };
  u.onerror = function() { if (JEC.ttsOn) JEC.speakAt(i + 1); };
  speechSynthesis.speak(u);
};

JEC.onTTSDone = function() {
  if (!JEC.currentModule || !JEC.currentUnitId || !JEC.currentPartId) return;
  
  JEC.markDone(JEC.currentModule, JEC.currentUnitId, JEC.currentPartId, 100);
  
  const doneEl = document.getElementById('pl-done');
  if (doneEl) doneEl.style.display = 'flex';
  
  JEC.confetti();
  
  // Show react/feedback overlay
  JEC.showReactOverlay();
};

// ═══════════════════════════════════════════════════
// RENDER PRACTICE
// ═══════════════════════════════════════════════════
JEC.renderPractice = function() {
  const container = document.getElementById('feat-practice');
  if (!container) return;
  
  let html = '<div class="grid">';
  
  const practiceCards = [
    { icon: 'quiz', title: 'Multiple Choice', desc: 'Test vocabulary', ext: 'ext_mcq' },
    { icon: 'style', title: 'Flashcards', desc: 'Flip EN/ID cards', ext: 'ext_flash' },
    { icon: 'headphones', title: 'Listening', desc: 'Hear & choose', ext: 'ext_listen' },
    { icon: 'shuffle', title: 'Word Scramble', desc: 'Rearrange letters', ext: 'ext_scramble' },
    { icon: 'construction', title: 'Sentence Builder', desc: 'Make sentences', ext: 'ext_sentence' },
    { icon: 'menu_book', title: 'Dictionary', desc: 'Search words', ext: 'ext_dict' }
  ];
  
  practiceCards.forEach(function(c) {
    html += '<div class="card" onclick="JEC.openExtFeature(\'' + c.ext + '\')">';
    html += '<h4><span class="material-icons-round">' + c.icon + '</span>';
    html += '<span style="flex:1">' + c.title + '</span></h4>';
    html += '<div class="sub">' + c.desc + '</div>';
    html += '</div>';
  });
  
  html += '</div>';
  
  // Leaderboard
  html += '<div style="margin-top:1.1rem">';
  html += '<div class="sec-t"><span class="material-icons-round">leaderboard</span> Leaderboard</div>';
  html += '<div id="practice-lb-box">';
  html += JEC.renderLeaderboardHTML();
  html += '</div></div>';
  
  container.innerHTML = html;
};

JEC.openExtFeature = function(extId) {
  // Delegate ke ext.js router
  if (typeof JEC_EXT !== 'undefined' && JEC_EXT.goTo) {
    const featureId = extId.replace('ext_', '');
    JEC_EXT.goTo(featureId);
  } else {
    JEC.toast('Feature router not loaded', 'error');
  }
};

JEC.renderLeaderboardHTML = function() {
  const rows = JEC.leaderboardData || [];
  if (!rows.length) {
    return '<div class="load-state"><span class="material-icons-round" style="animation:none">leaderboard</span><div>' + JEC.t('leaderboard_empty') + '</div></div>';
  }
  
  const me = JEC.user ? String(JEC.user.id) : '';
  let html = '';
  
  rows.slice(0, 10).forEach(function(r, i) {
    const isMe = String(r.id) === me;
    const xp = Number(r.totalXp) || Number(r.poin) || 0;
    html += '<div class="lb' + (isMe ? ' me' : '') + '">';
    html += '<div class="rk">' + (i + 1) + '</div>';
    html += '<div class="nm">' + JEC.esc(r.name || r.nama || r.id) + (isMe ? ' <span class="tag full">YOU</span>' : '') + '</div>';
    html += '<div class="pt">' + xp + ' pt</div>';
    html += '</div>';
  });
  
  return html;
};

// ═══════════════════════════════════════════════════
// RENDER EXTRA (4 sub-tabs: Tools, Games, Logbook, Overview)
// ═══════════════════════════════════════════════════
JEC.renderExtra = function() {
  // Default: render tools
  JEC.extraTab('tools');
};

JEC.extraTab = function(tabName, btn) {
  // Hide all sub-tabs
  ['tools', 'games', 'logbook', 'overview'].forEach(function(t) {
    const el = document.getElementById('extra-' + t);
    if (el) el.classList.toggle('hid', t !== tabName);
  });
  
  // Update tab buttons
  const tabsBar = document.getElementById('extra-tabs-bar');
  if (tabsBar) {
    tabsBar.querySelectorAll('button').forEach(function(b) {
      b.classList.remove('active');
      if (b.dataset.tab === tabName) b.classList.add('active');
    });
  }
  
  // Render content
  if (tabName === 'tools') JEC.renderExtraTools();
  else if (tabName === 'games') JEC.renderExtraGames();
  else if (tabName === 'logbook') JEC.renderLogbook();
  else if (tabName === 'overview') JEC.renderOverview();
};

JEC.renderExtraTools = function() {
  const container = document.getElementById('extra-tools');
  if (!container) return;
  
  let html = '<div class="grid">';
  
  const tools = [
    { icon: 'psychology', title: 'Memorize It', desc: 'Hafal kalimat', ext: 'ext_mem' },
    { icon: 'quiz', title: 'Multiple Choice', desc: 'Vocab quiz', ext: 'ext_mcq' },
    { icon: 'style', title: 'Flashcards', desc: 'Flip cards', ext: 'ext_flash' },
    { icon: 'headphones', title: 'Listening', desc: 'Hear & choose', ext: 'ext_listen' },
    { icon: 'shuffle', title: 'Scramble', desc: 'Rearrange', ext: 'ext_scramble' },
    { icon: 'construction', title: 'Sentence Builder', desc: 'Make sentence', ext: 'ext_sentence' },
    { icon: 'menu_book', title: 'Dictionary', desc: 'Search', ext: 'ext_dict' }
  ];
  
  tools.forEach(function(tl) {
    html += '<div class="card" onclick="JEC.openExtFeature(\'' + tl.ext + '\')">';
    html += '<h4><span class="material-icons-round">' + tl.icon + '</span>';
    html += '<span style="flex:1">' + tl.title + '</span></h4>';
    html += '<div class="sub">' + tl.desc + '</div>';
    html += '</div>';
  });
  
  html += '</div>';
  container.innerHTML = html;
};

JEC.renderExtraGames = function() {
  const container = document.getElementById('extra-games');
  if (!container) return;
  
  let html = '<div class="grid">';
  
  const games = [
    { icon: 'drag_indicator', title: 'Drag & Drop', locked: true },
    { icon: 'task_alt', title: 'True / False', locked: true },
    { icon: 'shuffle', title: 'Scramble', locked: false, ext: 'ext_scramble' },
    { icon: 'spellcheck', title: 'Anagram', locked: true },
    { icon: 'style', title: 'Flash Card', locked: false, ext: 'ext_flash' },
    { icon: 'search', title: 'Find Match', locked: true }
  ];
  
  games.forEach(function(g) {
    const onclick = g.locked ? 'JEC.toast(\'Coming Soon\', \'info\')' : 'JEC.openExtFeature(\'' + g.ext + '\')';
    html += '<div class="card' + (g.locked ? ' lk' : '') + '" onclick="' + onclick + '">';
    html += '<h4><span class="material-icons-round">' + (g.locked ? 'lock' : g.icon) + '</span>';
    html += '<span style="flex:1">' + g.title + '</span></h4>';
    html += '<span class="tag' + (g.locked ? '' : ' full') + '">' + (g.locked ? 'Locked' : 'Open') + '</span>';
    html += '</div>';
  });
  
  html += '</div>';
  container.innerHTML = html;
};

// ═══════════════════════════════════════════════════
// RENDER LOGBOOK (Built-in di Extra, data dari d/lb.json)
// ═══════════════════════════════════════════════════
JEC.renderLogbook = function() {
  const container = document.getElementById('extra-logbook');
  if (!container) return;
  
  const lbData = JEC.lbData || {};
  const allSessions = lbData.sessions || [];
  const filterId = JEC.user ? String(JEC.user.id) : '';
  
  // Filter by current user
  let sessions = allSessions.filter(function(s) {
    return String(s.studentId) === filterId;
  });
  
  // Sort by date descending
  sessions.sort(function(a, b) {
    return new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'));
  });
  
  if (!sessions.length) {
    container.innerHTML = '<div class="load-state">' +
      '<span class="material-icons-round" style="animation:none">menu_book</span>' +
      '<div style="font-weight:700;margin-top:.5rem">' + JEC.t('logbook_empty') + '</div>' +
      '<div style="font-size:.72rem;margin-top:.3rem">' + JEC.t('logbook_hint') + '</div>' +
      '</div>';
    return;
  }
  
  let html = '<div class="logbook-list">';
  
  sessions.forEach(function(session) {
    const dateStr = JEC.formatDate(session.date);
    const modules = JEC.config.MODULES || {};
    const modInfo = modules[session.module] || null;
    const modIcon = modInfo ? modInfo.icon : 'folder';
    const modName = modInfo ? (JEC.lang === 'id' ? modInfo.id : modInfo.en) : (session.module || '-');
    
    html += '<div class="logbook-item">';
    
    // Header
    html += '<div class="logbook-item-hdr">';
    html += '<div class="logbook-date"><span class="material-icons-round">event</span>' + JEC.esc(dateStr) + '</div>';
    html += '<div class="logbook-time">' + JEC.esc(session.time || '') + ' · ' + (session.duration || 60) + ' min</div>';
    html += '</div>';
    
    // Meta
    html += '<div class="logbook-meta">';
    html += '<span class="tag"><span class="material-icons-round" style="font-size:10px;vertical-align:middle">' + modIcon + '</span> ' + JEC.esc(modName) + '</span>';
    if (session.unit) html += '<span class="tag">' + JEC.esc(session.unit) + '</span>';
    if (session.part) html += '<span class="tag">' + JEC.esc(session.part) + '</span>';
    html += '</div>';
    
    // Notes
    if (session.notes) {
      html += '<div class="logbook-notes">' + JEC.esc(session.notes) + '</div>';
    }
    
    // Homework
    if (session.homework) {
      html += '<div class="logbook-hw">';
      html += '<span class="material-icons-round">task</span>';
      html += '<div><b>' + JEC.t('homework') + ':</b> ' + JEC.esc(session.homework) + '</div>';
      html += '</div>';
    }
    
    // Next session
    if (session.nextSession) {
      html += '<div class="logbook-next">';
      html += '<span class="material-icons-round">event_note</span>';
      html += JEC.t('next_session') + ': ' + JEC.formatDate(session.nextSession);
      html += '</div>';
    }
    
    html += '</div>';
  });
  
  html += '</div>';
  container.innerHTML = html;
};

JEC.formatDate = function(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const days = JEC.lang === 'id' 
      ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = JEC.lang === 'id'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  } catch (e) {
    return dateStr;
  }
};

// ═══════════════════════════════════════════════════
// RENDER OVERVIEW (Leaderboard dari Apps Script)
// ═══════════════════════════════════════════════════
JEC.renderOverview = async function() {
  const container = document.getElementById('extra-overview');
  if (!container) return;
  
  container.innerHTML = '<div class="load-state"><span class="material-icons-round">sync</span>' + JEC.t('loading_more') + '</div>';
  
  try {
    // Fetch leaderboard dari Apps Script
    const rows = await JEC.apiGet({ action: 'fetch_leaderboard', batch: JEC.user.batch });
    JEC.leaderboardData = Array.isArray(rows) ? rows : [];
    
    if (!JEC.leaderboardData.length) {
      container.innerHTML = '<div class="load-state">' +
        '<span class="material-icons-round" style="animation:none">leaderboard</span>' +
        '<div style="font-weight:700;margin-top:.5rem">' + JEC.t('leaderboard_empty') + '</div>' +
        '</div>';
      return;
    }
    
    // Sort by XP
    JEC.leaderboardData.sort(function(a, b) {
      return (Number(b.totalXp) || Number(b.poin) || 0) - (Number(a.totalXp) || Number(a.poin) || 0);
    });
    
    const me = JEC.user ? String(JEC.user.id) : '';
    const totalStudents = JEC.leaderboardData.length;
    const totalPoints = JEC.leaderboardData.reduce(function(sum, r) {
      return sum + (Number(r.totalXp) || Number(r.poin) || 0);
    }, 0);
    const myIdx = JEC.leaderboardData.findIndex(function(r) { return String(r.id) === me; });
    
    let html = '';
    
    // Stats cards
    html += '<div class="ov-stat">';
    html += '<div class="ov-stat-card"><div class="v">' + totalStudents + '</div><div class="l">Total Students</div></div>';
    html += '<div class="ov-stat-card"><div class="v">' + totalPoints + '</div><div class="l">Total Points</div></div>';
    html += '<div class="ov-stat-card"><div class="v">' + (myIdx >= 0 ? '#' + (myIdx + 1) : '-') + '</div><div class="l">Your Rank</div></div>';
    html += '</div>';
    
    // Podium (top 3)
    if (JEC.leaderboardData.length >= 3) {
      const podium = [JEC.leaderboardData[1], JEC.leaderboardData[0], JEC.leaderboardData[2]];
      const classes = ['silver', 'gold', 'bronze'];
      const medals = ['🥈', '🥇', '🥉'];
      
      html += '<div class="ov-podium">';
      for (let i = 0; i < 3; i++) {
        const p = podium[i];
        const pts = Number(p.totalXp) || Number(p.poin) || 0;
        html += '<div class="ov-podium-card ' + classes[i] + '">';
        html += '<span class="medal">' + medals[i] + '</span>';
        html += '<div class="av-mini"><span class="material-icons-round" style="font-size:20px;color:var(--p)">person</span></div>';
        html += '<div class="nm">' + JEC.esc(p.name || p.nama || p.id) + '</div>';
        html += '<div class="pt">' + pts + ' pt</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    
    // All rankings
    html += '<div class="sec-t"><span class="material-icons-round">format_list_numbered</span> All Rankings</div>';
    html += '<div style="max-height:50vh;overflow-y:auto">';
    
    JEC.leaderboardData.forEach(function(r, i) {
      const isMe = String(r.id) === me;
      const pts = Number(r.totalXp) || Number(r.poin) || 0;
      const streak = Number(r.streak) || 0;
      
      html += '<div class="lb' + (isMe ? ' me' : '') + '">';
      html += '<div class="rk">' + (i + 1) + '</div>';
      html += '<div class="nm">' + JEC.esc(r.name || r.nama || r.id);
      if (r.batch) html += ' <span class="tag" style="font-size:.52rem;padding:.05rem .3rem">' + JEC.esc(r.batch) + '</span>';
      if (isMe) html += ' <span class="tag full" style="font-size:.52rem;padding:.05rem .3rem">YOU</span>';
      html += '</div>';
      html += '<div class="pt"><b style="color:var(--p)">' + pts + '</b> pt' + (streak > 0 ? ' · 🔥' + streak : '') + '</div>';
      html += '</div>';
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
  } catch (e) {
    container.innerHTML = '<div class="err-state">' +
      '<span class="material-icons-round">error_outline</span>' +
      '<div>Failed to load overview</div>' +
      '<code>' + JEC.esc(e.message) + '</code>' +
      '<button class="btn dg" style="margin-top:.6rem" onclick="JEC.renderOverview()">' +
      '<span class="material-icons-round">refresh</span> Retry</button>' +
      '</div>';
  }
};

// ═══════════════════════════════════════════════════
// RENDER PROFILE (Avatar Boy/Girl, 40 Ach, BM, Notes)
// ═══════════════════════════════════════════════════
JEC.renderProfile = function() {
  const container = document.getElementById('feat-profile');
  if (!container || !JEC.user) return;
  
  let html = '';
  
  // Avatar
  html += '<div class="pf-avatar-wrap">';
  html += '<div class="pf-avatar" onclick="JEC.openOv(\'ov-avatar\')">';
  html += '<span class="material-icons-round" style="font-size:3rem;color:#fff">' + (JEC.avatar === 'girl' ? 'girl' : 'boy') + '</span>';
  html += '</div></div>';
  
  // Name & meta
  html += '<div class="pf-name">' + JEC.esc(JEC.user.name) + '</div>';
  html += '<div class="pf-meta-row">';
  html += '<span class="material-icons-round">badge</span>';
  html += '<span>' + JEC.esc((JEC.user.id || '').toUpperCase()) + '</span>';
  html += '<span class="material-icons-round">circle</span>';
  html += '<span class="material-icons-round">school</span>';
  html += '<span>' + JEC.esc((JEC.user.class || '').toUpperCase()) + '</span>';
  html += '</div>';
  
  // Stats
  html += '<div class="sr"><span>Login Streak</span><b>' + (JEC.stats.streak || 0) + '</b></div>';
  html += '<div class="sr"><span>Parts Done</span><b>' + (JEC.stats.partsDone || 0) + '</b></div>';
  html += '<div class="sr"><span>Days Left</span><b>' + (JEC.user.daysLeft || 0) + '</b></div>';
  
  // Bookmarks & Notes buttons
  html += '<div style="font-size:.74rem;font-weight:700;margin:.8rem 0 .4rem">Bookmarks (' + JEC.bookmarkList.length + ')</div>';
  html += '<button class="btn gh" onclick="JEC.openOv(\'ov-bm\'); JEC.renderBM()">';
  html += '<span class="material-icons-round">bookmark</span> View Bookmarks</button>';
  
  html += '<div style="font-size:.74rem;font-weight:700;margin:.8rem 0 .4rem">My Notes (' + Object.keys(JEC.notesMap).length + ')</div>';
  html += '<button class="btn gh" onclick="JEC.openOv(\'ov-notes\'); JEC.renderNotes()">';
  html += '<span class="material-icons-round">edit_note</span> View Notes</button>';
  
  // Achievements
  html += '<div style="font-size:.74rem;font-weight:700;margin:.8rem 0 .4rem">Achievements (' + JEC.unlockedAch.length + '/' + (JEC.config.ACHIEVEMENTS || []).length + ')</div>';
  html += '<div class="ach-grid" id="profile-ach-grid">';
  html += JEC.renderAchGrid();
  html += '</div>';
  
  container.innerHTML = html;
};

JEC.renderAchGrid = function() {
  const achs = JEC.config.ACHIEVEMENTS || [];
  let html = '';
  
  achs.forEach(function(a) {
    const got = JEC.unlockedAch.indexOf(a.id) >= 0;
    const name = JEC.lang === 'id' ? (a.id || a.en) : (a.en || a.id);
    html += '<div class="ach' + (got ? '' : ' lk') + '" title="' + JEC.esc(name) + ' - ' + JEC.esc(JEC.lang === 'id' ? a.id_d : a.en_d) + '">';
    html += '<span class="material-icons-round">' + a.icon + '</span>';
    html += '<b>' + JEC.esc(name) + '</b>';
    html += '</div>';
  });
  
  return html;
};

// ═══════════════════════════════════════════════════
// AVATAR SELECTOR (Boy & Girl only)
// ═══════════════════════════════════════════════════
JEC.renderAvatarSelector = function() {
  const container = document.getElementById('feat-avatar-content');
  if (!container) return;
  
  const avatars = JEC.config.AVATARS || [];
  const current = JEC.avatar || 'boy';
  
  let html = '<div class="av-grid">';
  
  avatars.forEach(function(av) {
    const sel = av.id === current;
    const label = JEC.lang === 'id' ? av.id_label : av.en;
    
    html += '<div class="av' + (sel ? ' sel' : '') + '" onclick="JEC.pickAvatar(\'' + av.id + '\')">';
    html += '<div class="av-inner"><span class="material-icons-round">' + av.material + '</span></div>';
    html += '<span class="av-label">' + JEC.esc(label) + '</span>';
    html += '</div>';
  });
  
  html += '</div>';
  container.innerHTML = html;
};

JEC.pickAvatar = function(avId) {
  JEC.avatar = avId;
  localStorage.setItem('jec_avatar', avId);
  JEC.updateNavAvatar();
  JEC.renderAvatarSelector();
  JEC.toast(JEC.lang === 'id' ? 'Avatar diubah!' : 'Avatar changed!', 'success');
};

// ═══════════════════════════════════════════════════
// BOOKMARKS
// ═══════════════════════════════════════════════════
JEC.toggleBookmarkWord = function(en, id, mKey, uId, pId) {
  const key = en + '|' + id + '|' + mKey + '_' + uId + '_' + pId;
  const idx = JEC.bookmarkList.indexOf(key);
  
  if (idx >= 0) {
    JEC.bookmarkList.splice(idx, 1);
    JEC.toast(JEC.lang === 'id' ? 'Bookmark dihapus' : 'Bookmark removed', 'warning');
  } else {
    JEC.bookmarkList.push(key);
    JEC.toast(JEC.lang === 'id' ? 'Dibookmark!' : 'Bookmarked!', 'success');
  }
  
  localStorage.setItem('jec_bm_' + JEC.user.id, JSON.stringify(JEC.bookmarkList));
  JEC.updateStats();
  
  // Sync ke Apps Script
  JEC.apiPost({
    action: idx >= 0 ? 'remove_bookmark' : 'add_bookmark',
    id: JEC.user.id,
    batch: JEC.user.batch,
    module: mKey,
    unitId: uId,
    partId: pId
  }).catch(function() {});
  
  // Re-render player
  if (JEC.currentPartId) {
    JEC.renderPlayer(JEC.currentModule, JEC.currentUnitId, JEC.currentPartId);
  }
};

JEC.renderBM = function() {
  const container = document.getElementById('feat-bm-content');
  if (!container) return;
  
  if (!JEC.bookmarkList.length) {
    container.innerHTML = '<div class="load-state"><span class="material-icons-round" style="animation:none">bookmark_border</span><div>' + JEC.t('no_bookmarks') + '</div></div>';
    return;
  }
  
  let html = '';
  JEC.bookmarkList.forEach(function(key, idx) {
    const parts = key.split('|');
    const en = parts[0] || '';
    const id = parts[1] || '';
    
    html += '<div class="bm-card">';
    html += '<div><b>' + JEC.esc(en) + '</b><div class="tx-m">' + JEC.esc(id) + '</div></div>';
    html += '<div class="acts">';
    html += '<button onclick="JEC.speakWord(\'' + JEC.esc(en) + '\')"><span class="material-icons-round">volume_up</span></button>';
    html += '<button class="danger" onclick="JEC.delBM(' + idx + ')"><span class="material-icons-round">delete</span></button>';
    html += '</div></div>';
  });
  
  container.innerHTML = html;
};

JEC.delBM = function(idx) {
  JEC.bookmarkList.splice(idx, 1);
  localStorage.setItem('jec_bm_' + JEC.user.id, JSON.stringify(JEC.bookmarkList));
  JEC.updateStats();
  JEC.renderBM();
};

// ═══════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════
JEC.saveNote = function(mKey, uId, pId) {
  const ta = document.getElementById('note-ta');
  if (!ta) return;
  
  const key = mKey + '_' + uId + '_' + pId;
  const content = ta.value;
  
  if (content && content.trim()) {
    JEC.notesMap[key] = content;
  } else {
    delete JEC.notesMap[key];
  }
  
  localStorage.setItem('jec_notes_' + JEC.user.id, JSON.stringify(JEC.notesMap));
  JEC.updateStats();
  
  // Sync ke Apps Script
  JEC.apiPost({
    action: 'save_note',
    id: JEC.user.id,
    batch: JEC.user.batch,
    module: mKey,
    unitId: uId,
    partId: pId,
    content: content
  }).catch(function() {});
};

JEC.renderNotes = function() {
  const container = document.getElementById('feat-notes-content');
  if (!container) return;
  
  const keys = Object.keys(JEC.notesMap);
  if (!keys.length) {
    container.innerHTML = '<div class="load-state"><span class="material-icons-round" style="animation:none">edit_note</span><div>' + JEC.t('no_notes') + '</div></div>';
    return;
  }
  
  let html = '';
  keys.forEach(function(key) {
    const content = JEC.notesMap[key] || '';
    const parts = key.split('_');
    const mKey = parts[0] || '';
    const modules = JEC.config.MODULES || {};
    const modInfo = modules[mKey] || {};
    const modName = JEC.lang === 'id' ? (modInfo.id || mKey) : (modInfo.en || mKey);
    
    html += '<div class="bm-card" style="flex-direction:column;align-items:stretch">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">';
    html += '<b style="font-size:.72rem;color:var(--tx2)">' + JEC.esc(key) + '</b>';
    html += '<span class="tag">' + JEC.esc(modName) + '</span>';
    html += '</div>';
    html += '<div style="white-space:pre-wrap;font-size:.8rem">' + JEC.esc(content) + '</div>';
    html += '</div>';
  });
  
  container.innerHTML = html;
};

// ═══════════════════════════════════════════════════
// FLM (FOCUS LEARN MODE) - FAB hanya di unit
// ═══════════════════════════════════════════════════
JEC.updateFLMVisibility = function() {
  const fab = document.getElementById('flm-fab');
  if (!fab) return;
  
  // FAB hanya muncul saat di dalam part (currentPartId ada) dan di learn view
  const inPart = JEC.currentPartId && JEC.currentUnitId && JEC.currentModule;
  const inLearnView = JEC.activeView === 'learn';
  
  if (inPart && inLearnView && !JEC.flmActive) {
    fab.classList.remove('hidden');
  } else {
    fab.classList.add('hidden');
  }
};

JEC.startFLM = function() {
  const duration = JEC.config.MFL_DEFAULT || 25;
  JEC.flmTotalSeconds = duration * 60;
  JEC.flmSeconds = JEC.flmTotalSeconds;
  JEC.flmActive = true;
  
  JEC.closeOv('ov-flm');
  
  // Show active bar
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.remove('hidden');
  
  // Hide FAB
  const fab = document.getElementById('flm-fab');
  if (fab) fab.classList.add('hidden');
  
  // Start timer
  if (JEC.flmTimer) clearInterval(JEC.flmTimer);
  JEC.flmTimer = setInterval(function() {
    JEC.flmSeconds--;
    JEC.updateFLMTimer();
    
    if (JEC.flmSeconds <= 0) {
      JEC.completeFLM();
    }
  }, 1000);
  
  JEC.updateFLMTimer();
  JEC.logActivity('flm_start', 'Focus Learn Mode started');
};

JEC.updateFLMTimer = function() {
  const timerEl = document.getElementById('flm-header-timer');
  if (!timerEl) return;
  
  const elapsed = JEC.flmTotalSeconds - JEC.flmSeconds;
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  timerEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};

JEC.completeFLM = function() {
  if (JEC.flmTimer) clearInterval(JEC.flmTimer);
  JEC.flmActive = false;
  JEC.flmTimer = null;
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.add('hidden');
  
  // Save focus mode ke Apps Script
  JEC.saveFocusMode(JEC.currentModule, JEC.currentUnitId, JEC.currentPartId, JEC.flmTotalSeconds / 60, true);
  
  JEC.toast(JEC.t('flm_complete'), 'success', 3000);
  JEC.updateFLMVisibility();
};

JEC.exitFLM = function() {
  if (!confirm(JEC.t('flm_exit_confirm'))) return;
  
  if (JEC.flmTimer) clearInterval(JEC.flmTimer);
  JEC.flmActive = false;
  JEC.flmTimer = null;
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.add('hidden');
  
  JEC.updateFLMVisibility();
};

JEC.saveFocusMode = function(module, unitId, partId, duration, completed) {
  if (!JEC.user) return;
  
  JEC.apiPost({
    action: 'save_focus_mode',
    id: JEC.user.id,
    batch: JEC.user.batch,
    module: module,
    unitId: unitId,
    partId: partId,
    duration: duration,
    completed: completed
  }).catch(function() {});
  
  if (completed) {
    JEC.stats.focusCount++;
    JEC.stats.focusHours += duration / 60;
    JEC.checkAllAchievements();
  }
};

// FLM FAB click handler
document.addEventListener('DOMContentLoaded', function() {
  const fab = document.getElementById('flm-fab');
  if (fab) {
    fab.addEventListener('click', function() {
      JEC.openOv('ov-flm');
    });
  }
});

// ═══════════════════════════════════════════════════
// DAILY CHALLENGE
// ═══════════════════════════════════════════════════
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

JEC.showDCBalloon = function() {
  if (!JEC.dcToday || JEC.dcToday.completed) return;
  
  const balloon = document.getElementById('feat-dc-balloon');
  if (!balloon) return;
  
  if (sessionStorage.getItem('jec_dc_shown')) return;
  sessionStorage.setItem('jec_dc_shown', '1');
  
  balloon.classList.add('show');
  setTimeout(function() {
    balloon.classList.remove('show');
  }, 8000);
};

JEC.renderDC = function() {
  const container = document.getElementById('feat-dc-content');
  if (!container) return;
  
  if (!JEC.currentDC) {
    container.innerHTML = '<div class="load-state"><span class="material-icons-round" style="animation:none">check_circle</span><div>Daily Challenge completed!</div></div>';
    return;
  }
  
  const dc = JEC.currentDC;
  const title = JEC.lang === 'id' ? (dc.id || dc.en) : (dc.en || dc.id);
  const desc = JEC.lang === 'id' ? (dc.id_d || dc.en_d) : (dc.en_d || dc.id_d);
  
  let html = '<div style="text-align:center;padding:.5rem 0">';
  html += '<span class="material-icons-round" style="font-size:3rem;color:var(--acc);display:block;margin-bottom:.5rem">' + dc.icon + '</span>';
  html += '<h3 style="margin-bottom:.3rem">' + JEC.esc(title) + '</h3>';
  html += '<p class="tx-m" style="font-size:.84rem;margin-bottom:1rem">' + JEC.esc(desc) + '</p>';
  html += '<div class="sr" style="background:var(--p-light)"><span>Reward</span><b>+' + (dc.xp || 20) + ' XP</b></div>';
  
  if (JEC.dcToday && JEC.dcToday.completed) {
    html += '<div class="done-ind" style="margin-top:.7rem"><span class="material-icons-round">check_circle</span> Completed!</div>';
  } else {
    html += '<div class="tx-m" style="font-size:.74rem;margin-top:.7rem">Complete automatically when you do the activity.</div>';
  }
  
  html += '</div>';
  container.innerHTML = html;
};

JEC.triggerDailyChallenge = function(trigger, data) {
  if (!JEC.user || !JEC.currentDC || !JEC.dcToday) return;
  if (JEC.dcToday.completed) return;
  
  const ch = JEC.currentDC;
  if (ch.trigger !== trigger) return;
  
  let shouldComplete = false;
  
  switch (trigger) {
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
  JEC.toast(JEC.t('dc_complete') + ' +' + xp + ' XP', 'success', 3000);
  
  JEC.apiPost({
    action: 'save_daily_challenge',
    id: JEC.user.id,
    batch: JEC.user.batch,
    challengeTitle: JEC.currentDC.en,
    xpEarned: xp
  }).catch(function() {});
  
  JEC.stats.dcCount = (JEC.stats.dcCount || 0) + 1;
  JEC.checkAllAchievements();
};

// ═══════════════════════════════════════════════════
// ACHIEVEMENT ENGINE (40 badges)
// ═══════════════════════════════════════════════════
JEC.checkAllAchievements = function() {
  if (!JEC.user) return;
  const achs = JEC.config.ACHIEVEMENTS || [];
  const s = JEC.stats;
  
  achs.forEach(function(ach) {
    if (JEC.unlockedAch.indexOf(ach.id) >= 0) return;
    try {
      if (typeof ach.cond === 'function' && ach.cond(s)) {
        JEC.unlockAchievement(ach.id);
      }
    } catch (e) {}
  });
};

JEC.unlockAchievement = function(achId) {
  if (JEC.unlockedAch.indexOf(achId) >= 0) return;
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
  
  const title = JEC.t('ach_unlocked');
  const name = JEC.lang === 'id' ? (ach.id || ach.en) : (ach.en || ach.id);
  
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

// ═══════════════════════════════════════════════════
// MARK DONE & PROGRESS
// ═══════════════════════════════════════════════════
JEC.markDone = function(module, unitId, partId, score) {
  if (!JEC.user) return;
  const key = module + '_' + unitId + '_' + partId;
  if (JEC.progressMap[key] === 'done') return;
  
  JEC.progressMap[key] = 'done';
  score = score || 100;
  
  JEC.apiPost({
    action: 'mark_done',
    id: JEC.user.id,
    batch: JEC.user.batch,
    module: module,
    unitId: unitId,
    partId: partId,
    score: score
  }).catch(function() {});
  
  JEC.updateStats();
  JEC.updateHeaderChips();
  JEC.checkAllAchievements();
  JEC.triggerDailyChallenge(module + '_part', { module: module });
  JEC.triggerDailyChallenge('multi_mod', { module: module });
};

// ═══════════════════════════════════════════════════
// REACT / FEEDBACK
// ═══════════════════════════════════════════════════
JEC.showReactOverlay = function() {
  const container = document.getElementById('feat-react-content');
  if (!container) return;
  
  let html = '<div id="rc1">';
  html += '<div style="font-weight:800;margin-bottom:.9rem">' + JEC.t('how_was_lesson') + '</div>';
  html += '<div class="fb-row">';
  html += '<button class="fb-btn" onclick="JEC.react(\'happy\')"><span class="material-icons-round">sentiment_satisfied</span><span>' + JEC.t('react.great') + '</span></button>';
  html += '<button class="fb-btn" onclick="JEC.react(\'mid\')"><span class="material-icons-round">sentiment_neutral</span><span>' + JEC.t('react.ok') + '</span></button>';
  html += '<button class="fb-btn" onclick="JEC.react(\'sad\')"><span class="material-icons-round">sentiment_dissatisfied</span><span>' + JEC.t('react.bad') + '</span></button>';
  html += '</div></div>';
  
  html += '<div id="rc2" style="display:none">';
  html += '<p class="tx-m mb">' + JEC.t('thanks_feedback') + '</p>';
  html += '<button class="btn gh" onclick="JEC.closeOv(\'ov-react\'); JEC.renderPartsList(JEC.currentModule, JEC.currentUnitId)">';
  html += '<span class="material-icons-round">auto_stories</span> ' + JEC.t('continue_learning') + '</button>';
  html += '</div>';
  
  container.innerHTML = html;
  JEC.openOv('ov-react');
};

JEC.react = function(type) {
  JEC.stats.reactCount = (JEC.stats.reactCount || 0) + 1;
  
  JEC.apiPost({
    action: 'log',
    id: JEC.user.id,
    batch: JEC.user.batch,
    type: 'feedback',
    details: (JEC.currentModule || '') + '/' + (JEC.currentUnitId || '') + '/' + (JEC.currentPartId || '') + ' - ' + type
  }).catch(function() {});
  
  const rc1 = document.getElementById('rc1');
  const rc2 = document.getElementById('rc2');
  if (rc1) rc1.style.display = 'none';
  if (rc2) rc2.style.display = 'block';
};

// ═══════════════════════════════════════════════════
// GUIDE & REPORT
// ═══════════════════════════════════════════════════
JEC.renderGuide = function() {
  const container = document.getElementById('feat-guide-content');
  if (!container) return;
  
  const guideItems = JEC.lang === 'id' ? [
    { i: 'school', t: 'Learn: 5 modul (Speaking, Vocabulary, Grammar, Writing, Listening)' },
    { i: 'fitness_center', t: 'Practice: latihan vocab, listening, scramble' },
    { i: 'more_horiz', t: 'Extra: Tools, Games, Logbook, Overview Siswa' },
    { i: 'timer', t: 'Focus Learn: muncul di dalam materi, klik untuk fokus 25 menit' },
    { i: 'emoji_events', t: 'Daily Challenge: selesaikan aktivitas untuk dapat XP' },
    { i: 'military_tech', t: '40 Achievements: kumpulkan semua badge!' },
    { i: 'person', t: 'Profile: avatar, bookmarks, notes, statistik' }
  ] : [
    { i: 'school', t: 'Learn: 5 modules (Speaking, Vocabulary, Grammar, Writing, Listening)' },
    { i: 'fitness_center', t: 'Practice: vocab, listening, scramble drills' },
    { i: 'more_horiz', t: 'Extra: Tools, Games, Logbook, Student Overview' },
    { i: 'timer', t: 'Focus Learn: appears in material, tap to focus 25 minutes' },
    { i: 'emoji_events', t: 'Daily Challenge: complete activities to earn XP' },
    { i: 'military_tech', t: '40 Achievements: collect all badges!' },
    { i: 'person', t: 'Profile: avatar, bookmarks, notes, statistics' }
  ];
  
  container.innerHTML = guideItems.map(function(x) {
    return '<div style="display:flex;gap:.7rem;margin:.6rem 0;font-size:.84rem;align-items:flex-start">' +
      '<span class="material-icons-round" style="color:var(--p);font-size:19px;flex-shrink:0">' + x.i + '</span>' +
      '<span>' + x.t + '</span></div>';
  }).join('');
};

JEC.reportIssue = function(text) {
  if (!text || !text.trim()) {
    JEC.toast(JEC.lang === 'id' ? 'Deskripsikan masalahnya' : 'Please describe the problem', 'warning');
    return;
  }
  
  const wa = JEC.config.WA_ADMIN || '6285335913758';
  const msg = encodeURIComponent('[JEC Report]\nID: ' + (JEC.user ? JEC.user.id : '-') + '\nName: ' + (JEC.user ? JEC.user.name : '-') + '\n\n' + text);
  window.open('https://wa.me/' + wa + '?text=' + msg, '_blank');
  
  JEC.closeOv('ov-report');
  const ta = document.getElementById('report-text');
  if (ta) ta.value = '';
  
  JEC.toast(JEC.lang === 'id' ? 'Membuka WhatsApp...' : 'Opening WhatsApp...', 'success');
};

JEC.forceRefresh = async function() {
  JEC.toast(JEC.lang === 'id' ? 'Menyegarkan...' : 'Refreshing...', 'info', 1500);
  await JEC.loadAllData();
  JEC.renderActiveView();
  JEC.toast(JEC.lang === 'id' ? 'Data disegarkan!' : 'Data refreshed!', 'success');
};

// ═══════════════════════════════════════════════════
// OVERLAY & TOAST
// ═══════════════════════════════════════════════════
JEC.openOv = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  
  // Render content untuk overlay tertentu
  if (id === 'ov-avatar') JEC.renderAvatarSelector();
  else if (id === 'ov-dc') JEC.renderDC();
  else if (id === 'ov-guide') JEC.renderGuide();
};

JEC.closeOv = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
};

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

// ═══════════════════════════════════════════════════
// GM IFRAME (Exercise/Minigames)
// ═══════════════════════════════════════════════════
JEC.openGM = function(url, title) {
  const overlay = document.getElementById('gm-overlay');
  const frame = document.getElementById('gm-frame');
  const titleEl = document.getElementById('gm-title');
  
  if (overlay) overlay.classList.add('active');
  if (frame) frame.src = url || 'about:blank';
  if (titleEl) titleEl.textContent = title || 'Exercise';
};

JEC.closeGM = function() {
  const overlay = document.getElementById('gm-overlay');
  const frame = document.getElementById('gm-frame');
  if (overlay) overlay.classList.remove('active');
  if (frame) frame.src = 'about:blank';
};

// ═══════════════════════════════════════════════════
// FULLSCREEN
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
// CONFETTI
// ═══════════════════════════════════════════════════
JEC.confetti = function() {
  const cols = ['#833AB4', '#FD1D1D', '#F77737', '#FCAF45', '#405DE6', '#00D97E'];
  for (let i = 0; i < 50; i++) {
    const c = document.createElement('div');
    c.className = 'cf';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = cols[i % cols.length];
    c.style.animationDuration = (1.5 + Math.random() * 1.8) + 's';
    document.body.appendChild(c);
    setTimeout(function(cc) { return function() { cc.remove(); }; }(c), 4000);
  }
};

// ═══════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════
JEC.esc = function(s) {
  return (s || '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// ═══════════════════════════════════════════════════
// DEBUG
// ═══════════════════════════════════════════════════
JEC.debug = function() {
  console.log('══════ JEC DEBUG v10.01 ══════');
  console.log('App State:', JEC.appState);
  console.log('Dashboard Ready:', JEC.dashboardReady);
  console.log('User:', JEC.user);
  console.log('Active View:', JEC.activeView);
  console.log('Current Module:', JEC.currentModule);
  console.log('Current Unit:', JEC.currentUnitId);
  console.log('Current Part:', JEC.currentPartId);
  console.log('Stats:', JEC.stats);
  console.log('Login Mode:', localStorage.getItem('jec_login_mode'));
  console.log('Unlocked Ach:', JEC.unlockedAch.length, '/', (JEC.config.ACHIEVEMENTS || []).length);
  console.log('Bookmarks:', JEC.bookmarkList.length);
  console.log('Notes:', Object.keys(JEC.notesMap).length);
  console.log('══════ END DEBUG ══════');
};

// Export
window.JEC = JEC;
