// ST Zhang i18n Translation Script
(function() {
  'use strict';
  
  const STORAGE_KEY = 'stzhang-language';
  const DEFAULT_LANGUAGE = 'en';
  const TRANSLATION_VERSION = 'v9';
  const API_ENDPOINT = '/api/translate';
  
  const phraseOverrides = {
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
      'Writing, building, and thinking on the internet.': '在網路上寫作、構建與思考。',
      'A running archive of writing about AI, technology, personal systems, internet culture, and small things I am trying to understand.': '這裡收著一些關於 AI、技術、個人系統、網路文化，以及那些我正在慢慢理解的小事的文字。',
      'Notes on models, tools, workflows, automation, and how AI changes the way people build and think.': '關於模型、工具、工作流、自動化，以及 AI 如何改變人們構建與思考方式的筆記。',
      'Practical writing about software, web infrastructure, domains, deployment, and the small systems behind personal projects.': '關於軟體、網路基礎設施、網域、部署，以及個人專案背後那些小系統的實作記錄。',
      'Short observations, reading notes, decisions, and personal logs that do not need to become polished essays.': '一些短觀察、閱讀筆記、決策記錄和個人日誌，不必都寫成完整文章。',
    },
  };

  const languageNames = {
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

  const languageLabelTranslations = {
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

  const originalTexts = new Map();
  
  function hashText(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
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
    const nodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          // Skip certain elements
          const skipTags = ['SCRIPT', 'STYLE', 'SVG', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE'];
          if (skipTags.includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (parent.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT;
          
          const text = node.nodeValue || '';
          if (!text.trim()) return NodeFilter.FILTER_REJECT;
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      nodes.push(node);
    }
    return nodes;
  }

  function rememberOriginals(nodes) {
    nodes.forEach(function(node) {
      const key = hashText(node.nodeValue || '');
      if (!originalTexts.has(key)) {
        originalTexts.set(key, node.nodeValue || '');
      }
    });
  }

  function restoreOriginals() {
    const nodes = getTextNodes();
    nodes.forEach(function(node) {
      const key = hashText(node.nodeValue || '');
      const original = originalTexts.get(key);
      if (original) {
        node.nodeValue = original;
      }
    });
  }

  function applyTranslation(node, translated, original) {
    // Preserve whitespace
    const leading = original.match(/^\s*/)[0];
    const trailing = original.match(/\s*$/)[0];
    node.nodeValue = leading + translated + trailing;
  }

  async function translateAPI(language, items) {
    try {
      const response = await fetch(API_ENDPOINT, {
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
      
      const data = await response.json();
      return Array.isArray(data.translations) ? data.translations : items;
    } catch(e) {
      console.error('[i18n] Translation API error:', e);
      return items;
    }
  }

  function applyOverrides(language, source, translated) {
    const overrides = phraseOverrides[language];
    if (overrides && overrides[source.trim()]) {
      return overrides[source.trim()];
    }
    return translated;
  }

  async function translatePage(language) {
    // Skip English
    if (language === DEFAULT_LANGUAGE) {
      restoreOriginals();
      return;
    }

    const nodes = getTextNodes();
    if (nodes.length === 0) return;
    
    rememberOriginals(nodes);

    // Group by cache key
    const entries = [];
    const cache = new Map();
    
    nodes.forEach(function(node) {
      const original = node.nodeValue || '';
      const trimmed = original.trim();
      if (!trimmed) return;
      
      const cacheKey = 'i18n:' + TRANSLATION_VERSION + ':' + language + ':' + hashText(trimmed);
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        cache.set(cacheKey, { node: node, original: original, translated: cached });
      } else {
        entries.push({ node: node, original: original, trimmed: trimmed, cacheKey: cacheKey });
      }
    });

    // Apply cached translations immediately
    cache.forEach(function(item) {
      applyTranslation(item.node, applyOverrides(language, item.trimmed || item.original.trim(), item.translated), item.original);
    });

    // Translate missing items in batches
    if (entries.length > 0) {
      const BATCH_SIZE = 25;
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        const items = batch.map(function(e) { return e.trimmed; });
        
        const translations = await translateAPI(language, items);
        
        batch.forEach(function(entry, idx) {
          let translated = translations[idx] || entry.trimmed;
          translated = applyOverrides(language, entry.trimmed, translated);
          
          // Save to cache
          try {
            localStorage.setItem(entry.cacheKey, translated);
          } catch(e) {}
          
          // Apply
          applyTranslation(entry.node, translated, entry.original);
        });
      }
    }
  }

  function syncSelects(language) {
    document.querySelectorAll('#language-select, #language-select-mobile').forEach(function(select) {
      select.value = language;
    });
  }

  function syncLabel(language) {
    const label = document.getElementById('language-label');
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
    const language = getSavedLanguage();
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
