// JEC v.1.03 | 15/08/2026 | j/ui.js | UI Controllers (Login, FLM, Header BG)

'use strict';

window.JEC_UI = window.JEC_UI || {};

// ═══════════ LOGIN UI ═══════════

JEC_UI.doLogin = async function() {
  const id = document.getElementById('login-id').value.trim().toLowerCase();
  const pin = document.getElementById('login-pin').value.trim();
  const errorEl = document.getElementById('login-error');
  const errorMsg = document.getElementById('login-error-msg');
  const loadingEl = document.getElementById('login-loading');
  
  errorEl.classList.remove('show');
  
  if (!id || !pin) {
    errorMsg.textContent = JEC.t('fill_all_fields') || 'Please fill all fields';
    errorEl.classList.add('show');
    return;
  }
  
  loadingEl.classList.add('show');
  
  try {
    const result = await JEC.login(id, pin);
    loadingEl.classList.remove('show');
    
    if (result.success) {
      JEC_UI.enterDashboard();
    } else {
      errorMsg.textContent = result.msg || JEC.t('login_failed');
      errorEl.classList.add('show');
    }
  } catch(e) {
    loadingEl.classList.remove('show');
    errorMsg.textContent = JEC.t('network_error') || 'Network error';
    errorEl.classList.add('show');
  }
};

JEC_UI.enterDashboard = function() {
  document.getElementById('feat-login').classList.add('hidden');
  document.getElementById('dashboard').classList.add('active');
  
  const userName = document.getElementById('user-name');
  if (userName && JEC.user) {
    userName.textContent = JEC.user.nickname ? '@' + JEC.user.nickname : JEC.user.name;
  }
  
  JEC.applyHeaderBg();
  JEC.applyCustomLogo();
  JEC.fetchOnlineCount();
  JEC_UI.showFLMFab();
};

// ═══════════ CUSTOM LOGO ═══════════

JEC.applyCustomLogo = function() {
  const logoUrl = localStorage.getItem('jec_logo_url') || '';
  
  const loginLogo = document.getElementById('login-logo-img');
  const headerLogo = document.getElementById('header-logo-img');
  
  if (logoUrl) {
    if (loginLogo) {
      loginLogo.src = logoUrl;
      loginLogo.style.display = 'block';
    }
    if (headerLogo) {
      headerLogo.src = logoUrl;
      headerLogo.style.display = 'block';
    }
  } else {
    if (loginLogo) loginLogo.style.display = 'none';
    if (headerLogo) headerLogo.style.display = 'none';
    document.getElementById('login-logo-fallback').style.display = 'flex';
    document.getElementById('header-logo-fallback').style.display = 'flex';
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
  
  const onStart = function(e) {
    isDragging = true;
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
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
  
  fab.addEventListener('click', function(e) {
    if (!isDragging) {
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
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.remove('hidden');
  
  JEC_UI.hideFLMFab();
  
  JEC_UI.updateFLMTimer();
  JEC_UI.flmState.timer = setInterval(() => {
    JEC_UI.flmState.seconds--;
    JEC_UI.updateFLMTimer();
    if (JEC_UI.flmState.seconds <= 0) {
      JEC_UI.completeFLM();
    }
  }, 1000);
  
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
  clearInterval(JEC_UI.flmState.timer);
  JEC_UI.flmState.active = false;
  
  document.body.classList.remove('flm-active');
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.add('hidden');
  
  JEC_UI.showFLMFab();
  
  JEC.saveFocusMode(
    JEC_UI.flmState.module,
    JEC_UI.flmState.unitId,
    null,
    JEC_UI.flmState.totalSeconds / 60,
    true
  );
  
  JEC.toast(JEC.t('flm_complete') || 'Focus session completed!', 'success', 3000);
};

JEC_UI.exitFLM = function() {
  if (!confirm(JEC.t('flm_exit_confirm') || 'Exit Focus Learn Mode?')) return;
  clearInterval(JEC_UI.flmState.timer);
  JEC_UI.flmState.active = false;
  
  document.body.classList.remove('flm-active');
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.add('hidden');
  
  JEC_UI.showFLMFab();
};

JEC_UI.skipFocus = function() {
  clearInterval(JEC_UI.flmState.timer);
  JEC_UI.flmState.active = false;
  document.body.classList.remove('flm-active');
  
  const activeBar = document.getElementById('flm-active-bar');
  if (activeBar) activeBar.classList.add('hidden');
  
  JEC_UI.showFLMFab();
};

JEC_UI.toggleFocus = function() {
  if (JEC_UI.flmState.active) {
    clearInterval(JEC_UI.flmState.timer);
    JEC_UI.flmState.active = false;
    document.getElementById('focus-start-btn').innerHTML = '<span>' + JEC.t('start') + '</span>';
  } else {
    JEC_UI.flmState.active = true;
    document.getElementById('focus-start-btn').innerHTML = '<span>' + JEC.t('pause') + '</span>';
    JEC_UI.flmState.timer = setInterval(() => {
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
  return JEC_UI.flmState.active;
};

JEC_UI.canNavigate = function(target) {
  if (!JEC_UI.isFLMActive()) return true;
  
  const allowed = ['learn-unit', 'learn-part', 'learn-materi'];
  return allowed.includes(target);
};
