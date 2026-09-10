/* #27 | /root/js/s/result.js | v 2.1 | u 10/09/2026 • 08:35:00 | xu : ke-5 | note : #noteresponse
- FIX BUG "dua layar block bersamaan" (soal retry nongkrong di bawah semua menu):
  * showResult()           -> showScreen('result')
  * showResultFromAttempt()-> showScreen('result')
  * backToDashboard()      -> showScreen('app') + PS.setTab('home')
  * retryHomeworkNow()     -> tidak perlu manipulasi layar manual; initHomework()
    akan memanggil showHomeworkPage() -> showScreen('test').
  * Header sHeader otomatis di-hide oleh showScreen (kecuali di layar 'app').
  * Dengan ini MUSTAHIL ada 2 layar block bersamaan.
- TETAP (tidak dipotong dari v2.0): mode-aware section (badge Live/PR, info percobaan,
  nilai terbaik, tombol Retry Sekarang), __lastResult untuk review, reviewAnswers TANPA
  kunci/pembahasan (dibagikan admin via WA), applyScoreIcon, buildModeSection,
  injectModeSection, bestAttemptOf, attemptNumber, canRetryNow, findSession.
- Fallback aman bila showScreen belum tersedia. */

(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  var RETRY_THRESHOLD = 50;   // fixed (2A)

  // ===== Helpers mode homework =====
  function isHwMode(s){ return !!(s && s.mode === 'homework'); }

  function findSession(sid){
    var s = PS.sessions.find(function(x){ return x.id===sid; });
    if (!s && PS.currentSession && PS.currentSession.id===sid) s = PS.currentSession;
    return s;
  }

  // Attempt terbaik siswa di suatu sesi (berdasarkan score)
  function bestAttemptOf(sid, excludeId){
    var atts = PS.myAttempts.filter(function(a){ return a.sessionId===sid && a.status==='completed' && a.id!==excludeId; });
    var best=null;
    atts.forEach(function(a){ if(!best || (a.score||0)>(best.score||0)) best=a; });
    return best;
  }

  // Percobaan ke berapa attempt ini di sesi tsb
  function attemptNumber(a){
    return a.attemptNumber || 1;
  }

  // Apakah retry tersedia (homework + conditional + percobaan 1 + gagal threshold)
  function canRetryNow(sess, attempt){
    if (!isHwMode(sess)) return false;
    if (sess.retryMode !== 'conditional') return false;
    var num = attemptNumber(attempt);
    if (num !== 1) return false;
    var score = attempt.score||0;
    var correct = attempt.correctAnswers||0;
    var total = attempt.totalQuestions||1;
    return (score < RETRY_THRESHOLD || correct < total/2);
  }

  function p2(n){ return String(n).padStart(2,'0'); }
  function fmtTime(sec){
    sec = Math.max(0, Math.floor(sec||0));
    return Math.floor(sec/60) + ':' + p2(sec%60);
  }
  function escapeHtmlR(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ===== Tampilan icon + warna berdasarkan score =====
  function applyScoreIcon(icon, score){
    if(score>=80){ icon.style.background='#d1fae5'; icon.style.color='#10b981'; icon.innerHTML='<span class="material-icons">emoji_events</span>'; }
    else if(score>=60){ icon.style.background='#fef3c7'; icon.style.color='#f59e0b'; icon.innerHTML='<span class="material-icons">mood</span>'; }
    else { icon.style.background='#fee2e2'; icon.style.color='#ef4444'; icon.innerHTML='<span class="material-icons">sentiment_dissatisfied</span>'; }
  }

  // ===== Build HTML section mode (badge + percobaan + retry + best) =====
  function buildModeSection(sess, attempt){
    if (!sess) return '';
    var modeBadge = isHwMode(sess)
      ? '<div style="text-align:center;margin-bottom:.75rem;"><span class="mode-badge-hw"><span class="material-icons">menu_book</span>Homework / PR</span></div>'
      : '<div style="text-align:center;margin-bottom:.75rem;"><span class="mode-badge-live"><span class="material-icons">bolt</span>Live Exercise</span></div>';

    if (!isHwMode(sess)) return modeBadge;

    // Homework: info percobaan
    var num = attemptNumber(attempt);
    var maxAttempt = (sess.retryMode==='conditional') ? 2 : 1;
    var percobaanHtml = '<div style="display:flex;justify-content:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.5rem;">' +
      '<span class="badge badge-info">Percobaan '+num+' / '+maxAttempt+'</span>' +
      (num===2 ? '<span class="hw-retry-badge used"><span class="material-icons">refresh</span>Retry terpakai</span>' : '') +
      '</div>';

    // Nilai terbaik (antar percobaan di sesi ini)
    var best = bestAttemptOf(sess.id, attempt.id);
    var bestHtml = '';
    if (best && num > 1) {
      var bestScore = Math.max((attempt.score||0), (best.score||0));
      bestHtml = '<div style="margin-top:.5rem;padding:.625rem;background:#ecfdf5;border:1px dashed #10b981;border-radius:8px;font-size:.8125rem;color:#065f46;">' +
        '<div style="font-weight:600;display:flex;align-items:center;justify-content:center;gap:.375rem;">' +
          '<span class="material-icons" style="font-size:16px;">emoji_events</span>' +
          'Nilai tertinggi (antar percobaan): <b style="font-size:1.125rem;">'+bestScore+'</b>' +
        '</div>' +
      '</div>';
    }

    // Tombol Retry (hanya di live submit, bukan dari riwayat)
    var retryHtml = '';
    if (canRetryNow(sess, attempt)) {
      retryHtml = '<button class="btn btn-warning w-full" style="margin-top:.75rem;" onclick="retryHomeworkNow(\''+sess.id+'\')">' +
        '<span class="material-icons">refresh</span>Retry Sekarang (Kesempatan Terakhir)' +
      '</button>';
    }

    return modeBadge + percobaanHtml + bestHtml + retryHtml;
  }

  // ===== SHOW RESULT (setelah submit live/homework) =====
  function showResult(score, correct, totalTime, auto){
    // FIX: pakai showScreen terpusat
    if (window.showScreen) showScreen('result');
    else {
      var ls=$('loginScreen'); if(ls) ls.style.display='none';
      var sa=$('studentApp'); if(sa) sa.style.display='none';
      var tp=$('testPage'); if(tp) tp.style.display='none';
      var rp=$('resultPage'); if(rp) rp.style.display='block';
    }

    var icon=$('resultIcon');
    applyScoreIcon(icon, score);

    $('resultScore').textContent=score;
    $('rCorrect').textContent=correct;
    $('rWrong').textContent=PS.questions.length-correct;
    $('rTime').textContent=fmtTime(totalTime);
    $('rAcc').textContent=Math.round((correct/PS.questions.length)*100)+'%';

    window.__lastResult={score:score,correct:correct,questions:PS.questions,answers:PS.answers};

    // Inject section mode ke atas result-card
    injectModeSection(PS.currentSession, {
      id: PS.attemptId,
      score: score,
      correctAnswers: correct,
      totalQuestions: PS.questions.length,
      attemptNumber: PS.attemptNumber||1
    });
  }

  // ===== SHOW RESULT FROM ATTEMPT (dari riwayat / nilai) =====
  async function showResultFromAttempt(id){
    var d=await db.collection('attempts').doc(id).get();
    if(!d.exists)return;
    var a=Object.assign({id:id}, d.data());

    var qSnap=await db.collection('questions').where('sessionId','==',a.sessionId).get();
    var qs=[]; qSnap.forEach(function(q){qs.push(Object.assign({id:q.id},q.data()));});
    qs.sort(function(x,y){return (x.order||0)-(y.order||0);});

    // FIX: pakai showScreen terpusat
    if (window.showScreen) showScreen('result');
    else {
      var ls=$('loginScreen'); if(ls) ls.style.display='none';
      var sa=$('studentApp'); if(sa) sa.style.display='none';
      var tp=$('testPage'); if(tp) tp.style.display='none';
      var rp=$('resultPage'); if(rp) rp.style.display='block';
    }

    var icon=$('resultIcon'); var score=a.score||0;
    applyScoreIcon(icon, score);

    $('resultScore').textContent=score;
    $('rCorrect').textContent=a.correctAnswers||0;
    $('rWrong').textContent=(a.totalQuestions||0)-(a.correctAnswers||0);
    $('rTime').textContent=fmtTime(a.totalTime||0);
    $('rAcc').textContent=score+'%';

    window.__lastResult={score:score,correct:a.correctAnswers,questions:qs,answers:a.answers||{}};

    // Inject section mode
    var sess = findSession(a.sessionId);
    if (!sess) {
      try {
        var ss = await db.collection('sessions').doc(a.sessionId).get();
        if (ss.exists) sess = Object.assign({id:ss.id}, ss.data());
      } catch(e){}
    }
    injectModeSection(sess, a);
  }

  // ===== Inject mode section ke result-card (sebelum resultScore) =====
  function injectModeSection(sess, attempt){
    var card = document.querySelector('.result-card');
    if (!card) return;
    // hapus section lama bila ada
    var old = card.querySelector('.result-mode-section');
    if (old) old.remove();
    var sec = document.createElement('div');
    sec.className = 'result-mode-section';
    sec.innerHTML = buildModeSection(sess, attempt);
    // sisipkan setelah icon, sebelum h2 "Selesai!"
    var icon = card.querySelector('.result-icon');
    if (icon && icon.nextSibling) card.insertBefore(sec, icon.nextSibling);
    else card.appendChild(sec);
  }

  // ===== Retry dari result page (hanya homework percobaan 1) =====
  window.retryHomeworkNow = async function(sid){
    if (!window.initHomework) { toast('Modul homework tidak tersedia','error'); return; }
    // Tidak perlu manipulasi layar manual di sini: initHomework -> showHomeworkPage -> showScreen('test')
    try {
      await initHomework(sid, 2);
    } catch(e){
      alert2('Error','Gagal memulai retry: '+e.message,'error');
      if (window.backToDashboard) backToDashboard();
    }
  };

  // ===== REVIEW: HANYA jawaban siswa + status (tanpa kunci & pembahasan) =====
  window.reviewAnswers = function(){
    var r=window.__lastResult;
    if(!r||!r.questions.length){toast('Data review tidak tersedia','warning');return;}
    var html='<div style="max-height:50vh;overflow-y:auto;">';
    r.questions.forEach(function(q,i){
      var a=r.answers[q.id];
      var ok=false;
      if(q.type==='PGS') ok=(a===q.correctAnswer);
      else if(q.type==='MCMA') ok=JSON.stringify((a||[]).slice().sort())===JSON.stringify((q.correctAnswer||[]).slice().sort());
      else if(q.type==='PGK') ok=JSON.stringify(a||[])===JSON.stringify(q.correctAnswer||[]);
      else if(q.type==='ISIAN') ok=String(a||'').toLowerCase().trim()===String(q.correctAnswer||'').toLowerCase().trim();

      var ans=a;
      if(q.type==='MCMA') ans=(a||[]).join(',');
      else if(q.type==='PGK') ans=(a||[]).map(function(x){return x?'B':'S';}).join(',');

      html+='<div style="border:1px solid '+(ok?'#10b981':'#ef4444')+';border-radius:8px;padding:.75rem;margin-bottom:.75rem;">'+
        '<div style="font-size:.75rem;font-weight:700;color:'+(ok?'#10b981':'#ef4444')+';margin-bottom:.375rem;">Soal '+(i+1)+' • '+(ok?'BENAR':'SALAH')+'</div>'+
        '<div style="font-size:.8125rem;margin-bottom:.5rem;">'+escapeHtmlR(q.text||'')+'</div>'+
        '<div style="font-size:.75rem;">Jawaban Anda: <b>'+escapeHtmlR(String(ans===undefined?'-':ans))+'</b></div>'+
        '</div>';
    });
    html+='</div>';
    html+='<p style="font-size:.75rem;color:#64748b;margin-top:.5rem;">Pembahasan akan dibagikan oleh guru/admin melalui grup WhatsApp.</p>';

    M.custom({ title:'Review Jawaban', message:html, type:'info', buttons:[{text:'Tutup',class:'btn-primary'}] });
  };

  // FIX: pakai showScreen + setTab
  window.backToDashboard = function(){
    PS.currentSession=null; PS.questions=[]; PS.answers={}; PS.attemptId=null;
    if (window.showScreen) showScreen('app');
    else {
      var ls=$('loginScreen'); if(ls) ls.style.display='none';
      var tp=$('testPage'); if(tp) tp.style.display='none';
      var rp=$('resultPage'); if(rp) rp.style.display='none';
      var sa=$('studentApp'); if(sa) sa.style.display='block';
    }
    if (PS.setTab) PS.setTab('home');
    if(window.loadDashboard) loadDashboard();
  };

  window.showResult=showResult;
  window.showResultFromAttempt=showResultFromAttempt;
})();
