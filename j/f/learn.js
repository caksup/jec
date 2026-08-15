// JEC v.1.03 | 15/08/2026 | j/f/learn.js | Learn Module + FLM

window.JEC_LEARN_INIT = function(JEC) {
  JEC_LEARN.state = {
    view: 'cards',
    module: null,
    unitId: null,
    partId: null
  };
  
  JEC_LEARN.renderCards();
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
  
  renderCurrentView: function() {
    if (this.state.view === 'cards') this.renderCards();
    else if (this.state.view === 'units') this.renderUnits(this.state.module);
    else if (this.state.view === 'parts') this.renderParts(this.state.module, this.state.unitId);
    else if (this.state.view === 'materi') this.renderMateri(this.state.module, this.state.unitId, this.state.partId);
  },
  
  renderCards: function() {
    const container = document.getElementById('feat-learn');
    if (!container) return;
    
    this.state.view = 'cards';
    this.state.module = null;
    this.state.unitId = null;
    this.state.partId = null;
    
    const modules = JEC.config.MODULES || {};
    const moduleKeys = Object.keys(modules);
    
    let html = '<div class="learn-cards-grid">';
    moduleKeys.forEach(function(key) {
      const mod = modules[key];
      const materiCount = Object.keys(JEC.materiData[key]?.materials || {}).length;
      
      html += '<div class="learn-card" onclick="JEC_LEARN.openModule(\'' + key + '\')">';
      html += '<span class="material-icons-round learn-card-icon">' + mod.icon + '</span>';
      html += '<div class="learn-card-title">' + JEC.esc(JEC.t('modules.' + key) || mod.en) + '</div>';
      html += '<div class="learn-card-count">' + materiCount + ' units</div>';
      html += '</div>';
    });
    html += '</div>';
    
    container.innerHTML = html;
    
    JEC_UI.hideFLMFab();
  },
  
  openModule: function(moduleKey) {
    this.state.module = moduleKey;
    this.renderUnits(moduleKey);
  },
  
  renderUnits: function(moduleKey) {
    const container = document.getElementById('feat-learn');
    if (!container) return;
    
    this.state.view = 'units';
    this.state.unitId = null;
    this.state.partId = null;
    
    const materi = JEC.materiData[moduleKey] || {};
    const materials = materi.materials || {};
    const unitIds = Object.keys(materials);
    
    let html = '';
    
    html += '<button class="back-btn" onclick="JEC_LEARN.renderCards()">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '<span>' + JEC.t('back') + '</span>';
    html += '</button>';
    
    html += '<div class="section-title-sm">';
    html += '<span class="material-icons-round">' + (JEC.config.MODULES[moduleKey]?.icon || 'school') + '</span>';
    html += '<span>' + JEC.esc(JEC.t('modules.' + moduleKey) || moduleKey) + '</span>';
    html += '</div>';
    
    if (!unitIds.length) {
      html += '<div class="empty-state">';
      html += '<span class="material-icons-round empty-icon">inbox</span>';
      html += '<div>' + JEC.t('no_units') + '</div>';
      html += '</div>';
    } else {
      html += '<div class="unit-list">';
      unitIds.forEach(function(uid) {
        const unit = materials[uid];
        if (unit.hidden) return;
        
        const locked = unit.locked;
        const partCount = Object.keys(unit.parts || {}).length;
        const clickHandler = locked ? '' : 'onclick="JEC_LEARN.openUnit(\'' + moduleKey + '\',\'' + uid + '\')"';
        
        html += '<div class="unit-item ' + (locked ? 'locked' : '') + '" ' + clickHandler + '>';
        html += '<div class="unit-item-info">';
        html += '<div class="unit-item-title">';
        if (locked) html += '<span class="material-icons-round unit-lock-icon">lock</span>';
        html += JEC.esc(unit.title || uid);
        html += '</div>';
        html += '<div class="unit-item-count">' + partCount + ' parts</div>';
        html += '</div>';
        html += '<span class="material-icons-round unit-chevron">chevron_right</span>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    container.innerHTML = html;
    
    JEC_UI.hideFLMFab();
  },
  
  openUnit: function(moduleKey, unitId) {
    this.state.unitId = unitId;
    this.renderParts(moduleKey, unitId);
    
    JEC_UI.flmState.module = moduleKey;
    JEC_UI.flmState.unitId = unitId;
    JEC_UI.showFLMFab();
  },
  
  renderParts: function(moduleKey, unitId) {
    const container = document.getElementById('feat-learn');
    if (!container) return;
    
    this.state.view = 'parts';
    this.state.partId = null;
    
    const materi = JEC.materiData[moduleKey] || {};
    const unit = (materi.materials || {})[unitId] || {};
    const parts = unit.parts || {};
    const partIds = Object.keys(parts);
    
    let html = '';
    
    const backTarget = JEC_UI.isFLMActive() ? 'JEC_LEARN.renderUnits(\'' + moduleKey + '\')' : 'JEC_LEARN.renderUnits(\'' + moduleKey + '\')';
    html += '<button class="back-btn" onclick="' + backTarget + '">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '<span>' + JEC.t('back') + '</span>';
    html += '</button>';
    
    html += '<div class="section-title-sm">';
    html += '<span>' + JEC.esc(unit.title || unitId) + '</span>';
    html += '</div>';
    
    if (!partIds.length) {
      html += '<div class="empty-state">';
      html += '<span class="material-icons-round empty-icon">inbox</span>';
      html += '<div>' + JEC.t('no_parts') + '</div>';
      html += '</div>';
    } else {
      html += '<div class="part-list">';
      partIds.forEach(function(pid) {
        const part = parts[pid];
        if (part.hidden) return;
        
        const locked = part.locked;
        const key = moduleKey + '_' + unitId + '_' + pid;
        const done = JEC.progressMap[key] === 'done';
        const clickHandler = locked ? '' : 'onclick="JEC_LEARN.openPart(\'' + moduleKey + '\',\'' + unitId + '\',\'' + pid + '\')"';
        
        html += '<div class="part-item ' + (locked ? 'locked' : '') + ' ' + (done ? 'done' : '') + '" ' + clickHandler + '>';
        html += '<div class="part-item-info">';
        html += '<div class="part-item-title">';
        if (locked) html += '<span class="material-icons-round part-lock-icon">lock</span>';
        if (done) html += '<span class="material-icons-round part-done-icon">check_circle</span>';
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
    if (JEC_UI.isFLMActive()) {
      const flmModule = JEC_UI.flmState.module;
      const flmUnit = JEC_UI.flmState.unitId;
      if (moduleKey !== flmModule || unitId !== flmUnit) {
        JEC.toast(JEC.t('flm_locked_nav') || 'Navigation locked during Focus Mode', 'warning');
        return;
      }
    }
    
    this.state.partId = partId;
    this.renderMateri(moduleKey, unitId, partId);
  },
  
  renderMateri: function(moduleKey, unitId, partId) {
    const container = document.getElementById('feat-learn');
    if (!container) return;
    
    this.state.view = 'materi';
    
    const materi = JEC.materiData[moduleKey] || {};
    const unit = (materi.materials || {})[unitId] || {};
    const part = (unit.parts || {})[partId] || {};
    
    let html = '';
    
    html += '<div class="materi-top-bar">';
    html += '<button class="back-btn" onclick="JEC_LEARN.renderParts(\'' + moduleKey + '\',\'' + unitId + '\')">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '<span>' + JEC.t('back') + '</span>';
    html += '</button>';
    html += '<button class="bookmark-btn" id="materi-bm-btn" onclick="JEC_LEARN.toggleBookmark(\'' + moduleKey + '\',\'' + unitId + '\',\'' + partId + '\')">';
    html += '<span class="material-icons-round" id="materi-bm-icon">bookmark_border</span>';
    html += '</button>';
    html += '</div>';
    
    html += '<div class="materi-header">';
    html += '<div class="materi-title">' + JEC.esc(part.title || partId) + '</div>';
    html += '<div class="materi-actions">';
    if (part.audioUrl) {
      html += '<button class="audio-btn" onclick="JEC_LEARN.playAudio(\'' + JEC.esc(part.audioUrl) + '\')">';
      html += '<span class="material-icons-round">volume_up</span>';
      html += '<span>' + JEC.t('listen') + '</span>';
      html += '</button>';
    }
    html += '</div>';
    html += '</div>';
    
    html += '<div class="materi-content">';
    const content = part.transcript || '';
    if (content.includes('|')) {
      const lines = content.split('\n').filter(function(l) { return l.trim(); });
      lines.forEach(function(line) {
        const sep = line.indexOf('|');
        if (sep === -1) {
          html += '<div>' + JEC.esc(line) + '</div>';
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
      html += JEC.esc(content) || '(No content)';
    }
    html += '</div>';
    
    if (part.quiz && part.quiz.length) {
      html += '<div class="quiz-section">';
      html += '<div class="quiz-title">';
      html += '<span class="material-icons-round">quiz</span>';
      html += '<span>' + JEC.t('quiz') + '</span>';
      html += '</div>';
      html += '<div id="quiz-body">';
      part.quiz.forEach(function(q, qi) {
        html += '<div class="quiz-item">';
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
    
    html += '<div class="notes-section">';
    html += '<div class="notes-title">';
    html += '<span class="material-icons-round">edit_note</span>';
    html += '<span>' + JEC.t('my_notes') + '</span>';
    html += '</div>';
    html += '<textarea id="materi-notes" rows="3" placeholder="' + JEC.t('write_notes') + '" oninput="JEC_LEARN.saveNote(\'' + moduleKey + '\',\'' + unitId + '\',\'' + partId + '\')"></textarea>';
    html += '</div>';
    
    container.innerHTML = html;
    
    const noteKey = moduleKey + '_' + unitId + '_' + partId;
    const notesTa = document.getElementById('materi-notes');
    if (notesTa && JEC.notesMap[noteKey]) {
      notesTa.value = JEC.notesMap[noteKey];
    }
    
    this.updateBookmarkBtn(moduleKey, unitId, partId);
    
    JEC.markDone(moduleKey, unitId, partId, 100);
    
    if (!part.quiz || !part.quiz.length) {
      setTimeout(function() {
        if (typeof JEC_REACT_SHOW === 'function') {
          JEC_REACT_SHOW();
        }
      }, 1000);
    }
  },
  
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
  
  playAudio: function(url) {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(function(e) {
      console.warn('Audio play failed:', e);
    });
    JEC.triggerDailyChallenge('tts_3', {});
  },
  
  saveNote: function(moduleKey, unitId, partId) {
    const notesTa = document.getElementById('materi-notes');
    if (!notesTa) return;
    JEC.saveNote(moduleKey, unitId, partId, notesTa.value);
  },
  
  answerQuiz: function(el, qIdx, optIdx, correctIdx) {
    const options = el.parentElement.querySelectorAll('.quiz-option');
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
    
    const quizItems = document.querySelectorAll('.quiz-item');
    let allAnswered = true;
    quizItems.forEach(function(item) {
      const opts = item.querySelectorAll('.quiz-option');
      let answered = false;
      opts.forEach(function(o) {
        if (o.classList.contains('correct') || o.classList.contains('wrong')) {
          answered = true;
        }
      });
      if (!answered) allAnswered = false;
    });
    
    if (allAnswered) {
      let correctCount = 0;
      quizItems.forEach(function(item) {
        const correctOpt = item.querySelector('.quiz-option.correct');
        if (correctOpt && !item.querySelector('.quiz-option.wrong')) {
          correctCount++;
        }
      });
      
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
      
      setTimeout(function() {
        if (typeof JEC_REACT_SHOW === 'function') {
          JEC_REACT_SHOW();
        }
      }, 1000);
    }
  }
};
