(() => {
  const STORAGE_KEY = "stzhang-language";
  const DEFAULT_LANGUAGE = "en";

  const languageNames = {
    en: "English",
    "zh-CN": "Simplified Chinese",
    "zh-TW": "Traditional Chinese",
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

  function preserveWhitespace(original, translated) {
    const start = original.match(/^\s*/)?.[0] || "";
    const end = original.match(/\s*$/)?.[0] || "";

    return `${start}${translated}${end}`;
  }

  async function translateBatch(language, items) {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetLanguage: language,
        targetLanguageName: languageNames[language] || language,
        items,
      }),
    });

    if (!response.ok) {
      throw new Error("Translation request failed");
    }

    const data = await response.json();

    return Array.isArray(data.translations) ? data.translations : items;
  }

  async function translatePage(language) {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;

    const nodes = getTextNodes();
    rememberOriginalText(nodes);

    const entries = nodes.map((node) => {
      const original = originalTextMap.get(node) || "";
      const trimmed = original.trim();
      const cacheKey = `translation:${language}:${hashText(trimmed)}`;

      return {
        node,
        original,
        trimmed,
        cacheKey,
      };
    }).filter((entry) => entry.trimmed.length > 0);

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

    for (let i = 0; i < missing.length; i += 12) {
      const chunk = missing.slice(i, i + 12);
      const items = chunk.map((entry) => entry.trimmed);

      try {
        const translations = await translateBatch(language, items);

        chunk.forEach((entry, index) => {
          const translated = translations[index] || entry.trimmed;
          localStorage.setItem(entry.cacheKey, translated);
          cached.set(entry.cacheKey, translated);
        });
      } catch (error) {
        chunk.forEach((entry) => {
          cached.set(entry.cacheKey, entry.trimmed);
        });
      }
    }

    entries.forEach((entry) => {
      const translated = cached.get(entry.cacheKey) || entry.trimmed;
      entry.node.nodeValue = preserveWhitespace(entry.original, translated);
    });
  }

  async function loadDailyQuote(language) {
    const textEl = document.getElementById("daily-quote-text");
    const sourceEl = document.getElementById("daily-quote-source");
    const labelEl = document.getElementById("daily-quote-label");

    if (!textEl || !sourceEl || !labelEl) return;

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `daily-quote:${today}:${language}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const quote = JSON.parse(cached);
      labelEl.textContent = quote.label || "Daily quote";
      textEl.textContent = quote.quote;
      sourceEl.textContent = `${quote.author} · ${quote.source}`;
      return;
    }

    try {
      const response = await fetch(
        `/api/daily-quote?lang=${encodeURIComponent(language)}&name=${encodeURIComponent(languageNames[language] || language)}`
      );

      if (!response.ok) throw new Error("Quote request failed");

      const quote = await response.json();

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
    const select = document.getElementById("language-select");

    if (select) {
      select.value = language;
    }

    setSavedLanguage(language);
    await loadDailyQuote(language);
    await translatePage(language);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("language-select");
    const language = getSavedLanguage();

    if (select) {
      select.value = language;

      select.addEventListener("change", async (event) => {
        await applyLanguage(event.target.value);
      });
    }

    applyLanguage(language);
  });
})();