// JEC v.7.00 MODULAR | 16/08/2026 | j/f/extra.js | Extra Module
// Container: #feat-extra di sv1.html v1.03
// Sub-tabs: Tools, Games, Overview Siswa
// Lazy load (Priority 3) — load saat user klik tab Extra

'use strict';

window.JEC_EXTRA = {
  state: {
    currentTab: 'tools',
    leaderboard: [],
    loading: false,
    lastFetch: 0,
    cacheMs: 60000 // 60 detik cache
  },

  // ═══════════ TOOLS DEFINITION ═══════════
  tools: [
    {
      id: 'memorize',
      icon: 'psychology',
      titleKey: 'memorize_it',
      descKey: 'memorize_desc',
      status: 'coming',
      fallback: {
        en: { title: 'Memorize It', desc: 'Hafal kalimat bahasa Inggris' },
        id: { title: 'Hafalan', desc: 'Hafal kalimat bahasa Inggris' }
      }
    },
    {
      id: 'dictionary',
      icon: 'menu_book',
      titleKey: 'dictionary',
      descKey: 'dictionary_desc',
      status: 'coming',
      fallback: {
        en: { title: 'Dictionary', desc: 'Search word meanings' },
        id: { title: 'Kamus', desc: 'Cari arti kata' }
      }
    },
    {
      id: 'sentence',
      icon: 'construction',
      titleKey: 'sentence_builder',
      descKey: 'sentence_desc',
      status: 'coming',
      fallback: {
        en: { title: 'Sentence Builder', desc: 'Build English sentences' },
        id: { title: 'Pembuat Kalimat', desc: 'Susun kalimat bahasa Inggris' }
      }
    }
  ],

  // ═══════════ GAMES DEFINITION ═══════════
  games: [
    {
      id: 'minigames',
      icon: 'sports_esports',
      titleKey: 'mini_games',
      descKey: 'mini_games_desc',
      status: 'coming',
      fallback: {
        en: { title: 'Mini Games', desc: 'Fun learning games' },
        id: { title: 'Permainan Mini', desc: 'Game belajar seru' }
      }
    }
  ]
};

// ═══════════ RENDER MAIN ═══════════
JEC_EXTRA.render = function() {
  const container = document.getElementById('feat-extra');
  if (!container) return;

  const lang = JEC.lang || 'en';
  const tab = JEC_EXTRA.state.currentTab;

  let html = '';

  // Banner
  html += '<div class="bn">';
  html += '<h3><span class="material-icons-round" style="vertical-align:middle">language</span> ';
  html += JEC.esc(JEC.t('extra_title') || 'Extra Tools');
  html += '</h3>';
  html += '</div>';

  // Tab bar
  html += '<div class="subtab" id="extra-tabs-bar">';
  html += JEC_EXTRA.renderTabButton('tools', 'build', JEC.t('tools') || 'Tools', tab);
  html += JEC_EXTRA.renderTabButton('games', 'sports_esports', JEC.t('games') || 'Games', tab);
  html += JEC_EXTRA.renderTabButton('overview', 'leaderboard', JEC.t('overview') || 'Overview', tab);
  html += '</div>';

  // Content containers
  html += '<div id="extra-tools"' + (tab !== 'tools' ? ' class="hid"' : '') + '></div>';
  html += '<div id="extra-games"' + (tab !== 'games' ? ' class="hid"' : '') + '></div>';
  html += '<div id="extra-overview"' + (tab !== 'overview' ? ' class="hid"' : '') + '></div>';

  container.innerHTML = html;

  // Render active tab content
  JEC_EXTRA.renderActiveTab();
};

JEC_EXTRA.renderTabButton = function(id, icon, label, activeTab) {
  const isActive = activeTab === id;
  return '<button class="' + (isActive ? 'active' : '') + '" onclick="JEC_EXTRA.switchTab(\'' + id + '\', this)">' +
    '<span class="material-icons-round">' + icon + '</span>' +
    JEC.esc(label) +
    '</button>';
};

// ═══════════ TAB SWITCHING ═══════════
JEC_EXTRA.switchTab = function(tabName, btn) {
  JEC_EXTRA.state.currentTab = tabName;

  // Update button states
  const tabsBar = document.getElementById('extra-tabs-bar');
  if (tabsBar) {
    tabsBar.querySelectorAll('button').forEach(function(b) {
      b.classList.remove('active');
    });
    if (btn) btn.classList.add('active');
  }

  // Show/hide content
  ['tools', 'games', 'overview'].forEach(function(t) {
    const el = document.getElementById('extra-' + t);
    if (el) el.classList.toggle('hid', t !== tabName);
  });

  // Render active content
  JEC_EXTRA.renderActiveTab();
};

JEC_EXTRA.renderActiveTab = function() {
  const tab = JEC_EXTRA.state.currentTab;
  if (tab === 'tools') JEC_EXTRA.renderTools();
  else if (tab === 'games') JEC_EXTRA.renderGames();
  else if (tab === 'overview') JEC_EXTRA.renderOverview();
};

// ═══════════ TOOLS TAB ═══════════
JEC_EXTRA.renderTools = function() {
  const container = document.getElementById('extra-tools');
  if (!container) return;

  const lang = JEC.lang || 'en';
  let html = '<div class="grid">';

  JEC_EXTRA.tools.forEach(function(tool) {
    const title = JEC.t(tool.titleKey) || tool.fallback[lang].title;
    const desc = JEC.t(tool.descKey) || tool.fallback[lang].desc;
    const statusText = JEC.t('coming_soon') || 'Coming Soon';

    html += '<div class="card" onclick="JEC_EXTRA.onToolClick(\'' + tool.id + '\')">';
    html += '<h4>';
    html += '<span class="material-icons-round">' + tool.icon + '</span>';
    html += '<span style="flex:1">' + JEC.esc(title) + '</span>';
    html += '</h4>';
    html += '<div class="sub">' + JEC.esc(desc) + '</div>';
    html += '<span class="tag">' + JEC.esc(statusText) + '</span>';
    html += '</div>';
  });

  html += '</div>';
  container.innerHTML = html;
};

JEC_EXTRA.onToolClick = function(toolId) {
  const tool = JEC_EXTRA.tools.find(function(t) { return t.id === toolId; });
  if (!tool) return;

  const lang = JEC.lang || 'en';
  const title = JEC.t(tool.titleKey) || tool.fallback[lang].title;
  const comingSoon = JEC.t('coming_soon') || 'Coming Soon';

  JEC.toast(comingSoon + ': ' + title, 'info', 2000);
  JEC.logActivity('extra_tool_tap', toolId);
};

// ═══════════ GAMES TAB ═══════════
JEC_EXTRA.renderGames = function() {
  const container = document.getElementById('extra-games');
  if (!container) return;

  const lang = JEC.lang || 'en';
  let html = '<div class="grid">';

  JEC_EXTRA.games.forEach(function(game) {
    const title = JEC.t(game.titleKey) || game.fallback[lang].title;
    const desc = JEC.t(game.descKey) || game.fallback[lang].desc;
    const statusText = JEC.t('coming_soon') || 'Coming Soon';

    html += '<div class="card" onclick="JEC_EXTRA.onGameClick(\'' + game.id + '\')">';
    html += '<h4>';
    html += '<span class="material-icons-round">' + game.icon + '</span>';
    html += '<span style="flex:1">' + JEC.esc(title) + '</span>';
    html += '</h4>';
    html += '<div class="sub">' + JEC.esc(desc) + '</div>';
    html += '<span class="tag">' + JEC.esc(statusText) + '</span>';
    html += '</div>';
  });

  html += '</div>';
  container.innerHTML = html;
};

JEC_EXTRA.onGameClick = function(gameId) {
  const game = JEC_EXTRA.games.find(function(g) { return g.id === gameId; });
  if (!game) return;

  const lang = JEC.lang || 'en';
  const title = JEC.t(game.titleKey) || game.fallback[lang].title;
  const comingSoon = JEC.t('coming_soon') || 'Coming Soon';

  JEC.toast(comingSoon + ': ' + title, 'info', 2000);
  JEC.logActivity('extra_game_tap', gameId);
};

// ═══════════ OVERVIEW TAB (LEADERBOARD) ═══════════
JEC_EXTRA.renderOverview = async function() {
  const container = document.getElementById('extra-overview');
  if (!container) return;

  const state = JEC_EXTRA.state;

  // Show loading
  container.innerHTML = '<div class="load-state">' +
    '<span class="material-icons-round">sync</span>' +
    JEC.esc(JEC.t('loading_more') || 'Loading leaderboard...') +
    '</div>';

  try {
    const rows = await JEC_EXTRA.fetchLeaderboard();
    JEC_EXTRA.renderOverviewContent(container, rows);
  } catch (e) {
    console.warn('[JEC_EXTRA] Overview fetch failed:', e.message);
    JEC_EXTRA.renderOverviewFallback(container);
  }
};

JEC_EXTRA.fetchLeaderboard = async function() {
  const state = JEC_EXTRA.state;
  const now = Date.now();

  // Check cache
  if (state.leaderboard.length > 0 && (now - state.lastFetch) < state.cacheMs) {
    return state.leaderboard;
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

    state.leaderboard = rows;
    state.lastFetch = now;
    state.loading = false;

    return rows;

  } catch (e) {
    state.loading = false;
    throw e;
  }
};

JEC_EXTRA.renderOverviewContent = function(container, rows) {
  const me = JEC.user ? String(JEC.user.id) : '';
  const lang = JEC.lang || 'en';

  if (!rows || !rows.length) {
    container.innerHTML = '<div class="load-state">' +
      '<span class="material-icons-round" style="animation:none">leaderboard</span>' +
      '<div style="margin-top:.5rem;font-weight:700">' + JEC.esc(JEC.t('leaderboard_empty') || 'Leaderboard is empty') + '</div>' +
      '<div style="font-size:.72rem;margin-top:.3rem">' + JEC.esc(JEC.t('leaderboard_failed') || 'No data yet') + '</div>' +
      '</div>';
    return;
  }

  // Stats
  const totalStudents = rows.length;
  const totalPoints = rows.reduce(function(sum, r) {
    return sum + (Number(r.totalXp) || Number(r.poin) || 0);
  }, 0);
  const myIdx = rows.findIndex(function(r) { return String(r.id) === me; });
  const myRank = myIdx >= 0 ? '#' + (myIdx + 1) : '-';

  let html = '';

  // Stats cards
  html += '<div class="ov-stat">';
  html += JEC_EXTRA.renderStatCard(totalStudents, JEC.t('total_students') || 'Total Students');
  html += JEC_EXTRA.renderStatCard(totalPoints, JEC.t('total_points') || 'Total Points');
  html += JEC_EXTRA.renderStatCard(myRank, JEC.t('your_rank') || 'Your Rank');
  html += '</div>';

  // Podium (top 3)
  if (rows.length >= 3) {
    const podium = [rows[1], rows[0], rows[2]]; // silver, gold, bronze
    const classes = ['silver', 'gold', 'bronze'];
    const medals = ['🥈', '🥇', '🥉'];

    html += '<div class="ov-podium">';
    for (let i = 0; i < 3; i++) {
      const p = podium[i];
      const name = p.name || p.nama || p.id || '-';
      const pts = Number(p.totalXp) || Number(p.poin) || 0;
      const avatar = JEC_EXTRA.getAvatarForUser(p);

      html += '<div class="ov-podium-card ' + classes[i] + '">';
      html += '<span class="medal">' + medals[i] + '</span>';
      html += '<div class="av-mini">' + JEC.esc(avatar) + '</div>';
      html += '<div class="nm">' + JEC.esc(name) + '</div>';
      html += '<div class="pt">' + pts + ' pt</div>';
      html += '</div>';
    }
    html += '</div>';
  }

  // All rankings
  html += '<div class="sec-t">';
  html += '<span class="material-icons-round">format_list_numbered</span>';
  html += '<span>' + JEC.esc(JEC.t('all_rankings') || 'All Rankings') + '</span>';
  html += '</div>';
  html += '<div style="max-height:50vh;overflow-y:auto">';

  rows.forEach(function(r, idx) {
    const isMe = String(r.id) === me;
    const name = r.name || r.nama || r.id || '-';
    const pts = Number(r.totalXp) || Number(r.poin) || 0;
    const streak = Number(r.streak) || 0;
    const avatar = JEC_EXTRA.getAvatarForUser(r);

    html += '<div class="lb' + (isMe ? ' me' : '') + '">';
    html += '<div class="rk">' + (idx + 1) + '</div>';
    html += '<div class="nm">';
    html += '<span style="font-size:1.1rem;margin-right:.3rem">' + JEC.esc(avatar) + '</span>';
    html += JEC.esc(name);
    if (r.batch) {
      html += ' <span class="tag" style="font-size:.52rem;padding:.05rem .3rem">' + JEC.esc(r.batch) + '</span>';
    }
    if (isMe) {
      html += ' <span class="tag full" style="font-size:.52rem;padding:.05rem .3rem">YOU</span>';
    }
    html += '</div>';
    html += '<div class="pt">';
    html += '<b style="color:var(--p)">' + pts + '</b> pt';
    if (streak > 0) html += ' · 🔥' + streak;
    html += '</div>';
    html += '</div>';
  });

  html += '</div>';

  container.innerHTML = html;
};

JEC_EXTRA.renderStatCard = function(value, label) {
  return '<div class="ov-stat-card">' +
    '<div class="v">' + JEC.esc(String(value)) + '</div>' +
    '<div class="l">' + JEC.esc(label) + '</div>' +
    '</div>';
};

JEC_EXTRA.getAvatarForUser = function(userRow) {
  // Coba ambil dari data row, fallback default
  if (userRow && userRow.avatar) return userRow.avatar;

  // Jika ini user sendiri, ambil dari localStorage
  if (JEC.user && String(userRow.id) === String(JEC.user.id)) {
    return localStorage.getItem('jec_avatar') || '🧑‍🎓';
  }

  return '🧑‍🎓';
};

JEC_EXTRA.renderOverviewFallback = function(container) {
  const me = JEC.user;
  if (!me) {
    container.innerHTML = '<div class="load-state">' +
      '<span class="material-icons-round" style="animation:none">leaderboard</span>' +
      '<div style="margin-top:.5rem">' + JEC.esc(JEC.t('no_leaderboard') || 'No leaderboard data') + '</div>' +
      '</div>';
    return;
  }

  // Hitung poin lokal
  const stats = JEC.stats || {};
  const poin = ((stats.partsDone || 0) * 10) + ((stats.dailyStreak || 0) * 5);
  const avatar = localStorage.getItem('jec_avatar') || '🧑‍🎓';

  let html = '<div class="lb me">';
  html += '<div class="rk">🏆</div>';
  html += '<div class="nm">';
  html += '<span style="font-size:1.1rem;margin-right:.3rem">' + JEC.esc(avatar) + '</span>';
  html += JEC.esc(me.name) + ' <span class="tag full" style="font-size:.52rem;padding:.05rem .3rem">YOU</span>';
  html += '</div>';
  html += '<div class="pt"><b style="color:var(--p)">' + poin + '</b> pt</div>';
  html += '</div>';

  html += '<div class="tx-m" style="padding:.8rem;font-size:.72rem;text-align:center;margin-top:.5rem">';
  html += '📡 ' + JEC.esc(JEC.t('leaderboard_failed') || 'Offline — using local data');
  html += '<br>';
  html += '<button class="btn gh" style="margin-top:.5rem;max-width:200px" onclick="JEC_EXTRA.renderOverview()">';
  html += '<span class="material-icons-round" style="font-size:14px">refresh</span> ';
  html += JEC.esc(JEC.t('retry') || 'Retry');
  html += '</button>';
  html += '</div>';

  container.innerHTML = html;
};

// ═══════════ INIT (dipanggil oleh j.js saat feature load) ═══════════
window.JEC_EXTRA_INIT = function(JEC_REF) {
  console.log('[JEC_EXTRA] Initialized');
  JEC_EXTRA.render();
};

// ═══════════ REFRESH (dipanggil saat language/theme change) ═══════════
window.JEC_EXTRA_REFRESH = function(JEC_REF) {
  if (JEC.activeView === 'extra') {
    JEC_EXTRA.render();
  }
};
