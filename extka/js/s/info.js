/* #33 | /root/js/s/info.js | v 1.1 | u 08/09/2026 • 11:52:00 | xu : ke-2 | note : #noteresponse
- FIX BLANK: override setTab kini DELEGATE ke setTab asli state.js untuk tab non-info,
  dan untuk 'info' memanggil showTabPage/highlightBnNav/renderStudentTab (agar container tampil).
- Isi tab Info TIDAK berubah (cara pakai, laporkan masalah WA, tentang JEC). */

(function(){
  'use strict';

  var WA_TEKNIS = '6285335913758';

  function injectStyle(){
    if (document.getElementById('info-style')) return;
    var st = document.createElement('style');
    st.id = 'info-style';
    st.textContent = [
      '.info-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1rem;margin-bottom:.875rem;}',
      '.info-card h3{display:flex;align-items:center;gap:.5rem;font-size:.9375rem;font-weight:700;margin-bottom:.75rem;}',
      '.info-card h3 .material-icons{color:#2563eb;}',
      '.info-step{display:flex;gap:.75rem;margin-bottom:.75rem;}',
      '.info-step-num{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;}',
      '.info-step-body{flex:1;font-size:.8125rem;color:#475569;line-height:1.6;}',
      '.info-step-body b{color:#1e293b;}',
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
      '<div class="info-card">' +
        '<h3><span class="material-icons">menu_book</span>Cara Penggunaan Aplikasi</h3>' +
        step(1,'Login menggunakan <b>ID Siswa</b> dan <b>PIN</b> yang diberikan oleh mentor.') +
        step(2,'Pada tab <b>Home</b>, lihat ringkasan serta daftar sesi Exercise TKA yang perlu dikerjakan.') +
        step(3,'Tekan <b>Mulai</b> pada sesi, periksa detail (jumlah soal & durasi), lalu tekan <b>Mulai Sekarang</b>.') +
        step(4,'Kerjakan soal sesuai tipenya: Pilihan Ganda, Pilihan Ganda Kompleks, True/False, atau Isian Singkat.') +
        step(5,'Gunakan tombol <b>Prev/Next</b> dan <b>Menu Soal</b> untuk berpindah; tandai <b>Ragu</b> bila perlu.') +
        step(6,'<b>Dilarang keluar browser atau berpindah tab</b> selama simulasi — pelanggaran tercatat dan dapat mengakhiri sesi otomatis.') +
        step(7,'Tekan <b>Kumpulkan</b> pada soal terakhir untuk mengakhiri sesi dan melihat nilai.') +
        step(8,'Pantau nilai pada tab <b>Nilai</b>, riwayat pada tab <b>Riwayat</b>, serta lengkapi data diri pada tab <b>Profile</b>.') +
      '</div>' +
      '<div class="info-card">' +
        '<h3><span class="material-icons">bug_report</span>Laporkan Masalah</h3>' +
        '<p style="font-size:.8125rem;color:#64748b;margin-bottom:.75rem;">Menemui kendala teknis? Kirim laporan langsung ke Mentor Teknis Simulasi melalui WhatsApp.</p>' +
        '<button class="btn btn-warning w-full" onclick="openLaporMasalah()"><span class="material-icons">support_agent</span>Laporkan Masalah</button>' +
      '</div>' +
      '<div class="info-card info-about">' +
        '<h3><span class="material-icons">info</span>Tentang JEC Exercise ACT</h3>' +
        '<div class="info-logo">🎓</div>' +
        '<p><b>JEC Exercise ACT</b> (Jagat Education Center — Exercise Academic Competence Test) adalah platform latihan simulasi kompetensi akademik berbasis web dari <b>Jagat Education Center</b>.</p>' +
        '<p>Modul <b>Exercise TKA</b> (Exercise Academic Competence Test) menyediakan simulasi soal bertipe Pilihan Ganda, Pilihan Ganda Kompleks, True/False, dan Isian Singkat dengan penilaian otomatis, pengawasan anti-kecurangan, serta laporan hasil bagi siswa dan orang tua.</p>' +
        '<p>Dikembangkan untuk membantu siswa berlatih secara terukur dan terstruktur dalam menghadapi asesmen kompetensi.</p>' +
        '<div class="info-ver">JEC Exercise ACT v1.0 &copy; 2026 Jagat Education Center</div>' +
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
    var msg = '*LAPORAN MASALAH APLIKASI*\nJEC Exercise ACT (Exercise TKA)\n\n' +
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