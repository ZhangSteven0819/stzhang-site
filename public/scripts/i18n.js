// ST Zhang i18n Translation Script
(function() {
  'use strict';
  
  var STORAGE_KEY = 'stzhang-language';
  var DEFAULT_LANGUAGE = 'en';
  var TRANSLATION_VERSION = 'v10';
  var API_ENDPOINT = '/api/translate';
  
  var phraseOverrides = {
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
      'A running archive of writing about AI, technology, personal systems, internet culture, and small things I am trying to understand.': '这里收着一些关于 AI、技术、个人系统、互联网文化，以及那些我正在慢慢理解的小事的文字。',
      'Notes on models, tools, workflows, automation, and how AI changes the way people build and think.': '关于模型、工具、工作流、自动化，以及 AI 如何改变人们构建与思考方式的笔记。',
      'Practical writing about software, web infrastructure, domains, deployment, and the small systems behind personal projects.': '关于软件、网络基础设施、域名、部署，以及个人项目背后那些小系统的实践记录。',
      'Short observations, reading notes, decisions, and personal logs that do not need to become polished essays.': '一些短观察、阅读笔记、决策记录和个人日志，不必都写成完整文章。',
      'Personal blog': '个人博客',
      'AI · Tech · Notes': 'AI · 科技 · 笔记',
      'Translate page': '翻译页面',
      'Translating...': '翻译中...',
      'Translation complete': '翻译完成',
      '1 min read': '1 分钟阅读',
      'Contents': '目录',
      'Daily quote': '每日名言',
      'The obstacle is the way.': '障碍是道路。',
      'Marcus Aurelius · Meditations': '马可·奥勒留 · 沉思录',
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
      'Translate page': '翻譯頁面',
      'Translating...': '翻譯中...',
      'Translation complete': '翻譯完成',
      '1 min read': '1 分鐘閱讀',
      'Contents': '目錄',
      'Daily quote': '每日名言',
    },
  };

  var languageNames = {
    en: 'English',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    ja: '日本語',
    ko: '한국어',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
    it: 'Italiano',
    ru: 'Русский',
    ar: 'العربية',
    hi: 'हिन्दी',
    bn: 'বাংলা',
    ur: 'اردو',
    id: 'Bahasa Indonesia',
    vi: 'Tiếng Việt',
    th: 'ไทย',
    tr: 'Türkçe',
    nl: 'Nederlands',
  };

  var languageLabelTranslations = {
    en: 'Language',
    'zh-CN': '语言',
    'zh-TW': '語言',
    ja: '言語',
    ko: '언어',
    es: 'Idioma',
    fr: 'Langue',
    de: 'Sprache',
    pt: 'Idioma',
    it: 'Lingua',
    ru: 'Язык',
    ar: 'اللغة',
    hi: 'भाषा',
    bn: 'ভাষা',
    ur: 'زبان',
    id: 'Bahasa',
    vi: 'Ngôn ngữ',
    th: 'ภาษา',
    tr: 'Dil',
    nl: 'Taal',
  };

  var originalTexts = {};
  
  function hashText(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
  }

  function getSavedLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
    } catch(e) {
      return DEFAULT_LANGUAGE;
    }
  }

  function setSavedLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch(e) {}
  }

  function getTextNodes() {
    var nodes = [];
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          var parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          // Skip certain elements
          var skipTags = ['SCRIPT', 'STYLE', 'SVG', 'TEXTAREA', 'INPUT', 'SELECT'];
          if (skipTags.indexOf(parent.tagName) !== -1) return NodeFilter.FILTER_REJECT;
          if (parent.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT;
          
          var text = node.nodeValue || '';
          if (!text.trim()) return NodeFilter.FILTER_REJECT;
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    var node;
    while (node = walker.nextNode()) {
      nodes.push(node);
    }
    return nodes;
  }

  function getAllTextContent() {
    var nodes = getTextNodes();
    var result = [];
    
    nodes.forEach(function(node) {
      var text = (node.nodeValue || '').trim();
      if (text && text.length > 0) {
        // Create unique key based on text content
        var key = 'orig_' + hashText(text);
        if (!originalTexts[key]) {
          originalTexts[key] = text;
        }
        result.push({
          node: node,
          original: node.nodeValue,
          trimmed: text,
          key: key
        });
      }
    });
    
    return result;
  }

  function applyTranslation(node, translated, original) {
    // Preserve whitespace
    var leading = (original.match(/^\s*/) || [''])[0];
    var trailing = (original.match(/\s*$/) || [''])[0];
    node.nodeValue = leading + translated + trailing;
  }

  async function translateAPI(language, items) {
    try {
      var response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: language,
          targetLanguageName: languageNames[language] || language,
          pageTitle: document.title || '',
          pagePath: window.location.pathname || '/',
          contextItems: items,
          items: items
        })
      });
      
      if (!response.ok) throw new Error('API error: ' + response.status);
      
      var data = await response.json();
      return Array.isArray(data.translations) ? data.translations : items;
    } catch(e) {
      console.error('[i18n] Translation API error:', e);
      return items;
    }
  }

  function applyOverrides(language, source, translated) {
    var overrides = phraseOverrides[language];
    if (overrides && overrides[source.trim()]) {
      return overrides[source.trim()];
    }
    return translated;
  }

  async function translatePage(language) {
    // Skip English - restore originals
    if (language === DEFAULT_LANGUAGE) {
      var entries = getAllTextContent();
      entries.forEach(function(entry) {
        applyTranslation(entry.node, entry.trimmed, entry.original);
      });
      return;
    }

    var entries = getAllTextContent();
    if (entries.length === 0) return;

    // Get cached translations
    var toTranslate = [];
    var cached = {};
    
    entries.forEach(function(entry) {
      var cacheKey = 'i18n:' + TRANSLATION_VERSION + ':' + language + ':' + hashText(entry.trimmed);
      var cachedVal = localStorage.getItem(cacheKey);
      
      if (cachedVal) {
        cached[entry.key] = {
          node: entry.node,
          original: entry.original,
          translated: cachedVal
        };
      } else {
        toTranslate.push(entry);
      }
    });

    // Apply cached translations
    Object.keys(cached).forEach(function(key) {
      var item = cached[key];
      var translated = applyOverrides(language, item.translated, item.translated);
      applyTranslation(item.node, translated, item.original);
    });

    // Translate new items
    if (toTranslate.length > 0) {
      var BATCH_SIZE = 30;
      var progressEl = null;
      
      // Show progress
      if (toTranslate.length > 5) {
        progressEl = document.createElement('div');
        progressEl.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#141615;border:1px solid #2b302e;border-radius:8px;padding:12px 16px;color:#aaa6a1;font-family:system-ui,sans-serif;font-size:13px;z-index:9999;';
        progressEl.textContent = 'Translating... (0/' + toTranslate.length + ')';
        document.body.appendChild(progressEl);
      }
      
      for (var i = 0; i < toTranslate.length; i += BATCH_SIZE) {
        var batch = toTranslate.slice(i, i + BATCH_SIZE);
        var items = batch.map(function(e) { return e.trimmed; });
        
        if (progressEl) {
          progressEl.textContent = 'Translating... (' + Math.min(i + BATCH_SIZE, toTranslate.length) + '/' + toTranslate.length + ')';
        }
        
        var translations = await translateAPI(language, items);
        
        batch.forEach(function(entry, idx) {
          var translated = translations[idx] || entry.trimmed;
          translated = applyOverrides(language, entry.trimmed, translated);
          
          // Save to cache
          try {
            var cacheKey = 'i18n:' + TRANSLATION_VERSION + ':' + language + ':' + hashText(entry.trimmed);
            localStorage.setItem(cacheKey, translated);
          } catch(e) {}
          
          // Apply
          applyTranslation(entry.node, translated, entry.original);
        });
      }
      
      if (progressEl) {
        progressEl.textContent = 'Translation complete';
        setTimeout(function() {
          progressEl.style.opacity = '0';
          setTimeout(function() { progressEl.remove(); }, 200);
        }, 1500);
      }
    }
  }

  function syncSelects(language) {
    document.querySelectorAll('#language-select, #language-select-mobile').forEach(function(select) {
      select.value = language;
    });
  }

  function syncLabel(language) {
    var label = document.getElementById('language-label');
    if (label) {
      label.textContent = languageLabelTranslations[language] || 'Language';
    }
  }

  async function applyLanguage(language) {
    setSavedLanguage(language);
    syncSelects(language);
    syncLabel(language);
    await translatePage(language);
  }

  // Initialize
  function init() {
    var language = getSavedLanguage();
    syncSelects(language);
    syncLabel(language);
    
    // Listen for language changes
    document.querySelectorAll('#language-select, #language-select-mobile').forEach(function(select) {
      select.addEventListener('change', function(e) {
        applyLanguage(e.target.value);
      });
    });
    
    // Apply translation
    applyLanguage(language);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
