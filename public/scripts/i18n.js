(() => {
  const STORAGE_KEY = "stzhang-language";
  const DEFAULT_LANGUAGE = "en";
  const TRANSLATION_CACHE_VERSION = "v11";
  const CACHE_MIGRATION_KEY = "stzhang-translation-cache-version";
  const MAX_CONTEXT_CHARS = 2200;
  const MAX_CHUNK_CHARS = 3200;
  const MAX_CONTEXT_ITEM_CHARS = 180;

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

  const translationTargetNames = {
    en: "English",
    "zh-CN": "Simplified Chinese for mainland China",
    "zh-TW": "Traditional Chinese for Taiwan and Hong Kong readers",
    ja: "Japanese",
    ko: "Korean",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    it: "Italian",
    ru: "Russian",
    ar: "Arabic",
    hi: "Hindi",
    bn: "Bengali",
    ur: "Urdu",
    id: "Indonesian",
    vi: "Vietnamese",
    th: "Thai",
    tr: "Turkish",
    nl: "Dutch",
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

  const phraseOverrides = {
    "zh-CN": {
      "The Blog": "博客",
      Writing: "写作",
      Topics: "主题",
      "All writing": "全部文章",
      "Notes and essays.": "笔记与随笔。",
      "Read essay": "阅读全文",
      "View all →": "查看全部 →",
      "Back home →": "返回首页 →",
      "← Back to writing": "← 返回写作",
      "No posts yet.": "还没有文章。",
      Contents: "目录",
      "Daily quote": "每日名言",
      "Personal blog": "个人博客",
      "Writing, building, and thinking on the internet.": "在互联网上写作、搭建与思考。",
      "Notes on models, tools, workflows, automation, and how AI changes the way people build and think.":
        "关于模型、工具、工作流、自动化，以及 AI 如何改变人们构建与思考方式的笔记。",
      "Practical writing about software, web infrastructure, domains, deployment, and the small systems behind personal projects.":
        "关于软件、网络基础设施、域名、部署，以及个人项目背后那些小系统的实践记录。",
      "Short observations, reading notes, decisions, and personal logs that do not need to become polished essays.":
        "短观察、阅读笔记、决策记录和个人日志，不必每一篇都写成完整文章。",
    },
    "zh-TW": {
      "The Blog": "部落格",
      Writing: "寫作",
      Topics: "主題",
      "All writing": "全部文章",
      "Notes and essays.": "筆記與隨筆。",
      "Read essay": "閱讀全文",
      "View all →": "查看全部 →",
      "Back home →": "返回首頁 →",
      "← Back to writing": "← 返回寫作",
      "No posts yet.": "還沒有文章。",
      Contents: "目錄",
      "Daily quote": "每日名言",
      "Personal blog": "個人部落格",
      "Writing, building, and thinking on the internet.": "在網路上寫作、搭建與思考。",
      "Notes on models, tools, workflows, automation, and how AI changes the way people build and think.":
        "關於模型、工具、工作流、自動化，以及 AI 如何改變人們建構與思考方式的筆記。",
      "Practical writing about software, web infrastructure, domains, deployment, and the small systems behind personal projects.":
        "關於軟體、網路基礎設施、網域、部署，以及個人專案背後那些小系統的實作記錄。",
      "Short observations, reading notes, decisions, and personal logs that do not need to become polished essays.":
        "短觀察、閱讀筆記、決策記錄和個人日誌，不必每一篇都寫成完整文章。",
    },
  };

  const curatedQuotes = {
    "zh-CN": {
      "The obstacle is the way.": {
        label: "每日名言",
        quote: "阻碍本身，就是道路。",
        author: "Marcus Aurelius",
        source: "沉思录",
      },
      "No man is free who is not master of himself.": {
        label: "每日名言",
        quote: "不能掌控自己的人，谈不上真正自由。",
        author: "Epictetus",
        source: "论说集",
      },
      "Luck is what happens when preparation meets opportunity.": {
        label: "每日名言",
        quote: "所谓运气，不过是准备恰好遇见了机会。",
        author: "Seneca",
        source: "道德书简",
      },
      "The journey of a thousand miles begins with a single step.": {
        label: "每日名言",
        quote: "千里之行，始于足下。",
        author: "Laozi",
        source: "道德经",
      },
      "He who has a why to live can bear almost any how.": {
        label: "每日名言",
        quote: "知道为何而活的人，几乎能承受任何一种活法。",
        author: "Friedrich Nietzsche",
        source: "偶像的黄昏",
      },
      "What you do every day matters more than what you do once in a while.": {
        label: "每日名言",
        quote: "真正塑造你的，从来不是偶尔做了什么，而是每天都在做什么。",
        author: "Gretchen Rubin",
        source: "幸福计划",
      },
      "Act as if what you do makes a difference. It does.": {
        label: "每日名言",
        quote: "就当你的行动真的会改变什么那样去做。它确实会。",
        author: "William James",
        source: "文集",
      },
      "The best way out is always through.": {
        label: "每日名言",
        quote: "最好的出路，往往就是穿过去。",
        author: "Robert Frost",
        source: "致仆人们",
      },
      "Do not wait to strike till the iron is hot; make it hot by striking.": {
        label: "每日名言",
        quote: "不要等铁热了才锤，而要在锤打中把它打热。",
        author: "William Butler Yeats",
        source: "佚名引述",
      },
      "Simplicity is the ultimate sophistication.": {
        label: "每日名言",
        quote: "简洁，是复杂抵达极致后的优雅。",
        author: "Leonardo da Vinci",
        source: "手稿摘引",
      },
    },
    "zh-TW": {
      "The obstacle is the way.": {
        label: "每日名言",
        quote: "阻礙本身，就是道路。",
        author: "Marcus Aurelius",
        source: "沉思錄",
      },
      "No man is free who is not master of himself.": {
        label: "每日名言",
        quote: "不能掌控自己的人，談不上真正自由。",
        author: "Epictetus",
        source: "論說集",
      },
      "Luck is what happens when preparation meets opportunity.": {
        label: "每日名言",
        quote: "所謂運氣，不過是準備恰好遇見了機會。",
        author: "Seneca",
        source: "道德書簡",
      },
      "The journey of a thousand miles begins with a single step.": {
        label: "每日名言",
        quote: "千里之行，始於足下。",
        author: "Laozi",
        source: "道德經",
      },
      "He who has a why to live can bear almost any how.": {
        label: "每日名言",
        quote: "知道為何而活的人，幾乎能承受任何一種活法。",
        author: "Friedrich Nietzsche",
        source: "偶像的黃昏",
      },
      "What you do every day matters more than what you do once in a while.": {
        label: "每日名言",
        quote: "真正塑造你的，從來不是偶爾做了什麼，而是每天都在做什麼。",
        author: "Gretchen Rubin",
        source: "幸福計畫",
      },
      "Act as if what you do makes a difference. It does.": {
        label: "每日名言",
        quote: "就當你的行動真的會改變什麼那樣去做。它確實會。",
        author: "William James",
        source: "文集",
      },
      "The best way out is always through.": {
        label: "每日名言",
        quote: "最好的出路，往往就是穿過去。",
        author: "Robert Frost",
        source: "致僕人們",
      },
      "Do not wait to strike till the iron is hot; make it hot by striking.": {
        label: "每日名言",
        quote: "不要等鐵熱了才敲，而要在敲打中把它打熱。",
        author: "William Butler Yeats",
        source: "佚名引述",
      },
      "Simplicity is the ultimate sophistication.": {
        label: "每日名言",
        quote: "簡潔，是複雜抵達極致後的優雅。",
        author: "Leonardo da Vinci",
        source: "手稿摘引",
      },
    },
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

    if (
      parent.closest(
        "script, style, svg, code, pre, textarea, input, select, [data-no-translate]"
      )
    ) {
      return true;
    }

    const text = node.nodeValue || "";

    if (!text.trim()) return true;
    if (/^[\s\d.,:;!?()[\]{}'"`~@#$%^&*_+=/\\|-]+$/.test(text)) return true;

    return false;
  }

  function getTextNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldSkipNode(node)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });

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
    getTextNodes().forEach((node) => {
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

  function polishTranslation(language, source, translated) {
    const trimmed = source.trim();
    const override = phraseOverrides[language]?.[trimmed];

    if (override) return override;

    if (language === "zh-CN" && /^(\d+)\s+min read$/i.test(trimmed)) {
      return `${trimmed.match(/^(\d+)/)?.[1] || "1"} 分钟阅读`;
    }

    if (language === "zh-TW" && /^(\d+)\s+min read$/i.test(trimmed)) {
      return `${trimmed.match(/^(\d+)/)?.[1] || "1"} 分鐘閱讀`;
    }

    return translated;
  }

  function normalizeForCompare(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[.,:;!?()[\]{}'"`~@#$%^&*_+=/\\|-]/g, "")
      .trim();
  }

  function shouldRetryTranslation(language, source, translated) {
    if (language === DEFAULT_LANGUAGE) {
      return false;
    }

    const sourceText = String(source || "").trim();
    const translatedText = String(translated || "").trim();

    if (!sourceText) {
      return false;
    }

    if (!translatedText) {
      return true;
    }

    const sourceNormalized = normalizeForCompare(sourceText);
    const translatedNormalized = normalizeForCompare(translatedText);

    if (sourceNormalized && sourceNormalized === translatedNormalized) {
      return true;
    }

    if (
      (language === "zh-CN" || language === "zh-TW") &&
      /[A-Za-z]{3,}/.test(sourceText) &&
      !/[\u4e00-\u9fff]/.test(translatedText)
    ) {
      return true;
    }

    return false;
  }

  function buildContextItems(entries) {
    const context = [];
    const seen = new Set();
    let totalChars = 0;
    const orderedEntries = [...entries].sort((left, right) => {
      return left.trimmed.length - right.trimmed.length;
    });

    for (const entry of orderedEntries) {
      const text = entry.trimmed;

      if (!text || seen.has(text)) {
        continue;
      }

      const remaining = MAX_CONTEXT_CHARS - totalChars;

      if (remaining <= 0) break;

      const capped =
        text.length > MAX_CONTEXT_ITEM_CHARS
          ? `${text.slice(0, MAX_CONTEXT_ITEM_CHARS - 1)}…`
          : text;
      const snippet = capped.length > remaining ? capped.slice(0, remaining) : capped;

      if (!snippet.trim()) {
        continue;
      }

      context.push(snippet);
      totalChars += snippet.length;
      seen.add(text);
    }

    return context;
  }

  function buildFocusedContextItems(entry) {
    const context = [];
    const seen = new Set();

    function add(value) {
      const text = String(value || "").trim();

      if (!text || seen.has(text) || text === entry.trimmed) {
        return;
      }

      const snippet =
        text.length > MAX_CONTEXT_ITEM_CHARS
          ? `${text.slice(0, MAX_CONTEXT_ITEM_CHARS - 1)}…`
          : text;

      context.push(snippet);
      seen.add(text);
    }

    add(document.querySelector(".article-header h1")?.textContent);
    add(document.querySelector(".article-description")?.textContent);

    document
      .querySelectorAll(".article-content h2, .article-content h3")
      .forEach((heading) => {
        if (context.length < 8) {
          add(heading.textContent);
        }
      });

    add(document.title.replace(/\s*[·||-]\s*ST Zhang\s*$/i, "").trim());

    return context;
  }

  function chunkEntries(entries) {
    const chunks = [];
    let current = [];
    let currentChars = 0;

    entries.forEach((entry) => {
      const nextChars = entry.trimmed.length;

      if (current.length && currentChars + nextChars > MAX_CHUNK_CHARS) {
        chunks.push(current);
        current = [];
        currentChars = 0;
      }

      current.push(entry);
      currentChars += nextChars;
    });

    if (current.length) {
      chunks.push(current);
    }

    return chunks;
  }

  async function translateBatch(language, items, contextItems) {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetLanguage: language,
        targetLanguageName: translationTargetNames[language] || language,
        pageTitle: document.title || "",
        pagePath: window.location.pathname || "/",
        contextItems,
        items,
      }),
    });

    if (!response.ok) {
      throw new Error("Translation request failed");
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const translations = Array.isArray(data.translations) ? data.translations : [];

    if (translations.length !== items.length) {
      throw new Error("Translation count mismatch");
    }

    return translations.map((translation, index) =>
      polishTranslation(language, items[index] || "", translation || items[index] || "")
    );
  }

  async function translateEntries(language, chunk, contextItems, cached) {
    const items = chunk.map((entry) => entry.trimmed);

    try {
      const effectiveContextItems =
        chunk.length === 1 ? buildFocusedContextItems(chunk[0]) : contextItems;
      const translations = await translateBatch(language, items, effectiveContextItems);
      const unresolved = [];

      chunk.forEach((entry, index) => {
        const translated = polishTranslation(
          language,
          entry.trimmed,
          translations[index] || entry.trimmed
        );

        if (shouldRetryTranslation(language, entry.trimmed, translated)) {
          unresolved.push(entry);
          return;
        }

        localStorage.setItem(entry.cacheKey, translated);
        cached.set(entry.cacheKey, translated);
      });

      if (unresolved.length) {
        if (unresolved.length === chunk.length && chunk.length <= 1) {
          return;
        }

        if (unresolved.length === 1) {
          await translateEntries(language, unresolved, contextItems, cached);
          return;
        }

        const midpoint = Math.ceil(unresolved.length / 2);
        await translateEntries(language, unresolved.slice(0, midpoint), contextItems, cached);
        await translateEntries(language, unresolved.slice(midpoint), contextItems, cached);
      }
    } catch (error) {
      if (chunk.length <= 1) {
        return;
      }

      const midpoint = Math.ceil(chunk.length / 2);
      await translateEntries(language, chunk.slice(0, midpoint), contextItems, cached);
      await translateEntries(language, chunk.slice(midpoint), contextItems, cached);
    }
  }

  async function translatePage(language) {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;

    const nodes = getTextNodes();
    rememberOriginalText(nodes);

    if (language === DEFAULT_LANGUAGE) {
      restoreOriginalText();
      return;
    }

    const pagePathHash = hashText(window.location.pathname || "/");
    const entries = nodes
      .map((node) => {
        const original = originalTextMap.get(node) || "";
        const trimmed = original.trim();
        const cacheKey = `translation:${TRANSLATION_CACHE_VERSION}:${language}:${pagePathHash}:${hashText(trimmed)}`;

        return {
          node,
          original,
          trimmed,
          cacheKey,
        };
      })
      .filter((entry) => entry.trimmed.length > 0);

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

    const contextItems = buildContextItems(entries);

    for (const chunk of chunkEntries(missing)) {
      await translateEntries(language, chunk, contextItems, cached);
    }

    entries.forEach((entry) => {
      const translated =
        cached.get(entry.cacheKey) ||
        polishTranslation(language, entry.trimmed, entry.trimmed);
      entry.node.nodeValue = preserveWhitespace(entry.original, translated);
    });
  }

  function getLanguageSelects() {
    return Array.from(
      document.querySelectorAll(
        "#language-select, #language-select-mobile, [data-language-select]"
      )
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
    const translatedLabel =
      languageLabelTranslations[language] || languageLabelTranslations.en;

    if (label) {
      label.textContent = translatedLabel;
    }

    if (select) {
      select.setAttribute("aria-label", translatedLabel);
    }
  }

  function formatQuoteSource(quote) {
    return `${quote.author} · ${quote.source}`;
  }

  function polishQuote(language, quote) {
    const byLanguage = curatedQuotes[language];

    if (!byLanguage) {
      return quote;
    }

    const curated = byLanguage[quote.quote];

    if (curated) {
      return curated;
    }

    if (
      quote.quote === "障碍是道路。" ||
      quote.quote === "障碍即道路。" ||
      quote.quote === "The obstacle is the way."
    ) {
      return byLanguage["The obstacle is the way."] || quote;
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
        sourceEl.textContent = formatQuoteSource(quote);
        return;
      } catch (error) {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const response = await fetch(
        `/api/daily-quote?lang=${encodeURIComponent(language)}&name=${encodeURIComponent(translationTargetNames[language] || language)}`
      );

      if (!response.ok) throw new Error("Quote request failed");

      const quote = polishQuote(language, await response.json());

      localStorage.setItem(cacheKey, JSON.stringify(quote));

      labelEl.textContent = quote.label || "Daily quote";
      textEl.textContent = quote.quote;
      sourceEl.textContent = formatQuoteSource(quote);
    } catch (error) {
      const fallback = polishQuote(language, {
        label: "Daily quote",
        quote: "The obstacle is the way.",
        author: "Marcus Aurelius",
        source: "Meditations",
      });

      labelEl.textContent = fallback.label || "Daily quote";
      textEl.textContent = fallback.quote;
      sourceEl.textContent = formatQuoteSource(fallback);
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
    clearOldTranslationCache();

    const language = getSavedLanguage();
    const selects = getLanguageSelects();

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
