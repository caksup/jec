// JEC v.7.00 MODULAR | 16/08/2026 | j/f/practice.js | Practice Module
// Container: #feat-practice di sv1.html v1.03
// Lazy load (Priority 3) — load saat user klik tab Practice

'use strict';

window.JEC_PRACTICE = {
  state: {
    leaderboard: [],
    loading: false,
    lastFetch: 0,
    cacheMs: 60000 // 60 detik cache
  },
  
  // ═══════════ CARDS DEFINITION ═══════════
  cards: [
    {
      id: 'flashcards',
      icon: 'style',
      titleKey: 'flashcards',
      descKey: 'flashcards_desc',
      status: 'coming', // coming = coming soon
      fallback: {
        en: { title: 'Flashcards', desc: 'Review vocabulary with SRS' },
        id: { title: 'Kartu Kata', desc: 'Review kosakata dengan SRS' }
      }
    },
    {
      id: 'scramble',
      icon: 'shuffle',
      titleKey: 'scramble',
      descKey: 'scramble_desc',
      status: 'coming',
      fallback: {
        en: { title: 'Word Scramble', desc: 'Rearrange letters' },
        id: { title: 'Acak Kata', desc: 'Susun huruf acak' }
      }
    },
    {
      id: 'mcq',
      icon: 'quiz',
      titleKey: 'mcq',
      descKey: 'mcq_desc',
      status: 'coming',
      fallback: {
        en: { title: 'Multiple Choice', desc: 'Test your knowledge' },
        id: { title: 'Pilihan Ganda', desc: 'Uji pengetahuanmu' }
      }
    },
    {
      id: 'listening',
      icon: 'headphones',
      titleKey: 'listening_quiz',
      descKey: 'listening_desc',
      status: 'coming',
      fallback: {
        en: { title: 'Listening Quiz', desc: 'Hear & choose meaning' },
        id: { title: 'Kuis Listening', desc: 'Dengar & pilih arti' }
      }
    }
  ]
};

// ═══════════ RENDER ═══════════
JEC_PRACTICE.render = function() {
  const container = document.getElementById('feat-practice');
  if (!container) return;
  
  const lang = JEC.lang || 'en';
  
  let html = '';
  
  // ── Practice Cards Grid ──
  html += '<div class="grid">';
  JEC_PRACTICE.cards.forEach(function(card) {
    const title = JEC.t(card.titleKey) || card.fallback[lang].title;
    const desc = JEC.t(card.descKey) || card.fallback[lang].desc;
    const statusText = JEC.t('coming_soon') || 'Coming Soon';
    
    html += '<div class="card" onclick="JEC_PRACTICE.onCardClick(\'' + card.id + '\')">';
    html += '<h4>';
    html += '<span class="material-icons-round">' + card.icon + '</span>';
    html += '<span style="flex:1">' + JEC.esc(title) + '</span>';
    html += '</h4>';
    html += '<div class="sub">' + JEC.esc(desc) + '</div>';
    html += '<span class="tag">' + JEC.esc(statusText) + '</span>';
    html += '</div>';
  });
  html += '</div>';
  
  // ── Leaderboard Section ──
  html += '<div style="margin-top:1.1rem">';
  html += '<div class="sec-t">';
  html += '<span class="material-icons-round">leaderboard</span>';
  html += '<span>' + JEC.esc(JEC.t('leaderboard') || 'Leaderboard') + '</span>';
  html += '</div>';
  html += '<div id="prac-lb-box"><div class="load-state">';
  html += '<span class="material-icons-round">sync</span>';
  html += JEC.esc(JEC.t('loading_more') || 'Loading...');
  html += '</div></div>';
  html += '</div>';
  
  container.innerHTML = html;
  
  // Fetch leaderboard setelah render
  JEC_PRACTICE.loadLeaderboard();
};

// ═══════════ CARD CLICK ═══════════
JEC_PRACTICE.onCardClick = function(cardId) {
  const card = JEC_PRACTICE.cards.find(function(c) { return c.id === cardId; });
  if (!card) return;
  
  const lang = JEC.lang || 'en';
  const title = JEC.t(card.titleKey) || card.fallback[lang].title;
  const comingSoon = JEC.t('coming_soon') || 'Coming Soon';
  
  JEC.toast(comingSoon + ': ' + title, 'info', 2000);
  JEC.logActivity('practice_tap', cardId);
};

// ═══════════ LEADERBOARD ═══════════
JEC_PRACTICE.loadLeaderboard = async function() {
  const state = JEC_PRACTICE.state;
  const box = document.getElementById('prac-lb-box');
  if (!box) return;
  
  // Check cache
  const now = Date.now();
  if (state.leaderboard.length > 0 && (now - state.lastFetch) < state.cacheMs) {
    JEC_PRACTICE.renderLeaderboard(state.leaderboard);
    return;
  }
  
  state.loading = true;
  
  try {
    const batch = JEC.user ? JEC.user.batch : null;
    const params = { action: 'fetch_leaderboard' };
    if (batch) params.batch = batch;
    
    const data = await JEC.apiGet(params);
    let rows = [];
    
    if (Array.isArray(data)) {
      rows = data;
    } else if (data && Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (data && Array.isArray(data.data)) {
      rows = data.data;
    }
    
    // Sort by XP desc
    rows.sort(function(a, b) {
      return (Number(b.totalXp) || Number(b.poin) || 0) - 
             (Number(a.totalXp) || Number(a.poin) || 0);
    });
    
    state.leaderboard = rows.slice(0, 20); // Top 20
    state.lastFetch = now;
    state.loading = false;
    
    JEC_PRACTICE.renderLeaderboard(state.leaderboard);
    
  } catch(e) {
    state.loading = false;
    console.warn('[JEC_PRACTICE] Leaderboard fetch failed:', e.message);
    
    // Fallback: tampilkan diri sendiri saja
    JEC_PRACTICE.renderLeaderboardFallback();
  }
};

JEC_PRACTICE.renderLeaderboard = function(rows) {
  const box = document.getElementById('prac-lb-box');
  if (!box) return;
  
  if (!rows || !rows.length) {
    box.innerHTML = '<div class="load-state">' +
      '<span class="material-icons-round" style="animation:none">leaderboard</span>' +
      JEC.esc(JEC.t('leaderboard_empty') || 'Leaderboard is empty') +
      '</div>';
    return;
  }
  
  const me = JEC.user ? String(JEC.user.id) : '';
  let html = '';
  
  // Top 20
  rows.slice(0, 20).forEach(function(r, idx) {
    const isMe = String(r.id) === me;
    const name = r.name || r.nama || r.id || '-';
    const pts = Number(r.totalXp) || Number(r.poin) || 0;
    const streak = Number(r.streak) || 0;
    
    let rankIcon = '#' + (idx + 1);
    let rankClass = 'rk';
    if (idx === 0) rankIcon = '🥇';
    else if (idx === 1) rankIcon = '🥈';
    else if (idx === 2) rankIcon = '🥉';
    
    html += '<div class="lb' + (isMe ? ' me' : '') + '">';
    html += '<div class="' + rankClass + '">' + rankIcon + '</div>';
    html += '<div class="nm">';
    html += JEC.esc(name);
    if (isMe) html += ' <span class="tag full" style="font-size:.52rem;padding:.05rem .3rem">YOU</span>';
    if (r.batch) html += ' <span class="tag" style="font-size:.52rem;padding:.05rem .3rem">' + JEC.esc(r.batch) + '</span>';
    html += '</div>';
    html += '<div class="pt">';
    html += '<b style="color:var(--p)">' + pts + '</b> pt';
    if (streak > 0) html += ' · 🔥' + streak;
    html += '</div>';
    html += '</div>';
  });
  
  box.innerHTML = html;
};

JEC_PRACTICE.renderLeaderboardFallback = function() {
  const box = document.getElementById('prac-lb-box');
  if (!box) return;
  
  const me = JEC.user;
  if (!me) {
    box.innerHTML = '<div class="tx-m" style="padding:.5rem;font-size:.78rem">' + 
      JEC.esc(JEC.t('no_leaderboard') || 'No leaderboard data yet') + '</div>';
    return;
  }
  
  // Hitung poin lokal
  const stats = JEC.stats || {};
  const c = { dn: stats.partsDone || 0 };
  const poin = (c.dn * 10) + ((stats.dailyStreak || 0) * 5);
  
  const avatar = localStorage.getItem('jec_avatar') || '🧑‍🎓';
  
  let html = '<div class="lb me">';
  html += '<div class="rk">🏆</div>';
  html += '<div class="nm">';
  html += '<span style="font-size:1.1rem;margin-right:.3rem">' + avatar + '</span>';
  html += JEC.esc(me.name) + ' <span class="tag full" style="font-size:.52rem;padding:.05rem .3rem">YOU</span>';
  html += '</div>';
  html += '<div class="pt"><b style="color:var(--p)">' + poin + '</b> pt</div>';
  html += '</div>';
  
  html += '<div class="tx-m" style="padding:.5rem;font-size:.7rem;text-align:center">';
  html += JEC.esc(JEC.t('leaderboard_failed') || 'Offline leaderboard — using local data');
  html += '</div>';
  
  box.innerHTML = html;
};

// ═══════════ INIT (dipanggil oleh j.js saat feature load) ═══════════
window.JEC_PRACTICE_INIT = function(JEC_REF) {
  console.log('[JEC_PRACTICE] Initialized');
  JEC_PRACTICE.render();
};

// ═══════════ REFRESH (dipanggil saat language/theme change) ═══════════
window.JEC_PRACTICE_REFRESH = function(JEC_REF) {
  if (JEC.activeView === 'practice') {
    JEC_PRACTICE.render();
  }
};
