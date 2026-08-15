/*15*/
const I18N = {
  en: {
    login_subtitle:"Student Portal",student_id:"Student ID",login_btn:"SIGN IN",
    login_footer:"Forgot PIN? Contact admin.",hello:"Hello",learn:"Learn",
    practice:"Practice",extra:"Extra",profile:"Profile",back:"Back",
    listen:"Listen",quiz:"Quiz",focus_mode:"Focus Mode",skip:"Skip",
    start:"Start",pause:"Pause",parts_done:"Parts Done",day_streak:"Day Streak",
    days_left:"Days Left",account:"Account",class:"Class",batch:"Batch",
    expires:"Expires",logout:"Logout",menu:"Menu",refresh_data:"Refresh Data",
    leaderboard:"Leaderboard",
    morning:"Good morning",afternoon:"Good afternoon",evening:"Good evening",night:"Good night",
    modules:{spe:"Speaking",voc:"Vocabulary",gra:"Grammar",wri:"Writing",lis:"Listening"},
    no_parts:"No parts available",no_extra:"No extra features available",
    correct_answer:"Correct! 🎉",wrong_answer:"Wrong. The correct answer is highlighted.",
    session_expired:"Session expired. Please contact admin.",
    login_failed:"Invalid ID or PIN",network_error:"Network error"
  },
  id: {
    login_subtitle:"Portal Siswa",student_id:"ID Siswa",login_btn:"MASUK",
    login_footer:"Lupa PIN? Hubungi admin.",hello:"Halo",learn:"Belajar",
    practice:"Latihan",extra:"Ekstra",profile:"Profil",back:"Kembali",
    listen:"Dengarkan",quiz:"Kuis",focus_mode:"Mode Fokus",skip:"Lewati",
    start:"Mulai",pause:"Jeda",parts_done:"Bagian Selesai",day_streak:"Hari Berturut",
    days_left:"Hari Tersisa",account:"Akun",class:"Kelas",batch:"Angkatan",
    expires:"Berakhir",logout:"Keluar",menu:"Menu",refresh_data:"Muat Ulang Data",
    leaderboard:"Papan Peringkat",
    morning:"Selamat pagi",afternoon:"Selamat siang",evening:"Selamat sore",night:"Selamat malam",
    modules:{spe:"Speaking",voc:"Kosakata",gra:"Tata Bahasa",wri:"Menulis",lis:"Mendengarkan"},
    no_parts:"Tidak ada bagian tersedia",no_extra:"Tidak ada fitur tambahan",
    correct_answer:"Benar! 🎉",wrong_answer:"Salah. Jawaban benar ditandai.",
    session_expired:"Sesi berakhir. Hubungi admin.",
    login_failed:"ID atau PIN salah",network_error:"Kesalahan jaringan"
  }
};

let CFG = window.JEC_CONFIG || {};
let currentUser = null;
let currentLang = localStorage.getItem('jec_lang') || CFG.DEFAULT_LANG || 'en';
let currentModule = null, currentUnitId = null, currentPartId = null;
let materiData = {spe:{},voc:{},gra:{},wri:{},lis:{}};
let progressMap = {};
let extData = {tabs:[]};
let focusTimer = null, focusSeconds = 0, focusRunning = false;
let leaderboardData = [];

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  applyLang();
  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
    setTimeout(() => {
      document.getElementById('splash').style.display='none';
      const saved = localStorage.getItem('jec_user');
      if (saved) {
        try {
          const u = JSON.parse(saved);
          autoLogin(u);
        } catch(e) { showLogin(); }
      } else {
        showLogin();
      }
    }, 500);
  }, 3000);
  setInterval(updateDateTime, 1000);
  setInterval(heartbeat, 30000);
});

function showLogin() {
  document.getElementById('login').classList.add('active');
}

function showDashboard() {
  document.getElementById('login').classList.remove('active');
  document.getElementById('dashboard').classList.add('active');
  renderAll();
  heartbeat();
}

async function doLogin() {
  const id = document.getElementById('login-id').value.trim().toLowerCase();
  const pin = document.getElementById('login-pin').value.trim();
  const errEl = document.getElementById('login-error');
  errEl.classList.remove('show');
  if (!id || !pin) {
    errEl.textContent = 'Please fill all fields';
    errEl.classList.add('show');
    return;
  }
  try {
    const res = await fetch(CFG.LOG + '?action=login&id=' + encodeURIComponent(id) + '&pin=' + encodeURIComponent(pin));
    const data = await res.json();
    if (data.success) {
      currentUser = {
        id: String(data.user.id),
        name: data.user.name,
        class: data.user.class,
        batch: String(data.user.batch),
        startDate: data.user.startDate,
        sessionDuration: data.user.sessionDuration,
        daysLeft: data.session.daysLeft
      };
      localStorage.setItem('jec_user', JSON.stringify(currentUser));
      await loadAllData();
      showDashboard();
      showToast('Welcome, ' + currentUser.name + '!', 'success');
    } else {
      errEl.textContent = data.msg || t('login_failed');
      errEl.classList.add('show');
    }
  } catch(e) {
    errEl.textContent = t('network_error') + ': ' + e.message;
    errEl.classList.add('show');
  }
}

async function autoLogin(u) {
  currentUser = u;
  try {
    const res = await fetch(CFG.LOG + '?action=check_session&id=' + encodeURIComponent(u.id));
    const data = await res.json();
    if (data.active) {
      currentUser.daysLeft = data.daysLeft;
      await loadAllData();
      showDashboard();
    } else {
      localStorage.removeItem('jec_user');
      showToast(t('session_expired'), 'error');
      showLogin();
    }
  } catch(e) {
    await loadAllData();
    showDashboard();
  }
}

function doLogout() {
  if (!confirm('Logout?')) return;
  localStorage.removeItem('jec_user');
  currentUser = null;
  document.getElementById('dashboard').classList.remove('active');
  showLogin();
  document.getElementById('login-id').value = '';
  document.getElementById('login-pin').value = '';
}

async function loadAllData() {
  try {
    const modules = ['spe','voc','gra','wri','lis'];
    for (const m of modules) {
      const r = await fetch(CFG.DATA + m + '.json?v=' + (CFG.APP_VERSION || Date.now()));
      if (r.ok) materiData[m] = await r.json();
    }
    const er = await fetch(CFG.DATA + 'ext.json?v=' + (CFG.APP_VERSION || Date.now()));
    if (er.ok) extData = await er.json();
    const pr = await fetch(CFG.LOG + '?action=fetch_progress&id=' + encodeURIComponent(currentUser.id));
    if (pr.ok) {
      const arr = await pr.json();
      progressMap = {};
      arr.forEach(p => progressMap[p.module + '_' + p.unitId + '_' + p.partId] = p.status);
    }
    const lr = await fetch(CFG.LOG + '?action=fetch_leaderboard&batch=' + encodeURIComponent(currentUser.batch));
    if (lr.ok) {
      leaderboardData = await lr.json();
    }
  } catch(e) {
    console.warn('Data load failed:', e);
  }
}

async function forceRefresh() {
  showToast('Refreshing data...', 'success', 1500);
  await loadAllData();
  renderAll();
  showToast('Data refreshed!', 'success');
}

function renderAll() {
  document.getElementById('course-name').textContent = CFG.COURSE_SHORT || 'JEC';
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('profile-name').textContent = currentUser.name;
  document.getElementById('profile-id').textContent = '#' + currentUser.id;
  document.getElementById('profile-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('profile-class').textContent = currentUser.class;
  document.getElementById('profile-batch').textContent = currentUser.batch;
  document.getElementById('profile-expires').textContent = currentUser.daysLeft + ' days';
  document.getElementById('stat-days').textContent = currentUser.daysLeft || 0;
  updateDateTime();
  renderLearnCards();
  renderPractice();
  renderExtra();
  renderLeaderboard();
  updateStats();
}

function renderLearnCards() {
  const modules = [
    {id:'spe', icon:'🗣️'},
    {id:'voc', icon:'📚'},
    {id:'gra', icon:'📐'},
    {id:'wri', icon:'✍️'},
    {id:'lis', icon:'👂'}
  ];
  document.getElementById('learn-cards').innerHTML = modules.map(m => {
    const count = Object.keys(materiData[m.id]?.materials || {}).length;
    return `<div class="learn-card" onclick="showUnits('${m.id}')">
      <div class="icon">${m.icon}</div>
      <div class="title">${t('modules.' + m.id)}</div>
      <div class="count">${count} units</div>
    </div>`;
  }).join('');
}

function showLearnCards() {
  document.getElementById('unit-list-wrap').classList.add('hidden');
  document.getElementById('part-list-wrap').classList.add('hidden');
  document.getElementById('materi-wrap').classList.add('hidden');
  document.getElementById('learn-cards').classList.remove('hidden');
}

function showUnits(module) {
  currentModule = module;
  document.getElementById('learn-cards').classList.add('hidden');
  document.getElementById('unit-list-wrap').classList.remove('hidden');
  document.getElementById('part-list-wrap').classList.add('hidden');
  document.getElementById('materi-wrap').classList.add('hidden');
  document.getElementById('unit-list-title').textContent = t('modules.' + module);
  const materials = materiData[module]?.materials || {};
  const list = document.getElementById('unit-list');
  const units = Object.entries(materials);
  if (!units.length) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted);padding:2rem">No units available</div>';
    return;
  }
  list.innerHTML = units.map(([uid, u]) => {
    if (u.hidden) return '';
    const locked = u.locked;
    const partCount = Object.keys(u.parts || {}).length;
    return `<div class="unit-item ${locked?'locked':''}" onclick="${locked?'':'openUnit(\''+module+'\',\''+uid+'\')'}">
      <div>
        <div class="unit-title">${locked?'🔒 ':''}${esc(u.title||uid)}</div>
        <div class="unit-count">${partCount} parts</div>
      </div>
      <span class="material-icons-round" style="color:var(--muted)">chevron_right</span>
    </div>`;
  }).join('');
}

function openUnit(module, unitId) {
  currentUnitId = unitId;
  showParts(module, unitId);
}

function showParts(module, unitId) {
  currentModule = module;
  currentUnitId = unitId;
  document.getElementById('unit-list-wrap').classList.add('hidden');
  document.getElementById('part-list-wrap').classList.remove('hidden');
  document.getElementById('materi-wrap').classList.add('hidden');
  const unit = materiData[module]?.materials?.[unitId];
  document.getElementById('part-list-title').textContent = unit?.title || unitId;
  const parts = Object.entries(unit?.parts || {});
  const list = document.getElementById('part-list');
  if (!parts.length) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted);padding:2rem">'+t('no_parts')+'</div>';
    return;
  }
  list.innerHTML = parts.map(([pid, p]) => {
    if (p.hidden) return '';
    const locked = p.locked;
    const key = module + '_' + unitId + '_' + pid;
    const done = progressMap[key] === 'done';
    return `<div class="part-item ${locked?'locked':''} ${done?'done':''}" onclick="${locked?'':'openPart(\''+module+'\',\''+unitId+'\',\''+pid+'\')'}">
      <div>
        <div style="font-weight:600">${locked?'🔒 ':''}${done?'✅ ':''}${esc(p.title||pid)}</div>
      </div>
      <span class="material-icons-round" style="color:var(--muted)">chevron_right</span>
    </div>`;
  }).join('');
}

function openPart(module, unitId, partId) {
  currentModule = module;
  currentUnitId = unitId;
  currentPartId = partId;
  startFocusMode();
}

function startFocusMode() {
  const duration = CFG.MFL_DEFAULT || 25;
  focusSeconds = duration * 60;
  focusRunning = false;
  updateFocusTimer();
  document.getElementById('focus-overlay').classList.add('active');
  document.getElementById('focus-start-btn').innerHTML = '<span data-i18n="start">' + t('start') + '</span>';
}

function toggleFocus() {
  if (focusRunning) {
    clearInterval(focusTimer);
    focusRunning = false;
    document.getElementById('focus-start-btn').innerHTML = '<span data-i18n="start">' + t('start') + '</span>';
  } else {
    focusRunning = true;
    document.getElementById('focus-start-btn').innerHTML = '<span data-i18n="pause">' + t('pause') + '</span>';
    focusTimer = setInterval(() => {
      focusSeconds--;
      updateFocusTimer();
      if (focusSeconds <= 0) {
        clearInterval(focusTimer);
        focusRunning = false;
        document.getElementById('focus-overlay').classList.remove('active');
        renderMateri(currentModule, currentUnitId, currentPartId);
      }
    }, 1000);
  }
}

function skipFocus() {
  clearInterval(focusTimer);
  focusRunning = false;
  document.getElementById('focus-overlay').classList.remove('active');
  renderMateri(currentModule, currentUnitId, currentPartId);
}

function updateFocusTimer() {
  const m = Math.floor(focusSeconds / 60);
  const s = focusSeconds % 60;
  document.getElementById('focus-timer').textContent = 
    String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function renderMateri(module, unitId, partId) {
  document.getElementById('part-list-wrap').classList.add('hidden');
  document.getElementById('materi-wrap').classList.remove('hidden');
  const unit = materiData[module]?.materials?.[unitId];
  const part = unit?.parts?.[partId];
  if (!part) return;
  document.getElementById('materi-title').textContent = part.title || partId;
  const content = part.transcript || '';
  const contentEl = document.getElementById('materi-content');
  if (content.includes('|')) {
    const lines = content.split('\n').filter(l => l.trim());
    contentEl.innerHTML = lines.map(line => {
      const sep = line.indexOf('|');
      if (sep === -1) return `<div>${esc(line)}</div>`;
      const en = line.slice(0, sep).trim();
      const id = line.slice(sep+1).trim();
      return `<div class="vocab-line"><span class="vocab-en">${esc(en)}</span><span class="vocab-id">${esc(id)}</span></div>`;
    }).join('');
  } else {
    contentEl.textContent = content || '(No content)';
  }
  const audioBtn = document.getElementById('audio-btn');
  if (part.audioUrl) {
    audioBtn.classList.remove('hidden');
    audioBtn.dataset.url = part.audioUrl;
  } else {
    audioBtn.classList.add('hidden');
  }
  const quizSection = document.getElementById('quiz-section');
  if (part.quiz && part.quiz.length) {
    quizSection.classList.remove('hidden');
    renderQuiz(part.quiz);
  } else {
    quizSection.classList.add('hidden');
  }
  markDone(module, unitId, partId);
}

function renderQuiz(questions) {
  const body = document.getElementById('quiz-body');
  body.innerHTML = questions.map((q, i) => {
    return `<div style="margin-bottom:1rem">
      <div class="quiz-question">${i+1}. ${esc(q.q)}</div>
      <div class="quiz-options">
        ${q.opts.map((opt, oi) => `<div class="quiz-option" onclick="answerQuiz(this,${i},${oi},${q.a})">${esc(opt)}</div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function answerQuiz(el, qIdx, optIdx, correctIdx) {
  const options = el.parentElement.querySelectorAll('.quiz-option');
  if ([...options].some(o => o.classList.contains('correct') || o.classList.contains('wrong'))) return;
  if (optIdx === correctIdx) {
    el.classList.add('correct');
    showToast(t('correct_answer'), 'success', 1500);
  } else {
    el.classList.add('wrong');
    options[correctIdx].classList.add('correct');
    showToast(t('wrong_answer'), 'error', 2000);
  }
}

function playAudio() {
  const url = document.getElementById('audio-btn').dataset.url;
  if (!url) return;
  const audio = new Audio(url);
  audio.play().catch(e => console.warn('Audio play failed:', e));
}

function markDone(module, unitId, partId) {
  const key = module + '_' + unitId + '_' + partId;
  if (progressMap[key] === 'done') return;
  progressMap[key] = 'done';
  fetch(CFG.LOG, {
    method: 'POST',
    mode: 'no-cors',
    headers: {'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({
      action: 'mark_done',
      id: currentUser.id,
      batch: currentUser.batch,
      module: module,
      unitId: unitId,
      partId: partId,
      score: 100
    })
  }).catch(e => console.warn('mark_done failed:', e));
  updateStats();
}

function renderPractice() {
  const items = [
    {icon:'🔁', title:'Flashcards', desc:'Review vocabulary with SRS'},
    {icon:'⚔️', title:'Vocab Duel', desc:'Challenge word matching'},
    {icon:'🎯', title:'Word of Day', desc:'Learn one new word daily'},
    {icon:'🔤', title:'Word Scramble', desc:'Unscramble letters'}
  ];
  document.getElementById('practice-list').innerHTML = items.map(p => 
    `<div class="practice-card" onclick="showToast('Coming soon','warning')">
      <div class="icon">${p.icon}</div>
      <div class="title">${p.title}</div>
      <div class="desc">${p.desc}</div>
    </div>`
  ).join('');
}

function renderExtra() {
  const tabs = (extData.tabs || []).filter(tab => {
    if (!tab.enabled) return false;
    if (tab.batch && tab.batch.length && !tab.batch.includes(currentUser.batch)) return false;
    return true;
  });
  const list = document.getElementById('extra-list');
  if (!tabs.length) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted);padding:2rem">'+t('no_extra')+'</div>';
    return;
  }
  list.innerHTML = tabs.map(tab => 
    `<div class="extra-item" onclick="loadExtraTab('${tab.id}','${tab.inject}','${esc(tab.title)}')">
      <div class="icon">${tab.icon}</div>
      <div class="info">
        <div class="title">${esc(tab.title)}</div>
        <div class="desc">Tap to open</div>
      </div>
      <span class="material-icons-round" style="color:var(--muted)">chevron_right</span>
    </div>`
  ).join('');
}

async function loadExtraTab(id, jsFile, title) {
  showToast('Loading ' + title + '...', 'success', 1000);
  try {
    const script = document.createElement('script');
    script.src = CFG.JS + jsFile + '?v=' + Date.now();
    script.onload = () => {
      if (typeof window.JEC_EXTRA_INIT === 'function') {
        window.JEC_EXTRA_INIT(id, currentUser);
      }
    };
    document.head.appendChild(script);
  } catch(e) {
    showToast('Failed to load: ' + e.message, 'error');
  }
}

function renderLeaderboard() {
  const box = document.getElementById('leaderboard-box');
  if (!leaderboardData.length) {
    box.innerHTML = '<div style="text-align:center;color:var(--muted);padding:1rem">No leaderboard data yet</div>';
    return;
  }
  box.innerHTML = leaderboardData.slice(0, 10).map((s, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    return `<div class="lb-item">
      <div class="lb-rank ${rankClass}">#${i+1}</div>
      <div class="lb-info">
        <div class="lb-name">${esc(s.id)}</div>
        <div class="lb-xp">${s.totalXp} XP • ${s.streak || 0} day streak</div>
      </div>
    </div>`;
  }).join('');
}

function updateStats() {
  const done = Object.values(progressMap).filter(s => s === 'done').length;
  document.getElementById('stat-parts').textContent = done;
  document.getElementById('stat-xp').textContent = done * 10;
  document.getElementById('stat-streak').textContent = 1;
}

function switchView(name, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (name === 'learn') showLearnCards();
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  if (cur === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('theme-icon').textContent = 'dark_mode';
    localStorage.setItem('jec_theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-icon').textContent = 'light_mode';
    localStorage.setItem('jec_theme', 'dark');
  }
}

function applyTheme() {
  const saved = localStorage.getItem('jec_theme');
  const t = saved || 'light';
  if (t === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-icon').textContent = 'light_mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('theme-icon').textContent = 'dark_mode';
  }
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'id' : 'en';
  localStorage.setItem('jec_lang', currentLang);
  applyLang();
}

function applyLang() {
  document.getElementById('lang-btn').textContent = currentLang.toUpperCase();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = getI18n(key);
    if (val) el.textContent = val;
  });
}

function getI18n(key) {
  const parts = key.split('.');
  let obj = I18N[currentLang] || I18N.en;
  for (const p of parts) {
    if (obj[p] === undefined) return key;
    obj = obj[p];
  }
  return obj;
}

function t(key) { return getI18n(key); }

function updateDateTime() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayName = days[now.getDay()];
  const d = now.getDate();
  const m = months[now.getMonth()];
  const y = now.getFullYear();
  let h = now.getHours();
  const min = String(now.getMinutes()).padStart(2,'0');
  const sec = String(now.getSeconds()).padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  const dt = `${dayName}, ${m} ${d}, ${y} • ${h}:${min}:${sec} ${ampm}`;
  document.getElementById('datetime').textContent = dt;
  const hour = now.getHours();
  let greetKey = 'morning';
  if (hour >= 12 && hour < 15) greetKey = 'afternoon';
  else if (hour >= 15 && hour < 18) greetKey = 'evening';
  else if (hour >= 18 || hour < 5) greetKey = 'night';
  document.getElementById('greet-text').textContent = t(greetKey);
}

function heartbeat() {
  if (!currentUser) return;
  fetch(CFG.LOG, {
    method: 'POST',
    mode: 'no-cors',
    headers: {'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({
      action: 'heartbeat',
      id: currentUser.id,
      batch: currentUser.batch,
      page: 'sv1'
    })
  }).catch(() => {});
}

function openMenu() {
  document.getElementById('ov-menu').classList.add('active');
}

function closeOv(id) {
  document.getElementById(id).classList.remove('active');
}

function showToast(msg, type='success', duration=3000) {
  const toast = document.getElementById('toast');
  toast.className = 'toast ' + type;
  const icon = document.getElementById('toast-icon');
  if (type === 'success') icon.textContent = 'check_circle';
  else if (type === 'error') icon.textContent = 'error';
  else icon.textContent = 'warning';
  document.getElementById('toast-message').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function esc(s) {
  return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
