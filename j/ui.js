// JEC v.7.00 MODULAR | 16/08/2026 | j/ui.js
// User Interface, Overlays, & FLM Interactions
// Terhubung penuh dengan sv1.html v1.04

'use strict';

window.JEC_UI = window.JEC_UI || {};

// ═══════════ FOCUS LEARN MODE (FLM) UI ═══════════

JEC_UI.startFLM = function() {
  // Tutup overlay info
  JEC.closeOv('ov-flm');
  
  // Mulai timer (bawaan dari j.js)
  const duration = JEC.config.MFL_DEFAULT || 25;
  JEC.startFLMTimer(duration);
  
  // Sembunyikan FAB
  const fab = document.getElementById('flm-fab');
  if (fab) fab.classList.add('hidden');
  
  // Kunci Navigasi Bawah
  document.querySelectorAll('.nav-btn').forEach(function(btn) {
    if (!btn.classList.contains('active')) {
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.4';
    }
  });

  JEC.toast(JEC.t('flm_active') || 'Focus Learn Mode Active', 'info');
};

JEC_UI.exitFLM = function() {
  // Fungsi JEC.exitFLM di j.js sudah menangani konfirmasi dialog
  JEC.exitFLM();
  
  // Buka kembali Navigasi Bawah
  document.querySelectorAll('.nav-btn').forEach(function(btn) {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
  });
};

JEC_UI.showFLMFab = function() {
  const fab = document.getElementById('flm-fab');
  if (fab && !JEC.flmActive) {
    fab.classList.remove('hidden');
    // Kembalikan ke posisi awal (kanan bawah) jika pernah di-drag
    fab.style.transform = 'translate3d(0px, 0px, 0)';
    JEC_UI._xOffset = 0;
    JEC_UI._yOffset = 0;
  }
};

// ═══════════ FOCUS TIMER (OVERLAY STANDAR) ═══════════

JEC_UI.toggleFocus = function() {
  const btn = document.getElementById('focus-start-btn');
  const span = btn.querySelector('span');
  const startText = JEC.t('start') || 'Start';
  const pauseText = JEC.t('pause') || 'Pause';
  
  if (span.textContent === startText) {
    span.textContent = pauseText;
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-warning');
    // TODO: Trigger interval timer khusus overlay jika diperlukan
  } else {
    span.textContent = startText;
    btn.classList.remove('btn-warning');
    btn.classList.add('btn-primary');
    // TODO: Pause interval timer
  }
};

JEC_UI.skipFocus = function() {
  JEC.closeOv('feat-focus-overlay');
  // Reset tombol
  const btn = document.getElementById('focus-start-btn');
  if (btn) {
    const span = btn.querySelector('span');
    span.textContent = JEC.t('start') || 'Start';
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-warning');
  }
};

// ═══════════ DRAGGABLE FAB (FLOATING ACTION BUTTON) ═══════════

(function() {
  const fab = document.getElementById('flm-fab');
  if (!fab) return;
  
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  JEC_UI._xOffset = 0;
  JEC_UI._yOffset = 0;
  let clickTimeout;
  let isClick = true;

  // Touch Events
  fab.addEventListener('touchstart', dragStart, {passive: false});
  fab.addEventListener('touchend', dragEnd, false);
  fab.addEventListener('touchmove', drag, {passive: false});
  
  // Mouse Events (untuk desktop/testing)
  fab.addEventListener('mousedown', dragStart, false);
  document.addEventListener('mouseup', dragEnd, false);
  document.addEventListener('mousemove', drag, false);

  function dragStart(e) {
    if (e.type === 'touchstart') {
      initialX = e.touches[0].clientX - JEC_UI._xOffset;
      initialY = e.touches[0].clientY - JEC_UI._yOffset;
    } else {
      initialX = e.clientX - JEC_UI._xOffset;
      initialY = e.clientY - JEC_UI._yOffset;
    }
    
    if (e.target === fab || fab.contains(e.target)) {
      isDragging = true;
      isClick = true;
      fab.style.transition = 'none'; // Matikan transisi saat di-drag agar responsif
      
      // Jika disentuh lebih dari 150ms, dianggap drag, bukan click
      clickTimeout = setTimeout(function() {
        isClick = false;
      }, 150);
    }
  }

  function dragEnd(e) {
    if (clickTimeout) clearTimeout(clickTimeout);
    
    if (isDragging) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      fab.style.transition = 'transform 0.2s ease'; // Nyalakan kembali transisi
      
      // Eksekusi klik jika tidak di-drag jauh
      if (isClick) {
        JEC.openOv('ov-flm');
      }
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      
      if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      // Deteksi pergerakan, jika pindah > 5px, batalkan klik
      if (Math.abs(currentX - JEC_UI._xOffset) > 5 || Math.abs(currentY - JEC_UI._yOffset) > 5) {
        isClick = false;
      }

      JEC_UI._xOffset = currentX;
      JEC_UI._yOffset = currentY;
      setTranslate(currentX, currentY, fab);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }
})();

// ═══════════ DAILY CHALLENGE UI HELPERS ═══════════

JEC_UI.renderDailyChallengeBalloon = function() {
  const balloon = document.getElementById('feat-dc-balloon');
  if (!balloon) return;
  
  if (JEC.dcToday && !JEC.dcToday.completed) {
    balloon.style.display = 'flex';
    // Animasi masuk
    setTimeout(() => { balloon.classList.add('show'); }, 1000);
    
    balloon.onclick = function() {
      JEC.openOv('ov-dc');
      balloon.classList.remove('show');
      setTimeout(() => { balloon.style.display = 'none'; }, 300);
    };
  } else {
    balloon.style.display = 'none';
  }
};

// Pastikan balon UI di-refresh setelah sistem JEC siap
const originalRefreshUI = JEC.refreshActiveFeatureUI;
JEC.refreshActiveFeatureUI = function() {
  if (typeof originalRefreshUI === 'function') {
    originalRefreshUI();
  }
  JEC_UI.renderDailyChallengeBalloon();
};
