// JEC v.7.00 MODULAR | 16/08/2026 | j/f/react.js | Feedback/React Overlay
// Target: #feat-react-content di dalam #ov-react (sv1.html v1.03)
// Dipanggil setelah materi selesai (onDone di learn.js)
// Lazy load (Priority 3)

'use strict';

window.JEC_REACT = {
  state: {
    initialized: false,
    currentStep: 1, // 1 = feedback, 2 = next actions
    lastFeedback: null,
    lastModule: null,
    lastUnitId: null,
    lastPartId: null
  },

  // ═══════════ INIT ═══════════
  init: function() {
    if (JEC_REACT.state.initialized) return;
    JEC_REACT.state.initialized = true;
    console.log('[JEC_REACT] Initialized');
  },

  // ═══════════ SHOW OVERLAY ═══════════
  show: function(module, unitId, partId) {
    JEC_REACT.init();

    JEC_REACT.state.currentStep = 1;
    JEC_REACT.state.lastModule = module || JEC.currentModule;
    JEC_REACT.state.lastUnitId = unitId || JEC.currentUnitId;
    JEC_REACT.state.lastPartId = partId || JEC.currentPartId;

    JEC_REACT.renderStep1();
    JEC.openOv('ov-react');
  },

  // ═══════════ STEP 1: FEEDBACK ═══════════
  renderStep1: function() {
    const container = document.getElementById('feat-react-content');
    if (!container) return;

    const lang = JEC.lang || 'en';
    const question = JEC.t('how_was_lesson') || 'How was this lesson?';

    let html = '<div id="react-step1">';
    html += '<div style="font-weight:800;margin-bottom:.9rem;font-size:1rem">' + JEC.esc(question) + '</div>';
    html += '<div class="fb-row">';

    // Happy button
    html += '<button class="fb-btn" onclick="JEC_REACT.sendFeedback(\'happy\')" title="' + JEC.esc(JEC.t('react.great') || 'Great!') + '">';
    html += '<span class="material-icons-round" style="font-size:2rem;color:#4ade80">sentiment_satisfied</span>';
    html += '</button>';

    // Neutral button
    html += '<button class="fb-btn" onclick="JEC_REACT.sendFeedback(\'mid\')" title="' + JEC.esc(JEC.t('react.ok') || 'Okay') + '">';
    html += '<span class="material-icons-round" style="font-size:2rem;color:#fbbf24">sentiment_neutral</span>';
    html += '</button>';

    // Sad button
    html += '<button class="fb-btn" onclick="JEC_REACT.sendFeedback(\'sad\')" title="' + JEC.esc(JEC.t('react.bad') || 'Bad') + '">';
    html += '<span class="material-icons-round" style="font-size:2rem;color:#f87171">sentiment_dissatisfied</span>';
    html += '</button>';

    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
  },

  // ═══════════ SEND FEEDBACK ═══════════
  sendFeedback: function(type) {
    const state = JEC_REACT.state;
    state.lastFeedback = type;
    state.currentStep = 2;

    // Play sound effect
    JEC_REACT.playSfx('click');

    // Send to Apps Script
    JEC.apiPost({
      action: 'log',
      id: JEC.user ? JEC.user.id : '',
      batch: JEC.user ? JEC.user.batch : '',
      type: 'feedback',
      details: (state.lastModule || '') + '/' + (state.lastUnitId || '') + '/' + (state.lastPartId || '') + ' - ' + type
    }).catch(function(e) {
      console.warn('[JEC_REACT] Feedback send failed:', e.message);
    });

    // Update local stats
    JEC.stats.reactCount = (JEC.stats.reactCount || 0) + 1;

    // Log activity
    JEC.logActivity('feedback', type);

    // Show step 2
    JEC_REACT.renderStep2();
  },

  // ═══════════ STEP 2: NEXT ACTIONS ═══════════
  renderStep2: function() {
    const container = document.getElementById('feat-react-content');
    if (!container) return;

    const thanksMsg = JEC.t('thanks_feedback') || 'Thanks for your feedback!';
    const nextMsg = JEC.t('next_challenge') || 'Ready for the next challenge?';

    let html = '<div id="react-step2">';
    html += '<div style="text-align:center;margin-bottom:1rem">';
    html += '<span class="material-icons-round" style="font-size:3rem;color:var(--p);display:block;margin-bottom:.5rem">celebration</span>';
    html += '<div style="font-weight:800;font-size:1rem;margin-bottom:.3rem">' + JEC.esc(thanksMsg) + '</div>';
    html += '<div class="tx-m" style="font-size:.84rem">' + JEC.esc(nextMsg) + '</div>';
    html += '</div>';

    // Exercise button
    html += '<button class="btn mb" onclick="JEC_REACT.openExercise()">';
    html += '<span class="material-icons-round">quiz</span> ';
    html += JEC.esc(JEC.t('exercise') || 'Exercise');
    html += '</button>';

    // Minigames button
    html += '<button class="btn mb" style="background:var(--acc)" onclick="JEC_REACT.openMinigames()">';
    html += '<span class="material-icons-round">sports_esports</span> ';
    html += JEC.esc(JEC.t('minigames') || 'Minigames');
    html += '</button>';

    // Continue learning button
    html += '<button class="btn gh" onclick="JEC_REACT.continueLearning()">';
    html += '<span class="material-icons-round">auto_stories</span> ';
    html += JEC.esc(JEC.t('continue_learning') || 'Continue Learning');
    html += '</button>';

    html += '</div>';

    container.innerHTML = html;
  },

  // ═══════════ NEXT ACTIONS ═══════════
  openExercise: function() {
    JEC.closeOv('ov-react');

    // Navigate to exercise (if available)
    const exeUrl = JEC.config.EXE_URL || '';
    if (exeUrl) {
      JEC.openGM(exeUrl + '?unit=' + (JEC_REACT.state.lastUnitId || '') + '&part=' + (JEC_REACT.state.lastPartId || ''));
    } else {
      JEC.toast(JEC.t('coming_soon') || 'Coming Soon', 'info', 2000);
    }

    JEC.logActivity('react_exercise', JEC_REACT.state.lastModule);
  },

  openMinigames: function() {
    JEC.closeOv('ov-react');

    // Navigate to minigames (if available)
    const gamesUrl = JEC.config.MINIGAMES || '';
    if (gamesUrl) {
      JEC.openGM(gamesUrl + '?unit=' + (JEC_REACT.state.lastUnitId || ''));
    } else {
      JEC.toast(JEC.t('coming_soon') || 'Coming Soon', 'info', 2000);
    }

    JEC.logActivity('react_minigames', JEC_REACT.state.lastModule);
  },

  continueLearning: function() {
    JEC.closeOv('ov-react');

    // Navigate back to learn view
    JEC.switchView('learn');

    // If learn module is loaded, go to unit list
    if (typeof JEC_LEARN !== 'undefined' && JEC_LEARN.renderUnits) {
      JEC_LEARN.state.view = 'units';
      JEC_LEARN.renderUnits(JEC_REACT.state.lastModule);
    }

    JEC.logActivity('react_continue', JEC_REACT.state.lastModule);
  },

  // ═══════════ HELPERS ═══════════
  playSfx: function(type) {
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);
      gain.gain.value = 0.05;

      if (type === 'click') {
        osc.frequency.value = 660;
        osc.start();
        osc.stop(actx.currentTime + 0.05);
      } else if (type === 'ok') {
        osc.frequency.value = 880;
        osc.type = 'sine';
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(1320, actx.currentTime + 0.15);
        osc.stop(actx.currentTime + 0.2);
      }
    } catch (e) {
      // Audio not supported
    }
  },

  // ═══════════ GET FEEDBACK COUNT ═══════════
  getCount: function() {
    return JEC.stats.reactCount || 0;
  },

  // ═══════════ REFRESH ═══════════
  refresh: function() {
    // Update text saat language change
    if (document.getElementById('ov-react') &&
        document.getElementById('ov-react').classList.contains('active')) {
      if (JEC_REACT.state.currentStep === 1) {
        JEC_REACT.renderStep1();
      } else {
        JEC_REACT.renderStep2();
      }
    }
  }
};

// ═══════════ INIT FUNCTION (dipanggil oleh j.js) ═══════════
window.JEC_REACT_INIT = function(JEC_REF) {
  JEC_REACT.init();
};

// ═══════════ REFRESH FUNCTION ═══════════
window.JEC_REACT_REFRESH = function(JEC_REF) {
  JEC_REACT.refresh();
};
