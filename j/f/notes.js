// JEC v.7.00 MODULAR | 16/08/2026 | j/f/notes.js | Notes Manager
// Dipanggil dari: profile.js (tab Data → Notes section)
// Membuat overlay dynamic #ov-notes saat pertama kali init
// Lazy load (Priority 3) — load saat user klik tab Profile

'use strict';

window.JEC_NOTES = {
  state: {
    initialized: false,
    notes: [],
    lastFetch: 0,
    cacheMs: 30000 // 30 detik cache
  },

  // ═══════════ INIT ═══════════
  init: function() {
    if (JEC_NOTES.state.initialized) return;
    JEC_NOTES.createOverlay();
    JEC_NOTES.state.initialized = true;
    console.log('[JEC_NOTES] Initialized');
  },

  // ═══════════ CREATE OVERLAY (DYNAMIC) ═══════════
  createOverlay: function() {
    if (document.getElementById('ov-notes')) return;

    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'ov-notes';
    ov.innerHTML = 
      '<div class="modal">' +
      '<div class="modal-header">' +
      '<span class="material-icons-round modal-icon">edit_note</span>' +
      '<span>' + JEC.esc(JEC.t('notes') || 'My Notes') + '</span>' +
      '<button class="icon-btn modal-close" onclick="JEC.closeOv(\'ov-notes\')">' +
      '<span class="material-icons-round">close</span>' +
      '</button>' +
      '</div>' +
      '<div id="notes-body">' +
      '<div class="load-state">' +
      '<span class="material-icons-round">sync</span>' +
      JEC.esc(JEC.t('loading_more') || 'Loading...') +
      '</div>' +
      '</div>' +
      '</div>';

    document.body.appendChild(ov);
  },

  // ═══════════ OPEN OVERLAY ═══════════
  open: function() {
    JEC_NOTES.init();
    JEC.openOv('ov-notes');
    JEC_NOTES.loadNotes();
  },

  // ═══════════ LOAD NOTES ═══════════
  loadNotes: async function() {
    const state = JEC_NOTES.state;
    const body = document.getElementById('notes-body');
    if (!body) return;

    // Check cache
    const now = Date.now();
    if (state.notes.length > 0 && (now - state.lastFetch) < state.cacheMs) {
      JEC_NOTES.render(state.notes);
      return;
    }

    // Show loading
    body.innerHTML = '<div class="load-state">' +
      '<span class="material-icons-round">sync</span>' +
      JEC.esc(JEC.t('loading_more') || 'Loading notes...') +
      '</div>';

    try {
      // Try fetch from Apps Script
      const data = await JEC.apiGet({ action: 'fetch_notes', id: JEC.user.id });
      let rows = [];

      if (Array.isArray(data)) {
        rows = data;
      } else if (data && Array.isArray(data.rows)) {
        rows = data.rows;
      } else if (data && Array.isArray(data.data)) {
        rows = data.data;
      }

      state.notes = rows;
      state.lastFetch = now;
      JEC_NOTES.render(rows);

    } catch (e) {
      console.warn('[JEC_NOTES] Fetch failed, using local:', e.message);
      // Fallback to local storage
      const local = JEC.notesMap || {};
      const rows = Object.keys(local).map(function(key) {
        const parts = key.split('_');
        return {
          module: parts[0] || '',
          unitId: parts[1] || '',
          partId: parts.slice(2).join('_') || '',
          content: local[key] || '',
          key: key
        };
      }).filter(function(n) { return n.content && n.content.trim(); });

      state.notes = rows;
      JEC_NOTES.render(rows);
    }
  },

  // ═══════════ RENDER ═══════════
  render: function(notes) {
    const body = document.getElementById('notes-body');
    if (!body) return;

    if (!notes || !notes.length) {
      body.innerHTML = '<div class="load-state">' +
        '<span class="material-icons-round" style="animation:none">edit_note</span>' +
        '<div style="margin-top:.5rem;font-weight:700">' + 
        JEC.esc(JEC.t('no_notes') || 'No notes yet') + '</div>' +
        '<div style="font-size:.72rem;margin-top:.3rem">' +
        JEC.esc(JEC.t('notes_hint') || 'Write notes on any material to save them here') +
        '</div>' +
        '</div>';
      return;
    }

    // Group by module
    const byModule = {};
    notes.forEach(function(note) {
      const mod = note.module || 'unknown';
      if (!byModule[mod]) byModule[mod] = [];
      byModule[mod].push(note);
    });

    const modules = JEC.config.MODULES || {};
    let html = '';

    Object.keys(byModule).sort().forEach(function(mod) {
      const modInfo = modules[mod] || { icon: 'folder', en: mod, id: mod };
      const modName = JEC.lang === 'id' ? (modInfo.id || mod) : (modInfo.en || mod);
      const items = byModule[mod];

      // Module header
      html += '<div class="sec-t" style="margin-top:.8rem">';
      html += '<span class="material-icons-round">' + modInfo.icon + '</span>';
      html += '<span>' + JEC.esc(modName) + '</span>';
      html += '<span class="tag" style="margin-left:auto">' + items.length + '</span>';
      html += '</div>';

      // Group by unit
      const byUnit = {};
      items.forEach(function(note) {
        const u = note.unitId || '(general)';
        if (!byUnit[u]) byUnit[u] = [];
        byUnit[u].push(note);
      });

      Object.keys(byUnit).sort().forEach(function(unitId) {
        const unitItems = byUnit[unitId];
        
        // Get unit title from materiData
        const materi = JEC.materiData[mod] || {};
        const unit = (materi.materials || {})[unitId] || {};
        const unitTitle = unit.title || unitId;

        html += '<div style="font-size:.72rem;font-weight:700;color:var(--tx2);margin:.4rem 0 .2rem;padding-left:.3rem">' + 
          JEC.esc(unitTitle) + '</div>';

        unitItems.forEach(function(note) {
          const partId = note.partId || '';
          const part = (unit.parts || {})[partId] || {};
          const partTitle = part.title || partId;
          const content = note.content || '';
          const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;

          html += '<div class="bm-card">';
          html += '<div style="flex:1;min-width:0">';
          html += '<b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + 
            JEC.esc(partTitle) + '</b>';
          html += '<div class="tx-m" style="white-space:pre-wrap;font-size:.72rem;margin-top:.2rem">' + 
            JEC.esc(preview) + '</div>';
          html += '</div>';
          html += '<div class="acts" style="display:flex;gap:.3rem;flex-shrink:0">';
          html += '<button class="icon-btn" style="background:var(--sf);color:var(--tx);width:28px;height:28px" ' +
            'onclick="JEC_NOTES.navigateTo(\'' + mod + '\',\'' + unitId + '\',\'' + partId + '\')" ' +
            'title="' + JEC.esc(JEC.t('open') || 'Open') + '">' +
            '<span class="material-icons-round" style="font-size:14px">open_in_new</span></button>';
          html += '<button class="icon-btn" style="background:var(--sf);color:var(--danger);width:28px;height:28px" ' +
            'onclick="JEC_NOTES.remove(\'' + mod + '\',\'' + unitId + '\',\'' + partId + '\')" ' +
            'title="' + JEC.esc(JEC.t('delete') || 'Delete') + '">' +
            '<span class="material-icons-round" style="font-size:14px">delete</span></button>';
          html += '</div>';
          html += '</div>';
        });
      });
    });

    body.innerHTML = html;
  },

  // ═══════════ NAVIGATE TO MATERIAL ═══════════
  navigateTo: function(module, unitId, partId) {
    JEC.closeOv('ov-notes');

    // Switch to learn view
    JEC.switchView('learn');

    // Navigate via hash
    JEC.updateHash(module, unitId, partId);

    // If learn module is loaded, render materi
    if (typeof JEC_LEARN !== 'undefined' && JEC_LEARN.renderMateri) {
      JEC.currentModule = module;
      JEC.currentUnitId = unitId;
      JEC.currentPartId = partId;

      JEC_LEARN.state.module = module;
      JEC_LEARN.state.unitId = unitId;
      JEC_LEARN.state.partId = partId;
      JEC_LEARN.state.view = 'materi';

      JEC_LEARN.renderMateri(module, unitId, partId);
    }

    JEC.logActivity('notes_navigate', module + '/' + unitId + '/' + partId);
  },

  // ═══════════ REMOVE NOTE ═══════════
  remove: function(module, unitId, partId) {
    const confirmMsg = JEC.t('notes_remove_confirm') || 'Delete this note?';
    if (!confirm(confirmMsg)) return;

    // Remove from local
    JEC.saveNote(module, unitId, partId, '');

    // Re-render
    JEC_NOTES.loadNotes();

    // Toast
    JEC.toast(JEC.t('note_deleted') || 'Note deleted', 'warning', 1500);

    // Log
    JEC.logActivity('notes_remove', module + '/' + unitId + '/' + partId);
  },

  // ═══════════ GET COUNT ═══════════
  getCount: function() {
    return Object.keys(JEC.notesMap || {}).filter(function(k) {
      return JEC.notesMap[k] && JEC.notesMap[k].trim();
    }).length;
  },

  // ═══════════ REFRESH ═══════════
  refresh: function() {
    JEC_NOTES.state.lastFetch = 0; // Force re-fetch
    if (document.getElementById('ov-notes') && 
        document.getElementById('ov-notes').classList.contains('active')) {
      JEC_NOTES.loadNotes();
    }
  }
};

// ═══════════ INIT FUNCTION (dipanggil oleh j.js) ═══════════
window.JEC_NOTES_INIT = function(JEC_REF) {
  JEC_NOTES.init();
};

// ═══════════ REFRESH FUNCTION ═══════════
window.JEC_NOTES_REFRESH = function(JEC_REF) {
  // Update overlay title saat language change
  const titleEl = document.querySelector('#ov-notes .modal-header span:nth-child(2)');
  if (titleEl) {
    titleEl.textContent = JEC.t('notes') || 'My Notes';
  }
  JEC_NOTES.refresh();
};
