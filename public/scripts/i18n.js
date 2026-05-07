// ST Zhang i18n Translation Script
(function() {
  'use strict';
  
  var STORAGE_KEY = 'stzhang-language';
  var DEFAULT_LANG = 'en';
  var CACHE_VER = 'v12';
  var API = '/api/translate';
  
  // Fixed phrase overrides
  var FIXED = {
    'zh-CN': {
      'The Blog': '博客',
      'Writing': '写作', 
      'Topics': '主题',
      'All writing': '全部文章',
      'Notes and essays.': '笔记与随笔',
      'Read essay': '阅读全文',
      'View all →': '查看全部 →',
      'Back home →': '返回首页 →',
      '← Back to writing': '← 返回写作',
      'No posts yet.': '还没有文章。',
      'Writing, building, and thinking on the internet.': '在互联网上写作、构建与思考。',
      'Personal blog': '个人博客',
      'AI · Tech · Notes': 'AI · 科技 · 笔记',
      '1 min read': '1 分钟阅读',
      'Contents': '目录',
      'Daily quote': '每日名言',
      'The obstacle is the way.': '障碍是道路。'
    },
    'zh-TW': {
      'The Blog': '部落格',
      'Writing': '寫作',
      'Topics': '主題',
      'All writing': '全部文章',
      'Notes and essays.': '筆記與隨筆',
      'Read essay': '閱讀文章',
      'View all →': '查看全部 →',
      'Back home →': '返回首頁 →',
      '← Back to writing': '← 返回寫作',
      'No posts yet.': '還沒有文章。',
      'Personal blog': '個人部落格',
      'AI · Tech · Notes': 'AI · 科技 · 筆記',
      '1 min read': '1 分鐘閱讀',
      'Contents': '目錄',
      'Daily quote': '每日名言'
    }
  };

  var LANG_NAMES = {
    en: 'English', 'zh-CN': '简体中文', 'zh-TW': '繁體中文',
    ja: '日本語', ko: '한국어', es: 'Español', fr: 'Français',
    de: 'Deutsch', pt: 'Português', it: 'Italiano', ru: 'Русский',
    ar: 'العربية', hi: 'हिन्दी', bn: 'বাংলা', ur: 'اردو',
    id: 'Bahasa Indonesia', vi: 'Tiếng Việt', th: 'ไทย',
    tr: 'Türkçe', nl: 'Nederlands'
  };

  var LABEL_NAMES = {
    en: 'Language', 'zh-CN': '语言', 'zh-TW': '語言',
    ja: '言語', ko: '언어', es: 'Idioma', fr: 'Langue',
    de: 'Sprache', pt: 'Idioma', it: 'Lingua', ru: 'Язык',
    ar: 'اللغة', hi: 'भाषा', bn: 'ভাষা', ur: 'زبان',
    id: 'Bahasa', vi: 'Ngôn ngữ', th: 'ภาษา',
    tr: 'Dil', nl: 'Taal'
  };

  function hash(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(36);
  }

  function getLang() {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG; } 
    catch(e) { return DEFAULT_LANG; }
  }

  function setLang(l) {
    try { localStorage.setItem(STORAGE_KEY, l); } catch(e) {}
  }

  function ck(text, lang) { return 'i18n:' + CACHE_VER + ':' + lang + ':' + hash(text); }

  function gc(text, lang) {
    try { return localStorage.getItem(ck(text, lang)); } catch(e) { return null; }
  }

  function sc(text, lang, trans) {
    try { localStorage.setItem(ck(text, lang), trans); } catch(e) {}
  }

  function isSkip(el) {
    if (!el) return true;
    var t = el.tagName;
    if (t === 'SCRIPT' || t === 'STYLE' || t === 'SVG' || t === 'TEXTAREA' || t === 'INPUT' || t === 'SELECT') return true;
    if (el.closest && el.closest('[data-no-translate]')) return true;
    return false;
  }

  function getTextNodes() {
    var r = [];
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n) {
        if (isSkip(n.parentElement)) return NodeFilter.FILTER_REJECT;
        if (!(n.nodeValue || '').trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while (n = w.nextNode()) r.push(n);
    return r;
  }

  function getFixed(lang, text) {
    if (FIXED[lang] && FIXED[lang][text]) return FIXED[lang][text];
    return null;
  }

  function translateNode(n, lang) {
    var orig = n.nodeValue || '';
    var trim = orig.trim();
    if (!trim) return;
    
    // Check fixed phrase
    var fixed = getFixed(lang, trim);
    if (fixed) {
      n.nodeValue = orig.replace(trim, fixed);
      return;
    }
    
    // Check cache
    var cached = gc(trim, lang);
    if (cached) {
      n.nodeValue = orig.replace(trim, cached);
      return;
    }
    
    // Mark for API
    n._orig = trim;
    n._lead = (orig.match(/^\s*/) || [''])[0];
    n._trail = (orig.match(/\s*$/) || [''])[0];
  }

  async function doTranslate(nodes, lang) {
    // First pass: apply fixed phrases and cached translations
    nodes.forEach(function(n) { translateNode(n, lang); });
    
    // Collect nodes needing API translation
    var need = nodes.filter(function(n) { return n._orig && !gc(n._orig, lang) && !getFixed(lang, n._orig); });
    if (!need.length) return;
    
    var BATCH = 25;
    for (var i = 0; i < need.length; i += BATCH) {
      var batch = need.slice(i, i + BATCH);
      var texts = batch.map(function(n) { return n._orig; });
      
      try {
        var r = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLanguage: lang,
            targetLanguageName: LANG_NAMES[lang] || lang,
            pagePath: location.pathname,
            items: texts
          })
        });
        
        if (r.ok) {
          var d = await r.json();
          var trans = d.translations || texts;
          
          batch.forEach(function(n, j) {
            var t = trans[j] || n._orig;
            sc(n._orig, lang, t);
            n.nodeValue = n._lead + t + n._trail;
          });
        }
      } catch(e) {
        console.error('[i18n] Error:', e);
      }
    }
  }

  function syncUI(lang) {
    var sels = document.querySelectorAll('#language-select, #language-select-mobile');
    sels.forEach(function(s) { s.value = lang; });
    var lbl = document.getElementById('language-label');
    if (lbl) lbl.textContent = LABEL_NAMES[lang] || 'Language';
  }

  function init() {
    var lang = getLang();
    syncUI(lang);
    
    document.querySelectorAll('#language-select, #language-select-mobile').forEach(function(s) {
      s.addEventListener('change', function(e) {
        setLang(e.target.value);
        syncUI(e.target.value);
        doTranslate(getTextNodes(), e.target.value);
      });
    });
    
    doTranslate(getTextNodes(), lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
