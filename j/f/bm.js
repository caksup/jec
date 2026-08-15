// JEC v.1.06 | 15/08/2026 | j/f/ | Bookmark Module

'use strict';

window.JEC_BM_INIT = function(JEC) {
  // Bookmark UI di-render oleh profile.js tab 'bm'
  // File ini menyediakan API tambahan untuk bookmark
};

window.JEC_BM_REFRESH = function(JEC) {
  // Refresh UI jika profile sedang tampil
  if (typeof JEC_PROFILE !== 'undefined' && JEC_PROFILE.activeTab === 'bm') {
    JEC_PROFILE.render();
  }
};

window.JEC_BM = {
  getAll: function() {
    return JEC.bookmarkList || [];
  },
  
  getCount: function() {
    return (JEC.bookmarkList || []).length;
  },
  
  isBookmarked: function(module, unitId, partId) {
    const key = module + '_' + unitId + '_' + partId;
    return (JEC.bookmarkList || []).indexOf(key) !== -1;
  },
  
  getInfo: function(key) {
    const parts = key.split('_');
    if (parts.length < 3) return null;
    
    const module = parts[0];
    const unitId = parts[1];
    const partId = parts.slice(2).join('_');
    
    const materi = JEC.materiData[module] || {};
    const unit = (materi.materials || {})[unitId] || {};
    const part = (unit.parts || {})[partId] || {};
    
    return {
      module: module,
      unitId: unitId,
      partId: partId,
      title: part.title || partId,
      unitTitle: unit.title || unitId,
      moduleName: (JEC.config.MODULES[module] && (JEC.lang === 'id' ? JEC.config.MODULES[module].id : JEC.config.MODULES[module].en)) || module
    };
  },
  
  navigateTo: function(key) {
    const info = this.getInfo(key);
    if (!info) return;
    
    JEC.switchView('learn');
    
    if (typeof JEC_UI !== 'undefined' && JEC_UI.navigateToMateri) {
      JEC_UI.navigateToMateri(info.module, info.unitId, info.partId);
    }
  },
  
  removeByKey: function(key) {
    const info = this.getInfo(key);
    if (!info) return;
    
    JEC.removeBookmark(info.module, info.unitId, info.partId);
    
    if (typeof JEC_PROFILE !== 'undefined' && JEC_PROFILE.activeTab === 'bm') {
      JEC_PROFILE.render();
    }
  },
  
  clearAll: function() {
    if (!confirm(JEC.t('clear_all_bm') || 'Clear all bookmarks?')) return;
    
    const list = JEC.bookmarkList.slice();
    list.forEach(key => {
      const info = this.getInfo(key);
      if (info) JEC.removeBookmark(info.module, info.unitId, info.partId);
    });
    
    if (typeof JEC_PROFILE !== 'undefined') JEC_PROFILE.render();
    JEC.toast(JEC.t('bm_cleared') || 'All bookmarks cleared', 'success');
  }
};
