const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

const quotes = [
  {
    quote: "The obstacle is the way.",
    author: "Marcus Aurelius",
    source: "Meditations",
  },
  {
    quote: "No man is free who is not master of himself.",
    author: "Epictetus",
    source: "Discourses",
  },
  {
    quote: "Luck is what happens when preparation meets opportunity.",
    author: "Seneca",
    source: "Letters from a Stoic",
  },
  {
    quote: "The journey of a thousand miles begins with a single step.",
    author: "Laozi",
    source: "Tao Te Ching",
  },
  {
    quote: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    source: "Twilight of the Idols",
  },
  {
    quote: "What you do every day matters more than what you do once in a while.",
    author: "Gretchen Rubin",
    source: "The Happiness Project",
  },
  {
    quote: "Act as if what you do makes a difference. It does.",
    author: "William James",
    source: "Collected Essays",
  },
  {
    quote: "The best way out is always through.",
    author: "Robert Frost",
    source: "A Servant to Servants",
  },
  {
    quote: "Do not wait to strike till the iron is hot; make it hot by striking.",
    author: "William Butler Yeats",
    source: "Attributed writings",
  },
  {
    quote: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
    source: "Attributed notebooks",
  },
];

function pickQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return quotes[day % quotes.length];
}

function extractJson(text) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error("Invalid JSON");
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") || "en";
  const languageName = url.searchParams.get("name") || lang;
  const selected = pickQuote();

  const fallback = {
    label: "Daily quote",
    quote: selected.quote,
    author: selected.author,
    source: selected.source,
  };

  if (lang === "en" || !env.GROQ_API_KEY) {
    return new Response(JSON.stringify(fallback), {
      headers: jsonHeaders,
    });
  }

  try {
    const model = env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
Translate this daily quote card into ${languageName}.
Make it sound natural and elegant to native speakers.
Keep the author's personal name unchanged.
Translate the label "Daily quote".
Translate the source title only if there is a natural widely used translation; otherwise keep it unchanged.

Return only valid JSON:
{
  "label": "...",
  "quote": "...",
  "author": "...",
  "source": "..."
}
`,
          },
          {
            role: "user",
            content: JSON.stringify(fallback),
          },
        ],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify(fallback), {
        headers: jsonHeaders,
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = extractJson(content);

    return new Response(
      JSON.stringify({
        label: parsed.label || fallback.label,
        quote: parsed.quote || fallback.quote,
        author: parsed.author || fallback.author,
        source: parsed.source || fallback.source,
      }),
      {
        headers: jsonHeaders,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify(fallback), {
      headers: jsonHeaders,
    });
  }
}