// JEC v.1.06 | 15/08/2026 | j/f/learn.js | Learn Module (Full)

'use strict';

window.JEC_LEARN_INIT = function(JEC) {
  JEC_LEARN.state = {
    view: 'cards',
    module: null,
    unitId: null,
    partId: null
  };
  
  JEC_LEARN.renderCards();
  
  if (window.location.hash) {
    setTimeout(function() {
      JEC.navigateFromHash();
    }, 500);
  }
};

window.JEC_LEARN_REFRESH = function(JEC) {
  JEC_LEARN.renderCurrentView();
};

window.JEC_LEARN = {
  state: {
    view: 'cards',
    module: null,
    unitId: null,
    partId: null
  },
  
  // ═══════════ VIEW ROUTER ═══════════
  
  renderCurrentView: function() {
    if (this.state.view === 'cards') this.renderCards();
    else if (this.state.view === 'units') this.renderUnits(this.state.module);
    else if (this.state.view === 'parts') this.renderParts(this.state.module, this.state.unitId);
    else if (this.state.view === 'materi') this.renderMateri(this.state.module, this.state.unitId, this.state.partId);
  },
  
  // ═══════════ CARDS VIEW (5 MODULES) ═══════════
  
  renderCards: function() {
    const container = document.getElementById('feat-learn');
    if (!container) return;
    
    this.state.view = 'cards';
    this.state.module = null;
    this.state.unitId = null;
    this.state.partId = null;
    
    JEC.updateHash(null, null, null);
    
    const modules = JEC.config.MODULES || {};
    const moduleKeys = Object.keys(modules);
    
    let html = '<div class="learn-cards-grid">';
    moduleKeys.forEach(function(key) {
      const mod = modules[key];
      const materi = JEC.materiData[key] || {};
      const materiCount = Object.keys(materi.materials || {}).length;
      const modName = JEC.lang === 'id' ? (mod.id || key) : (mod.en || key);
      
      html += '<div class="learn-card" onclick="JEC_LEARN.openModule(\'' + key + '\')">';
      html += '<span class="material-icons-round learn-card-icon">' + mod.icon + '</span>';
      html += '<div class="learn-card-title">' + JEC.esc(modName) + '</div>';
      html += '<div class="learn-card-count">' + materiCount + ' ' + JEC.t('units') + '</div>';
      html += '</div>';
    });
    html += '</div>';
    
    container.innerHTML = html;
    
    if (typeof JEC_UI !== 'undefined' && JEC_UI.hideFLMFab) {
      JEC_UI.hideFLMFab();
    }
  },
  
  openModule: function(moduleKey) {
    this.state.module = moduleKey;
    this.renderUnits(moduleKey);
  },
  
  // ═══════════ UNITS VIEW ═══════════
  
  renderUnits: function(moduleKey) {
    const container = document.getElementById('feat-learn');
    if (!container) return;
    
    this.state.view = 'units';
    this.state.module = moduleKey;
    this.state.unitId = null;
    this.state.partId = null;
    
    JEC.updateHash(null, null, null);
    
    const materi = JEC.materiData[moduleKey] || {};
    const materials = materi.materials || {};
    const unitIds = Object.keys(materials);
    
    const modules = JEC.config.MODULES || {};
    const mod = modules[moduleKey] || {};
    const modName = JEC.lang === 'id' ? (mod.id || moduleKey) : (mod.en || moduleKey);
    const modIcon = mod.icon || 'school';
    
    let html = '';
    
    html += '<button class="back-btn" onclick="JEC_LEARN.renderCards()">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '<span>' + JEC.t('back') + '</span>';
    html += '</button>';
    
    html += '<div class="section-title-sm">';
    html += '<span class="material-icons-round">' + modIcon + '</span>';
    html += '<span>' + JEC.esc(modName) + '</span>';
    html += '</div>';
    
    if (!unitIds.length) {
      html += '<div class="empty-state">';
      html += '<span class="material-icons-round empty-icon">inbox</span>';
      html += '<div>' + (JEC.t('no_units') || 'No units available') + '</div>';
      html += '</div>';
    } else {
      html += '<div class="unit-list">';
      unitIds.forEach(function(uid) {
        const unit = materials[uid];
        if (!unit) return;
        if (unit.hidden) return;
        
        const locked = unit.locked;
        const parts = unit.parts || {};
        const partIds = Object.keys(parts);
        const partCount = partIds.length;
        
        let doneCount = 0;
        partIds.forEach(function(pid) {
          const key = moduleKey + '_' + uid + '_' + pid;
          if (JEC.progressMap[key] === 'done') doneCount++;
        });
        
        const allDone = partCount > 0 && doneCount === partCount;
        const clickHandler = locked ? '' : 'onclick="JEC_LEARN.openUnit(\'' + moduleKey + '\',\'' + uid + '\')"';
        
        html += '<div class="unit-item ' + (locked ? 'locked' : '') + ' ' + (allDone ? 'all-done' : '') + '" ' + clickHandler + '>';
        html += '<div class="unit-item-info">';
        html += '<div class="unit-item-title">';
        if (locked) html += '<span class="material-icons-round unit-lock-icon">lock</span>';
        if (allDone && !locked) html += '<span class="material-icons-round unit-done-icon">check_circle</span>';
        html += JEC.esc(unit.title || uid);
        html += '</div>';
        html += '<div class="unit-item-count">';
        if (!locked) html += doneCount + '/' + partCount + ' ' + JEC.t('parts');
        else html += JEC.t('locked');
        html += '</div>';
        html += '</div>';
        html += '<span class="material-icons-round unit-chevron">chevron_right</span>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    container.innerHTML = html;
    
    if (typeof JEC_UI !== 'undefined' && JEC_UI.hideFLMFab) {
      JEC_UI.hideFLMFab();
    }
  },
  
  openUnit: function(moduleKey, unitId) {
    if (typeof JEC_UI !== 'undefined' && JEC_UI.isFLMActive && JEC_UI.isFLMActive()) {
      const flmModule = JEC_UI.flmState ? JEC_UI.flmState.module : null;
      if (flmModule && moduleKey !== flmModule) {
        JEC.toast(JEC.t('flm_locked_nav') || 'Navigation locked during Focus Mode', 'warning');
        return;
      }
    }
    
    this.state.unitId = unitId;
    this.renderParts(moduleKey, unitId);
    
    if (typeof JEC_UI !== 'undefined') {
      JEC_UI.flmState = JEC_UI.flmState || {};
      JEC_UI.flmState.module = moduleKey;
      JEC_UI.flmState.unitId = unitId;
      
      if (JEC_UI.showFLMFab) JEC_UI.showFLMFab();
    }
  },
  
  // ═══════════ PARTS VIEW ═══════════
  
  renderParts: function(moduleKey, unitId) {
    const container = document.getElementById('feat-learn');
    if (!container) return;
    
    this.state.view = 'parts';
    this.state.module = moduleKey;
    this.state.unitId = unitId;
    this.state.partId = null;
    
    JEC.updateHash(null, null, null);
    
    const materi = JEC.materiData[moduleKey] || {};
    const unit = (materi.materials || {})[unitId] || {};
    const parts = unit.parts || {};
    const partIds = Object.keys(parts);
    
    let html = '';
    
    html += '<button class="back-btn" onclick="JEC_LEARN.renderUnits(\'' + moduleKey + '\')">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '<span>' + JEC.t('back') + '</span>';
    html += '</button>';
    
    html += '<div class="section-title-sm">';
    html += '<span>' + JEC.esc(unit.title || unitId) + '</span>';
    html += '</div>';
    
    if (!partIds.length) {
      html += '<div class="empty-state">';
      html += '<span class="material-icons-round empty-icon">inbox</span>';
      html += '<div>' + (JEC.t('no_parts') || 'No parts available') + '</div>';
      html += '</div>';
    } else {
      html += '<div class="part-list">';
      partIds.forEach(function(pid) {
        const part = parts[pid];
        if (!part) return;
        if (part.hidden) return;
        
        const locked = part.locked;
        const key = moduleKey + '_' + unitId + '_' + pid;
        const done = JEC.progressMap[key] === 'done';
        const clickHandler = locked ? '' : 'onclick="JEC_LEARN.openPart(\'' + moduleKey + '\',\'' + unitId + '\',\'' + pid + '\')"';
        
        html += '<div class="part-item ' + (locked ? 'locked' : '') + ' ' + (done ? 'done' : '') + '" ' + clickHandler + '>';
        html += '<div class="part-item-info">';
        html += '<div class="part-item-title">';
        if (locked) html += '<span class="material-icons-round part-lock-icon">lock</span>';
        if (done && !locked) html += '<span class="material-icons-round part-done-icon">check_circle</span>';
        html += JEC.esc(part.title || pid);
        html += '</div>';
        html += '</div>';
        html += '<span class="material-icons-round part-chevron">chevron_right</span>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    container.innerHTML = html;
  },
  
  openPart: function(moduleKey, unitId, partId) {
    if (typeof JEC_UI !== 'undefined' && JEC_UI.isFLMActive && JEC_UI.isFLMActive()) {
      const flmModule = JEC_UI.flmState ? JEC_UI.flmState.module : null;
      const flmUnit = JEC_UI.flmState ? JEC_UI.flmState.unitId : null;
      if (flmModule && flmUnit) {
        if (moduleKey !== flmModule || unitId !== flmUnit) {
          JEC.toast(JEC.t('flm_locked_nav') || 'Navigation locked during Focus Mode', 'warning');
          return;
        }
      }
    }
    
    this.state.partId = partId;
    this.renderMateri(moduleKey, unitId, partId);
    
    JEC.updateHash(moduleKey, unitId, partId);
  },
  
  // ═══════════ MATERI VIEW ═══════════
  
  renderMateri: function(moduleKey, unitId, partId) {
    const container = document.getElementById('feat-learn');
    if (!container) return;
    
    this.state.view = 'materi';
    this.state.module = moduleKey;
    this.state.unitId = unitId;
    this.state.partId = partId;
    
    JEC.updateHash(moduleKey, unitId, partId);
    
    const materi = JEC.materiData[moduleKey] || {};
    const unit = (materi.materials || {})[unitId] || {};
    const part = (unit.parts || {})[partId] || {};
    
    let html = '';
    
    // Top Bar (Back + Bookmark)
    html += '<div class="materi-top-bar">';
    html += '<button class="back-btn" onclick="JEC_LEARN.renderParts(\'' + moduleKey + '\',\'' + unitId + '\')">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '<span>' + JEC.t('back') + '</span>';
    html += '</button>';
    html += '<button class="bookmark-btn" id="materi-bm-btn" onclick="JEC_LEARN.toggleBookmark(\'' + moduleKey + '\',\'' + unitId + '\',\'' + partId + '\')">';
    html += '<span class="material-icons-round" id="materi-bm-icon">bookmark_border</span>';
    html += '</button>';
    html += '</div>';
    
    // Header (Title + Actions)
    html += '<div class="materi-header">';
    html += '<div class="materi-title">' + JEC.esc(part.title || partId) + '</div>';
    html += '<div class="materi-actions">';
    if (part.audioUrl) {
      html += '<button class="audio-btn" onclick="JEC_LEARN.playAudio(\'' + JEC.esc(part.audioUrl).replace(/'/g, "\\'") + '\')">';
      html += '<span class="material-icons-round">volume_up</span>';
      html += '<span>' + JEC.t('listen') + '</span>';
      html += '</button>';
    }
    html += '</div>';
    html += '</div>';
    
    // Content
    html += '<div class="materi-content">';
    const content = part.transcript || '';
    if (content.includes('|')) {
      const lines = content.split('\n').filter(function(l) { return l.trim(); });
      lines.forEach(function(line) {
        const sep = line.indexOf('|');
        if (sep === -1) {
          html += '<div class="vocab-line-full">' + JEC.esc(line) + '</div>';
        } else {
          const en = line.slice(0, sep).trim();
          const id = line.slice(sep + 1).trim();
          html += '<div class="vocab-line">';
          html += '<span class="vocab-en">' + JEC.esc(en) + '</span>';
          html += '<span class="vocab-id">' + JEC.esc(id) + '</span>';
          html += '</div>';
        }
      });
    } else {
      html += '<div class="materi-text">' + JEC.esc(content || '(No content)') + '</div>';
    }
    html += '</div>';
    
    // Quiz Section
    if (part.quiz && part.quiz.length) {
      html += '<div class="quiz-section">';
      html += '<div class="quiz-title">';
      html += '<span class="material-icons-round">quiz</span>';
      html += '<span>' + JEC.t('quiz') + '</span>';
      html += '</div>';
      html += '<div id="quiz-body">';
      part.quiz.forEach(function(q, qi) {
        html += '<div class="quiz-item" data-qi="' + qi + '" data-answer="' + q.a + '">';
        html += '<div class="quiz-question">' + (qi + 1) + '. ' + JEC.esc(q.q) + '</div>';
        html += '<div class="quiz-options">';
        q.opts.forEach(function(opt, oi) {
          html += '<div class="quiz-option" onclick="JEC_LEARN.answerQuiz(this,' + qi + ',' + oi + ',' + q.a + ')">' + JEC.esc(opt) + '</div>';
        });
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    }
    
    // Notes Section
    html += '<div class="notes-section">';
    html += '<div class="notes-title">';
    html += '<span class="material-icons-round">edit_note</span>';
    html += '<span>' + JEC.t('my_notes') + '</span>';
    html += '</div>';
    html += '<textarea id="materi-notes" rows="4" placeholder="' + (JEC.t('write_notes') || 'Write your notes here...') + '" oninput="JEC_LEARN.saveNote(\'' + moduleKey + '\',\'' + unitId + '\',\'' + partId + '\')"></textarea>';
    html += '</div>';
    
    container.innerHTML = html;
    
    // Load saved note
    const noteKey = moduleKey + '_' + unitId + '_' + partId;
    const notesTa = document.getElementById('materi-notes');
    if (notesTa && JEC.notesMap[noteKey]) {
      notesTa.value = JEC.notesMap[noteKey];
    }
    
    // Update bookmark button
    this.updateBookmarkBtn(moduleKey, unitId, partId);
    
    // Mark done
    JEC.markDone(moduleKey, unitId, partId, 100);
    
    // Show react overlay if no quiz
    if (!part.quiz || !part.quiz.length) {
      setTimeout(function() {
        if (typeof JEC_REACT_SHOW === 'function') {
          JEC_REACT_SHOW();
        }
      }, 1000);
    }
  },
  
  // ═══════════ BOOKMARK ═══════════
  
  toggleBookmark: function(moduleKey, unitId, partId) {
    const key = moduleKey + '_' + unitId + '_' + partId;
    if (JEC.bookmarkList.includes(key)) {
      JEC.removeBookmark(moduleKey, unitId, partId);
      JEC.toast(JEC.t('bookmark_removed') || 'Bookmark removed', 'warning');
    } else {
      JEC.addBookmark(moduleKey, unitId, partId);
      JEC.toast(JEC.t('bookmark_added') || 'Added to bookmarks', 'success');
    }
    this.updateBookmarkBtn(moduleKey, unitId, partId);
  },
  
  updateBookmarkBtn: function(moduleKey, unitId, partId) {
    const key = moduleKey + '_' + unitId + '_' + partId;
    const icon = document.getElementById('materi-bm-icon');
    const btn = document.getElementById('materi-bm-btn');
    if (!icon || !btn) return;
    
    const isBookmarked = JEC.bookmarkList.includes(key);
    icon.textContent = isBookmarked ? 'bookmark' : 'bookmark_border';
    btn.classList.toggle('bookmarked', isBookmarked);
  },
  
  // ═══════════ AUDIO ═══════════
  
  playAudio: function(url) {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(function(e) {
      console.warn('Audio play failed:', e);
      JEC.toast(JEC.t('audio_error') || 'Failed to play audio', 'error');
    });
    JEC.triggerDailyChallenge('tts_3', {});
  },
  
  // ═══════════ NOTES ═══════════
  
  saveNote: function(moduleKey, unitId, partId) {
    const notesTa = document.getElementById('materi-notes');
    if (!notesTa) return;
    JEC.saveNote(moduleKey, unitId, partId, notesTa.value);
  },
  
  // ═══════════ QUIZ ═══════════
  
  answerQuiz: function(el, qIdx, optIdx, correctIdx) {
    const parent = el.parentElement;
    if (!parent) return;
    
    const options = parent.querySelectorAll('.quiz-option');
    let alreadyAnswered = false;
    options.forEach(function(o) {
      if (o.classList.contains('correct') || o.classList.contains('wrong')) {
        alreadyAnswered = true;
      }
    });
    if (alreadyAnswered) return;
    
    if (optIdx === correctIdx) {
      el.classList.add('correct');
      JEC.toast(JEC.t('correct_answer') || 'Correct!', 'success', 1500);
    } else {
      el.classList.add('wrong');
      options[correctIdx].classList.add('correct');
      JEC.toast(JEC.t('wrong_answer') || 'Wrong answer', 'error', 2000);
    }
    
    // Check if all answered
    const quizItems = document.querySelectorAll('.quiz-item');
    let allAnswered = true;
    let correctCount = 0;
    
    quizItems.forEach(function(item) {
      const opts = item.querySelectorAll('.quiz-option');
      let answered = false;
      opts.forEach(function(o) {
        if (o.classList.contains('correct') || o.classList.contains('wrong')) {
          answered = true;
        }
      });
      if (!answered) {
        allAnswered = false;
      } else {
        const isCorrect = item.querySelector('.quiz-option.correct') && !item.querySelector('.quiz-option.wrong');
        if (isCorrect) correctCount++;
      }
    });
    
    if (allAnswered) {
      const totalQ = quizItems.length;
      const score = Math.round((correctCount / totalQ) * 100);
      
      JEC.saveScore(
        JEC_LEARN.state.module,
        JEC_LEARN.state.unitId,
        JEC_LEARN.state.partId,
        score,
        totalQ,
        correctCount
      );
      
      if (score === 100) {
        JEC.toast('🎉 ' + (JEC.t('perfect_score') || 'Perfect Score!'), 'success', 2500);
      } else {
        JEC.toast((JEC.t('your_score') || 'Your score') + ': ' + score + '%', score >= 80 ? 'success' : 'warning', 2500);
      }
      
      setTimeout(function() {
        if (typeof JEC_REACT_SHOW === 'function') {
          JEC_REACT_SHOW();
        }
      }, 1500);
    }
  },
  
  // ═══════════ UTILITY ═══════════
  
  getProgressPercent: function(moduleKey, unitId) {
    const materi = JEC.materiData[moduleKey] || {};
    const unit = (materi.materials || {})[unitId] || {};
    const parts = unit.parts || {};
    const partIds = Object.keys(parts);
    
    if (!partIds.length) return 0;
    
    let done = 0;
    partIds.forEach(function(pid) {
      const key = moduleKey + '_' + unitId + '_' + pid;
      if (JEC.progressMap[key] === 'done') done++;
    });
    
    return Math.round((done / partIds.length) * 100);
  }
};
