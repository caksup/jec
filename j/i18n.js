// JEC v.7.00 MODULAR | 16/08/2026 | j/i18n.js | Bilingual Dictionary
// Lengkap untuk semua UI text (EN + ID)
// Dipakai oleh: JEC.t('key') di j.js dan feature modules

'use strict';

window.JEC_I18N = {
  en: {
    // ═══════════ SPLASH ═══════════
    splash_tag: 'JAGAT E COURSE • ENGLISH LEARNING',
    splash_bot: 'JEC 2026 • v7.0 • Jagat Kreatif',
    
    // ═══════════ LOGIN ═══════════
    welcome_to: 'Welcome to',
    digital: 'Digital',
    course: 'Course',
    login_subtitle: 'Student Portal',
    motivation: 'Learning English is easy and fun!',
    cta: "Let's learn together with Jagat E Course!",
    student_id: 'Student ID',
    pin: 'PIN',
    login_btn: 'SIGN IN',
    sign_in: 'SIGN IN',
    login_footer: 'Forgot PIN? Contact admin.',
    loading: 'Signing in...',
    loading_sub: 'Please wait a moment',
    fill_all_fields: 'Please fill all fields',
    login_failed: 'Login failed',
    network_error: 'Network error',
    id_pin_wrong: 'ID or PIN is incorrect',
    account_inactive: 'Account inactive. Contact admin.',
    data_load_failed: 'Failed to load data',
    
    // ═══════════ HEADER ═══════════
    online: 'online',
    greet: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night'
    },
    wave: '👋',
    
    // ═══════════ NAVIGATION ═══════════
    learn: 'Learn',
    practice: 'Practice',
    extra: 'Extra',
    profile: 'Profile',
    
    // ═══════════ LEARN MODULE ═══════════
    all: 'All',
    speaking: 'Speaking',
    vocabulary: 'Vocabulary',
    grammar: 'Grammar',
    writing: 'Writing',
    listening: 'Listening',
    parts: 'parts',
    done: 'done',
    locked: 'Locked',
    no_materi: 'No materials yet',
    not_found: 'Not found',
    
    // ═══════════ MATERI PLAYER ═══════════
    material: 'Material',
    play_audio: 'Play Audio',
    stop_audio: 'Stop Audio',
    my_notes: 'MY NOTES',
    write_notes: 'Write notes...',
    done_indicator: 'Done!',
    exercise: 'Exercise',
    exercise_title: 'Exercise',
    no_audio: 'No audio content',
    
    // ═══════════ VOCABULARY ═══════════
    english: 'English',
    indonesian: 'Indonesian',
    bookmark_added: 'Bookmarked!',
    bookmark_removed: 'Bookmark removed',
    
    // ═══════════ QUIZ ═══════════
    quiz: 'Quiz',
    quiz_question: 'Question',
    check_answer: 'Check Answer',
    correct: 'Correct',
    wrong: 'Wrong',
    score: 'Score',
    total: 'Total',
    
    // ═══════════ PRACTICE ═══════════
    practice_title: 'Practice',
    flashcards: 'Flashcards',
    flashcards_desc: 'Review vocabulary',
    vocab_duel: 'Vocab Duel',
    vocab_duel_desc: 'Challenge word matching',
    word_day: 'Word of Day',
    word_day_desc: 'Learn one new word daily',
    scramble: 'Word Scramble',
    scramble_desc: 'Rearrange letters',
    mcq: 'Multiple Choice',
    mcq_desc: 'Test your knowledge',
    listening_quiz: 'Listening Quiz',
    listening_desc: 'Hear & choose',
    speaking_drill: 'Speaking Drill',
    speaking_desc: 'Practice pronunciation',
    coming_soon: 'Coming Soon',
    tap_to_play: 'Tap to Play',
    leaderboard: 'Leaderboard',
    no_leaderboard: 'No leaderboard data yet',
    day_streak: 'day streak',
    
    // ═══════════ EXTRA ═══════════
    extra_title: 'Extra Tools',
    tools: 'Tools',
    games: 'Games',
    overview: 'Overview',
    english_tools: 'English Tools',
    memorize_it: 'Memorize It',
    memorize_desc: 'Hafal kalimat',
    dictionary: 'Dictionary',
    dictionary_desc: 'Search words',
    sentence_builder: 'Sentence Builder',
    sentence_desc: 'Make sentences',
    mini_games: 'Mini Games',
    mini_games_desc: 'Fun learning',
    overview_siswa: 'Student Overview',
    total_students: 'Total Students',
    total_points: 'Total Points',
    your_rank: 'Your Rank',
    all_rankings: 'All Rankings',
    leaderboard_empty: 'Leaderboard is empty',
    leaderboard_failed: 'Failed to load leaderboard',
    
    // ═══════════ PROFILE ═══════════
    my_profile: 'My Profile',
    data: 'Data',
    badges: 'Badges',
    avatar: 'Avatar',
    data_profil: 'Profile Data',
    login_streak: 'Login Streak',
    study_streak: 'Study Streak',
    parts_done: 'Parts Done',
    days_left: 'Days Left',
    bookmarks: 'Bookmarks',
    notes: 'Notes',
    no_bookmarks: 'No bookmarks yet',
    no_notes: 'No notes yet',
    choose_avatar: 'Choose Avatar',
    
    // ═══════════ ACHIEVEMENTS ═══════════
    achievement_unlocked: 'Achievement Unlocked!',
    achievements: 'Achievements',
    
    // Achievement names
    ach: {
      first_login: 'First Steps',
      profile_setup: 'Profile Ready',
      first_note: 'First Note',
      first_bm: 'First Bookmark',
      first_dc: 'Daily Starter',
      part_1: 'Bookworm',
      part_5: 'Rising Star',
      part_10: 'On Fire',
      part_25: 'Dedicated',
      part_50: 'Halfway Hero',
      part_100: 'Centurion',
      all_spe: 'Speaking Pro',
      all_voc: 'Vocab Master',
      all_gra: 'Grammar Guru',
      all_modules: 'Scholar',
      first_quiz: 'Quiz Taker',
      perfect_quiz: 'Quiz Master',
      five_perfect: 'Perfect Streak',
      ten_perfect: 'Quiz Legend',
      avg_80: 'High Achiever',
      avg_95: 'Top Performer',
      streak_3: 'Consistent',
      streak_7: 'Week Warrior',
      streak_14: 'Two Week Pro',
      streak_30: 'Monthly Master',
      streak_100: 'Unstoppable',
      login_50: 'Regular Visitor',
      focus_1: 'First Focus',
      focus_10: 'Focus Addict',
      focus_60: 'Hour Master',
      focus_100: 'Marathon',
      focus_perfect: 'No-Skip Hero',
      bm_10: 'Collector',
      bm_25: 'Library',
      notes_10: 'Note Taker',
      notes_50: 'Note Master',
      react_10: 'Feedback Fan',
      dc_7: 'Week Challenger',
      dc_30: 'Month Champion',
      dc_all: 'Challenge Master',
      dc_streak_10: 'DC Streaker',
      speak_10: 'Speaker',
      speak_50: 'Chatterbox',
      listen_20: 'Active Listener'
    },
    
    // Achievement descriptions
    ach_d: {
      first_login: 'Login for the first time',
      profile_setup: 'Set up your profile',
      first_note: 'Write your first note',
      first_bm: 'Save your first material',
      first_dc: 'Complete first Daily Challenge',
      part_1: 'Complete 1 part',
      part_5: 'Complete 5 parts',
      part_10: 'Complete 10 parts',
      part_25: 'Complete 25 parts',
      part_50: 'Complete 50 parts',
      part_100: 'Complete 100 parts',
      all_spe: 'Complete all Speaking units',
      all_voc: 'Complete all Vocabulary units',
      all_gra: 'Complete all Grammar units',
      all_modules: 'Complete all modules',
      first_quiz: 'Complete your first quiz',
      perfect_quiz: 'Get 100% in a quiz',
      five_perfect: 'Get 5 perfect quizzes',
      ten_perfect: 'Get 10 perfect quizzes',
      avg_80: 'Average quiz score 80+',
      avg_95: 'Average quiz score 95+',
      streak_3: '3 day streak',
      streak_7: '7 day streak',
      streak_14: '14 day streak',
      streak_30: '30 day streak',
      streak_100: '100 day streak',
      login_50: 'Login 50 times',
      focus_1: 'Complete 1 focus session',
      focus_10: 'Complete 10 focus sessions',
      focus_60: '60 hours of focus time',
      focus_100: '100 hours of focus time',
      focus_perfect: 'Complete 5 sessions without skip',
      bm_10: 'Bookmark 10 materials',
      bm_25: 'Bookmark 25 materials',
      notes_10: 'Write 10 notes',
      notes_50: 'Write 50 notes',
      react_10: 'Give feedback 10 times',
      dc_7: 'Complete 7 Daily Challenges',
      dc_30: 'Complete 30 Daily Challenges',
      dc_all: 'Complete all Daily Challenges',
      dc_streak_10: '10 day DC streak',
      speak_10: 'Record 10 speaking clips',
      speak_50: 'Record 50 speaking clips',
      listen_20: 'Listen to 20 audio materials'
    },
    
    // ═══════════ FOCUS MODE ═══════════
    flm: 'FLM',
    flm_title: 'Focus Learn Mode',
    flm_ready: 'Ready to Focus?',
    flm_desc: 'Focus Learn Mode will lock your navigation. You can only access the current unit and its parts. No distractions, just learning!',
    flm_play: 'Start Focus',
    flm_active: 'Focus Learn Mode Active',
    flm_complete: 'Focus session completed!',
    flm_exit_confirm: 'Exit Focus Learn Mode?',
    focus_mode: 'Focus Mode',
    start: 'Start',
    pause: 'Pause',
    skip: 'Skip',
    reset: 'Reset',
    cancel: 'Cancel',
    
    // ═══════════ DAILY CHALLENGE ═══════════
    daily_challenge: 'Daily Challenge',
    daily_complete: 'Daily Challenge Completed!',
    xp_earned: 'XP Earned',
    
    // ═══════════ REACT/FEEDBACK ═══════════
    feedback: 'Feedback',
    how_was_lesson: 'How was this lesson?',
    thanks_feedback: 'Thanks for your feedback!',
    continue_learning: 'Continue Learning',
    react: {
      great: 'Great!',
      ok: 'Okay',
      bad: 'Bad'
    },
    minigames: 'Minigames',
    
    // ═══════════ MENU ═══════════
    menu: 'Menu',
    guide: 'Guide',
    report: 'Report Issue',
    refresh_data: 'Refresh Data',
    logout: 'Logout',
    logout_confirm: 'Are you sure you want to logout? Your progress is safe.',
    batal: 'Cancel',
    keluar: 'Logout',
    
    // ═══════════ GUIDE ═══════════
    guide_items: [
      { i: 'menu_book', t: 'Learn: Vocabulary, Speaking, Grammar, Writing, Listening' },
      { i: 'fitness_center', t: 'Practice: Flashcards, Scramble, MCQ, Listening' },
      { i: 'language', t: 'Extra: English Tools, Games, Student Overview' },
      { i: 'timer', t: 'Focus Learn: Floating button, tap to focus (fullscreen + back lock)' },
      { i: 'fullscreen', t: 'Tap screen / fullscreen button for immersive mode' },
      { i: 'person', t: 'Tap name/avatar = profile' }
    ],
    
    // ═══════════ REPORT ═══════════
    report_issue: 'Report Issue',
    report_placeholder: 'Describe the problem...',
    send_wa: 'Send via WhatsApp',
    opening_wa: 'Opening WhatsApp...',
    describe_problem: 'Please describe the problem',
    
    // ═══════════ STATUS & MESSAGES ═══════════
    offline: "You're offline",
    online_status: 'online',
    maintenance: 'Maintenance Service',
    under_construction: 'This feature is currently being developed.',
    error_load: 'Under Repair',
    error_desc: 'This feature encountered an error and is temporarily unavailable.',
    refreshing: 'Refreshing...',
    refreshed: 'Data refreshed!',
    refresh_failed: 'Failed to refresh data',
    retry: 'Try Again',
    
    // ═══════════ VALIDATION ═══════════
    invalid_module: 'Invalid module',
    invalid_unit: 'Invalid unit',
    invalid_part: 'Invalid part',
    
    // ═══════════ AVATAR ═══════════
    avatars: {
      default: 'Student',
      boy: 'Boy',
      girl: 'Girl',
      teacher: 'Teacher',
      man: 'Businessman',
      woman: 'Businesswoman',
      doctor: 'Doctor',
      nurse: 'Nurse',
      astronaut: 'Astronaut',
      singer: 'Singer',
      lion: 'Lion',
      tiger: 'Tiger',
      fox: 'Fox',
      panda: 'Panda',
      bear: 'Bear',
      unicorn: 'Unicorn'
    },
    
    // ═══════════ TIME ═══════════
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    
    // ═══════════ MISC ═══════════
    you: 'you',
    rank: 'Rank',
    points: 'pt',
    empty: 'Empty',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    view_all: 'View All',
    see_more: 'See More',
    loading_more: 'Loading more...',
    end_of_list: 'End of list'
  },
  
  id: {
    // ═══════════ SPLASH ═══════════
    splash_tag: 'JAGAT E COURSE • BELAJAR BAHASA INGGRIS',
    splash_bot: 'JEC 2026 • v7.0 • Jagat Kreatif',
    
    // ═══════════ LOGIN ═══════════
    welcome_to: 'Selamat datang di',
    digital: 'Digital',
    course: 'Kursus',
    login_subtitle: 'Portal Siswa',
    motivation: 'Belajar bahasa Inggris itu mudah dan seru!',
    cta: 'Ayo belajar bersama Jagat E Course!',
    student_id: 'ID Siswa',
    pin: 'PIN',
    login_btn: 'MASUK',
    sign_in: 'MASUK',
    login_footer: 'Lupa PIN? Hubungi admin.',
    loading: 'Sedang masuk...',
    loading_sub: 'Mohon tunggu sebentar',
    fill_all_fields: 'Mohon isi semua field',
    login_failed: 'Login gagal',
    network_error: 'Error jaringan',
    id_pin_wrong: 'ID atau PIN salah',
    account_inactive: 'Akun tidak aktif. Hubungi admin.',
    data_load_failed: 'Gagal memuat data',
    
    // ═══════════ HEADER ═══════════
    online: 'online',
    greet: {
      morning: 'Selamat pagi',
      afternoon: 'Selamat siang',
      evening: 'Selamat sore',
      night: 'Selamat malam'
    },
    wave: '👋',
    
    // ═══════════ NAVIGATION ═══════════
    learn: 'Belajar',
    practice: 'Latihan',
    extra: 'Ekstra',
    profile: 'Profil',
    
    // ═══════════ LEARN MODULE ═══════════
    all: 'Semua',
    speaking: 'Speaking',
    vocabulary: 'Kosakata',
    grammar: 'Tata Bahasa',
    writing: 'Menulis',
    listening: 'Mendengarkan',
    parts: 'bagian',
    done: 'selesai',
    locked: 'Terkunci',
    no_materi: 'Belum ada materi',
    not_found: 'Tidak ditemukan',
    
    // ═══════════ MATERI PLAYER ═══════════
    material: 'Materi',
    play_audio: 'Putar Audio',
    stop_audio: 'Stop Audio',
    my_notes: 'CATATAN SAYA',
    write_notes: 'Tulis catatan...',
    done_indicator: 'Selesai!',
    exercise: 'Latihan Soal',
    exercise_title: 'Latihan',
    no_audio: 'Tidak ada konten audio',
    
    // ═══════════ VOCABULARY ═══════════
    english: 'Inggris',
    indonesian: 'Indonesia',
    bookmark_added: 'Dibookmark!',
    bookmark_removed: 'Bookmark dihapus',
    
    // ═══════════ QUIZ ═══════════
    quiz: 'Kuis',
    quiz_question: 'Pertanyaan',
    check_answer: 'Cek Jawaban',
    correct: 'Benar',
    wrong: 'Salah',
    score: 'Skor',
    total: 'Total',
    
    // ═══════════ PRACTICE ═══════════
    practice_title: 'Latihan',
    flashcards: 'Kartu Kata',
    flashcards_desc: 'Review kosakata',
    vocab_duel: 'Duel Kosakata',
    vocab_duel_desc: 'Tantang mencocokkan kata',
    word_day: 'Kata Hari Ini',
    word_day_desc: 'Belajar 1 kata baru setiap hari',
    scramble: 'Acak Kata',
    scramble_desc: 'Susun huruf acak',
    mcq: 'Pilihan Ganda',
    mcq_desc: 'Uji pengetahuanmu',
    listening_quiz: 'Kuis Listening',
    listening_desc: 'Dengar & pilih',
    speaking_drill: 'Latihan Speaking',
    speaking_desc: 'Latih pengucapan',
    coming_soon: 'Segera Hadir',
    tap_to_play: 'Tap untuk Main',
    leaderboard: 'Papan Peringkat',
    no_leaderboard: 'Belum ada data leaderboard',
    day_streak: 'hari streak',
    
    // ═══════════ EXTRA ═══════════
    extra_title: 'Alat Ekstra',
    tools: 'Alat',
    games: 'Permainan',
    overview: 'Ringkasan',
    english_tools: 'Alat Bahasa Inggris',
    memorize_it: 'Hafalan',
    memorize_desc: 'Hafal kalimat',
    dictionary: 'Kamus',
    dictionary_desc: 'Cari kata',
    sentence_builder: 'Pembuat Kalimat',
    sentence_desc: 'Buat kalimat',
    mini_games: 'Permainan Mini',
    mini_games_desc: 'Belajar seru',
    overview_siswa: 'Ringkasan Siswa',
    total_students: 'Total Siswa',
    total_points: 'Total Poin',
    your_rank: 'Rank Kamu',
    all_rankings: 'Semua Peringkat',
    leaderboard_empty: 'Leaderboard kosong',
    leaderboard_failed: 'Gagal memuat leaderboard',
    
    // ═══════════ PROFILE ═══════════
    my_profile: 'Profil Saya',
    data: 'Data',
    badges: 'Lencana',
    avatar: 'Avatar',
    data_profil: 'Data Profil',
    login_streak: 'Streak Login',
    study_streak: 'Streak Belajar',
    parts_done: 'Bagian Selesai',
    days_left: 'Sisa Hari',
    bookmarks: 'Bookmark',
    notes: 'Catatan',
    no_bookmarks: 'Belum ada bookmark',
    no_notes: 'Belum ada catatan',
    choose_avatar: 'Pilih Avatar',
    
    // ═══════════ ACHIEVEMENTS ═══════════
    achievement_unlocked: 'Pencapaian Terbuka!',
    achievements: 'Pencapaian',
    
    ach: {
      first_login: 'Langkah Pertama',
      profile_setup: 'Profil Siap',
      first_note: 'Catatan Pertama',
      first_bm: 'Bookmark Pertama',
      first_dc: 'Starter Harian',
      part_1: 'Kutu Buku',
      part_5: 'Bintang Baru',
      part_10: 'Semangat Membara',
      part_25: 'Berdedikasi',
      part_50: 'Pahlawan Tengah',
      part_100: 'Centurion',
      all_spe: 'Pro Speaking',
      all_voc: 'Master Kosakata',
      all_gra: 'Guru Tata Bahasa',
      all_modules: 'Cendekia',
      first_quiz: 'Pengerja Kuis',
      perfect_quiz: 'Master Kuis',
      five_perfect: 'Seri Sempurna',
      ten_perfect: 'Legenda Kuis',
      avg_80: 'Pencapaian Tinggi',
      avg_95: 'Pemain Terbaik',
      streak_3: 'Konsisten',
      streak_7: 'Pejuang Minggu',
      streak_14: 'Pro 2 Minggu',
      streak_30: 'Master Bulanan',
      streak_100: 'Tak Terhentikan',
      login_50: 'Pengunjung Tetap',
      focus_1: 'Fokus Pertama',
      focus_10: 'Kecanduan Fokus',
      focus_60: 'Master Jam',
      focus_100: 'Maraton',
      focus_perfect: 'Pahlawan No-Skip',
      bm_10: 'Kolektor',
      bm_25: 'Perpustakaan',
      notes_10: 'Pencatat',
      notes_50: 'Master Catatan',
      react_10: 'Penggemar Feedback',
      dc_7: 'Penantang Minggu',
      dc_30: 'Juara Bulan',
      dc_all: 'Master Tantangan',
      dc_streak_10: 'DC Streaker',
      speak_10: 'Pembicara',
      speak_50: 'Periang',
      listen_20: 'Pendengar Aktif'
    },
    
    ach_d: {
      first_login: 'Login pertama kali',
      profile_setup: 'Atur profil kamu',
      first_note: 'Tulis catatan pertamamu',
      first_bm: 'Simpan materi pertamamu',
      first_dc: 'Selesaikan Tantangan Harian pertama',
      part_1: 'Selesaikan 1 bagian',
      part_5: 'Selesaikan 5 bagian',
      part_10: 'Selesaikan 10 bagian',
      part_25: 'Selesaikan 25 bagian',
      part_50: 'Selesaikan 50 bagian',
      part_100: 'Selesaikan 100 bagian',
      all_spe: 'Selesaikan semua unit Speaking',
      all_voc: 'Selesaikan semua unit Kosakata',
      all_gra: 'Selesaikan semua unit Grammar',
      all_modules: 'Selesaikan semua modul',
      first_quiz: 'Selesaikan kuis pertamamu',
      perfect_quiz: 'Dapatkan 100% di kuis',
      five_perfect: 'Dapatkan 5 kuis sempurna',
      ten_perfect: 'Dapatkan 10 kuis sempurna',
      avg_80: 'Rata-rata skor kuis 80+',
      avg_95: 'Rata-rata skor kuis 95+',
      streak_3: '3 hari berturut-turut',
      streak_7: '7 hari berturut-turut',
      streak_14: '14 hari berturut-turut',
      streak_30: '30 hari berturut-turut',
      streak_100: '100 hari berturut-turut',
      login_50: 'Login 50 kali',
      focus_1: 'Selesaikan 1 sesi fokus',
      focus_10: 'Selesaikan 10 sesi fokus',
      focus_60: '60 jam waktu fokus',
      focus_100: '100 jam waktu fokus',
      focus_perfect: '5 sesi tanpa skip',
      bm_10: 'Bookmark 10 materi',
      bm_25: 'Bookmark 25 materi',
      notes_10: 'Tulis 10 catatan',
      notes_50: 'Tulis 50 catatan',
      react_10: 'Kasih feedback 10 kali',
      dc_7: 'Selesaikan 7 Tantangan Harian',
      dc_30: 'Selesaikan 30 Tantangan Harian',
      dc_all: 'Selesaikan semua Tantangan Harian',
      dc_streak_10: '10 hari DC berturut-turut',
      speak_10: 'Rekam 10 klip berbicara',
      speak_50: 'Rekam 50 klip berbicara',
      listen_20: 'Dengarkan 20 materi audio'
    },
    
    // ═══════════ FOCUS MODE ═══════════
    flm: 'FLM',
    flm_title: 'Mode Fokus Belajar',
    flm_ready: 'Siap Fokus?',
    flm_desc: 'Mode Fokus Belajar akan mengunci navigasimu. Kamu hanya bisa mengakses unit dan parts yang sedang dipelajari. Tanpa gangguan, hanya belajar!',
    flm_play: 'Mulai Fokus',
    flm_active: 'Mode Fokus Belajar Aktif',
    flm_complete: 'Sesi fokus selesai!',
    flm_exit_confirm: 'Keluar dari Mode Fokus Belajar?',
    focus_mode: 'Mode Fokus',
    start: 'Mulai',
    pause: 'Jeda',
    skip: 'Lewati',
    reset: 'Reset',
    cancel: 'Batal',
    
    // ═══════════ DAILY CHALLENGE ═══════════
    daily_challenge: 'Tantangan Harian',
    daily_complete: 'Tantangan Harian Selesai!',
    xp_earned: 'XP Didapat',
    
    // ═══════════ REACT/FEEDBACK ═══════════
    feedback: 'Umpan Balik',
    how_was_lesson: 'Bagaimana pelajaran ini?',
    thanks_feedback: 'Terima kasih atas feedbackmu!',
    continue_learning: 'Lanjut Belajar',
    react: {
      great: 'Mantap!',
      ok: 'Oke',
      bad: 'Kurang'
    },
    minigames: 'Minigames',
    
    // ═══════════ MENU ═══════════
    menu: 'Menu',
    guide: 'Panduan',
    report: 'Lapor Masalah',
    refresh_data: 'Refresh Data',
    logout: 'Keluar',
    logout_confirm: 'Yakin ingin keluar? Progres tersimpan aman.',
    batal: 'Batal',
    keluar: 'Keluar',
    
    // ═══════════ GUIDE ═══════════
    guide_items: [
      { i: 'menu_book', t: 'Belajar: Vocabulary, Speaking, Grammar, Writing, Listening' },
      { i: 'fitness_center', t: 'Latihan: Kartu Kata, Acak Kata, Pilihan Ganda, Listening' },
      { i: 'language', t: 'Ekstra: Alat Bahasa Inggris, Permainan, Ringkasan Siswa' },
      { i: 'timer', t: 'Mode Fokus: Tombol melayang, tap untuk fokus (fullscreen + kunci back)' },
      { i: 'fullscreen', t: 'Tap layar / tombol fullscreen untuk mode immersif' },
      { i: 'person', t: 'Tap nama/avatar = profil' }
    ],
    
    // ═══════════ REPORT ═══════════
    report_issue: 'Lapor Masalah',
    report_placeholder: 'Deskripsikan masalahnya...',
    send_wa: 'Kirim via WhatsApp',
    opening_wa: 'Membuka WhatsApp...',
    describe_problem: 'Mohon deskripsikan masalahnya',
    
    // ═══════════ STATUS & MESSAGES ═══════════
    offline: 'Kamu sedang offline',
    online_status: 'online',
    maintenance: 'Layanan Maintenance',
    under_construction: 'Fitur ini sedang dalam pengembangan.',
    error_load: 'Sedang Diperbaiki',
    error_desc: 'Fitur ini mengalami kesalahan dan sementara tidak tersedia.',
    refreshing: 'Menyegarkan...',
    refreshed: 'Data berhasil disegarkan!',
    refresh_failed: 'Gagal menyegarkan data',
    retry: 'Coba Lagi',
    
    // ═══════════ VALIDATION ═══════════
    invalid_module: 'Modul tidak valid',
    invalid_unit: 'Unit tidak valid',
    invalid_part: 'Part tidak valid',
    
    // ═══════════ AVATAR ═══════════
    avatars: {
      default: 'Siswa',
      boy: 'Cowok',
      girl: 'Cewek',
      teacher: 'Guru',
      man: 'Pria Bisnis',
      woman: 'Wanita Bisnis',
      doctor: 'Dokter',
      nurse: 'Perawat',
      astronaut: 'Astronot',
      singer: 'Penyanyi',
      lion: 'Singa',
      tiger: 'Harimau',
      fox: 'Rubah',
      panda: 'Panda',
      bear: 'Beruang',
      unicorn: 'Unicorn'
    },
    
    // ═══════════ TIME ═══════════
    days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    months: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    
    // ═══════════ MISC ═══════════
    you: 'kamu',
    rank: 'Peringkat',
    points: 'pt',
    empty: 'Kosong',
    yes: 'Ya',
    no: 'Tidak',
    ok: 'OK',
    close: 'Tutup',
    save: 'Simpan',
    delete: 'Hapus',
    edit: 'Edit',
    back: 'Kembali',
    next: 'Lanjut',
    previous: 'Sebelumnya',
    search: 'Cari',
    filter: 'Filter',
    sort: 'Urutkan',
    view_all: 'Lihat Semua',
    see_more: 'Lihat Lainnya',
    loading_more: 'Memuat lagi...',
    end_of_list: 'Akhir daftar'
  }
};

// Helper function for nested key access
window.JEC_I18N.get = function(lang, key) {
  if (!key) return '';
  const dict = this[lang] || this.en || {};
  const parts = key.split('.');
  let obj = dict;
  for (let i = 0; i < parts.length; i++) {
    if (obj[parts[i]] === undefined) return key;
    obj = obj[parts[i]];
  }
  return obj;
};

// Helper for achievement name
window.JEC_I18N.getAchName = function(lang, achId) {
  const dict = this[lang] || this.en || {};
  return (dict.ach && dict.ach[achId]) || achId;
};

// Helper for achievement description
window.JEC_I18N.getAchDesc = function(lang, achId) {
  const dict = this[lang] || this.en || {};
  return (dict.ach_d && dict.ach_d[achId]) || '';
};
