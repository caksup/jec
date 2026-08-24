// =====================================================
// js/admin-core.js
// Inti Panel Admin: konfigurasi, AI, session, navigasi, login, settings
// =====================================================

// ---------- KONFIGURASI GEMINI AI ----------
const GEMINI_API_KEY = "AQ.Ab8RN6Iy_zgBpb57OOwzghfzsF5Cw5goZUvJD804kyBsikiHLQ";
const GEMINI_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest"
];

// Memanggil Gemini dengan fallback + retry otomatis
async function callGemini(prompt) {
    let lastError = null;
    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        for (let attempt = 1; attempt <= 2; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.3, topP: 0.8, topK: 40, maxOutputTokens: 8192 }
                    })
                });
                clearTimeout(timeoutId);
                if (res.ok) return { data: await res.json(), model: model };

                const errData = await res.json().catch(() => ({}));
                const msg = (errData && errData.error && errData.error.message) ? errData.error.message : ('HTTP ' + res.status);
                if (res.status === 404) { lastError = new Error('[' + model + '] tidak tersedia.'); break; }
                if (res.status === 429 || res.status === 503) {
                    lastError = new Error('[' + model + '] ' + msg);
                    if (attempt === 1) { await new Promise(r => setTimeout(r, 2000)); continue; }
                    break;
                }
                throw new Error('[' + model + '] ' + msg);
            } catch (err) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') { lastError = new Error('[' + model + '] Timeout.'); continue; }
                if (err instanceof TypeError) { lastError = new Error('[' + model + '] Gagal koneksi.'); continue; }
                throw err;
            }
        }
    }
    throw lastError || new Error("Semua model Gemini sedang sibuk. Coba lagi.");
}


// ---------- OBJEK UTAMA AdminApp ----------
const AdminApp = {
    SESSION_KEY: 'jec_admin_session',
    CONFIG_DOC: 'config', // dokumen khusus settings (timer dll) di koleksi admins
    allSoal: [],
    studentMap: {},
    sessionsSnap: null,
    resultsSnap: null,

    init: function() {
        this.bindAuthEvents();
        this.bindNavigation();
        this.bindPills();
        this.bindSettings();         // BARU: timer + fullscreen
        this.bindUserManagement();   // admin-students.js
        this.bindSoalManagement();   // admin-soal.js
        this.bindReviewListeners();  // admin-review.js
        this.bindSoalListener();     // admin-soal.js
        this.bindOverviewListeners();// admin-review.js
        this.restoreSession();
    },

    // ---------- SESSION ----------
    saveSession: function(id) { try { localStorage.setItem(this.SESSION_KEY, JSON.stringify({ id: id, at: Date.now() })); } catch (e) {} },
    clearSession: function() { try { localStorage.removeItem(this.SESSION_KEY); } catch (e) {} },
    restoreSession: async function() {
        try {
            const raw = localStorage.getItem(this.SESSION_KEY);
            if (!raw) return;
            const sess = JSON.parse(raw);
            if (!sess || !sess.id) return;
            const doc = await db.collection('admins').doc(sess.id).get();
            if (doc.exists) { this.navigateView('view-dashboard'); this.switchPanel('panel-overview'); }
            else this.clearSession();
        } catch (e) { this.clearSession(); }
    },

    // ---------- NAVIGASI ----------
    navigateView: function(target) {
        document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
        const el = document.getElementById(target);
        if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
    },
    switchPanel: function(target) {
        document.querySelectorAll('.content-panel').forEach(p => p.classList.add('hidden'));
        const el = document.getElementById(target);
        if (el) el.classList.remove('hidden');
        document.querySelectorAll('.bnav-item').forEach(i => i.classList.toggle('active', i.dataset.target === target));
        if (target === 'panel-users') this.loadStudents();
    },
    bindNavigation: function() {
        document.querySelectorAll('.bnav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchPanel(e.currentTarget.dataset.target));
        });
    },

    // ---------- PILLS ----------
    bindPills: function() {
        const groups = [
            ['data-sistab', '.sistab'],
            ['data-soaltab', '.soaltab'],
            ['data-inputtab', '.inputtab'],
            ['data-reviewtab', '.reviewtab']
        ];
        groups.forEach(([attr, cls]) => {
            document.querySelectorAll('[' + attr + ']').forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.closest('.pill-bar').querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.querySelectorAll(cls).forEach(t => t.classList.add('hidden'));
                    const target = document.getElementById(btn.getAttribute(attr));
                    if (target) target.classList.remove('hidden');
                });
            });
        });
    },

    // ---------- SETTINGS: TIMER + FULLSCREEN (BARU) ----------
    bindSettings: function() {
        // Tombol fullscreen di header admin (icon saja)
        const fsBtn = document.getElementById('btn-fullscreen-admin');
        if (fsBtn) fsBtn.addEventListener('click', () => this.toggleFullscreen());

        // Simpan timer (menit)
        const saveTimer = document.getElementById('btn-save-timer');
        if (saveTimer) saveTimer.addEventListener('click', async () => {
            const val = parseInt(document.getElementById('set-timer').value) || 60;
            try {
                await db.collection('admins').doc(this.CONFIG_DOC).set({ timer: val }, { merge: true });
                Modal.toast('Tersimpan', 'Timer ujian: ' + val + ' menit.', 'success');
            } catch (err) {
                Modal.alert('Gagal menyimpan timer: ' + err.message, { type: 'danger' });
            }
        });

        // Muat timer saat ini ke input
        db.collection('admins').doc(this.CONFIG_DOC).get().then(d => {
            if (d.exists && d.data().timer) document.getElementById('set-timer').value = d.data().timer;
        }).catch(() => {});
    },

    // Toggle fullscreen (dipakai admin & bisa dipakai siswa)
    toggleFullscreen: function() {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else {
            const el = document.documentElement;
            if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        }
    },

    // Baca timer ujian (dipakai cbt-engine). Default 60 menit.
    getExamTimer: async function() {
        try {
            const d = await db.collection('admins').doc(this.CONFIG_DOC).get();
            if (d.exists && d.data().timer) return parseInt(d.data().timer) || 60;
        } catch (e) {}
        return 60;
    },

    // ---------- LOGIN / LOGOUT ----------
    bindAuthEvents: function() {
        const form = document.getElementById('form-login-admin');
        if (form) form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-login');
            const id = document.getElementById('adminId').value.trim();
            const pin = document.getElementById('adminPin').value.trim();
            btn.innerHTML = 'Memproses...'; btn.disabled = true;
            try {
                const hashedPin = await SecurityUtil.hashPin(pin);
                const doc = await db.collection('admins').doc(id).get();
                if (id === 'admin' && pin === '123456') {
                    if (!doc.exists) await db.collection('admins').doc(id).set({ nama: 'Super Admin', pin_hash: hashedPin, role: 'admin' });
                    this.saveSession(id);
                    this.navigateView('view-dashboard'); this.switchPanel('panel-overview');
                } else if (doc.exists && doc.data().pin_hash === hashedPin) {
                    this.saveSession(id);
                    this.navigateView('view-dashboard'); this.switchPanel('panel-overview');
                } else {
                    Modal.alert('Admin ID atau PIN Salah!', { type: 'danger', icon: 'lock' });
                }
            } catch (err) {
                Modal.alert('Gagal: ' + err.message, { type: 'danger' });
            } finally {
                btn.innerText = 'Masuk'; btn.disabled = false;
            }
        });

        document.getElementById('btn-logout').addEventListener('click', async () => {
            const ok = await Modal.confirm('Keluar dari Panel Admin?', { confirmLabel: 'Keluar', confirmClass: 'danger' });
            if (ok) { this.clearSession(); this.navigateView('view-login'); }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => AdminApp.init());