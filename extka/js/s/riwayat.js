/* #37 | /root/js/s/riwayat.js | v 1.1 | u 08/09/2026 • 12:30:00 | xu : ke-2 | note : #noteresponse
- FIX riwayat kosong walau sesi selesai: kini fetch attempts LANGSUNG dari Firestore
  (tidak bergantung PS.myAttempts yang mungkin belum terisi / kosong).
- Fetch sessions langsung pula bila kosong (untuk nama sesi).
- Tambah console.log jumlah item agar mudah debug.
- Tetap: list completed + in_progress, klik completed -> review, klik in_progress -> resume. */

(function(){
  'use strict';

  function escR(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function fmtDur(sec){
    if (!sec && sec !== 0) return '-';
    sec = Math.floor(sec);
    var m = Math.floor(sec/60), s = sec%60;
    var p = function(n){ return String(n).padStart(2,'0'); };
    return p(m) + ':' + p(s);
  }
  function fmtDate(ts){
    if (!ts) return '-';
    var d;
    try { d = ts.toDate ? ts.toDate() : new Date(ts); } catch(e){ return '-'; }
    var p = function(n){ return String(n).padStart(2,'0'); };
    return p(d.getDate()) + '/' + p(d.getMonth()+1) + '/' + d.getFullYear() +
           ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function tsValue(ts){
    if (!ts) return 0;
    try { return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime(); } catch(e){ return 0; }
  }

  // Fetch attempts LANGSUNG (tidak bergantung PS.myAttempts)
  async function fetchAttempts(){
    var items = [];
    try {
      var snap = await db.collection('attempts').where('studentId','==',PS.user.id).get();
      snap.forEach(function(d){ items.push(Object.assign({id:d.id}, d.data())); });
    } catch(e){ console.error('[PS] riwayat fetch attempts error:', e); }
    console.log('[PS] riwayat attempts:', items.length);
    return items;
  }

  // Pastikan sessions ada untuk nama
  async function ensureSessions(){
    if (PS.sessions && PS.sessions.length) return;
    try {
      var snap = await db.collection('sessions').get();
      PS.sessions = [];
      snap.forEach(function(d){
        var s = Object.assign({id:d.id}, d.data());
        if (s.status !== false && s.visible !== false) PS.sessions.push(s);
      });
    } catch(e){}
  }

  async function renderRiwayatTab(){
    var wrap = document.getElementById('riwayatList');
    if (!wrap) { console.warn('[PS] #riwayatList tidak ditemukan'); return; }

    var items = await fetchAttempts();
    await ensureSessions();

    // Sync ke PS.myAttempts agar tab Nilai konsisten
    PS.myAttempts = items;

    // Sort: in_progress dulu, lalu completed desc by tanggal
    items.sort(function(a,b){
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      return tsValue(b.finishedAt||b.startedAt) - tsValue(a.finishedAt||a.startedAt);
    });

    if (items.length === 0) {
      wrap.innerHTML =
        '<div class="empty-state" style="padding:2rem;">' +
          '<span class="material-icons">history</span>' +
          '<p>Belum ada riwayat pengerjaan.</p>' +
        '</div>';
      return;
    }

    var html = items.map(function(a){
      var sess = PS.sessions.find(function(s){ return s.id === a.sessionId; });
      var nama = sess ? sess.name : (a.sessionId || '-');
      var badge = '', meta = '', action = '';

      if (a.status === 'in_progress') {
        badge = '<span class="badge" style="background:#fef3c7;color:#92400e;">Berjalan</span>';
        meta = '<span><span class="material-icons">tune</span>Progress: ' + (a.progress||0) + '/' + (a.totalQuestions||0) + '</span>' +
               '<span><span class="material-icons">timer</span>Sisa: ' + fmtDur(a.remaining) + '</span>' +
               '<span><span class="material-icons">calendar_today</span>' + fmtDate(a.startedAt) + '</span>';
        action = 'onclick="resumeRiwayat(\'' + a.sessionId + '\')"';
      } else {
        var score = a.score || 0;
        var color = score >= 80 ? '#10b981' : (score < 50 ? '#ef4444' : '#2563eb');
        badge = '<span class="badge" style="background:' + color + ';color:#fff;">Selesai</span>';
        meta = '<span><span class="material-icons">emoji_events</span>Nilai: <b>' + score + '</b></span>' +
               '<span><span class="material-icons">check_circle</span>' + (a.correctAnswers||0) + '/' + (a.totalQuestions||0) + '</span>' +
               '<span><span class="material-icons">hourglass_bottom</span>' + fmtDur(a.totalTime) + '</span>' +
               '<span><span class="material-icons">calendar_today</span>' + fmtDate(a.finishedAt||a.startedAt) + '</span>';
        action = 'onclick="showResultFromAttempt(\'' + a.id + '\')"';
      }

      return '<div class="riwayat-item" ' + action + ' style="cursor:pointer;">' +
        '<div class="riwayat-main">' +
          '<div class="riwayat-title">' +
            '<span class="material-icons" style="color:#2563eb;font-size:18px;">event_available</span>' +
            escR(nama) + ' ' + badge +
          '</div>' +
          '<div class="riwayat-meta">' + meta + '</div>' +
        '</div>' +
        '<span class="material-icons" style="color:#94a3b8;">chevron_right</span>' +
      '</div>';
    }).join('');

    wrap.innerHTML = html;
  }

  window.resumeRiwayat = function(sid){
    if (window.autoResume) window.autoResume(sid);
    else toast('Gagal melanjutkan sesi', 'error');
  };

  window.renderRiwayatTab = renderRiwayatTab;
})();