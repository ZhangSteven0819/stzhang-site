const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

// Use faster 8B model as primary, with larger models as fallback
const MODEL_ORDER = [
  "llama-3.1-8b-instant",  // Fastest, good for translation
  "llama-3.3-70b-versatile",  // More accurate but slower
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

// Server-side translation cache (persists during worker lifetime)
const translationCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function getCacheKey(items, targetLanguage) {
  const str = JSON.stringify({ items, targetLanguage });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `${targetLanguage}_${Math.abs(hash).toString(36)}`;
}

function getCached(key) {
  const entry = translationCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCached(key, data) {
  translationCache.set(key, { data, ts: Date.now() });
}

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

async function requestTranslation(apiKey, models, systemPrompt, payload) {
  for (const model of models) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 4096,  // Limit output for faster response
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
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

    return { ok: true, translations };
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

    if (!items.length) {
      return new Response(JSON.stringify({ translations: [] }), {
        headers: jsonHeaders,
      });
    }

    // Check server-side cache first (huge speedup for repeated requests)
    const cacheKey = getCacheKey(items, targetLanguage);
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(JSON.stringify({ translations: cached, cached: true }), {
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

    // Use fast model first, fall back to slower one
    const models = [env.TRANSLATE_MODEL || MODEL_ORDER[0], ...MODEL_ORDER.slice(1), env.GROQ_MODEL].filter(Boolean);

    // Simplified prompt for faster processing
    const systemPrompt = `
You are a NATIVE ${targetLanguageName} speaker translating a personal blog.
Style: Casual, thoughtful, like a smart friend writing naturally. NOT robotic.
Page context: ${pageTitle || "ST Zhang's blog"} (${pagePath || "/"})

Rules:
- Sound like the text was ORIGINALLY written in ${targetLanguageName}
- Keep technical terms: ST Zhang, GitHub, Astro, AI, Tech, Notes, URL, API, JavaScript, TypeScript
- Use casual ${targetLanguageName} expressions, not literal translation
- For "writing": use "写东西" or "写字" in zh-CN, not "写作" (too formal)
- For "personal": use "个人的" or just omit in zh-CN
- End sentences naturally, match the original tone (casual/thoughtful)

Return JSON: {"translations":["trans1","trans2",...]}

    const result = await requestTranslation(apiKey, models, systemPrompt, {
      items,
      pageTitle,
      pagePath,
      targetLanguage,
      targetLanguageName,
    });

    if (!result.ok) {
      return new Response(JSON.stringify({ translations: items, error: result.error }), {
        headers: jsonHeaders,
      });
    }

    // Cache successful translation for 24 hours
    setCached(cacheKey, result.translations);

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
        model: "llama-3.1-8b-instant",
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
