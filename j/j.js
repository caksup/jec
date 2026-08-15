// JEC v.1.04 | 15/08/2026 | j/j.js | Core Engine + Built-in Splash & Login

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
  activeView: 'learn',
  currentModule: null,
  currentUnitId: null,
  currentPartId: null,
  leaderboardData: [],
  onlineCount: 0,
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

// ═══════════ BOOTSTRAP ═══════════
document.addEventListener('DOMContentLoaded', function() {
  JEC.applyTheme();
  JEC.applyLang();
  JEC.setupOfflineDetection();
  JEC.initBuiltInSplash();
  JEC.initBuiltInLogin();
  JEC.initFeatureRouter();
});

// ═══════════ BUILT-IN SPLASH (tidak perlu f/splash.js) ═══════════
JEC.initBuiltInSplash = function() {
  const splash = document.getElementById('feat-splash');
  if (!splash) return;
  
  splash.style.display = 'flex';
  splash.classList.remove('hide');
  
  setTimeout(function() {
    splash.classList.add('hide');
    
    setTimeout(function() {
      splash.style.display = 'none';
      
      const savedUser = localStorage.getItem('jec_user');
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          JEC.autoLogin(u).then(function(success) {
            if (success) {
              JEC.enterDashboard();
            } else {
              JEC.showLoginPage();
            }
          });
        } catch(e) {
          JEC.showLoginPage();
        }
      } else {
        JEC.showLoginPage();
      }
    }, 500);
  }, 3000);
};

// ═══════════ BUILT-IN LOGIN (tidak perlu f/login.js) ═══════════
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
  const id = document.getElementById('login-id').value.trim().toLowerCase();
  const pin = document.getElementById('login-pin').value.trim();
  const errorEl = document.getElementById('login-error');
  const errorMsg = document.getElementById('login-error-msg');
  const loadingEl = document.getElementById('login-loading');
  
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
    } else {
      if (errorMsg) errorMsg.textContent = result.msg || JEC.t('login_failed');
      if (errorEl) errorEl.classList.add('show');
    }
  } catch(e) {
    if (loadingEl) loadingEl.classList.remove('show');
    if (errorMsg) errorMsg.textContent = JEC.t('network_error') || 'Network error: ' + e.message;
    if (errorEl) errorEl.classList.add('show');
  }
};

JEC.showLoginPage = function() {
  const loginPage = document.getElementById('feat-login');
  const dashboard = document.getElementById('dashboard');
  
  if (loginPage) loginPage.classList.remove('hidden');
  if (dashboard) dashboard.classList.remove('active');
};

JEC.enterDashboard = function() {
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
};

// ═══════════ FEATURE ROUTER (untuk fitur non-kritis) ═══════════
JEC.initFeatureRouter = function() {
  const features = JEC.config.FEATURES || {};
  const featureNames = Object.keys(features);
  
  let delay = 100;
  featureNames.forEach(function(name) {
    if (name === 'splash' || name === 'login' || name === 'header') {
      return;
    }
    
    const cfg = features[name];
    if (!cfg.enabled) {
      JEC.featureStates[name] = { loaded: false, disabled: true };
      JEC.renderMaintenancePlaceholder(name);
      return;
    }
    
    setTimeout(function() {
      JEC.loadFeature(name, cfg.js);
    }, delay);
    delay += 100;
  });
};

JEC.loadFeature = function(name, jsFile) {
  const url = JEC.config.FEATURES_JS + jsFile + '?v=' + Date.now();
  const script = document.createElement('script');
  
  script.onload = function() {
    const initFn = window['JEC_' + name.toUpperCase() + '_INIT'];
    if (typeof initFn === 'function') {
      try {
        initFn(JEC);
        JEC.featureStates[name] = { loaded: true };
        console.log('[JEC] Feature loaded: ' + name);
      } catch(err) {
        console.error('[JEC] Error init feature ' + name + ':', err);
        JEC.featureStates[name] = { loaded: false, error: err.message };
        JEC.renderMaintenancePlaceholder(name, 'error');
      }
    } else {
      JEC.featureStates[name] = { loaded: true };
    }
  };
  
  script.onerror = function() {
    console.warn('[JEC] Feature JS not found: ' + jsFile);
    JEC.featureStates[name] = { loaded: false, notFound: true };
    JEC.renderMaintenancePlaceholder(name, 'maintenance');
  };
  
  script.src = url;
  document.head.appendChild(script);
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
      return { success: true };
    } else {
      return { success: false, msg: data.msg };
    }
  } catch(e) {
    return { success: false, msg: e.message };
  }
};

JEC.autoLogin = async function(u) {
  JEC.user = u;
  try {
    const data = await JEC.apiGet({ action: 'check_session', id: u.id });
    if (data.active) {
      JEC.user.daysLeft = data.daysLeft;
      await JEC.loadAllData();
      return true;
    } else {
      localStorage.removeItem('jec_user');
      return false;
    }
  } catch(e) {
    try {
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

// ═══════════ ONLINE COUNT ═══════════
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
    case 'speak':
    case 'writing':
    case 'review':
    case 'note':
    case 'bookmark':
    case 'login':
      shouldComplete = true;
      break;
    case 'voc_part':
      shouldComplete = data && data.module === 'voc';
      break;
    case 'lis_part':
      shouldComplete = data && data.module === 'lis';
      break;
    case 'quiz_80':
      shouldComplete = data && data.score >= 80;
      break;
    case 'quiz_100':
      shouldComplete = data && data.score === 100;
      break;
    case 'focus':
      shouldComplete = data && data.completed;
      break;
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
  
  if (shouldComplete) {
    JEC.completeDailyChallenge();
  }
};

JEC.completeDailyChallenge = function() {
  if (!JEC.currentDC || !JEC.dcToday) return;
  if (JEC.dcToday.completed) return;
  
  JEC.dcToday.completed = true;
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('jec_dc_date_' + JEC.user.id, today);
  
  const xp = JEC.currentDC.xp || 20;
  JEC.toast(
    (JEC.config.I18N.dc_complete && JEC.config.I18N.dc_complete[JEC.lang]) || 'Daily Challenge Completed!' + ' +' + xp + ' XP',
    'success',
    3000
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
    id: JEC.user.id,
    batch: JEC.user.batch,
    module: module,
    unitId: unitId,
    partId: partId,
    score: score
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
    id: JEC.user.id,
    batch: JEC.user.batch,
    module: module,
    unitId: unitId,
    partId: partId,
    score: score,
    totalQuestions: totalQ,
    correctAnswers: correctA
  }).catch(function() {});
  
  JEC.stats.quizCount++;
  if (score === 100) {
    JEC.stats.perfectQuiz = true;
    JEC.stats.perfectCount++;
    JEC.triggerDailyChallenge('quiz_100', { score: score });
  }
  if (score >= 80) {
    JEC.triggerDailyChallenge('quiz_80', { score: score });
  }
  
  JEC.checkAllAchievements();
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
    id: JEC.user.id,
    batch: JEC.user.batch,
    module: module,
    unitId: unitId,
    partId: partId
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
    id: JEC.user.id,
    batch: JEC.user.batch,
    module: module,
    unitId: unitId,
    partId: partId
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
    id: JEC.user.id,
    batch: JEC.user.batch,
    module: module,
    unitId: unitId,
    partId: partId,
    content: content
  }).catch(function() {});
  
  JEC.updateStats();
  JEC.triggerDailyChallenge('note', {});
  JEC.checkAllAchievements();
};

// ═══════════ VIEW ROUTER ═══════════
JEC.switchView = function(name, btn) {
  document.querySelectorAll('.view').forEach(function(v) {
    v.classList.remove('active');
  });
  const target = document.getElementById('view-' + name);
  if (target) target.classList.add('active');
  
  document.querySelectorAll('.nav-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  if (btn) btn.classList.add('active');
  
  JEC.activeView = name;
};

// ═══════════ FULLSCREEN ═══════════
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

// ═══════════ OVERLAY ═══════════
JEC.openOv = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
};

JEC.closeOv = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
};

// ═══════════ TOAST (TOP INLINE) ═══════════
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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

// ═══════════ INTERVALS ═══════════
setInterval(function() {
  if (JEC.user) {
    JEC.heartbeat();
    JEC.fetchOnlineCount();
  }
}, 30000);

// Expose to global
window.JEC = JEC;
