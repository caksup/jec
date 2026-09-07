/* #27 | /root/js/s/result.js | v 1.3 | u 07/09/2026 • 14:12:00 | xu : ke-3 | note : 
- UPDATE 3: review hanya tampilkan jawaban siswa + status BENAR/SALAH.
  KUNCI & PEMBAHASAN TIDAK ditampilkan ke siswa (dikirim admin via WA).
- Tetap: result score + jumlah benar/salah + waktu + akurasi */

(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }

  function showResult(score, correct, totalTime, auto){
    $('testPage').style.display='none';
    $('resultPage').style.display='block';
    var icon=$('resultIcon');
    if(score>=80){icon.style.background='#d1fae5';icon.style.color='#10b981';icon.innerHTML='<span class="material-icons">emoji_events</span>';}
    else if(score>=60){icon.style.background='#fef3c7';icon.style.color='#f59e0b';icon.innerHTML='<span class="material-icons">mood</span>';}
    else{icon.style.background='#fee2e2';icon.style.color='#ef4444';icon.innerHTML='<span class="material-icons">sentiment_dissatisfied</span>';}
    $('resultScore').textContent=score;
    $('rCorrect').textContent=correct;
    $('rWrong').textContent=PS.questions.length-correct;
    $('rTime').textContent=Math.floor(totalTime/60)+':'+String(totalTime%60).padStart(2,'0');
    $('rAcc').textContent=Math.round((correct/PS.questions.length)*100)+'%';
    window.__lastResult={score:score,correct:correct,questions:PS.questions,answers:PS.answers};
  }

  async function showResultFromAttempt(id){
    var d=await db.collection('attempts').doc(id).get();
    if(!d.exists)return;
    var a=d.data();
    var qSnap=await db.collection('questions').where('sessionId','==',a.sessionId).get();
    var qs=[]; qSnap.forEach(function(q){qs.push(Object.assign({id:q.id},q.data()));});
    qs.sort(function(x,y){return (x.order||0)-(y.order||0);});
    $('testPage').style.display='none'; $('studentApp').style.display='none'; $('resultPage').style.display='block';
    var icon=$('resultIcon'); var score=a.score||0;
    if(score>=80){icon.style.background='#d1fae5';icon.style.color='#10b981';icon.innerHTML='<span class="material-icons">emoji_events</span>';}
    else if(score>=60){icon.style.background='#fef3c7';icon.style.color='#f59e0b';icon.innerHTML='<span class="material-icons">mood</span>';}
    else{icon.style.background='#fee2e2';icon.style.color='#ef4444';icon.innerHTML='<span class="material-icons">sentiment_dissatisfied</span>';}
    $('resultScore').textContent=score;
    $('rCorrect').textContent=a.correctAnswers||0;
    $('rWrong').textContent=(a.totalQuestions||0)-(a.correctAnswers||0);
    $('rTime').textContent=Math.floor((a.totalTime||0)/60)+':'+String((a.totalTime||0)%60).padStart(2,'0');
    $('rAcc').textContent=score+'%';
    window.__lastResult={score:score,correct:a.correctAnswers,questions:qs,answers:a.answers||{}};
  }

  // Review: HANYA jawaban siswa + status (tanpa kunci & pembahasan)
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
        '<div style="font-size:.8125rem;margin-bottom:.5rem;">'+escapeHtml(q.text||'')+'</div>'+
        '<div style="font-size:.75rem;">Jawaban Anda: <b>'+escapeHtml(String(ans===undefined?'-':ans))+'</b></div>'+
        '</div>';
    });
    html+='</div>';
    html+='<p style="font-size:.75rem;color:#64748b;margin-top:.5rem;">Pembahasan akan dibagikan oleh guru/admin melalui grup WhatsApp.</p>';

    M.custom({ title:'Review Jawaban', message:html, type:'info', buttons:[{text:'Tutup',class:'btn-primary'}] });
  };

  window.backToDashboard = function(){
    PS.currentSession=null; PS.questions=[]; PS.answers={}; PS.attemptId=null;
    $('resultPage').style.display='none'; $('testPage').style.display='none';
    $('studentApp').style.display='block';
    if(window.loadDashboard) loadDashboard();
  };

  window.showResult=showResult;
  window.showResultFromAttempt=showResultFromAttempt;
})();