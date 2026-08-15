// JEC v.1.06 | 15/08/2026 | j/f/ | Logbook Module

'use strict';

window.JEC_LOGBOOK_INIT = function(JEC) {
  JEC_LOGBOOK.state = { sessions: [] };
  JEC_LOGBOOK.load();
};

window.JEC_LOGBOOK_REFRESH = function(JEC) {
  JEC_LOGBOOK.load();
};

window.JEC_LOGBOOK = {
  state: { sessions: [] },
  
  load: function() {
    const lbData = JEC.lbData || {};
    this.state.sessions = lbData.sessions || [];
  },
  
  render: function() {
    const sessions = this.getSessionsForUser();
    
    if (!sessions.length) {
      return '<div class="empty-state"><span class="material-icons-round empty-icon">menu_book</span><div>' + (JEC.t('logbook_empty') || 'No offline meeting notes yet.') + '</div></div>';
    }
    
    let html = '<div class="logbook-list">';
    
    // Sort by date descending
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sessions.forEach(s => {
      const date = this.formatDate(s.date);
      const modName = (JEC.config.MODULES[s.module] && (JEC.lang === 'id' ? JEC.config.MODULES[s.module].id : JEC.config.MODULES[s.module].en)) || s.module || '—';
      
      html += '<div class="logbook-item">';
      html += '<div class="logbook-header">';
      html += '<span class="material-icons-round logbook-date-icon">event</span>';
      html += '<span class="logbook-date">' + JEC.esc(date) + '</span>';
      if (s.time) html += '<span class="logbook-time">' + JEC.esc(s.time) + '</span>';
      html += '</div>';
      html += '<div class="logbook-body">';
      html += '<div class="logbook-meta">';
      html += '<span class="logbook-tag">' + JEC.esc(modName) + '</span>';
      if (s.unit) html += '<span class="logbook-tag">' + JEC.esc(s.unit) + '</span>';
      if (s.part) html += '<span class="logbook-tag">' + JEC.esc(s.part) + '</span>';
      html += '</div>';
      if (s.notes) {
        html += '<div class="logbook-notes">' + JEC.esc(s.notes) + '</div>';
      }
      if (s.tutor) {
        html += '<div class="logbook-tutor">';
        html += '<span class="material-icons-round">person</span>';
        html += '<span>' + (JEC.t('tutor') || 'Tutor') + ': ' + JEC.esc(s.tutor) + '</span>';
        html += '</div>';
      }
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div>';
    return html;
  },
  
  getSessionsForUser: function() {
    if (!JEC.user) return [];
    const sessions = this.state.sessions || [];
    return sessions.filter(s => String(s.studentId) === String(JEC.user.id));
  },
  
  formatDate: function(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(JEC.lang === 'id' ? 'id-ID' : 'en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch(e) {
      return '—';
    }
  }
};
