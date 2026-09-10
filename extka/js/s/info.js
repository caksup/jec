/* #33 | /root/js/s/info.js | v 1.2 | u 10/09/2026 • 09:05:00 | xu : ke-3 | note : #noteresponse
- UPDATE: tambahkan CARD HEADER APP di paling atas tab Info
  ("JEC Exercise ACT" + "Version 1.8") dengan style brand gradient, icon besar, center.
- UPDATE: langkah "Cara Penggunaan" disesuaikan dengan fitur terbaru HOMEWORK (PR):
  * Sebut 2 section di Home: Homework Pending (PR) & Live Exercise Tersedia
  * Tambah step khusus Homework: feedback langsung per soal, terkunci, retry conditional
  * Bedakan aturan anti-cheat antara Live (ketat) & PR (santai, kecuali admin ON)
  * Bump versi footer ke v1.8
- TETAP (tidak dipotong dari v1.1): inject style, laporkan masalah via WA (WA_TEKNIS),
  tentang JEC, override setTab (intercept 'info' + delegate sisanya ke state.js asli),
  renderStudentTab wrapper, bind_nav untuk bottom nav info, eksport renderInfoTab,
  openLaporMasalah, submitLaporMasalah. */

(function(){
  'use strict';

  var WA_TEKNIS = '6285335913758';

  function injectStyle(){
    if (document.getElementById('info-style')) return;
    var st = document.createElement('style');
    st.id = 'info-style';
    st.textContent = [
      '.info-app-header{background:linear-gradient(135deg,#2563eb,#1e40af);color:#fff;border-radius:16px;padding:1.5rem 1rem;margin-bottom:1rem;text-align:center;box-shadow:0 8px 24px rgba(37,99,235,.25);}',
      '.info-app-header .info-app-logo{font-size:3rem;margin-bottom:.25rem;}',
      '.info-app-header h2{font-size:1.25rem;font-weight:800;margin:0 0 .25rem 0;letter-spacing:.3px;}',
      '.info-app-header .info-app-ver{font-size:.8125rem;font-weight:600;opacity:.9;background:rgba(255,255,255,.15);display:inline-block;padding:.2rem .75rem;border-radius:999px;}',
      '.info-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1rem;margin-bottom:.875rem;}',
      '.info-card h3{display:flex;align-items:center;gap:.5rem;font-size:.9375rem;font-weight:700;margin-bottom:.75rem;}',
      '.info-card h3 .material-icons{color:#2563eb;}',
      '.info-step{display:flex;gap:.75rem;margin-bottom:.75rem;}',
      '.info-step-num{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;}',
      '.info-step-body{flex:1;font-size:.8125rem;color:#475569;line-height:1.6;}',
      '.info-step-body b{color:#1e293b;}',
      '.info-step-body .mode-tag{display:inline-block;font-size:.6875rem;font-weight:700;padding:.1rem .45rem;border-radius:6px;margin-right:.25rem;vertical-align:middle;}',
      '.info-step-body .mode-tag.live{background:#dbeafe;color:#1e40af;}',
      '.info-step-body .mode-tag.hw{background:#fef3c7;color:#92400e;}',
      '.info-about p{font-size:.8125rem;color:#475569;line-height:1.7;margin-bottom:.5rem;}',
      '.info-about .info-logo{font-size:2.5rem;text-align:center;margin:.5rem 0;}',
      '.info-ver{font-size:.7rem;color:#94a3b8;text-align:center;margin-top:.75rem;}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function step(n, txt){
    return '<div class="info-step"><div class="info-step-num">' + n + '</div><div class="info-step-body">' + txt + '</div></div>';
  }

  function renderInfoTab(){
    injectStyle();
    var wrap = document.getElementById('infoTabContent');
    if (!wrap) return;
    wrap.innerHTML =
      // ===== HEADER APP (paling atas) =====
      '<div class="info-app-header">' +
        '<div class="info-app-logo">🎓</div>' +
        '<h2>JEC Exercise ACT</h2>' +
        '<span class="info-app-ver">Version 1.8</span>' +
      '</div>' +

      // ===== CARA PENGGUNAAN (dengan fitur Homework terbaru) =====
      '<div class="info-card">' +
        '<h3><span class="material-icons">menu_book</span>Cara Penggunaan Aplikasi</h3>' +
        step(1,'Login menggunakan <b>ID Siswa</b> dan <b>PIN</b> yang diberikan oleh mentor.') +
        step(2,'Pada tab <b>Home</b>, Anda akan melihat dua bagian: <b>Homework Pending (PR)</b> berwarna kuning dan <b>Live Exercise Tersedia</b> berwarna biru, lengkap dengan countdown deadline untuk PR.') +
        step(3,'Tekan salah satu card untuk memulai.' +
          '<span class="mode-tag hw">PR</span>Untuk <b>Homework</b>: periksa detail (jumlah soal, deadline, percobaan), lalu tekan <b>Mulai Mengerjakan</b>.' +
          '<span class="mode-tag live">Live</span>Untuk <b>Live Exercise</b>: periksa detail (jumlah soal, durasi, waktu pengerjaan, status anti-cheat), lalu tekan <b>Mulai Sekarang</b>.') +
        step(4,'Kerjakan 4 tipe soal: <b>Pilihan Ganda</b>, <b>Pilihan Ganda Kompleks</b> (pilih lebih dari satu), <b>True/False</b>, dan <b>Isian Singkat</b>.' +
          ' Untuk Homework, setiap soal langsung memberi <b>feedback benar/salah + pembahasan</b> dan terkunci setelah diperiksa.') +
        step(5,'Gunakan tombol <b>Prev / Next</b> untuk berpindah soal, tombol <b>Menu Soal</b> untuk lompat ke nomor tertentu, dan tombol <b>Ragu</b> untuk menandai soal yang ingin ditinjau ulang.') +
        step(6,'<b>Aturan anti-kecurangan:</b>' +
          ' Live Exercise <b>wajib tetap di tab yang sama</b> — berpindah tab/keluar browser akan dihitung pelanggaran dan dapat mengakhiri sesi otomatis.' +
          ' Homework umumnya santai, <b>kecuali</b> mentor mengaktifkan anti-cheat pada sesi PR tersebut.') +
        step(7,'Tekan <b>Kumpulkan</b> pada soal terakhir (atau kapan saja bila semua soal sudah diperiksa di Homework) untuk mengakhiri sesi dan melihat nilai.') +
        step(8,'<b>Retry Homework:</b> jika percobaan 1 Homework bernilai <b>&lt;50</b> atau benar kurang dari setengah soal, Anda akan ditawari <b>1 kesempatan retry terakhir</b>. Nilai tertinggi antar percobaan yang dicatat.') +
        step(9,'Pantau nilai pada tab <b>Nilai</b> (ringkasan per sesi + detail tiap attempt), riwayat pada tab <b>Riwayat</b>, serta lengkapi data diri pada tab <b>Profile</b>.') +
      '</div>' +

      // ===== LAPORKAN MASALAH =====
      '<div class="info-card">' +
        '<h3><span class="material-icons">bug_report</span>Laporkan Masalah</h3>' +
        '<p style="font-size:.8125rem;color:#64748b;margin-bottom:.75rem;">Menemui kendala teknis? Kirim laporan langsung ke Mentor Teknis Simulasi melalui WhatsApp.</p>' +
        '<button class="btn btn-warning w-full" onclick="openLaporMasalah()"><span class="material-icons">support_agent</span>Laporkan Masalah</button>' +
      '</div>' +

      // ===== TENTANG =====
      '<div class="info-card info-about">' +
        '<h3><span class="material-icons">info</span>Tentang JEC Exercise ACT</h3>' +
        '<div class="info-logo">🎓</div>' +
        '<p><b>JEC Exercise ACT</b> (Jagat Education Center — Exercise Academic Competence Test) adalah platform latihan simulasi kompetensi akademik berbasis web dari <b>Jagat Education Center</b>.</p>' +
        '<p>Modul <b>Exercise TKA</b> menyediakan simulasi soal bertipe Pilihan Ganda, Pilihan Ganda Kompleks, True/False, dan Isian Singkat dengan dua mode pengerjaan: <b>Live Exercise</b> (di kelas, pengawasan ketat) dan <b>Homework / PR</b> (di rumah, feedback langsung, dengan kesempatan retry).</p>' +
        '<p>Dikembangkan untuk membantu siswa berlatih secara terukur dan terstruktur dalam menghadapi asesmen kompetensi.</p>' +
        '<div class="info-ver">JEC Exercise ACT v1.8 &copy; 2026 Jagat Education Center</div>' +
      '</div>';
  }

  window.openLaporMasalah = function(){
    var content =
      '<div class="form-group"><label class="form-label">Judul Masalah</label>' +
      '<input type="text" class="form-control" id="lmJudul" placeholder="Contoh: Tidak bisa memulai sesi"></div>' +
      '<div class="form-group"><label class="form-label">Jelaskan Masalah</label>' +
      '<textarea class="form-control" id="lmPesan" rows="4" placeholder="Jelaskan kendala yang Anda alami secara detail..."></textarea></div>' +
      '<p style="font-size:.75rem;color:#64748b;">Laporan akan dikirim via WhatsApp ke Mentor Teknis Simulasi.</p>';
    M.custom({
      title: 'Laporkan Masalah', message: content, type: 'warning',
      buttons: [
        { text:'Batal', class:'btn-secondary' },
        { text:'Kirim via WhatsApp', class:'btn-success', action: submitLaporMasalah }
      ]
    });
  };

  window.submitLaporMasalah = function(){
    var judul = document.getElementById('lmJudul').value.trim();
    var pesan = document.getElementById('lmPesan').value.trim();
    if (!judul) { alert2('Error','Judul masalah wajib diisi','error'); return; }
    if (!pesan) { alert2('Error','Penjelasan masalah wajib diisi','error'); return; }
    var now = new Date();
    var p = function(n){ return String(n).padStart(2,'0'); };
    var msg = '*LAPORAN MASALAH APLIKASI*\nJEC Exercise ACT (Exercise TKA) v1.8\n\n' +
      'Nama: ' + (PS.user.name||'-') + '\nID Siswa: ' + (PS.user.id||'-') + '\n' +
      'Judul: ' + judul + '\nMasalah:\n' + pesan + '\n\n' +
      'Waktu: ' + p(now.getDate()) + '/' + p(now.getMonth()+1) + '/' + now.getFullYear() + ' ' + p(now.getHours()) + ':' + p(now.getMinutes()) + '\n' +
      'Perangkat: ' + ((navigator.userAgent||'').indexOf('Mobile')>-1?'Mobile':'Desktop');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).catch(function(){});
    window.open('https://wa.me/' + WA_TEKNIS + '?text=' + encodeURIComponent(msg), '_blank');
    toast('Laporan disalin & WhatsApp dibuka. Tekan kirim di WA.','success');
  };

  // Wrap dispatcher utk tab info
  (function(){
    var orig = window.renderStudentTab;
    window.renderStudentTab = function(name){
      if (name === 'info') { renderInfoTab(); return; }
      if (typeof orig === 'function') orig(name);
    };
  })();

  // Override setTab: intercept 'info', delegate sisanya ke setTab asli (state.js)
  (function(){
    if (!window.PS || typeof PS.setTab !== 'function') return;
    var origSet = PS.setTab;
    PS.setTab = function(name){
      if (name === 'info') {
        PS.activeTab = 'info';
        if (window.showTabPage) window.showTabPage('info');
        if (window.highlightBnNav) window.highlightBnNav('info');
        if (window.renderStudentTab) window.renderStudentTab('info');
        return;
      }
      origSet(name);
    };
  })();

  function bindNav(){
    document.querySelectorAll('.bn-item[data-tab="info"]').forEach(function(el){
      if (!el._infoBound) { el._infoBound = true; el.addEventListener('click', function(){ PS.setTab('info'); }); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindNav);
  else bindNav();

  window.renderInfoTab = renderInfoTab;
})();
