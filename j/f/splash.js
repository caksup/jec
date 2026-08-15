// JEC v.1.03 | 15/08/2026 | j/f/login.js | Login Form

window.JEC_LOGIN_INIT = function(JEC) {
  const loginBtn = document.getElementById('login-btn');
  const loginId = document.getElementById('login-id');
  const loginPin = document.getElementById('login-pin');
  
  if (loginBtn) {
    loginBtn.onclick = function() {
      JEC_UI.doLogin();
    };
  }
  
  if (loginPin) {
    loginPin.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        JEC_UI.doLogin();
      }
    });
  }
  
  if (loginId) {
    loginId.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        loginPin.focus();
      }
    });
  }
};

window.JEC_LOGIN_REFRESH = function(JEC) {
  // Update error message if visible
  const errorEl = document.getElementById('login-error');
  if (errorEl && errorEl.classList.contains('show')) {
    const errorMsg = document.getElementById('login-error-msg');
    if (errorMsg) {
      errorMsg.textContent = JEC.t('login_failed') || 'Invalid ID or PIN';
    }
  }
};
