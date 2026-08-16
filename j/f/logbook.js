// JEC v.7.00 MODULAR | 16/08/2026 | j/f/logbook.js | Logbook Sessions
// Dipanggil dari: profile.js (tab Data) atau extra.js (Overview)
// Membuat overlay dynamic #ov-logbook saat pertama kali init
// Data dari: JEC.lbData (d/lb.json)
// Lazy load (Priority 3)

'use strict';

window.JEC_LOGBOOK = {
  state: {
    initialized: false,
    sessions: [],
    filterId: ''
  },

  // ═══════════ INIT ═══════════
  init: function() {
    if (JEC_LOGBOOK.state.initialized) return;
    JEC_LOGBOOK.createOverlay();
    JEC_LOGBOOK.state.initialized = true;
    console.log('[JEC_LOGBOOK] Initialized');
  },

  // ═══════════ CREATE OVERLAY (DYNAMIC) ═══════════
  createOverlay: function() {
    if (document.getElementById('ov-logbook')) return;

    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'ov-logbook';
    ov.innerHTML = 
      '<div class="modal">' +
      '<div class="modal-header">' +
      '<span class="material-icons-round modal-icon">menu_book</span>' +
      '<span>' + JEC.esc(JEC.t('logbook') || 'Logbook') + '</span>' +
      '<button class="icon-btn modal-close" onclick="JEC.closeOv(\'ov-logbook\')">' +
      '<span class="material-icons-round">close</span>' +
      '</button>' +
      '</div>' +
      '<div id="logbook-body">' +
      '<div class="load-state">' +
      '<span class="material-icons-round">sync</span>' +
      JEC.esc(JEC.t('loading_more') || 'Loading...') +
      '</div>' +
      '</div>' +
      '</div>';

    document.body.appendChild(ov);
  },

  // ═══════════ OPEN OVERLAY ═══════════
  open: function(filterId) {
    JEC_LOGBOOK.init();
    JEC_LOGBOOK.state.filterId = filterId || (JEC.user ? JEC.user.id : '');
    JEC.openOv('ov-logbook');
    JEC_LOGBOOK.render();
  },

  // ═══════════ RENDER ═══════════
  render: function() {
    const body = document.getElementById('logbook-body');
    if (!body) return;

    // Get sessions from JEC.lbData
    const lbData = JEC.lbData || {};
    const allSessions = lbData.sessions || [];
    const filterId = JEC_LOGBOOK.state.filterId;

    // Filter by student ID
    let sessions = allSessions;
    if (filterId) {
      sessions = allSessions.filter(function(s) {
        return String(s.studentId) === String(filterId);
      });
    }

    // Sort by date descending (terbaru di atas)
    sessions.sort(function(a, b) {
      const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
      const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
      return dateB - dateA;
    });

    if (!sessions.length) {
      body.innerHTML = '<div class="load-state">' +
        '<span class="material-icons-round" style="animation:none">menu_book</span>' +
        '<div style="margin-top:.5rem;font-weight:700">' + 
        JEC.esc(JEC.t('logbook_empty') || 'No sessions yet') + '</div>' +
        '<div style="font-size:.72rem;margin-top:.3rem">' +
        JEC.esc(JEC.t('logbook_hint') || 'Tutor will add session notes here') +
        '</div>' +
        '</div>';
      return;
    }

    let html = '';

    // Summary
    html += '<div class="sr" style="margin-bottom:.8rem">';
    html += '<span>' + JEC.esc(JEC.t('total_sessions') || 'Total Sessions') + '</span>';
    html += '<b>' + sessions.length + '</b>';
    html += '</div>';

    // Session cards
    sessions.forEach(function(session) {
      const dateStr = JEC_LOGBOOK.formatDate(session.date);
      const moduleIcon = JEC_LOGBOOK.getModuleIcon(session.module);
      const moduleName = JEC_LOGBOOK.getModuleName(session.module);

      html += '<div class="bm-card" style="flex-direction:column;align-items:stretch;gap:.4rem">';
      
      // Header row
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<b style="display:flex;align-items:center;gap:.4rem">';
      html += '<span class="material-icons-round" style="font-size:16px;color:var(--p)">' + moduleIcon + '</span>';
      html += JEC.esc(dateStr);
      html += '</b>';
      html += '<span class="tag">' + (session.duration || 60) + ' min</span>';
      html += '</div>';

      // Module & unit info
      html += '<div class="tx-m" style="font-size:.72rem">';
      html += JEC.esc(moduleName);
      if (session.unit) html += ' • ' + JEC.esc(session.unit);
      if (session.part) html += ' • ' + JEC.esc(session.part);
      html += '</div>';

      // Notes
      if (session.notes) {
        html += '<div style="background:var(--sf);border-left:3px solid var(--p);padding:.5rem .7rem;border-radius:6px;font-size:.78rem;margin-top:.3rem">';
        html += '<span class="material-icons-round" style="font-size:12px;vertical-align:middle;color:var(--tx2)">edit_note</span> ';
        html += JEC.esc(session.notes);
        html += '</div>';
      }

      // Homework
      if (session.homework) {
        html += '<div style="background:rgba(252,175,69,.1);border-left:3px solid var(--acc);padding:.5rem .7rem;border-radius:6px;font-size:.72rem;margin-top:.3rem">';
        html += '<span class="material-icons-round" style="font-size:12px;vertical-align:middle;color:var(--acc)">task</span> ';
        html += '<b>' + JEC.esc(JEC.t('homework') || 'Homework') + ':</b> ';
        html += JEC.esc(session.homework);
        html += '</div>';
      }

      // Next session
      if (session.nextSession) {
        html += '<div class="tx-m" style="font-size:.68rem;margin-top:.2rem">';
        html += '<span class="material-icons-round" style="font-size:11px;vertical-align:middle">event</span> ';
        html += JEC.esc(JEC.t('next_session') || 'Next') + ': ' + JEC_LOGBOOK.formatDate(session.nextSession);
        html += '</div>';
      }

      html += '</div>';
    });

    body.innerHTML = html;
  },

  // ═══════════ HELPERS ═══════════
  formatDate: function(dateStr) {
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
  },

  getModuleIcon: function(module) {
    const icons = {
      speaking: 'record_voice_over',
      vocabulary: 'translate',
      grammar: 'edit_note',
      writing: 'draw',
      listening: 'hearing',
      spe: 'record_voice_over',
      voc: 'translate',
      gra: 'edit_note',
      wri: 'draw',
      lis: 'hearing'
    };
    return icons[module] || 'folder';
  },

  getModuleName: function(module) {
    const modules = JEC.config.MODULES || {};
    const modInfo = modules[module] || null;
    
    if (modInfo) {
      return JEC.lang === 'id' ? (modInfo.id || module) : (modInfo.en || module);
    }
    
    // Fallback for full names
    const names = {
      speaking: JEC.lang === 'id' ? 'Speaking' : 'Speaking',
      vocabulary: JEC.lang === 'id' ? 'Kosakata' : 'Vocabulary',
      grammar: JEC.lang === 'id' ? 'Tata Bahasa' : 'Grammar',
      writing: JEC.lang === 'id' ? 'Menulis' : 'Writing',
      listening: JEC.lang === 'id' ? 'Mendengarkan' : 'Listening'
    };
    return names[module] || module || '-';
  },

  // ═══════════ GET COUNT ═══════════
  getCount: function() {
    const lbData = JEC.lbData || {};
    const allSessions = lbData.sessions || [];
    const filterId = JEC.user ? JEC.user.id : '';
    
    if (!filterId) return allSessions.length;
    
    return allSessions.filter(function(s) {
      return String(s.studentId) === String(filterId);
    }).length;
  },

  // ═══════════ REFRESH ═══════════
  refresh: function() {
    if (document.getElementById('ov-logbook') && 
        document.getElementById('ov-logbook').classList.contains('active')) {
      JEC_LOGBOOK.render();
    }
  }
};

// ═══════════ INIT FUNCTION (dipanggil oleh j.js) ═══════════
window.JEC_LOGBOOK_INIT = function(JEC_REF) {
  JEC_LOGBOOK.init();
};

// ═══════════ REFRESH FUNCTION ═══════════
window.JEC_LOGBOOK_REFRESH = function(JEC_REF) {
  // Update overlay title saat language change
  const titleEl = document.querySelector('#ov-logbook .modal-header span:nth-child(2)');
  if (titleEl) {
    titleEl.textContent = JEC.t('logbook') || 'Logbook';
  }
  JEC_LOGBOOK.refresh();
};
