/* s#14 | /root/js/s/realtime.js | v 1.6 | u 18/09/2026 • 03:15:00 | xu : ke-7 | note : #noteresponse
- v1.5 (baseline user) -> v1.6 (FIX poin 2: validasi JEC-xxx + input kode manual):
  * UPDATE #1: isValidJoinCode() sekarang menerima 3 format kode:
    - JEC-xxx (3 digit angka urut, contoh: JEC-001, JEC-042) ← BARU
    - JEC-RTxxx (8 karakter, contoh: JEC-RT001)              ← lama
    - 6 char legacy (contoh: JEC7K9)                        ← lama
    Regex ditambahkan: /^JEC-\d{3,}$/i
  * UPDATE #2: TAMBAH window.rtOpenJoin() — buka layar input kode manual
    dari luar (?jec-rt). Dipanggil oleh dashboard.js v2.11 saat siswa klik
    "Punya Kode?" di kartu Realtime yang belum ada room aktif.
    - showRealtimePage() + showScreen('rtJoinScreen')
    - Fokus input kode (code input)
    - Kosongkan field kalau user baru buka manual (bukan dari URL)
  * UPDATE #3: pesan error di rtJoinLobby() disesuaikan ke
    "Format: JEC-001 (atau JEC-RTxxx)" agar siswa tahu format baru.
  * UPDATE #4: bila input manual + user belum login, tampilkan login dulu
    (sama seperti flow URL), lalu auto-join setelah login sukses.
  * TETAP IDENTIK dari v1.5:
    - Auto-detect ?jec-rt + login wajib (PS.user)
    - 3 onSnapshot + watchdog 2 dtk + poin normal
    - Floating vocab parts of speech di lobby (30+ vocab)
    - Refresh koneksi di lobby & playing (UPDATE #2 v1.5)
    - Radar online/offline indicator (UPDATE #5 v1.5)
    - Feedback jawaban + pembahasan + leaderboard live
    - Rejoin via localStorage
- EXPOSE: window.rtJoinLobby, window.rtSubmitAnswer, window.rtBackToHome,
  window.rtSelectOption, window.rtToggleMCMA, window.rtTogglePGK,
  window.rtUpdateIsian, window.rtRefreshConnection, window.rtOpenJoin. */

(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function getParam(key){
    try { return new URL(window.location.href).searchParams.get(key); }
    catch(e){ return null; }
  }

  function normCode(v){ return String(v || '').trim().toUpperCase(); }
  function safeId(v){ return String(v || '').replace(/[^a-zA-Z0-9_-]/g,'_'); }
  function nowMs(){ return Date.now(); }

  function toastSafe(msg,type){
    if (typeof toast === 'function') toast(msg, type || 'info');
    else console.log('[rt]', type || 'info', msg);
  }

  function alertSafe(title,msg,type){
    if (typeof alert2 === 'function') alert2(title,msg,type || 'info');
    else alert(title + '\n\n' + String(msg).replace(/<[^>]+>/g,''));
  }

  function loadSafe(msg){
    if (typeof loading === 'function') return loading(msg);
    return { close: function(){} };
  }

  // ============================================
  // VALIDASI KODE JOIN (UPDATE #1: + JEC-xxx)
  // ============================================
  function isValidJoinCode(code){
    if (!code) return false;
    // BARU: JEC-001, JEC-042, ... (minimal 3 digit)
    if (/^JEC-\d{3,}$/i.test(code)) return true;
    // Lama: JEC-RT001
    if (/^JEC-RT\d{3,}$/i.test(code)) return true;
    // Legacy: 6 char alfanumerik
    if (/^[A-Z0-9]{6}$/.test(code)) return true;
    return false;
  }

  // ============================================
  // KOSAKATA PARTS OF SPEECH (melayang di lobby)
  // ============================================
  var RT_VOCAB = [
    { en:'book', id:'buku', pos:'noun' },
    { en:'student', id:'siswa', pos:'noun' },
    { en:'teacher', id:'guru', pos:'noun' },
    { en:'knowledge', id:'pengetahuan', pos:'noun' },
    { en:'happiness', id:'kebahagiaan', pos:'noun' },
    { en:'journey', id:'perjalanan', pos:'noun' },
    { en:'run', id:'berlari', pos:'verb' },
    { en:'study', id:'belajar', pos:'verb' },
    { en:'achieve', id:'mencapai', pos:'verb' },
    { en:'discover', id:'menemukan', pos:'verb' },
    { en:'understand', id:'memahami', pos:'verb' },
    { en:'create', id:'menciptakan', pos:'verb' },
    { en:'beautiful', id:'cantik', pos:'adj' },
    { en:'brilliant', id:'cemerlang', pos:'adj' },
    { en:'curious', id:'penasaran', pos:'adj' },
    { en:'diligent', id:'rajin', pos:'adj' },
    { en:'honest', id:'jujur', pos:'adj' },
    { en:'intelligent', id:'cerdas', pos:'adj' },
    { en:'quickly', id:'dengan cepat', pos:'adv' },
    { en:'carefully', id:'dengan hati-hati', pos:'adv' },
    { en:'happily', id:'dengan bahagia', pos:'adv' },
    { en:'wisely', id:'dengan bijak', pos:'adv' },
    { en:'patiently', id:'dengan sabar', pos:'adv' },
    { en:'between', id:'di antara', pos:'prep' },
    { en:'although', id:'meskipun', pos:'conj' },
    { en:'however', id:'namun', pos:'conj' },
    { en:'therefore', id:'oleh karena itu', pos:'conj' },
    { en:'break the ice', id:'memulai percakapan', pos:'idiom' },
    { en:'piece of cake', id:'sangat mudah', pos:'idiom' },
    { en:'hit the books', id:'belajar giat', pos:'idiom' }
  ];

  function injectRtStyles(){
    if (document.getElementById('rt-style-v15')) return;
    var old = document.getElementById('rt-style-v14');
    if (old) old.remove();

    var st = document.createElement('style');
    st.id = 'rt-style-v15';
    st.textContent = [
      '.rt-page{background:#f6f8fb;}',
      '.rt-container{max-width:560px;margin:0 auto;padding:.875rem .875rem 3rem;}',
      '.rt-hero{border-radius:16px;padding:1.125rem 1rem;margin-bottom:.875rem;text-align:center;',
      '  background:linear-gradient(135deg,#6d28d9 0%,#4c1d95 100%);color:#fff;',
      '  box-shadow:0 6px 18px rgba(76,29,149,.25);}',
      '.rt-hero h1{font-size:1.0625rem;font-weight:700;margin:.25rem 0 .125rem;}',
      '.rt-hero p{font-size:.8125rem;opacity:.85;margin:0;}',
      '.rt-hero .rt-code{font-size:1.625rem;font-weight:800;font-family:monospace;letter-spacing:.18em;',
      '  margin:.625rem auto .25rem;background:rgba(255,255,255,.14);padding:.375rem .875rem;',
      '  border-radius:10px;display:inline-block;}',
      '.rt-card{background:#fff;border:1px solid #e6eaf0;border-radius:14px;padding:.875rem;',
      '  margin-bottom:.75rem;box-shadow:0 1px 3px rgba(16,24,40,.05);}',
      '.rt-player-chip{display:flex;align-items:center;gap:.5rem;padding:.4375rem .625rem;',
      '  background:#f8fafc;border:1px solid #eef2f6;border-radius:8px;font-size:.8125rem;color:#334155;margin-bottom:.3125rem;}',
      '.rt-player-chip .material-icons{font-size:15px;color:#94a3b8;}',
      '#rtPlayingScreen .rt-hero{position:sticky;top:0;z-index:20;border-radius:0 0 14px 14px;',
      '  padding:.625rem .875rem;margin:-0.875rem -0.875rem .875rem;display:flex;align-items:center;',
      '  justify-content:space-between;gap:.625rem;text-align:left;}',
      '#rtPlayingScreen .rt-hero .rt-timer-big{font-size:1.375rem;margin:0;font-weight:800;color:#fff;}',
      '#rtPlayingScreen .rt-hero .rt-timer-big.urgent{color:#fecaca;}',
      '.rt-qmeta{font-size:.75rem;opacity:.9;}',
      '.rt-option{padding:.8125rem .875rem;background:#fff;border:1.5px solid #e6eaf0;border-radius:12px;',
      '  margin-bottom:.5rem;cursor:pointer;font-size:.9375rem;line-height:1.45;',
      '  transition:border-color .12s, background .12s;}',
      '.rt-option:active{transform:scale(.995);}',
      '.rt-option.selected{border-color:#6d28d9;background:#f5f3ff;font-weight:600;}',
      '.rt-option .opt-letter{display:inline-flex;align-items:center;justify-content:center;',
      '  width:1.375rem;height:1.375rem;border-radius:8px;background:#f1f5f9;color:#475569;',
      '  font-weight:700;font-size:.8125rem;margin-right:.5rem;flex:0 0 auto;}',
      '.rt-option.selected .opt-letter{background:#6d28d9;color:#fff;}',
      '#rtAnswerFeedback{border-radius:12px;padding:.75rem .875rem;}',
      '.rt-leaderboard-row{display:flex;align-items:center;gap:.5rem;padding:.4375rem .5rem;',
      '  border-bottom:1px solid #f1f5f9;font-size:.8125rem;}',
      '.rt-leaderboard-row:last-child{border-bottom:none;}',
      '.rt-leaderboard-row.me{background:#fffbeb;border-radius:8px;}',
      '.rt-leaderboard-row .rt-rank{width:1.75rem;text-align:center;font-weight:700;color:#6d28d9;flex:0 0 auto;}',
      '.rt-leaderboard-row .rt-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.rt-leaderboard-row .rt-score{font-weight:700;color:#047857;flex:0 0 auto;}',
      '#rtSubmitArea .btn{border-radius:12px;}',
      '.rt-online-radar{display:inline-block;width:10px;height:10px;background:#10b981;',
      '  border-radius:50%;margin-right:.375rem;vertical-align:middle;',
      '  animation:rtRadarPulse 2s ease-in-out infinite;}',
      '.rt-online-radar.offline{background:#ef4444;animation:none;}',
      '@keyframes rtRadarPulse{',
      '  0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.7);}',
      '  50%{box-shadow:0 0 0 6px rgba(16,185,129,0);}',
      '}',
      '.rt-vocab-bg{position:fixed;top:0;left:0;width:100%;height:100%;overflow:hidden;',
      '  pointer-events:none;z-index:0;}',
      '.rt-vocab-item{position:absolute;top:-40px;font-weight:600;font-size:.9375rem;',
      '  color:#a78bfa;opacity:.45;white-space:nowrap;',
      '  animation:rtVocabFloat var(--rt-dur, 22s) linear var(--rt-delay, 0s) infinite;',
      '  text-shadow:0 1px 3px rgba(255,255,255,.8);}',
      '.rt-vocab-item .rt-pos{font-size:.625rem;font-weight:700;color:#fff;',
      '  background:#8b5cf6;padding:1px 5px;border-radius:50px;margin-left:.25rem;',
      '  text-transform:uppercase;letter-spacing:.03em;}',
      '@keyframes rtVocabFloat{',
      '  0%{transform:translateY(-10vh) rotate(-3deg);opacity:0;}',
      '  10%{opacity:.6;}',
      '  90%{opacity:.6;}',
      '  100%{transform:translateY(105vh) rotate(3deg);opacity:0;}',
      '}',
      '.rt-head-actions{display:flex;gap:.375rem;align-items:center;}',
      '.rt-head-btn{background:rgba(255,255,255,.18);border:none;color:#fff;',
      '  padding:.375rem;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;',
      '  transition:background .15s;}',
      '.rt-head-btn:hover{background:rgba(255,255,255,.3);}',
      '.rt-head-btn .material-icons{font-size:18px;}',
      '@media (max-width:400px){',
      '  .rt-container{padding:.625rem .625rem 3rem;}',
      '  #rtPlayingScreen .rt-hero{margin:-0.625rem -0.625rem .75rem;}',
      '  .rt-option{font-size:.875rem;padding:.75rem;}',
      '  .rt-vocab-item{font-size:.8125rem;}',
      '}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function showScreen(screenId){
    ['rtJoinScreen','rtLobbyScreen','rtPlayingScreen','rtFinishedScreen'].forEach(function(id){
      var el = $(id);
      if (el) el.style.display = (id === screenId) ? 'block' : 'none';
    });
    toggleVocabBg(screenId === 'rtLobbyScreen');
  }

  function setJoinError(msg){
    var el = $('rtJoinError');
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
  }

  function showRealtimePage(){
    var rtPage = $('realtimePage');
    if (rtPage) rtPage.classList.add('active');
    ['loginScreen','studentApp','testPage','resultPage'].forEach(function(id){
      var el = $(id); if (el) el.style.display = 'none';
    });
  }

  function showLoginForRealtime(){
    var rtPage = $('realtimePage');
    if (rtPage) rtPage.classList.remove('active');
    var loginScreen = $('loginScreen');
    if (loginScreen) loginScreen.style.display = 'flex';
    ['studentApp','testPage','resultPage'].forEach(function(id){
      var el = $(id); if (el) el.style.display = 'none';
    });
    var err = $('loginErr');
    if (err) { err.style.display = 'block'; err.textContent = 'Login dulu untuk masuk Realtime Exercise.'; }
  }

  function hideManualNameInput(){
    var nameInput = $('rtNameInput');
    if (!nameInput) return;
    var fg = nameInput.closest ? nameInput.closest('.form-group') : null;
    if (fg) fg.style.display = 'none';
    var codeInput = $('rtCodeInput');
    if (codeInput) { codeInput.readOnly = true; codeInput.style.opacity = '.85'; }
  }

  function showManualNameInput(){
    var nameInput = $('rtNameInput');
    if (!nameInput) return;
    var fg = nameInput.closest ? nameInput.closest('.form-group') : null;
    if (fg) fg.style.display = 'block';
    var codeInput = $('rtCodeInput');
    if (codeInput) { codeInput.readOnly = false; codeInput.style.opacity = '1'; }
  }

  function updateJoinIdentityText(){
    var btn = document.querySelector('#rtJoinScreen button[onclick*="rtJoinLobby"]');
    if (btn && window.PS && PS.user) {
      btn.innerHTML = '<span class="material-icons">login</span>Masuk sebagai ' + esc(PS.user.name || PS.user.id);
    }
  }

  function storageKey(code, studentId){
    return 'rt_join_' + normCode(code) + '_' + safeId(studentId);
  }

  // ============================================
  // FLOATING VOCAB BACKGROUND
  // ============================================
  function toggleVocabBg(show){
    var existing = $('rtVocabBg');
    if (show && !existing) {
      var bg = document.createElement('div');
      bg.id = 'rtVocabBg';
      bg.className = 'rt-vocab-bg';
      document.body.appendChild(bg);
      spawnVocabItems();
    } else if (!show && existing) {
      existing.remove();
    }
  }

  function spawnVocabItems(){
    var bg = $('rtVocabBg');
    if (!bg) return;
    bg.innerHTML = '';
    var pool = RT_VOCAB.slice().sort(function(){ return Math.random()-0.5; });
    var shown = pool.slice(0, Math.min(14, pool.length));
    shown.forEach(function(v, i){
      var el = document.createElement('div');
      el.className = 'rt-vocab-item';
      var dur = 18 + Math.random()*12;
      var delay = i * 1.8 + Math.random()*2;
      el.style.setProperty('--rt-dur', dur + 's');
      el.style.setProperty('--rt-delay', delay + 's');
      el.style.left = (5 + Math.random()*90) + '%';
      el.innerHTML = esc(v.en) + ' <span style="color:#6d28d9;">:</span> ' +
        esc(v.id) + '<span class="rt-pos">'+esc(v.pos)+'</span>';
      bg.appendChild(el);
    });

    if (window.__rtVocabTimer) clearInterval(window.__rtVocabTimer);
    window.__rtVocabTimer = setInterval(function(){
      if (!$('rtVocabBg')) { clearInterval(window.__rtVocabTimer); return; }
      var pool2 = RT_VOCAB.slice().sort(function(){ return Math.random()-0.5; });
      var addCount = 2 + Math.floor(Math.random()*2);
      for (var k=0; k<addCount; k++){
        var v = pool2[k % pool2.length];
        var el = document.createElement('div');
        el.className = 'rt-vocab-item';
        var dur = 18 + Math.random()*12;
        el.style.setProperty('--rt-dur', dur + 's');
        el.style.setProperty('--rt-delay', '0s');
        el.style.left = (5 + Math.random()*90) + '%';
        el.innerHTML = esc(v.en) + ' <span style="color:#6d28d9;">:</span> ' +
          esc(v.id) + '<span class="rt-pos">'+esc(v.pos)+'</span>';
        bg.appendChild(el);
      }
    }, 8000);
  }

  // ============================================
  // STATE
  // ============================================
  window.RT = window.RT || {};
  RT.roomCode = RT.roomCode || null;
  RT.roomId = RT.roomId || null;
  RT.playerId = RT.playerId || null;
  RT.playerName = RT.playerName || null;
  RT.unsubRoom = RT.unsubRoom || null;
  RT.unsubPlayers = RT.unsubPlayers || null;
  RT.unsubAnswers = RT.unsubAnswers || null;
  RT.tickTimer = RT.tickTimer || null;
  RT.watchTimer = RT.watchTimer || null;
  RT.room = RT.room || null;
  RT.players = RT.players || {};
  RT.answers = RT.answers || {};
  RT.questions = RT.questions || [];
  RT.questionsById = RT.questionsById || {};
  RT.questionsLoadedForSession = RT.questionsLoadedForSession || null;
  RT.currentQIndex = RT.currentQIndex == null ? -999 : RT.currentQIndex;
  RT.currentQId = RT.currentQId || null;
  RT.myAnswer = RT.myAnswer == null ? null : RT.myAnswer;
  RT.submitted = !!RT.submitted;
  RT.lastRenderedAnswerKey = RT.lastRenderedAnswerKey || '';
  RT.realtimeParamCode = null;
  RT.waitLoginTimer = null;
  RT.online = true;

  function rtIdx(){
    if (!RT.room) return -1;
    var v = RT.room.currentQuestionIndex;
    return (typeof v === 'number' && !isNaN(v)) ? v : -1;
  }

  function rtEndsAtMs(){
    try {
      var t = RT.room && RT.room.questionEndsAt;
      if (!t) return 0;
      return t.toDate ? t.toDate().getTime() : new Date(t).getTime();
    } catch(e){ return 0; }
  }

  function rtDurationSec(){ return (RT.room && (RT.room.questionDurationSec || RT.room.questionDuration)) || 30; }

  function normalPoints(correct, remainingMs){
    if (!correct) return 0;
    var dur = rtDurationSec() * 1000;
    var bonus = Math.round(5 * Math.max(0, remainingMs) / Math.max(1, dur));
    return 10 + bonus;
  }

  // ============================================
  // INIT URL ?jec-rt
  // ============================================
  function initRealtimeFromUrl(){
    injectRtStyles();
    var code = normCode(getParam('jec-rt'));
    if (!code) return;

    RT.realtimeParamCode = code;
    RT.roomCode = code;

    var codeInput = $('rtCodeInput');
    if (codeInput) codeInput.value = code;

    hideManualNameInput();

    if (!window.PS || !PS.user || !PS.user.id) {
      showLoginForRealtime();
      waitLoginThenJoin(code);
      return;
    }
    beginRealtimeForLoggedUser(code);
  }

  function waitLoginThenJoin(code){
    if (RT.waitLoginTimer) clearInterval(RT.waitLoginTimer);
    var tries = 0;
    RT.waitLoginTimer = setInterval(function(){
      tries++;
      if (window.PS && PS.user && PS.user.id) {
        clearInterval(RT.waitLoginTimer);
        RT.waitLoginTimer = null;
        beginRealtimeForLoggedUser(code);
        return;
      }
      if (tries > 600) { clearInterval(RT.waitLoginTimer); RT.waitLoginTimer = null; }
    }, 500);
  }

  function beginRealtimeForLoggedUser(code){
    showRealtimePage();
    showScreen('rtJoinScreen');
    hideManualNameInput();
    updateJoinIdentityText();
    var codeInput = $('rtCodeInput');
    if (codeInput) codeInput.value = code;
    setTimeout(function(){ rtJoinLobby(); }, 250);
  }

  // ============================================
  // UPDATE #2: input kode manual dari luar (dashboard)
  // ============================================
  window.rtOpenJoin = function(){
    injectRtStyles();
    RT.realtimeParamCode = null;
    RT.roomCode = null;

    showRealtimePage();
    showScreen('rtJoinScreen');
    showManualNameInput();

    var codeInput = $('rtCodeInput');
    if (codeInput) {
      codeInput.value = '';
      codeInput.readOnly = false;
      codeInput.style.opacity = '1';
      setTimeout(function(){ codeInput.focus(); }, 100);
    }
    setJoinError('');
    updateJoinIdentityText();
  };

  // ============================================
  // JOIN
  // ============================================
  window.rtJoinLobby = async function(){
    setJoinError('');
    if (!window.PS || !PS.user || !PS.user.id) { showLoginForRealtime(); return; }

    var codeInput = $('rtCodeInput');
    var code = normCode((codeInput && codeInput.value) || RT.roomCode || RT.realtimeParamCode);

    // UPDATE #1: validasi menerima JEC-xxx, JEC-RTxxx, 6-char legacy
    if (!isValidJoinCode(code)) {
      setJoinError('Kode tidak valid. Format: JEC-001 (atau JEC-RTxxx / 6-char).');
      return;
    }

    var studentId = String(PS.user.id);
    var studentName = PS.user.name || PS.user.fullName || studentId;
    var playerId = safeId(studentId);

    try {
      var roomSnap = await db.collection('liveRooms')
        .where('code','==',code).where('status','in',['lobby','playing']).get();
      if (roomSnap.empty) { setJoinError('Kode tidak ditemukan / room belum aktif / sesi selesai.'); return; }

      var roomDoc = null;
      roomSnap.forEach(function(d){ if (!roomDoc) roomDoc = Object.assign({id:d.id}, d.data()); });
      if (!roomDoc || !roomDoc.id) { setJoinError('Room tidak valid.'); return; }

      RT.roomCode = code; RT.roomId = roomDoc.id; RT.room = roomDoc;
      RT.playerId = playerId; RT.playerName = studentName;

      try {
        if (roomDoc.sessionId) {
          var sessDoc = await db.collection('sessions').doc(roomDoc.sessionId).get();
          if (sessDoc.exists) {
            var arr = sessDoc.data().assignedStudents || [];
            if (arr.length && arr.indexOf(studentId) === -1) {
              setJoinError('Anda tidak terdaftar pada sesi realtime ini.');
              return;
            }
          }
        }
      } catch(e){}

      await db.collection('liveRooms').doc(roomDoc.id).collection('players').doc(playerId).set({
        studentId: studentId, name: studentName, loginName: studentName,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        totalScore: 0
      }, { merge:true });

      localStorage.setItem(storageKey(code, studentId), JSON.stringify({
        code: code, roomId: roomDoc.id, playerId: playerId,
        playerName: studentName, studentId: studentId
      }));

      showRealtimePage();
      rtSubscribe();

      if (roomDoc.status === 'playing') {
        showScreen('rtPlayingScreen');
        await rtRenderQuestion(true);
      } else {
        showScreen('rtLobbyScreen');
        rtRenderLobby();
      }
    } catch(e){
      console.error('[rt] join failed:', e);
      setJoinError('Gagal join: ' + e.message);
    }
  };

  // ============================================
  // SUBSCRIBE (dengan error handler untuk radar)
  // ============================================
  function resetAnswerState(){
    RT.myAnswer = null;
    RT.submitted = false;
    RT.currentQIndex = -999;
    RT.currentQId = null;
    RT.lastRenderedAnswerKey = '';
  }

  function rtSubscribe(){
    rtUnsubscribeAll();
    if (!RT.roomId) return;

    RT.unsubRoom = db.collection('liveRooms').doc(RT.roomId).onSnapshot(function(doc){
      RT.online = true;
      updateOnlineIndicator();
      if (!doc.exists) {
        alertSafe('Realtime Berakhir','Room tidak tersedia.','warning');
        rtBackToHome();
        return;
      }

      var prevIndex = rtIdx();
      var prevStatus = RT.room ? RT.room.status : null;
      var prevEndsAt = rtEndsAtMs();

      RT.room = Object.assign({id:doc.id}, doc.data());

      var newIndex = rtIdx();
      var newStatus = RT.room.status;
      var newEndsAt = rtEndsAtMs();

      if (newStatus === 'finished') {
        showRealtimePage(); showScreen('rtFinishedScreen'); rtRenderFinished();
        return;
      }
      if (newStatus === 'lobby') {
        showRealtimePage(); showScreen('rtLobbyScreen'); rtRenderLobby();
        return;
      }
      if (newStatus === 'playing') {
        showRealtimePage(); showScreen('rtPlayingScreen');

        var indexChanged = prevIndex !== newIndex;
        var statusChanged = prevStatus !== 'playing';
        var newTimerAfterSubmit = (RT.submitted && newEndsAt && newEndsAt !== prevEndsAt && newEndsAt > nowMs());

        if (indexChanged || statusChanged || newTimerAfterSubmit) {
          console.log('[rt] soal baru: idx', prevIndex, '->', newIndex);
          resetAnswerState();
          rtRenderQuestion(true);
        } else {
          rtRenderQuestion(false);
        }
      }
    }, function(err){
      console.error('[rt] room snapshot error:', err);
      RT.online = false;
      updateOnlineIndicator();
    });

    RT.unsubPlayers = db.collection('liveRooms').doc(RT.roomId).collection('players').onSnapshot(function(snap){
      RT.online = true;
      updateOnlineIndicator();
      RT.players = {};
      snap.forEach(function(d){ RT.players[d.id] = Object.assign({id:d.id}, d.data()); });
      rtRenderLobby();
    }, function(err){
      console.error('[rt] players snapshot error:', err);
      RT.online = false;
      updateOnlineIndicator();
    });

    RT.unsubAnswers = db.collection('liveRooms').doc(RT.roomId).collection('answers').onSnapshot(function(snap){
      RT.answers = {};
      snap.forEach(function(d){ RT.answers[d.id] = Object.assign({id:d.id}, d.data()); });
      rtRenderAnswerFeedback();
      rtRenderLeaderboard();
    }, function(err){
      console.error('[rt] answers snapshot error:', err);
    });

    rtStartTick();
    rtStartWatchdog();
  }

  function updateOnlineIndicator(){
    var radarEls = document.querySelectorAll('.rt-online-radar');
    radarEls.forEach(function(el){
      if (RT.online) el.classList.remove('offline');
      else el.classList.add('offline');
      el.title = RT.online ? 'Koneksi realtime aktif' : 'Koneksi terputus';
    });
  }

  function rtStartWatchdog(){
    if (RT.watchTimer) clearInterval(RT.watchTimer);
    RT.watchTimer = setInterval(function(){
      if (!RT.room || RT.room.status !== 'playing') return;
      var idx = rtIdx();
      if (idx >= 0 && idx !== RT.currentQIndex) {
        console.log('[rt] watchdog: drift terdeteksi, render ulang soal', idx);
        resetAnswerState();
        rtRenderQuestion(true);
      }
    }, 2000);
  }

  function rtUnsubscribeAll(){
    try { if (RT.unsubRoom) RT.unsubRoom(); } catch(e){}
    try { if (RT.unsubPlayers) RT.unsubPlayers(); } catch(e){}
    try { if (RT.unsubAnswers) RT.unsubAnswers(); } catch(e){}
    if (RT.tickTimer) clearInterval(RT.tickTimer);
    if (RT.watchTimer) clearInterval(RT.watchTimer);
    RT.unsubRoom = RT.unsubPlayers = RT.unsubAnswers = null;
    RT.tickTimer = null; RT.watchTimer = null;
  }

  // ============================================
  // QUESTIONS
  // ============================================
  async function rtEnsureQuestionsLoaded(){
    if (!RT.room || !RT.room.sessionId) return false;
    if (RT.questionsLoadedForSession === RT.room.sessionId && RT.questionsById && Object.keys(RT.questionsById).length) return true;
    try {
      var snap = await db.collection('questions').where('sessionId','==',RT.room.sessionId).get();
      var arr = [], map = {};
      snap.forEach(function(d){
        var q = Object.assign({id:d.id}, d.data());
        if (q.deleted === true) return;
        arr.push(q); map[q.id] = q;
      });
      if (RT.room.questionIds && RT.room.questionIds.length) {
        arr.sort(function(a,b){ return RT.room.questionIds.indexOf(a.id) - RT.room.questionIds.indexOf(b.id); });
      } else {
        arr.sort(function(a,b){ return (a.order||0) - (b.order||0); });
      }
      RT.questions = arr; RT.questionsById = map; RT.questionsLoadedForSession = RT.room.sessionId;
      return true;
    } catch(e){ console.error('[rt] load questions failed:', e); return false; }
  }

  function getCurrentQuestion(){
    if (!RT.room) return null;
    var idx = rtIdx();
    var qid = (RT.room.questionIds && idx >= 0) ? RT.room.questionIds[idx] : null;
    if (qid && RT.questionsById && RT.questionsById[qid]) return { index: idx, id: qid, data: RT.questionsById[qid] };
    if (RT.questions && RT.questions[idx]) return { index: idx, id: RT.questions[idx].id, data: RT.questions[idx] };
    return { index: idx, id: qid, data: null };
  }

  // ============================================
  // LOBBY
  // ============================================
  function rtRenderLobby(){
    if (!RT.room) return;

    var heroEl = $('rtLobbyHero');
    if (heroEl) {
      var radarClass = RT.online ? 'rt-online-radar' : 'rt-online-radar offline';
      heroEl.innerHTML =
        '<div class="rt-head-actions" style="justify-content:flex-end;width:100%;margin-bottom:.5rem;">' +
          '<button class="rt-head-btn" onclick="rtRefreshConnection()" title="Refresh koneksi">' +
            '<span class="material-icons">refresh</span></button>' +
        '</div>' +
        '<div style="font-size:.6875rem;text-transform:uppercase;letter-spacing:.1em;opacity:.8;">Kode Join</div>' +
        '<div class="rt-code" id="rtCodeDisplay">'+esc(RT.room.code||'------')+'</div>' +
        '<div style="font-size:.8125rem;margin-top:.25rem;">' +
          '<span class="'+radarClass+'" title="'+(RT.online?'Koneksi aktif':'Koneksi terputus')+'"></span>' +
          '<b>'+esc(RT.room.sessionName || 'Sesi Realtime')+'</b>' +
        '</div>' +
        '<p>Menunggu guru memulai soal...</p>';
    }

    var listEl = $('rtPlayerList');
    if (!listEl) return;

    var players = Object.keys(RT.players || {}).map(function(k){ return RT.players[k]; });
    if (!players.length) {
      listEl.innerHTML = '<div class="empty-state" style="padding:.5rem;"><p style="font-size:.8125rem;">Menunggu pemain lain...</p></div>';
      return;
    }
    listEl.innerHTML =
      '<div style="font-size:.75rem;color:#64748b;margin-bottom:.375rem;font-weight:600;">' +
        '<span class="material-icons" style="font-size:14px;vertical-align:-2px;">groups</span> '+players.length+' pemain di lobby' +
      '</div>' +
      players.map(function(p,i){
        var isMe = p.id === RT.playerId || p.studentId === (PS.user && PS.user.id);
        return '<div class="rt-player-chip" style="'+(isMe?'background:#fffbeb;border-color:#fde68a;':'')+'">' +
          '<span style="color:#94a3b8;width:1.125rem;text-align:right;font-size:.75rem;">'+(i+1)+'.</span>' +
          '<span class="material-icons">person</span>' +
          '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+esc(p.name||p.studentId||p.id)+'</span>' +
          (isMe ? '<span style="font-size:.6875rem;font-weight:700;color:#b45309;">Anda</span>' : '') +
        '</div>';
      }).join('');
  }

  // ============================================
  // PLAYING
  // ============================================
  async function rtRenderQuestion(force){
    if (!RT.room || RT.room.status !== 'playing') return;
    var ok = await rtEnsureQuestionsLoaded();
    if (!ok) return;

    var cur = getCurrentQuestion();
    if (!cur || cur.index == null || cur.index < 0) return;
    var q = cur.data;
    if (!q) {
      var te = $('rtQuestionText');
      if (te) te.textContent = 'Soal belum termuat. Menunggu sinkronisasi...';
      return;
    }

    var ansKey = RT.playerId + '_' + cur.index;
    var myAnsDoc = RT.answers ? RT.answers[ansKey] : null;
    var answerKey = myAnsDoc ? (ansKey + ':' + JSON.stringify(myAnsDoc.answer)) : 'no-answer';

    var shouldRender = force ||
      RT.currentQIndex !== cur.index ||
      RT.currentQId !== cur.id ||
      RT.lastRenderedAnswerKey !== answerKey;

    if (!shouldRender) {
      rtRenderCountdown();
      var sq = $('rtSubmitArea');
      if (sq) sq.style.display = (!RT.submitted && rtEndsAtMs() > nowMs()) ? 'block' : 'none';
      return;
    }

    RT.currentQIndex = cur.index;
    RT.currentQId = cur.id;
    RT.myAnswer = myAnsDoc ? myAnsDoc.answer : null;
    RT.submitted = !!myAnsDoc;
    RT.lastRenderedAnswerKey = answerKey;

    var total = (RT.room.questionIds && RT.room.questionIds.length) ? RT.room.questionIds.length : RT.questions.length;

    var heroEl = $('rtPlayingHero');
    if (heroEl) {
      var radarClass = RT.online ? 'rt-online-radar' : 'rt-online-radar offline';
      heroEl.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:.125rem;flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:.25rem;font-size:.75rem;opacity:.9;">' +
            '<span class="'+radarClass+'"></span>' +
            '<span>Soal <b id="rtQNum">'+(cur.index+1)+'</b> / <b id="rtQTotal">'+total+'</b></span>' +
          '</div>' +
          '<div id="rtTimerBig" class="rt-timer-big">--:--</div>' +
        '</div>' +
        '<div class="rt-head-actions">' +
          '<button class="rt-head-btn" onclick="rtRefreshConnection()" title="Refresh koneksi">' +
            '<span class="material-icons">refresh</span></button>' +
        '</div>';
    } else {
      var numEl = $('rtQNum'); if (numEl) numEl.textContent = cur.index + 1;
      var totalEl = $('rtQTotal'); if (totalEl) totalEl.textContent = total;
    }

    var labels = {PGS:'Pilihan Ganda',MCMA:'Pilihan Kompleks',PGK:'True/False',ISIAN:'Isian'};
    var typeEl = $('rtQuestionType');
    if (typeEl) typeEl.innerHTML = '<span class="rt-qmeta"><span class="question-type-badge '+esc(String(q.type||'').toLowerCase())+'">'+esc(labels[q.type]||q.type||'Soal')+'</span></span>';
    var textEl = $('rtQuestionText');
    if (textEl) textEl.innerHTML = esc(q.text || q.question || '');

    var optEl = $('rtOptions');
    if (optEl) optEl.innerHTML = buildOptionsHtml(q);

    var submitEl = $('rtSubmitArea');
    if (submitEl) submitEl.style.display = (!RT.submitted && rtEndsAtMs() > nowMs()) ? 'block' : 'none';

    rtRenderAnswerFeedback();
    rtRenderCountdown();
  }

  function letterSpan(l){ return '<span class="opt-letter">'+l+'</span>'; }

  function buildOptionsHtml(q){
    var html = '';
    var dis = RT.submitted ? ' style="opacity:.75;pointer-events:none;"' : '';

    if (q.type === 'PGS') {
      ['A','B','C','D','E'].forEach(function(l){
        if (!q.options || q.options[l] == null || q.options[l] === '') return;
        html += '<div class="rt-option'+(RT.myAnswer===l?' selected':'')+'" data-val="'+l+'" onclick="rtSelectOption(\''+l+'\')"'+dis+'>'+letterSpan(l)+esc(q.options[l])+'</div>';
      });
    } else if (q.type === 'MCMA') {
      var sel = Array.isArray(RT.myAnswer) ? RT.myAnswer : [];
      ['A','B','C','D','E'].forEach(function(l){
        if (!q.options || q.options[l] == null || q.options[l] === '') return;
        html += '<div class="rt-option'+(sel.indexOf(l)!==-1?' selected':'')+'" data-val="'+l+'" onclick="rtToggleMCMA(\''+l+'\')"'+dis+'>'+letterSpan(l)+esc(q.options[l])+'</div>';
      });
    } else if (q.type === 'PGK') {
      var arr = Array.isArray(RT.myAnswer) ? RT.myAnswer : [];
      (q.statements || []).forEach(function(st,i){
        var v = arr[i];
        var bdis = RT.submitted ? ' disabled' : '';
        html += '<div class="rt-option" style="cursor:default;">' +
          '<div style="margin-bottom:.5rem;">'+(i+1)+'. '+esc(st)+'</div>' +
          '<div style="display:flex;gap:.5rem;">' +
            '<button type="button" class="btn btn-sm '+(v===true?'btn-primary':'btn-secondary')+'" onclick="rtTogglePGK('+i+',true)"'+bdis+'>True</button>' +
            '<button type="button" class="btn btn-sm '+(v===false?'btn-primary':'btn-secondary')+'" onclick="rtTogglePGK('+i+',false)"'+bdis+'>False</button>' +
          '</div></div>';
      });
    } else if (q.type === 'ISIAN') {
      html += '<input type="text" class="form-control" id="rtIsianInput" placeholder="Ketik jawaban..." value="'+esc(RT.myAnswer||'')+'" oninput="rtUpdateIsian(this.value)"'+(RT.submitted?' disabled':'')+'>';
    } else {
      html = '<div class="empty-state" style="padding:1rem;"><p>Tipe soal tidak dikenali.</p></div>';
    }
    return html;
  }

  window.rtSelectOption = function(val){
    if (RT.submitted) return;
    RT.myAnswer = val;
    document.querySelectorAll('#rtOptions .rt-option').forEach(function(el){
      el.classList.toggle('selected', el.dataset.val === val);
    });
  };

  window.rtToggleMCMA = function(val){
    if (RT.submitted) return;
    var sel = Array.isArray(RT.myAnswer) ? RT.myAnswer.slice() : [];
    var i = sel.indexOf(val);
    if (i === -1) sel.push(val); else sel.splice(i,1);
    RT.myAnswer = sel;
    document.querySelectorAll('#rtOptions .rt-option').forEach(function(el){
      el.classList.toggle('selected', sel.indexOf(el.dataset.val) !== -1);
    });
  };

  window.rtTogglePGK = function(i,val){
    if (RT.submitted) return;
    var arr = Array.isArray(RT.myAnswer) ? RT.myAnswer.slice() : [];
    while (arr.length <= i) arr.push(null);
    arr[i] = val;
    RT.myAnswer = arr;
    rtRenderQuestion(true);
  };

  window.rtUpdateIsian = function(val){
    if (RT.submitted) return;
    RT.myAnswer = val;
  };

  // ============================================
  // SUBMIT
  // ============================================
  window.rtSubmitAnswer = async function(){
    if (!RT.room || RT.room.status !== 'playing') return;
    var cur = getCurrentQuestion();
    if (!cur || !cur.data) return;
    if (RT.submitted) return;
    if (RT.myAnswer == null || RT.myAnswer === '' || (Array.isArray(RT.myAnswer) && RT.myAnswer.length === 0)) {
      toastSafe('Pilih/isi jawaban dulu.','warning'); return;
    }

    var ends = rtEndsAtMs();
    var now = nowMs();
    if (ends && now >= ends) { toastSafe('Waktu habis.','warning'); return; }

    var q = cur.data;
    var correct = checkAnswer(q, RT.myAnswer);
    var remainingMs = ends ? Math.max(0, ends - now) : 0;
    var points = normalPoints(correct, remainingMs);

    try {
      await db.collection('liveRooms').doc(RT.roomId).collection('answers')
        .doc(RT.playerId + '_' + cur.index).set({
          studentId: PS.user.id, playerId: RT.playerId, studentName: RT.playerName,
          qIndex: cur.index, questionId: cur.id,
          answer: RT.myAnswer, correct: correct, points: points,
          timeMs: (rtDurationSec()*1000) - remainingMs,
          submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge:true });

      RT.submitted = true;
      RT.lastRenderedAnswerKey = '';
      toastSafe('Terkirim. +' + points + ' poin','success');
      rtRenderQuestion(true);
    } catch(e){
      console.error('[rt] submit failed:', e);
      toastSafe('Gagal kirim: ' + e.message, 'error');
    }
  };

  function checkAnswer(q, ans){
    if (!q) return false;
    if (q.type === 'PGS') return String(ans).trim() === String(q.correctAnswer).trim();
    if (q.type === 'ISIAN') return String(ans||'').toLowerCase().trim() === String(q.correctAnswer||'').toLowerCase().trim();
    if (q.type === 'MCMA') {
      if (!Array.isArray(ans) || !Array.isArray(q.correctAnswer)) return false;
      return ans.slice().sort().join('|') === q.correctAnswer.slice().sort().join('|');
    }
    if (q.type === 'PGK') {
      if (!Array.isArray(ans) || !Array.isArray(q.correctAnswer)) return false;
      if (ans.length !== q.correctAnswer.length) return false;
      for (var i=0;i<q.correctAnswer.length;i++) if (ans[i] !== q.correctAnswer[i]) return false;
      return true;
    }
    return false;
  }

  function formatCorrect(q){
    if (!q) return '-';
    if (q.type === 'PGS') {
      var ca = q.correctAnswer;
      return ca + ((q.options && q.options[ca]) ? ' — ' + q.options[ca] : '');
    }
    if (q.type === 'ISIAN') return q.correctAnswer || '-';
    if (q.type === 'MCMA') {
      return (q.correctAnswer||[]).map(function(k){
        return k + ((q.options && q.options[k]) ? ' — ' + q.options[k] : '');
      }).join('<br>');
    }
    if (q.type === 'PGK') {
      return (q.correctAnswer||[]).map(function(v,i){
        var st = (q.statements && q.statements[i]) ? q.statements[i] : ('Pernyataan '+(i+1));
        return (i+1)+'. '+esc(st)+' = <b>'+(v?'True':'False')+'</b>';
      }).join('<br>');
    }
    return '-';
  }

  function getExplanation(q){ return q.explanation || q.discussion || q.pembahasan || q.solution || ''; }

  function rtRenderAnswerFeedback(){
    var el = $('rtAnswerFeedback');
    if (!el || !RT.room || RT.room.status !== 'playing') return;
    var cur = getCurrentQuestion();
    if (!cur || !cur.data) { el.style.display = 'none'; return; }
    var myAns = RT.answers ? RT.answers[RT.playerId + '_' + cur.index] : null;
    if (!myAns) { el.style.display = 'none'; return; }

    var q = cur.data;
    var expl = getExplanation(q);
    el.style.display = 'block';
    el.style.background = myAns.correct ? '#ecfdf5' : '#fef2f2';
    el.style.color = myAns.correct ? '#065f46' : '#991b1b';
    el.innerHTML =
      '<div style="font-weight:800;margin-bottom:.25rem;">' +
        (myAns.correct ? '✓ Benar' : '✗ Salah') +
        ' <span style="float:right;">+'+(myAns.points||0)+' poin</span>' +
      '</div>' +
      '<div style="font-size:.8125rem;margin-top:.25rem;"><b>Jawaban benar:</b><br>' + formatCorrect(q) + '</div>' +
      (expl ? '<div style="font-size:.8125rem;margin-top:.5rem;padding-top:.5rem;border-top:1px solid rgba(0,0,0,.08);"><b>Pembahasan:</b><br>' + esc(expl) + '</div>' : '');
  }

  // ============================================
  // TIMER + WATCHDOG
  // ============================================
  function rtStartTick(){
    if (RT.tickTimer) clearInterval(RT.tickTimer);
    RT.tickTimer = setInterval(function(){
      rtRenderCountdown();
      var sq = $('rtSubmitArea');
      if (sq && RT.room && RT.room.status === 'playing') {
        sq.style.display = (!RT.submitted && rtEndsAtMs() > nowMs()) ? 'block' : 'none';
      }
    }, 500);
  }

  function rtRenderCountdown(){
    var el = $('rtTimerBig');
    if (!el || !RT.room || RT.room.status !== 'playing') return;
    var ends = rtEndsAtMs();
    if (!ends) { el.textContent = '--:--'; return; }
    var remain = Math.max(0, Math.floor((ends - nowMs())/1000));
    var m = Math.floor(remain/60), s = remain%60;
    el.textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    el.classList.toggle('urgent', remain <= 5);
  }

  // ============================================
  // LEADERBOARD
  // ============================================
  function buildLeaderboard(){
    var agg = {};
    Object.keys(RT.players||{}).forEach(function(pid){
      var p = RT.players[pid];
      agg[pid] = { id:pid, studentId:p.studentId||pid, name:p.name||p.studentId||pid, score:0, correct:0 };
    });
    Object.keys(RT.answers||{}).forEach(function(k){
      var a = RT.answers[k];
      var pid = a.playerId || a.studentId;
      if (!pid) return;
      if (!agg[pid]) agg[pid] = { id:pid, studentId:a.studentId||pid, name:a.studentName||pid, score:0, correct:0 };
      agg[pid].score += a.points || 0;
      if (a.correct) agg[pid].correct++;
    });
    var list = Object.keys(agg).map(function(k){ return agg[k]; });
    list.sort(function(a,b){
      if (b.score !== a.score) return b.score - a.score;
      if (b.correct !== a.correct) return b.correct - a.correct;
      return String(a.name).localeCompare(String(b.name));
    });
    return list;
  }

  function rtRenderLeaderboard(){
    var el = $('rtLeaderboard');
    if (!el) return;
    var list = buildLeaderboard();
    if (!list.length) {
      el.innerHTML = '<div class="empty-state" style="padding:.5rem;"><p style="font-size:.8125rem;">Belum ada skor</p></div>';
      return;
    }
    el.innerHTML = list.slice(0,10).map(function(p,i){
      var isMe = p.id === RT.playerId || p.studentId === (PS.user && PS.user.id);
      var medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);
      return '<div class="rt-leaderboard-row'+(isMe?' me':'')+'">' +
        '<span class="rt-rank">'+medal+'</span>' +
        '<span class="rt-name">'+esc(p.name)+(isMe?' (Anda)':'')+'</span>' +
        '<span class="rt-score">'+p.score+'</span>' +
      '</div>';
    }).join('');
  }

  // ============================================
  // FINISHED
  // ============================================
  function rtRenderFinished(){
    var list = buildLeaderboard();
    var myRank='-', myScore=0, myCorrect=0;
    list.forEach(function(p,i){
      if (p.id === RT.playerId || p.studentId === (PS.user && PS.user.id)) {
        myRank = '#'+(i+1); myScore = p.score; myCorrect = p.correct;
      }
    });
    var r = $('rtFinalRank'); if (r) r.textContent = myRank;
    var s = $('rtFinalScore'); if (s) s.textContent = myScore;
    var c = $('rtFinalCorrect'); if (c) c.textContent = myCorrect;
    var l = $('rtFinalLeaderboard');
    if (l) {
      l.innerHTML = list.slice(0,5).map(function(p,i){
        var isMe = p.id === RT.playerId || p.studentId === (PS.user && PS.user.id);
        var medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);
        return '<div class="rt-leaderboard-row'+(isMe?' me':'')+'">' +
          '<span class="rt-rank">'+medal+'</span>' +
          '<span class="rt-name">'+esc(p.name)+(isMe?' (Anda)':'')+'</span>' +
          '<span class="rt-score">'+p.score+'</span>' +
        '</div>';
      }).join('');
    }
    if (PS.user && RT.roomCode) localStorage.removeItem(storageKey(RT.roomCode, PS.user.id));
    rtUnsubscribeAll();
  }

  // ============================================
  // REFRESH CONNECTION
  // ============================================
  window.rtRefreshConnection = async function(){
    if (!RT.roomId) { toastSafe('Belum ada room aktif','warning'); return; }
    var load = loadSafe('Menyegarkan koneksi...');
    try {
      rtUnsubscribeAll();
      var doc = await db.collection('liveRooms').doc(RT.roomId).get();
      if (!doc.exists) {
        load.close();
        alertSafe('Realtime Berakhir','Room tidak tersedia.','warning');
        rtBackToHome();
        return;
      }
      RT.room = Object.assign({id: doc.id}, doc.data());
      RT.questionsLoadedForSession = null;
      RT.questions = [];
      RT.questionsById = {};

      var pSnap = await db.collection('liveRooms').doc(RT.roomId).collection('players').get();
      RT.players = {};
      pSnap.forEach(function(d){ RT.players[d.id] = Object.assign({id:d.id}, d.data()); });

      RT.online = true;
      updateOnlineIndicator();

      rtSubscribe();

      if (RT.room.status === 'playing') {
        showScreen('rtPlayingScreen');
        await rtRenderQuestion(true);
      } else if (RT.room.status === 'finished') {
        showScreen('rtFinishedScreen');
        rtRenderFinished();
      } else {
        showScreen('rtLobbyScreen');
        rtRenderLobby();
      }

      load.close();
      toastSafe('Koneksi di-refresh','success');
    } catch(e){
      load.close();
      RT.online = false;
      updateOnlineIndicator();
      toastSafe('Gagal refresh: '+e.message,'error');
    }
  };

  // ============================================
  // BACK
  // ============================================
  window.rtBackToHome = function(){
    rtUnsubscribeAll();
    toggleVocabBg(false);
    if (window.__rtVocabTimer) clearInterval(window.__rtVocabTimer);
    window.location.href = window.location.href.split('?')[0];
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealtimeFromUrl);
  } else {
    setTimeout(initRealtimeFromUrl, 50);
  }

  console.log('✅ realtime.js v1.6 loaded (+ JEC-xxx + rtOpenJoin manual)');
})();