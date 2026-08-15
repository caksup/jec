// JEC v.1.06 | 15/08/2026 | j/f/ | React/Feedback Module

'use strict';

window.JEC_REACT_INIT = function(JEC) {
  JEC_REACT.state = { step: 1, reaction: null };
};

window.JEC_REACT_REFRESH = function(JEC) {
  // No refresh needed
};

window.JEC_REACT = {
  state: { step: 1, reaction: null },
  
  show: function() {
    this.state.step = 1;
    this.state.reaction = null;
    this.renderContent();
    JEC.openOv('ov-react');
  },
  
  renderContent: function() {
    const container = document.getElementById('feat-react-content');
    if (!container) return;
    
    let html = '';
    
    if (this.state.step === 1) {
      html += '<div class="react-step">';
      html += '<div class="react-question">' + (JEC.t('how_was_lesson') || 'How was this lesson?') + '</div>';
      html += '<div class="react-row">';
      
      const reactions = [
        { id: 'happy', icon: 'sentiment_very_satisfied', label: JEC.t('react.great') || 'Great!' },
        { id: 'mid', icon: 'sentiment_neutral', label: JEC.t('react.ok') || 'Okay' },
        { id: 'sad', icon: 'sentiment_dissatisfied', label: JEC.t('react.bad') || 'Bad' }
      ];
      
      reactions.forEach(r => {
        html += '<button class="react-btn" onclick="JEC_REACT.sendReact(\'' + r.id + '\')">';
        html += '<span class="material-icons-round react-emoji">' + r.icon + '</span>';
        html += '<div class="react-label">' + JEC.esc(r.label) + '</div>';
        html += '</button>';
      });
      
      html += '</div>';
      html += '</div>';
    } else if (this.state.step === 2) {
      html += '<div class="react-step react-thanks-step">';
      html += '<span class="material-icons-round react-thanks-icon">check_circle</span>';
      html += '<div class="react-thanks">' + (JEC.t('thanks_feedback') || 'Thanks for your feedback! 🎉') + '</div>';
      html += '<div class="react-next-btns">';
      
      if (JEC.config.EXE_URL) {
        html += '<button class="btn-primary react-next-btn" onclick="JEC_REACT.openExercise()">';
        html += '<span class="material-icons-round">quiz</span>';
        html += '<span>' + (JEC.t('exercise') || 'Exercise') + '</span>';
        html += '</button>';
      }
      
      if (JEC.config.MINIGAMES) {
        html += '<button class="btn-primary react-next-btn react-btn-games" onclick="JEC_REACT.openMinigames()">';
        html += '<span class="material-icons-round">sports_esports</span>';
        html += '<span>' + (JEC.t('minigames') || 'Minigames') + '</span>';
        html += '</button>';
      }
      
      html += '<button class="btn-ghost react-next-btn" onclick="JEC_REACT.close()">';
      html += '<span>' + (JEC.t('continue_learning') || 'Continue Learning') + '</span>';
      html += '</button>';
      
      html += '</div>';
      html += '</div>';
    }
    
    container.innerHTML = html;
  },
  
  sendReact: function(type) {
    this.state.reaction = type;
    this.state.step = 2;
    this.renderContent();
    
    JEC.stats.reactCount = (JEC.stats.reactCount || 0) + 1;
    
    JEC.apiPost({
      action: 'log',
      id: JEC.user.id,
      batch: JEC.user.batch,
      type: 'react',
      details: type + ' on ' + (JEC.currentModule || '') + '/' + (JEC.currentUnitId || '') + '/' + (JEC.currentPartId || '')
    }).catch(function() {});
  },
  
  openExercise: function() {
    JEC.closeOv('ov-react');
    if (typeof JEC_UI !== 'undefined' && JEC_UI.openExercise) {
      JEC_UI.openExercise();
    }
  },
  
  openMinigames: function() {
    JEC.closeOv('ov-react');
    if (typeof JEC_UI !== 'undefined' && JEC_UI.openMinigames) {
      JEC_UI.openMinigames();
    }
  },
  
  close: function() {
    JEC.closeOv('ov-react');
  }
};

// Expose global function untuk dipanggil dari j.js atau learn.js
window.JEC_REACT_SHOW = function() {
  if (typeof JEC_REACT !== 'undefined' && JEC_REACT.show) {
    JEC_REACT.show();
  }
};
