/* s#27 | /root/js/s/result.js | v 2.7 | u 18/09/2026 • 00:45:00 | xu : ke-11 | note : #noteresponse
- v2.4 (baseline user) -> v2.7 (UPDATE: review PR tampilkan kunci + pembahasan):
  * UPDATE #1: reviewAnswers() untuk mode HOMEWORK kini menampilkan:
    - Jawaban benar (kunci) per soal lengkap dengan teks opsi (untuk PGS/MCMA)
      atau "Benar/Salah" (untuk PGK), atau teks jawaban (ISIAN).
    - Pembahasan (field pembahasan/explanation/pembahasanText/solution) di
      kotak biru bila tersedia.
    - Catatan "Pembahasan akan dibagikan melalui WhatsApp" DIHILANGKAN untuk
      PR; untuk Live Exercise catatan tsb tetap ada (kunci disembunyikan).
  * UPDATE #2: __lastResult menyimpan flag `isHw` (true bila mode homework)
    agar reviewAnswers tahu mode sesi. Flag di-set di showResult() dan
    showResultFromAttempt().
  * TAMBAH helper getPembahasan(q) dan formatKunci(q) untuk merender kunci
    jawaban dalam bentuk mudah dibaca per tipe soal.
  * FIX: pastikan retryHomeworkNow selalu exposed di window (sudah ada di
    baseline, dipertahankan).
  * TETAP IDENTIK dari v2.4 baseline user:
    - canRetryNow dengan syarat gagal (score<50 ATAU benar<setengah) +
      retryMode conditional + attempt ke-1 + tidak ada attempt ke-2 completed.
    - TANPA gate deadline/grace.
    - findSessionAsync fallback Firestore, normalisasi attemptNumber,
      hasLaterAttempt (cegah infinite retry), konfirmasi sebelum retry,
      debug log [result], showScreen terpusat, badge mode & percobaan,
      nilai tertinggi antar percobaan.
- EXPOSE: window.showResult, window.showResultFromAttempt, window.reviewAnswers,
  window.backToDashboard, window.retryHomeworkNow. */

(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  var RETRY_THRESHOLD = 50;

  function dbg(){ var a=['[result]']; for(var i=0;i<arguments.length;i++) a.push(arguments[i]); console.log.apply(console, a); }

  function isHwMode(s){ return !!(s && s.mode === 'homework'); }

  function getRetryMode(sess){
    if (!sess) return 'once';
    if (sess.retryMode && typeof sess.retryMode === 'string') return sess.retryMode;
    return isHwMode(sess) ? 'conditional' : 'once';
  }

  function findSessionSync(sid){
    var s = (PS.sessions||[]).find(function(x){ return x.id===sid; });
    if (!s && PS.currentSession && PS.currentSession.id===sid) s = PS.currentSession;
    return s || null;
  }

  async function findSessionAsync(sid){
    var s = findSessionSync(sid);
    if (s) return s;
    try {
      var ss = await db.collection('sessions').doc(sid).get();
      if (ss.exists) {
        var data = Object.assign({id:ss.id}, ss.data());
        PS.currentSession = data;
        return data;
      }
    } catch(e){ dbg('findSession fetch error:', e.message); }
    return null;
  }

  function bestAttemptOf(sid, excludeId){
    var atts = (PS.myAttempts||[]).filter(function(a){ return a.sessionId===sid && a.status==='completed' && a.id!==excludeId; });
    var best=null;
    atts.forEach(function(a){ if(!best || (a.score||0)>(best.score||0)) best=a; });
    return best;
  }

  function attemptNumber(a){
    var n = a && (a.attemptNumber || a.attemptNo);
    if (typeof n !== 'number' || n < 1) return 1;
    return n;
  }

  function hasLaterAttempt(sess, currentAttemptId){
    if (!PS.myAttempts || !PS.myAttempts.length) return false;
    return PS.myAttempts.some(function(a){
      return a.sessionId === sess.id
          && a.status === 'completed'
          && a.id !== currentAttemptId
          && attemptNumber(a) >= 2;
    });
  }

  // TANPA gate deadline/grace; syarat gagal threshold
  function canRetryNow(sess, attempt){
    if (!isHwMode(sess)) { dbg('canRetry: bukan homework'); return false; }
    var retryMode = getRetryMode(sess);
    if (retryMode !== 'conditional') { dbg('canRetry: retryMode='+retryMode); return false; }
    var num = attemptNumber(attempt);
    if (num !== 1) { dbg('canRetry: attemptNumber='+num); return false; }
    if (hasLaterAttempt(sess, attempt.id)) { dbg('canRetry: sudah ada attempt >=2'); return false; }
    var score = attempt.score||0;
    var correct = attempt.correctAnswers||0;
    var total = attempt.totalQuestions||1;
    var failed = (score < RETRY_THRESHOLD) || (correct < total/2);
    if (!failed) { dbg('canRetry: tidak failed (score='+score+')'); return false; }
    dbg('canRetry: TRUE (score='+score+', correct='+correct+'/'+total+')');
    return true;
  }

  function p2(n){ return String(n).padStart(2,'0'); }
  function fmtTime(sec){
    sec = Math.max(0, Math.floor(sec||0));
    return Math.floor(sec/60) + ':' + p2(sec%60);
  }
  function escapeHtmlR(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Helper: ambil pembahasan dari berbagai nama field
  function getPembahasan(q){
    if (!q) return '';
    return q.pembahasan || q.explanation || q.pembahasanText || q.solution || '';
  }

  // Helper: format kunci jawaban dalam bentuk mudah dibaca
  function formatKunci(q){
    if (!q) return '-';
    if (q.type === 'PGS') {
      var c = q.correctAnswer;
      if (!c) return '-';
      return String(c) + ((q.options && q.options[c]) ? ' — ' + q.options[c] : '');
    }
    if (q.type === 'ISIAN') return String(q.correctAnswer||'-');
    if (q.type === 'MCMA') {
      var arr = q.correctAnswer || [];
      if (!arr.length) return '-';
      return arr.map(function(k){
        return String(k) + ((q.options && q.options[k]) ? ' — ' + q.options[k] : '');
      }).join(', ');
    }
    if (q.type === 'PGK') {
      var arr2 = q.correctAnswer || [];
      if (!arr2.length) return '-';
      return arr2.map(function(v,i){ return (i+1)+':'+(v?'Benar':'Salah'); }).join(', ');
    }
    return '-';
  }

  function applyScoreIcon(icon, score){
    if (!icon) return;
    if(score>=80){ icon.style.background='#d1fae5'; icon.style.color='#10b981'; icon.innerHTML='<span class="material-icons">emoji_events</span>'; }
    else if(score>=60){ icon.style.background='#fef3c7'; icon.style.color='#f59e0b'; icon.innerHTML='<span class="material-icons">mood</span>'; }
    else { icon.style.background='#fee2e2'; icon.style.color='#ef4444'; icon.innerHTML='<span class="material-icons">sentiment_dissatisfied</span>'; }
  }

  function buildModeSection(sess, attempt){
    if (!sess) return '';
    var modeBadge = isHwMode(sess)
      ? '<div style="text-align:center;margin-bottom:.75rem;"><span class="mode-badge-hw"><span class="material-icons">menu_book</span>Homework / PR</span></div>'
      : '<div style="text-align:center;margin-bottom:.75rem;"><span class="mode-badge-live"><span class="material-icons">bolt</span>Live Exercise</span></div>';

    if (!isHwMode(sess)) return modeBadge;

    var num = attemptNumber(attempt);
    var maxAttempt = (getRetryMode(sess)==='conditional') ? 2 : 1;
    var percobaanHtml = '<div style="display:flex;justify-content:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.5rem;">' +
      '<span class="badge badge-info">Percobaan '+num+' / '+maxAttempt+'</span>' +
      (num===2 ? '<span class="hw-retry-badge used"><span class="material-icons">refresh</span>Retry terpakai</span>' : '') +
      '</div>';

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

    var retryHtml = '';
    if (canRetryNow(sess, attempt)) {
      retryHtml =
        '<div style="margin-top:1rem;padding:.875rem;background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:2px solid #f59e0b;border-radius:12px;text-align:center;">' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:.375rem;margin-bottom:.375rem;">' +
            '<span class="material-icons" style="font-size:24px;color:#d97706;">refresh</span>' +
            '<b style="color:#92400e;font-size:1rem;">Kesempatan Retry Tersedia</b>' +
          '</div>' +
          '<div style="font-size:.8125rem;color:#78350f;margin-bottom:.5rem;">' +
            'Nilai Try 1 belum tuntas. Perbaiki di percobaan ke-2 (nilai tertinggi yang dicatat).' +
          '</div>' +
          '<button type="button" class="btn btn-warning w-full" style="margin-top:.5rem;position:relative;z-index:10;" onclick="retryHomeworkNow(\''+String(sess.id).replace(/'/g,"\\'")+'\')">' +
            '<span class="material-icons">refresh</span>Retry Sekarang (Percobaan 2/2)' +
          '</button>' +
        '</div>';
    } else if (num === 1 && getRetryMode(sess) === 'conditional') {
      var atts = (PS.myAttempts||[]).filter(function(a){ return a.sessionId===sess.id && a.status==='completed'; });
      if (atts.length >= 2) {
        retryHtml = '<div style="margin-top:1rem;padding:.625rem;background:#f1f5f9;border-radius:8px;font-size:.8125rem;color:#475569;text-align:center;">' +
          '<span class="material-icons" style="font-size:14px;vertical-align:-2px;">check_circle</span> ' +
          'Anda sudah menggunakan semua kesempatan percobaan (2x).' +
        '</div>';
      }
    }

    return modeBadge + percobaanHtml + bestHtml + retryHtml;
  }

  function showResult(score, correct, totalTime, auto){
    dbg('showResult: score='+score+' correct='+correct+' auto='+auto);
    if (window.showScreen) showScreen('result');
    else {
      var ls=$('loginScreen'); if(ls) ls.style.display='none';
      var sa=$('studentApp'); if(sa) sa.style.display='none';
      var tp=$('testPage'); if(tp) tp.style.display='none';
      var rp=$('resultPage'); if(rp) rp.style.display='block';
    }

    var icon=$('resultIcon');
    if (icon) applyScoreIcon(icon, score);

    var scoreEl = $('resultScore'); if (scoreEl) scoreEl.textContent = score;
    var rcEl = $('rCorrect'); if (rcEl) rcEl.textContent = correct;
    var rwEl = $('rWrong'); if (rwEl) rwEl.textContent = (PS.questions||[]).length - correct;
    var rtEl = $('rTime'); if (rtEl) rtEl.textContent = fmtTime(totalTime);
    var raEl = $('rAcc'); if (raEl) raEl.textContent = Math.round((correct / Math.max(1,(PS.questions||[]).length)) * 100) + '%';

    window.__lastResult = {
      score:score, correct:correct,
      questions: PS.questions || [],
      answers: PS.answers || {},
      attemptId: PS.attemptId,
      attemptNumber: PS.attemptNumber || 1,
      isHw: !!(PS.currentSession && PS.currentSession.mode === 'homework')
    };

    injectModeSection(PS.currentSession, {
      id: PS.attemptId,
      score: score,
      correctAnswers: correct,
      totalQuestions: (PS.questions||[]).length,
      attemptNumber: PS.attemptNumber || 1
    });
  }

  async function showResultFromAttempt(id){
    dbg('showResultFromAttempt: id='+id);
    var d = await db.collection('attempts').doc(id).get();
    if(!d.exists){ toast('Attempt tidak ditemukan','warning'); return; }
    var a = Object.assign({id:id}, d.data());

    var qSnap = await db.collection('questions').where('sessionId','==',a.sessionId).get();
    var qs = [];
    qSnap.forEach(function(q){ qs.push(Object.assign({id:q.id}, q.data())); });
    qs.sort(function(x,y){ return (x.order||0)-(y.order||0); });

    if (window.showScreen) showScreen('result');
    else {
      var ls=$('loginScreen'); if(ls) ls.style.display='none';
      var sa=$('studentApp'); if(sa) sa.style.display='none';
      var tp=$('testPage'); if(tp) tp.style.display='none';
      var rp=$('resultPage'); if(rp) rp.style.display='block';
    }

    var icon=$('resultIcon'); var score=a.score||0;
    if (icon) applyScoreIcon(icon, score);

    var scoreEl = $('resultScore'); if (scoreEl) scoreEl.textContent = score;
    var rcEl = $('rCorrect'); if (rcEl) rcEl.textContent = a.correctAnswers||0;
    var rwEl = $('rWrong'); if (rwEl) rwEl.textContent = (a.totalQuestions||0)-(a.correctAnswers||0);
    var rtEl = $('rTime'); if (rtEl) rtEl.textContent = fmtTime(a.totalTime||0);
    var raEl = $('rAcc'); if (raEl) raEl.textContent = score+'%';

    var sess = await findSessionAsync(a.sessionId);
    var isHw = (a.mode === 'homework') || isHwMode(sess);

    window.__lastResult = {
      score:score, correct:a.correctAnswers,
      questions:qs, answers:a.answers||{},
      attemptId: a.id, attemptNumber: attemptNumber(a),
      isHw: isHw
    };

    injectModeSection(sess, a);
  }

  function injectModeSection(sess, attempt){
    var card = document.querySelector('.result-card');
    if (!card) { dbg('injectModeSection: card tidak ditemukan'); return; }
    var old = card.querySelector('.result-mode-section');
    if (old) old.remove();
    var sec = document.createElement('div');
    sec.className = 'result-mode-section';
    sec.innerHTML = buildModeSection(sess, attempt);
    var icon = card.querySelector('.result-icon');
    if (icon && icon.nextSibling) card.insertBefore(sec, icon.nextSibling);
    else card.appendChild(sec);
    dbg('injectModeSection: sess=', sess ? sess.id : 'null');
  }

  // Pastikan retryHomeworkNow selalu tersedia
  window.retryHomeworkNow = async function(sid){
    dbg('retryHomeworkNow: sid='+sid);
    if (!window.initHomework) {
      alert2('Error','Modul homework tidak tersedia. Refresh halaman dan coba lagi.','error');
      return;
    }
    if (!confirm('Mulai Retry (Percobaan 2)?\n\nSoal akan sama seperti Try 1.\nNilai tertinggi yang akan dicatat.')) return;
    try {
      await initHomework(sid, 2, true);
    } catch(e){
      alert2('Error','Gagal memulai retry: '+e.message,'error');
      if (window.backToDashboard) backToDashboard();
    }
  };

  // UPDATE #1: reviewAnswers untuk PR tampilkan kunci + pembahasan; Live tetap catatan WA
  window.reviewAnswers = function(){
    var r=window.__lastResult;
    if(!r||!r.questions||!r.questions.length){toast('Data review tidak tersedia','warning');return;}
    var isHw = !!r.isHw;

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

      var kunciHtml = '';
      if (isHw) {
        kunciHtml =
          '<div style="font-size:.75rem;margin-top:.5rem;padding:.5rem .625rem;background:#ecfdf5;border-left:3px solid #10b981;border-radius:6px;color:#065f46;">' +
            '<b>Jawaban benar:</b> '+escapeHtmlR(formatKunci(q)) +
          '</div>';
        var pb = getPembahasan(q);
        if (pb) {
          kunciHtml +=
            '<div style="font-size:.75rem;margin-top:.5rem;padding:.5rem .625rem;background:#eff6ff;border-left:3px solid #2563eb;border-radius:6px;color:#1e40af;">' +
              '<b>Pembahasan:</b><br>'+escapeHtmlR(pb) +
            '</div>';
        }
      }

      html+='<div style="border:1px solid '+(ok?'#10b981':'#ef4444')+';border-radius:8px;padding:.75rem;margin-bottom:.75rem;">'+
        '<div style="font-size:.75rem;font-weight:700;color:'+(ok?'#10b981':'#ef4444')+';margin-bottom:.375rem;">Soal '+(i+1)+' • '+(ok?'BENAR':'SALAH')+'</div>'+
        '<div style="font-size:.8125rem;margin-bottom:.5rem;">'+escapeHtmlR(q.text||'')+'</div>'+
        '<div style="font-size:.75rem;">Jawaban Anda: <b>'+escapeHtmlR(String(ans===undefined?'-':ans))+'</b></div>'+
        kunciHtml +
        '</div>';
    });
    html+='</div>';

    if (!isHw) {
      html+='<p style="font-size:.75rem;color:#64748b;margin-top:.5rem;">Pembahasan akan dibagikan oleh guru/admin melalui grup WhatsApp.</p>';
    }

    M.custom({ title:'Review Jawaban', message:html, type:'info', buttons:[{text:'Tutup',class:'btn-primary'}] });
  };

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

  window.showResult = showResult;
  window.showResultFromAttempt = showResultFromAttempt;

  console.log('✅ result.js v2.7 loaded (review PR tampilkan kunci + pembahasan, tombol Retry clickable)');
})();