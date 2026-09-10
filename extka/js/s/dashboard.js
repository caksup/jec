/* #25 | /root/js/s/dashboard.js | v 2.5 | u 10/09/2026 • 07:20:00 | xu : ke-10 | note : #noteresponse
- UPDATE 12 (Opsi A): fallback jumlah soal bila session.questionsCount kosong.
  * Helper fillMissingQuestionsCount() mengumpulkan sessionId dari sesi yang akan
    ditampilkan di Home (hwActive + hwMissed + live perlu), lalu query collection
    questions dengan filter 'in' (chunked 30/sessionId agar aman), hitung count di client,
    dan backfill sementara ke s.questionsCount di memory (TIDAK write ke Firestore).
  * Card PR & Live sekarang menampilkan angka soal yang akurat sejak sesi dibuat,
    tidak lagi "- soal".
  * Query hanya dijalankan bila ada sesi tanpa counter; bila semua sesi sudah punya
    questionsCount, tidak ada read tambahan.
- TETAP (tidak dipotong dari v2.4): dispatcher 5 tab, loadAllData, computeStatus,
  helper homework (isHw, hwCompletedAttempts, hwRetryAvailable, hwExpired, hwPending,
  hwMissed), countdown deadline fmtDeadline, setSectionTitle, sessionView, openStart,
  clearParamOnce, handleSessionParam, loadDashboard, fallback startHomework,
  loadSessions, loadMyResults, escapeHtmlS. */

(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  var BULAN_S = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var RETRY_THRESHOLD = 50;   // fixed (2A)
  var IN_CHUNK = 30;           // batas 'in' query Firestore

  // ===== Dispatcher untuk 5 tab bottom nav =====
  window.renderStudentTab = function(name){
    switch(name){
      case 'home':     renderHomeTab(); break;
      case 'riwayat':  if(window.renderRiwayatTab) renderRiwayatTab(); break;
      case 'nilai':    if(window.renderNilaiTab) renderNilaiTab(); break;
      case 'feedback': if(window.renderFeedbackTab) renderFeedbackTab(); break;
      case 'profile':  if(window.renderProfileTab) renderProfileTab(); break;
    }
  };

  // ===== Load data bersama =====
  async function loadAllData(){
    try {
      var set = await db.collection('settings').doc('global_settings').get();
      if (set.exists) {
        PS.settings.antiCheatEnabled = set.data().antiCheatEnabled !== false;
        PS.settings.maxTabSwitches = set.data().maxTabSwitches || 3;
      }
    } catch(e){}
    try {
      var snap = await db.collection('sessions').get();
      PS.sessions = [];
      snap.forEach(function(d){
        var s = Object.assign({id:d.id},d.data());
        if (s.status !== false && s.visible !== false) PS.sessions.push(s);
      });
      console.log('[PS] sessions loaded:', PS.sessions.length);
    } catch(e){ console.error('[PS] load sessions error:', e); }
    try {
      var attSnap = await db.collection('attempts').where('studentId','==',PS.user.id).get();
      PS.myAttempts = [];
      attSnap.forEach(function(d){ PS.myAttempts.push(Object.assign({id:d.id}, d.data())); });
      console.log('[PS] attempts loaded:', PS.myAttempts.length);
    } catch(e){ console.error('[PS] load attempts error:', e); }
  }

  function computeStatus(s){
    var now = new Date();
    if (s.startTime && now < new Date(s.startTime)) return 'locked';
    if (s.endTime && now > new Date(s.endTime)) return 'expired';
    if (s.status === false || s.visible === false) return 'locked';
    return 'available';
  }

  // ===== Helper mode homework =====
  function isHw(s){ return s.mode === 'homework'; }
  function hwCompletedAttempts(s){
    return PS.myAttempts.filter(function(a){ return a.sessionId===s.id && a.status==='completed'; });
  }
  function hwRetryAvailable(s){
    if (!isHw(s) || s.retryMode !== 'conditional') return false;
    var atts = hwCompletedAttempts(s);
    if (atts.length === 0 || atts.length >= 2) return false;
    var last = atts[atts.length-1];
    var score = last.score||0;
    var correct = last.correctAnswers||0;
    var total = last.totalQuestions||1;
    return (score < RETRY_THRESHOLD || correct < total/2);
  }
  function hwExpired(s){
    if (!s.endTime) return false;
    var end = new Date(s.endTime).getTime();
    return !isNaN(end) && Date.now() > end;
  }
  function hwPending(s){
    if (!isHw(s) || hwExpired(s)) return false;
    var atts = hwCompletedAttempts(s);
    if (atts.length === 0) return true;
    return hwRetryAvailable(s);
  }
  function hwMissed(s){
    return isHw(s) && hwExpired(s) && hwCompletedAttempts(s).length === 0;
  }

  // ===== Countdown deadline (6C: absolute + relative) =====
  function p2(n){ return String(n).padStart(2,'0'); }
  function relTime(ms){
    var m = Math.floor(ms/60000);
    var d = Math.floor(m/1440); m %= 1440;
    var h = Math.floor(m/60);  m %= 60;
    if (d>0) return d+' hari '+h+' jam';
    if (h>0) return h+' jam '+m+' menit';
    return m+' menit';
  }
  function fmtDeadline(s){
    if (!s.endTime) return { text:'Tanpa deadline', urgent:false, over:false };
    var end = new Date(s.endTime);
    if (isNaN(end.getTime())) return { text:'Tanpa deadline', urgent:false, over:false };
    var abs = end.getDate()+' '+BULAN_S[end.getMonth()]+' '+end.getFullYear()+', '+p2(end.getHours())+':'+p2(end.getMinutes());
    var diff = end.getTime() - Date.now();
    if (diff <= 0) return { text:'Deadline lewat: '+abs, urgent:true, over:true };
    return { text:'Deadline: '+abs+' ('+relTime(diff)+' lagi)', urgent:(diff < 24*3600*1000), over:false };
  }

  // ===== Set judul section dinamis (ubah h2 bawaan sp.html) =====
  function setSectionTitle(containerId, icon, text, color){
    var c = $(containerId);
    if (!c) return;
    var h = c.previousElementSibling;
    if (h && h.classList && h.classList.contains('section-title')) {
      h.innerHTML = '<span class="material-icons" style="color:'+(color||'#2563eb')+';">'+icon+'</span>' + text;
    }
  }

  // ===== Label session untuk LIVE =====
  function sessionView(s, att){
    if (att && att.status === 'completed')  return { label:'Selesai',        cls:'completed', disabled:true,  status:'completed' };
    if (att && att.status === 'in_progress')return { label:'Lanjutkan',      cls:'completed', disabled:false, status:'available' };
    var st = computeStatus(s);
    if (st === 'locked')                    return { label:'Belum Dimulai',  cls:'locked',    disabled:true,  status:'locked' };
    if (st === 'expired')                   return { label:'Terlewat',       cls:'expired',   disabled:true,  status:'expired' };
    return { label:'Mulai', cls:'available', disabled:false, status:'available' };
  }

  function openStart(sess){
    var tries = 0;
    (function attempt(){
      if (window.startSession) { window.startSession(sess.id, computeStatus(sess)); }
      else if (tries++ < 15) { setTimeout(attempt, 200); }
    })();
  }

  function clearParamOnce(){
    try { if (location.search && history.replaceState) history.replaceState(null, '', location.pathname); } catch(e){}
  }

  async function handleSessionParam(){
    var code = null;
    try { code = new URLSearchParams(location.search).get('jec-sim-tka'); } catch(e){}
    if (!code) return;
    var sess = PS.sessions.find(function(s){ return (s.code||'').toLowerCase() === code.toLowerCase(); });
    if (!sess) { toast('Kode sesi tidak ditemukan','warning'); clearParamOnce(); return; }
    var done = PS.myAttempts.find(function(a){ return a.sessionId===sess.id && a.status==='completed'; });
    if (done && window.showResultFromAttempt) { showResultFromAttempt(done.id); clearParamOnce(); return; }
    try {
      var inc = await db.collection('attempts')
        .where('studentId','==',PS.user.id).where('sessionId','==',sess.id).where('status','==','in_progress').get();
      if (!inc.empty && window.autoResume) { window.autoResume(sess.id); clearParamOnce(); return; }
    } catch(e){}
    try { openStart(sess); clearParamOnce(); } catch(e){}
  }

  async function loadDashboard(){
    var pN = $('pName'); if(pN) pN.textContent = PS.user.name;
    var pI = $('pId');   if(pI) pI.textContent = PS.user.id;
    var pB = $('pBatch'); if(pB) pB.textContent = 'Batch ' + (PS.user.batch||'-') + ' | Tahun ' + (PS.user.year||'-');
    await loadAllData();
    await handleSessionParam();
    if (window.PS && typeof PS.setTab === 'function') PS.setTab('home');
  }

  // ===== Fallback startHomework (homework.js akan override saat load) =====
  if (!window.startHomework) {
    window.startHomework = function(id){ if (window.startSession) startSession(id, 'available'); };
  }

  // ===== UPDATE 12: backfill sementara jumlah soal untuk sesi tanpa counter =====
  // Mengisi s.questionsCount di memory (bukan Firestore) dengan query 'in' chunked 30.
  // Hanya session yang akan ditampilkan (hwActive, hwMissed, live perlu) yang dihitung.
  async function fillMissingQuestionsCount(sessionsToRender){
    var need = sessionsToRender.filter(function(s){
      return !s.questionsCount && s.questionsCount !== 0;
    });
    if (!need.length) return;

    var ids = need.map(function(s){ return s.id; });
    var counts = {};   // sid -> count

    try {
      // Chunk 30 per query (batas Firestore 'in')
      for (var i = 0; i < ids.length; i += IN_CHUNK) {
        var chunk = ids.slice(i, i + IN_CHUNK);
        var snap = await db.collection('questions').where('sessionId', 'in', chunk).get();
        snap.forEach(function(d){
          var sid = d.data().sessionId;
          counts[sid] = (counts[sid] || 0) + 1;
        });
      }
      // Backfill sementara ke memory PS.sessions (jangan write Firestore)
      need.forEach(function(s){
        if (counts[s.id] !== undefined) s.questionsCount = counts[s.id];
      });
      console.log('[PS] questionsCount backfill:', counts);
    } catch(e){
      console.warn('[PS] fill questionsCount gagal:', e.message);
    }
  }

  // ===== TAB HOME =====
  async function renderHomeTab(){
    if (!PS.sessions || !PS.sessions.length) { await loadAllData(); }

    // ----- 1. OVERVIEW -----
    var sesiDikerjakan = PS.myAttempts.length;
    var soalDikerjakan = 0, totalScore = 0, countCompleted = 0;
    PS.myAttempts.forEach(function(a){
      if (a.status === 'completed') { soalDikerjakan += (a.totalQuestions||0); totalScore += (a.score||0); countCompleted++; }
      else if (a.progress) soalDikerjakan += a.progress;
    });
    var avgNilai = countCompleted ? Math.round(totalScore/countCompleted) : 0;

    var ov = $('homeOverview');
    if (ov) {
      ov.innerHTML =
        '<div class="mini-grid">' +
          '<div class="mini-card mini-card-primary"><div class="mini-icon"><span class="material-icons">event_available</span></div>' +
            '<div class="mini-label">Sesi Dikerjakan</div><div class="mini-value">' + sesiDikerjakan + '</div></div>' +
          '<div class="mini-card mini-card-success"><div class="mini-icon"><span class="material-icons">quiz</span></div>' +
            '<div class="mini-label">Soal Dikerjakan</div><div class="mini-value">' + soalDikerjakan + '</div></div>' +
          '<div class="mini-card mini-card-warning"><div class="mini-icon"><span class="material-icons">emoji_events</span></div>' +
            '<div class="mini-label">Rata-rata Nilai</div><div class="mini-value">' + avgNilai + '</div></div>' +
        '</div>';
    }

    // ===== Siapkan daftar sesi yang akan ditampilkan (untuk fillMissingQuestionsCount) =====
    var hwActive = PS.sessions.filter(hwPending);
    var hwMissedArr = PS.sessions.filter(hwMissed);
    var liveSessions = PS.sessions.filter(function(s){ return !isHw(s); });
    var perlu = liveSessions.filter(function(s){
      var att = PS.myAttempts.find(function(a){ return a.sessionId === s.id; });
      var v = sessionView(s, att);
      return (v.label === 'Mulai' || v.label === 'Lanjutkan' || v.label === 'Terlewat');
    });
    var allToRender = [].concat(hwActive, hwMissedArr, perlu);
    await fillMissingQuestionsCount(allToRender);

    // ----- 2. HOMEWORK PENDING (PR) -----
    setSectionTitle('homeNotif', 'menu_book', 'Homework Pending (PR)', '#f59e0b');
    var hwWrap = $('homeNotif');
    if (hwWrap) {
      if (hwActive.length === 0 && hwMissedArr.length === 0) {
        hwWrap.innerHTML =
          '<div class="empty-state" style="padding:1.5rem;"><span class="material-icons">check_circle</span>' +
          '<p>Tidak ada homework pending. Kerja bagus!</p></div>';
      } else {
        var html = '';
        hwActive.forEach(function(s){
          var dl = fmtDeadline(s);
          var retry = hwRetryAvailable(s);
          var atts = hwCompletedAttempts(s);
          var qLabel = (s.questionsCount!=null) ? s.questionsCount : '-';
          html +=
            '<div class="hw-card" onclick="startHomework(\'' + s.id + '\')">' +
              '<div class="hw-card-head">' +
                '<div class="hw-card-title"><span class="material-icons">menu_book</span>' + escapeHtmlS(s.name) + '</div>' +
                (retry ? '<span class="hw-retry-badge"><span class="material-icons">refresh</span>Retry tersedia</span>' : '') +
              '</div>' +
              '<div class="hw-card-meta">' +
                '<span><span class="material-icons">quiz</span>' + qLabel + ' soal</span>' +
                '<span><span class="material-icons">timer</span>' + (s.duration||60) + ' mnt</span>' +
                (atts.length ? '<span><span class="material-icons">history</span>Percobaan: ' + atts.length + '/2</span>' : '') +
              '</div>' +
              '<div class="hw-deadline' + (dl.urgent?' urgent':'') + '"><span class="material-icons">schedule</span>' + dl.text + '</div>' +
            '</div>';
        });
        hwMissedArr.forEach(function(s){
          var dl = fmtDeadline(s);
          html +=
            '<div class="hw-card disabled">' +
              '<div class="hw-card-head">' +
                '<div class="hw-card-title"><span class="material-icons">menu_book</span>' + escapeHtmlS(s.name) + '</div>' +
                '<span class="session-status expired">Terlewat</span>' +
              '</div>' +
              '<div class="hw-deadline urgent"><span class="material-icons">schedule</span>' + dl.text + '</div>' +
            '</div>';
        });
        hwWrap.innerHTML = html;
      }
    }

    // ----- 3. LIVE EXERCISE TERSEDIA -----
    setSectionTitle('homeSesiList', 'bolt', 'Live Exercise Tersedia', '#2563eb');
    var liveWrap = $('homeSesiList');
    if (liveWrap) {
      if (perlu.length === 0) {
        liveWrap.innerHTML =
          '<div class="empty-state" style="padding:1.5rem;"><span class="material-icons">event_busy</span>' +
          '<p>Tidak ada live exercise yang perlu dikerjakan saat ini.</p></div>';
      } else {
        liveWrap.innerHTML = perlu.map(function(s){
          var att = PS.myAttempts.find(function(a){ return a.sessionId === s.id; });
          var v = sessionView(s, att);
          var cls = 'session-item' + (v.label==='Lanjutkan' ? ' resume' : '') + (v.disabled ? ' disabled' : '');
          var sub = '';
          if (v.label === 'Lanjutkan') sub = 'Progress: ' + (att.progress||0) + '/' + (att.totalQuestions||0);
          else if (v.label === 'Terlewat') sub = 'Waktu sesi telah berakhir sebelum dikerjakan';
          else sub = 'Belum dikerjakan';
          var qLabel = (s.questionsCount!=null) ? s.questionsCount : '-';
          return '<div class="' + cls + '"' + (v.disabled ? '' : ' onclick="startSession(\'' + s.id + '\',\'' + v.status + '\')"') + '>' +
            '<div><div class="session-title"><span class="material-icons">bolt</span>' + escapeHtmlS(s.name) + '</div>' +
            '<div class="session-meta">' +
              '<span><span class="material-icons">timer</span>' + (s.duration||60) + ' mnt</span>' +
              '<span><span class="material-icons">quiz</span>' + qLabel + ' soal</span>' +
            '</div>' +
            '<div style="font-size:.75rem;color:#64748b;margin-top:.25rem;">' + sub + '</div></div>' +
            '<span class="session-status ' + v.cls + '">' + v.label + '</span></div>';
        }).join('');
      }
    }
  }

  async function loadSessions(){ if (!PS.sessions || !PS.sessions.length) await loadAllData(); }
  async function loadMyResults(){ if (!PS.myAttempts) await loadAllData(); }
  function escapeHtmlS(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.loadDashboard = loadDashboard;
  window.loadSessions = loadSessions;
  window.loadMyResults = loadMyResults;
  window.renderHomeTab = renderHomeTab;
  window.loadAllData = loadAllData;
})();
