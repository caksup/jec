// JEC v.1.06 | 15/08/2026 | j/ui.js | UI Controllers (Login, FLM, Header BG)

'use strict';

window.JEC_UI = window.JEC_UI || {};

// ═══════════ LOGIN UI ═══════════

JEC_UI.doLogin = async function() {
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
      JEC_UI.enterDashboard();
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

JEC_UI.enterDashboard = function() {
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
  JEC_UI.showFLMFab();
  
  if (typeof JEC_HEADER !== 'undefined' && JEC_HEADER.updateAll) {
    JEC_HEADER.updateAll();
  }
};

JEC_UI.showLoginPage = function() {
  const loginPage = document.getElementById('feat-login');
  const dashboard = document.getElementById('dashboard');
  
  if (loginPage) loginPage.classList.remove('hidden');
  if (dashboard) dashboard.classList.remove('active');
};

// ═══════════ CUSTOM LOGO ═══════════

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

// ═══════════ HEADER BACKGROUND CUSTOM ═══════════

JEC.applyHeaderBg = function() {
  const headerBg = document.getElementById('header-bg');
  if (!headerBg) return;
  
  const bgType = localStorage.getItem('jec_header_bg_type') || '';
  const bgUrl = localStorage.getItem('jec_header_bg_url') || '';
  const bgCss = localStorage.getItem('jec_header_bg_css') || '';
  
  headerBg.innerHTML = '';
  headerBg.style.backgroundImage = '';
  headerBg.className = 'header-bg';
  
  if (bgType === 'image' && bgUrl) {
    headerBg.style.backgroundImage = 'url(' + bgUrl + ')';
    headerBg.style.backgroundSize = 'cover';
    headerBg.style.backgroundPosition = 'center';
  } else if (bgType === 'css' && bgCss) {
    const styleEl = document.createElement('style');
    styleEl.textContent = bgCss;
    document.head.appendChild(styleEl);
    headerBg.classList.add('header-bg-custom');
  }
};

// ═══════════ FOCUS LEARN MODE (FLM) ═══════════

JEC_UI.flmState = {
  active: false,
  module: null,
  unitId: null,
  timer: null,
  seconds: 0,
  totalSeconds: 0,
  started: false
};

JEC_UI.showFLMFab = function() {
  const fab = document.getElementById('flm-fab');
  if (fab) fab.classList.remove('hidden');
  JEC_UI.initFLMDrag();
};

JEC_UI.hideFLMFab = function() {
  const fab = document.getElementById('flm-fab');
  if (fab) fab.classList.add('hidden');
};

JEC_UI.initFLMDrag = function() {
  const fab = document.getElementById('flm-fab');
  if (!fab || fab.dataset.dragInit) return;
  fab.dataset.dragInit = 'true';
  
  let isDragging = false;
  let startX, startY, initialX, initialY;
  let dragMoved = false;
  
  const onStart = function(e) {
    isDragging = true;
    dragMoved = false;
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    const rect = fab.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    fab.classList.add('dragging');
  };
  
  const onMove = function(e) {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragMoved = true;
    }
    
    const newX = initialX + dx;
    const newY = initialY + dy;
    const maxX = window.innerWidth - fab.offsetWidth;
    const maxY = window.innerHeight - fab.offsetHeight;
    fab.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
    fab.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  };
  
  const onEnd = function() {
    isDragging = false;
    fab.classList.remove('dragging');
  };
  
  fab.addEventListener('mousedown', onStart);
  fab.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', function() {
    onEnd();
    if (!dragMoved) {
      JEC_UI.openFLMPopup();
    }
  });
  document.addEventListener('touchend', function() {
    onEnd();
    if (!dragMoved) {
      JEC_UI.openFLMPopup();
    }
  });
};

JEC_UI.openFLMPopup = function() {
  const duration = JEC.config.MFL_DEFAULT || 25;
  const preview = document.getElementById('flm-duration-preview');
  if (preview) {
    preview.textContent = String(duration).padStart(2, '0') + ':00';
  }
  JEC.openOv('ov-flm');
};

JEC_UI.startFLM = function() {
  JEC_UI.flmState.active = true;
  JEC_UI.flmState.started = true;
  JEC_UI.flmState.totalSeconds = (JEC.config.MFL_DEFAULT || 25) * 60;
  JEC_UI.flmState.seconds = JEC_UI.flmState.totalSeconds;
  
  JEC.closeOv('ov-flm');
  
  document.body.classList.add('flm-active');
  
  JEC.currentModule = JEC_UI.flmState.module;
  JEC.currentUnitId = JEC_UI.flmState.unitId;
  
  JEC.startFLMTimer(JEC.config.MFL_DEFAULT || 25);
  
  JEC_UI.hideFLMFab();
  
  JEC.logActivity('flm_start', 'Focus Learn Mode started');
};

JEC_UI.updateFLMTimer = function() {
  const timerEl = document.getElementById('focus-timer');
  if (timerEl && JEC_UI.flmState.active) {
    const m = Math.floor(JEC_UI.flmState.seconds / 60);
    const s = JEC_UI.flmState.seconds % 60;
    timerEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
};

JEC_UI.completeFLM = function() {
  if (JEC_UI.flmState.timer) clearInterval(JEC_UI.flmState.timer);
  JEC_UI.flmState.active = false;
  
  document.body.classList.remove('flm-active');
  
  JEC.saveFocusMode(
    JEC_UI.flmState.module,
    JEC_UI.flmState.unitId,
    null,
    JEC_UI.flmState.totalSeconds / 60,
    true
  );
  
  JEC.toast(JEC.t('flm_complete') || 'Focus session completed!', 'success', 3000);
  
  JEC_UI.showFLMFab();
};

JEC_UI.exitFLM = function() {
  if (!confirm(JEC.t('flm_exit_confirm') || 'Exit Focus Learn Mode?')) return;
  
  JEC.exitFLM();
  
  document.body.classList.remove('flm-active');
  
  JEC_UI.flmState.active = false;
};

JEC_UI.skipFocus = function() {
  if (JEC_UI.flmState.timer) clearInterval(JEC_UI.flmState.timer);
  JEC_UI.flmState.active = false;
  
  document.body.classList.remove('flm-active');
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.add('hidden');
  
  JEC_UI.showFLMFab();
};

JEC_UI.toggleFocus = function() {
  if (JEC_UI.flmState.active) {
    if (JEC_UI.flmState.timer) clearInterval(JEC_UI.flmState.timer);
    JEC_UI.flmState.active = false;
    const startBtn = document.getElementById('focus-start-btn');
    if (startBtn) startBtn.innerHTML = '<span>' + JEC.t('start') + '</span>';
  } else {
    JEC_UI.flmState.active = true;
    const startBtn = document.getElementById('focus-start-btn');
    if (startBtn) startBtn.innerHTML = '<span>' + JEC.t('pause') + '</span>';
    
    JEC_UI.flmState.timer = setInterval(function() {
      JEC_UI.flmState.seconds--;
      JEC_UI.updateFLMTimer();
      if (JEC_UI.flmState.seconds <= 0) {
        JEC_UI.completeFLM();
      }
    }, 1000);
  }
};

// ═══════════ FLM NAVIGATION LOCK ═══════════

JEC_UI.isFLMActive = function() {
  return JEC_UI.flmState.active || JEC.flmActive;
};

JEC_UI.canNavigate = function(target) {
  if (!JEC_UI.isFLMActive()) return true;
  
  const allowed = ['learn-unit', 'learn-part', 'learn-materi'];
  return allowed.includes(target);
};

// ═══════════ GM (EXERCISE/MINIGAMES) OVERLAY ═══════════

JEC.closeGM = function() {
  const overlay = document.getElementById('gm-overlay');
  const frame = document.getElementById('gm-frame');
  if (overlay) overlay.classList.remove('active');
  if (frame) frame.src = 'about:blank';
};

JEC.openExercise = function() {
  if (!JEC.config.EXE_URL) {
    JEC.toast(JEC.t('exercise_not_configured') || 'Exercise not configured', 'warning');
    return;
  }
  
  const module = JEC.currentModule || '';
  const unitId = JEC.currentUnitId || '';
  const partId = JEC.currentPartId || '';
  
  const url = JEC.config.EXE_URL + '?mod=' + module + '&u=' + unitId + '&p=' + partId;
  
  const title = document.getElementById('gm-title');
  const frame = document.getElementById('gm-frame');
  const overlay = document.getElementById('gm-overlay');
  
  if (title) title.textContent = JEC.t('exercise') || 'Exercise';
  if (frame) frame.src = url;
  if (overlay) overlay.classList.add('active');
};

JEC.openMinigames = function() {
  if (!JEC.config.MINIGAMES) {
    JEC.toast(JEC.t('minigames_not_configured') || 'Minigames not configured', 'warning');
    return;
  }
  
  const title = document.getElementById('gm-title');
  const frame = document.getElementById('gm-frame');
  const overlay = document.getElementById('gm-overlay');
  
  if (title) title.textContent = JEC.t('games') || 'Minigames';
  if (frame) frame.src = JEC.config.MINIGAMES;
  if (overlay) overlay.classList.add('active');
};

// ═══════════ ADMIN CONFIG UPDATES ═══════════

JEC_UI.updateLogoUrl = function(url) {
  localStorage.setItem('jec_logo_url', url || '');
  JEC.applyCustomLogo();
};

JEC_UI.updateHeaderBg = function(type, url, css) {
  localStorage.setItem('jec_header_bg_type', type || '');
  localStorage.setItem('jec_header_bg_url', url || '');
  localStorage.setItem('jec_header_bg_css', css || '');
  JEC.applyHeaderBg();
};

// ═══════════ UTILITY FUNCTIONS ═══════════

JEC_UI.formatTime = function(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};

JEC_UI.getModuleIcon = function(module) {
  const modules = JEC.config.MODULES || {};
  return (modules[module] && modules[module].icon) || 'school';
};

JEC_UI.getModuleName = function(module) {
  const modules = JEC.config.MODULES || {};
  if (modules[module]) {
    return JEC.lang === 'id' ? modules[module].id : modules[module].en;
  }
  return module;
};

// ═══════════ HASH ROUTING HELPER ═══════════

JEC_UI.navigateToMateri = function(module, unitId, partId) {
  if (!JEC.user) return;
  
  JEC.currentModule = module;
  JEC.currentUnitId = unitId;
  JEC.currentPartId = partId;
  
  JEC.switchView('learn');
  
  if (typeof JEC_LEARN !== 'undefined') {
    JEC_LEARN.state.module = module;
    JEC_LEARN.state.unitId = unitId;
    JEC_LEARN.state.partId = partId;
    JEC_LEARN.state.view = 'materi';
    
    JEC_LEARN.renderMateri(module, unitId, partId);
  }
  
  JEC.updateHash(module, unitId, partId);
};

// ═══════════ THEME & LANG UPDATE UI ═══════════

JEC_UI.updateThemeUI = function() {
  JEC.updateThemeIcon();
};

JEC_UI.updateLangUI = function() {
  JEC.applyLang();
};

// Expose to global
window.JEC_UI = JEC_UI;
