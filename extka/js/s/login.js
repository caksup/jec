/* #24 | /root/js/s/login.js | v 2.1 | u 08/09/2026 • 12:10:00 | xu : ke-5 | note : #noteresponse
- FIX BLANK SAAT REFRESH: restore() kini memanggil showDashboard() (yg menampilkan #studentApp)
  pada jalur tanpa-resume; sebelumnya studentApp tidak pernah ditampilkan -> blank putih.
- TAMBAH jaring pengaman: setelah window load, jika login sembunyi + app sembunyi + user ada,
  paksa tampilkan app + setTab home.
- FIX: restore dibungkus try/catch agar error tak membuat blank.
- Tetap: persist session (localStorage+sessionStorage), auto-resume in_progress,
  date line (#sDateLine), load profil extended, toggle PIN, logout conditional. */

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

  function renderHeader(user){
    var u = $('sUserId'); if (u) u.textContent = user.id;
    var n = $('sUserName'); if (n) n.textContent = user.name;
    var hdr = $('sHeader'); if (hdr) hdr.style.display = 'flex';
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

  async function showDashboard(){
    $('loginScreen').style.display = 'none';
    $('studentApp').style.display = 'block';   // <-- kunci: tampilkan app
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
    $('loginScreen').style.display = 'none';
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

    // FIX: tampilkan app + muat dashboard + tab home
    await showDashboard();
  }

  // Jaring pengaman: pastikan app tampil walau ada jalur yg terlewat
  function safetyNet(){
    try{
      var ls = $('loginScreen'), ap = $('studentApp');
      if (PS.user && ls && ap &&
          ls.style.display === 'none' &&
          (ap.style.display === 'none' || ap.style.display === '')) {
        ap.style.display = 'block';
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