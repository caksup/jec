// JEC v.1.03 | 15/08/2026 | j/f/header.js | Header, Clock, Greeting

window.JEC_HEADER_INIT = function(JEC) {
  JEC_HEADER.updateAll();
  
  setInterval(function() {
    JEC_HEADER.updateClock();
  }, 1000);
  
  setInterval(function() {
    if (JEC.user) {
      JEC.fetchOnlineCount();
    }
  }, 30000);
};

window.JEC_HEADER_REFRESH = function(JEC) {
  JEC_HEADER.updateAll();
};

window.JEC_HEADER = {
  updateAll: function() {
    this.updateClock();
    this.updateGreeting();
    this.updateUserInfo();
    this.updateThemeIcon();
    this.updateLangBtn();
  },
  
  updateClock: function() {
    const el = document.getElementById('datetime');
    if (!el) return;
    
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = days[now.getDay()];
    const d = now.getDate();
    const m = months[now.getMonth()];
    const y = now.getFullYear();
    let h = now.getHours();
    const min = String(now.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    
    el.textContent = day + ', ' + d + ' ' + m + ' ' + y + ' · ' + h + ':' + min + ' ' + ampm;
  },
  
  updateGreeting: function() {
    const greetEl = document.getElementById('greet-text');
    if (!greetEl) return;
    
    const hour = new Date().getHours();
    let greetKey = 'morning';
    if (hour >= 12 && hour < 15) greetKey = 'afternoon';
    else if (hour >= 15 && hour < 18) greetKey = 'evening';
    else if (hour >= 18 || hour < 5) greetKey = 'night';
    
    greetEl.textContent = JEC.t('greet.' + greetKey);
  },
  
  updateUserInfo: function() {
    const userName = document.getElementById('user-name');
    if (userName && JEC.user) {
      const displayName = JEC.user.nickname ? '@' + JEC.user.nickname : JEC.user.name;
      userName.textContent = displayName;
    }
    
    const courseName = document.getElementById('course-name');
    if (courseName) {
      courseName.textContent = JEC.config.APP_SHORT || 'JEC';
    }
  },
  
  updateThemeIcon: function() {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    const current = document.documentElement.getAttribute('data-theme');
    icon.textContent = current === 'dark' ? 'light_mode' : 'dark_mode';
  },
  
  updateLangBtn: function() {
    const langBtn = document.getElementById('lang-btn');
    const loginLangBtn = document.getElementById('login-lang-btn');
    const langText = JEC.lang.toUpperCase();
    
    if (langBtn) langBtn.textContent = langText;
    if (loginLangBtn) loginLangBtn.textContent = langText;
  },
  
  updateOnlineCount: function(count) {
    const el = document.getElementById('online-num');
    if (el) el.textContent = count;
  }
};
