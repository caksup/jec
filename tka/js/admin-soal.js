// =====================================================
// js/admin-soal.js
// Manajemen Bank Soal: input (manual/AI/teks), parser, sesi, daftar soal
// Menambahkan method ke objek AdminApp (dari admin-core.js)
// =====================================================

Object.assign(AdminApp, {

    // ---------- PASANG SEMUA EVENT BANK SOAL ----------
    bindSoalManagement: function() {

        // 1) INPUT MANUAL
        document.getElementById('form-add-soal').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-save-soal');
            btn.disabled = true;
            try {
                await db.collection('banksoal').add({
                    pertanyaan: document.getElementById('soal-pertanyaan').value.trim(),
                    opsi: {
                        A: document.getElementById('soal-a').value.trim(),
                        B: document.getElementById('soal-b').value.trim(),
                        C: document.getElementById('soal-c').value.trim(),
                        D: document.getElementById('soal-d').value.trim()
                    },
                    jawaban_benar: document.getElementById('soal-jawaban').value,
                    pembahasan: document.getElementById('soal-pembahasan').value.trim(),
                    sesi: document.getElementById('soal-sesi').value.trim(),
                    jenis: document.getElementById('soal-jenis').value.trim(),
                    nomor: parseInt(document.getElementById('soal-nomor').value) || 0,
                    status: 'on',
                    sesi_status: 'on',
                    created_at: Date.now()
                });
                document.getElementById('form-add-soal').reset();
                Modal.toast('Tersimpan', 'Soal ditambahkan.', 'success');
            } catch (err) {
                Modal.alert('Gagal: ' + err.message, { type: 'danger' });
            } finally {
                btn.disabled = false;
            }
        });

        // 2) GENERATE AI (Gemini)
        document.getElementById('form-ai-generate').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-generate-ai');
            btn.disabled = true; btn.innerHTML = 'Berpikir...';
            document.getElementById('ai-result-area').classList.add('hidden');

            const sesi = document.getElementById('ai-sesi').value.trim();
            const topic = document.getElementById('ai-topic').value.trim();
            const prompt = `Expert English exam creator for Indonesian SMP/MTs (TKA). Create 3 MCQs about ${topic}. ` +
                `ENGLISH questions/options, 4 options A-D, one correct, "pembahasan" in INDONESIAN. ` +
                `Output ONLY JSON array: [{"pertanyaan":"...","opsi":{"A":"...","B":"...","C":"...","D":"..."},"jawaban_benar":"A","pembahasan":"..."}]`;

            try {
                const result = await callGemini(prompt);
                let text = result.data.candidates[0].content.parts[0].text
                    .replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                const start = text.indexOf('['), end = text.lastIndexOf(']');
                window.aiResp = JSON.parse(text.substring(start, end + 1));
                window.aiSesi = sesi;
                window.aiJenis = topic;
                document.getElementById('ai-result-container').innerText = '✅ ' + result.model + '\n' + JSON.stringify(window.aiResp, null, 2);
                document.getElementById('ai-result-area').classList.remove('hidden');
            } catch (err) {
                Modal.alert('Gagal Generate: ' + err.message, { type: 'danger' });
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-rounded">smart_toy</span> Generate (AI)';
            }
        });

        // Buang hasil AI
        document.getElementById('btn-discard-ai').addEventListener('click', () => {
            document.getElementById('ai-result-area').classList.add('hidden');
            window.aiResp = null;
        });

        // Simpan hasil AI ke bank soal
        document.getElementById('btn-save-ai').addEventListener('click', async () => {
            if (!Array.isArray(window.aiResp) || !window.aiResp.length) return;
            let nomor = this.nextNomorFor(window.aiSesi);
            const bw = db.batch();
            window.aiResp.forEach(s => {
                bw.set(db.collection('banksoal').doc(), {
                    pertanyaan: s.pertanyaan, opsi: s.opsi, jawaban_benar: s.jawaban_benar,
                    pembahasan: s.pembahasan || '', sesi: window.aiSesi, jenis: window.aiJenis || 'Umum',
                    nomor: nomor++, status: 'on', sesi_status: 'on', created_at: Date.now()
                });
            });
            await bw.commit();
            document.getElementById('ai-result-area').classList.add('hidden');
            window.aiResp = null;
            Modal.toast('Tersimpan', 'Soal AI masuk ' + window.aiSesi, 'success');
        });

        // 3) IMPORT TEKS MASSAL
        document.getElementById('form-import-soal').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-import-soal');
            btn.disabled = true;
            const sesi = document.getElementById('import-sesi').value.trim();
            const parsed = this.parseImportText(document.getElementById('import-text').value);
            try {
                if (!parsed.length) throw new Error('Tidak ada soal terdeteksi. Periksa format.');
                const ok = await Modal.confirm(parsed.length + ' soal → "' + sesi + '"?');
                if (ok) {
                    let nomor = this.nextNomorFor(sesi);
                    const bw = db.batch();
                    parsed.forEach(s => {
                        bw.set(db.collection('banksoal').doc(), {
                            pertanyaan: s.pertanyaan, opsi: s.opsi, jawaban_benar: s.jawaban_benar,
                            pembahasan: s.pembahasan || '', sesi: sesi, jenis: s.jenis || 'Umum',
                            nomor: s.nomor || nomor++, status: 'on', sesi_status: 'on', created_at: Date.now()
                        });
                    });
                    await bw.commit();
                    document.getElementById('import-text').value = '';
                    Modal.toast('Berhasil', parsed.length + ' soal diimport.', 'success');
                }
            } catch (err) {
                Modal.alert('Gagal import: ' + err.message, { type: 'danger' });
            } finally {
                btn.disabled = false;
            }
        });

        // Filter
        document.getElementById('review-kategori-filter').addEventListener('change', () => this.renderReview());
        document.getElementById('soal-jenis-filter').addEventListener('change', () => this.renderSoalGroups());
    },

    // Nomor berikutnya dalam satu sesi
    nextNomorFor: function(sesi) {
        let max = 0;
        this.allSoal.forEach(s => { if ((s.sesi || 'Sesi 1') === sesi && (s.nomor || 0) > max) max = s.nomor; });
        return max + 1;
    },

    // ---------- PARSER TEKS MASSAL ----------
    // Format: [soal] ... [jawaban] ... [pembahasan] ... [kategori] ...
    parseImportText: function(text) {
        const clean = text.replace(/[\u200b\u200c\u200d\ufeff]/g, '');
        const lower = clean.toLowerCase();
        const iJ = lower.indexOf('[jawaban]');
        const iP = lower.indexOf('[pembahasan]');
        const iK = lower.indexOf('[kategori]');

        let main = clean, ans = '', pem = '', kat = '';
        if (iJ !== -1) {
            main = clean.substring(0, iJ);
            let endA = clean.length;
            if (iP > iJ) endA = Math.min(endA, iP);
            if (iK > iJ) endA = Math.min(endA, iK);
            ans = clean.substring(iJ + 9, endA);
        } else if (iP !== -1) {
            main = clean.substring(0, iP);
        }
        if (iP !== -1) {
            let endP = clean.length;
            if (iK > iP) endP = iK;
            pem = clean.substring(iP + 12, endP);
        }
        if (iK !== -1) kat = clean.substring(iK + 10);

        // --- Parse soal + opsi + bacaan/context ---
        const questions = [];
        let current = null, pending = '', pendingMax = 0;
        main.split('\n').forEach(line => {
            const t = line.trim();
            if (!t || t.startsWith('[')) return;
            const qm = t.match(/^(\d+)[\.\)]\s*(.*)$/);
            const om = t.match(/^([a-dA-D])[\.\)]\s*(.*)$/);

            if (qm) {
                const num = parseInt(qm[1]);
                let body = qm[2], jenis = '';
                const km = body.match(/\[k:\s*([^\]]+)\]/i); // [k: ...] inline
                if (km) { jenis = km[1].trim(); body = body.replace(km[0], '').trim(); }
                let prefix = '';
                if (pending && num <= pendingMax) { prefix = pending + '\n'; if (num === pendingMax) pending = ''; }
                else if (pending) pending = '';
                current = { nomor: num, pertanyaan: prefix + body, opsi: {}, jenis: jenis };
                questions.push(current);
            } else if (om && current) {
                current.opsi[om[1].toUpperCase()] = om[2];
            } else {
                // Baris bacaan / context
                if (current && Object.keys(current.opsi).length > 0) {
                    // muncul setelah opsi -> context untuk soal berikutnya
                    if (!pending) {
                        const hasKw = /question|soal|untuk|read|text/i.test(t);
                        const nums = hasKw ? (t.match(/\d+/g) || []).map(Number) : [];
                        pendingMax = nums.length ? Math.max(...nums) : current.nomor + 1;
                    }
                    pending += (pending ? '\n' : '') + t;
                } else if (current) {
                    current.pertanyaan += '\n' + t;
                }
            }
        });

        // --- Parse jawaban ---
        const answers = {};
        ans.split('\n').forEach(l => {
            const m = l.trim().match(/^(\d+)[\.\)]\s*([a-dA-D])/);
            if (m) answers[+m[1]] = m[2].toUpperCase();
        });

        // --- Parse pembahasan (multi-baris) ---
        const pems = {};
        let lastNum = null;
        pem.split('\n').forEach(l => {
            const t = l.trim();
            if (!t) return;
            const m = t.match(/^(\d+)[\.\)]\s*(.*)$/);
            if (m) { lastNum = +m[1]; pems[lastNum] = m[2]; }
            else if (lastNum) pems[lastNum] += '\n' + t;
        });

        // --- Parse kategori per nomor ---
        const kats = {};
        kat.split('\n').forEach(l => {
            const m = l.trim().match(/^(\d+)[\.\)]\s*(.*)$/);
            if (m) kats[+m[1]] = m[2];
        });

        return questions.map(q => ({
            pertanyaan: q.pertanyaan,
            opsi: q.opsi,
            jawaban_benar: answers[q.nomor] || 'A',
            pembahasan: pems[q.nomor] || '',
            jenis: kats[q.nomor] || q.jenis || 'Umum',
            nomor: q.nomor
        }));
    },

    // ---------- LISTENER REALTIME BANK SOAL ----------
    bindSoalListener: function() {
        db.collection('banksoal').onSnapshot((snap) => {
            this.allSoal = [];
            snap.forEach(d => this.allSoal.push({ id: d.id, ...d.data() }));
            this.populateSesiFilter();
            this.populateJenisFilter();
            this.renderSesi();
            this.renderSoalGroups();
            this.renderReview();
        });
    },

    populateSesiFilter: function() {
        const set = [...new Set(this.allSoal.map(s => s.sesi || 'Sesi 1'))].sort();
        const sel = document.getElementById('review-kategori-filter');
        const cur = sel.value;
        sel.innerHTML = '<option value="">Semua</option>';
        set.forEach(k => sel.innerHTML += `<option value="${k}">${k}</option>`);
        sel.value = cur;
    },
    populateJenisFilter: function() {
        const set = [...new Set(this.allSoal.map(s => s.jenis || 'Umum'))].sort();
        const sel = document.getElementById('soal-jenis-filter');
        const cur = sel.value;
        sel.innerHTML = '<option value="">Semua Kategori</option>';
        set.forEach(k => sel.innerHTML += `<option value="${k}">${k}</option>`);
        sel.value = cur;
    },

    // ---------- DAFTAR SESI (show/hide + hapus) ----------
    renderSesi: function() {
        const tbody = document.getElementById('sesi-list-body');
        const groups = {};
        this.allSoal.forEach(s => {
            const k = s.sesi || 'Sesi 1';
            if (!groups[k]) groups[k] = { c: 0, on: 0 };
            groups[k].c++;
            if ((s.sesi_status || 'on') === 'on') groups[k].on++;
        });
        tbody.innerHTML = '';
        const keys = Object.keys(groups).sort();
        if (!keys.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada sesi.</td></tr>'; return; }
        keys.forEach(k => {
            const isOn = groups[k].on > 0;
            tbody.innerHTML += `
                <tr>
                    <td><strong>${k}</strong></td>
                    <td>${groups[k].c} soal</td>
                    <td>${isOn ? '<span style="color:var(--success);font-weight:bold;">Tampil</span>' : '<span style="color:var(--danger);font-weight:bold;">Disembunyikan</span>'}</td>
                    <td>
                        <label class="switch"><input type="checkbox" class="sesi-toggle" data-sesi="${k}" ${isOn ? 'checked' : ''}><span class="slider"></span></label>
                        <button class="btn btn-danger" style="padding:4px 8px;font-size:.75rem;width:auto;" onclick="AdminApp.delSesi('${k}')">Hapus</button>
                    </td>
                </tr>`;
        });
        tbody.querySelectorAll('.sesi-toggle').forEach(i => i.addEventListener('change', () => this.toggleSesi(i.dataset.sesi, i.checked)));
    },
    toggleSesi: async function(sesi, isOn) {
        const docs = this.allSoal.filter(s => (s.sesi || 'Sesi 1') === sesi);
        const bw = db.batch();
        docs.forEach(s => bw.update(db.collection('banksoal').doc(s.id), { sesi_status: isOn ? 'on' : 'off' }));
        await bw.commit();
        Modal.toast(isOn ? 'Sesi Ditampilkan' : 'Sesi Disembunyikan', sesi, isOn ? 'success' : 'warning');
    },
    delSesi: async function(sesi) {
        const ok = await Modal.confirm('Hapus SEMUA soal di ' + sesi + '?', { confirmLabel: 'Hapus', confirmClass: 'danger' });
        if (!ok) return;
        const docs = this.allSoal.filter(s => (s.sesi || 'Sesi 1') === sesi);
        const bw = db.batch();
        docs.forEach(s => bw.delete(db.collection('banksoal').doc(s.id)));
        await bw.commit();
    },

    // ---------- DAFTAR SOAL (per jenis, pindah sesi, on/off) ----------
    renderSoalGroups: function() {
        const container = document.getElementById('soal-group-container');
        const filter = document.getElementById('soal-jenis-filter').value;
        const sesiSet = [...new Set(this.allSoal.map(s => s.sesi || 'Sesi 1'))].sort();
        const groups = {};
        this.allSoal.forEach(s => { const k = s.jenis || 'Umum'; if (!groups[k]) groups[k] = []; groups[k].push(s); });

        let html = '';
        Object.keys(groups).sort().forEach(k => {
            if (filter && k !== filter) return;
            html += `<h4 style="margin:15px 0 10px;"><span class="badge-jenis">${k}</span> (${groups[k].length})</h4>`;
            groups[k].sort((a, b) => (a.nomor || 0) - (b.nomor || 0)).forEach(s => {
                const isOn = (s.status || 'on') === 'on';
                const opts = sesiSet.map(x => `<option value="${x}" ${(s.sesi || 'Sesi 1') === x ? 'selected' : ''}>${x}</option>`).join('');
                html += `
                    <div class="soal-row"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <span class="badge-nomor">No.${s.nomor || '-'}</span>
                        <span style="flex:1;font-size:.9rem;">${(s.pertanyaan || '').substring(0, 60)}...</span>
                        <select class="form-control soal-sesi" data-id="${s.id}" style="width:auto;">${opts}</select>
                        <label class="switch"><input type="checkbox" class="soal-toggle" data-id="${s.id}" ${isOn ? 'checked' : ''}><span class="slider"></span></label>
                        <button class="btn btn-primary" style="padding:4px 8px;font-size:.75rem;width:auto;" onclick="AdminApp.editSoal('${s.id}')">Edit</button>
                        <button class="btn btn-danger" style="padding:4px 8px;font-size:.75rem;width:auto;" onclick="AdminApp.delSoal('${s.id}')">Del</button>
                    </div></div>`;
            });
        });
        container.innerHTML = html || '<p>Belum ada soal.</p>';

        container.querySelectorAll('.soal-toggle').forEach(i => i.addEventListener('change', () => this.toggleSoal(i.dataset.id, i.checked)));
        container.querySelectorAll('.soal-sesi').forEach(sel => sel.addEventListener('change', () => this.assignSesi(sel.dataset.id, sel.value)));
    },
    toggleSoal: async function(id, isOn) {
        await db.collection('banksoal').doc(id).update({ status: isOn ? 'on' : 'off' });
    },
    assignSesi: async function(id, sesi) {
        await db.collection('banksoal').doc(id).update({ sesi: sesi });
        Modal.toast('Dipindah', 'Soal masuk ' + sesi, 'info');
    },
    editSoal: async function(id) {
        const d = (await db.collection('banksoal').doc(id).get()).data();
        if (!d) return;
        const q = await Modal.prompt('Pertanyaan:', { defaultValue: d.pertanyaan, multiline: true });
        if (q === null) return;
        const jenis = await Modal.prompt('Kategori:', { defaultValue: d.jenis || '' });
        if (jenis === null) return;
        await db.collection('banksoal').doc(id).update({ pertanyaan: q, jenis: jenis });
        Modal.toast('Tersimpan', 'Soal diupdate.', 'success');
    },
    delSoal: async function(id) {
        const ok = await Modal.confirm('Hapus soal ini?', { confirmLabel: 'Hapus', confirmClass: 'danger' });
        if (ok) await db.collection('banksoal').doc(id).delete();
    }
});