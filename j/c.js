// JEC v.10.01 MASTER | 16/08/2026 | j/c.js | Config + Registry
// Backend: Apps Script + Firebase (Dual-gate)
// Frontend: jsDelivr CDN + Instagram Clean Theme
// Built-in: Learn, Practice, Profile, Extra (Tools+Games+Logbook+Overview)
// Inject di Extra: via ext.js (future features)

window.JEC_CONFIG = {
  // ═══════════════════════════════════════════════════
  // META
  // ═══════════════════════════════════════════════════
  APP_NAME: 'Jagat E Course',
  APP_SHORT: 'JEC',
  APP_VERSION: '10.01',
  APP_TAGLINE: 'Belajar bahasa Inggris itu mudah, seru, menyenangkan!',

  // ═══════════════════════════════════════════════════
  // URL PATHS
  // ═══════════════════════════════════════════════════
  
  // Backend: Apps Script (deployed Tahap 1)
  LOG: 'https://script.google.com/macros/s/AKfycbyX0L09UNGjNrlfuhcGsubD0HwkAv9NPwpnLCA4lBFE_9Z7BFR8_fGwDBwT-f7DtSc/exec',

  // Firebase (mode ujian + login gate)
  FIREBASE_URL: 'https://jagatecourse-default-rtdb.firebaseio.com',

  // GitHub Raw (data JSON)
  BASE_GH: 'https://raw.githubusercontent.com/caksup/jec/main/',
  DATA: 'https://raw.githubusercontent.com/caksup/jec/main/d/',
  ASSETS: 'https://raw.githubusercontent.com/caksup/jec/main/a/',

  // CDN jsDelivr (frontend CSS/JS)
  CDN: 'https://cdn.jsdelivr.net/gh/caksup/jec@main/',

  // Feature JS (untuk inject di Extra via ext.js)
  FEATURES_JS: 'https://cdn.jsdelivr.net/gh/caksup/jec@main/j/f/ext/',

  // Page URLs
  EXE_URL: 'https://caksup.github.io/jec/p/exe.html',
  MINIGAMES: 'https://caksup.github.io/jec/p/minigames.html',

  // ═══════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════
  MFL_DEFAULT: 25,              // Focus Learn Mode (menit)
  DEFAULT_LANG: 'en',
  DEFAULT_AVATAR: 'boy',
  WA_ADMIN: '6285335913758',
  DEBUG_MODE: true,

  // ═══════════════════════════════════════════════════
  // AVATARS (HANYA 2: BOY & GIRL)
  // ═══════════════════════════════════════════════════
  AVATARS: [
    { id: 'boy',  icon: '👨‍🎓', material: 'boy',  en: 'Boy',  id_label: 'Cowok' },
    { id: 'girl', icon: '👩‍🎓', material: 'girl', en: 'Girl', id_label: 'Cewek' }
  ],

  // ═══════════════════════════════════════════════════
  // MODULE ICONS (5 modul JEC)
  // ═══════════════════════════════════════════════════
  MODULES: {
    spe: { icon: 'record_voice_over', en: 'Speaking',    id: 'Speaking' },
    voc: { icon: 'translate',          en: 'Vocabulary',  id: 'Kosakata' },
    gra: { icon: 'edit_note',          en: 'Grammar',     id: 'Tata Bahasa' },
    wri: { icon: 'draw',               en: 'Writing',     id: 'Menulis' },
    lis: { icon: 'hearing',            en: 'Listening',   id: 'Mendengarkan' }
  },

  // ═══════════════════════════════════════════════════
  // EXTRA MENU SUB-TABS (Built-in di index.html)
  // ═══════════════════════════════════════════════════
  // Logbook BUILT-IN, bukan file terpisah
  EXTRA_TABS: [
    { id: 'tools',    icon: 'language',       en: 'English Tools', id: 'Alat Bahasa' },
    { id: 'games',    icon: 'sports_esports', en: 'Games',         id: 'Permainan' },
    { id: 'logbook',  icon: 'menu_book',      en: 'Logbook',       id: 'Buku Catatan' },
    { id: 'overview', icon: 'leaderboard',    en: 'Overview',      id: 'Ringkasan' }
  ],

  // ═══════════════════════════════════════════════════
  // FEATURE REGISTRY
  // ═══════════════════════════════════════════════════
  // BUILT-IN: Handled by index.html / j.js (no external load)
  // INJECT: Loaded dynamically via ext.js di Extra menu
  
  FEATURES: {
    // ── BUILT-IN (skip load external) ──
    splash:   { js: null, enabled: true, builtin: true, en: 'Splash Screen',  id: 'Layar Pembuka' },
    login:    { js: null, enabled: true, builtin: true, en: 'Login Page',     id: 'Halaman Login' },
    header:   { js: null, enabled: true, builtin: true, en: 'Header & Clock', id: 'Header & Jam' },
    learn:    { js: null, enabled: true, builtin: true, en: 'Learn Module',   id: 'Modul Belajar' },
    practice: { js: null, enabled: true, builtin: true, en: 'Practice',       id: 'Latihan' },
    profile:  { js: null, enabled: true, builtin: true, en: 'Profile',        id: 'Profil' },
    extra:    { js: null, enabled: true, builtin: true, en: 'Extra Menu',     id: 'Menu Ekstra' },
    logbook:  { js: null, enabled: true, builtin: true, en: 'Logbook',        id: 'Buku Catatan' },

    // ── INJECT via ext.js (loaded on-demand di Extra) ──
    // File di j/f/ext/*.js, di-load saat user klik
    // Format: #ext/:featureId
    ext_mcq:      { js: 'mcq.js',      enabled: true, inject: true, en: 'Multiple Choice', id: 'Pilihan Ganda' },
    ext_flash:    { js: 'flash.js',    enabled: true, inject: true, en: 'Flashcards',      id: 'Kartu Kata' },
    ext_listen:   { js: 'listen.js',   enabled: true, inject: true, en: 'Listening',       id: 'Listening' },
    ext_scramble: { js: 'scramble.js', enabled: true, inject: true, en: 'Word Scramble',   id: 'Acak Kata' },
    ext_sentence: { js: 'sentence.js', enabled: true, inject: true, en: 'Sentence Builder',id: 'Pembuat Kalimat' },
    ext_dict:     { js: 'dict.js',     enabled: true, inject: true, en: 'Dictionary',      id: 'Kamus' },
    ext_mem:      { js: 'mem.js',      enabled: true, inject: true, en: 'Memorize It',     id: 'Hafalan' },

    // ── DISABLED (Maintenance) ──
    tts:      { js: null, enabled: false, en: 'Text-to-Speech', id: 'Text-to-Speech' },
    exercise: { js: null, enabled: false, en: 'Exercise',       id: 'Latihan Soal' },
    games:    { js: null, enabled: false, en: 'Minigames',      id: 'Minigames' }
  },

  // ═══════════════════════════════════════════════════
  // 40 ACHIEVEMENTS (Material Icons only)
  // ═══════════════════════════════════════════════════
  ACHIEVEMENTS: [
    // ─── Category 1: First Steps (5) ───
    { id:'first_login',   icon:'rocket_launch',    en:'First Steps',     id:'Langkah Pertama',   en_d:'Login for the first time',       id_d:'Login pertama kali',            cond:function(s){return s.loginCount>=1}, xp:5 },
    { id:'profile_setup', icon:'person_add',       en:'Profile Ready',   id:'Profil Siap',       en_d:'Set up your profile',            id_d:'Atur profil kamu',              cond:function(s){return s.hasProfile}, xp:5 },
    { id:'first_note',    icon:'sticky_note_2',    en:'First Note',      id:'Catatan Pertama',   en_d:'Write your first note',          id_d:'Tulis catatan pertamamu',       cond:function(s){return s.notesCount>=1}, xp:5 },
    { id:'first_bm',      icon:'bookmark_add',     en:'First Bookmark',  id:'Bookmark Pertama',  en_d:'Save your first material',       id_d:'Simpan materi pertamamu',       cond:function(s){return s.bmCount>=1}, xp:5 },
    { id:'first_dc',      icon:'event_available',  en:'Daily Starter',   id:'Starter Harian',    en_d:'Complete first Daily Challenge', id_d:'Selesaikan DC pertama',         cond:function(s){return s.dcCount>=1}, xp:10 },

    // ─── Category 2: Learning Progress (10) ───
    { id:'part_1',    icon:'auto_stories',     en:'Bookworm',       id:'Kutu Buku',       en_d:'Complete 1 part',            id_d:'Selesaikan 1 bagian',          cond:function(s){return s.partsDone>=1}, xp:10 },
    { id:'part_5',    icon:'menu_book',        en:'Rising Star',    id:'Bintang Baru',    en_d:'Complete 5 parts',           id_d:'Selesaikan 5 bagian',          cond:function(s){return s.partsDone>=5}, xp:25 },
    { id:'part_10',   icon:'trending_up',      en:'On Fire',        id:'Semangat Membara',en_d:'Complete 10 parts',          id_d:'Selesaikan 10 bagian',         cond:function(s){return s.partsDone>=10}, xp:50 },
    { id:'part_25',   icon:'whatshot',         en:'Dedicated',      id:'Berdedikasi',     en_d:'Complete 25 parts',          id_d:'Selesaikan 25 bagian',         cond:function(s){return s.partsDone>=25}, xp:100 },
    { id:'part_50',   icon:'military_tech',    en:'Halfway Hero',   id:'Pahlawan Tengah', en_d:'Complete 50 parts',          id_d:'Selesaikan 50 bagian',         cond:function(s){return s.partsDone>=50}, xp:200 },
    { id:'part_100',  icon:'workspace_premium',en:'Centurion',      id:'Centurion',       en_d:'Complete 100 parts',         id_d:'Selesaikan 100 bagian',        cond:function(s){return s.partsDone>=100}, xp:500 },
    { id:'all_spe',   icon:'mic_external_on',  en:'Speaking Pro',   id:'Pro Speaking',    en_d:'Complete all Speaking units',id_d:'Selesaikan semua Speaking',    cond:function(s){return s.speComplete}, xp:150 },
    { id:'all_voc',   icon:'spellcheck',       en:'Vocab Master',   id:'Master Kosakata', en_d:'Complete all Vocabulary',    id_d:'Selesaikan semua Kosakata',    cond:function(s){return s.vocComplete}, xp:150 },
    { id:'all_gra',   icon:'functions',        en:'Grammar Guru',   id:'Guru Grammar',    en_d:'Complete all Grammar units', id_d:'Selesaikan semua Grammar',     cond:function(s){return s.graComplete}, xp:150 },
    { id:'all_modules',icon:'school',          en:'Scholar',        id:'Cendekia',        en_d:'Complete all modules',       id_d:'Selesaikan semua modul',       cond:function(s){return s.allModules}, xp:1000 },

    // ─── Category 3: Quiz & Scores (6) ───
    { id:'first_quiz',  icon:'quiz',             en:'Quiz Taker',    id:'Pengerja Kuis',   en_d:'Complete your first quiz',   id_d:'Selesaikan kuis pertama',      cond:function(s){return s.quizCount>=1}, xp:10 },
    { id:'perfect_quiz',icon:'stars',            en:'Quiz Master',   id:'Master Kuis',     en_d:'Get 100% in a quiz',         id_d:'Dapatkan 100% di kuis',        cond:function(s){return s.perfectQuiz}, xp:50 },
    { id:'five_perfect',icon:'diamond',          en:'Perfect Streak',id:'Seri Sempurna',   en_d:'Get 5 perfect quizzes',      id_d:'Dapatkan 5 kuis sempurna',     cond:function(s){return s.perfectCount>=5}, xp:150 },
    { id:'ten_perfect', icon:'workspace_premium',en:'Quiz Legend',   id:'Legenda Kuis',    en_d:'Get 10 perfect quizzes',     id_d:'Dapatkan 10 kuis sempurna',    cond:function(s){return s.perfectCount>=10}, xp:300 },
    { id:'avg_80',      icon:'emoji_events',     en:'High Achiever', id:'Pencapaian Tinggi',en_d:'Average quiz score 80+',  id_d:'Rata-rata skor kuis 80+',      cond:function(s){return s.avgQuiz>=80}, xp:100 },
    { id:'avg_95',      icon:'verified',         en:'Top Performer', id:'Pemain Terbaik',  en_d:'Average quiz score 95+',     id_d:'Rata-rata skor kuis 95+',      cond:function(s){return s.avgQuiz>=95}, xp:250 },

    // ─── Category 4: Streaks & Consistency (6) ───
    { id:'streak_3',   icon:'local_fire_department',en:'Consistent',    id:'Konsisten',      en_d:'3 day streak',           id_d:'3 hari berturut-turut',        cond:function(s){return s.streak>=3}, xp:30 },
    { id:'streak_7',   icon:'local_fire_department',en:'Week Warrior',  id:'Pejuang Minggu', en_d:'7 day streak',           id_d:'7 hari berturut-turut',        cond:function(s){return s.streak>=7}, xp:70 },
    { id:'streak_14',  icon:'local_fire_department',en:'Two Week Pro',  id:'Pro 2 Minggu',   en_d:'14 day streak',          id_d:'14 hari berturut-turut',       cond:function(s){return s.streak>=14}, xp:150 },
    { id:'streak_30',  icon:'local_fire_department',en:'Monthly Master',id:'Master Bulanan', en_d:'30 day streak',          id_d:'30 hari berturut-turut',       cond:function(s){return s.streak>=30}, xp:350 },
    { id:'streak_100', icon:'local_fire_department',en:'Unstoppable',   id:'Tak Terhentikan',en_d:'100 day streak',         id_d:'100 hari berturut-turut',      cond:function(s){return s.streak>=100}, xp:1000 },
    { id:'login_50',   icon:'login',              en:'Regular Visitor', id:'Pengunjung Tetap',en_d:'Login 50 times',        id_d:'Login 50 kali',                cond:function(s){return s.loginCount>=50}, xp:100 },

    // ─── Category 5: Focus Mode (4) ───
    { id:'focus_1',      icon:'timer',           en:'First Focus',   id:'Fokus Pertama',   en_d:'Complete 1 focus session', id_d:'Selesaikan 1 sesi fokus',      cond:function(s){return s.focusCount>=1}, xp:15 },
    { id:'focus_10',     icon:'timer',           en:'Focus Addict',  id:'Kecanduan Fokus', en_d:'Complete 10 focus sessions',id_d:'Selesaikan 10 sesi fokus',    cond:function(s){return s.focusCount>=10}, xp:75 },
    { id:'focus_hours',  icon:'hourglass_top',   en:'Hour Master',   id:'Master Jam',      en_d:'10 hours of focus time',   id_d:'10 jam waktu fokus',           cond:function(s){return s.focusHours>=10}, xp:200 },
    { id:'focus_noskip', icon:'check_circle',    en:'No-Skip Hero',  id:'Pahlawan No-Skip',en_d:'5 sessions without skip',  id_d:'5 sesi tanpa skip',            cond:function(s){return s.focusNoSkip>=5}, xp:150 },

    // ─── Category 6: Social & Engagement (4) ───
    { id:'bm_10',    icon:'collections_bookmark',en:'Collector',    id:'Kolektor',        en_d:'Bookmark 10 materials',    id_d:'Bookmark 10 materi',           cond:function(s){return s.bmCount>=10}, xp:50 },
    { id:'bm_25',    icon:'bookmarks',           en:'Library',      id:'Perpustakaan',    en_d:'Bookmark 25 materials',    id_d:'Bookmark 25 materi',           cond:function(s){return s.bmCount>=25}, xp:125 },
    { id:'notes_10', icon:'description',         en:'Note Taker',   id:'Pencatat',        en_d:'Write 10 notes',           id_d:'Tulis 10 catatan',             cond:function(s){return s.notesCount>=10}, xp:50 },
    { id:'react_10', icon:'thumb_up',            en:'Feedback Fan', id:'Penggemar Feedback',en_d:'Give feedback 10 times',id_d:'Kasih feedback 10 kali',       cond:function(s){return s.reactCount>=10}, xp:30 },

    // ─── Category 7: Daily Challenge (3) ───
    { id:'dc_7',   icon:'today',          en:'Week Challenger', id:'Penantang Minggu',en_d:'Complete 7 Daily Challenges', id_d:'Selesaikan 7 DC',              cond:function(s){return s.dcCount>=7}, xp:100 },
    { id:'dc_30',  icon:'calendar_month', en:'Month Champion',  id:'Juara Bulan',     en_d:'Complete 30 Daily Challenges',id_d:'Selesaikan 30 DC',             cond:function(s){return s.dcCount>=30}, xp:500 },
    { id:'dc_streak',icon:'bolt',         en:'DC Streaker',     id:'DC Streaker',     en_d:'10 day DC streak',            id_d:'10 hari DC berturut-turut',    cond:function(s){return s.dcStreak>=10}, xp:200 },

    // ─── Category 8: Speaking & Listening (2) ───
    { id:'speak_10',  icon:'graphic_eq', en:'Speaker',         id:'Pembicara',       en_d:'Record 10 speaking clips',  id_d:'Rekam 10 klip speaking',       cond:function(s){return s.speakCount>=10}, xp:75 },
    { id:'listen_20', icon:'headphones', en:'Active Listener', id:'Pendengar Aktif', en_d:'Listen to 20 audio materials',id_d:'Dengarkan 20 materi audio',  cond:function(s){return s.listenCount>=20}, xp:50 }
  ],

  // ═══════════════════════════════════════════════════
  // 14 DAILY CHALLENGES
  // ═══════════════════════════════════════════════════
  DAILY_CHALLENGES: [
    { icon:'graphic_eq',         en:'Speak It Out',   id:'Bicara Keras',      en_d:'Record 1 speaking clip today',      id_d:'Rekam 1 klip speaking hari ini',    trigger:'speak',     xp:20 },
    { icon:'translate',          en:'Word Hunter',    id:'Pemburu Kata',      en_d:'Complete 1 Vocabulary part',        id_d:'Selesaikan 1 bagian Kosakata',      trigger:'voc_part',  xp:20 },
    { icon:'draw',               en:'Write It Down',  id:'Tulislah',          en_d:'Submit 1 writing essay',            id_d:'Kirim 1 esai writing',              trigger:'writing',   xp:25 },
    { icon:'hearing',            en:'Listen Up',      id:'Dengarkan',         en_d:'Listen to 1 Listening audio',       id_d:'Dengarkan 1 audio Listening',       trigger:'lis_part',  xp:20 },
    { icon:'quiz',               en:'Quiz Champion',  id:'Juara Kuis',        en_d:'Score 80+ in any quiz',             id_d:'Skor 80+ di kuis mana pun',         trigger:'quiz_80',   xp:25 },
    { icon:'autorenew',          en:'Review Master',  id:'Master Review',     en_d:'Re-open a completed material',      id_d:'Buka kembali materi selesai',       trigger:'review',    xp:15 },
    { icon:'sticky_note_2',      en:'Note Taker',     id:'Pencatat',          en_d:'Write 1 note on any material',      id_d:'Tulis 1 catatan di materi',         trigger:'note',      xp:15 },
    { icon:'timer',              en:'Focus Hero',     id:'Pahlawan Fokus',    en_d:'Complete 1 focus mode session',     id_d:'Selesaikan 1 sesi fokus',           trigger:'focus',     xp:20 },
    { icon:'record_voice_over',  en:'Say It Loud',    id:'Katakan Keras',     en_d:'Use TTS 3 times today',             id_d:'Gunakan TTS 3 kali hari ini',       trigger:'tts_3',     xp:15 },
    { icon:'bookmark_add',       en:'Save for Later', id:'Simpan Nanti',      en_d:'Bookmark 1 new material today',     id_d:'Bookmark 1 materi baru hari ini',   trigger:'bookmark',  xp:15 },
    { icon:'emoji_events',       en:'Perfect Shot',   id:'Tembakan Sempurna', en_d:'Get 100% on any quiz today',        id_d:'Dapatkan 100% di kuis hari ini',    trigger:'quiz_100',  xp:30 },
    { icon:'school',             en:'Multi-Module',   id:'Multi-Modul',       en_d:'Study 2 different modules today',   id_d:'Belajar 2 modul berbeda hari ini',  trigger:'multi_mod', xp:25 },
    { icon:'local_fire_department',en:'Streak Keeper',id:'Penjaga Streak',    en_d:'Maintain your login streak today',  id_d:'Pertahankan streak login hari ini', trigger:'login',     xp:10 },
    { icon:'update',             en:'Comeback Kid',   id:'Si Comeback',       en_d:'Login after 2+ days away',          id_d:'Login setelah 2+ hari absen',       trigger:'comeback',  xp:20 }
  ],

  // ═══════════════════════════════════════════════════
  // BILINGUAL MESSAGES (UI text)
  // ═══════════════════════════════════════════════════
  I18N: {
    maintenance:        { en: 'Maintenance Service',         id: 'Layanan Perbaikan' },
    under_construction: { en: 'This feature is under development.', id: 'Fitur ini sedang dalam pengembangan.' },
    error_load:         { en: 'Under Repair',                id: 'Sedang Diperbaiki' },
    error_desc:         { en: 'Feature temporarily unavailable.', id: 'Fitur sementara tidak tersedia.' },
    coming_soon:        { en: 'Coming Soon',                 id: 'Segera Hadir' },
    ach_unlocked:       { en: 'Achievement Unlocked!',       id: 'Pencapaian Terbuka!' },
    dc_complete:        { en: 'Daily Challenge Completed!',  id: 'Tantangan Harian Selesai!' },
    xp_earned:          { en: 'XP Earned',                   id: 'XP Didapat' },
    flm_complete:       { en: 'Focus session completed!',    id: 'Sesi fokus selesai!' },
    flm_exit_confirm:   { en: 'Exit Focus Learn Mode?',      id: 'Keluar Mode Fokus?' },
    flm_active:         { en: 'Focus Learn Mode Active',     id: 'Mode Fokus Aktif' },
    loading_more:       { en: 'Loading...',                  id: 'Memuat...' },
    no_bookmarks:       { en: 'No bookmarks yet',            id: 'Belum ada bookmark' },
    no_notes:           { en: 'No notes yet',                id: 'Belum ada catatan' },
    logbook_empty:      { en: 'No sessions yet',             id: 'Belum ada sesi' },
    logbook_hint:       { en: 'Tutor will add session notes here', id: 'Tutor akan menambahkan catatan sesi di sini' },
    leaderboard_empty:  { en: 'Leaderboard is empty',        id: 'Leaderboard kosong' },
    total_sessions:     { en: 'Total Sessions',              id: 'Total Sesi' },
    homework:           { en: 'Homework',                    id: 'PR' },
    next_session:       { en: 'Next',                        id: 'Berikutnya' },
    how_was_lesson:     { en: 'How was this lesson?',        id: 'Bagaimana pelajaran ini?' },
    thanks_feedback:    { en: 'Thanks for your feedback!',   id: 'Terima kasih atas feedback!' },
    continue_learning:  { en: 'Continue Learning',           id: 'Lanjut Belajar' },
    exercise:           { en: 'Exercise',                    id: 'Latihan' },
    minigames:          { en: 'Minigames',                   id: 'Minigames' },
    guide:              { en: 'Guide',                       id: 'Panduan' },
    report:             { en: 'Report Issue',                id: 'Lapor Masalah' },
    refresh_data:       { en: 'Refresh Data',                id: 'Segarkan Data' },
    logout:             { en: 'Logout',                      id: 'Keluar' },
    logout_confirm:     { en: 'Are you sure you want to logout?', id: 'Yakin ingin keluar?' },
    choose_avatar:      { en: 'Choose Avatar',               id: 'Pilih Avatar' },
    my_profile:         { en: 'My Profile',                  id: 'Profil Saya' },
    daily_challenge:    { en: 'Daily Challenge',             id: 'Tantangan Harian' },
    menu:               { en: 'Menu',                        id: 'Menu' },
    feedback:           { en: 'Feedback',                    id: 'Umpan Balik' },
    offline:            { en: "You're offline",              id: 'Kamu sedang offline' },
    online:             { en: 'online',                      id: 'online' },
    learn:              { en: 'Learn',                       id: 'Belajar' },
    practice:           { en: 'Practice',                    id: 'Latihan' },
    extra:              { en: 'Extra',                       id: 'Ekstra' },
    profile:            { en: 'Profile',                     id: 'Profil' },
    speak:              { en: 'Speak',                       id: 'Bicara' },
    welcome_to:         { en: 'Welcome to',                  id: 'Selamat datang di' },
    digital:            { en: 'Digital',                     id: 'Digital' },
    course:             { en: 'Course',                      id: 'Kursus' },
    tagline:            { en: 'Learning English is <b>easy</b>, <b>fun</b>, and <b>enjoyable!</b>', id: 'Belajar bahasa Inggris itu <b>mudah</b>, <b>seru</b>, dan <b>menyenangkan!</b>' },
    sign_in:            { en: 'SIGN IN',                     id: 'MASUK' },
    login_btn:          { en: 'SIGN IN',                     id: 'MASUK' },
    student_id:         { en: 'Student ID',                  id: 'ID Siswa' },
    login_footer:       { en: 'Forgot PIN? Contact admin.',  id: 'Lupa PIN? Hubungi admin.' },
    login_subtitle:     { en: 'Student Portal',              id: 'Portal Siswa' },
    motivation:         { en: 'Learning English is easy and fun!', id: 'Belajar bahasa Inggris itu mudah dan seru!' },
    cta:                { en: "Let's learn together with Jagat E Course!", id: 'Ayo belajar bersama Jagat E Course!' },
    loading:            { en: 'Signing in...',               id: 'Sedang masuk...' },
    loading_sub:        { en: 'Please wait a moment',        id: 'Mohon tunggu sebentar' },
    fill_all_fields:    { en: 'Please fill all fields',      id: 'Mohon isi semua field' },
    login_failed:       { en: 'Login failed',                id: 'Login gagal' },
    network_error:      { en: 'Network error',               id: 'Kesalahan jaringan' },
    invalid_module:     { en: 'Invalid module',              id: 'Modul tidak valid' },
    invalid_unit:       { en: 'Invalid unit',                id: 'Unit tidak valid' },
    invalid_part:       { en: 'Invalid part',                id: 'Part tidak valid' },
    send_wa:            { en: 'Send via WhatsApp',           id: 'Kirim via WhatsApp' },
    report_placeholder: { en: 'Describe the problem...',     id: 'Deskripsikan masalahnya...' },
    greet: {
      morning:   { en: 'Good morning',   id: 'Selamat pagi' },
      afternoon: { en: 'Good afternoon', id: 'Selamat siang' },
      evening:   { en: 'Good evening',   id: 'Selamat sore' },
      night:     { en: 'Good night',     id: 'Selamat malam' }
    },
    react: {
      great: { en: 'Great!', id: 'Mantap!' },
      ok:    { en: 'Okay',   id: 'Oke' },
      bad:   { en: 'Bad',    id: 'Kurang' }
    }
  },

  // ═══════════════════════════════════════════════════
  // THEME CONSTANTS (Instagram Clean)
  // ═══════════════════════════════════════════════════
  THEME: {
    primary:    '#833AB4',
    secondary:  '#FD1D1D',
    accent:     '#F77737',
    yellow:     '#FCAF45',
    blue:       '#405DE6',
    green:      '#00d97e',
    red:        '#ef4444',
    gradient:   'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)',
    font_main:  "'Plus Jakarta Sans', sans-serif",
    font_mono:  "'JetBrains Mono', monospace"
  }
};
