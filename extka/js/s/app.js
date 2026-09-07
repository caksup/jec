/* #11 | /root/js/s/app.js | v 1.0 | u 06/09/2026 • 20:45:18 | xu : ke-1 | note : 
- Student Panel JavaScript lengkap (SPA)
- Features: Login, Dashboard, Test Interface, Anti-Cheat, Result, Review, Profile Edit
- 4 tipe soal: PGS, MCMA, PGK (True/False), ISIAN
- Anti-cheat system: tab switch detection, blur detection, auto-submit
- Timer countdown dengan warning states
- Question navigation panel dengan flag feature
- Score calculation untuk semua tipe soal
- PIN bisa diganti oleh siswa (sesuai requirement)
- Real-time session status checking
- Mobile-first optimized dengan touch feedback
- Consistent dengan css/s.css classes */

// ============================================
// IMPORTS
// ============================================
import { db, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from '../fc.js';
import { hashPin, verifyPin, validatePin, formatDuration, formatCountdown, getCurrentDateTime } from '../hash.js';
import { modal } from '../modal.js';
import { HeaderManager } from '../header.js';

// ============================================
// GLOBAL STATE
// ============================================
const state = {
  currentUser: null,
  headerManager: null,
  sessionsData: [],
  attemptsData: [],
  
  // Test state
  currentSession: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  flaggedQuestions: new Set(),
  
  // Timer state
  timerInterval: null,
  timeRemaining: 0,
  startTime: null,
  
  // Anti-cheat state
  settings: {
    antiCheatEnabled: true,
    maxTabSwitches: 3
  },
  tabSwitchCount: 0,
  blurCount: 0,
  antiCheatLog: [],
  
  // UI state
  navPanelExpanded: false
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initGlobalEventListeners();
});

function checkAuth() {
  const session = sessionStorage.getItem('student_session') || localStorage.getItem('student_session');
  
  if (session) {
    try {
      state.currentUser = JSON.parse(session);
      showDashboard();
    } catch (error) {
      console.error('Invalid session:', error);
      sessionStorage.removeItem('student_session');
      localStorage.removeItem('student_session');
      showLogin();
    }
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('studentDashboard').style.display = 'none';
  document.getElementById('testPage').style.display = 'none';
  document.getElementById('resultPage').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('studentDashboard').style.display = 'block';
  document.getElementById('testPage').style.display = 'none';
  document.getElementById('resultPage').style.display = 'none';
  
  // Render header
  state.headerManager = new HeaderManager('student', state.currentUser);
  state.headerManager.render();
  
  // Update profile card
  updateProfileCard();
  
  // Load data
  loadSessions();
  loadMyAttempts();
  loadSettings();
}

function showTestPage() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('studentDashboard').style.display = 'none';
  document.getElementById('testPage').style.display = 'block';
  document.getElementById('resultPage').style.display = 'none';
}

function showResultPage() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('studentDashboard').style.display = 'none';
  document.getElementById('testPage').style.display = 'none';
  document.getElementById('resultPage').style.display = 'block';
}

// ============================================
// GLOBAL EVENT LISTENERS
// ============================================
function initGlobalEventListeners() {
  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Dashboard
  document.getElementById('profileEditBtn')?.addEventListener('click', openProfileEdit);
  
  // Test navigation
  document.getElementById('btnPrevQuestion')?.addEventListener('click', prevQuestion);
  document.getElementById('btnNextQuestion')?.addEventListener('click', nextQuestion);
  document.getElementById('btnSubmitTest')?.addEventListener('click', confirmSubmit);
  document.getElementById('btnFlagQuestion')?.addEventListener('click', toggleFlag);
  
  // Nav panel
  document.getElementById('btnToggleNav')?.addEventListener('click', toggleNavPanel);
  document.getElementById('btnCloseNav')?.addEventListener('click', closeNavPanel);
  document.querySelector('.nav-panel-handle')?.addEventListener('click', toggleNavPanel);
  
  // Result page
  document.getElementById('btnBackToDashboard')?.addEventListener('click', backToDashboard);
  document.getElementById('btnReviewAnswers')?.addEventListener('click', showReviewAnswers);
  
  // Profile edit modal
  document.getElementById('btnSaveProfile')?.addEventListener('click', saveProfile);
  document.getElementById('btnCancelProfile')?.addEventListener('click', closeProfileEdit);
}

// ============================================
// AUTHENTICATION
// ============================================
async function handleLogin(e) {
  e.preventDefault();
  
  const id = document.getElementById('loginId').value.trim();
  const pin = document.getElementById('loginPin').value;
  const btn = e.target.querySelector('button[type="submit"]');
  
  if (!id || !pin) {
    modal.alert('Error', 'ID dan PIN wajib diisi!', 'error');
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Memverifikasi...';
  
  try {
    const studentDoc = await getDoc(doc(db, 'students', id));
    
    if (!studentDoc.exists()) {
      modal.alert('Error', 'ID Siswa tidak ditemukan!', 'error');
      resetLoginButton(btn);
      return;
    }
    
    const studentData = studentDoc.data();
    
    // Check status aktif
    if (!studentData.status) {
      modal.alert('Error', 'Akun Anda tidak aktif. Hubungi admin.', 'error');
      resetLoginButton(btn);
      return;
    }
    
    // Verify PIN
    const isValid = await verifyPin(pin, studentData.pinHash);
    
    if (!isValid) {
      modal.alert('Error', 'PIN salah!', 'error');
      resetLoginButton(btn);
      return;
    }
    
    // Save session
    state.currentUser = {
      id: id,
      name: studentData.name,
      year: studentData.year,
      batch: studentData.batch,
      sequence: studentData.sequence
    };
    
    sessionStorage.setItem('student_session', JSON.stringify(state.currentUser));
    
    modal.alert('Berhasil!', `Selamat datang, ${studentData.name}!`, 'success', showDashboard);
    
  } catch (error) {
    console.error('Login error:', error);
    modal.alert('Error', 'Terjadi kesalahan: ' + error.message, 'error');
    resetLoginButton(btn);
  }
}

function resetLoginButton(btn) {
  btn.disabled = false;
  btn.innerHTML = '<span class="material-icons">login</span> Masuk';
}

// ============================================
// DASHBOARD
// ============================================
function updateProfileCard() {
  if (!state.currentUser) return;
  
  document.getElementById('profileName').textContent = state.currentUser.name;
  document.getElementById('profileId').textContent = state.currentUser.id;
  document.getElementById('profileBatch').textContent = `Batch ${state.currentUser.batch} | Tahun ${state.currentUser.year}`;
}

async function loadSessions() {
  const list = document.getElementById('sessionList');
  list.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Memuat sesi...</p></div>';
  
  try {
    // Load settings dulu
    await loadSettings();
    
    // Query sessions yang visible dan active
    const q = query(
      collection(db, 'sessions'),
      where('visible', '==', true),
      where('status', '==', true)
    );
    
    const snap = await getDocs(q);
    
    if (snap.empty) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">event_busy</span>
          <h3>Belum Ada Sesi</h3>
          <p>Sesi TKA akan muncul di sini saat tersedia</p>
        </div>
      `;
      return;
    }
    
    state.sessionsData = [];
    let html = '';
    const now = new Date();
    
    snap.forEach(docSnap => {
      const session = { id: docSnap.id, ...docSnap.data() };
      state.sessionsData.push(session);
      
      // Check session status
      let status = 'available';
      let statusText = 'Mulai';
      let statusIcon = 'play_circle';
      let disabled = false;
      
      const startTime = session.startTime ? new Date(session.startTime) : null;
      const endTime = session.endTime ? new Date(session.endTime) : null;
      
      if (startTime && now < startTime) {
        status = 'locked';
        statusText = 'Belum Dimulai';
        statusIcon = 'schedule';
        disabled = true;
      } else if (endTime && now > endTime) {
        status = 'expired';
        statusText = 'Selesai';
        statusIcon = 'event_busy';
        disabled = true;
      }
      
      // Check jika sudah dikerjakan
      const attempt = state.attemptsData.find(a => a.sessionId === session.id && a.status === 'completed');
      if (attempt) {
        status = 'completed';
        statusText = `Selesai (${attempt.score})`;
        statusIcon = 'check_circle';
        disabled = false; // Boleh review
      }
      
      html += `
        <div class="session-item ${status} ${disabled ? 'disabled' : ''}" 
             data-id="${session.id}" 
             data-status="${status}"
             onclick="window.startSession('${session.id}', '${status}')">
          <div class="session-icon">
            <span class="material-icons">${statusIcon}</span>
          </div>
          <div class="session-info">
            <div class="session-title">${session.name}</div>
            <div class="session-meta">
              <span class="session-meta-item">
                <span class="material-icons">timer</span>
                ${session.duration} menit
              </span>
              ${startTime ? `
                <span class="session-meta-item">
                  <span class="material-icons">calendar_today</span>
                  ${startTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </span>
              ` : ''}
            </div>
          </div>
          <span class="session-status ${status}">
            <span class="material-icons">${statusIcon}</span>
            ${statusText}
          </span>
        </div>
      `;
    });
    
    list.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading sessions:', error);
    list.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">error</span>
        <h3>Gagal Memuat Sesi</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

async function loadMyAttempts() {
  try {
    const q = query(
      collection(db, 'attempts'),
      where('studentId', '==', state.currentUser.id),
      where('status', '==', 'completed')
    );
    
    const snap = await getDocs(q);
    state.attemptsData = [];
    
    snap.forEach(docSnap => {
      state.attemptsData.push({ id: docSnap.id, ...docSnap.data() });
    });
    
  } catch (error) {
    console.error('Error loading attempts:', error);
  }
}

async function loadSettings() {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'global_settings'));
    
    if (settingsDoc.exists()) {
      state.settings = {
        antiCheatEnabled: settingsDoc.data().antiCheatEnabled ?? true,
        maxTabSwitches: settingsDoc.data().maxTabSwitches ?? 3
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// ============================================
// SESSION START
// ============================================
window.startSession = async (sessionId, status) => {
  // Haptic feedback
  if (navigator.vibrate) navigator.vibrate(10);
  
  if (status === 'locked' || status === 'expired') {
    modal.toast('Sesi ini belum/tidak tersedia', 'warning');
    return;
  }
  
  if (status === 'completed') {
    // Show review untuk sesi yang sudah selesai
    const attempt = state.attemptsData.find(a => a.sessionId === sessionId);
    if (attempt) {
      showResultFromAttempt(attempt);
    }
    return;
  }
  
  modal.confirm(
    'Mulai Sesi',
    'Apakah Anda siap memulai sesi TKA ini?<br><br>Waktu akan langsung berjalan setelah Anda klik <strong>Ya</strong>.',
    async () => {
      await initSession(sessionId);
    }
  );
};

async function initSession(sessionId) {
  const loader = modal.loading('Menyiapkan sesi...');
  
  try {
    // Check jika sudah ada attempt in_progress
    const existingQuery = query(
      collection(db, 'attempts'),
      where('studentId', '==', state.currentUser.id),
      where('sessionId', '==', sessionId),
      where('status', '==', 'in_progress')
    );
    
    const existingSnap = await getDocs(existingQuery);
    
    if (!existingSnap.empty) {
      // Resume existing attempt
      const existingAttempt = existingSnap.docs[0];
      state.currentSession = { attemptId: existingAttempt.id, ...existingAttempt.data() };
      
      await loadSessionQuestions(sessionId);
      resumeTest();
      
      loader.close();
      return;
    }
    
    // Load session data
    const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
    if (!sessionDoc.exists()) {
      loader.close();
      modal.alert('Error', 'Sesi tidak ditemukan!', 'error');
      return;
    }
    
    const sessionData = sessionDoc.data();
    
    // Load questions
    await loadSessionQuestions(sessionId);
    
    if (state.questions.length === 0) {
      loader.close();
      modal.alert('Error', 'Sesi ini belum memiliki soal!', 'error');
      return;
    }
    
    // Create new attempt
    const attemptRef = doc(collection(db, 'attempts'));
    const attemptData = {
      studentId: state.currentUser.id,
      sessionId: sessionId,
      status: 'in_progress',
      answers: {},
      progress: 0,
      totalQuestions: state.questions.length,
      startedAt: serverTimestamp(),
      tabSwitchCount: 0,
      blurCount: 0,
      antiCheatLog: []
    };
    
    await setDoc(attemptRef, attemptData);
    
    state.currentSession = {
      attemptId: attemptRef.id,
      sessionId: sessionId,
      duration: sessionData.duration || 60,
      name: sessionData.name,
      ...attemptData
    };
    
    loader.close();
    startTest();
    
  } catch (error) {
    console.error('Error starting session:', error);
    loader.close();
    modal.alert('Error', 'Gagal memulai sesi: ' + error.message, 'error');
  }
}

async function loadSessionQuestions(sessionId) {
  try {
    const q = query(
      collection(db, 'questions'),
      where('sessionId', '==', sessionId),
      orderBy('order')
    );
    
    const snap = await getDocs(q);
    state.questions = [];
    
    snap.forEach(docSnap => {
      state.questions.push({ id: docSnap.id, ...docSnap.data() });
    });
    
  } catch (error) {
    console.error('Error loading questions:', error);
    throw error;
  }
}

// ============================================
// TEST INTERFACE
// ============================================
function startTest() {
  state.currentQuestionIndex = 0;
  state.answers = {};
  state.flaggedQuestions.clear();
  state.tabSwitchCount = 0;
  state.blurCount = 0;
  state.antiCheatLog = [];
  state.startTime = Date.now();
  state.timeRemaining = (state.currentSession.duration || 60) * 60;
  
  showTestPage();
  renderQuestionNav();
  renderCurrentQuestion();
  startTimer();
  initAntiCheat();
  updateTestInfo();
}

function resumeTest() {
  state.answers = state.currentSession.answers || {};
  state.currentQuestionIndex = state.currentSession.progress || 0;
  state.tabSwitchCount = state.currentSession.tabSwitchCount || 0;
  state.blurCount = state.currentSession.blurCount || 0;
  state.startTime = Date.now() - ((state.currentSession.totalTime || 0) * 1000);
  
  showTestPage();
  renderQuestionNav();
  renderCurrentQuestion();
  startTimer();
  initAntiCheat();
  updateTestInfo();
  
  modal.toast('Melanjutkan sesi...', 'info');
}

function updateTestInfo() {
  document.getElementById('totalQuestions').textContent = state.questions.length;
}

function renderCurrentQuestion() {
  const question = state.questions[state.currentQuestionIndex];
  const body = document.getElementById('testBody');
  
  if (!question) {
    body.innerHTML = '<div class="empty-state"><span class="material-icons">error</span><h3>Soal tidak ditemukan</h3></div>';
    return;
  }
  
  // Update navigation buttons
  document.getElementById('currentQuestionNum').textContent = state.currentQuestionIndex + 1;
  document.getElementById('btnPrevQuestion').disabled = state.currentQuestionIndex === 0;
  document.getElementById('btnNextQuestion').disabled = state.currentQuestionIndex === state.questions.length - 1;
  
  // Update flag button
  const flagBtn = document.getElementById('btnFlagQuestion');
  if (state.flaggedQuestions.has(state.currentQuestionIndex)) {
    flagBtn.classList.add('flagged');
    flagBtn.innerHTML = '<span class="material-icons">flag</span><span>Ditandai</span>';
  } else {
    flagBtn.classList.remove('flagged');
    flagBtn.innerHTML = '<span class="material-icons">outlined_flag</span><span>Ragu</span>';
  }
  
  // Type badge class
  const typeClasses = {
    PGS: 'pgs',
    MCMA: 'mcma',
    PGK: 'pgk',
    ISIAN: 'isian'
  };
  
  const typeLabels = {
    PGS: 'Pilihan Ganda',
    MCMA: 'Pilihan Kompleks',
    PGK: 'True/False',
    ISIAN: 'Isian Singkat'
  };
  
  // Build question HTML
  let html = `
    <div class="question-card">
      <div class="question-header">
        <span class="question-number">
          <span class="material-icons">question_answer</span>
          Soal ${state.currentQuestionIndex + 1} dari ${state.questions.length}
        </span>
        <span class="question-type-badge ${typeClasses[question.type]}">${typeLabels[question.type]}</span>
      </div>
      <div class="question-text">${question.text}</div>
  `;
  
  // Render options berdasarkan tipe
  switch(question.type) {
    case 'PGS':
      html += renderPGSOptions(question);
      break;
    case 'MCMA':
      html += renderMCMAOptions(question);
      break;
    case 'PGK':
      html += renderPGKOptions(question);
      break;
    case 'ISIAN':
      html += renderIsianInput(question);
      break;
  }
  
  html += '</div>';
  
  // Navigation buttons
  html += `
    <div class="test-nav-buttons">
      <button class="nav-btn" id="btnPrevQuestion" ${state.currentQuestionIndex === 0 ? 'disabled' : ''}>
        <span class="material-icons">arrow_back</span>
        Sebelumnya
      </button>
      <button class="nav-btn primary" id="btnNextQuestion" ${state.currentQuestionIndex === state.questions.length - 1 ? 'disabled' : ''}>
        Selanjutnya
        <span class="material-icons">arrow_forward</span>
      </button>
    </div>
  `;
  
  body.innerHTML = html;
  
  // Bind events
  bindQuestionEvents(question);
  
  // Re-bind navigation buttons
  document.getElementById('btnPrevQuestion').addEventListener('click', prevQuestion);
  document.getElementById('btnNextQuestion').addEventListener('click', nextQuestion);
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPGSOptions(question) {
  const options = ['A', 'B', 'C', 'D'];
  const currentAnswer = state.answers[question.id];
  
  let html = '<div class="options-list">';
  
  options.forEach(letter => {
    const optionText = question.options?.[letter] || '';
    const isSelected = currentAnswer === letter;
    
    html += `
      <div class="option-item ${isSelected ? 'selected' : ''}" data-answer="${letter}">
        <div class="option-letter">${letter}</div>
        <div class="option-text">${optionText}</div>
        <span class="option-check material-icons">check_circle</span>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

function renderMCMAOptions(question) {
  const options = ['A', 'B', 'C', 'D', 'E'];
  const currentAnswers = state.answers[question.id] || [];
  
  let html = `
    <div class="mcma-info">
      <span class="material-icons">info</span>
      Pilih semua jawaban yang benar (bisa lebih dari satu)
    </div>
    <div class="options-list">
  `;
  
  options.forEach(letter => {
    const optionText = question.options?.[letter];
    if (!optionText) return;
    
    const isSelected = currentAnswers.includes(letter);
    
    html += `
      <div class="option-item mcma ${isSelected ? 'selected' : ''}" data-answer="${letter}">
        <div class="option-letter">${letter}</div>
        <div class="option-text">${optionText}</div>
        <span class="option-check">
          <span class="material-icons">${isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
        </span>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

function renderPGKOptions(question) {
  const statements = question.statements || [];
  const currentAnswers = state.answers[question.id] || [];
  
  let html = '<div class="pgk-statements">';
  
  statements.forEach((statement, index) => {
    const selectedValue = currentAnswers[index];
    
    html += `
      <div class="pgk-statement-item">
        <div class="pgk-statement-text">${index + 1}. ${statement}</div>
        <div class="pgk-options">
          <div class="pgk-option ${selectedValue === true ? 'selected-true' : ''}" 
               data-statement="${index}" 
               data-value="true">
            <span class="material-icons">check_circle</span>
            True
          </div>
          <div class="pgk-option ${selectedValue === false ? 'selected-false' : ''}" 
               data-statement="${index}" 
               data-value="false">
            <span class="material-icons">cancel</span>
            False
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

function renderIsianInput(question) {
  const currentValue = state.answers[question.id] || '';
  
  return `
    <div class="isian-container">
      <input 
        type="text" 
        class="isian-input" 
        id="isianInput" 
        placeholder="Ketik jawaban Anda..." 
        value="${currentValue}"
        autocomplete="off"
      >
      <div class="isian-hint">
        <span class="material-icons">info</span>
        Jawab dengan singkat dan tepat
      </div>
    </div>
  `;
}

function bindQuestionEvents(question) {
  switch(question.type) {
    case 'PGS':
      document.querySelectorAll('.option-item').forEach(item => {
        item.addEventListener('click', () => {
          // Haptic feedback
          if (navigator.vibrate) navigator.vibrate(10);
          
          // Deselect all
          document.querySelectorAll('.option-item').forEach(i => i.classList.remove('selected'));
          
          // Select this one
          item.classList.add('selected');
          
          // Save answer
          state.answers[question.id] = item.dataset.answer;
          
          saveProgress();
          renderQuestionNav();
        });
      });
      break;
      
    case 'MCMA':
      document.querySelectorAll('.option-item.mcma').forEach(item => {
        item.addEventListener('click', () => {
          if (navigator.vibrate) navigator.vibrate(10);
          
          item.classList.toggle('selected');
          
          const icon = item.querySelector('.option-check .material-icons');
          const isSelected = item.classList.contains('selected');
          icon.textContent = isSelected ? 'check_box' : 'check_box_outline_blank';
          
          let currentAnswers = state.answers[question.id] || [];
          const letter = item.dataset.answer;
          
          if (isSelected) {
            if (!currentAnswers.includes(letter)) {
              currentAnswers.push(letter);
            }
          } else {
            currentAnswers = currentAnswers.filter(l => l !== letter);
          }
          
          state.answers[question.id] = currentAnswers;
          
          saveProgress();
          renderQuestionNav();
        });
      });
      break;
      
    case 'PGK':
      document.querySelectorAll('.pgk-option').forEach(option => {
        option.addEventListener('click', () => {
          if (navigator.vibrate) navigator.vibrate(10);
          
          const statementIndex = parseInt(option.dataset.statement);
          const value = option.dataset.value === 'true';
          
          // Deselect sibling
          const parent = option.closest('.pgk-statement-item');
          parent.querySelectorAll('.pgk-option').forEach(o => {
            o.classList.remove('selected-true', 'selected-false');
          });
          
          // Select this one
          option.classList.add(value ? 'selected-true' : 'selected-false');
          
          // Save answer
          let currentAnswers = state.answers[question.id] || [];
          currentAnswers[statementIndex] = value;
          state.answers[question.id] = currentAnswers;
          
          saveProgress();
          renderQuestionNav();
        });
      });
      break;
      
    case 'ISIAN':
      const input = document.getElementById('isianInput');
      if (input) {
        input.addEventListener('input', () => {
          state.answers[question.id] = input.value.trim();
          saveProgress();
          renderQuestionNav();
        });
        
        // Submit dengan Enter
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            nextQuestion();
          }
        });
      }
      break;
  }
}

// ============================================
// QUESTION NAVIGATION
// ============================================
function prevQuestion() {
  if (state.currentQuestionIndex > 0) {
    state.currentQuestionIndex--;
    renderCurrentQuestion();
    renderQuestionNav();
  }
}

function nextQuestion() {
  if (state.currentQuestionIndex < state.questions.length - 1) {
    state.currentQuestionIndex++;
    renderCurrentQuestion();
    renderQuestionNav();
  }
}

window.goToQuestion = (index) => {
  if (index >= 0 && index < state.questions.length) {
    state.currentQuestionIndex = index;
    renderCurrentQuestion();
    renderQuestionNav();
    closeNavPanel();
  }
};

function toggleFlag() {
  if (navigator.vibrate) navigator.vibrate(20);
  
  if (state.flaggedQuestions.has(state.currentQuestionIndex)) {
    state.flaggedQuestions.delete(state.currentQuestionIndex);
    modal.toast('Tanda ragu dihapus', 'info', 1500);
  } else {
    state.flaggedQuestions.add(state.currentQuestionIndex);
    modal.toast('Soal ditandai ragu', 'warning', 1500);
  }
  
  renderCurrentQuestion();
  renderQuestionNav();
}

function renderQuestionNav() {
  const grid = document.getElementById('questionGridNav');
  
  if (!grid) return;
  
  grid.innerHTML = state.questions.map((q, i) => {
    let className = 'question-dot';
    
    if (i === state.currentQuestionIndex) {
      className += ' current';
    } else if (state.answers[q.id] !== undefined && state.answers[q.id] !== '') {
      className += ' answered';
    }
    
    if (state.flaggedQuestions.has(i)) {
      className += ' flagged';
    }
    
    return `
      <button class="${className}" onclick="window.goToQuestion(${i})">
        ${i + 1}
      </button>
    `;
  }).join('');
}

function toggleNavPanel() {
  const panel = document.getElementById('questionNavPanel');
  
  if (panel.classList.contains('expanded')) {
    closeNavPanel();
  } else {
    panel.classList.add('expanded');
    state.navPanelExpanded = true;
  }
}

function closeNavPanel() {
  const panel = document.getElementById('questionNavPanel');
  panel.classList.remove('expanded');
  state.navPanelExpanded = false;
}

// ============================================
// TIMER
// ============================================
function startTimer() {
  updateTimerDisplay();
  
  state.timerInterval = setInterval(() => {
    state.timeRemaining--;
    updateTimerDisplay();
    
    // Warning states
    const timerEl = document.getElementById('testTimer');
    
    if (state.timeRemaining <= 60) {
      timerEl.className = 'test-timer danger';
      
      // Haptic warning setiap 10 detik
      if (state.timeRemaining % 10 === 0 && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else if (state.timeRemaining <= 300) {
      timerEl.className = 'test-timer warning';
    } else {
      timerEl.className = 'test-timer';
    }
    
    // Time's up
    if (state.timeRemaining <= 0) {
      clearInterval(state.timerInterval);
      modal.alert(
        'Waktu Habis!',
        'Waktu pengerjaan telah berakhir.<br>Jawaban Anda akan otomatis dikumpulkan.',
        'warning',
        () => submitTest(true)
      );
    }
  }, 1000);
}

function updateTimerDisplay() {
  const display = formatCountdown(state.timeRemaining);
  document.getElementById('timerDisplay').textContent = display;
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

// ============================================
// ANTI-CHEAT SYSTEM
// ============================================
function initAntiCheat() {
  if (!state.settings.antiCheatEnabled) {
    console.log('Anti-cheat disabled');
    return;
  }
  
  // Tab switch detection
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Window blur detection
  window.addEventListener('blur', handleWindowBlur);
  
  // Prevent right-click (optional)
  document.addEventListener('contextmenu', preventContextMenu);
  
  // Prevent copy-paste (optional)
  document.addEventListener('copy', preventCopy);
  document.addEventListener('paste', preventPaste);
}

function handleVisibilityChange() {
  if (document.hidden && state.currentSession) {
    state.tabSwitchCount++;
    
    logAntiCheat('tab_switch', 'User berpindah tab atau minimize browser');
    showAntiCheatWarning();
    
    if (state.tabSwitchCount >= state.settings.maxTabSwitches) {
      modal.alert(
        'Pelanggaran Terdeteksi!',
        `Anda telah berpindah tab sebanyak ${state.tabSwitchCount} kali.<br><br>Jawaban Anda akan otomatis dikumpulkan.`,
        'error',
        () => submitTest(true)
      );
    }
    
    updateAntiCheatData();
  }
}

function handleWindowBlur() {
  if (state.currentSession) {
    state.blurCount++;
    logAntiCheat('window_blur', 'Window kehilangan fokus');
    updateAntiCheatData();
  }
}

function preventContextMenu(e) {
  if (state.currentSession) {
    e.preventDefault();
    modal.toast('Klik kanan dinonaktifkan selama tes', 'warning', 2000);
  }
}

function preventCopy(e) {
  if (state.currentSession) {
    e.preventDefault();
    modal.toast('Copy dinonaktifkan selama tes', 'warning', 2000);
  }
}

function preventPaste(e) {
  if (state.currentSession && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    modal.toast('Paste dinonaktifkan selama tes', 'warning', 2000);
  }
}

function logAntiCheat(type, detail) {
  state.antiCheatLog.push({
    timestamp: new Date().toISOString(),
    type: type,
    detail: detail
  });
}

function showAntiCheatWarning() {
  // Remove existing warning
  const existing = document.querySelector('.anti-cheat-warning');
  if (existing) existing.remove();
  
  const warning = document.createElement('div');
  warning.className = 'anti-cheat-warning';
  warning.innerHTML = `
    <span class="material-icons">warning</span>
    <span>Peringatan: Anda terdeteksi berpindah tab!</span>
    <span class="anti-cheat-count">${state.tabSwitchCount}/${state.settings.maxTabSwitches}</span>
  `;
  
  document.body.appendChild(warning);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    warning.remove();
  }, 3000);
}

async function updateAntiCheatData() {
  if (!state.currentSession?.attemptId) return;
  
  try {
    await updateDoc(doc(db, 'attempts', state.currentSession.attemptId), {
      tabSwitchCount: state.tabSwitchCount,
      blurCount: state.blurCount,
      antiCheatLog: state.antiCheatLog
    });
  } catch (error) {
    console.error('Error updating anti-cheat:', error);
  }
}

function cleanupAntiCheat() {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('blur', handleWindowBlur);
  document.removeEventListener('contextmenu', preventContextMenu);
  document.removeEventListener('copy', preventCopy);
  document.removeEventListener('paste', preventPaste);
}

// ============================================
// SAVE PROGRESS
// ============================================
async function saveProgress() {
  if (!state.currentSession?.attemptId) return;
  
  try {
    await updateDoc(doc(db, 'attempts', state.currentSession.attemptId), {
      answers: state.answers,
      progress: state.currentQuestionIndex
    });
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

// ============================================
// SUBMIT TEST
// ============================================
function confirmSubmit() {
  const unanswered = state.questions.filter(q => {
    const answer = state.answers[q.id];
    return answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0);
  }).length;
  
  let message = 'Apakah Anda yakin ingin mengumpulkan jawaban?';
  
  if (unanswered > 0) {
    message += `<br><br><span style="color:var(--warning);font-weight:600;">Perhatian:</span> Anda masih memiliki <strong>${unanswered}</strong> soal yang belum dijawab.`;
  }
  
  modal.confirmCustom({
    title: 'Konfirmasi Submit',
    message: message,
    confirmText: 'Ya, Submit',
    cancelText: 'Kembali',
    confirmClass: unanswered > 0 ? 'btn-warning' : 'btn-success',
    onConfirm: () => submitTest(false)
  });
}

async function submitTest(autoSubmit = false) {
  stopTimer();
  cleanupAntiCheat();
  
  const loader = modal.loading('Mengumpulkan jawaban...');
  
  const totalTime = Math.round((Date.now() - state.startTime) / 1000);
  
  try {
    // Calculate score
    const { score, correctAnswers } = calculateScore();
    
    // Update attempt
    await updateDoc(doc(db, 'attempts', state.currentSession.attemptId), {
      status: 'completed',
      answers: state.answers,
      score: score,
      correctAnswers: correctAnswers,
      totalQuestions: state.questions.length,
      totalTime: totalTime,
      finishedAt: serverTimestamp(),
      tabSwitchCount: state.tabSwitchCount,
      blurCount: state.blurCount,
      antiCheatLog: state.antiCheatLog,
      autoSubmitted: autoSubmit
    });
    
    loader.close();
    
    // Show result
    showResult(score, correctAnswers, totalTime, autoSubmit);
    
  } catch (error) {
    console.error('Error submitting test:', error);
    loader.close();
    modal.alert('Error', 'Gagal mengumpulkan jawaban: ' + error.message, 'error');
  }
}

// ============================================
// SCORE CALCULATION
// ============================================
function calculateScore() {
  let correctAnswers = 0;
  
  state.questions.forEach(question => {
    const userAnswer = state.answers[question.id];
    let isCorrect = false;
    
    switch(question.type) {
      case 'PGS':
        isCorrect = userAnswer === question.correctAnswer;
        break;
        
      case 'MCMA':
        const userArr = (userAnswer || []).sort();
        const correctArr = (question.correctAnswer || []).sort();
        isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr);
        break;
        
      case 'PGK':
        const userAnswers = userAnswer || [];
        const correctAnswers = question.correctAnswer || [];
        isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
        break;
        
      case 'ISIAN':
        const userStr = String(userAnswer || '').toLowerCase().trim();
        const correctStr = String(question.correctAnswer || '').toLowerCase().trim();
        isCorrect = userStr === correctStr;
        break;
    }
    
    if (isCorrect) correctAnswers++;
  });
  
  const score = Math.round((correctAnswers / state.questions.length) * 100);
  
  return { score, correctAnswers };
}

// ============================================
// RESULT PAGE
// ============================================
function showResult(score, correctAnswers, totalTime, autoSubmit = false) {
  showResultPage();
  
  // Update result icon berdasarkan score
  const iconEl = document.querySelector('.result-icon');
  let iconClass = 'poor';
  let icon = 'sentiment_dissatisfied';
  let title = 'Perlu Belajar Lagi';
  
  if (score >= 90) {
    iconClass = 'excellent';
    icon = 'emoji_events';
    title = 'Luar Biasa!';
  } else if (score >= 75) {
    iconClass = 'good';
    icon = 'celebration';
    title = 'Bagus Sekali!';
  } else if (score >= 60) {
    iconClass = 'average';
    icon = 'mood';
    title = 'Cukup Baik';
  }
  
  iconEl.className = `result-icon ${iconClass}`;
  iconEl.innerHTML = `<span class="material-icons">${icon}</span>`;
  
  document.getElementById('resultTitle').textContent = title;
  
  if (autoSubmit) {
    document.getElementById('resultSubtitle').textContent = 'Jawaban dikumpulkan otomatis karena waktu habis atau pelanggaran.';
  } else {
    document.getElementById('resultSubtitle').textContent = 'Anda telah menyelesaikan sesi TKA.';
  }
  
  // Update score circle
  document.getElementById('resultScore').textContent = score;
  
  const progressEl = document.querySelector('.score-circle-progress');
  if (progressEl) {
    progressEl.className = `score-circle-progress ${iconClass}`;
    const offset = 440 - (440 * score / 100);
    progressEl.style.setProperty('--score-offset', offset);
  }
  
  // Update stats
  document.getElementById('resultCorrect').textContent = correctAnswers;
  document.getElementById('resultWrong').textContent = state.questions.length - correctAnswers;
  document.getElementById('resultTime').textContent = formatDuration(totalTime);
  document.getElementById('resultAccuracy').textContent = `${Math.round((correctAnswers / state.questions.length) * 100)}%`;
  
  // Store result for review
  state.lastResult = {
    score,
    correctAnswers,
    totalTime,
    answers: { ...state.answers },
    questions: [...state.questions]
  };
}

function showResultFromAttempt(attempt) {
  showResultPage();
  
  const score = attempt.score || 0;
  const iconEl = document.querySelector('.result-icon');
  let iconClass = 'poor';
  let icon = 'sentiment_dissatisfied';
  
  if (score >= 90) { iconClass = 'excellent'; icon = 'emoji_events'; }
  else if (score >= 75) { iconClass = 'good'; icon = 'celebration'; }
  else if (score >= 60) { iconClass = 'average'; icon = 'mood'; }
  
  iconEl.className = `result-icon ${iconClass}`;
  iconEl.innerHTML = `<span class="material-icons">${icon}</span>`;
  
  document.getElementById('resultTitle').textContent = 'Hasil Sebelumnya';
  document.getElementById('resultSubtitle').textContent = 'Ini adalah hasil dari pengerjaan sebelumnya.';
  document.getElementById('resultScore').textContent = score;
  document.getElementById('resultCorrect').textContent = attempt.correctAnswers || 0;
  document.getElementById('resultWrong').textContent = (attempt.totalQuestions || 0) - (attempt.correctAnswers || 0);
  document.getElementById('resultTime').textContent = formatDuration(attempt.totalTime || 0);
  document.getElementById('resultAccuracy').textContent = `${score}%`;
  
  // Hide review button jika tidak ada data answers
  const reviewBtn = document.getElementById('btnReviewAnswers');
  if (reviewBtn) {
    reviewBtn.style.display = attempt.answers ? 'flex' : 'none';
  }
  
  state.lastResult = {
    score,
    correctAnswers: attempt.correctAnswers,
    totalTime: attempt.totalTime,
    answers: attempt.answers || {},
    questions: []
  };
}

function backToDashboard() {
  state.currentSession = null;
  state.questions = [];
  state.answers = {};
  state.currentQuestionIndex = 0;
  state.flaggedQuestions.clear();
  
  stopTimer();
  cleanupAntiCheat();
  
  showDashboard();
  loadSessions();
}

function showReviewAnswers() {
  if (!state.lastResult || state.lastResult.questions.length === 0) {
    modal.toast('Data review tidak tersedia', 'warning');
    return;
  }
  
  let reviewHTML = '<div class="review-list">';
  
  state.lastResult.questions.forEach((question, index) => {
    const userAnswer = state.lastResult.answers[question.id];
    const isCorrect = checkAnswer(question, userAnswer);
    
    let answerDisplay = '';
    let correctDisplay = '';
    
    switch(question.type) {
      case 'PGS':
        answerDisplay = userAnswer || 'Tidak dijawab';
        correctDisplay = question.correctAnswer;
        break;
      case 'MCMA':
        answerDisplay = (userAnswer || []).join(', ') || 'Tidak dijawab';
        correctDisplay = (question.correctAnswer || []).join(', ');
        break;
      case 'PGK':
        answerDisplay = (userAnswer || []).map(a => a === undefined ? '-' : (a ? 'True' : 'False')).join(', ');
        correctDisplay = (question.correctAnswer || []).map(a => a ? 'True' : 'False').join(', ');
        break;
      case 'ISIAN':
        answerDisplay = userAnswer || 'Tidak dijawab';
        correctDisplay = question.correctAnswer;
        break;
    }
    
    reviewHTML += `
      <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
        <div class="review-item-header">
          <span class="review-question-num">Soal ${index + 1}</span>
          <span class="review-status ${isCorrect ? 'correct' : 'incorrect'}">
            <span class="material-icons">${isCorrect ? 'check_circle' : 'cancel'}</span>
            ${isCorrect ? 'Benar' : 'Salah'}
          </span>
        </div>
        <div class="review-question-text">${question.text}</div>
        <div class="review-answer-row your-answer">
          <span class="material-icons">person</span>
          Jawaban Anda: <strong>${answerDisplay}</strong>
        </div>
        ${!isCorrect ? `
          <div class="review-answer-row correct-answer">
            <span class="material-icons">check_circle</span>
            Jawaban benar: <strong>${correctDisplay}</strong>
          </div>
        ` : ''}
        ${question.explanation ? `
          <div class="review-explanation">
            <div class="review-explanation-title">
              <span class="material-icons">lightbulb</span>
              Pembahasan
            </div>
            ${question.explanation}
          </div>
        ` : ''}
      </div>
    `;
  });
  
  reviewHTML += '</div>';
  
  modal.custom({
    title: 'Review Jawaban',
    content: reviewHTML,
    type: 'info',
    maxWidth: '700px',
    buttons: [
      { text: 'Tutup', action: 'close', className: 'btn-secondary' }
    ]
  });
}

function checkAnswer(question, userAnswer) {
  switch(question.type) {
    case 'PGS':
      return userAnswer === question.correctAnswer;
    case 'MCMA':
      return JSON.stringify((userAnswer || []).sort()) === JSON.stringify((question.correctAnswer || []).sort());
    case 'PGK':
      return JSON.stringify(userAnswer || []) === JSON.stringify(question.correctAnswer || []);
    case 'ISIAN':
      return String(userAnswer || '').toLowerCase().trim() === String(question.correctAnswer || '').toLowerCase().trim();
    default:
      return false;
  }
}

// ============================================
// PROFILE EDIT (PIN bisa diganti siswa)
// ============================================
function openProfileEdit() {
  const modalContent = `
    <div class="profile-edit-section">
      <div class="profile-edit-title">
        <span class="material-icons">person</span>
        Informasi Akun
      </div>
      <div class="form-group">
        <label class="form-label">ID Siswa</label>
        <input type="text" class="form-control" value="${state.currentUser.id}" disabled>
      </div>
      <div class="form-group">
        <label class="form-label">Nama</label>
        <input type="text" class="form-control" id="editName" value="${state.currentUser.name}">
      </div>
    </div>
    
    <div class="profile-edit-section">
      <div class="profile-edit-title">
        <span class="material-icons">vpn_key</span>
        Ganti PIN
      </div>
      <div class="form-group">
        <label class="form-label">PIN Baru (kosongkan jika tidak ingin mengubah)</label>
        <input type="password" class="form-control" id="editNewPin" placeholder="PIN baru (4-6 digit)" maxlength="6">
      </div>
      <div class="form-group">
        <label class="form-label">Konfirmasi PIN Baru</label>
        <input type="password" class="form-control" id="editConfirmPin" placeholder="Ulangi PIN baru" maxlength="6">
      </div>
    </div>
  `;
  
  modal.custom({
    title: 'Edit Profile',
    content: modalContent,
    type: 'info',
    buttons: [
      { text: 'Batal', action: 'cancel', className: 'btn-secondary' },
      { text: 'Simpan', action: 'save', className: 'btn-primary', callback: handleProfileSave }
    ]
  });
}

async function handleProfileSave() {
  const newName = document.getElementById('editName').value.trim();
  const newPin = document.getElementById('editNewPin').value;
  const confirmPin = document.getElementById('editConfirmPin').value;
  
  // Validate name
  if (!newName) {
    modal.toast('Nama tidak boleh kosong', 'error');
    openProfileEdit();
    return;
  }
  
  // Validate PIN jika diisi
  if (newPin) {
    const validation = validatePin(newPin);
    
    if (!validation.valid) {
      modal.toast(validation.message, 'error');
      openProfileEdit();
      return;
    }
    
    if (newPin !== confirmPin) {
      modal.toast('PIN tidak cocok', 'error');
      openProfileEdit();
      return;
    }
  }
  
  try {
    const updateData = { name: newName };
    
    if (newPin) {
      updateData.pinHash = await hashPin(newPin);
    }
    
    await updateDoc(doc(db, 'students', state.currentUser.id), updateData);
    
    // Update local state
    state.currentUser.name = newName;
    sessionStorage.setItem('student_session', JSON.stringify(state.currentUser));
    
    // Update UI
    updateProfileCard();
    
    modal.toast('Profile berhasil diperbarui', 'success');
    
  } catch (error) {
    console.error('Error saving profile:', error);
    modal.toast('Gagal menyimpan profile', 'error');
    openProfileEdit();
  }
}

function saveProfile() {
  // Handled in handleProfileSave
}

function closeProfileEdit() {
  // Modal auto-close
}

// ============================================
// CLEANUP
// ============================================
window.addEventListener('beforeunload', () => {
  stopTimer();
  cleanupAntiCheat();
});

// Pause timer saat page hidden
document.addEventListener('visibilitychange', () => {
  if (state.timerInterval) {
    if (document.hidden) {
      // Timer tetap berjalan (tidak pause) karena ini tes
      // Tapi bisa di-pause jika mau dengan clearInterval
    }
  }
});