/* #23 | /root/js/s/state.js | v 2.1 | u 08/09/2026 • 11:50:00 | xu : ke-3 | note : #noteresponse
- FIX BLANK: tambah helper global showTabPage(name) & highlightBnNav(name).
  setTab() kini JUGA mengaktifkan container .tab-page (class .active) selain highlight bottom nav.
- Field & helper lama TIDAK diubah (user, sessions, answers, activeTab, myProfile, myValues, refreshProfile). */

(function(){
  'use strict';
  var defaults = {
    user: null,
    sessions: [],
    questions: [],
    currentSession: null,
    answers: {},
    flagged: new Set(),
    currentIndex: 0,
    timeRemaining: 0,
    timer: null,
    startTime: null,
    tabSwitch: 0,
    blur: 0,
    antiLog: [],
    settings: { antiCheatEnabled: true, maxTabSwitches: 3 },
    attemptId: null,
    myAttempts: [],

    // FIELD BARU (arsitektur bottom nav)
    activeTab: 'home',
    myProfile: null,
    myValues: []
  };

  window.PS = window.PS || {};
  Object.keys(defaults).forEach(function(k){
    if (window.PS[k] === undefined) window.PS[k] = defaults[k];
  });

  // ===== Helper: tampilkan container tab-page =====
  window.showTabPage = function(name){
    document.querySelectorAll('.tab-page').forEach(function(el){
      if (el.id === 'page-' + name) el.classList.add('active');
      else el.classList.remove('active');
    });
  };

  // ===== Helper: highlight bottom nav =====
  window.highlightBnNav = function(name){
    document.querySelectorAll('.bn-item').forEach(function(el){
      if (el.dataset.tab === name) el.classList.add('active');
      else el.classList.remove('active');
    });
  };

  // ===== Ganti tab =====
  window.PS.setTab = function(name){
    var valid = ['home','riwayat','nilai','feedback','profile'];
    if (valid.indexOf(name) === -1) return;
    PS.activeTab = name;
    if (window.showTabPage) window.showTabPage(name);
    if (window.highlightBnNav) window.highlightBnNav(name);
    if (window.renderStudentTab) window.renderStudentTab(name);
  };

  // ===== Reload snapshot profil =====
  window.PS.refreshProfile = function(){
    if (!PS.user || !PS.user.id) return Promise.resolve();
    return db.collection('students').doc(PS.user.id).get().then(function(d){
      if (d.exists) {
        PS.myProfile = Object.assign({id:d.id}, d.data());
        if (window.renderProfileTab) window.renderProfileTab();
      }
    });
  };

  console.log('✅ s/state.js v2.1 loaded — showTabPage/highlightBnNav siap');
})();