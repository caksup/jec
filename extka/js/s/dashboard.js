/* s#15 | /root/js/s/dashboard.js | v 2.10 | u 17/09/2026 • 10:00:00 | xu : ke-15 | note : #noteresponse
- v2.9 -> v2.10 (FIX SESUAI PERMINTAAN USER — tanpa grace period):
  * HILANGKAN SEMUA gate "grace 24 jam" (RETRY_GRACE_HOURS, isInGracePeriod,
    hwInGrace). Batas ini penyebab PR yang masih punya 1 kesempatan retry
    menghilang dari dashboard setelah deadline lewat >24 jam. User TIDAK
    pernah meminta batas tersebut.
  * ATURAN TAMPIL BARU (hwPending):
    - PR SELESAI (completedAttempts >= maxAttempts) -> TIDAK tampil di
      dashboard (masuk Riwayat). maxAttempts = 2 bila retryMode conditional
      (fallback default homework), else 1.
    - PR punya attempt in_progress -> tampil (bisa dilanjutkan).
    - PR belum expired & belum selesai -> tampil (card normal / card retry).
    - PR SUDAH expired -> tampil HANYA bila retry tersedia (1 attempt completed
      yang gagal threshold). Ini yang user minta: "PR yang masih ada 1
      kesempatan masih di dashboard".
    - PR expired tanpa attempt completed -> TIDAK tampil (forfeit; tidak
      nongkrong seperti keluhan sebelumnya).
  * hwRetryAvailable: retry = homework + retryMode conditional (fallback) +
    tepat 1 attempt completed + attempt tsb gagal (score<50 ATAU benar<setengah).
    TANPA cek deadline.
  * TOMBOL RETRY EKSPLISIT di card HW retry dipertahankan dari v2.9
    (.hw-retry-btn kuning, onclick startHomework).
  * fmtDeadline kembali polos (tanpa teks grace).
  * TETAP: filter realtime dari Live, section Realtime Exercise non-clickable,
    Live expired tidak tampil di "Tersedia", fillMissingQuestionsCount,
    dispatcher 5 tab, debug log [dash].
- EXPOSE: window.loadDashboard, window.loadSessions, window.loadMyResults,
  window.renderHomeTab, window.loadAllData, window.renderStudentTab. */

(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  var BULAN_S = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var RETRY_THRESHOLD = 50;
  var IN_CHUNK = 30;

  function dbg(){ var a=['[dash]']; for(var i=0;i<arguments.length;i++) a.push(arguments[i]); console.log.apply(console, a); }

  function injectDashStyles(){
    if (document.getElementById('s-dash-style-v210')) return;
    ['s-dash-style-v29','s-dash-style-v28','s-dash-style-v27','s-dash-style-v26'].forEach(function(id){
      var o = document.getElementById(id); if (o) o.remove();
    });
    var st = document.createElement('style');
    st.id = 's-dash-style-v210';
    st.textContent = [
      '.hw-card.hw-card-retry{background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:2px solid #f59e0b;}',
      '.hw-card.hw-card-retry .hw-card-title{color:#92400e;font-weight:700;}',
      '.hw-retry-badge.big{background:#f59e0b;color:#fff;padding:.25rem .625rem;',
      '  border-radius:50px;font-size:.7rem;font-weight:700;display:inline-flex;',
      '  align-items:center;gap:.25rem;white-space:nowrap;}',
      '.hw-retry-info{font-size:.75rem;color:#78350f;padding:.5rem .625rem;',
      '  background:rgba(255,255,255,.6);border:1px dashed #f59e0b;border-radius:8px;',
      '  margin-top:.375rem;line-height:1.4;}',
      '.hw-retry-btn{margin-top:.625rem;width:100%;background:#f59e0b;color:#fff;',
      '  border:none;border-radius:10px;padding:.625rem .875rem;font-weight:700;',
      '  font-size:.875rem;display:inline-flex;align-items:center;justify-content:center;',
      '  gap:.375rem;cursor:pointer;transition:all .15s;font-family:inherit;',
      '  box-shadow:0 2px 6px rgba(245,158,11,.35);}',
      '.hw-retry-btn:hover{background:#d97706;}',
      '.hw-retry-btn:active{transform:scale(.99);}',
      '.hw-retry-btn .material-icons{font-size:18px;}'
    ].join('\n');
    document.head.appendChild(st);
  }

  window.renderStudentTab = function(name){
    switch(name){
      case 'home':     renderHomeTab(); break;
      case 'riwayat':  if(window.renderRiwayatTab) renderRiwayatTab(); break;
      case 'nilai':    if(window.renderNilaiTab) renderNilaiTab(); break;
      case 'feedback': if(window.renderFeedbackTab) renderFeedbackTab(); break;
      case 'profile':  if(window.renderProfileTab) renderProfileTab(); break;
    }
  };

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

  function isHw(s){ return s.mode === 'homework'; }
  function isRealtime(s){ return s.mode === 'realtime'; }

  function hwCompletedAttempts(s){
    return PS.myAttempts.filter(function(a){ return a.sessionId===s.id && a.status==='completed'; });
  }
  function hwHasInProgress(s){
    return PS.myAttempts.some(function(a){ return a.sessionId===s.id && a.status==='in_progress'; });
  }

  function getRetryMode(s){
    if (!s) return 'once';
    if (s.retryMode && typeof s.retryMode === 'string') return s.retryMode;
    return isHw(s) ? 'conditional' : 'once';
  }
  function maxAttempts(s){ return getRetryMode(s)==='conditional' ? 2 : 1; }

  function hwExpired(s){
    if (!s.endTime) return false;
    var end = new Date(s.endTime).getTime();
    return !isNaN(end) && Date.now() > end;
  }

  // Retry tersedia: 1 attempt completed yang gagal. TANPA cek deadline.
  function hwRetryAvailable(s){
    if (!isHw(s)) return false;
    if (getRetryMode(s) !== 'conditional') return false;
    var atts = hwCompletedAttempts(s);
    if (atts.length === 0 || atts.length >= maxAttempts(s)) return false;
    var last = atts[atts.length-1];
    var score = last.score||0;
    var correct = last.correctAnswers||0;
    var total = last.totalQuestions||1;
    return (score < RETRY_THRESHOLD) || (correct < total/2);
  }

  // Aturan tampil baru (lihat header)
  function hwPending(s){
    if (!isHw(s)) return false;
    var atts = hwCompletedAttempts(s);
    if (atts.length >= maxAttempts(s)) return false;      // selesai -> Riwayat
    if (hwHasInProgress(s)) return true;                   // bisa dilanjutkan
    if (!hwExpired(s)) return true;                        // masih dalam deadline
    return hwRetryAvailable(s);                            // expired: hanya bila retry tersedia
  }

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

  function setSectionTitle(containerId, icon, text, color){
    var c = $(containerId);
    if (!c) return;
    var h = c.previousElementSibling;
    if (h && h.classList && h.classList.contains('section-title')) {
      h.innerHTML = '<span class="material-icons" style="color:'+(color||'#2563eb')+';">'+icon+'</span>' + text;
    }
  }

  function sessionView(s, att){
    if (att && att.status === 'completed')  return { label:'Selesai',   cls:'completed', disabled:true,  status:'completed' };
    if (att && att.status === 'in_progress')return { label:'Lanjutkan', cls:'completed', disabled:false, status:'available' };
    var st = computeStatus(s);
    if (st === 'locked')  return { label:'Belum Dimulai', cls:'locked',  disabled:true, status:'locked' };
    if (st === 'expired') return { label:'Terlewat',      cls:'expired', disabled:true, status:'expired' };
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

  if (!window.startHomework) {
    window.startHomework = function(id){ if (window.startSession) startSession(id, 'available'); };
  }

  async function fillMissingQuestionsCount(sessionsToRender){
    var need = sessionsToRender.filter(function(s){ return !s.questionsCount && s.questionsCount !== 0; });
    if (!need.length) return;
    var ids = need.map(function(s){ return s.id; });
    var counts = {};
    try {
      for (var i = 0; i < ids.length; i += IN_CHUNK) {
        var chunk = ids.slice(i, i + IN_CHUNK);
        var snap = await db.collection('questions').where('sessionId', 'in', chunk).get();
        snap.forEach(function(d){
          var qd = d.data();
          if (qd.deleted === true) return;
          counts[qd.sessionId] = (counts[qd.sessionId] || 0) + 1;
        });
      }
      need.forEach(function(s){ if (counts[s.id] !== undefined) s.questionsCount = counts[s.id]; });
      console.log('[PS] questionsCount backfill:', counts);
    } catch(e){ console.warn('[PS] fill questionsCount gagal:', e.message); }
  }

  // ===== Card PR: retry (dengan TOMBOL) atau normal =====
  function buildHwPendingCard(s){
    var dl = fmtDeadline(s);
    var retry = hwRetryAvailable(s);
    var atts = hwCompletedAttempts(s);
    var qLabel = (s.questionsCount!=null) ? s.questionsCount : '-';
    var sid = s.id.replace(/'/g, "\\'");

    if (retry) {
      var last = atts[atts.length-1];
      return '<div class="hw-card hw-card-retry">' +
        '<div class="hw-card-head">' +
          '<div class="hw-card-title"><span class="material-icons">refresh</span>' + escapeHtmlS(s.name) + '</div>' +
          '<span class="hw-retry-badge big"><span class="material-icons" style="font-size:12px;">refresh</span>RETRY TERSEDIA</span>' +
        '</div>' +
        '<div class="hw-retry-info">' +
          '<span class="material-icons" style="font-size:14px;vertical-align:-2px;">info</span> ' +
          'Nilai Try 1: <b>'+(last.score||0)+'</b> (benar '+(last.correctAnswers||0)+'/'+(last.totalQuestions||0)+')' +
          '<br>Sisa 1 kesempatan — nilai tertinggi yang dicatat.' +
        '</div>' +
        '<div class="hw-card-meta">' +
          '<span><span class="material-icons">quiz</span>' + qLabel + ' soal</span>' +
          '<span><span class="material-icons">timer</span>' + (s.duration||60) + ' mnt</span>' +
          '<span><span class="material-icons">history</span>Percobaan: ' + atts.length + '/2</span>' +
        '</div>' +
        '<button type="button" class="hw-retry-btn" onclick="startHomework(\'' + sid + '\')">' +
          '<span class="material-icons">refresh</span>Retry Sekarang (Percobaan 2/2)' +
        '</button>' +
        '<div class="hw-deadline' + (dl.urgent?' urgent':'') + '"><span class="material-icons">schedule</span>' + dl.text + '</div>' +
      '</div>';
    }

    return '<div class="hw-card" onclick="startHomework(\'' + sid + '\')">' +
      '<div class="hw-card-head">' +
        '<div class="hw-card-title"><span class="material-icons">menu_book</span>' + escapeHtmlS(s.name) + '</div>' +
      '</div>' +
      '<div class="hw-card-meta">' +
        '<span><span class="material-icons">quiz</span>' + qLabel + ' soal</span>' +
        '<span><span class="material-icons">timer</span>' + (s.duration||60) + ' mnt</span>' +
        (atts.length ? '<span><span class="material-icons">history</span>Percobaan: ' + atts.length + '/2</span>' : '') +
      '</div>' +
      '<div class="hw-deadline' + (dl.urgent?' urgent':'') + '"><span class="material-icons">schedule</span>' + dl.text + '</div>' +
    '</div>';
  }

  function ensureRtSection(){
    var rtContainer = $('homeRtList');
    if (rtContainer) return rtContainer;
    var homePage = $('page-home');
    if (!homePage) return null;
    var h2 = document.createElement('h2');
    h2.className = 'section-title';
    h2.innerHTML = '<span class="material-icons" style="color:#7c3aed;">sports_esports</span>Realtime Exercise';
    rtContainer = document.createElement('div');
    rtContainer.id = 'homeRtList';
    homePage.appendChild(h2);
    homePage.appendChild(rtContainer);
    return rtContainer;
  }

  async function renderHomeTab(){
    injectDashStyles();
    dbg('renderHomeTab: start');
    if (!PS.sessions || !PS.sessions.length) { await loadAllData(); }

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

    var hwActive = PS.sessions.filter(hwPending);
    var liveSessions = PS.sessions.filter(function(s){ return !isHw(s) && !isRealtime(s) && !hwExpired(s); });
    var perlu = liveSessions.filter(function(s){
      var att = PS.myAttempts.find(function(a){ return a.sessionId === s.id; });
      var v = sessionView(s, att);
      return (v.label === 'Mulai' || v.label === 'Lanjutkan');
    });
    var rtAssigned = PS.sessions.filter(function(s){
      if (!isRealtime(s)) return false;
      var arr = s.assignedStudents;
      if (!arr || !arr.length) return true;
      return arr.indexOf(PS.user.id) !== -1;
    });

    dbg('filter: hwActive='+hwActive.length+', liveTersedia='+perlu.length+', rt='+rtAssigned.length);

    await fillMissingQuestionsCount([].concat(hwActive, perlu, rtAssigned));

    setSectionTitle('homeNotif', 'menu_book', 'Homework Pending (PR)', '#f59e0b');
    var hwWrap = $('homeNotif');
    if (hwWrap) {
      if (hwActive.length === 0) {
        hwWrap.innerHTML =
          '<div class="empty-state" style="padding:1.5rem;"><span class="material-icons">check_circle</span>' +
          '<p>Tidak ada homework pending. Kerja bagus!</p></div>';
      } else {
        var retryCards = [], normalCards = [];
        hwActive.forEach(function(s){
          if (hwRetryAvailable(s)) retryCards.push(buildHwPendingCard(s));
          else normalCards.push(buildHwPendingCard(s));
        });
        hwWrap.innerHTML = retryCards.concat(normalCards).join('');
      }
    }

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
          var cls = 'session-item' + (v.label==='Lanjutkan' ? ' resume' : '');
          var sub = (v.label === 'Lanjutkan') ? ('Progress: ' + (att.progress||0) + '/' + (att.totalQuestions||0)) : 'Belum dikerjakan';
          var qLabel = (s.questionsCount!=null) ? s.questionsCount : '-';
          return '<div class="' + cls + '" onclick="startSession(\'' + s.id + '\',\'' + v.status + '\')">' +
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

    var rtWrap = ensureRtSection();
    if (rtWrap) {
      if (rtAssigned.length === 0) {
        rtWrap.innerHTML =
          '<div class="empty-state" style="padding:1.5rem;"><span class="material-icons">sports_esports</span>' +
          '<p>Belum ada sesi realtime yang ditugaskan untuk Anda.</p></div>';
      } else {
        rtWrap.innerHTML = rtAssigned.map(function(s){
          var qLabel = (s.questionsCount!=null) ? s.questionsCount : '-';
          return '<div class="session-item disabled">' +
            '<div><div class="session-title"><span class="material-icons" style="color:#7c3aed;">sports_esports</span>' +
              escapeHtmlS(s.name) +
              ' <span class="session-status" style="background:#ede9fe;color:#5b21b6;font-size:.65rem;padding:2px 6px;">Realtime</span>' +
            '</div>' +
            '<div class="session-meta">' +
              '<span><span class="material-icons">timer</span>' + (s.duration||60) + ' mnt</span>' +
              '<span><span class="material-icons">quiz</span>' + qLabel + ' soal</span>' +
            '</div>' +
            '<div style="font-size:.75rem;color:#7c3aed;margin-top:.25rem;font-weight:500;">' +
              'Sesi ini harus dimulai lewat kode Realtime dari guru. Tunggu instruksi di kelas!' +
            '</div></div>' +
            '<span class="session-status locked">Menunggu Kode</span></div>';
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

  console.log('✅ dashboard.js v2.10 loaded (PR sisa kesempatan tetap tampil + tombol Retry, tanpa grace)');
})();