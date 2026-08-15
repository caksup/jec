// JEC v.1.06 | 15/08/2026 | j/f/ | Notes Module

'use strict';

window.JEC_NOTES_INIT = function(JEC) {
  // Notes UI di-render oleh profile.js tab 'notes'
  // File ini menyediakan API tambahan untuk notes
};

window.JEC_NOTES_REFRESH = function(JEC) {
  if (typeof JEC_PROFILE !== 'undefined' && JEC_PROFILE.activeTab === 'notes') {
    JEC_PROFILE.render();
  }
};

window.JEC_NOTES = {
  getAll: function() {
    return JEC.notesMap || {};
  },
  
  getCount: function() {
    return Object.keys(JEC.notesMap || {}).length;
  },
  
  get: function(module, unitId, partId) {
    const key = module + '_' + unitId + '_' + partId;
    return (JEC.notesMap || {})[key] || '';
  },
  
  set: function(module, unitId, partId, content) {
    JEC.saveNote(module, unitId, partId, content);
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
  
  deleteByKey: function(key) {
    const info = this.getInfo(key);
    if (!info) return;
    
    JEC.saveNote(info.module, info.unitId, info.partId, '');
    
    if (typeof JEC_PROFILE !== 'undefined' && JEC_PROFILE.activeTab === 'notes') {
      JEC_PROFILE.render();
    }
    
    JEC.toast(JEC.t('note_deleted') || 'Note deleted', 'warning');
  },
  
  clearAll: function() {
    if (!confirm(JEC.t('clear_all_notes') || 'Clear all notes?')) return;
    
    const map = JEC.notesMap || {};
    Object.keys(map).forEach(key => {
      const info = this.getInfo(key);
      if (info) JEC.saveNote(info.module, info.unitId, info.partId, '');
    });
    
    if (typeof JEC_PROFILE !== 'undefined') JEC_PROFILE.render();
    JEC.toast(JEC.t('notes_cleared') || 'All notes cleared', 'success');
  },
  
  search: function(query) {
    const results = [];
    const q = (query || '').toLowerCase();
    const map = JEC.notesMap || {};
    
    Object.entries(map).forEach(pair => {
      const key = pair[0];
      const content = pair[1];
      if ((content || '').toLowerCase().indexOf(q) !== -1) {
        const info = this.getInfo(key);
        if (info) {
          results.push({
            key: key,
            info: info,
            content: content,
            preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
          });
        }
      }
    });
    
    return results;
  }
};
