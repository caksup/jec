// JEC v.1.06 | 15/08/2026 | j/f/practice.js | Practice Module

'use strict';

window.JEC_PRACTICE_INIT = function(JEC) {
  JEC_PRACTICE.render();
};

window.JEC_PRACTICE_REFRESH = function(JEC) {
  JEC_PRACTICE.render();
};

window.JEC_PRACTICE = {
  
  // ═══════════ MAIN RENDER ═══════════
  
  render: function() {
    const container = document.getElementById('feat-practice');
    if (!container) return;
    
    let html = '';
    
    html += '<div class="practice-grid">';
    html += this.renderCards();
    html += '</div>';
    
    html += '<div class="practice-leaderboard">';
    html += '<div class="section-title-sm">';
    html += '<span class="material-icons-round">leaderboard</span>';
    html += '<span>' + (JEC.t('leaderboard') || 'Leaderboard') + '</span>';
    html += '</div>';
    html += '<div id="practice-lb-box">';
    html += this.renderLeaderboard();
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
  },
  
  // ═══════════ PRACTICE CARDS ═══════════
  
  renderCards: function() {
    const items = this.getItems();
    let html = '';
    
    items.forEach(function(item) {
      html += '<div class="practice-card" onclick="JEC_PRACTICE.openPractice(\'' + item.id + '\')">';
      html += '<div class="practice-icon-wrap" style="background:' + item.color + '20;color:' + item.color + '">';
      html += '<span class="material-icons-round">' + item.icon + '</span>';
      html += '</div>';
      html += '<div class="practice-info">';
      html += '<div class="practice-title">' + JEC.esc(item.title) + '</div>';
      html += '<div class="practice-desc">' + JEC.esc(item.desc) + '</div>';
      html += '</div>';
      html += '<div class="practice-status">';
      if (item.status === 'ready') {
        html += '<span class="material-icons-round status-ready">play_circle</span>';
        html += '<span>' + (JEC.t('tap_to_play') || 'Tap to Play') + '</span>';
      } else {
        html += '<span class="material-icons-round status-coming">hourglass_empty</span>';
        html += '<span>' + (JEC.t('coming_soon') || 'Coming Soon') + '</span>';
      }
      html += '</div>';
      html += '</div>';
    });
    
    return html;
  },
  
  getItems: function() {
    const lang = JEC.lang || 'en';
    
    return [
      {
        id: 'flashcards',
        icon: 'style',
        color: '#833AB4',
        status: 'coming',
        title: lang === 'id' ? 'Flashcards' : 'Flashcards',
        desc: lang === 'id' ? 'Review kosakata dengan SRS' : 'Review vocabulary with SRS'
      },
      {
        id: 'vocab_duel',
        icon: 'swords',
        color: '#FD1D1D',
        status: 'coming',
        title: lang === 'id' ? 'Duel Kosakata' : 'Vocab Duel',
        desc: lang === 'id' ? 'Tantang mencocokkan kata' : 'Challenge word matching'
      },
      {
        id: 'word_day',
        icon: 'auto_awesome',
        color: '#F77737',
        status: 'coming',
        title: lang === 'id' ? 'Kata Hari Ini' : 'Word of Day',
        desc: lang === 'id' ? 'Belajar 1 kata baru setiap hari' : 'Learn one new word daily'
      },
      {
        id: 'scramble',
        icon: 'shuffle',
        color: '#405DE6',
        status: 'coming',
        title: lang === 'id' ? 'Acak Kata' : 'Word Scramble',
        desc: lang === 'id' ? 'Susun huruf acak' : 'Unscramble letters'
      },
      {
        id: 'speaking_drill',
        icon: 'record_voice_over',
        color: '#00d97e',
        status: 'coming',
        title: lang === 'id' ? 'Latihan Speaking' : 'Speaking Drill',
        desc: lang === 'id' ? 'Latih pengucapan' : 'Practice pronunciation'
      },
      {
        id: 'listening_quiz',
        icon: 'hearing',
        color: '#FCAF45',
        status: 'coming',
        title: lang === 'id' ? 'Kuis Listening' : 'Listening Quiz',
        desc: lang === 'id' ? 'Uji pendengaran Anda' : 'Test your ear'
      }
    ];
  },
  
  // ═══════════ LEADERBOARD ═══════════
  
  renderLeaderboard: function() {
    const data = JEC.leaderboardData || [];
    
    if (!data.length) {
      return '<div class="empty-state">' +
        '<span class="material-icons-round empty-icon">leaderboard</span>' +
        '<div>' + (JEC.t('no_leaderboard') || 'No leaderboard data yet') + '</div>' +
        '</div>';
    }
    
    let html = '<div class="lb-list">';
    
    data.slice(0, 10).forEach(function(s, i) {
      let rankClass = '';
      let rankIcon = 'tag';
      
      if (i === 0) { rankClass = 'gold'; rankIcon = 'emoji_events'; }
      else if (i === 1) { rankClass = 'silver'; rankIcon = 'emoji_events'; }
      else if (i === 2) { rankClass = 'bronze'; rankIcon = 'emoji_events'; }
      
      const displayName = s.name || s.id || '—';
      const xp = s.totalXp || 0;
      const streak = s.streak || 0;
      
      html += '<div class="lb-item ' + rankClass + '">';
      html += '<div class="lb-rank">';
      html += '<span class="material-icons-round">' + rankIcon + '</span>';
      html += '<span>#' + (i + 1) + '</span>';
      html += '</div>';
      html += '<div class="lb-info">';
      html += '<div class="lb-name">' + JEC.esc(displayName) + '</div>';
      html += '<div class="lb-stats">' + xp + ' XP · ' + streak + ' ' + (JEC.t('day_streak') || 'day streak') + '</div>';
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div>';
    return html;
  },
  
  // ═══════════ ACTIONS ═══════════
  
  openPractice: function(id) {
    const items = this.getItems();
    const item = items.find(function(x) { return x.id === id; });
    
    if (!item) return;
    
    if (item.status === 'coming') {
      JEC.toast((JEC.t('coming_soon') || 'Coming Soon') + ': ' + item.title, 'info', 2000);
      return;
    }
    
    // Placeholder untuk fitur ready di masa depan
    JEC.toast((JEC.t('loading') || 'Loading') + ' ' + item.title + '...', 'info', 1500);
  },
  
  // ═══════════ API HELPERS ═══════════
  
  refreshLeaderboard: async function() {
    if (!JEC.user) return;
    
    try {
      const data = await JEC.apiGet({
        action: 'fetch_leaderboard',
        batch: JEC.user.batch
      });
      
      if (Array.isArray(data)) {
        JEC.leaderboardData = data;
        const box = document.getElementById('practice-lb-box');
        if (box) box.innerHTML = this.renderLeaderboard();
      }
    } catch(e) {
      console.warn('[JEC_PRACTICE] Failed to refresh leaderboard:', e);
    }
  },
  
  getPracticeStats: function() {
    return {
      totalCards: this.getItems().length,
      readyCount: this.getItems().filter(function(x) { return x.status === 'ready'; }).length,
      comingCount: this.getItems().filter(function(x) { return x.status === 'coming'; }).length
    };
  }
};
