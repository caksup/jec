// JEC v.1.06 | 15/08/2026 | j/f/ | Extra Module

'use strict';

window.JEC_EXTRA_INIT = function(JEC) {
  JEC_EXTRA.state = { activeTab: 'tools' };
  JEC_EXTRA.render();
};

window.JEC_EXTRA_REFRESH = function(JEC) {
  JEC_EXTRA.render();
};

window.JEC_EXTRA = {
  state: { activeTab: 'tools' },
  
  render: function() {
    const container = document.getElementById('feat-extra');
    if (!container) return;
    
    let html = '';
    
    // Subtabs
    html += '<div class="extra-tabs">';
    html += '<button class="extra-tab ' + (this.state.activeTab === 'tools' ? 'active' : '') + '" onclick="JEC_EXTRA.switchTab(\'tools\')">';
    html += '<span class="material-icons-round">build</span>';
    html += '<span>' + (JEC.t('tools') || 'Tools') + '</span>';
    html += '</button>';
    html += '<button class="extra-tab ' + (this.state.activeTab === 'logbook' ? 'active' : '') + '" onclick="JEC_EXTRA.switchTab(\'logbook\')">';
    html += '<span class="material-icons-round">menu_book</span>';
    html += '<span>' + (JEC.t('logbook') || 'Logbook') + '</span>';
    html += '</button>';
    html += '<button class="extra-tab ' + (this.state.activeTab === 'games' ? 'active' : '') + '" onclick="JEC_EXTRA.switchTab(\'games\')">';
    html += '<span class="material-icons-round">sports_esports</span>';
    html += '<span>' + (JEC.t('games') || 'Games') + '</span>';
    html += '</button>';
    html += '</div>';
    
    // Tab Content
    html += '<div class="extra-content">';
    if (this.state.activeTab === 'tools') html += this.renderTools();
    else if (this.state.activeTab === 'logbook') html += this.renderLogbook();
    else if (this.state.activeTab === 'games') html += this.renderGames();
    html += '</div>';
    
    container.innerHTML = html;
  },
  
  renderTools: function() {
    const tabs = (JEC.extData.tabs || []);
    if (!tabs.length) {
      return '<div class="empty-state"><span class="material-icons-round empty-icon">build</span><div>' + (JEC.t('no_extra') || 'No extra features available') + '</div></div>';
    }
    
    let html = '<div class="extra-tools-list">';
    tabs.forEach(function(tab) {
      if (tab.enabled === false) return;
      html += '<div class="extra-tool-item" onclick="JEC_EXTRA.loadTool(\'' + JEC.esc(tab.id) + '\',\'' + JEC.esc(tab.inject || '') + '\',\'' + JEC.esc(tab.title) + '\')">';
      html += '<span class="material-icons-round extra-tool-icon">' + (tab.icon || 'extension') + '</span>';
      html += '<div class="extra-tool-info">';
      html += '<div class="extra-tool-title">' + JEC.esc(tab.title) + '</div>';
      html += '<div class="extra-tool-desc">' + (JEC.t('tap_to_open') || 'Tap to open') + '</div>';
      html += '</div>';
      html += '<span class="material-icons-round extra-tool-chevron">chevron_right</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  },
  
  renderLogbook: function() {
    if (typeof JEC_LOGBOOK !== 'undefined' && JEC_LOGBOOK.render) {
      return JEC_LOGBOOK.render();
    }
    return '<div class="empty-state"><span class="material-icons-round empty-icon">menu_book</span><div>' + (JEC.t('logbook_desc') || 'Your offline meeting notes will appear here.') + '</div></div>';
  },
  
  renderGames: function() {
    const games = [
      { icon: 'shuffle', title: 'Word Scramble', desc: 'Unscramble letters' },
      { icon: 'style', title: 'Flashcards', desc: 'Memory game' },
      { icon: 'extension', title: 'Puzzle Match', desc: 'Match pairs' },
      { icon: 'casino', title: 'Word Dice', desc: 'Roll and spell' }
    ];
    
    let html = '<div class="games-grid">';
    games.forEach(function(g) {
      html += '<div class="game-card" onclick="JEC_EXTRA.openGame(\'' + JEC.esc(g.title) + '\')">';
      html += '<span class="material-icons-round game-icon">' + g.icon + '</span>';
      html += '<div class="game-title">' + JEC.esc(g.title) + '</div>';
      html += '<div class="game-desc">' + JEC.esc(g.desc) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  },
  
  switchTab: function(tab) {
    this.state.activeTab = tab;
    this.render();
  },
  
  loadTool: function(id, jsFile, title) {
    JEC.toast((JEC.t('loading') || 'Loading') + ' ' + title + '...', 'info', 1000);
    
    if (!jsFile) {
      JEC.toast((JEC.t('tool_not_configured') || 'Tool not configured'), 'warning');
      return;
    }
    
    const script = document.createElement('script');
    script.src = (JEC.config.JS || '') + jsFile + '?v=' + Date.now();
    script.onload = function() {
      if (typeof window.JEC_EXTRA_TOOL_INIT === 'function') {
        window.JEC_EXTRA_TOOL_INIT(id, JEC.user);
      }
    };
    script.onerror = function() {
      JEC.toast((JEC.t('failed_load') || 'Failed to load') + ': ' + title, 'error');
    };
    document.head.appendChild(script);
  },
  
  openGame: function(name) {
    JEC.toast((JEC.t('coming_soon') || 'Coming Soon') + ': ' + name, 'info', 2000);
  }
};
