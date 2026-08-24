// js/c.js
// ==========================================
// DevTools: Eruda mobile console + penangkap error + cek integrasi antar file
// ==========================================
const DevTools = {
    erudaLoaded: false,
    errors: [],

    // Tangkap error runtime & promise reject
    initErrorCatcher: function() {
        window.addEventListener('error', (e) => { this.errors.push(e.message); });
        window.addEventListener('unhandledrejection', (e) => {
            this.errors.push('Promise: ' + ((e.reason && e.reason.message) || e.reason));
        });
    },

    // Muat Eruda (console mobile)
    loadEruda: function(cb) {
        if (window.eruda) {
            if (!this.erudaLoaded) { eruda.init(); this.erudaLoaded = true; }
            cb && cb(true); return;
        }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/eruda@3.4.1/eruda.js';
        s.onload = () => { eruda.init(); this.erudaLoaded = true; cb && cb(true); };
        s.onerror = () => cb && cb(false);
        document.head.appendChild(s);
    },

    showConsole: function() { this.loadEruda(ok => { if (ok && window.eruda) eruda.show(); }); },
    hideConsole: function() { if (window.eruda) eruda.hide(); },
    toggleConsole: function() {
        if (!window.eruda) { this.showConsole(); return; }
        const el = document.getElementById('eruda');
        if (el && el.style.display !== 'none') eruda.hide(); else eruda.show();
    },

    // ==========================================
    // CEK INTEGRASI ANTAR FILE
    // ==========================================
    check: async function() {
        const R = [];
        const add = (name, ok, detail) => R.push({ name, ok: !!ok, detail: detail || '' });

        add('Firebase SDK', typeof firebase !== 'undefined', typeof firebase === 'undefined' ? 'SDK belum dimuat di HTML' : '');
        add('firebase-config.js (db)', typeof db !== 'undefined', typeof db === 'undefined' ? 'Variabel db tidak ada' : 'Firestore siap');
        add('hash.js (SecurityUtil)', typeof SecurityUtil !== 'undefined', typeof SecurityUtil === 'undefined' ? 'hash.js belum dimuat' : '');
        add('modal.js (Modal)', typeof Modal !== 'undefined', typeof Modal === 'undefined' ? 'modal.js belum dimuat' : '');
        add('app-admin.js (AdminApp)', typeof AdminApp !== 'undefined', typeof AdminApp === 'undefined' ? 'app-admin.js belum dimuat (halaman siswa?)' : '');
        add('c.js (DevTools)', true, 'Aktif');

        // Koneksi Firestore (read test)
        if (typeof db !== 'undefined') {
            try { await db.collection('admins').limit(1).get(); add('Koneksi Firestore (Read)', true, 'Read OK'); }
            catch (e) { add('Koneksi Firestore (Read)', false, e.message); }
        } else add('Koneksi Firestore (Read)', false, 'db tidak tersedia');

        // Elemen HTML admin yang wajib ada
        const ids = ['view-login', 'view-dashboard', 'panel-overview', 'panel-users', 'panel-soal', 'panel-review', 'panel-settings', 'bottom-nav'];
        const missing = ids.filter(i => !document.getElementById(i));
        add('Elemen HTML admin', missing.length === 0, missing.length ? ('Hilang: ' + missing.join(', ')) : 'Lengkap');

        // Error runtime yang tertangkap
        add('Runtime Errors', this.errors.length === 0, this.errors.length ? (this.errors.length + ' error: ' + this.errors.slice(-3).join(' | ')) : 'Tidak ada error');

        return R;
    },

    // Render hasil ke container
    render: function(results, container) {
        container.innerHTML = results.map(r => `
            <div style="display:flex;gap:10px;align-items:center;padding:12px;border-bottom:1px solid #eee;background:#fff;">
                <span class="material-symbols-rounded" style="color:${r.ok ? '#4CAF50' : '#F44336'};">${r.ok ? 'check_circle' : 'cancel'}</span>
                <div style="flex:1;"><strong style="font-size:.9rem;">${r.name}</strong>
                ${r.detail ? `<div style="font-size:.78rem;color:#777;">${r.detail}</div>` : ''}</div>
            </div>`).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => DevTools.initErrorCatcher());