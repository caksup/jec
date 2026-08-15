// JEC v.1.06 | 15/08/2026 | j/f/ | Practice Module

'use strict';

window.JEC_PRACTICE_INIT = function(JEC) {
  JEC_PRACTICE.render();
};

window.JEC_PRACTICE_REFRESH = function(JEC) {
  JEC_PRACTICE.render();
};

window.JEC_PRACTICE = {
  render: function() {
    const container = document.getElementById('feat-practice');
    if (!container) return;
    
    let html = '';
    
    // Practice Cards
    html += '<div class="practice-grid">';
    
    const items = [
      { icon: 'style', title: JEC.t('practice.flashcards') || 'Flashcards', desc: JEC.t('practice.flashcards_desc') || 'Review vocabulary with SRS', color: '#833AB4', status: 'coming' },
      { icon: 'swords', title: JEC.t('practice.vocab_duel') || 'Vocab Duel', desc: JEC.t('practice.vocab_duel_desc') || 'Challenge word matching', color: '#FD1D1D', status: 'coming' },
      { icon: 'auto_awesome', title: JEC.t('practice.word_day') || 'Word of Day', desc: JEC.t('practice.word_day_desc') || 'Learn one new word daily', color: '#F77737', status: 'coming' },
      { icon: 'shuffle', title: JEC.t('practice.scramble') || 'Word Scramble', desc: JEC.t('practice.scramble_desc') || 'Unscramble letters', color: '#405DE6', status: 'coming' },
      { icon: 'record_voice_over', title: JEC.t('practice.speaking') || 'Speaking Drill', desc: JEC.t('practice.speaking_desc') || 'Practice pronunciation', color: '#00d97e', status: 'coming' },
      { icon: 'hearing', title: JEC.t('practice.listening') || 'Listening Quiz', desc: JEC.t('practice.listening_desc') || 'Test your ear', color: '#FCAF45', status: 'coming' }
    ];
    
    items.forEach(function(item) {
      html += '<div class="practice-card" onclick="JEC_PRACTICE.openPractice(\'' + item.title + '\')">';
      html += '<div class="practice-icon-wrap" style="background:' + item.color + '20;color:' + item.color + '">';
      html += '<span class="material-icons-round">' + item.icon + '</span>';
      html += '</div>';
      html += '<div class="practice-info">';
      html += '<div class="practice-title">' + JEC.esc(item.title) + '</div>';
      html += '<div class="practice-desc">' + JEC.esc(item.desc) + '</div>';
      html += '</div>';
      html += '<div class="practice-status">';
      html += '<span class="material-icons-round">hourglass_empty</span>';
      html += '<span>' + (JEC.t('coming_soon') || 'Coming Soon') + '</span>';
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div>';
    
    // Leaderboard
    html += '<div class="practice-leaderboard">';
    html += '<div class="section-title-sm">';
    html += '<span class="material-icons-round">leaderboard</span>';
    html += '<span>' + (JEC.t('leaderboard') || 'Leaderboard') + '</span>';
    html += '</div>';
    html += '<div id="practice-lb-box">';
    html += JEC_PRACTICE.renderLeaderboard();
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
  },
  
  renderLeaderboard: function() {
    const data = JEC.leaderboardData || [];
    if (!data.length) {
      return '<div class="empty-state"><span class="material-icons-round empty-icon">leaderboard</span><div>' + (JEC.t('no_leaderboard') || 'No leaderboard data yet') + '</div></div>';
    }
    
    let html = '<div class="lb-list">';
    data.slice(0, 10).forEach(function(s, i) {
      let rankClass = '';
      let rankIcon = 'tag';
      if (i === 0) { rankClass = 'gold'; rankIcon = 'emoji_events'; }
      else if (i === 1) { rankClass = 'silver'; rankIcon = 'emoji_events'; }
      else if (i === 2) { rankClass = 'bronze'; rankIcon = 'emoji_events'; }
      
      html += '<div class="lb-item ' + rankClass + '">';
      html += '<div class="lb-rank">';
      html += '<span class="material-icons-round">' + rankIcon + '</span>';
      html += '<span>#' + (i + 1) + '</span>';
      html += '</div>';
      html += '<div class="lb-info">';
      html += '<div class="lb-name">' + JEC.esc(s.name || s.id) + '</div>';
      html += '<div class="lb-stats">' + (s.totalXp || 0) + ' XP · ' + (s.streak || 0) + ' day streak</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  },
  
  openPractice: function(name) {
    JEC.toast((JEC.t('coming_soon') || 'Coming Soon') + ': ' + name, 'info', 2000);
  }
};
