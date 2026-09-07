/* #30 | /root/js/s/s-devtools.js | v 1.0 | u 07/09/2026 • 12:50:00 | xu : ke-1 | note : 
- DevTools KHUSUS PANEL SISWA (terpisah dari admin js/devtools.js)
- Aktif hanya dengan ?devtools (sp.html?devtools)
- DevLive + Riwayat Update File men-scan SEMUA file siswa
- Cek JS / Integration / Firebase / State disesuaikan global siswa (PS, db, M, dll)
- Tools lengkap: DevLive, Riwayat, Cek JS, Console, Integration, Firebase, State,
  Query FS, Storage, Cookies, Network, DOM, Perf, Color, A11y, Screen, Eruda, Hash PIN, Cache, Data, Reload */

(function(){
'use strict';
if (!new URLSearchParams(location.search).has('devtools')) return;

// Semua file Panel Siswa (untuk DevLive / Riwayat / Integration)
var STUDENT_FILES = [
  'sp.html',
  'css/g.css', 'css/s.css',
  'js/fc.js', 'js/hash.js', 'js/modal.js',
  'js/s/state.js', 'js/s/login.js', 'js/s/dashboard.js', 'js/s/test.js',
  'js/s/result.js', 'js/s/feedback.js', 'js/s/profile.js', 'js/s/s-devtools.js'
];

var DT = {
  open:false, fullscreen:false, logs:[], _cap:false,
  pos:{x:null,y:null}, lastAuto:null, clockInterval:null,
  devliveFiles: STUDENT_FILES.slice(), devliveData: [],

  init:function(){ this.captureLogs(); this.loadPos(); this.buildFab(); this.buildPanel(); this.startClock(); var s=this; setTimeout(function(){ s.autoScan(true); },1200); },

  loadPos:function(){ try{ var p=JSON.parse(localStorage.getItem('sdt_pos')); if(p)this.pos=p; }catch(e){} if(!this.pos.x)this.pos={x:innerWidth-62,y:innerHeight-62}; },
  savePos:function(){ try{ localStorage.setItem('sdt_pos', JSON.stringify(this.pos)); }catch(e){} },

  startClock:function(){
    if(this.clockInterval) clearInterval(this.clockInterval);
    var upd=function(){ var el=document.getElementById('devlive-clock'); if(el){ var n=new Date(),p=function(x){return String(x).padStart(2,'0');}; el.textContent=p(n.getHours())+':'+p(n.getMinutes())+':'+p(n.getSeconds()); } };
    upd(); this.clockInterval=setInterval(upd,1000);
  },

  mp:function(t,d){ if(window.M&&typeof window.M.prompt==='function') return window.M.prompt(t,{defaultValue:(d==null)?'':String(d)}); return window.prompt(t,(d==null)?'':String(d)); },

  buildFab:function(){
    var self=this;
    var fab=document.createElement('div'); fab.id='adt-fab';
    fab.innerHTML='<span class="material-icons" style="font-size:24px;">school</span>';
    fab.style.cssText='position:fixed;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);color:#fff;display:flex;align-items:center;justify-content:center;z-index:2147483640;box-shadow:0 4px 14px rgba(16,185,129,.5);cursor:grab;user-select:none;touch-action:none;';
    fab.style.left=this.pos.x+'px'; fab.style.top=this.pos.y+'px';
    var b=document.createElement('span'); b.id='adt-badge';
    b.style.cssText='position:absolute;top:-4px;right:-4px;background:#16a34a;color:#fff;border-radius:10px;font-size:9px;padding:1px 5px;font-weight:800;border:1.5px solid #fff;pointer-events:none;';
    b.textContent='…'; fab.appendChild(b);
    var dr=false,mv=false,sx,sy,ox,oy;
    var st=function(e){dr=true;mv=false;var t=e.touches?e.touches[0]:e;sx=t.clientX;sy=t.clientY;ox=fab.offsetLeft;oy=fab.offsetTop;};
    var mo=function(e){if(!dr)return;e.preventDefault();var t=e.touches?e.touches[0]:e;var dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>4||Math.abs(dy)>4)mv=true;fab.style.left=Math.max(0,Math.min(ox+dx,innerWidth-48))+'px';fab.style.top=Math.max(0,Math.min(oy+dy,innerHeight-48))+'px';};
    var en=function(){if(!dr)return;dr=false;self.pos={x:fab.offsetLeft,y:fab.offsetTop};self.savePos();if(!mv)self.toggle();};
    fab.addEventListener('mousedown',st); fab.addEventListener('touchstart',st,{passive:false});
    document.addEventListener('mousemove',mo); document.addEventListener('touchmove',mo,{passive:false});
    document.addEventListener('mouseup',en); document.addEventListener('touchend',en);
    document.body.appendChild(fab);
  },

  buildPanel:function(){
    var self=this;
    var p=document.createElement('div'); p.id='adt-panel';
    p.style.cssText='position:fixed;left:8px;right:8px;bottom:80px;top:50%;max-height:60vh;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.25);z-index:2147483641;display:none;flex-direction:column;overflow:hidden;border:1px solid #e2e8f0;font-family:Inter,sans-serif;';
    var h='<div id="adt-header" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none;">';
    h+='<span style="font-size:13px;font-weight:800;display:flex;align-items:center;gap:6px;"><span class="material-icons" style="font-size:18px;">school</span> DevTools Siswa <small style="opacity:.7;font-weight:500;">v1.0</small></span>';
    h+='<div style="display:flex;gap:6px;">';
    h+='<span id="adt-fullscreen" style="cursor:pointer;padding:3px;border-radius:4px;background:rgba(255,255,255,.2);display:flex;"><span class="material-icons" style="font-size:18px;">fullscreen</span></span>';
    h+='<span id="adt-close" style="cursor:pointer;padding:3px;border-radius:4px;background:rgba(255,255,255,.2);display:flex;"><span class="material-icons" style="font-size:18px;">close</span></span>';
    h+='</div></div>';
    h+='<div style="overflow-x:auto;white-space:nowrap;padding:8px 10px;background:#f8fafc;border-bottom:1px solid #e2e8f0;scrollbar-width:none;">';
    h+='<div style="display:inline-flex;gap:6px;">';
    var tools=[
      ['devlive','sensors','DevLive'],['history','history','Riwayat'],['jscheck','code','Cek JS'],
      ['logs','terminal','Console'],['integration','link','Integration'],['fbcheck','cloud','Firebase'],
      ['state','person','State'],['fsquery','search','Query FS'],['lsinspect','folder','Storage'],
      ['cookies','cookie','Cookies'],['network','wifi','Network'],['dom','account_tree','DOM'],
      ['performance','speed','Perf'],['screen','devices','Screen'],['eruda','bug_report','Eruda'],
      ['pinhash','lock','Hash PIN'],['clearcache','cleaning_services','Cache'],['clearls','delete_sweep','Data'],['reload','refresh','Reload']
    ];
    tools.forEach(function(t){
      h+='<button data-tool="'+t[0]+'" style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;min-width:56px;">';
      h+='<span class="material-icons" style="font-size:20px;color:#059669;">'+t[1]+'</span>';
      h+='<span style="font-size:9px;font-weight:700;color:#0f172a;white-space:nowrap;">'+t[2]+'</span></button>';
    });
    h+='</div></div>';
    h+='<div id="adt-result" style="flex:1;overflow-y:auto;background:#f1f5f9;padding:10px;display:none;">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
    h+='<span style="font-size:10px;font-weight:800;color:#64748b;">HASIL</span>';
    h+='<button id="adt-copy" style="background:#059669;color:#fff;border:none;padding:4px 10px;border-radius:5px;font-size:9px;font-weight:700;cursor:pointer;">Salin</button></div>';
    h+='<pre id="adt-result-text" style="font-size:9px;color:#334155;white-space:pre-wrap;margin:0;font-family:monospace;line-height:1.4;background:#fff;padding:8px;border-radius:6px;border:1px solid #e2e8f0;user-select:text;"></pre></div>';
    p.innerHTML=h; document.body.appendChild(p);
    document.getElementById('adt-close').addEventListener('click',function(){self.toggle();});
    document.getElementById('adt-fullscreen').addEventListener('click',function(){self.toggleFullscreen();});
    document.getElementById('adt-copy').addEventListener('click',function(){self.copyResult();});
    this.initDrag();
    p.querySelectorAll('[data-tool]').forEach(function(btn){ btn.addEventListener('click',function(){ self.run(btn.dataset.tool); }); });
  },

  initDrag:function(){
    var header=document.getElementById('adt-header'), panel=document.getElementById('adt-panel');
    if(!header||!panel)return;
    var drag=false,sy=0,st=0;
    var dn=function(e){drag=true;sy=(e.clientY||(e.touches&&e.touches[0].clientY))||0;st=panel.getBoundingClientRect().top;panel.style.transition='none';e.preventDefault();};
    var mv=function(e){if(!drag)return;var cy=e.clientY||(e.touches&&e.touches[0].clientY);if(!cy)return;var nt=st+(cy-sy);panel.style.top=Math.max(60,Math.min(nt,innerHeight-200))+'px';panel.style.bottom='auto';};
    var up=function(){if(drag){drag=false;panel.style.transition='';}};
    header.addEventListener('mousedown',dn); header.addEventListener('touchstart',dn,{passive:false});
    document.addEventListener('mousemove',mv); document.addEventListener('touchmove',mv,{passive:false});
    document.addEventListener('mouseup',up); document.addEventListener('touchend',up);
  },

  toggle:function(){ this.open=!this.open; document.getElementById('adt-panel').style.display=this.open?'flex':'none'; },
  toggleFullscreen:function(){
    this.fullscreen=!this.fullscreen;
    var p=document.getElementById('adt-panel'), f=document.getElementById('adt-fullscreen');
    if(this.fullscreen){ p.style.cssText='position:fixed;left:0;right:0;top:0;bottom:0;width:100%;height:100%;max-height:none;z-index:2147483647;display:flex;flex-direction:column;overflow:hidden;border-radius:0;'; f.innerHTML='<span class="material-icons" style="font-size:18px;">fullscreen_exit</span>'; }
    else { p.style.cssText='position:fixed;left:8px;right:8px;bottom:80px;top:50%;max-height:60vh;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.25);z-index:2147483641;display:flex;flex-direction:column;overflow:hidden;border:1px solid #e2e8f0;'; f.innerHTML='<span class="material-icons" style="font-size:18px;">fullscreen</span>'; }
  },

  show:function(t){ var r=document.getElementById('adt-result'),x=document.getElementById('adt-result-text'); if(r&&x){x.textContent=t;r.style.display='block';} },
  showHTML:function(h){ var r=document.getElementById('adt-result'),x=document.getElementById('adt-result-text'); if(r&&x){x.innerHTML=h;r.style.display='block';} },
  copyResult:function(){ var t=document.getElementById('adt-result-text'); if(!t)return; var x=t.innerText;
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(x);
    else { var ta=document.createElement('textarea'); ta.value=x; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } },

  run:function(id){ var m={
    devlive:function(){DT.tDevlive();}, history:function(){DT.tHistory();}, jscheck:function(){DT.tJs();},
    logs:function(){DT.tLogs();}, integration:function(){DT.tIntegration();}, fbcheck:function(){DT.tFb();},
    state:function(){DT.tState();}, fsquery:function(){DT.tQuery();}, lsinspect:function(){DT.tLs();},
    cookies:function(){DT.tCookies();}, network:function(){DT.tNetwork();}, dom:function(){DT.tDOM();},
    performance:function(){DT.tPerformance();}, screen:function(){DT.tScreen();}, eruda:function(){DT.tEruda();},
    pinhash:function(){DT.tPin();}, clearcache:function(){DT.tCache();}, clearls:function(){DT.tClearLs();},
    reload:function(){location.reload(true);} }; if(m[id])m[id](); },

  captureLogs:function(){ if(this._cap)return; this._cap=true; var s=this;
    ['log','info','warn','error'].forEach(function(k){ var o=console[k].bind(console);
      console[k]=function(){ var a=[]; for(var i=0;i<arguments.length;i++){ var x=arguments[i]; try{a.push(typeof x==='object'?JSON.stringify(x):String(x));}catch(e){a.push(String(x));} }
        s.logs.push({t:Date.now(),type:k,msg:a.join(' ')}); if(s.logs.length>300)s.logs.shift(); o.apply(console,arguments); }; });
    window.addEventListener('error',function(e){ s.logs.push({t:Date.now(),type:'error',msg:'ERR: '+e.message}); });
    window.addEventListener('unhandledrejection',function(e){ s.logs.push({t:Date.now(),type:'error',msg:'REJECT: '+((e.reason&&e.reason.message)||e.reason)}); }); },

  tLogs:function(){ if(!this.logs.length){this.show('(belum ada log)');return;}
    var o='CONSOLE ('+this.logs.length+')\n'+'═'.repeat(36)+'\n';
    this.logs.slice(-60).forEach(function(l){ o+='['+new Date(l.t).toLocaleTimeString('id-ID')+'] '+l.type.toUpperCase()+': '+l.msg+'\n'; });
    this.show(o); },

  tEruda:function(){ if(window.eruda){eruda.show();this.show('Eruda aktif');return;} this.show('Memuat Eruda...');
    var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/eruda';
    var self=this; s.onload=function(){try{eruda.init();eruda.show();self.show('Eruda aktif');}catch(e){self.show('Error: '+e.message);}};
    s.onerror=function(){self.show('CDN gagal');}; document.head.appendChild(s); },

  // CEK JS (global siswa)
  tJs:function(){
    var checks=[
      ['firebase','object','Firebase SDK'],['db','object','Firestore instance'],
      ['hashPin','function','js/hash.js'],['verifyPin','function','js/hash.js'],
      ['M','object','js/modal.js'],['toast','function','js/modal.js'],
      ['PS','object','js/s/state.js'],
      ['loadDashboard','function','js/s/dashboard.js'],['loadSessions','function','js/s/dashboard.js'],
      ['startSession','function','js/s/test.js'],['answerPGS','function','js/s/test.js'],
      ['answerMCMA','function','js/s/test.js'],['answerPGK','function','js/s/test.js'],
      ['submitTest','function','js/s/test.js'],['toggleFlag','function','js/s/test.js'],
      ['showResult','function','js/s/result.js'],['reviewAnswers','function','js/s/result.js'],
      ['openFeedback','function','js/s/feedback.js'],['openProfile','function','js/s/profile.js']
    ];
    var ok=0, html='<div style="font-size:10px;font-weight:800;margin-bottom:6px;">CEK JS (SISWA)</div>';
    html+='<table style="width:100%;border-collapse:collapse;font-size:9px;background:#fff;border-radius:6px;overflow:hidden;">';
    html+='<thead><tr style="background:#0f172a;color:#fff;"><th style="padding:4px 3px;text-align:left;">Name</th><th style="padding:4px 3px;">File</th><th style="padding:4px 3px;">St</th></tr></thead><tbody>';
    checks.forEach(function(c){ var ex=typeof window[c[0]]!==undefined; var tm=typeof window[c[0]]===c[1]; if(tm)ok++;
      html+='<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:3px;font-weight:600;">'+c[0]+'</td><td style="padding:3px;font-size:8px;color:#64748b;">'+c[2]+'</td><td style="padding:3px;text-align:center;">'+(tm?'<span style="color:#16a34a;font-weight:800;">OK</span>':(ex?'<span style="color:#f59e0b;">TYPE</span>':'<span style="color:#94a3b8;">MISS</span>'))+'</td></tr>'; });
    html+='</tbody></table>';
    html+='<div style="margin-top:6px;text-align:center;font-weight:700;color:'+(ok===checks.length?'#16a34a':'#f59e0b')+';">'+ok+'/'+checks.length+' LOADED</div>';
    this.showHTML(html); },

  tFb:function(){ this.show('Menguji Firebase...'); if(typeof window.db==='undefined'){this.show('db tidak ditemukan');return;}
    var o='FIREBASE (project: jec-extka)\n'+'═'.repeat(36)+'\n';
    var cols=['students','sessions','questions','attempts','feedback','settings'];
    var ch=Promise.resolve(); var self=this;
    cols.forEach(function(c){ ch=ch.then(function(){ return window.db.collection(c).limit(1).get().then(function(s){ o+='[OK] '+c+' ('+s.size+')\n'; }).catch(function(e){ o+='[XX] '+c+': '+e.message+'\n'; }); }); });
    ch.then(function(){ self.show(o); }); },

  tState:function(){ var o='STATE (SISWA)\n'+'═'.repeat(36)+'\n';
    o+='Session: '+(sessionStorage.getItem('student_session')||'none')+'\n';
    o+='URL: '+location.href+'\n';
    o+='Window.PS: '+(window.PS?'exists':'missing')+'\n';
    if(window.PS){ o+='PS.user: '+JSON.stringify(window.PS.user)+'\n'; o+='PS.questions: '+(window.PS.questions||[]).length+'\n'; o+='PS.currentIndex: '+window.PS.currentIndex+'\n'; o+='PS.attemptId: '+(window.PS.attemptId||'-')+'\n'; }
    this.show(o); },

  tQuery:function(){ var self=this;
    Promise.resolve(this.mp('Collection (students/sessions/questions/attempts/feedback/settings):','sessions')).then(function(col){
      if(!col)return;
      Promise.resolve(self.mp('Limit:','3')).then(function(l){
        var lim=parseInt(l)||3; self.show('Query '+col+'...');
        window.db.collection(col).limit(lim).get().then(function(s){
          var o=col+' ('+s.size+')\n'+'═'.repeat(36)+'\n'; if(s.empty)o+='(kosong)';
          s.forEach(function(d){ o+='\n['+d.id+']\n'+JSON.stringify(d.data(),null,1)+'\n'; });
          self.show(o);
        }).catch(function(e){ self.show('Error: '+e.message); });
      });
    }); },

  tLs:function(){ var self=this;
    var o='LOCALSTORAGE ('+localStorage.length+')\n'+'═'.repeat(36)+'\n';
    for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);var v=localStorage.getItem(k);o+=k+' = '+(v.length>80?v.slice(0,80)+'…':v)+'\n';}
    o+='\nSESSIONSTORAGE ('+sessionStorage.length+')\n'+'═'.repeat(36)+'\n';
    for(var j=0;j<sessionStorage.length;j++){var k2=sessionStorage.key(j);var v2=sessionStorage.getItem(k2);o+=k2+' = '+(v2.length>80?v2.slice(0,80)+'…':v2)+'\n';}
    this.show(o);
    Promise.resolve(this.mp('Hapus key (kosong=batal):','')).then(function(d){ if(d){localStorage.removeItem(d);sessionStorage.removeItem(d);self.tLs();} }); },

  tPin:function(){ var self=this;
    Promise.resolve(this.mp('PIN:','1234')).then(function(pin){ if(!pin)return;
      if(typeof window.hashPin!=='function'){self.show('hashPin tidak tersedia');return;}
      window.hashPin(pin).then(function(h){ self.show('HASH PIN\n'+'═'.repeat(36)+'\nPIN: '+pin+'\nHash: '+h); }); }); },

  tCache:function(){ var self=this; this.show('Clearing...'); var done=[];
    var p1=(typeof caches!=='undefined')?caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});if(ks.length)done.push('Cache: '+ks.length);}).catch(function(){}):Promise.resolve();
    var p2=(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations)?navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});if(rs.length)done.push('SW: '+rs.length);}).catch(function(){}):Promise.resolve();
    Promise.all([p1,p2]).then(function(){ self.show('Done\n'+(done.join('\n')||'(tidak ada)')); }); },

  tClearLs:function(){ if(!confirm('Hapus SEMUA localStorage & sessionStorage?\nSession login siswa akan hilang.'))return;
    var n=localStorage.length; try{localStorage.clear();sessionStorage.clear();}catch(e){}
    this.show(n+' key dihapus. Reload...'); setTimeout(function(){location.reload();},800); },

  tIntegration:function(){
    var scripts=[
      {f:'js/fc.js',g:'db',n:'Firebase Core'},{f:'js/hash.js',g:'hashPin',n:'Hash'},
      {f:'js/modal.js',g:'M',n:'Modal'},{f:'js/s/state.js',g:'PS',n:'State'},
      {f:'js/s/login.js',g:null,n:'Login'},{f:'js/s/dashboard.js',g:'loadDashboard',n:'Dashboard'},
      {f:'js/s/test.js',g:'startSession',n:'Test'},{f:'js/s/result.js',g:'showResult',n:'Result'},
      {f:'js/s/feedback.js',g:'openFeedback',n:'Feedback'},{f:'js/s/profile.js',g:'openProfile',n:'Profile'},
      {f:'js/s/s-devtools.js',g:'DT',n:'DevTools (this)'}
    ];
    var loaded=Array.from(document.querySelectorAll('script[src]')).map(function(s){return s.src.split('/').pop().split('?')[0];});
    var html='<div style="font-size:10px;font-weight:800;margin-bottom:6px;">INTEGRATION (SISWA)</div>';
    html+='<table style="width:100%;border-collapse:collapse;font-size:9px;background:#fff;border-radius:6px;overflow:hidden;">';
    html+='<thead><tr style="background:#0f172a;color:#fff;"><th style="padding:4px 3px;text-align:left;">File</th><th style="padding:4px 3px;">Global</th><th style="padding:4px 3px;">St</th></tr></thead><tbody>';
    scripts.forEach(function(s,i){ var isL=loaded.indexOf(s.f.split('/').pop())!==-1; var isG=s.g?(window[s.g]!==undefined):true;
      var st=(isL&&isG)?'<span style="color:#16a34a;font-weight:800;">WORK</span>':(isL?'<span style="color:#f59e0b;">LOAD</span>':'<span style="color:#dc2626;">MISS</span>');
      html+='<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:3px;font-weight:600;">'+(i+1)+'. '+s.f+'</td><td style="padding:3px;text-align:center;color:#059669;font-size:8px;">'+(s.g||'-')+'</td><td style="padding:3px;text-align:center;">'+st+'</td></tr>'; });
    html+='</tbody></table>'; this.showHTML(html); },

  tDevlive:function(){ if(this.devliveData.length)this.renderTable(); this.autoScan(false); },

  tHistory:function(){ var self=this; this.show('Memindai riwayat update file siswa...');
    var results=[]; var idx=0;
    var next=function(){ if(idx>=STUDENT_FILES.length){ renderAll(); return; }
      var f=STUDENT_FILES[idx++];
      fetch(f+'?_t='+Date.now(),{cache:'no-store'}).then(function(r){ if(!r.ok)throw new Error(r.status); return r.text(); })
        .then(function(text){ var i=self.parseInfo(text,f); results.push({file:f,path:i.path,version:i.version,ts:i.ts,hasHeader:i.hasHeader,note:self.extractNote(text)}); next(); })
        .catch(function(e){ results.push({file:f,path:f,version:'-',ts:0,hasHeader:false,note:'Gagal ('+e.message+')'}); next(); }); };
    next();
    function renderAll(){ results.sort(function(a,b){return b.ts-a.ts;});
      var html='<div style="font-size:10px;font-weight:800;margin-bottom:6px;">RIWAYAT UPDATE FILE (SISWA)</div>';
      html+='<table style="width:100%;border-collapse:collapse;font-size:9px;background:#fff;border-radius:6px;overflow:hidden;">';
      html+='<thead><tr style="background:#0f172a;color:#fff;"><th style="padding:4px 3px;text-align:left;">FILE</th><th style="padding:4px 3px;">VER</th><th style="padding:4px 3px;">UPDATE</th></tr></thead><tbody>';
      results.forEach(function(r){ var ic=r.hasHeader?'✅':'⚠️';
        html+='<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:4px 3px;font-weight:600;">'+ic+' '+r.path+'</td><td style="padding:4px 3px;text-align:center;color:#059669;font-weight:700;">'+r.version+'</td><td style="padding:4px 3px;text-align:center;white-space:nowrap;">'+self.fmtTs(r.ts)+'</td></tr>'; });
      html+='</tbody></table>'; self.showHTML(html); } },

  autoScan:function(silent){ var self=this;
    Promise.resolve().then(function(){ return self.scan(); }).then(function(){
      self.lastAuto=new Date(); if(!silent)self.renderTable();
      var b=document.getElementById('adt-badge'); if(b)b.textContent=self.devliveData.filter(function(r){return r.status==='connect';}).length+'✅'; }); },

  parseInfo:function(text,file){ var head=(text||'').split('\n').slice(0,10).join('\n'); var path=file;
    var mR=head.match(/#root\s*:\s*([^\s|]+)/i), mP=head.match(/#path\s*:\s*root\/([^\s|]+)/i), mI=head.match(/^[\/\*<!\-#\s]*#(\d+)\s*\|\s*([^\s|]+)/i);
    if(mR)path=mR[1].trim(); else if(mP)path=mP[1].trim(); else if(mI)path=mI[2].trim();
    var vm=head.match(/v(?:ersion)?[:\s•]*([0-9]+(?:\.[0-9]+)+)/i);
    var um=head.match(/update[d]?[:\s•]*([^|\n]+)/i)||head.match(/u\s+([^|\n]+)/i);
    var ts=0; if(um){ var dm=um[1].match(/(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/); if(dm){ var yy=+dm[3]; if(yy<100)yy+=2000; var tm=um[1].match(/(\d{2}):(\d{2}):(\d{2})/); ts=new Date(yy,+dm[2]-1,+dm[1],tm?+tm[1]:0,tm?+tm[2]:0,tm?+tm[3]:0).getTime(); } }
    return { path:path, version:vm?vm[1]:'-', ts:ts, hasHeader:!!(vm||um||mR||mP||mI) }; },

  extractNote:function(text){ var head=(text||'').split('\n').slice(0,5).join('\n'); var m=head.match(/note\s*:\s*([^\n]+)/i); if(m)return m[1].replace(/\-\->/g,'').replace(/\*-->/g,'').trim(); return ''; },

  scan:function(){ var self=this; var res=[]; var idx=0;
    return new Promise(function(resolve){ var next=function(){ if(idx>=self.devliveFiles.length){ res.sort(function(a,b){return b.ts-a.ts;}); self.devliveData=res; resolve(); return; }
      var f=self.devliveFiles[idx++];
      fetch(f+(f.indexOf('?')>-1?'&':'?')+'_dl='+Date.now(),{cache:'no-store'}).then(function(r){ if(!r.ok)throw new Error(r.status); return r.text(); })
        .then(function(t){ var i=self.parseInfo(t,f); res.push(Object.assign({file:f,status:i.hasHeader?'connect':'no-header'},i)); }).catch(function(){ res.push({file:f,path:f,version:'-',ts:0,status:'missing'}); }).then(next); };
      next(); }); },

  fmtTs:function(ts){ if(!ts)return'-'; var d=new Date(ts),p=function(n){return String(n).padStart(2,'0');}; return p(d.getDate())+'/'+p(d.getMonth()+1)+' '+p(d.getHours())+':'+p(d.getMinutes()); },

  renderTable:function(){ var self=this; var ok=this.devliveData.filter(function(r){return r.status==='connect';}).length;
    var ico={connect:'✅','no-header':'⚠️',missing:'❌'};
    var h='<div style="font-size:9px;margin-bottom:4px;background:#fff;padding:5px 6px;border-radius:5px;display:flex;align-items:center;gap:4px;">';
    h+='<span class="material-icons" style="font-size:12px;color:#16a34a;">sensors</span><b>DevLive Siswa</b>';
    h+='<span style="color:#16a34a;font-weight:800;">✅ '+ok+'/'+this.devliveData.length+'</span>';
    h+='<span id="devlive-clock" style="font-weight:700;color:#059669;font-family:monospace;">--:--:--</span></div>';
    h+='<table style="width:100%;border-collapse:collapse;font-size:8px;background:#fff;border-radius:6px;overflow:hidden;"><thead><tr style="background:#0f172a;color:#fff;"><th style="padding:3px 2px;text-align:left;">FILE</th><th style="padding:3px 2px;">VER</th><th style="padding:3px 2px;">UPDATE</th><th style="padding:3px 2px;">ST</th></tr></thead><tbody>';
    this.devliveData.forEach(function(r,i){ h+='<tr style="border-bottom:1px solid #e2e8f0;'+(i===0&&r.ts>0?'background:#f0fdf4;':'')+'">';
      h+='<td style="padding:3px 2px;font-weight:600;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+r.path+'</td>';
      h+='<td style="padding:3px 2px;text-align:center;color:#059669;font-weight:700;">'+r.version+'</td>';
      h+='<td style="padding:3px 2px;text-align:center;white-space:nowrap;color:#64748b;">'+self.fmtTs(r.ts)+'</td>';
      h+='<td style="padding:3px 2px;text-align:center;">'+(ico[r.status]||'?')+'</td></tr>'; });
    h+='</tbody></table>'; this.showHTML(h); },

  tCookies:function(){ var c=document.cookie.split(';').map(function(x){return x.trim();});
    if(!c.length||(c.length===1&&c[0]==='')){this.show('Tidak ada cookie.');return;}
    var html='<table style="width:100%;border-collapse:collapse;font-size:9px;background:#fff;"><thead><tr style="background:#0f172a;color:#fff;"><th style="padding:4px 3px;text-align:left;">Name</th><th style="padding:4px 3px;text-align:left;">Value</th></tr></thead><tbody>';
    c.forEach(function(x){ var p=x.split('='); html+='<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:3px;font-weight:600;">'+p.shift()+'</td><td style="padding:3px;word-break:break-all;font-size:8px;">'+p.join('=')+'</td></tr>'; });
    html+='</tbody></table>'; this.showHTML(html); },

  tNetwork:function(){ var conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    var html='<table style="width:100%;border-collapse:collapse;font-size:9px;background:#fff;">';
    html+='<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:4px 3px;font-weight:600;">Online</td><td style="padding:4px 3px;">'+(navigator.onLine?'<b style="color:#16a34a;">YES</b>':'<b style="color:#dc2626;">NO</b>')+'</td></tr>';
    if(conn){ html+='<tr><td style="padding:4px 3px;">Type</td><td style="padding:4px 3px;">'+(conn.effectiveType||'?')+'</td></tr><tr><td style="padding:4px 3px;">Downlink</td><td style="padding:4px 3px;">'+(conn.downlink||'?')+' Mbps</td></tr>'; }
    html+='<tr><td style="padding:4px 3px;">Host</td><td style="padding:4px 3px;">'+location.host+'</td></tr></table>'; this.showHTML(html); },

  tDOM:function(){ var html='<table style="width:100%;border-collapse:collapse;font-size:9px;background:#fff;">';
    html+='<tr><td style="padding:4px 3px;font-weight:600;">Total Elements</td><td style="padding:4px 3px;">'+document.querySelectorAll('*').length+'</td></tr>';
    html+='<tr><td style="padding:4px 3px;">Scripts</td><td style="padding:4px 3px;">'+document.querySelectorAll('script').length+'</td></tr>';
    html+='<tr><td style="padding:4px 3px;">Links</td><td style="padding:4px 3px;">'+document.querySelectorAll('link').length+'</td></tr></table>'; this.showHTML(html); },

  tPerformance:function(){ var html='<table style="width:100%;border-collapse:collapse;font-size:9px;background:#fff;">';
    if(performance.memory){ html+='<tr><td style="padding:4px 3px;">Heap Used</td><td style="padding:4px 3px;">'+(performance.memory.usedJSHeapSize/1048576).toFixed(2)+' MB</td></tr>'; }
    var nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
    if(nav){ html+='<tr><td style="padding:4px 3px;">DOM Complete</td><td style="padding:4px 3px;">'+nav.domComplete.toFixed(0)+' ms</td></tr>'; }
    html+='</table>'; this.showHTML(html); },

  tScreen:function(){ var html='<table style="width:100%;border-collapse:collapse;font-size:9px;background:#fff;">';
    html+='<tr><td style="padding:4px 3px;">Screen</td><td style="padding:4px 3px;">'+screen.width+'x'+screen.height+'</td></tr>';
    html+='<tr><td style="padding:4px 3px;">Viewport</td><td style="padding:4px 3px;">'+innerWidth+'x'+innerHeight+'</td></tr>';
    html+='<tr><td style="padding:4px 3px;">DPR</td><td style="padding:4px 3px;">'+devicePixelRatio+'</td></tr></table>'; this.showHTML(html); }
};

window.DT = DT;
try{ if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',function(){DT.init();}); } else { DT.init(); } }
catch(e){ var d=document.createElement('div'); d.style.cssText='position:fixed;bottom:8px;right:8px;background:#dc2626;color:#fff;padding:8px 12px;border-radius:8px;z-index:2147483647;font:700 11px sans-serif;'; d.textContent='❌ s-devtools error: '+(e.message||e); document.body.appendChild(d); }
})();