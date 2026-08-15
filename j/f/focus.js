// JEC v.1.04 | 15/08/2026 | j/f/focus.js | Focus Learn Mode Timer

window.JEC_FOCUS_INIT = function(JEC) {
  JEC_FOCUS.state = {
    active: false,
    seconds: 0,
    totalSeconds: 0,
    timer: null,
    module: null,
    unitId: null,
    partId: null
  };
};

window.JEC_FOCUS_REFRESH = function(JEC) {
  // No refresh needed
};

window.JEC_FOCUS = {
  state: {
    active: false,
    seconds: 0,
    totalSeconds: 0,
    timer: null,
    module: null,
    unitId: null,
    partId: null
  },
  
  showOverlay: function(duration) {
    duration = duration || JEC.config.MFL_DEFAULT || 25;
    this.state.totalSeconds = duration * 60;
    this.state.seconds = this.state.totalSeconds;
    
    const timerEl = document.getElementById('focus-timer');
    if (timerEl) {
      timerEl.textContent = this.formatTime(this.state.seconds);
    }
    
    const progressBar = document.getElementById('focus-progress-bar');
    if (progressBar) {
      progressBar.style.width = '0%';
    }
    
    const startBtn = document.getElementById('focus-start-btn');
    if (startBtn) {
      startBtn.innerHTML = '<span>' + JEC.t('start') + '</span>';
    }
    
    JEC.openOv('feat-focus-overlay');
  },
  
  start: function() {
    if (this.state.active) return;
    
    this.state.active = true;
    
    const startBtn = document.getElementById('focus-start-btn');
    if (startBtn) {
      startBtn.innerHTML = '<span>' + JEC.t('pause') + '</span>';
    }
    
    this.state.timer = setInterval(() => {
      this.state.seconds--;
      this.updateDisplay();
      
      if (this.state.seconds <= 0) {
        this.complete();
      }
    }, 1000);
  },
  
  pause: function() {
    if (!this.state.active) return;
    
    this.state.active = false;
    clearInterval(this.state.timer);
    
    const startBtn = document.getElementById('focus-start-btn');
    if (startBtn) {
      startBtn.innerHTML = '<span>' + JEC.t('start') + '</span>';
    }
  },
  
  toggle: function() {
    if (this.state.active) {
      this.pause();
    } else {
      this.start();
    }
  },
  
  skip: function() {
    clearInterval(this.state.timer);
    this.state.active = false;
    JEC.closeOv('feat-focus-overlay');
    
    if (typeof JEC_UI !== 'undefined' && JEC_UI.showFLMFab) {
      JEC_UI.showFLMFab();
    }
  },
  
  complete: function() {
    clearInterval(this.state.timer);
    this.state.active = false;
    JEC.closeOv('feat-focus-overlay');
    
    JEC.saveFocusMode(
      this.state.module,
      this.state.unitId,
      this.state.partId,
      this.state.totalSeconds / 60,
      true
    );
    
    JEC.toast(JEC.t('flm_complete') || 'Focus session completed!', 'success', 3000);
    
    if (typeof JEC_UI !== 'undefined' && JEC_UI.showFLMFab) {
      JEC_UI.showFLMFab();
    }
  },
  
  updateDisplay: function() {
    const timerEl = document.getElementById('focus-timer');
    if (timerEl) {
      timerEl.textContent = this.formatTime(this.state.seconds);
    }
    
    const progressBar = document.getElementById('focus-progress-bar');
    if (progressBar && this.state.totalSeconds > 0) {
      const elapsed = this.state.totalSeconds - this.state.seconds;
      const percent = (elapsed / this.state.totalSeconds) * 100;
      progressBar.style.width = percent + '%';
    }
  },
  
  formatTime: function(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
};
