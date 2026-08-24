// js/app-student.js
const StudentApp = {
    currentUserId: null,
    currentUserData: null,
    SESSION_KEY: 'jec_student_session',

    init: function() {
        try {
            setTimeout(() => {
                const splash = document.getElementById('splash-screen');
                if (splash) { splash.style.opacity = '0'; setTimeout(() => { splash.classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); }, 500); }
            }, 2000);
        } catch(e) { document.getElementById('splash-screen').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); }
        this.bindEvents();
        this.restoreSession();
    },

    saveSession(u){ try{localStorage.setItem(this.SESSION_KEY,JSON.stringify({userId:u,at:Date.now()}));}catch(e){} },
    clearSession(){ try{localStorage.removeItem(this.SESSION_KEY);}catch(e){} },
    restoreSession: async function(){ try{ const raw=localStorage.getItem(this.SESSION_KEY); if(!raw)return; const s=JSON.parse(raw); if(!s||!s.userId)return;
        const d=await db.collection('students').doc(s.userId).get(); if(d.exists&&d.data().status!=='off'){ this.currentUserId=s.userId; this.currentUserData=d.data(); this.applyUserData(); this.navigate('view-dashboard'); Modal.toast('Selamat Datang Kembali','Session dipulihkan.','success'); } else this.clearSession(); }catch(e){this.clearSession();} },

    applyUserData(){ const d=this.currentUserData||{}; document.getElementById('display-student-name').innerText=d.nama_panggilan||d.nama||'Siswa'; document.getElementById('display-student-id').innerText=this.currentUserId; document.getElementById('display-student-school').innerText=d.asal_sekolah||'-'; },

    navigate(t){ document.querySelectorAll('.view-section').forEach(v=>{v.classList.add('hidden');v.classList.remove('active');}); const el=document.getElementById(t); if(el){el.classList.remove('hidden');el.classList.add('active');}
        if(t==='view-pilih-sesi')this.loadSesiList(); if(t==='view-history')this.loadHistory(); if(t==='view-profile')this.loadProfile(); },

    bindEvents(){
        const f=document.getElementById('form-login-student');
        if(f)f.addEventListener('submit',async e=>{ e.preventDefault(); const btn=document.getElementById('btn-login'); const id=document.getElementById('userId').value.trim(); const pin=document.getElementById('userPin').value.trim(); btn.innerText='Memproses...';btn.disabled=true;
            try{ const hp=await SecurityUtil.hashPin(pin); const d=await db.collection('students').doc(id).get();
                if(d.exists){ const data=d.data(); if(data.status==='off'){Modal.alert('Akun dinonaktifkan admin.',{type:'danger',icon:'block'});return;}
                    if(data.pin_hash===hp){ this.currentUserId=id; this.currentUserData=data; this.saveSession(id); this.applyUserData(); this.navigate('view-dashboard'); Modal.toast('Login Berhasil','Selamat datang, '+(data.nama_panggilan||data.nama),'success'); }
                    else Modal.alert('PIN Salah!',{type:'danger',icon:'lock'}); }
                else Modal.alert('ID tidak ditemukan!',{type:'danger',icon:'person_off'}); }
            catch(err){Modal.alert('Kesalahan: '+err.message,{type:'danger'});} finally{btn.innerText='Masuk Ujian';btn.disabled=false;} });

        document.getElementById('btn-logout').addEventListener('click',async()=>{ const ok=await Modal.confirm('Yakin keluar?',{confirmLabel:'Keluar',confirmClass:'danger'}); if(ok){this.clearSession();this.currentUserId=null;this.currentUserData=null;this.navigate('view-login');} });

        document.getElementById('menu-exam').addEventListener('click',()=>this.navigate('view-pilih-sesi'));
        document.getElementById('menu-history').addEventListener('click',()=>this.navigate('view-history'));
        document.getElementById('menu-profile').addEventListener('click',()=>this.navigate('view-profile'));

        document.getElementById('btn-finish-early').addEventListener('click',async()=>{ const ok=await Modal.confirm('Akhiri ujian sekarang?',{confirmLabel:'Akhiri',confirmClass:'danger'}); if(ok&&typeof CBTEngine!=='undefined')CBTEngine.submitExam(); });

        document.getElementById('btn-back-history').addEventListener('click',()=>{ document.getElementById('history-detail').classList.add('hidden'); document.getElementById('history-list').classList.remove('hidden'); document.getElementById('history-header-title').innerText='Riwayat Nilai'; });

        // ===== PROFILE: view <-> edit =====
        document.getElementById('btn-edit-profile').addEventListener('click',()=>{ this.setProfileMode(true); });
        document.getElementById('btn-cancel-profile').addEventListener('click',()=>{ this.setProfileMode(false); this.loadProfile(); });
        document.querySelectorAll('#emoji-picker span').forEach(sp=>sp.addEventListener('click',()=>{ document.getElementById('prof-avatar').innerText=sp.dataset.emoji; }));

        document.getElementById('btn-save-profile').addEventListener('click',async()=>{ if(!this.currentUserId)return;
            const up={
                nama_panggilan: document.getElementById('prof-nama').value.trim(),
                ttl: document.getElementById('prof-ttl').value.trim(),
                alamat: document.getElementById('prof-alamat').value.trim(),
                asal_sekolah: document.getElementById('prof-asal').value.trim(),
                kelas: document.getElementById('prof-kelas').value.trim(),
                kontak_wa: document.getElementById('prof-wa').value.trim(),
                avatar: document.getElementById('prof-avatar').innerText
            };
            try{ await db.collection('students').doc(this.currentUserId).update(up); Object.assign(this.currentUserData,up); this.applyUserData(); this.setProfileMode(false); this.loadProfile(); Modal.toast('Tersimpan','Profile diperbarui.','success'); }catch(err){Modal.alert('Gagal: '+err.message,{type:'danger'});} });
    },

    setProfileMode(edit){ document.getElementById('profile-view').classList.toggle('hidden', edit); document.getElementById('profile-edit').classList.toggle('hidden', !edit); },

    loadSesiList(){ const c=document.getElementById('sesi-list'); c.innerHTML='<p style="text-align:center;">Memuat sesi...</p>';
        db.collection('banksoal').get().then(snap=>{ const g={}; snap.forEach(doc=>{ const d=doc.data(); if((d.status||'on')!=='on')return; if((d.sesi_status||'on')!=='on')return; const k=d.sesi||'Sesi 1'; g[k]=(g[k]||0)+1; });
            c.innerHTML=''; const keys=Object.keys(g).sort(); if(!keys.length){ c.innerHTML='<div class="card-welcome" style="text-align:center;"><span class="material-symbols-rounded" style="font-size:3rem;color:var(--text-muted);">quiz</span><p>Belum ada sesi tersedia.</p></div>'; return; }
            keys.forEach(k=>{ const it=document.createElement('div'); it.className='sesi-item'; it.innerHTML=`<div class="sesi-icon"><span class="material-symbols-rounded">play_lesson</span></div><div class="sesi-info"><h4>${k}</h4><p>${g[k]} soal siap dikerjakan</p></div><span class="material-symbols-rounded" style="color:var(--text-muted);">chevron_right</span>`; it.onclick=()=>{ this.navigate('view-cbt'); if(typeof CBTEngine!=='undefined')CBTEngine.startExam(k); }; c.appendChild(it); });
        }).catch(err=>{ c.innerHTML='<p style="color:var(--danger);text-align:center;">Gagal: '+err.message+'</p>'; }); },

    loadHistory(){ const list=document.getElementById('history-list'); const det=document.getElementById('history-detail'); list.classList.remove('hidden'); det.classList.add('hidden'); list.innerHTML='<p style="text-align:center;">Memuat...</p>';
        db.collection('results').where('student_id','==',this.currentUserId).get().then(snap=>{ const docs=snap.docs.slice().sort((a,b)=>(b.data().submitted_at||0)-(a.data().submitted_at||0)); list.innerHTML='';
            if(!docs.length){ list.innerHTML='<div class="card-welcome" style="text-align:center;"><span class="material-symbols-rounded" style="font-size:3rem;color:var(--text-muted);">history</span><p>Belum ada riwayat.</p></div>'; return; }
            docs.forEach(doc=>{ const r=doc.data(); const sc=r.score||0; const cls=sc>=75?'good':(sc>=50?'mid':'bad'); const date=new Date(r.submitted_at).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
                const it=document.createElement('div'); it.className='history-item'; it.innerHTML=`<div class="history-score ${cls}">${sc}</div><div class="history-info"><h4>${r.kategori||'Latihan TKA'}</h4><p>${date} • Benar ${r.correct} • Salah ${r.incorrect}</p></div><span class="material-symbols-rounded" style="color:var(--text-muted);">chevron_right</span>`; it.onclick=()=>this.showHistoryDetail(doc.id); list.appendChild(it); });
        }).catch(err=>{ list.innerHTML='<p style="color:var(--danger);">Gagal: '+err.message+'</p>'; }); },

    showHistoryDetail(id){ db.collection('results').doc(id).get().then(doc=>{ if(!doc.exists)return; const r=doc.data();
        document.getElementById('history-list').classList.add('hidden'); document.getElementById('history-detail').classList.remove('hidden'); document.getElementById('history-header-title').innerText='Review Soal';
        const qs=r.questions||[]; const ans=r.answers||{}; let html=`<div class="card-welcome" style="text-align:center;margin-bottom:15px;"><p style="font-size:2.5rem;font-weight:800;color:var(--primary);margin:0;">${r.score}</p><p style="font-size:.85rem;color:var(--text-muted);">Benar ${r.correct} • Salah ${r.incorrect} • Kosong ${r.unanswered}</p></div>`;
        qs.forEach((q,i)=>{ const ua=ans[i]||null; const ok=ua&&ua===q.jawaban_benar; const empty=!ua; const st=empty?'empty':(ok?'correct':'wrong'); const ic=empty?'help_outline':(ok?'check_circle':'cancel');
            let opts=''; Object.keys(q.opsi||{}).forEach(k=>{ let cls='',icon=''; if(k===q.jawaban_benar){cls='is-correct';icon='check_circle';} else if(k===ua){cls='is-wrong';icon='cancel';} opts+=`<div class="review-opt ${cls}"><strong>${k}.</strong><span>${q.opsi[k]}</span>${icon?`<span class="material-symbols-rounded" style="margin-left:auto;">${icon}</span>`:''}</div>`; });
            html+=`<div class="review-item ${st}"><div class="review-q"><span class="material-symbols-rounded" style="vertical-align:middle;font-size:20px;">${ic}</span> Soal ${i+1}: ${q.pertanyaan}</div>${opts}</div>`; });
        document.getElementById('history-detail-content').innerHTML=html;
    }).catch(err=>Modal.alert('Gagal: '+err.message,{type:'danger'})); },

    // Isi mode VIEW (teks) + mode EDIT (input) - biodata lengkap
    loadProfile(){ const d=this.currentUserData||{};
        // avatar & header
        document.getElementById('prof-avatar').innerText=d.avatar||'👦';
        document.getElementById('prof-name-display').innerText=d.nama_panggilan||d.nama||'-';
        document.getElementById('prof-id').innerText=this.currentUserId;
        document.getElementById('prof-class').innerText=d.kelas||'-';
        // mode view (teks)
        document.getElementById('v-namalengkap').innerText=d.nama||'-';
        document.getElementById('v-nama').innerText=d.nama_panggilan||'-';
        document.getElementById('v-ttl').innerText=d.ttl||'-';
        document.getElementById('v-alamat').innerText=d.alamat||'-';
        document.getElementById('v-asal').innerText=d.asal_sekolah||'-';
        document.getElementById('v-kelas').innerText=d.kelas||'-';
        document.getElementById('v-wa').innerText=d.kontak_wa||'-';
        // mode edit (input)
        document.getElementById('prof-nama').value=d.nama_panggilan||'';
        document.getElementById('prof-ttl').value=d.ttl||'';
        document.getElementById('prof-alamat').value=d.alamat||'';
        document.getElementById('prof-asal').value=d.asal_sekolah||'';
        document.getElementById('prof-kelas').value=d.kelas||'';
        document.getElementById('prof-wa').value=d.kontak_wa||'';
        this.setProfileMode(false); }
};
document.addEventListener('DOMContentLoaded',()=>StudentApp.init());