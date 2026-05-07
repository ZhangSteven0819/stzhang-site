const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
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

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const targetLanguage = body.targetLanguage || "en";
    const targetLanguageName = body.targetLanguageName || targetLanguage;

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

    const model = env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const systemPrompt = `
You are a professional literary website translator.

Translate every item into ${targetLanguageName}.
The result must sound natural to native speakers, not machine-translated.
Preserve meaning, tone, punctuation, and line-level structure.
Do not summarize.
Do not add commentary.

Preserve these exact terms when appropriate:
ST Zhang, ZhangSteven0819, GitHub, Astro, Decap CMS, Cloudflare Pages, Groq, AI, Tech, Notes, JavaScript, TypeScript, HTML, CSS, API, URL.

For mixed Chinese/English or English/Chinese text:
- translate the natural-language parts,
- keep names, product names, project names, code terms, URLs, and acronyms unchanged,
- avoid over-translating technical terms.

Return only valid JSON:
{
  "translations": ["..."]
}

The translations array must have exactly the same length and order as the input array.
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: JSON.stringify({ items }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Groq API error:", response.status, errorText);
      return new Response(JSON.stringify({ translations: items, error: `Groq API error: ${response.status}` }), {
        headers: jsonHeaders,
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = getJsonFromText(content);
    const translations = Array.isArray(parsed.translations)
      ? parsed.translations
      : items;

    return new Response(JSON.stringify({ translations }), {
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
        model: "llama-3.3-70b-versatile",
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