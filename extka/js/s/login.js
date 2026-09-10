/* #24 | /root/js/s/login.js | v 2.2 | u 10/09/2026 • 08:55:00 | xu : ke-6 | note : #noteresponse
- FIX BUG "dua layar block bersamaan" (jalur login/refresh):
  * showDashboard()   -> showScreen('app')    [hide login/test/result, show app + sHeader]
  * safetyNet()       -> showScreen('app')    [jaring pengaman pakai showScreen]
  * renderHeader()    -> hapus manual sHeader.style.display (showScreen yang atur)
  * restore()         -> hapus manual $('loginScreen').style.display='none' (showDashboard
    yang atur via showScreen)
  * login submit      -> otomatis ikut karena memanggil showDashboard()
- TETAP (tidak dipotong dari v2.1): saveSession/readSession/clearSession
  (localStorage+sessionStorage), startClock (#sDateLine real-time), loadProfileExtended,
  restore (try/catch + auto-resume in_progress via autoResume), jaring pengaman boot,
  toggle PIN visibility, login form submit handler, logout conditional. */

(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }

  function saveSession(user){
    var s = JSON.stringify(user);
    try{ localStorage.setItem('student_session', s); }catch(e){}
    try{ sessionStorage.setItem('student_session', s); }catch(e){}
  }
  function readSession(){
    var s = null;
    try{ s = localStorage.getItem('student_session') || sessionStorage.getItem('student_session'); }catch(e){}
    return s;
  }
  function clearSession(){
    try{ localStorage.removeItem('student_session'); }catch(e){}
    try{ sessionStorage.removeItem('student_session'); }catch(e){}
  }

  // Date line real-time di bawah header
  function startClock(){
    var hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    var bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    function upd(){
      var now = new Date();
      var el = $('sDateLine');
      if (el) {
        var p = function(n){ return String(n).padStart(2,'0'); };
        el.innerHTML = '<span class="material-icons">schedule</span>' +
          hari[now.getDay()] + ', ' + now.getDate() + ' ' + bulan[now.getMonth()] + ' ' + now.getFullYear() +
          ' | ' + p(now.getHours()) + ':' + p(now.getMinutes()) + ':' + p(now.getSeconds());
      }
    }
    upd();
    if (!window.__sClock) window.__sClock = setInterval(upd, 1000);
  }

  // FIX: hapus manipulasi sHeader manual (showScreen yang atur)
  function renderHeader(user){
    var u = $('sUserId'); if (u) u.textContent = user.id;
    var n = $('sUserName'); if (n) n.textContent = user.name;
    startClock();
  }

  async function loadProfileExtended(){
    if (!PS.user || !PS.user.id) return;
    try {
      var d = await db.collection('students').doc(PS.user.id).get();
      if (d.exists) {
        PS.myProfile = Object.assign({ id: d.id }, d.data());
        if (PS.myProfile.name && PS.myProfile.name !== PS.user.name) {
          PS.user.name = PS.myProfile.name;
          var n = $('sUserName'); if (n) n.textContent = PS.user.name;
        }
        if (window.renderProfileTab) window.renderProfileTab();
      }
    } catch(e){ console.warn('[PS] loadProfileExtended error:', e); }
  }

  // FIX: pakai showScreen('app')
  async function showDashboard(){
    if (window.showScreen) showScreen('app');
    else {
      var ls = $('loginScreen'); if (ls) ls.style.display = 'none';
      var sa = $('studentApp'); if (sa) sa.style.display = 'block';
      var tp = $('testPage'); if (tp) tp.style.display = 'none';
      var rp = $('resultPage'); if (rp) rp.style.display = 'none';
    }
    renderHeader(PS.user);
    await loadProfileExtended();
    if (window.loadDashboard) await loadDashboard();
    if (window.PS && typeof PS.setTab === 'function') PS.setTab(PS.activeTab || 'home');
  }

  async function restore(){
    var raw = readSession();
    if (!raw) return; // tetap di login
    var user;
    try{ user = JSON.parse(raw); }catch(e){ clearSession(); return; }
    if (!user || !user.id) { clearSession(); return; }

    PS.user = user;
    // FIX: tidak perlu manipulasi loginScreen manual — showDashboard() di bawah
    // (via showScreen) yang akan mengatur semua 4 layar sekaligus
    renderHeader(user);
    await loadProfileExtended();

    // Coba resume attempt in_progress
    try{
      var snap = await db.collection('attempts').where('studentId','==',user.id).get();
      var inc = null;
      snap.forEach(function(d){
        var a = d.data();
        if (a.status === 'in_progress') inc = { id: d.id, data: a };
      });
      if (inc && inc.data.sessionId && window.autoResume) {
        await window.autoResume(inc.data.sessionId);
        return;
      }
    }catch(e){ console.warn('[PS] cek resume gagal:', e); }

    // Tampilkan app + muat dashboard + tab home (showScreen('app'))
    await showDashboard();
  }

  // Jaring pengaman: pakai showScreen('app') agar 4 layar selalu konsisten
  function safetyNet(){
    try{
      var ls = $('loginScreen'), ap = $('studentApp');
      if (PS.user && ls && ap &&
          ls.style.display === 'none' &&
          (ap.style.display === 'none' || ap.style.display === '')) {
        if (window.showScreen) showScreen('app');
        else { ap.style.display = 'block'; }
        renderHeader(PS.user);
        if (window.PS && typeof PS.setTab === 'function') PS.setTab(PS.activeTab || 'home');
      }
    }catch(e){}
  }

  // Toggle visibility PIN
  var tp = $('togglePin');
  if (tp) tp.addEventListener('click', function(){
    var p = $('loginPin');
    var icon = tp.querySelector('.material-icons');
    if (p.type === 'password') { p.type = 'text'; icon.textContent = 'visibility'; }
    else { p.type = 'password'; icon.textContent = 'visibility_off'; }
  });

  // Login manual
  var form = $('loginForm');
  if (form) form.addEventListener('submit', async function(e){
    e.preventDefault();
    var err = $('loginErr');
    var id = $('loginId').value.trim();
    var pin = $('loginPin').value;
    var btn = form.querySelector('button[type="submit"]');

    err.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Verifikasi...';

    try {
      var snap = await db.collection('students').doc(id).get();
      if (!snap.exists) {
        err.textContent = 'ID Siswa tidak ditemukan!';
        err.style.display = 'block'; btn.disabled = false;
        btn.innerHTML = '<span class="material-icons">login</span>Masuk'; return;
      }
      var data = snap.data();
      if (data.status === false) {
        err.textContent = 'Akun Anda nonaktif. Hubungi admin.';
        err.style.display = 'block'; btn.disabled = false;
        btn.innerHTML = '<span class="material-icons">login</span>Masuk'; return;
      }
      var valid = await verifyPin(pin, data.pinHash);
      if (!valid) {
        err.textContent = 'PIN salah!';
        err.style.display = 'block'; btn.disabled = false;
        btn.innerHTML = '<span class="material-icons">login</span>Masuk'; return;
      }

      PS.user = { id: id, name: data.name, batch: data.batch, year: data.year, sequence: data.sequence };
      PS.myProfile = Object.assign({ id: id }, data);
      saveSession(PS.user);
      await showDashboard();
    } catch (error) {
      err.textContent = 'Error: ' + error.message;
      err.style.display = 'block'; btn.disabled = false;
      btn.innerHTML = '<span class="material-icons">login</span>Masuk';
    }
  });

  // Logout (conditional, backward compat jika elemen masih ada)
  var lo = $('sLogoutBtn');
  if (lo) lo.addEventListener('click', function(){
    confirm2('Logout', 'Keluar dari panel siswa?', function(){
      clearSession();
      location.reload();
    });
  });

  // Jalankan restore setelah semua script siap + safety net
  function boot(){
    restore().catch(function(e){
      console.error('[PS] restore error:', e);
      safetyNet();
    }).then(function(){ safetyNet(); });
  }
  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);

  window.showStudentDashboard = showDashboard;
  window.saveStudentSession = saveSession;
  window.clearStudentSession = clearSession;
})();
