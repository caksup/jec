/* #25 | /root/js/s/dashboard.js | v 2.1 | u 08/09/2026 • 12:20:00 | xu : ke-6 | note : #noteresponse
- FIX "Notifikasi & Sesi Perlu Dikerjakan tidak tampil": loadAllData() kini fetch SEMUA sesi
  (tanpa query boolean) lalu filter client-side, supaya sesi yang di-assign tetap muncul.
- renderHomeTab kini menampilkan sesi aktif (bukan hanya available), termasuk yang locked/expired.
- Tambah console.log debug untuk memudahkan troubleshooting.
- KODE LAINNYA 100% SAMA PERSIS dengan v2.0 milik Anda (tidak dipotong). */

(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }

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

  // ===== Load data bersama (dipakai lintas tab) =====
  async function loadAllData(){
    try {
      var set = await db.collection('settings').doc('global_settings').get();
      if (set.exists) {
        PS.settings.antiCheatEnabled = set.data().antiCheatEnabled !== false;
        PS.settings.maxTabSwitches = set.data().maxTabSwitches || 3;
      }
    } catch(e){}

    // Sessions: ambil SEMUA, filter client (hindari masalah query boolean)
    // PERUBAHAN v2.1: sebelumnya pakai where(visible==true).where(status==true) yang bisa
    // mengembalikan kosong jika field boolean tidak diset dengan benar.
    try {
      var snap = await db.collection('sessions').get();
      PS.sessions = [];
      snap.forEach(function(d){
        var s = Object.assign({id:d.id},d.data());
        // Sertakan sesi yang status & visible tidak diset false (default = aktif)
        if (s.status !== false && s.visible !== false) PS.sessions.push(s);
      });
      console.log('[PS] sessions loaded:', PS.sessions.length, PS.sessions.map(function(s){return s.name;}));
    } catch(e){ console.error('[PS] load sessions error:', e); }

    // Attempts milik siswa
    try {
      var attSnap = await db.collection('attempts')
        .where('studentId','==',PS.user.id).get();
      PS.myAttempts = [];
      attSnap.forEach(function(d){
        PS.myAttempts.push(Object.assign({id:d.id}, d.data()));
      });
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

  function openStart(sess){
    var tries = 0;
    (function attempt(){
      if (window.startSession) {
        window.startSession(sess.id, computeStatus(sess));
      } else if (tries++ < 15) {
        setTimeout(attempt, 200);
      } else {
        console.error('[Exercise TKA] startSession tidak tersedia');
      }
    })();
  }

  async function handleSessionParam(){
    var code = null;
    try { code = new URLSearchParams(location.search).get('jec-sim-tka'); } catch(e){}
    if (!code) return;
    console.log('[Exercise TKA] param kode:', code);

    var sess = PS.sessions.find(function(s){ return (s.code||'').toLowerCase() === code.toLowerCase(); });
    if (!sess) { toast('Kode sesi tidak ditemukan','warning'); return; }
    console.log('[Exercise TKA] sesi ditemukan:', sess.id, sess.name);

    var done = PS.myAttempts.find(function(a){ return a.sessionId===sess.id && a.status==='completed'; });
    if (done && window.showResultFromAttempt) { showResultFromAttempt(done.id); return; }

    try {
      var inc = await db.collection('attempts')
        .where('studentId','==',PS.user.id).where('sessionId','==',sess.id).where('status','==','in_progress').get();
      if (!inc.empty && window.autoResume) { window.autoResume(sess.id); return; }
    } catch(e){ console.warn('[Exercise TKA] cek in_progress gagal:', e); }

    try { openStart(sess); } catch(e){ console.error('[Exercise TKA] openStart error:', e); }
  }

  // ===== Init dashboard lama (kompatibilitas) =====
  async function loadDashboard(){
    var pN = $('pName'); if(pN) pN.textContent = PS.user.name;
    var pI = $('pId');   if(pI) pI.textContent = PS.user.id;
    var pB = $('pBatch'); if(pB) pB.textContent = 'Batch ' + (PS.user.batch||'-') + ' | Tahun ' + (PS.user.year||'-');

    await loadAllData();
    await handleSessionParam();
    // Default ke tab home
    if (window.PS && typeof PS.setTab === 'function') PS.setTab('home');
  }

  // ===== TAB HOME: Overview + Notifikasi + List sesi =====
  async function renderHomeTab(){
    if (!PS.sessions || !PS.sessions.length || !PS.myAttempts) {
      await loadAllData();
    }

    var now = new Date();

    // ===== 1. OVERVIEW: 3 grid mini =====
    var sesiDikerjakan = PS.myAttempts.length; // total attempt (inklusif in_progress)
    var soalDikerjakan = 0;
    var totalScore = 0;
    var countCompleted = 0;
    PS.myAttempts.forEach(function(a){
      soalDikerjakan += (a.progress || 0) + (a.status==='completed' ? (a.totalQuestions - (a.progress||0)) : 0);
      if (a.status === 'completed') {
        totalScore += (a.score || 0);
        countCompleted++;
      }
    });
    // Lebih akurat: jumlah soal di semua attempt
    var soalDikerjakanAcc = 0;
    PS.myAttempts.forEach(function(a){
      if (a.status === 'completed') soalDikerjakanAcc += (a.totalQuestions || 0);
      else if (a.progress) soalDikerjakanAcc += a.progress;
    });
    soalDikerjakan = soalDikerjakanAcc;
    var avgNilai = countCompleted ? Math.round(totalScore / countCompleted) : 0;

    var ov = $('homeOverview');
    if (ov) {
      ov.innerHTML =
        '<div class="mini-grid">' +
          '<div class="mini-card mini-card-primary">' +
            '<div class="mini-icon"><span class="material-icons">event_available</span></div>' +
            '<div class="mini-label">Sesi Dikerjakan</div>' +
            '<div class="mini-value">' + sesiDikerjakan + '</div>' +
          '</div>' +
          '<div class="mini-card mini-card-success">' +
            '<div class="mini-icon"><span class="material-icons">quiz</span></div>' +
            '<div class="mini-label">Soal Dikerjakan</div>' +
            '<div class="mini-value">' + soalDikerjakan + '</div>' +
          '</div>' +
          '<div class="mini-card mini-card-warning">' +
            '<div class="mini-icon"><span class="material-icons">emoji_events</span></div>' +
            '<div class="mini-label">Rata-rata Nilai</div>' +
            '<div class="mini-value">' + avgNilai + '</div>' +
          '</div>' +
        '</div>';
    }

    // ===== 2. NOTIFIKASI SESI BELUM DIKERJAKAN =====
    // PERUBAHAN v2.1: tampilkan semua sesi aktif yang BELUM ada attempt,
    // tidak hanya yang status='available' (jadi sesi locked pun tampil sbg notifikasi).
    var notif = $('homeNotif');
    if (notif) {
      var belum = [];
      PS.sessions.forEach(function(s){
        var att = PS.myAttempts.find(function(a){ return a.sessionId === s.id; });
        if (!att) {
          var status = computeStatus(s);
          belum.push({ s:s, status:status });
        }
      });

      if (belum.length === 0) {
        notif.innerHTML =
          '<div class="empty-state" style="padding:1.5rem;">' +
            '<span class="material-icons">check_circle</span>' +
            '<p>Semua sesi Exercise TKA sudah dikerjakan. Pertahankan!</p>' +
          '</div>';
      } else {
        notif.innerHTML =
          '<div class="notif-header">' +
            '<span class="material-icons">notifications_active</span>' +
            '<strong>Sesi Belum Dikerjakan (' + belum.length + ')</strong>' +
          '</div>' +
          '<div class="notif-list">' + belum.map(function(item){
            var s = item.s;
            var last = '-';
            if (s.startTime) last = formatDate(s.startTime);
            var btnDisabled = (item.status === 'locked' || item.status === 'expired') ? ' disabled style="opacity:.5;cursor:not-allowed;"' : '';
            var btnLabel = item.status === 'locked' ? 'Belum Mulai' : (item.status === 'expired' ? 'Selesai' : 'Mulai');
            return '<div class="notif-item">' +
              '<div class="notif-main">' +
                '<div class="notif-title">' + escapeHtmlS(s.name) + '</div>' +
                '<div class="notif-meta">' +
                  '<span><span class="material-icons">schedule</span>Mulai: ' + last + '</span>' +
                  '<span><span class="material-icons">timer</span>' + (s.duration||60) + ' mnt</span>' +
                '</div>' +
              '</div>' +
              '<button class="btn btn-primary btn-sm" onclick="startSession(\'' + s.id + '\',\'' + item.status + '\')"' + btnDisabled + '>' +
                '<span class="material-icons">play_arrow</span>' + btnLabel +
              '</button>' +
            '</div>';
          }).join('') + '</div>';
      }
    }

    // ===== 3. LIST SESI PERLU DIKERJAKAN =====
    // PERUBAHAN v2.1: tampilkan semua sesi aktif yang BELUM completed,
    // termasuk yang locked/expired (sebagai info), supaya sesi yang di-assign pasti muncul.
    var list = $('homeSesiList');
    if (list) {
      var perlu = [];
      PS.sessions.forEach(function(s){
        var status = computeStatus(s);
        var att = PS.myAttempts.find(function(a){ return a.sessionId === s.id; });
        var label = 'Mulai', sub = 'Belum dikerjakan';
        var disabled = false;
        if (att && att.status === 'in_progress') {
          label = 'Lanjutkan';
          sub = 'Progress: ' + (att.progress||0) + '/' + (att.totalQuestions||0);
        } else if (att && att.status === 'completed') {
          return; // sudah selesai, skip
        } else if (status === 'locked') {
          label = 'Belum Mulai';
          sub = 'Sesi belum dibuka';
          disabled = true;
        } else if (status === 'expired') {
          label = 'Selesai';
          sub = 'Waktu sesi telah berakhir';
          disabled = true;
        }
        perlu.push({ s:s, label:label, sub:sub, status:status, disabled:disabled });
      });

      if (perlu.length === 0) {
        list.innerHTML =
          '<div class="empty-state" style="padding:1.5rem;">' +
            '<span class="material-icons">event_busy</span>' +
            '<p>Tidak ada sesi yang perlu dikerjakan saat ini</p>' +
          '</div>';
      } else {
        list.innerHTML = perlu.map(function(item){
          var s = item.s;
          var att = PS.myAttempts.find(function(a){ return a.sessionId === s.id; });
          var cls = att && att.status==='in_progress' ? 'session-item resume' : 'session-item';
          if (item.disabled) cls += ' disabled';
          var stcls = item.status === 'available' ? 'available' : (item.status === 'locked' ? 'locked' : 'expired');
          if (item.label === 'Lanjutkan') stcls = 'completed';
          return '<div class="' + cls + '" onclick="startSession(\'' + s.id + '\',\'' + item.status + '\')">' +
            '<div>' +
              '<div class="session-title"><span class="material-icons">event_available</span>' + escapeHtmlS(s.name) + '</div>' +
              '<div class="session-meta">' +
                '<span><span class="material-icons">timer</span>' + (s.duration||60) + ' mnt</span>' +
                '<span><span class="material-icons">quiz</span>' + (s.questionsCount||'-') + ' soal</span>' +
              '</div>' +
              '<div style="font-size:.75rem;color:#64748b;margin-top:.25rem;">' + item.sub + '</div>' +
            '</div>' +
            '<span class="session-status ' + stcls + '">' + item.label + '</span>' +
          '</div>';
        }).join('');
      }
    }
  }

  // ===== loadSessions & loadMyResults (dipakai tab Nilai & backward compat) =====
  async function loadSessions(){
    if (!PS.sessions || !PS.sessions.length) await loadAllData();
  }

  async function loadMyResults(){
    if (!PS.myAttempts) await loadAllData();
  }

  function escapeHtmlS(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.loadDashboard = loadDashboard;
  window.loadSessions = loadSessions;
  window.loadMyResults = loadMyResults;
  window.renderHomeTab = renderHomeTab;
  window.loadAllData = loadAllData;
})();