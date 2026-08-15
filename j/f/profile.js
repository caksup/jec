// JEC v.1.04 | 15/08/2026 | j/f/profile.js | Profile + Tabs + Avatar

window.JEC_PROFILE_INIT = function(JEC) {
  JEC_PROFILE.render();
};

window.JEC_PROFILE_REFRESH = function(JEC) {
  JEC_PROFILE.render();
};

window.JEC_PROFILE = {
  activeTab: 'data',
  
  render: function() {
    const container = document.getElementById('feat-profile');
    if (!container || !JEC.user) return;
    
    let html = '';
    
    // Profile Card
    html += '<div class="profile-card">';
    html += '<div class="profile-avatar-wrap" onclick="JEC_PROFILE.openAvatarSelector()">';
    html += '<div class="profile-avatar" id="profile-avatar-display">';
    html += JEC.renderAvatar(JEC.avatar, 80);
    html += '</div>';
    html += '<span class="material-icons-round avatar-edit-icon">edit</span>';
    html += '</div>';
    html += '<div class="profile-name">' + JEC.esc(JEC.user.name) + '</div>';
    html += '<div class="profile-nickname" id="profile-nickname-display">';
    html += JEC.user.nickname ? '@' + JEC.esc(JEC.user.nickname) : '<span class="nickname-empty">' + JEC.t('set_nickname') + '</span>';
    html += '</div>';
    html += '<div class="profile-id">#' + JEC.esc(JEC.user.id) + '</div>';
    
    // Stats Row
    html += '<div class="stats-row">';
    html += '<div class="stat-box"><div class="stat-val">' + JEC.stats.partsDone + '</div><div class="stat-lbl">' + JEC.t('parts_done') + '</div></div>';
    html += '<div class="stat-box"><div class="stat-val">' + JEC.stats.streak + '</div><div class="stat-lbl">' + JEC.t('day_streak') + '</div></div>';
    html += '<div class="stat-box"><div class="stat-val">' + (JEC.stats.partsDone * 10) + '</div><div class="stat-lbl">XP</div></div>';
    html += '<div class="stat-box"><div class="stat-val">' + (JEC.user.daysLeft || 0) + '</div><div class="stat-lbl">' + JEC.t('days_left') + '</div></div>';
    html += '</div>';
    html += '</div>';
    
    // Tabs
    html += '<div class="profile-card">';
    html += '<div class="ptabs">';
    html += '<button class="ptab-btn ' + (this.activeTab === 'data' ? 'active' : '') + '" onclick="JEC_PROFILE.switchTab(\'data\')">';
    html += '<span class="material-icons-round">person</span><span>' + JEC.t('data') + '</span></button>';
    html += '<button class="ptab-btn ' + (this.activeTab === 'ach' ? 'active' : '') + '" onclick="JEC_PROFILE.switchTab(\'ach\')">';
    html += '<span class="material-icons-round">emoji_events</span><span>' + JEC.t('achievements') + '</span></button>';
    html += '<button class="ptab-btn ' + (this.activeTab === 'bm' ? 'active' : '') + '" onclick="JEC_PROFILE.switchTab(\'bm\')">';
    html += '<span class="material-icons-round">bookmark</span><span>' + JEC.t('bookmarks') + '</span></button>';
    html += '<button class="ptab-btn ' + (this.activeTab === 'notes' ? 'active' : '') + '" onclick="JEC_PROFILE.switchTab(\'notes\')">';
    html += '<span class="material-icons-round">edit_note</span><span>' + JEC.t('notes') + '</span></button>';
    html += '</div>';
    
    // Tab Content
    html += '<div id="profile-tab-content">';
    html += this.renderTabContent();
    html += '</div>';
    html += '</div>';
    
    // Logout Button
    html += '<button class="btn-primary btn-logout" onclick="JEC.logout()">';
    html += '<span class="material-icons-round">logout</span>';
    html += '<span>' + JEC.t('logout') + '</span>';
    html += '</button>';
    
    container.innerHTML = html;
  },
  
  renderTabContent: function() {
    if (this.activeTab === 'data') return this.renderDataTab();
    if (this.activeTab === 'ach') return this.renderAchTab();
    if (this.activeTab === 'bm') return this.renderBmTab();
    if (this.activeTab === 'notes') return this.renderNotesTab();
    return '';
  },
  
  renderDataTab: function() {
    let html = '<div class="profile-data">';
    
    // Nickname editor
    html += '<div class="profile-field">';
    html += '<label>' + JEC.t('nickname') + '</label>';
    html += '<div class="nickname-editor">';
    html += '<span class="nickname-prefix">@</span>';
    html += '<input type="text" id="nickname-input" value="' + JEC.esc(JEC.user.nickname || '') + '" placeholder="' + JEC.t('enter_nickname') + '" maxlength="20">';
    html += '<button class="icon-btn" onclick="JEC_PROFILE.saveNickname()"><span class="material-icons-round">check</span></button>';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="info-row"><strong>' + JEC.t('class') + ':</strong> <span>' + JEC.esc(JEC.user.class) + '</span></div>';
    html += '<div class="info-row"><strong>' + JEC.t('batch') + ':</strong> <span>' + JEC.esc(JEC.user.batch) + '</span></div>';
    html += '<div class="info-row"><strong>' + JEC.t('joined') + ':</strong> <span>' + this.formatDate(JEC.user.startDate) + '</span></div>';
    html += '<div class="info-row"><strong>' + JEC.t('expires') + ':</strong> <span>' + (JEC.user.daysLeft || 0) + ' ' + JEC.t('days') + '</span></div>';
    
    html += '</div>';
    return html;
  },
  
  renderAchTab: function() {
    if (typeof JEC_ACH !== 'undefined' && JEC_ACH.renderGrid) {
      return JEC_ACH.renderGrid();
    }
    return '<div class="empty-state"><span class="material-icons-round empty-icon">emoji_events</span><div>' + JEC.t('ach_loading') + '</div></div>';
  },
  
  renderBmTab: function() {
    if (!JEC.bookmarkList.length) {
      return '<div class="empty-state"><span class="material-icons-round empty-icon">bookmark_border</span><div>' + JEC.t('no_bookmarks') + '</div></div>';
    }
    
    let html = '<div class="bm-list">';
    JEC.bookmarkList.forEach(function(key, idx) {
      const parts = key.split('_');
      const module = parts[0];
      const unitId = parts[1];
      const partId = parts[2];
      
      const materi = JEC.materiData[module] || {};
      const unit = (materi.materials || {})[unitId] || {};
      const part = (unit.parts || {})[partId] || {};
      
      html += '<div class="bm-item">';
      html += '<div class="bm-info">';
      html += '<div class="bm-title">' + JEC.esc(part.title || partId) + '</div>';
      html += '<div class="bm-sub">' + JEC.esc(unit.title || unitId) + ' · ' + JEC.t('modules.' + module) + '</div>';
      html += '</div>';
      html += '<button class="icon-btn bm-del" onclick="JEC_PROFILE.removeBm(' + idx + ')"><span class="material-icons-round">delete</span></button>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  },
  
  renderNotesTab: function() {
    const entries = Object.entries(JEC.notesMap);
    if (!entries.length) {
      return '<div class="empty-state"><span class="material-icons-round empty-icon">edit_note</span><div>' + JEC.t('no_notes') + '</div></div>';
    }
    
    let html = '<div class="notes-list">';
    entries.forEach(function(pair) {
      const key = pair[0];
      const content = pair[1];
      const parts = key.split('_');
      const module = parts[0];
      const unitId = parts[1];
      const partId = parts[2];
      
      const materi = JEC.materiData[module] || {};
      const unit = (materi.materials || {})[unitId] || {};
      const part = (unit.parts || {})[partId] || {};
      
      html += '<div class="note-item">';
      html += '<div class="note-info">';
      html += '<div class="note-title">' + JEC.esc(part.title || partId) + '</div>';
      html += '<div class="note-content">' + JEC.esc(content.substring(0, 80)) + (content.length > 80 ? '...' : '') + '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  },
  
  switchTab: function(tab) {
    this.activeTab = tab;
    this.render();
  },
  
  saveNickname: function() {
    const input = document.getElementById('nickname-input');
    if (!input) return;
    
    const nickname = input.value.trim().replace(/^@/, '');
    JEC.user.nickname = nickname;
    
    localStorage.setItem('jec_user', JSON.stringify(JEC.user));
    
    JEC.apiPost({
      action: 'update_nickname',
      id: JEC.user.id,
      nickname: nickname
    }).catch(function() {});
    
    this.render();
    JEC.toast(JEC.t('nickname_saved') || 'Nickname saved!', 'success');
  },
  
  removeBm: function(idx) {
    const key = JEC.bookmarkList[idx];
    if (!key) return;
    
    const parts = key.split('_');
    JEC.removeBookmark(parts[0], parts[1], parts[2]);
    this.render();
  },
  
  openAvatarSelector: function() {
    const avatars = JEC.config.AVATARS || [];
    
    let html = '<div class="avatar-grid">';
    avatars.forEach(function(av) {
      const selected = JEC.avatar === av.id;
      html += '<div class="avatar-option ' + (selected ? 'selected' : '') + '" onclick="JEC_PROFILE.selectAvatar(\'' + av.id + '\')">';
      html += '<span class="material-icons-round avatar-option-icon">' + av.icon + '</span>';
      html += '<div class="avatar-option-label">' + (JEC.lang === 'id' ? av.id_label : av.en) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    
    const overlay = document.getElementById('ov-avatar');
    if (overlay) {
      document.getElementById('feat-avatar-content').innerHTML = html;
      JEC.openOv('ov-avatar');
    } else {
      this.createAvatarOverlay(html);
    }
  },
  
  createAvatarOverlay: function(content) {
    const overlay = document.createElement('div');
    overlay.id = 'ov-avatar';
    overlay.className = 'overlay';
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-header">' +
      '<span class="material-icons-round modal-icon">face</span>' +
      '<span>' + JEC.t('choose_avatar') + '</span>' +
      '<button class="icon-btn modal-close" onclick="JEC.closeOv(\'ov-avatar\')"><span class="material-icons-round">close</span></button>' +
      '</div>' +
      '<div id="feat-avatar-content">' + content + '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    JEC.openOv('ov-avatar');
  },
  
  selectAvatar: function(avatarId) {
    JEC.setAvatar(avatarId);
    JEC.closeOv('ov-avatar');
    this.render();
    JEC.toast(JEC.t('avatar_saved') || 'Avatar updated!', 'success');
  },
  
  formatDate: function(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(JEC.lang === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch(e) {
      return '—';
    }
  }
};
