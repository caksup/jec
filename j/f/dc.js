// JEC v.1.04 | 15/08/2026 | j/f/dc.js | Daily Challenge

window.JEC_DC_INIT = function(JEC) {
  JEC_DC.setupBalloon();
  JEC_DC.updateVisibility();
};

window.JEC_DC_REFRESH = function(JEC) {
  JEC_DC.updateVisibility();
};

window.JEC_DC = {
  setupBalloon: function() {
    const balloon = document.getElementById('feat-dc-balloon');
    if (!balloon) return;
    
    balloon.onclick = function() {
      JEC_DC.openModal();
    };
  },
  
  updateVisibility: function() {
    const balloon = document.getElementById('feat-dc-balloon');
    if (!balloon) return;
    
    if (JEC.currentDC && JEC.dcToday && !JEC.dcToday.completed) {
      balloon.classList.add('show');
    } else {
      balloon.classList.remove('show');
    }
  },
  
  openModal: function() {
    if (!JEC.currentDC) return;
    
    const content = document.getElementById('feat-dc-content');
    if (!content) return;
    
    const ch = JEC.currentDC;
    const isCompleted = JEC.dcToday && JEC.dcToday.completed;
    
    let html = '<div class="dc-modal-content">';
    
    html += '<div class="dc-icon-wrap">';
    html += '<span class="material-icons-round dc-icon">' + ch.icon + '</span>';
    html += '</div>';
    
    html += '<div class="dc-title">' + JEC.esc(JEC.lang === 'id' ? ch.id : ch.en) + '</div>';
    html += '<div class="dc-desc">' + JEC.esc(JEC.lang === 'id' ? ch.id_d : ch.en_d) + '</div>';
    
    html += '<div class="dc-reward">';
    html += '<span class="material-icons-round">stars</span>';
    html += '<span>+' + (ch.xp || 20) + ' XP</span>';
    html += '</div>';
    
    if (isCompleted) {
      html += '<div class="dc-status completed">';
      html += '<span class="material-icons-round">check_circle</span>';
      html += '<span>' + JEC.t('dc_completed') + '</span>';
      html += '</div>';
    } else {
      html += '<div class="dc-status pending">';
      html += '<span class="material-icons-round">hourglass_empty</span>';
      html += '<span>' + JEC.t('dc_pending') + '</span>';
      html += '</div>';
      html += '<div class="dc-hint">' + JEC.t('dc_auto_hint') + '</div>';
    }
    
    html += '</div>';
    
    content.innerHTML = html;
    JEC.openOv('ov-dc');
  }
};

// Hook untuk update balloon saat DC complete
window.JEC_DC_COMPLETE_UI = function(challenge) {
  JEC_DC.updateVisibility();
};
