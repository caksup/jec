// JEC v.1.04 | 15/08/2026 | j/f/ach.js | Achievements Grid

window.JEC_ACH_INIT = function(JEC) {
  // Achievements di-render oleh profile.js saat tab 'ach' aktif
};

window.JEC_ACH_REFRESH = function(JEC) {
  // Re-render jika profile sedang tampil
};

window.JEC_ACH = {
  renderGrid: function() {
    const achs = JEC.config.ACHIEVEMENTS || [];
    if (!achs.length) {
      return '<div class="empty-state"><span class="material-icons-round empty-icon">emoji_events</span><div>' + JEC.t('no_ach') + '</div></div>';
    }
    
    const unlockedCount = JEC.unlockedAch.length;
    const totalCount = achs.length;
    const percent = Math.round((unlockedCount / totalCount) * 100);
    
    let html = '';
    
    // Progress bar
    html += '<div class="ach-progress">';
    html += '<div class="ach-progress-info">';
    html += '<span class="material-icons-round">emoji_events</span>';
    html += '<span>' + unlockedCount + '/' + totalCount + ' ' + JEC.t('unlocked') + '</span>';
    html += '<span class="ach-percent">' + percent + '%</span>';
    html += '</div>';
    html += '<div class="ach-progress-bar"><div class="ach-progress-fill" style="width:' + percent + '%"></div></div>';
    html += '</div>';
    
    // Grid
    html += '<div class="ach-grid">';
    achs.forEach(function(ach) {
      const unlocked = JEC.unlockedAch.includes(ach.id);
      const name = JEC.lang === 'id' ? ach.id : ach.en;
      const desc = JEC.lang === 'id' ? ach.id_d : ach.en_d;
      
      html += '<div class="ach-item ' + (unlocked ? 'unlocked' : 'locked') + '" title="' + JEC.esc(desc) + '">';
      html += '<span class="material-icons-round ach-icon">' + ach.icon + '</span>';
      html += '<div class="ach-name">' + JEC.esc(name) + '</div>';
      html += '<div class="ach-xp">+' + (ach.xp || 0) + ' XP</div>';
      if (!unlocked) {
        html += '<span class="material-icons-round ach-lock">lock</span>';
      }
      html += '</div>';
    });
    html += '</div>';
    
    return html;
  }
};

// Hook untuk update UI saat achievement unlocked
window.JEC_ACH_UI_UPDATE = function() {
  if (typeof JEC_PROFILE !== 'undefined' && JEC_PROFILE.activeTab === 'ach') {
    JEC_PROFILE.render();
  }
};
