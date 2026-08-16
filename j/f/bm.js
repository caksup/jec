// JEC v.7.00 MODULAR | 16/08/2026 | j/f/bm.js | Bookmarks Manager
// Dipanggil dari: profile.js (tab Data → Bookmarks section)
// Membuat overlay dynamic #ov-bm saat pertama kali init
// Lazy load (Priority 3) — load saat user klik tab Profile

'use strict';

window.JEC_BM = {
  state: {
    initialized: false,
    bookmarks: [],
    lastFetch: 0,
    cacheMs: 30000 // 30 detik cache
  },

  // ═══════════ INIT ═══════════
  init: function() {
    if (JEC_BM.state.initialized) return;
    JEC_BM.createOverlay();
    JEC_BM.state.initialized = true;
    console.log('[JEC_BM] Initialized');
  },

  // ═══════════ CREATE OVERLAY (DYNAMIC) ═══════════
  createOverlay: function() {
    if (document.getElementById('ov-bm')) return;

    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'ov-bm';
    ov.innerHTML = 
      '<div class="modal">' +
      '<div class="modal-header">' +
      '<span class="material-icons-round modal-icon">bookmark</span>' +
      '<span>' + JEC.esc(JEC.t('bookmarks') || 'Bookmarks') + '</span>' +
      '<button class="icon-btn modal-close" onclick="JEC.closeOv(\'ov-bm\')">' +
      '<span class="material-icons-round">close</span>' +
      '</button>' +
      '</div>' +
      '<div id="bm-body">' +
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
    JEC_BM.init();
    JEC.openOv('ov-bm');
    JEC_BM.loadBookmarks();
  },

  // ═══════════ LOAD BOOKMARKS ═══════════
  loadBookmarks: async function() {
    const state = JEC_BM.state;
    const body = document.getElementById('bm-body');
    if (!body) return;

    // Check cache
    const now = Date.now();
    if (state.bookmarks.length > 0 && (now - state.lastFetch) < state.cacheMs) {
      JEC_BM.render(state.bookmarks);
      return;
    }

    // Show loading
    body.innerHTML = '<div class="load-state">' +
      '<span class="material-icons-round">sync</span>' +
      JEC.esc(JEC.t('loading_more') || 'Loading bookmarks...') +
      '</div>';

    try {
      // Try fetch from Apps Script
      const data = await JEC.apiGet({ action: 'fetch_bookmarks', id: JEC.user.id });
      let rows = [];

      if (Array.isArray(data)) {
        rows = data;
      } else if (data && Array.isArray(data.rows)) {
        rows = data.rows;
      } else if (data && Array.isArray(data.data)) {
        rows = data.data;
      }

      state.bookmarks = rows;
      state.lastFetch = now;
      JEC_BM.render(rows);

    } catch (e) {
      console.warn('[JEC_BM] Fetch failed, using local:', e.message);
      // Fallback to local storage
      const local = JEC.bookmarkList || [];
      state.bookmarks = local.map(function(key) {
        const parts = key.split('_');
        return {
          module: parts[0] || '',
          unitId: parts[1] || '',
          partId: parts.slice(2).join('_') || '',
          key: key
        };
      });
      JEC_BM.render(state.bookmarks);
    }
  },

  // ═══════════ RENDER ═══════════
  render: function(bookmarks) {
    const body = document.getElementById('bm-body');
    if (!body) return;

    if (!bookmarks || !bookmarks.length) {
      body.innerHTML = '<div class="load-state">' +
        '<span class="material-icons-round" style="animation:none">bookmark_border</span>' +
        '<div style="margin-top:.5rem;font-weight:700">' + 
        JEC.esc(JEC.t('no_bookmarks') || 'No bookmarks yet') + '</div>' +
        '<div style="font-size:.72rem;margin-top:.3rem">' +
        JEC.esc(JEC.t('bm_hint') || 'Tap bookmark icon on any material to save it here') +
        '</div>' +
        '</div>';
      return;
    }

    // Group by module
    const byModule = {};
    bookmarks.forEach(function(bm) {
      const mod = bm.module || 'unknown';
      if (!byModule[mod]) byModule[mod] = [];
      byModule[mod].push(bm);
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
      items.forEach(function(bm) {
        const u = bm.unitId || '(general)';
        if (!byUnit[u]) byUnit[u] = [];
        byUnit[u].push(bm);
      });

      Object.keys(byUnit).sort().forEach(function(unitId) {
        const unitItems = byUnit[unitId];
        
        // Get unit title from materiData
        const materi = JEC.materiData[mod] || {};
        const unit = (materi.materials || {})[unitId] || {};
        const unitTitle = unit.title || unitId;

        html += '<div style="font-size:.72rem;font-weight:700;color:var(--tx2);margin:.4rem 0 .2rem;padding-left:.3rem">' + 
          JEC.esc(unitTitle) + '</div>';

        unitItems.forEach(function(bm, idx) {
          const partId = bm.partId || '';
          const part = (unit.parts || {})[partId] || {};
          const partTitle = part.title || partId;
          const bmKey = mod + '_' + unitId + '_' + partId;

          html += '<div class="bm-card">';
          html += '<div style="flex:1;min-width:0">';
          html += '<b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + 
            JEC.esc(partTitle) + '</b>';
          html += '<div class="tx-m">' + JEC.esc(partId) + '</div>';
          html += '</div>';
          html += '<div class="acts" style="display:flex;gap:.3rem;flex-shrink:0">';
          html += '<button class="icon-btn" style="background:var(--sf);color:var(--tx);width:28px;height:28px" ' +
            'onclick="JEC_BM.navigateTo(\'' + mod + '\',\'' + unitId + '\',\'' + partId + '\')" ' +
            'title="' + JEC.esc(JEC.t('open') || 'Open') + '">' +
            '<span class="material-icons-round" style="font-size:14px">open_in_new</span></button>';
          html += '<button class="icon-btn" style="background:var(--sf);color:var(--danger);width:28px;height:28px" ' +
            'onclick="JEC_BM.remove(\'' + mod + '\',\'' + unitId + '\',\'' + partId + '\')" ' +
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
    JEC.closeOv('ov-bm');

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

    JEC.logActivity('bm_navigate', module + '/' + unitId + '/' + partId);
  },

  // ═══════════ REMOVE BOOKMARK ═══════════
  remove: function(module, unitId, partId) {
    const confirmMsg = JEC.t('bm_remove_confirm') || 'Remove this bookmark?';
    if (!confirm(confirmMsg)) return;

    // Remove from local
    JEC.removeBookmark(module, unitId, partId);

    // Re-render
    JEC_BM.loadBookmarks();

    // Toast
    JEC.toast(JEC.t('bookmark_removed') || 'Bookmark removed', 'warning', 1500);

    // Log
    JEC.logActivity('bm_remove', module + '/' + unitId + '/' + partId);
  },

  // ═══════════ GET COUNT ═══════════
  getCount: function() {
    return (JEC.bookmarkList || []).length;
  },

  // ═══════════ REFRESH ═══════════
  refresh: function() {
    JEC_BM.state.lastFetch = 0; // Force re-fetch
    if (document.getElementById('ov-bm') && 
        document.getElementById('ov-bm').classList.contains('active')) {
      JEC_BM.loadBookmarks();
    }
  }
};

// ═══════════ INIT FUNCTION (dipanggil oleh j.js) ═══════════
window.JEC_BM_INIT = function(JEC_REF) {
  JEC_BM.init();
};

// ═══════════ REFRESH FUNCTION ═══════════
window.JEC_BM_REFRESH = function(JEC_REF) {
  // Update overlay title saat language change
  const titleEl = document.querySelector('#ov-bm .modal-header span:nth-child(2)');
  if (titleEl) {
    titleEl.textContent = JEC.t('bookmarks') || 'Bookmarks';
  }
  JEC_BM.refresh();
};
