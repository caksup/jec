// =====================================================
// js/admin-review.js
// Pembahasan (materi + nav nomor), Review Siswa agregat, Overview
// Menambahkan method ke objek AdminApp (dari admin-core.js)
// =====================================================

Object.assign(AdminApp, {

    // ---------- MATERI & PEMBAHASAN (dengan nav nomor kiri) ----------
    renderReview: function() {
        const filter = document.getElementById('review-kategori-filter').value;
        const nav = document.getElementById('materi-qnav');
        const container = document.getElementById('review-soal-container');

        let list = this.allSoal.slice().sort((a, b) =>
            (a.sesi || '').localeCompare(b.sesi || '') || (a.nomor || 0) - (b.nomor || 0));
        if (filter) list = list.filter(s => (s.sesi || 'Sesi 1') === filter);

        nav.innerHTML = '';
        let html = '';

        list.forEach((s, idx) => {
            // Kartu soal + pembahasan
            html += `
                <div class="review-card" id="mat-card-${idx}">
                    <div class="q">
                        <span class="badge-nomor">No.${s.nomor || '-'}</span>
                        <span class="badge-kategori">${s.sesi || 'Sesi 1'}</span>
                        <span class="badge-jenis">${s.jenis || 'Umum'}</span><br>
                        ${(s.pertanyaan || '').replace(/\n/g, '<br>')}
                    </div>
                    <div class="opts">A. ${s.opsi.A}<br>B. ${s.opsi.B}<br>C. ${s.opsi.C}<br>D. ${s.opsi.D}</div>
                    <div class="answer">Kunci: ${s.jawaban_benar}</div>
                    <div class="pembahasan"><strong>Pembahasan:</strong><br>${(s.pembahasan || '-').replace(/\n/g, '<br>')}</div>
                </div>`;

            // Nav nomor vertikal kiri (klik = lompat ke soal)
            const n = document.createElement('div');
            n.className = 'qn';
            n.innerText = idx + 1;
            n.onclick = () => {
                const el = document.getElementById('mat-card-' + idx);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
            nav.appendChild(n);
        });

        container.innerHTML = html || '<p>Tidak ada soal.</p>';
    },

    // ---------- REVIEW SISWA AGREGAT (1 soal -> semua siswa) ----------
    bindReviewListeners: function() {
        document.getElementById('review-sesi').addEventListener('change', () => this.renderReviewSiswa());
    },

    // Isi dropdown sesi (dari hasil yang ada)
    populateReviewSesi: function() {
        if (!this.resultsSnap) return;
        const set = [...new Set(this.resultsSnap.docs.map(d => d.data().kategori || ''))].filter(Boolean).sort();
        const sel = document.getElementById('review-sesi');
        const cur = sel.value;
        sel.innerHTML = '<option value="">Pilih Sesi</option>';
        set.forEach(k => sel.innerHTML += `<option value="${k}">${k}</option>`);
        sel.value = cur;
    },

    // Render tabel: No | Kunci | daftar jawaban semua siswa
    renderReviewSiswa: function() {
        const sesi = document.getElementById('review-sesi').value;
        const nav = document.getElementById('review-qnav');
        const box = document.getElementById('review-siswa-container');

        if (!sesi || !this.resultsSnap) { nav.innerHTML = ''; box.innerHTML = '<p>Pilih sesi.</p>'; return; }

        // Ambil hasil TERBARU tiap siswa di sesi ini
        const perStudent = {};
        this.resultsSnap.forEach(doc => {
            const r = doc.data();
            if (r.kategori !== sesi) return;
            const sid = r.student_id;
            if (!perStudent[sid] || r.submitted_at > perStudent[sid].submitted_at) perStudent[sid] = r;
        });
        const results = Object.values(perStudent);
        if (!results.length) { nav.innerHTML = ''; box.innerHTML = '<p>Belum ada hasil di sesi ini.</p>'; return; }

        // Template soal = hasil dengan jumlah soal terbanyak
        let template = results[0];
        results.forEach(r => { if ((r.questions || []).length > (template.questions || []).length) template = r; });
        const questions = template.questions || [];

        nav.innerHTML = '';
        let rows = '';

        questions.forEach((q, i) => {
            // Chip jawaban tiap siswa (hijau=benar, merah=salah)
            let chips = '';
            results.forEach(r => {
                const stu = this.studentMap[r.student_id] || {};
                const nama = stu.nama_panggilan || stu.nama || r.student_id;
                const ua = (r.answers || {})[i] || null;
                const ok = ua && ua === q.jawaban_benar;
                chips += `<span class="stu-ans ${ok ? 'ok' : 'no'}">${nama}: ${ua || '-'}</span>`;
            });

            // Nav nomor kiri
            const n = document.createElement('div');
            n.className = 'qn';
            n.innerText = i + 1;
            n.onclick = () => {
                const el = document.getElementById('row-q-' + i);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
            nav.appendChild(n);

            rows += `<tr id="row-q-${i}"><td><strong>${i + 1}</strong></td><td><strong>${q.jawaban_benar}</strong></td><td>${chips}</td></tr>`;
        });

        box.innerHTML = `
            <div class="table-responsive"><table>
                <thead><tr><th>No</th><th>Kunci</th><th>Jawaban Siswa</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>`;
    },

    // ---------- OVERVIEW (live + final + nama siswa) ----------
    bindOverviewListeners: function() {
        // Cache siswa untuk nama
        db.collection('students').onSnapshot(s => {
            this.studentMap = {};
            s.forEach(d => { this.studentMap[d.id] = d.data(); });
            this.renderLive();
        });
        db.collection('sessions').onSnapshot(s => { this.sessionsSnap = s; this.renderLive(); });
        db.collection('results').onSnapshot(s => {
            this.resultsSnap = s;
            this.renderFinal();
            this.populateReviewSesi();
            this.renderReviewSiswa();
        });
    },

    // Live monitoring: nama setelah ID
    renderLive: function() {
        const live = document.getElementById('overview-live-body');
        if (!this.sessionsSnap) return;
        live.innerHTML = '';
        let has = false;
        this.sessionsSnap.forEach(doc => {
            const d = doc.data();
            if (d && d.status === 'mengerjakan') {
                has = true;
                const stu = this.studentMap[doc.id] || {};
                const nama = stu.nama_panggilan || stu.nama || '-';
                live.innerHTML += `
                    <tr>
                        <td><strong>${doc.id}</strong> • ${nama}</td>
                        <td>${d.sesi || '-'}</td>
                        <td style="color:var(--danger);font-weight:bold;">🔴 Mengerjakan</td>
                        <td>${d.terjawab}/${d.total_soal}</td>
                        <td>${new Date(d.updated_at).toLocaleTimeString()}</td>
                    </tr>`;
            }
        });
        if (!has) live.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada yang ujian.</td></tr>';
    },

    // Rekap final: nama setelah ID + tombol hapus
    renderFinal: function() {
        const fin = document.getElementById('overview-final-body');
        if (!this.resultsSnap) return;
        fin.innerHTML = '';
        if (this.resultsSnap.empty) { fin.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada hasil.</td></tr>'; return; }
        this.resultsSnap.forEach(doc => {
            const r = doc.data();
            const stu = this.studentMap[r.student_id] || {};
            const nama = stu.nama_panggilan || stu.nama || '-';
            fin.innerHTML += `
                <tr>
                    <td><strong>${r.student_id}</strong> • ${nama}</td>
                    <td>${r.kategori || '-'}</td>
                    <td style="color:var(--primary);font-weight:bold;">${r.score}</td>
                    <td style="color:var(--success);">${r.correct}</td>
                    <td style="color:var(--danger);">${r.incorrect}</td>
                    <td>${r.unanswered}</td>
                    <td>${new Date(r.submitted_at).toLocaleString()}</td>
                    <td><button class="btn btn-danger" style="padding:4px 8px;font-size:.75rem;width:auto;" onclick="AdminApp.delResult('${doc.id}')">Hapus</button></td>
                </tr>`;
        });
    },

    // Hapus satu hasil
    delResult: async function(id) {
        const ok = await Modal.confirm('Hapus hasil ini?', { confirmLabel: 'Hapus', confirmClass: 'danger' });
        if (ok) await db.collection('results').doc(id).delete();
    }
});