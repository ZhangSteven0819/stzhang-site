(() => {
  console.log('[i18n] Script loaded, version v8');
  const STORAGE_KEY = "stzhang-language";
  const DEFAULT_LANGUAGE = "en";
  const TRANSLATION_CACHE_VERSION = "v8";
  const CACHE_MIGRATION_KEY = "stzhang-translation-cache-version";

  // Translation state
  let isTranslating = false;
  let translationProgress = null;

  const phraseOverrides = {
    "zh-CN": {
      "The Blog": "博客",
      "Writing": "写作",
      "Topics": "主题",
      "All writing": "全部文章",
      "Notes and essays.": "笔记与随笔",
      "Read essay": "阅读全文",
      "View all →": "查看全部 →",
      "Back home →": "返回首页 →",
      "← Back to writing": "← 返回写作",
      "No posts yet.": "还没有文章。",
      "Writing, building, and thinking on the internet.": "在互联网上写作、构建与思考。",
      "A running archive of writing about AI, technology, personal systems, internet culture, and small things I am trying to understand.": "这里收着一些关于 AI、技术、个人系统、互联网文化，以及那些我正在慢慢理解的小事的文字。",
      "Notes on models, tools, workflows, automation, and how AI changes the way people build and think.": "关于模型、工具、工作流、自动化，以及 AI 如何改变人们构建与思考方式的笔记。",
      "Practical writing about software, web infrastructure, domains, deployment, and the small systems behind personal projects.": "关于软件、网络基础设施、域名、部署，以及个人项目背后那些小系统的实践记录。",
      "Short observations, reading notes, decisions, and personal logs that do not need to become polished essays.": "一些短观察、阅读笔记、决策记录和个人日志，不必都写成完整文章。",
    },
    "zh-TW": {
      "The Blog": "部落格",
      "Writing": "寫作",
      "Topics": "主題",
      "All writing": "全部文章",
      "Notes and essays.": "筆記與隨筆",
      "Read essay": "閱讀文章",
      "View all →": "查看全部 →",
      "Back home →": "返回首頁 →",
      "← Back to writing": "← 返回寫作",
      "No posts yet.": "還沒有文章。",
      "Writing, building, and thinking on the internet.": "在網路上寫作、構建與思考。",
      "A running archive of writing about AI, technology, personal systems, internet culture, and small things I am trying to understand.": "這裡收著一些關於 AI、技術、個人系統、網路文化，以及那些我正在慢慢理解的小事的文字。",
      "Notes on models, tools, workflows, automation, and how AI changes the way people build and think.": "關於模型、工具、工作流、自動化，以及 AI 如何改變人們構建與思考方式的筆記。",
      "Practical writing about software, web infrastructure, domains, deployment, and the small systems behind personal projects.": "關於軟體、網路基礎設施、網域、部署，以及個人專案背後那些小系統的實作記錄。",
      "Short observations, reading notes, decisions, and personal logs that do not need to become polished essays.": "一些短觀察、閱讀筆記、決策記錄和個人日誌，不必都寫成完整文章。",
    },
  };

  const languageNames = {
    en: "English",
    "zh-CN": "简体中文",
    "zh-TW": "繁體中文",
    ja: "日本語",
    ko: "한국어",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    pt: "Português",
    it: "Italiano",
    ru: "Русский",
    ar: "العربية",
    hi: "हिन्दी",
    bn: "বাংলা",
    ur: "اردو",
    id: "Bahasa Indonesia",
    vi: "Tiếng Việt",
    th: "ไทย",
    tr: "Türkçe",
    nl: "Nederlands",
  };

  const languageLabelTranslations = {
    en: "Language",
    "zh-CN": "语言",
    "zh-TW": "語言",
    ja: "言語",
    ko: "언어",
    es: "Idioma",
    fr: "Langue",
    de: "Sprache",
    pt: "Idioma",
    it: "Lingua",
    ru: "Язык",
    ar: "اللغة",
    hi: "भाषा",
    bn: "ভাষা",
    ur: "زبان",
    id: "Bahasa",
    vi: "Ngôn ngữ",
    th: "ภาษา",
    tr: "Dil",
    nl: "Taal",
  };

  const originalTextMap = new WeakMap();

  function hashText(value) {
    let hash = 5381;

    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 33) ^ value.charCodeAt(i);
    }

    return (hash >>> 0).toString(36);
  }

  function getSavedLanguage() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  }

  function setSavedLanguage(language) {
    localStorage.setItem(STORAGE_KEY, language);
  }

  function clearOldTranslationCache() {
    if (localStorage.getItem(CACHE_MIGRATION_KEY) === TRANSLATION_CACHE_VERSION) {
      return;
    }

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("translation:") || key.startsWith("daily-quote:")) {
        localStorage.removeItem(key);
      }
    });

    localStorage.setItem(CACHE_MIGRATION_KEY, TRANSLATION_CACHE_VERSION);
  }

  function shouldSkipNode(node) {
    const parent = node.parentElement;

    if (!parent) return true;

    // Skip these elements entirely
    if (
      parent.closest(
        "script, style, svg, textarea, input, select, [data-no-translate]"
      )
    ) {
      return true;
    }

    const text = node.nodeValue || "";

    // Skip empty text
    if (!text.trim()) return true;
    
    // Skip pure punctuation/symbols (but NOT code blocks - handled separately)
    // Note: [] and {} must be escaped inside character class
    if (/^[\s\d.,:;!?()\[\]\{\}'\"`~@#$%^&*_+=\/\\|-]+$/.test(text)) return true;

    return false;
  }

  function getTextNodes() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          return shouldSkipNode(node)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const nodes = [];
    let current = walker.nextNode();

    while (current) {
      nodes.push(current);
      current = walker.nextNode();
    }

    return nodes;
  }

  function rememberOriginalText(nodes) {
    nodes.forEach((node) => {
      if (!originalTextMap.has(node)) {
        originalTextMap.set(node, node.nodeValue || "");
      }
    });
  }

  function restoreOriginalText() {
    const nodes = getTextNodes();

    nodes.forEach((node) => {
      const original = originalTextMap.get(node);

      if (typeof original === "string") {
        node.nodeValue = original;
      }
    });
  }

  function preserveWhitespace(original, translated) {
    const start = original.match(/^\s*/)?.[0] || "";
    const end = original.match(/\s*$/)?.[0] || "";

    return `${start}${translated}${end}`;
  }

  function showTranslationProgress(text) {
    if (!translationProgress) {
      translationProgress = document.createElement('div');
      translationProgress.id = 'translation-progress';
      translationProgress.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--color-bg-secondary, #141615);
        border: 1px solid var(--color-border, #2b302e);
        border-radius: 8px;
        padding: 12px 16px;
        color: var(--color-text-secondary, #aaa6a1);
        font-family: system-ui, sans-serif;
        font-size: 13px;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.2s ease;
      `;
      document.body.appendChild(translationProgress);
    }
    translationProgress.textContent = text;
    translationProgress.style.opacity = '1';
  }

  function hideTranslationProgress() {
    if (translationProgress) {
      translationProgress.style.opacity = '0';
      setTimeout(() => translationProgress.remove(), 200);
      translationProgress = null;
    }
  }

  function polishTranslation(language, source, translated) {
    return phraseOverrides[language]?.[source.trim()] || translated;
  }

  async function translateBatch(language, items, contextItems) {
    console.log('[i18n] translateBatch called with', items.length, 'items');
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetLanguage: language,
          targetLanguageName: languageNames[language] || language,
          pageTitle: document.title || "",
          pagePath: window.location.pathname || "/",
          contextItems,
          items,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const translations = Array.isArray(data.translations) ? data.translations : items;

      return translations.map((translation, index) => (
        polishTranslation(language, items[index] || "", translation)
      ));
    } catch (error) {
      console.error("Translation batch failed:", error);
      // Return original items on failure
      return items;
    }
  }

  async function translatePage(language) {
    console.log('[i18n] translatePage called for', language);
    if (isTranslating) return;
    isTranslating = true;

    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;

    const nodes = getTextNodes();
    rememberOriginalText(nodes);

    if (language === DEFAULT_LANGUAGE) {
      restoreOriginalText();
      isTranslating = false;
      return;
    }

    const pagePathHash = hashText(window.location.pathname || "/");
    const entries = nodes.map((node) => {
      const original = originalTextMap.get(node) || "";
      const trimmed = original.trim();
      const cacheKey = `translation:${TRANSLATION_CACHE_VERSION}:${language}:${pagePathHash}:${hashText(trimmed)}`;

      return {
        node,
        original,
        trimmed,
        cacheKey,
      };
    }).filter((entry) => entry.trimmed.length > 0);

    if (entries.length === 0) {
      isTranslating = false;
      return;
    }

    const missing = [];
    const cached = new Map();

    entries.forEach((entry) => {
      const value = localStorage.getItem(entry.cacheKey);

      if (value) {
        cached.set(entry.cacheKey, value);
      } else {
        missing.push(entry);
      }
    });

    // Show progress for articles
    if (missing.length > 10) {
      showTranslationProgress(`Translating... (0/${missing.length})`);
    }

    const contextItems = entries.map((entry) => entry.trimmed);

    // Process in smaller batches for more reliable translation
    const BATCH_SIZE = 30;
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const chunk = missing.slice(i, i + BATCH_SIZE);
      const items = chunk.map((entry) => entry.trimmed);

      // Update progress
      if (missing.length > 10) {
        showTranslationProgress(`Translating... (${Math.min(i + BATCH_SIZE, missing.length)}/${missing.length})`);
      }

      let translations = null;
      let retries = 0;
      const MAX_RETRIES = 2;

      // Retry logic for failed batches
      while (retries <= MAX_RETRIES && !translations) {
        try {
          translations = await translateBatch(language, items, contextItems);
        } catch (error) {
          retries++;
          if (retries > MAX_RETRIES) {
            console.error("Translation batch failed after retries:", error);
            translations = items; // Fall back to original
          } else {
            // Wait before retry
            await new Promise(r => setTimeout(r, 500 * retries));
          }
        }
      }

      chunk.forEach((entry, index) => {
        const translated = translations && translations[index] 
          ? polishTranslation(language, entry.trimmed, translations[index])
          : entry.trimmed;
        localStorage.setItem(entry.cacheKey, translated);
        cached.set(entry.cacheKey, translated);
      });
    }

    // Apply translations to all entries
    entries.forEach((entry) => {
      const translated = cached.get(entry.cacheKey) || entry.trimmed;
      entry.node.nodeValue = preserveWhitespace(entry.original, translated);
    });

    hideTranslationProgress();
    isTranslating = false;
  }

  function getLanguageSelects() {
    return Array.from(
      document.querySelectorAll("#language-select, #language-select-mobile, [data-language-select]")
    );
  }

  function syncLanguageSelects(language) {
    getLanguageSelects().forEach((select) => {
      select.value = language;
    });
  }

  function syncLanguageLabel(language) {
    const label = document.getElementById("language-label");
    const select = document.getElementById("language-select");
    const translatedLabel = languageLabelTranslations[language] || languageLabelTranslations.en;

    if (label) {
      label.textContent = translatedLabel;
    }

    if (select) {
      select.setAttribute("aria-label", translatedLabel);
    }
  }

  function polishQuote(language, quote) {
    if (language === "zh-CN" && quote.quote === "障碍是道路。") {
      return {
        ...quote,
        label: "每日名言",
        quote: "阻碍本身，就是道路。",
        source: "沉思录",
      };
    }

    return quote;
  }

  async function loadDailyQuote(language) {
    const textEl = document.getElementById("daily-quote-text");
    const sourceEl = document.getElementById("daily-quote-source");
    const labelEl = document.getElementById("daily-quote-label");

    if (!textEl || !sourceEl || !labelEl) return;

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `daily-quote:${TRANSLATION_CACHE_VERSION}:${today}:${language}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const quote = polishQuote(language, JSON.parse(cached));
        labelEl.textContent = quote.label || "Daily quote";
        textEl.textContent = quote.quote;
        sourceEl.textContent = `${quote.author} · ${quote.source}`;
        return;
      } catch (error) {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const response = await fetch(
        `/api/daily-quote?lang=${encodeURIComponent(language)}&name=${encodeURIComponent(languageNames[language] || language)}`
      );

      if (!response.ok) throw new Error("Quote request failed");

      const quote = polishQuote(language, await response.json());

      localStorage.setItem(cacheKey, JSON.stringify(quote));

      labelEl.textContent = quote.label || "Daily quote";
      textEl.textContent = quote.quote;
      sourceEl.textContent = `${quote.author} · ${quote.source}`;
    } catch (error) {
      labelEl.textContent = "Daily quote";
      textEl.textContent = "The obstacle is the way.";
      sourceEl.textContent = "Marcus Aurelius · Meditations";
    }
  }

  async function applyLanguage(language) {
    syncLanguageSelects(language);
    syncLanguageLabel(language);

    setSavedLanguage(language);
    await loadDailyQuote(language);
    await translatePage(language);
  }

  document.addEventListener("DOMContentLoaded", () => {
    console.log('[i18n] DOMContentLoaded fired');
    clearOldTranslationCache();

    const language = getSavedLanguage();
    console.log('[i18n] Saved language:', language);
    const selects = getLanguageSelects();
    console.log('[i18n] Found selects:', selects.length);

    syncLanguageSelects(language);
    syncLanguageLabel(language);

    selects.forEach((select) => {
      select.addEventListener("change", async (event) => {
        await applyLanguage(event.target.value);
      });
    });

    applyLanguage(language);
  });
})();
