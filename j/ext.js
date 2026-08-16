// JEC v.10.01 MASTER | 17/08/2026 | j/ext.js | Feature Router
// Router untuk inject fitur di Extra menu
// Format URL: #ext/:featureId atau #ext/:featureId?param1=value1&param2=value2
// Feature files: j/f/ext/*.js (register ke window.JEC_EXT_FEATURES)

'use strict';

window.JEC_EXT = {
  state: {
    initialized: false,
    currentFeature: null,
    currentParams: {},
    previousView: 'extra',
    featureCache: {},
    loadingFeature: null
  },

  // ═══════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════
  init: function() {
    if (JEC_EXT.state.initialized) return;
    
    // Listen hash change
    window.addEventListener('hashchange', JEC_EXT.handleHash);
    
    JEC_EXT.state.initialized = true;
    console.log('[JEC_EXT] Initialized');
    
    // Check current hash on init
    JEC_EXT.handleHash();
  },

  // ═══════════════════════════════════════════════════
  // HASH ROUTER
  // ═══════════════════════════════════════════════════
  handleHash: function() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    
    // Only handle #ext/* routes
    if (!hash.startsWith('ext/')) return;
    
    // Parse: ext/:featureId?params atau ext/:featureId/p1/p2
    const routePart = hash.substring(4); // remove 'ext/'
    let featureId = '';
    let params = {};
    
    // Check for query params: ext/mcq?unit=u1&part=p1
    if (routePart.indexOf('?') >= 0) {
      const parts = routePart.split('?');
      featureId = parts[0];
      const queryString = parts[1];
      const queryPairs = queryString.split('&');
      queryPairs.forEach(function(pair) {
        const kv = pair.split('=');
        if (kv[0]) {
          params[kv[0]] = decodeURIComponent(kv[1] || '');
        }
      });
    } else {
      // Positional: ext/mcq/u1/p1
      const parts = routePart.split('/');
      featureId = parts[0];
      for (let i = 1; i < parts.length; i++) {
        params['p' + (i - 1)] = decodeURIComponent(parts[i]);
      }
    }
    
    if (!featureId) return;
    
    JEC_EXT.navigate(featureId, params);
  },

  // ═══════════════════════════════════════════════════
  // NAVIGATE TO FEATURE
  // ═══════════════════════════════════════════════════
  navigate: function(featureId, params) {
    params = params || {};
    
    // Get feature config from registry
    const feature = JEC_EXT.getFeatureConfig(featureId);
    
    if (!feature) {
      console.warn('[JEC_EXT] Unknown feature: ' + featureId);
      JEC_EXT.renderNotFound(featureId);
      return;
    }
    
    // Check if feature is enabled
    if (feature.enabled === false) {
      JEC_EXT.renderMaintenance(featureId, feature);
      return;
    }
    
    // Save previous view for back button
    if (typeof JEC !== 'undefined' && JEC.activeView) {
      JEC_EXT.state.previousView = JEC.activeView;
    }
    
    // Update state
    JEC_EXT.state.currentFeature = featureId;
    JEC_EXT.state.currentParams = params;
    
    // Switch to modular view
    if (typeof JEC !== 'undefined' && JEC.switchView) {
      // Don't use switchView because it will re-render, just toggle visibility
      document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
      const target = document.getElementById('view-modular');
      if (target) target.classList.add('active');
      JEC.activeView = 'modular';
      
      // Update nav buttons (unselect all)
      document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
    }
    
    // Update title
    JEC_EXT.updateTitle(featureId, feature);
    
    // Render feature
    JEC_EXT.render(featureId, params);
    
    // Log activity
    if (typeof JEC !== 'undefined' && JEC.logActivity) {
      JEC.logActivity('ext_navigate', featureId + ' ' + JSON.stringify(params));
    }
  },

  // ═══════════════════════════════════════════════════
  // PROGRAMMATIC NAVIGATION
  // ═══════════════════════════════════════════════════
  goTo: function(featureId, params) {
    let hash = '#ext/' + featureId;
    
    if (params && typeof params === 'object' && Object.keys(params).length > 0) {
      const queryPairs = [];
      Object.keys(params).forEach(function(key) {
        queryPairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
      });
      hash += '?' + queryPairs.join('&');
    }
    
    window.location.hash = hash;
  },

  goBack: function() {
    const prevView = JEC_EXT.state.previousView || 'extra';
    window.location.hash = '#' + prevView;
    
    // Reset modular view
    const container = document.getElementById('feat-modular');
    if (container) container.innerHTML = '';
    
    JEC_EXT.state.currentFeature = null;
    JEC_EXT.state.currentParams = {};
    
    // Re-render previous view
    if (typeof JEC !== 'undefined' && JEC.switchView) {
      JEC.switchView(prevView);
    }
  },

  // ═══════════════════════════════════════════════════
  // GET FEATURE CONFIG FROM REGISTRY
  // ═══════════════════════════════════════════════════
  getFeatureConfig: function(featureId) {
    if (typeof JEC === 'undefined' || !JEC.config || !JEC.config.FEATURES) {
      return null;
    }
    
    // Try direct match: ext_mcq
    const extKey = 'ext_' + featureId;
    if (JEC.config.FEATURES[extKey]) {
      return JEC.config.FEATURES[extKey];
    }
    
    // Try without prefix: mcq
    if (JEC.config.FEATURES[featureId]) {
      return JEC.config.FEATURES[featureId];
    }
    
    // Fallback: built-in feature list
    const fallbackFeatures = {
      'mcq':      { js: 'mcq.js',      enabled: true, inject: true, en: 'Multiple Choice',  id: 'Pilihan Ganda' },
      'flash':    { js: 'flash.js',    enabled: true, inject: true, en: 'Flashcards',       id: 'Kartu Kata' },
      'listen':   { js: 'listen.js',   enabled: true, inject: true, en: 'Listening',        id: 'Listening' },
      'scramble': { js: 'scramble.js', enabled: true, inject: true, en: 'Word Scramble',    id: 'Acak Kata' },
      'sentence': { js: 'sentence.js', enabled: true, inject: true, en: 'Sentence Builder', id: 'Pembuat Kalimat' },
      'dict':     { js: 'dict.js',     enabled: true, inject: true, en: 'Dictionary',       id: 'Kamus' },
      'mem':      { js: 'mem.js',      enabled: true, inject: true, en: 'Memorize It',      id: 'Hafalan' }
    };
    
    return fallbackFeatures[featureId] || null;
  },

  // ═══════════════════════════════════════════════════
  // UPDATE TITLE
  // ═══════════════════════════════════════════════════
  updateTitle: function(featureId, feature) {
    const titleEl = document.getElementById('modular-title');
    if (!titleEl) return;
    
    let title = featureId;
    
    // Try i18n
    if (typeof JEC !== 'undefined' && JEC.t) {
      const lang = JEC.lang || 'en';
      if (feature[lang]) {
        title = feature[lang];
      } else if (feature.en) {
        title = lang === 'id' ? (feature.id || feature.en) : feature.en;
      }
    }
    
    titleEl.textContent = title;
  },

  // ═══════════════════════════════════════════════════
  // RENDER FEATURE
  // ═══════════════════════════════════════════════════
  render: async function(featureId, params) {
    const container = document.getElementById('feat-modular');
    if (!container) {
      console.error('[JEC_EXT] Container #feat-modular not found');
      return;
    }
    
    const feature = JEC_EXT.getFeatureConfig(featureId);
    if (!feature) return;
    
    // Check if feature already loaded
    const featureFn = window.JEC_EXT_FEATURES && window.JEC_EXT_FEATURES[featureId];
    if (typeof featureFn === 'function') {
      JEC_EXT.renderWithHeader(container, featureId, feature);
      try {
        featureFn(document.getElementById('ext-feature-body'), params);
      } catch (e) {
        console.error('[JEC_EXT] Error rendering ' + featureId + ':', e);
        JEC_EXT.renderError(container, featureId, e.message);
      }
      return;
    }
    
    // Show loading state
    JEC_EXT.renderLoading(container, featureId, feature);
    
    // Load feature JS file
    try {
      await JEC_EXT.loadFeature(featureId, feature);
      
      // Retry render
      const featureFn2 = window.JEC_EXT_FEATURES && window.JEC_EXT_FEATURES[featureId];
      if (typeof featureFn2 === 'function') {
        JEC_EXT.renderWithHeader(container, featureId, feature);
        featureFn2(document.getElementById('ext-feature-body'), params);
      } else {
        JEC_EXT.renderMaintenance(featureId, feature);
      }
    } catch (e) {
      console.error('[JEC_EXT] Failed to load feature ' + featureId + ':', e);
      JEC_EXT.renderError(container, featureId, e.message);
    }
  },

  // ═══════════════════════════════════════════════════
  // LOAD FEATURE JS (DYNAMIC SCRIPT)
  // ═══════════════════════════════════════════════════
  loadFeature: function(featureId, feature) {
    return new Promise(function(resolve, reject) {
      // Check cache
      if (JEC_EXT.state.featureCache[featureId]) {
        resolve();
        return;
      }
      
      // Prevent duplicate loading
      if (JEC_EXT.state.loadingFeature === featureId) {
        // Wait for current load
        const checkInterval = setInterval(function() {
          if (JEC_EXT.state.featureCache[featureId]) {
            clearInterval(checkInterval);
            resolve();
          } else if (JEC_EXT.state.loadingFeature !== featureId) {
            clearInterval(checkInterval);
            reject(new Error('Load cancelled'));
          }
        }, 100);
        return;
      }
      
      JEC_EXT.state.loadingFeature = featureId;
      
      const baseUrl = (typeof JEC !== 'undefined' && JEC.config && JEC.config.FEATURES_JS)
        ? JEC.config.FEATURES_JS
        : 'https://cdn.jsdelivr.net/gh/caksup/jec@main/j/f/ext/';
      
      const url = baseUrl + feature.js + '?v=' + Date.now();
      
      const script = document.createElement('script');
      script.src = url;
      
      script.onload = function() {
        JEC_EXT.state.featureCache[featureId] = true;
        JEC_EXT.state.loadingFeature = null;
        console.log('[JEC_EXT] ✓ Feature loaded: ' + featureId);
        resolve();
      };
      
      script.onerror = function() {
        JEC_EXT.state.loadingFeature = null;
        console.warn('[JEC_EXT] ⚠ Feature not found: ' + feature.js);
        reject(new Error('Failed to load ' + feature.js));
      };
      
      document.head.appendChild(script);
    });
  },

  // ═══════════════════════════════════════════════════
  // RENDER STATES
  // ═══════════════════════════════════════════════════
  renderWithHeader: function(container, featureId, feature) {
    let html = '<div class="compact-hdr">';
    html += '<button class="icon-btn" onclick="JEC_EXT.goBack()">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '</button>';
    html += '<h3>' + JEC_EXT.getFeatureTitle(featureId, feature) + '</h3>';
    html += '</div>';
    html += '<div id="ext-feature-body"></div>';
    container.innerHTML = html;
  },

  renderLoading: function(container, featureId, feature) {
    let html = '<div class="compact-hdr">';
    html += '<button class="icon-btn" onclick="JEC_EXT.goBack()">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '</button>';
    html += '<h3>' + JEC_EXT.getFeatureTitle(featureId, feature) + '</h3>';
    html += '</div>';
    html += '<div class="load-state">';
    html += '<span class="material-icons-round">sync</span>';
    html += '<div>Loading feature...</div>';
    html += '</div>';
    container.innerHTML = html;
  },

  renderError: function(container, featureId, errorMsg) {
    let html = '<div class="compact-hdr">';
    html += '<button class="icon-btn" onclick="JEC_EXT.goBack()">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '</button>';
    html += '<h3>Error</h3>';
    html += '</div>';
    html += '<div class="err-state">';
    html += '<span class="material-icons-round">error_outline</span>';
    html += '<div>Failed to load feature</div>';
    html += '<code>' + JEC_EXT.esc(errorMsg || 'Unknown error') + '</code>';
    html += '<button class="btn dg" style="margin-top:.6rem" onclick="JEC_EXT.navigate(\'' + featureId + '\', JEC_EXT.state.currentParams)">';
    html += '<span class="material-icons-round">refresh</span> Retry';
    html += '</button>';
    html += '</div>';
    container.innerHTML = html;
  },

  renderNotFound: function(featureId) {
    const container = document.getElementById('feat-modular');
    if (!container) return;
    
    // Switch to modular view
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    const target = document.getElementById('view-modular');
    if (target) target.classList.add('active');
    if (typeof JEC !== 'undefined') JEC.activeView = 'modular';
    
    let html = '<div class="compact-hdr">';
    html += '<button class="icon-btn" onclick="JEC_EXT.goBack()">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '</button>';
    html += '<h3>Feature Not Found</h3>';
    html += '</div>';
    html += '<div class="err-state">';
    html += '<span class="material-icons-round">search_off</span>';
    html += '<div style="font-weight:700;margin:.5rem 0">Feature "' + JEC_EXT.esc(featureId) + '" not found</div>';
    html += '<div style="font-size:.76rem">This feature is not registered in the router.</div>';
    html += '<button class="btn gh" style="margin-top:.6rem" onclick="JEC_EXT.goBack()">';
    html += '<span class="material-icons-round">arrow_back</span> Go Back';
    html += '</button>';
    html += '</div>';
    container.innerHTML = html;
  },

  renderMaintenance: function(featureId, feature) {
    const container = document.getElementById('feat-modular');
    if (!container) return;
    
    // Switch to modular view
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    const target = document.getElementById('view-modular');
    if (target) target.classList.add('active');
    if (typeof JEC !== 'undefined') JEC.activeView = 'modular';
    
    const title = JEC_EXT.getFeatureTitle(featureId, feature);
    
    let html = '<div class="compact-hdr">';
    html += '<button class="icon-btn" onclick="JEC_EXT.goBack()">';
    html += '<span class="material-icons-round">arrow_back</span>';
    html += '</button>';
    html += '<h3>' + JEC_EXT.esc(title) + '</h3>';
    html += '</div>';
    html += '<div class="maintenance-card">';
    html += '<span class="material-icons-round maintenance-icon">engineering</span>';
    html += '<div class="maintenance-title">' + JEC_EXT.esc(title) + '</div>';
    html += '<div class="maintenance-desc">';
    html += (typeof JEC !== 'undefined' && JEC.t) 
      ? JEC.t('under_construction') 
      : 'This feature is under development.';
    html += '</div>';
    html += '<button class="btn gh" style="margin-top:1rem" onclick="JEC_EXT.goBack()">';
    html += '<span class="material-icons-round">arrow_back</span> Go Back';
    html += '</button>';
    html += '</div>';
    container.innerHTML = html;
  },

  // ═══════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════
  getFeatureTitle: function(featureId, feature) {
    if (!feature) return featureId;
    
    if (typeof JEC !== 'undefined' && JEC.lang) {
      const lang = JEC.lang;
      if (feature[lang]) return feature[lang];
      if (lang === 'id' && feature.id) return feature.id;
      if (feature.en) return feature.en;
    }
    
    return feature.en || feature.id || featureId;
  },

  esc: function(s) {
    return (s || '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // ═══════════════════════════════════════════════════
  // DEBUG
  // ═══════════════════════════════════════════════════
  debug: function() {
    console.log('══════ JEC_EXT DEBUG ══════');
    console.log('Initialized:', JEC_EXT.state.initialized);
    console.log('Current Feature:', JEC_EXT.state.currentFeature);
    console.log('Current Params:', JEC_EXT.state.currentParams);
    console.log('Previous View:', JEC_EXT.state.previousView);
    console.log('Cached Features:', Object.keys(JEC_EXT.state.featureCache));
    console.log('Registered Features:', Object.keys(window.JEC_EXT_FEATURES || {}));
    console.log('══════ END DEBUG ══════');
  }
};

// ═══════════════════════════════════════════════════
// GLOBAL FEATURE REGISTRY
// ═══════════════════════════════════════════════════
// Feature files harus register fungsi di sini:
//   window.JEC_EXT_FEATURES = window.JEC_EXT_FEATURES || {};
//   window.JEC_EXT_FEATURES.mcq = function(container, params) {
//     container.innerHTML = '...';
//   };
window.JEC_EXT_FEATURES = window.JEC_EXT_FEATURES || {};

// ═══════════════════════════════════════════════════
// INIT FUNCTION (dipanggil oleh j.js saat load)
// ═══════════════════════════════════════════════════
window.JEC_EXT_INIT = function(JEC_REF) {
  JEC_EXT.init();
};

// ═══════════════════════════════════════════════════
// AUTO-INIT saat script di-load
// ═══════════════════════════════════════════════════
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(JEC_EXT.init, 100);
  });
} else {
  setTimeout(JEC_EXT.init, 100);
}

// Export
window.JEC_EXT = JEC_EXT;
