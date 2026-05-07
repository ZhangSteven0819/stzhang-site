const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

const MODEL_FALLBACKS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
];

const TARGET_LOCALES = {
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

function getJsonFromText(text) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error("Invalid JSON response");
  }
}

function normalizeForCompare(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,:;!?()[\]{}'"`~@#$%^&*_+=/\\|-]/g, "")
    .trim();
}

function hasMeaningfulTranslation(items, translations, targetLanguage) {
  if (targetLanguage === "en") {
    return true;
  }

  if (!Array.isArray(translations) || translations.length !== items.length) {
    return false;
  }

  const blank = translations.filter((translation, index) => {
    return String(items[index] || "").trim() && !String(translation || "").trim();
  }).length;

  if (blank > 0) {
    return false;
  }

  const unchanged = translations.filter((translation, index) => {
    const source = normalizeForCompare(items[index]);
    const result = normalizeForCompare(translation);

    return source && source === result;
  }).length;

  if (unchanged / Math.max(1, items.length) >= 0.65) {
    return false;
  }

  if (targetLanguage === "zh-CN" || targetLanguage === "zh-TW") {
    const naturalLanguageItems = items.filter((item) => /[A-Za-z]{3,}/.test(item));
    const translatedCjkItems = translations.filter((translation, index) => {
      return /[A-Za-z]{3,}/.test(items[index]) && /[\u4e00-\u9fff]/.test(translation);
    });

    if (naturalLanguageItems.length && translatedCjkItems.length === 0) {
      return false;
    }
  }

  return true;
}

async function requestTranslation(apiKey, models, systemPrompt, payload) {
  let lastUnchangedTranslations = null;

  for (const model of models) {
    const requestBody = {
      model,
      temperature: 0,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    };

    if (model.startsWith("openai/gpt-oss")) {
      requestBody.reasoning_effort = "high";
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Groq API error:", model, response.status, errorText);

      if (response.status === 400 || response.status === 404 || response.status === 403) {
        continue;
      }

      return { ok: false, error: `Groq API error on ${model}: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = getJsonFromText(content);
    const translations = Array.isArray(parsed.translations) ? parsed.translations : payload.items;

    if (!hasMeaningfulTranslation(payload.items, translations, payload.targetLanguage)) {
      console.log("Translation model returned mostly unchanged text:", model);
      lastUnchangedTranslations = translations;
      continue;
    }

    return { ok: true, translations };
  }

  if (lastUnchangedTranslations) {
    return {
      ok: false,
      error: "All translation models returned mostly unchanged text",
    };
  }

  return { ok: false, error: "No available translation model succeeded" };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const targetLanguage = body.targetLanguage || "en";
    const targetLanguageName = TARGET_LOCALES[targetLanguage] || body.targetLanguageName || targetLanguage;
    const pageTitle = typeof body.pageTitle === "string" ? body.pageTitle : "";
    const pagePath = typeof body.pagePath === "string" ? body.pagePath : "";
    const contextItems = Array.isArray(body.contextItems) ? body.contextItems : items;

    if (!items.length) {
      return new Response(JSON.stringify({ translations: [] }), {
        headers: jsonHeaders,
      });
    }

    const apiKey = env.GROQ_API_KEY;

    if (!apiKey) {
      console.log("GROQ_API_KEY not found in environment");
      return new Response(JSON.stringify({ translations: items, error: "GROQ_API_KEY not configured" }), {
        headers: jsonHeaders,
      });
    }

    const models = [
      env.TRANSLATE_MODEL,
      ...MODEL_FALLBACKS,
      env.GROQ_MODEL,
    ].filter(Boolean);

    const systemPrompt = `
You are an elite native-speaking website localizer and literary editor.

You are localizing a quiet personal blog called ST Zhang.
Page path: ${pagePath || "/"}
Page title: ${pageTitle || "ST Zhang"}

Translate every item into ${targetLanguageName}.
Each item is a DOM text node from the same web page. Use the full page context from the user message.
The result must read as if originally written by a fluent native editor, never like machine translation.
Prefer idiomatic, polished website copy over literal word-by-word mapping.
Preserve meaning, tone, punctuation, and line-level structure unless a native phrasing needs a small adjustment.
Never return an empty string for a non-empty input.
If a token should remain unchanged, copy that token inside the translated sentence.
Do not summarize.
Do not add commentary.

Preserve these exact terms when appropriate:
ST Zhang, ZhangSteven0819, GitHub, Astro, Decap CMS, Cloudflare Pages, Groq, AI, Tech, Notes, JavaScript, TypeScript, HTML, CSS, API, URL.

For mixed Chinese/English or English/Chinese text:
- translate the natural-language parts,
- keep names, product names, project names, code terms, URLs, and acronyms unchanged,
- avoid over-translating technical terms.

For all languages:
- use natural menu labels, headings, card copy, and article microcopy,
- avoid literal calques,
- keep rhythm concise and readable,
- translate as a native publication editor, not as a bilingual dictionary.

For Chinese output specifically:
- write smooth, publication-quality Chinese,
- avoid stiff calques and textbook phrasing,
- prefer concise, natural wording with rhythm,
- if a phrase has a widely used polished Chinese rendering, use it.
- for personal blog copy, sound human and lightly editorial, not corporate.

Return only valid JSON:
{
  "translations": ["..."]
}

The translations array must have exactly the same length and order as the input array.
`;

    const result = await requestTranslation(apiKey, models, systemPrompt, {
      items,
      pageTitle,
      pagePath,
      targetLanguage,
      targetLanguageName,
      contextItems,
    });

    if (!result.ok) {
      return new Response(JSON.stringify({ translations: items, error: result.error }), {
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ translations: result.translations }), {
      headers: jsonHeaders,
    });
  } catch (error) {
    console.log("Translation error:", error.message);
    return new Response(
      JSON.stringify({
        translations: [],
        error: "Translation failed: " + error.message,
      }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    );
  }
}

export async function onRequestGet(context) {
  const { env } = context;
  const apiKey = env.GROQ_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ status: "error", message: "GROQ_API_KEY not configured" }), {
      headers: jsonHeaders,
    });
  }
  
  // Test the API with a simple translation
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "user", content: "Translate 'Hello World' to Chinese. Return JSON: {\"translation\": \"...\"}" }
        ],
      }),
    });
    
    if (response.ok) {
      return new Response(JSON.stringify({ status: "ok", message: "GROQ_API_KEY is working" }), {
        headers: jsonHeaders,
      });
    } else {
      const error = await response.text();
      return new Response(JSON.stringify({ status: "error", message: "GROQ API error: " + response.status, detail: error }), {
        headers: jsonHeaders,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      headers: jsonHeaders,
    });
  }
}
