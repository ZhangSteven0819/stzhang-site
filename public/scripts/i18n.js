// ST Zhang i18n Translation Script
(function() {
  'use strict';
  
  var STORAGE_KEY = 'stzhang-language';
  var DEFAULT_LANG = 'en';
  var CACHE_VER = 'v13';
  var API = '/api/translate';
  
  // Fixed phrase overrides - natural translations
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
      'No posts yet.': '暂无文章',
      'Writing, building, and thinking on the internet.': '在互联网上写作、搭建与思考',
      'Personal blog': '个人博客',
      'AI · Tech · Notes': 'AI · 科技 · 笔记',
      '1 min read': '约 1 分钟',
      'Contents': '目录',
      'Daily quote': '每日一句',
      'The obstacle is the way.': '障碍即是道路',
      'Marcus Aurelius · Meditations': '马可·奥勒留《沉思录》',
      'A running archive of writing about AI, technology, personal systems, internet culture, and small things I am trying to understand.': '收录了一些关于 AI、技术、个人系统、互联网文化的文章，以及我正在探索的小事',
      'Notes on models, tools, workflows, automation, and how AI changes the way people build and think.': '关于模型、工具、工作流、自动化的笔记，以及 AI 如何改变人们构建与思考的方式',
      'Practical writing about software, web infrastructure, domains, deployment, and the small systems behind personal projects.': '关于软件、网络基础设施、域名、部署的实践记录，以及个人项目背后的小系统',
      'Short observations, reading notes, decisions, and personal logs that do not need to become polished essays.': '简短的观察、阅读笔记、决策记录与个人日志，不一定写成完整的文章'
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
      'No posts yet.': '暫無文章',
      'Writing, building, and thinking on the internet.': '在網路上寫作、搭建與思考',
      'Personal blog': '個人部落格',
      'AI · Tech · Notes': 'AI · 科技 · 筆記',
      '1 min read': '約 1 分鐘',
      'Contents': '目錄',
      'Daily quote': '每日一句',
      'The obstacle is the way.': '障礙即是道路',
      'Marcus Aurelius · Meditations': '馬可·奧勒留《沉思錄》',
      'A running archive of writing about AI, technology, personal systems, internet culture, and small things I am trying to understand.': '收錄了一些關於 AI、技術、個人系統、網路文化的文章，以及我正在探索的小事',
      'Notes on models, tools, workflows, automation, and how AI changes the way people build and think.': '關於模型、工具、工作流、自動化的筆記，以及 AI 如何改變人們建構與思考的方式',
      'Practical writing about software, web infrastructure, domains, deployment, and the small systems behind personal projects.': '關於軟體、網路基礎設施、網域、部署的實踐記錄，以及個人專案背後的小系統',
      'Short observations, reading notes, decisions, and personal logs that do not need to become polished essays.': '簡短的觀察、閱讀筆記、決策記錄與個人日誌，不一定寫成完整的文章'
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
    // Skip these tags entirely
    if (t === 'SCRIPT' || t === 'STYLE' || t === 'SVG' || t === 'TEXTAREA' || t === 'INPUT' || t === 'SELECT') return true;
    // Skip elements marked with data-no-translate
    if (el.closest && el.closest('[data-no-translate]')) return true;
    return false;
  }

  function getTextNodes() {
    var r = [];
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n) {
        if (isSkip(n.parentElement)) return NodeFilter.FILTER_REJECT;
        var txt = (n.nodeValue || '').trim();
        if (!txt) return NodeFilter.FILTER_REJECT;
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

  function applyNode(n, orig, trans) {
    // Preserve whitespace: replace trimmed text while keeping leading/trailing whitespace
    var lead = (orig.match(/^\s*/) || [''])[0];
    var trail = (orig.match(/\s*$/) || [''])[0];
    n.nodeValue = lead + trans + trail;
  }

  function doTranslate() {
    var lang = getLang();
    if (lang === DEFAULT_LANG) {
      // Restore all original text
      var nodes = getTextNodes();
      nodes.forEach(function(n) {
        var txt = (n.nodeValue || '').trim();
        var cached = gc(txt, DEFAULT_LANG);
        if (cached) {
          applyNode(n, n.nodeValue, cached);
        }
      });
      return;
    }

    var nodes = getTextNodes();
    var needApi = [];

    // First pass: apply fixed phrases and cached translations
    nodes.forEach(function(n) {
      var orig = n.nodeValue || '';
      var trim = orig.trim();
      if (!trim) return;
      
      // Check fixed phrase override first
      var fixed = getFixed(lang, trim);
      if (fixed) {
        applyNode(n, orig, fixed);
        return;
      }
      
      // Check cache
      var cached = gc(trim, lang);
      if (cached) {
        applyNode(n, orig, cached);
        return;
      }
      
      // Mark for API translation
      needApi.push({ node: n, orig: orig, trim: trim });
    });

    // Second pass: translate uncached items via API
    if (needApi.length === 0) return;

    var BATCH = 30;
    
    (function translateBatch(startIdx) {
      if (startIdx >= needApi.length) return;

      var endIdx = Math.min(startIdx + BATCH, needApi.length);
      var batch = needApi.slice(startIdx, endIdx);
      var texts = batch.map(function(item) { return item.trim; });

      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: lang,
          targetLanguageName: LANG_NAMES[lang] || lang,
          pagePath: location.pathname,
          items: texts
        })
      }).then(function(r) {
        if (!r.ok) return translateBatch(endIdx);
        return r.json();
      }).then(function(d) {
        if (!d) return translateBatch(endIdx);
        var trans = d.translations || texts;
        
        batch.forEach(function(item, i) {
          var translated = trans[i] || item.trim;
          sc(item.trim, lang, translated);
          applyNode(item.node, item.orig, translated);
        });
        
        // Continue with next batch
        translateBatch(endIdx);
      }).catch(function(e) {
        console.error('[i18n] Error:', e);
        translateBatch(endIdx);
      });
    })(0);
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
    
    // Listen for language select changes
    document.querySelectorAll('#language-select, #language-select-mobile').forEach(function(s) {
      s.addEventListener('change', function(e) {
        setLang(e.target.value);
        syncUI(e.target.value);
        doTranslate();
      });
    });
    
    // Initial translation
    doTranslate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
