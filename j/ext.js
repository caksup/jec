// JEC v.9.00 CLEAN MODULAR | 16/08/2026 | j/ext.js | Feature Router
// Router untuk inject fitur modular via hash routing
// Format URL: #ext/:featureId/:param1/:param2
// Contoh:
//   #ext/mcq                    → Multiple Choice Quiz
//   #ext/mcq/vocab/u1/p1        → MCQ dengan params
//   #ext/flash                  → Flashcards
//   #ext/scramble               → Word Scramble
//   #ext/listen                 → Listening Quiz
//   #ext/sentence               → Sentence Builder
//   #ext/dict                   → Dictionary
//   #ext/mem                    → Memorize It
//   #ext/sp                     → Speak Live
//   #ext/games                  → Minigames Hub
//   #ext/game/:type             → Specific game (drag, tf, scramble, dll)

'use strict';

window.JEC_EXT = {
  state: {
    initialized: false,
    currentFeature: null,
    currentParams: {},
    featureCache: {}
  },

  // ═══════════════════════════════════════════════════
  // FEATURE REGISTRY
  // ═══════════════════════════════════════════════════
  // Daftar fitur yang bisa di-inject via router
  // Fitur harus punya file di j/f/ext/:featureId.js
  // dan expose fungsi JEC_EXT_FEATURES[featureId]
  features: {
    // ── Practice Features ──
    'mcq': {
      js: 'mcq.js',
      titleKey: 'mcq',
      fallbackTitle: { en: 'Multiple Choice Quiz', id: 'Pilihan Ganda' },
      icon: 'quiz',
      category: 'practice'
    },
    'flash': {
      js: 'flash.js',
      titleKey: 'flashcards',
      fallbackTitle: { en: 'Flashcards', id: 'Kartu Kata' },
      icon: 'style',
      category: 'practice'
    },
    'scramble': {
      js: 'scramble.js',
      titleKey: 'scramble',
      fallbackTitle: { en: 'Word Scramble', id: 'Acak Kata' },
      icon: 'shuffle',
      category: 'practice'
    },
    'listen': {
      js: 'listen.js',
      titleKey: 'listening_quiz',
      fallbackTitle: { en: 'Listening Quiz', id: 'Kuis Listening' },
      icon: 'headphones',
      category: 'practice'
    },
    'sentence': {
      js: 'sentence.js',
      titleKey: 'sentence_builder',
      fallbackTitle: { en: 'Sentence Builder', id: 'Pembuat Kalimat' },
      icon: 'construction',
      category: 'practice'
    },
    'dict': {
      js: 'dict.js',
      titleKey: 'dictionary',
      fallbackTitle: { en: 'Dictionary', id: 'Kamus' },
      icon: 'menu_book',
      category: 'practice'
    },

    // ── Extra Features ──
    'mem': {
      js: 'mem.js',
      titleKey: 'memorize_it',
      fallbackTitle: { en: 'Memorize It', id: 'Hafalan' },
      icon: 'psychology',
      category: 'extra'
    },
    'sp': {
      js: 'sp.js',
      titleKey: 'speak_live',
      fallbackTitle: { en: 'Speak Live', id: 'Bicara Langsung' },
      icon: 'mic',
      category: 'extra'
    },
    'games': {
      js: 'games.js',
      titleKey: 'mini_games',
      fallbackTitle: { en: 'Mini Games', id: 'Permainan Mini' },
      icon: 'sports_esports',
      category: 'extra'
    },
    'game': {
      js: 'game.js',
      titleKey: 'game',
      fallbackTitle: { en: 'Game', id: 'Permainan' },
      icon: 'sports_esports',
      category: 'extra'
    },

    // ── Learning Features ──
    'grammar-unit': {
      js: 'grammar-unit.js',
      titleKey: 'grammar_unit',
      fallbackTitle: { en: 'Grammar Unit', id: 'Unit Grammar' },
      icon: 'edit_note',
      category: 'learn'
    },

    // ── Test/Assessment ──
    'placement': {
      js: 'placement.js',
      titleKey: 'placement_test',
      fallbackTitle: { en: 'Placement Test', id: 'Tes Penempatan' },
      icon: 'school',
      category: 'test'
    }
  },

  // ═══════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════
  init: function() {
    if (JEC_EXT.state.initialized) return;

    // Listen hash change
    window.addEventListener('hashchange', JEC_EXT.handleHash);

    JEC_EXT.state.initialized = true;
    console.log('[JEC_EXT] Initialized with ' + Object.keys(JEC_EXT.features).length + ' features');

    // Check current hash on init
    JEC_EXT.handleHash();
  },

  // ═══════════════════════════════════════════════════
  // HASH ROUTER
  // ═══════════════════════════════════════════════════
  handleHash: function() {
    const hash = window.location.hash.substring(1); // remove #
    if (!hash) return;

    // Check if this is ext route
    if (!hash.startsWith('ext/')) return;

    const parts = hash.split('/');
    // parts[0] = 'ext'
    // parts[1] = featureId
    // parts[2..] = params

    const featureId = parts[1];
    if (!featureId) return;

    const params = {};
    for (let i = 2; i < parts.length; i++) {
      // Support key=value format atau positional
      if (parts[i].indexOf('=') >= 0) {
        const kv = parts[i].split('=');
        params[kv[0]] = decodeURIComponent(kv[1] || '');
      } else {
        // Positional: param0, param1, param2...
        params['p' + (i - 2)] = decodeURIComponent(parts[i]);
      }
    }

    JEC_EXT.navigate(featureId, params);
  },

  // ═══════════════════════════════════════════════════
  // NAVIGATE TO FEATURE
  // ═══════════════════════════════════════════════════
  navigate: function(featureId, params) {
    params = params || {};

    // Check if feature exists in registry
    const feature = JEC_EXT.features[featureId];
    if (!feature) {
      console.warn('[JEC_EXT] Unknown feature: ' + featureId);
      JEC_EXT.renderNotFound(featureId);
      return;
    }

    // Check if feature is enabled in config
    const configFeature = JEC.config.FEATURES && JEC.config.FEATURES[featureId];
    if (configFeature && configFeature.enabled === false) {
      JEC_EXT.renderMaintenance(featureId, feature);
      return;
    }

    // Update state
    JEC_EXT.state.currentFeature = featureId;
    JEC_EXT.state.currentParams = params;

    // Switch to modular view
    if (typeof JEC !== 'undefined' && JEC.switchView) {
      JEC.switchView('modular');
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
  // UPDATE TITLE
  // ═══════════════════════════════════════════════════
  updateTitle: function(featureId, feature) {
    const titleEl = document.getElementById('modular-title');
    if (!titleEl) return;

    const lang = (typeof JEC !== 'undefined' && JEC.lang) || 'en';
    let title = '';

    // Try i18n first
    if (typeof JEC !== 'undefined' && JEC.t) {
      const i18nTitle = JEC.t(feature.titleKey);
      if (i18nTitle && i18nTitle !== feature.titleKey) {
        title = i18nTitle;
      }
    }

    // Fallback
    if (!title) {
      title = feature.fallbackTitle[lang] || feature.fallbackTitle.en || featureId;
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

    const feature = JEC_EXT.features[featureId];
    if (!feature) return;

    // Show loading state
    container.innerHTML = 
      '<div class="compact-hdr">' +
      '<button class="ib" onclick="JEC_EXT.goBack()">' +
      '<span class="material-icons-round">arrow_back</span>' +
      '</button>' +
      '<h3 style="flex:1;font-size:.88rem">' + JEC.esc(JEC_EXT.getFeatureTitle(featureId, feature)) + '</h3>' +
      '</div>' +
      '<div class="load-state">' +
      '<span class="material-icons-round">sync</span>' +
      '<div>Loading feature...</div>' +
      '</div>';

    // Check if feature already loaded
    const featureFn = window.JEC_EXT_FEATURES && window.JEC_EXT_FEATURES[featureId];
    if (typeof featureFn === 'function') {
      try {
        featureFn(container, params);
        return;
      } catch (e) {
        console.error('[JEC_EXT] Error rendering ' + featureId + ':', e);
        JEC_EXT.renderError(featureId, e.message);
        return;
      }
    }

    // Load feature JS file
    try {
      await JEC_EXT.loadFeature(featureId, feature);

      // Retry render
      const featureFn2 = window.JEC_EXT_FEATURES && window.JEC_EXT_FEATURES[featureId];
      if (typeof featureFn2 === 'function') {
        featureFn2(container, params);
      } else {
        // Feature loaded but no render function
        JEC_EXT.renderMaintenance(featureId, feature);
      }
    } catch (e) {
      console.error('[JEC_EXT] Failed to load feature ' + featureId + ':', e);
      JEC_EXT.renderError(featureId, e.message);
    }
  },

  // ═══════════════════════════════════════════════════
  // LOAD FEATURE JS
  // ═══════════════════════════════════════════════════
  loadFeature: function(featureId, feature) {
    return new Promise(function(resolve, reject) {
      // Check cache
      if (JEC_EXT.state.featureCache[featureId]) {
        resolve();
        return;
      }

      const baseUrl = (JEC.config && JEC.config.EXT_JS) || 
                      (JEC.config && JEC.config.BASE_GH ? JEC.config.BASE_GH + 'j/f/ext/' : 'j/f/ext/');
      const url = baseUrl + feature.js + '?v=' + Date.now();

      const script = document.createElement('script');
      script.src = url;

      script.onload = function() {
        JEC_EXT.state.featureCache[featureId] = true;
        console.log('[JEC_EXT] ✓ Feature loaded: ' + featureId);
        resolve();
      };

      script.onerror = function() {
        const err = new Error('Failed to load ' + feature.js);
        console.warn('[JEC_EXT] ⚠ Feature not found: ' + feature.js);
        reject(err);
      };

      document.head.appendChild(script);
    });
  },

  // ═══════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════
  getFeatureTitle: function(featureId, feature) {
    const lang = (typeof JEC !== 'undefined' && JEC.lang) || 'en';

    // Try i18n
    if (typeof JEC !== 'undefined' && JEC.t) {
      const i18nTitle = JEC.t(feature.titleKey);
      if (i18nTitle && i18nTitle !== feature.titleKey) {
        return i18nTitle;
      }
    }

    // Fallback
    return feature.fallbackTitle[lang] || feature.fallbackTitle.en || featureId;
  },

  // ═══════════════════════════════════════════════════
  // RENDER ERROR STATES
  // ═══════════════════════════════════════════════════
  renderNotFound: function(featureId) {
    const container = document.getElementById('feat-modular');
    if (!container) return;

    if (typeof JEC !== 'undefined' && JEC.switchView) {
      JEC.switchView('modular');
    }

    container.innerHTML = 
      '<div class="compact-hdr">' +
      '<button class="ib" onclick="JEC_EXT.goBack()">' +
      '<span class="material-icons-round">arrow_back</span>' +
      '</button>' +
      '<h3 style="flex:1;font-size:.88rem">Feature Not Found</h3>' +
      '</div>' +
      '<div class="err-state">' +
      '<span class="material-icons-round">error_outline</span>' +
      '<div style="font-weight:700;margin:.5rem 0">Feature "' + JEC.esc(featureId) + '" not found</div>' +
      '<div style="font-size:.76rem;margin-top:.3rem">This feature is not registered in ext.js</div>' +
      '<button class="btn gh" style="margin-top:.8rem;max-width:200px" onclick="JEC_EXT.goBack()">' +
      '<span class="material-icons-round" style="font-size:14px">arrow_back</span> Go Back' +
      '</button>' +
      '</div>';
  },

  renderError: function(featureId, errorMsg) {
    const container = document.getElementById('feat-modular');
    if (!container) return;

    container.innerHTML = 
      '<div class="compact-hdr">' +
      '<button class="ib" onclick="JEC_EXT.goBack()">' +
      '<span class="material-icons-round">arrow_back</span>' +
      '</button>' +
      '<h3 style="flex:1;font-size:.88rem">Error</h3>' +
      '</div>' +
      '<div class="err-state">' +
      '<span class="material-icons-round">error_outline</span>' +
      '<div style="font-weight:700;margin:.5rem 0">Failed to load feature</div>' +
      '<code>' + JEC.esc(errorMsg || 'Unknown error') + '</code>' +
      '<button class="btn gh" style="margin-top:.8rem;max-width:200px" onclick="JEC_EXT.goBack()">' +
      '<span class="material-icons-round" style="font-size:14px">arrow_back</span> Go Back' +
      '</button>' +
      '</div>';
  },

  renderMaintenance: function(featureId, feature) {
    const container = document.getElementById('feat-modular');
    if (!container) return;

    const lang = (typeof JEC !== 'undefined' && JEC.lang) || 'en';
    const title = JEC_EXT.getFeatureTitle(featureId, feature);

    const maintenanceMsg = (JEC.config && JEC.config.I18N && JEC.config.I18N.under_construction)
      ? JEC.config.I18N.under_construction[lang] || 'This feature is under development'
      : 'This feature is under development';

    container.innerHTML = 
      '<div class="compact-hdr">' +
      '<button class="ib" onclick="JEC_EXT.goBack()">' +
      '<span class="material-icons-round">arrow_back</span>' +
      '</button>' +
      '<h3 style="flex:1;font-size:.88rem">' + JEC.esc(title) + '</h3>' +
      '</div>' +
      '<div class="maintenance-card">' +
      '<span class="material-icons-round maintenance-icon">engineering</span>' +
      '<div class="maintenance-title">' + JEC.esc(title) + '</div>' +
      '<div class="maintenance-desc">' + JEC.esc(maintenanceMsg) + '</div>' +
      '<button class="btn gh" style="margin-top:1rem;max-width:200px" onclick="JEC_EXT.goBack()">' +
      '<span class="material-icons-round" style="font-size:14px">arrow_back</span> Go Back' +
      '</button>' +
      '</div>';
  },

  // ═══════════════════════════════════════════════════
  // NAVIGATION HELPERS
  // ═══════════════════════════════════════════════════
  goBack: function() {
    // Navigate back to previous view
    const currentFeature = JEC_EXT.state.currentFeature;
    const feature = JEC_EXT.features[currentFeature];

    if (feature && feature.category === 'practice') {
      window.location.hash = 'practice';
      if (typeof JEC !== 'undefined' && JEC.switchView) {
        JEC.switchView('practice');
      }
    } else if (feature && feature.category === 'extra') {
      window.location.hash = 'extra';
      if (typeof JEC !== 'undefined' && JEC.switchView) {
        JEC.switchView('extra');
      }
    } else if (feature && feature.category === 'learn') {
      window.location.hash = 'learn';
      if (typeof JEC !== 'undefined' && JEC.switchView) {
        JEC.switchView('learn');
      }
    } else {
      // Default: back to learn
      window.location.hash = 'learn';
      if (typeof JEC !== 'undefined' && JEC.switchView) {
        JEC.switchView('learn');
      }
    }
  },

  goTo: function(featureId, params) {
    // Programmatic navigation
    let hash = 'ext/' + featureId;
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(function(key) {
        hash += '/' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      });
    }
    window.location.hash = hash;
  },

  // ═══════════════════════════════════════════════════
  // FEATURE LIST (untuk debug / showcase)
  // ═══════════════════════════════════════════════════
  listFeatures: function() {
    const result = [];
    Object.keys(JEC_EXT.features).forEach(function(id) {
      const f = JEC_EXT.features[id];
      result.push({
        id: id,
        title: f.fallbackTitle.en,
        category: f.category,
        icon: f.icon,
        js: f.js,
        loaded: !!JEC_EXT.state.featureCache[id]
      });
    });
    return result;
  },

  // ═══════════════════════════════════════════════════
  // DEBUG
  // ═══════════════════════════════════════════════════
  debug: function() {
    console.log('══════ JEC_EXT DEBUG ══════');
    console.log('Initialized:', JEC_EXT.state.initialized);
    console.log('Current Feature:', JEC_EXT.state.currentFeature);
    console.log('Current Params:', JEC_EXT.state.currentParams);
    console.log('Cached Features:', Object.keys(JEC_EXT.state.featureCache));
    console.log('Available Features:');
    JEC_EXT.listFeatures().forEach(function(f) {
      console.log('  ' + f.id + ' (' + f.category + ') → ' + f.title + (f.loaded ? ' ✓' : ''));
    });
    console.log('══════ END DEBUG ══════');
  }
};

// ═══════════════════════════════════════════════════
// GLOBAL FEATURE REGISTRY
// ═══════════════════════════════════════════════════
// Feature files harus register fungsi di sini
// Example:
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
// REFRESH FUNCTION
// ═══════════════════════════════════════════════════
window.JEC_EXT_REFRESH = function(JEC_REF) {
  // Re-render current feature saat language/theme change
  if (JEC_EXT.state.currentFeature) {
    JEC_EXT.navigate(JEC_EXT.state.currentFeature, JEC_EXT.state.currentParams);
  }
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
