// JEC v.1.07 | 15/08/2026 | j/c.js | Config + Registry (HOTFIX - Raw GitHub URLs)

window.JEC_CONFIG = {
  // ═══════════ META ═══════════
  APP_NAME: 'Jagat E Course',
  APP_SHORT: 'JEC',
  APP_VERSION: '1.07',

  // ═══════════ GITHUB PATHS (RAW GITHUB - NO CDN) ═══════════
  BASE_GH: 'https://raw.githubusercontent.com/caksup/jec/main/',
  DATA: 'https://jagatec.wasmer.app/d/',
  ASSETS: 'https://raw.githubusercontent.com/caksup/jec/main/a/',
  JS: 'https://jagatec.wasmer.app/j/',
  FEATURES_JS: 'https://jagatec.wasmer.app/j/f/',

  // ═══════════ APPS SCRIPT ═══════════
  LOG: 'https://script.google.com/macros/s/AKfycbyX0L09UNGjNrlfuhcGsubD0HwkAv9NPwpnLCA4lBFE_9Z7BFR8_fGwDBwT-f7DtSc/exec',

  // ═══════════ PAGES ═══════════
  EXE_URL: 'https://caksup.github.io/jec/p/exe.html',
  MINIGAMES: 'https://caksup.github.io/jec/p/minigames.html',

  // ═══════════ SETTINGS ═══════════
  MFL_DEFAULT: 25,
  DEFAULT_LANG: 'en',
  DEFAULT_AVATAR: 'account_circle',
  WA_ADMIN: '6285335913758',
  DEBUG_MODE: true,  // Aktifkan untuk troubleshooting

  // ═══════════ AVATAR OPTIONS ═══════════
  AVATARS: [
    { id: 'default', icon: 'account_circle', en: 'Default',   id_label: 'Default' },
    { id: 'boy',     icon: 'boy',            en: 'Boy',       id_label: 'Cowok' },
    { id: 'girl',    icon: 'girl',           en: 'Girl',      id_label: 'Cewek' }
  ],

  // ═══════════ REGISTRY FITUR MODULAR ═══════════
  FEATURES: {
    splash:   { js: 'splash.js',   enabled: true,  en: 'Splash Screen',   id: 'Layar Pembuka' },
    login:    { js: 'login.js',    enabled: true,  en: 'Login Page',      id: 'Halaman Login' },
    header:   { js: 'header.js',   enabled: true,  en: 'Header & Clock',  id: 'Header & Jam' },
    learn:    { js: 'learn.js',    enabled: true,  en: 'Learn Module',    id: 'Modul Belajar' },
    practice: { js: 'practice.js', enabled: true,  en: 'Practice',        id: 'Latihan' },
    extra:    { js: 'extra.js',    enabled: true,  en: 'Extra Tools',     id: 'Alat Tambahan' },
    profile:  { js: 'profile.js',  enabled: true,  en: 'Profile',         id: 'Profil' },
    focus:    { js: 'focus.js',    enabled: true,  en: 'Focus Mode',      id: 'Mode Fokus' },
    dc:       { js: 'dc.js',       enabled: true,  en: 'Daily Challenge', id: 'Tantangan Harian' },
    ach:      { js: 'ach.js',      enabled: true,  en: 'Achievements',    id: 'Pencapaian' },
    bm:       { js: 'bm.js',       enabled: true,  en: 'Bookmarks',       id: 'Bookmark' },
    notes:    { js: 'notes.js',    enabled: true,  en: 'Notes',           id: 'Catatan' },
    logbook:  { js: 'logbook.js',  enabled: true,  en: 'Logbook',         id: 'Buku Catatan' },
    react:    { js: 'react.js',    enabled: true,  en: 'Feedback',        id: 'Umpan Balik' },
    tts:      { js: 'tts.js',      enabled: false, en: 'Text-to-Speech',  id: 'Text-to-Speech' },
    exercise: { js: 'exercise.js', enabled: false, en: 'Exercise',        id: 'Latihan Soal' },
    games:    { js: 'games.js',    enabled: false, en: 'Minigames',       id: 'Minigames' }
  },

  // ═══════════ BILINGUAL MESSAGES ═══════════
  I18N: {
    maintenance:    { en: '🛠️ Maintenance Service', id: '🛠️ Dalam Perbaikan' },
    under_construction: { en: 'This feature is currently being developed. Please check back later.', id: 'Fitur ini sedang dalam pengembangan. Silakan kembali lagi nanti.' },
    error_load:     { en: '⚠️ Under Repair', id: '⚠️ Sedang Diperbaiki' },
    error_desc:     { en: 'This feature encountered an error and is temporarily unavailable.', id: 'Fitur ini mengalami kesalahan dan sementara tidak tersedia.' },
    coming_soon:    { en: 'Coming Soon', id: 'Segera Hadir' },
    ach_unlocked:   { en: 'Achievement Unlocked!', id: 'Pencapaian Terbuka!' },
    dc_complete:    { en: 'Daily Challenge Completed!', id: 'Tantangan Harian Selesai!' },
    xp_earned:      { en: 'XP Earned', id: 'XP Didapat' }
  },

  // ═══════════ MODULE ICONS ═══════════
  MODULES: {
    spe: { icon: 'record_voice_over', en: 'Speaking',   id: 'Speaking' },
    voc: { icon: 'translate',         en: 'Vocabulary', id: 'Kosakata' },
    gra: { icon: 'edit_note',         en: 'Grammar',    id: 'Tata Bahasa' },
    wri: { icon: 'draw',              en: 'Writing',    id: 'Menulis' },
    lis: { icon: 'hearing',           en: 'Listening',  id: 'Mendengarkan' }
  },

  // ═══════════ ACHIEVEMENTS (44 BADGES) ═══════════
  ACHIEVEMENTS: [
    // ─── CATEGORY 1: FIRST STEPS (5) ───
    { id:'first_login',   icon:'rocket_launch',     en:'First Steps',      id:'Langkah Pertama',   en_d:'Login for the first time',          id_d:'Login pertama kali',                  cond:function(s){return s.partsDone>=0}, xp:5 },
    { id:'profile_setup', icon:'person_add',        en:'Profile Ready',    id:'Profil Siap',       en_d:'Set up your profile',               id_d:'Atur profil kamu',                    cond:function(s){return s.hasProfile}, xp:5 },
    { id:'first_note',    icon:'sticky_note_2',     en:'First Note',       id:'Catatan Pertama',   en_d:'Write your first note',             id_d:'Tulis catatan pertamamu',             cond:function(s){return s.notesCount>=1}, xp:5 },
    { id:'first_bm',      icon:'bookmark_add',      en:'First Bookmark',   id:'Bookmark Pertama',  en_d:'Save your first material',          id_d:'Simpan materi pertamamu',             cond:function(s){return s.bmCount>=1}, xp:5 },
    { id:'first_dc',      icon:'event_available',   en:'Daily Starter',    id:'Starter Harian',    en_d:'Complete first Daily Challenge',    id_d:'Selesaikan Tantangan Harian pertama', cond:function(s){return s.dcCount>=1}, xp:10 },

    // ─── CATEGORY 2: LEARNING PROGRESS (10) ───
    { id:'part_1',        icon:'auto_stories',      en:'Bookworm',         id:'Kutu Buku',         en_d:'Complete 1 part',                   id_d:'Selesaikan 1 bagian',                 cond:function(s){return s.partsDone>=1}, xp:10 },
    { id:'part_5',        icon:'menu_book',         en:'Rising Star',      id:'Bintang Baru',      en_d:'Complete 5 parts',                  id_d:'Selesaikan 5 bagian',                 cond:function(s){return s.partsDone>=5}, xp:25 },
    { id:'part_10',       icon:'trending_up',       en:'On Fire',          id:'Semangat Membara',  en_d:'Complete 10 parts',                 id_d:'Selesaikan 10 bagian',                cond:function(s){return s.partsDone>=10}, xp:50 },
    { id:'part_25',       icon:'whatshot',          en:'Dedicated',        id:'Berdedikasi',       en_d:'Complete 25 parts',                 id_d:'Selesaikan 25 bagian',                cond:function(s){return s.partsDone>=25}, xp:100 },
    { id:'part_50',       icon:'military_tech',     en:'Halfway Hero',     id:'Pahlawan Tengah',   en_d:'Complete 50 parts',                 id_d:'Selesaikan 50 bagian',                cond:function(s){return s.partsDone>=50}, xp:200 },
    { id:'part_100',      icon:'workspace_premium', en:'Centurion',        id:'Centurion',         en_d:'Complete 100 parts',                id_d:'Selesaikan 100 bagian',               cond:function(s){return s.partsDone>=100}, xp:500 },
    { id:'all_spe',       icon:'mic_external_on',   en:'Speaking Pro',     id:'Pro Speaking',      en_d:'Complete all Speaking units',       id_d:'Selesaikan semua unit Speaking',      cond:function(s){return s.speComplete}, xp:150 },
    { id:'all_voc',       icon:'spellcheck',        en:'Vocab Master',     id:'Master Kosakata',   en_d:'Complete all Vocabulary units',     id_d:'Selesaikan semua unit Kosakata',      cond:function(s){return s.vocComplete}, xp:150 },
    { id:'all_gra',       icon:'functions',         en:'Grammar Guru',     id:'Guru Tata Bahasa',  en_d:'Complete all Grammar units',        id_d:'Selesaikan semua unit Grammar',       cond:function(s){return s.graComplete}, xp:150 },
    { id:'all_modules',   icon:'school',            en:'Scholar',          id:'Cendekia',          en_d:'Complete all modules',              id_d:'Selesaikan semua modul',              cond:function(s){return s.allModules}, xp:1000 },

    // ─── CATEGORY 3: QUIZ & SCORES (6) ───
    { id:'first_quiz',    icon:'quiz',              en:'Quiz Taker',       id:'Pengerja Kuis',     en_d:'Complete your first quiz',          id_d:'Selesaikan kuis pertamamu',           cond:function(s){return s.quizCount>=1}, xp:10 },
    { id:'perfect_quiz',  icon:'stars',             en:'Quiz Master',      id:'Master Kuis',       en_d:'Get 100% in a quiz',              id_d:'Dapatkan 100% di kuis',               cond:function(s){return s.perfectQuiz}, xp:50 },
    { id:'five_perfect',  icon:'diamond',           en:'Perfect Streak',   id:'Seri Sempurna',     en_d:'Get 5 perfect quizzes',           id_d:'Dapatkan 5 kuis sempurna',            cond:function(s){return s.perfectCount>=5}, xp:150 },
    { id:'ten_perfect',   icon:'diamond',           en:'Quiz Legend',      id:'Legenda Kuis',      en_d:'Get 10 perfect quizzes',          id_d:'Dapatkan 10 kuis sempurna',           cond:function(s){return s.perfectCount>=10}, xp:300 },
    { id:'avg_80',        icon:'emoji_events',      en:'High Achiever',    id:'Pencapaian Tinggi', en_d:'Average quiz score 80+',          id_d:'Rata-rata skor kuis 80+',             cond:function(s){return s.avgQuiz>=80}, xp:100 },
    { id:'avg_95',        icon:'workspace_premium', en:'Top Performer',    id:'Pemain Terbaik',    en_d:'Average quiz score 95+',          id_d:'Rata-rata skor kuis 95+',             cond:function(s){return s.avgQuiz>=95}, xp:250 },

    // ─── CATEGORY 4: STREAKS & CONSISTENCY (6) ───
    { id:'streak_3',      icon:'local_fire_department', en:'Consistent',     id:'Konsisten',         en_d:'3 day streak',                      id_d:'3 hari berturut-turut',               cond:function(s){return s.streak>=3}, xp:30 },
    { id:'streak_7',      icon:'local_fire_department', en:'Week Warrior',   id:'Pejuang Minggu',    en_d:'7 day streak',                      id_d:'7 hari berturut-turut',               cond:function(s){return s.streak>=7}, xp:70 },
    { id:'streak_14',     icon:'local_fire_department', en:'Two Week Pro',   id:'Pro 2 Minggu',      en_d:'14 day streak',                     id_d:'14 hari berturut-turut',              cond:function(s){return s.streak>=14}, xp:150 },
    { id:'streak_30',     icon:'local_fire_department', en:'Monthly Master', id:'Master Bulanan',    en_d:'30 day streak',                     id_d:'30 hari berturut-turut',              cond:function(s){return s.streak>=30}, xp:350 },
    { id:'streak_100',    icon:'local_fire_department', en:'Unstoppable',    id:'Tak Terhentikan',   en_d:'100 day streak',                    id_d:'100 hari berturut-turut',             cond:function(s){return s.streak>=100}, xp:1000 },
    { id:'login_50',      icon:'login',             en:'Regular Visitor',  id:'Pengunjung Tetap',  en_d:'Login 50 times',                    id_d:'Login 50 kali',                       cond:function(s){return s.loginCount>=50}, xp:100 },

    // ─── CATEGORY 5: FOCUS MODE (5) ───
    { id:'focus_1',       icon:'timer',             en:'First Focus',      id:'Fokus Pertama',     en_d:'Complete 1 focus session',          id_d:'Selesaikan 1 sesi fokus',             cond:function(s){return s.focusCount>=1}, xp:15 },
    { id:'focus_10',      icon:'timer',             en:'Focus Addict',     id:'Kecanduan Fokus',   en_d:'Complete 10 focus sessions',        id_d:'Selesaikan 10 sesi fokus',            cond:function(s){return s.focusCount>=10}, xp:75 },
    { id:'focus_60',      icon:'hourglass_top',     en:'Hour Master',      id:'Master Jam',        en_d:'60 hours of focus time',            id_d:'60 jam waktu fokus',                  cond:function(s){return s.focusHours>=60}, xp:500 },
    { id:'focus_100',     icon:'hourglass_bottom',  en:'Marathon',         id:'Maraton',           en_d:'100 hours of focus time',           id_d:'100 jam waktu fokus',                 cond:function(s){return s.focusHours>=100}, xp:1000 },
    { id:'focus_perfect', icon:'check_circle',      en:'No-Skip Hero',     id:'Pahlawan No-Skip',  en_d:'Complete 5 sessions without skip',  id_d:'5 sesi tanpa skip',                   cond:function(s){return s.focusNoSkip>=5}, xp:150 },

    // ─── CATEGORY 6: SOCIAL & ENGAGEMENT (5) ───
    { id:'bm_10',         icon:'collections_bookmark', en:'Collector',     id:'Kolektor',          en_d:'Bookmark 10 materials',             id_d:'Bookmark 10 materi',                  cond:function(s){return s.bmCount>=10}, xp:50 },
    { id:'bm_25',         icon:'bookmarks',         en:'Library',          id:'Perpustakaan',      en_d:'Bookmark 25 materials',             id_d:'Bookmark 25 materi',                  cond:function(s){return s.bmCount>=25}, xp:125 },
    { id:'notes_10',      icon:'description',       en:'Note Taker',       id:'Pencatat',          en_d:'Write 10 notes',                    id_d:'Tulis 10 catatan',                    cond:function(s){return s.notesCount>=10}, xp:50 },
    { id:'notes_50',      icon:'article',           en:'Note Master',      id:'Master Catatan',    en_d:'Write 50 notes',                    id_d:'Tulis 50 catatan',                    cond:function(s){return s.notesCount>=50}, xp:150 },
    { id:'react_10',      icon:'thumb_up',          en:'Feedback Fan',     id:'Penggemar Feedback',en_d:'Give feedback 10 times',            id_d:'Kasih feedback 10 kali',              cond:function(s){return s.reactCount>=10}, xp:30 },

    // ─── CATEGORY 7: DAILY CHALLENGE (4) ───
    { id:'dc_7',          icon:'today',             en:'Week Challenger',  id:'Penantang Minggu',  en_d:'Complete 7 Daily Challenges',       id_d:'Selesaikan 7 Tantangan Harian',       cond:function(s){return s.dcCount>=7}, xp:100 },
    { id:'dc_30',         icon:'calendar_month',    en:'Month Champion',   id:'Juara Bulan',       en_d:'Complete 30 Daily Challenges',      id_d:'Selesaikan 30 Tantangan Harian',      cond:function(s){return s.dcCount>=30}, xp:500 },
    { id:'dc_all',        icon:'verified',          en:'Challenge Master', id:'Master Tantangan',  en_d:'Complete all Daily Challenges',     id_d:'Selesaikan semua Tantangan Harian',   cond:function(s){return s.dcCount>=100}, xp:1500 },
    { id:'dc_streak_10',  icon:'bolt',              en:'DC Streaker',      id:'DC Streaker',       en_d:'10 day DC streak',                  id_d:'10 hari DC berturut-turut',           cond:function(s){return s.dcStreak>=10}, xp:200 },

    // ─── CATEGORY 8: SPEAKING & LISTENING (3) ───
    { id:'speak_10',      icon:'graphic_eq',        en:'Speaker',          id:'Pembicara',         en_d:'Record 10 speaking clips',          id_d:'Rekam 10 klip berbicara',             cond:function(s){return s.speakCount>=10}, xp:75 },
    { id:'speak_50',      icon:'surround_sound',    en:'Chatterbox',       id:'Periang',           en_d:'Record 50 speaking clips',          id_d:'Rekam 50 klip berbicara',             cond:function(s){return s.speakCount>=50}, xp:200 },
    { id:'listen_20',     icon:'headphones',        en:'Active Listener',  id:'Pendengar Aktif',   en_d:'Listen to 20 audio materials',      id_d:'Dengarkan 20 materi audio',           cond:function(s){return s.listenCount>=20}, xp:50 },

    // ─── CATEGORY 9: SPECIAL/RARE (3) ───
    { id:'early_bird',    icon:'wb_sunny',          en:'Early Bird',       id:'Bangun Pagi',       en_d:'Study before 6 AM',                 id_d:'Belajar sebelum jam 6 pagi',          cond:function(s){return s.earlyBird}, xp:25 },
    { id:'night_owl',     icon:'dark_mode',         en:'Night Owl',        id:'Begadang',          en_d:'Study after 10 PM',                 id_d:'Belajar setelah jam 10 malam',        cond:function(s){return s.nightOwl}, xp:25 },
    { id:'marathon',      icon:'directions_run',    en:'Marathon Learner', id:'Pelajar Maraton',   en_d:'Study 3+ hours in one day',         id_d:'Belajar 3+ jam dalam satu hari',      cond:function(s){return s.marathonDay}, xp:100 }
  ],

  // ═══════════ DAILY CHALLENGES (AUTO-COMPLETE) ═══════════
  DAILY_CHALLENGES: [
    { icon:'graphic_eq',     en:'Speak It Out',    id:'Bicara Keras',       en_d:'Record 1 speaking clip today',         id_d:'Rekam 1 klip speaking hari ini',         trigger:'speak',    xp:20 },
    { icon:'translate',      en:'Word Hunter',     id:'Pemburu Kata',       en_d:'Complete 1 Vocabulary part',             id_d:'Selesaikan 1 bagian Kosakata',           trigger:'voc_part', xp:20 },
    { icon:'draw',           en:'Write It Down',   id:'Tulislah',           en_d:'Submit 1 writing essay',                 id_d:'Kirim 1 esai writing',                   trigger:'writing',  xp:25 },
    { icon:'hearing',        en:'Listen Up',       id:'Dengarkan',          en_d:'Listen to 1 Listening audio',            id_d:'Dengarkan 1 audio Listening',            trigger:'lis_part', xp:20 },
    { icon:'quiz',           en:'Quiz Champion',   id:'Juara Kuis',         en_d:'Score 80+ in any quiz',                  id_d:'Skor 80+ di kuis mana pun',              trigger:'quiz_80',  xp:25 },
    { icon:'autorenew',      en:'Review Master',   id:'Master Review',      en_d:'Re-open a completed material',           id_d:'Buka kembali materi yang sudah selesai', trigger:'review',   xp:15 },
    { icon:'sticky_note_2',  en:'Note Taker',      id:'Pencatat',           en_d:'Write 1 note on any material',           id_d:'Tulis 1 catatan di materi mana pun',     trigger:'note',     xp:15 },
    { icon:'timer',          en:'Focus Hero',      id:'Pahlawan Fokus',     en_d:'Complete 1 focus mode session',          id_d:'Selesaikan 1 sesi mode fokus',           trigger:'focus',    xp:20 },
    { icon:'record_voice_over', en:'Say It Loud',  id:'Katakan Keras',      en_d:'Use TTS 3 times today',                  id_d:'Gunakan TTS 3 kali hari ini',            trigger:'tts_3',    xp:15 },
    { icon:'bookmark_add',   en:'Save for Later',  id:'Simpan Nanti',       en_d:'Bookmark 1 new material today',          id_d:'Bookmark 1 materi baru hari ini',        trigger:'bookmark', xp:15 },
    { icon:'emoji_events',   en:'Perfect Shot',    id:'Tembakan Sempurna',  en_d:'Get 100% on any quiz today',             id_d:'Dapatkan 100% di kuis mana pun',         trigger:'quiz_100', xp:30 },
    { icon:'school',         en:'Multi-Module',    id:'Multi-Modul',        en_d:'Study 2 different modules today',        id_d:'Belajar 2 modul berbeda hari ini',       trigger:'multi_mod',xp:25 },
    { icon:'local_fire_department', en:'Streak Keeper', id:'Penjaga Streak', en_d:'Maintain your login streak today',     id_d:'Pertahankan streak login hari ini',      trigger:'login',    xp:10 },
    { icon:'update',         en:'Comeback Kid',    id:'Si Comeback',        en_d:'Login after 2+ days away',               id_d:'Login setelah 2+ hari absen',            trigger:'comeback', xp:20 }
  ]
};
