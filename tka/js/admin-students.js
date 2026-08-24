// =====================================================
// js/admin-students.js
// Manajemen Siswa: input manual, generate otomatis, batch, hapus
// Field biodata: nama, nama_panggilan, ttl, alamat, asal_sekolah, kelas, kontak_wa
// =====================================================

Object.assign(AdminApp, {

    // ---------- PASANG SEMUA EVENT MANAGE SISWA ----------
    bindUserManagement: function() {

        // 1) INPUT MANUAL (biodata lengkap)
        document.getElementById('form-add-student').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-save-student');
            btn.disabled = true;

            const id = document.getElementById('add-id').value.trim();
            const hashedPin = await SecurityUtil.hashPin(document.getElementById('add-pin').value.trim());

            try {
                await db.collection('students').doc(id).set({
                    nama: document.getElementById('add-nama').value.trim(),
                    nama_panggilan: document.getElementById('add-panggilan').value.trim(),
                    kelas: document.getElementById('add-kelas').value.trim(),
                    batch: document.getElementById('add-batch').value.trim(),
                    asal_sekolah: document.getElementById('add-asal').value.trim(),
                    ttl: document.getElementById('add-ttl').value.trim(),
                    kontak_wa: document.getElementById('add-wa').value.trim(),
                    alamat: document.getElementById('add-alamat').value.trim(),
                    avatar: '',
                    pin_hash: hashedPin,
                    status: 'on',
                    created_at: Date.now()
                });
                document.getElementById('form-add-student').reset();
                document.getElementById('add-pin').value = '1234';
                Modal.toast('Tersimpan', 'Siswa ' + id + ' ditambahkan.', 'success');
            } catch (err) {
                Modal.alert('Gagal: ' + err.message, { type: 'danger' });
            } finally {
                btn.disabled = false;
            }
        });

        // 2) GENERATE OTOMATIS (TT + Batch + Urutan) dengan PREVIEW
        document.getElementById('form-gen-auto').addEventListener('submit', async (e) => {
            e.preventDefault();
            const tahun = document.getElementById('gen-tahun').value.trim();
            const batch = document.getElementById('gen-batch').value.trim();
            const jumlah = parseInt(document.getElementById('gen-jumlah').value) || 0;

            const snap = await db.collection('students').get();
            let maxSeq = 0;
            const prefix = tahun + batch;
            snap.forEach(d => {
                if (d.id.startsWith(prefix)) {
                    const seq = parseInt(d.id.slice(prefix.length));
                    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                }
            });

            const first = prefix + String(maxSeq + 1).padStart(2, '0');
            const last = prefix + String(maxSeq + jumlah).padStart(2, '0');

            const ok = await Modal.confirm(
                `Akan dibuat ${jumlah} siswa:\n${first} = Siswa ${maxSeq + 1}\ns/d\n${last} = Siswa ${maxSeq + jumlah}\nPIN default 1234. Lanjutkan?`,
                { title: 'Generate', icon: 'group_add' }
            );
            if (!ok) return;

            const btn = document.getElementById('btn-gen-auto');
            btn.disabled = true; btn.innerHTML = 'Memproses...';
            try {
                const hashedPin = await SecurityUtil.hashPin('1234');
                const bw = db.batch();
                for (let i = 1; i <= jumlah; i++) {
                    const seq = maxSeq + i;
                    const id = prefix + String(seq).padStart(2, '0');
                    bw.set(db.collection('students').doc(id), {
                        nama: 'Siswa ' + seq,
                        nama_panggilan: '', kelas: '', batch: batch, asal_sekolah: '',
                        ttl: '', kontak_wa: '', alamat: '', avatar: '',
                        pin_hash: hashedPin,
                        status: 'on',
                        created_at: Date.now()
                    });
                }
                await bw.commit();
                Modal.toast('Berhasil', jumlah + ' siswa dibuat (' + first + ' s/d ' + last + ').', 'success');
            } catch (err) {
                Modal.alert('Gagal: ' + err.message, { type: 'danger' });
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-rounded">group_add</span> Generate Sekarang';
            }
        });

        // 3) FILTER BATCH
        document.getElementById('batch-filter').addEventListener('change', () => this.loadStudents());

        // 4) HAPUS SEMUA
        document.getElementById('btn-wipe-users').addEventListener('click', async () => {
            const ok = await Modal.confirm('Hapus SEMUA siswa?', { confirmLabel: 'Hapus', confirmClass: 'danger' });
            if (!ok) return;
            const snap = await db.collection('students').get();
            const bw = db.batch();
            snap.forEach(d => bw.delete(d.ref));
            await bw.commit();
            Modal.toast('Selesai', 'Semua siswa dihapus.', 'success');
        });

        // 5) HAPUS TERPILIH (centang)
        document.getElementById('btn-del-selected').addEventListener('click', async () => {
            const boxes = [...document.querySelectorAll('.student-check:checked')];
            if (!boxes.length) { Modal.alert('Centang siswa yang akan dihapus.', { type: 'warning', icon: 'info' }); return; }
            const ok = await Modal.confirm('Hapus ' + boxes.length + ' siswa terpilih?', { confirmLabel: 'Hapus', confirmClass: 'danger' });
            if (!ok) return;
            const bw = db.batch();
            boxes.forEach(x => bw.delete(db.collection('students').doc(x.dataset.id)));
            await bw.commit();
            Modal.toast('Selesai', boxes.length + ' siswa dihapus.', 'success');
        });
    },

    // ---------- MUAT & RENDER TABEL SISWA (11 kolom) ----------
    loadStudents: function() {
        const filter = document.getElementById('batch-filter').value;
        const tbody = document.getElementById('student-list-body');
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">Memuat...</td></tr>';

        db.collection('students').onSnapshot((snap) => {
            const batches = [...new Set(snap.docs.map(d => d.data().batch || ''))].sort();
            const sel = document.getElementById('batch-filter');
            const cur = sel.value;
            sel.innerHTML = '<option value="">Semua Batch</option>';
            batches.forEach(k => sel.innerHTML += `<option value="${k}">Batch ${k}</option>`);
            sel.value = cur;

            tbody.innerHTML = '';
            let docs = snap.docs.slice();
            if (filter) docs = docs.filter(d => (d.data().batch || '') === filter);

            if (!docs.length) {
                tbody.innerHTML = '<tr><td colspan="11" class="text-center">Tidak ada siswa.</td></tr>';
                return;
            }

            docs.forEach(doc => {
                const d = doc.data();
                const st = d.status || 'on';
                const col = st === 'off' ? 'var(--danger)' : 'var(--success)';
                tbody.innerHTML += `
                    <tr>
                        <td><input type="checkbox" class="student-check" data-id="${doc.id}"></td>
                        <td><strong>${doc.id}</strong></td>
                        <td>${d.nama}</td>
                        <td>${d.nama_panggilan || '-'}</td>
                        <td>${d.kelas || '-'}</td>
                        <td>${d.asal_sekolah || '-'}</td>
                        <td>${d.ttl || '-'}</td>
                        <td>${d.kontak_wa || '-'}</td>
                        <td>${d.alamat || '-'}</td>
                        <td style="color:${col};font-weight:bold;">${st === 'off' ? 'Nonaktif' : 'Aktif'}</td>
                        <td>
                            <button class="btn btn-primary" style="padding:4px 8px;font-size:.75rem;width:auto;" onclick="AdminApp.editStd('${doc.id}')">Edit</button>
                            <button class="btn btn-accent" style="padding:4px 8px;font-size:.75rem;width:auto;" onclick="AdminApp.toggleStd('${doc.id}','${st}')">On/Off</button>
                            <button class="btn btn-danger" style="padding:4px 8px;font-size:.75rem;width:auto;" onclick="AdminApp.delStd('${doc.id}')">Del</button>
                        </td>
                    </tr>`;
            });
        });
    },

    // ---------- EDIT SISWA (biodata lengkap) ----------
    editStd: async function(id) {
        const d = (await db.collection('students').doc(id).get()).data();
        if (!d) return;

        const nama = await Modal.prompt('Nama:', { defaultValue: d.nama }); if (nama === null) return;
        const panggilan = await Modal.prompt('Nama Panggilan:', { defaultValue: d.nama_panggilan || '' }); if (panggilan === null) return;
        const kelas = await Modal.prompt('Kelas:', { defaultValue: d.kelas || '' }); if (kelas === null) return;
        const ttl = await Modal.prompt('TTL:', { defaultValue: d.ttl || '' }); if (ttl === null) return;
        const wa = await Modal.prompt('Kontak WA:', { defaultValue: d.kontak_wa || '' }); if (wa === null) return;
        const alamat = await Modal.prompt('Alamat:', { defaultValue: d.alamat || '' }); if (alamat === null) return;
        const pin = await Modal.prompt('PIN Baru (kosongkan jika tetap):');

        const up = { nama, nama_panggilan: panggilan, kelas, ttl, kontak_wa: wa, alamat };
        if (pin && pin.trim()) up.pin_hash = await SecurityUtil.hashPin(pin.trim());

        await db.collection('students').doc(id).update(up);
        Modal.toast('Tersimpan', 'Data siswa diupdate.', 'success');
    },

    toggleStd: async function(id, currentStatus) {
        await db.collection('students').doc(id).update({ status: currentStatus === 'off' ? 'on' : 'off' });
    },
    delStd: async function(id) {
        const ok = await Modal.confirm('Hapus siswa ' + id + '?', { confirmLabel: 'Hapus', confirmClass: 'danger' });
        if (ok) await db.collection('students').doc(id).delete();
    }
});