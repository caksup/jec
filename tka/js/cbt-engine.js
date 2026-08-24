// js/cbt-engine.js
const CBTEngine = {
    questions: [],
    currentSesi: null,
    currentIndex: 0,
    userAnswers: {},
    timerInterval: null,
    submitting: false,
    examActive: false,   // status sedang ujian (untuk blokir back)
    _popHandler: null,

    // ==========================================
    // MULAI UJIAN PER SESI + FULLSCREEN
    // ==========================================
    startExam: async function(sesi) {
        const questionBox = document.getElementById('question-text');
        questionBox.innerHTML = "Memuat soal dari server...";
        this.submitting = false;
        this.currentSesi = sesi || null;

        try {
            const snapshot = await db.collection('banksoal').get();
            if (snapshot.empty) {
                await Modal.alert("Belum ada soal. Hubungi admin.", { type: 'warning', icon: 'quiz', title: 'Bank Soal Kosong' });
                StudentApp.navigate('view-dashboard');
                return;
            }

            let raw = [];
            snapshot.forEach((doc) => {
                const d = { id: doc.id, ...doc.data() };
                if ((d.status || 'on') !== 'on') return;
                if ((d.sesi_status || 'on') !== 'on') return;
                if (this.currentSesi && (d.sesi || 'Sesi 1') !== this.currentSesi) return;
                raw.push(d);
            });

            if (raw.length === 0) {
                await Modal.alert("Sesi ini belum punya soal aktif. Hubungi admin.", { type: 'warning', icon: 'quiz', title: 'Sesi Kosong' });
                StudentApp.navigate('view-pilih-sesi');
                return;
            }

            raw.sort((a, b) => (a.nomor || 0) - (b.nomor || 0));

            // TANPA ACAK OPSI
            this.questions = raw.map(q => ({
                pertanyaan: q.pertanyaan,
                opsi: q.opsi,
                jawaban_benar: q.jawaban_benar,
                pembahasan: q.pembahasan || '-',
                sesi: q.sesi || 'Sesi 1',
                nomor: q.nomor || 0
            }));

            this.currentIndex = 0;
            this.userAnswers = {};

            document.getElementById('cbt-sesi-title').innerText = this.currentSesi || 'Latihan TKA';
            this.buildTimeline();
            this.renderQuestion();

            const minutes = await this.getExamTimer();
            this.startTimer(minutes);

            this.lockBackButton();      // BLOKIR tombol back
            this.enterFullscreen();
        } catch (error) {
            console.error("Gagal memuat soal:", error);
            Modal.alert("Gagal memuat soal: " + error.message, { type: 'danger', icon: 'error' });
            StudentApp.navigate('view-dashboard');
        }
    },

    // ==========================================
    // BLOKIR TOMBOL BACK SELAMA UJIAN
    // ==========================================
    lockBackButton: function() {
        this.examActive = true;
        // Sisipkan state dummy supaya tombol back memicu popstate, bukan keluar halaman
        history.pushState({ exam: true }, '', location.href);

        this._popHandler = () => {
            if (this.examActive) {
                // Dorong lagi state agar tidak jadi mundur
                history.pushState({ exam: true }, '', location.href);
                Modal.alert('Tidak bisa kembali. Gunakan tombol "Akhiri" untuk menyelesaikan ujian.',
                    { type: 'warning', icon: 'block', title: 'Ujian Sedang Berlangsung' });
            }
        };
        window.addEventListener('popstate', this._popHandler);

        // Cegah refresh / tutup tab saat ujian
        this._beforeUnload = (e) => { if (this.examActive) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', this._beforeUnload);
    },

    unlockBackButton: function() {
        this.examActive = false;
        if (this._popHandler) window.removeEventListener('popstate', this._popHandler);
        if (this._beforeUnload) window.removeEventListener('beforeunload', this._beforeUnload);
        this._popHandler = null;
        this._beforeUnload = null;
    },

    getExamTimer: async function() {
        try {
            const d = await db.collection('admins').doc('config').get();
            if (d.exists && d.data().timer) return parseInt(d.data().timer) || 60;
        } catch (e) {}
        return 60;
    },

    enterFullscreen: function() {
        const el = document.documentElement;
        if (el.requestFullscreen) { el.requestFullscreen().catch(() => {}); }
        else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
    },
    exitFullscreen: function() {
        if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); }
        else if (document.webkitFullscreenElement) { document.webkitExitFullscreen(); }
    },
    toggleFullscreen: function() {
        if (document.fullscreenElement || document.webkitFullscreenElement) this.exitFullscreen();
        else this.enterFullscreen();
    },

    // ==========================================
    // TIMELINE DOTS (o—o—o)
    // ==========================================
    buildTimeline: function() {
        const tl = document.getElementById('question-timeline');
        tl.innerHTML = '';
        this.questions.forEach((q, i) => {
            const node = document.createElement('div');
            node.className = 'tl-node';
            node.title = 'Soal ' + (i + 1);
            node.innerHTML = '<span class="tl-dot"></span>';
            node.onclick = () => { this.currentIndex = i; this.renderQuestion(); };
            tl.appendChild(node);
        });
    },
    refreshTimeline: function() {
        const nodes = document.querySelectorAll('#question-timeline .tl-node');
        nodes.forEach((n, i) => {
            n.classList.toggle('done', !!this.userAnswers[i]);
            n.classList.toggle('current', i === this.currentIndex);
        });
    },

    // ==========================================
    // RENDER SOAL
    // ==========================================
    renderQuestion: function() {
        if (this.questions.length === 0) return;
        const q = this.questions[this.currentIndex];
        document.getElementById('question-text').innerHTML = `
            <div style="margin-bottom:10px; font-weight:600; color:var(--primary-dark);">Soal No. ${this.currentIndex + 1}</div>
            <div>${q.pertanyaan}</div>`;

        const oc = document.getElementById('options-container');
        oc.innerHTML = '';
        Object.keys(q.opsi).forEach(key => {
            const sel = this.userAnswers[this.currentIndex] === key ? 'selected' : '';
            const li = document.createElement('li');
            li.className = `option-item ${sel}`;
            li.innerHTML = `<span class="option-label">${key}</span><span class="option-text">${q.opsi[key]}</span>`;
            li.onclick = () => {
                this.userAnswers[this.currentIndex] = key;
                document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
                li.classList.add('selected');
                this.refreshTimeline();
                this.syncLiveProgress();
            };
            oc.appendChild(li);
        });

        document.getElementById('btn-prev').disabled = (this.currentIndex === 0);
        const btnNext = document.getElementById('btn-next');
        if (this.currentIndex === this.questions.length - 1) { btnNext.innerText = "Selesai & Kirim Ujian"; btnNext.style.background = "var(--success)"; }
        else { btnNext.innerText = "Selanjutnya"; btnNext.style.background = "var(--primary)"; }

        this.refreshTimeline();
    },

    nextQuestion: async function() {
        if (this.currentIndex < this.questions.length - 1) { this.currentIndex++; this.renderQuestion(); }
        else { const ok = await Modal.confirm("Yakin mengakhiri ujian dan mengirim jawaban?", { title: 'Kirim Ujian', icon: 'send', confirmLabel: 'Kirim', confirmClass: 'success' }); if (ok) this.submitExam(); }
    },
    prevQuestion: function() { if (this.currentIndex > 0) { this.currentIndex--; this.renderQuestion(); } },

    startTimer: function(minutes) {
        let time = minutes * 60;
        const display = document.getElementById('cbt-timer');
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            const m = Math.floor(time / 60), s = time % 60;
            display.innerText = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            if (time <= 0) { clearInterval(this.timerInterval); Modal.alert("Waktu habis! Jawaban dikirim otomatis.", { type: 'warning', icon: 'timer_off' }); this.submitExam(); }
            time--;
        }, 1000);
    },

    syncLiveProgress: function() {
        if (!StudentApp.currentUserId) return;
        db.collection('sessions').doc(StudentApp.currentUserId).set({
            status: "mengerjakan", sesi: this.currentSesi || '-',
            terjawab: Object.keys(this.userAnswers).length, total_soal: this.questions.length, updated_at: Date.now()
        }, { merge: true });
    },

    // ==========================================
    // SUBMIT + BUKA KEMBALI TOMBOL BACK
    // ==========================================
    submitExam: async function() {
        if (this.submitting) return;
        this.submitting = true;
        clearInterval(this.timerInterval);

        let correct = 0, incorrect = 0, unanswered = 0;
        this.questions.forEach((q, i) => {
            const ua = this.userAnswers[i];
            if (!ua) unanswered++;
            else if (ua === q.jawaban_benar) correct++;
            else incorrect++;
        });

        const total = this.questions.length;
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;

        const resultData = {
            student_id: StudentApp.currentUserId,
            score, correct, incorrect, unanswered, total,
            answers: this.userAnswers,
            questions: this.questions,
            kategori: this.currentSesi || 'Latihan TKA',
            submitted_at: Date.now()
        };

        const btnNext = document.getElementById('btn-next');
        btnNext.disabled = true; btnNext.innerText = "Mengirim Nilai...";

        try {
            const batch = db.batch();
            batch.set(db.collection('results').doc(), resultData);
            batch.set(db.collection('sessions').doc(StudentApp.currentUserId), {
                status: "selesai", sesi: this.currentSesi || '-',
                terjawab: Object.keys(this.userAnswers).length, total_soal: total, updated_at: Date.now()
            }, { merge: true });
            await batch.commit();

            this.unlockBackButton();   // kembalikan fungsi back
            this.exitFullscreen();
            await Modal.alert(`Skor Akhir: ${score}\nBenar: ${correct} | Salah: ${incorrect} | Kosong: ${unanswered}\n\nLihat hasil di menu Riwayat Nilai.`,
                { type: score >= 75 ? 'success' : 'warning', icon: 'grade', title: 'Ujian Selesai' });
            StudentApp.navigate('view-dashboard');
        } catch (err) {
            Modal.alert("Gagal mengirim: " + err.message, { type: 'danger', icon: 'error' });
            btnNext.disabled = false; btnNext.innerText = "Selesai & Kirim Ujian";
        } finally {
            this.submitting = false;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnFs = document.getElementById('btn-fullscreen-cbt');
    if (btnNext) btnNext.addEventListener('click', () => CBTEngine.nextQuestion());
    if (btnPrev) btnPrev.addEventListener('click', () => CBTEngine.prevQuestion());
    if (btnFs) btnFs.addEventListener('click', () => CBTEngine.toggleFullscreen());
});