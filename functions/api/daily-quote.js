const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

const MODEL_FALLBACKS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
];

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

const curatedQuoteTranslations = {
  "zh-CN": {
    "The obstacle is the way.": {
      label: "每日名言",
      quote: "阻碍本身，就是道路。",
      author: "Marcus Aurelius",
      source: "沉思录",
    },
    "No man is free who is not master of himself.": {
      label: "每日名言",
      quote: "不能主宰自己的人，谈不上真正自由。",
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
      quote: "知道为何而活的人，几乎任何一种生活方式都能承受。",
      author: "Friedrich Nietzsche",
      source: "偶像的黄昏",
    },
    "What you do every day matters more than what you do once in a while.": {
      label: "每日名言",
      quote: "真正塑造你的，从来不是偶尔做了什么，而是你每天都在做什么。",
      author: "Gretchen Rubin",
      source: "幸福计划",
    },
    "Act as if what you do makes a difference. It does.": {
      label: "每日名言",
      quote: "就当你所做的一切真的会带来改变那样去行动，因为它确实会。",
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
      quote: "不要等铁热了才挥锤，而要在挥锤中把它打热。",
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
      quote: "不能主宰自己的人，談不上真正自由。",
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
      quote: "知道為何而活的人，幾乎任何一種生活方式都能承受。",
      author: "Friedrich Nietzsche",
      source: "偶像的黃昏",
    },
    "What you do every day matters more than what you do once in a while.": {
      label: "每日名言",
      quote: "真正塑造你的，從來不是偶爾做了什麼，而是你每天都在做什麼。",
      author: "Gretchen Rubin",
      source: "幸福計畫",
    },
    "Act as if what you do makes a difference. It does.": {
      label: "每日名言",
      quote: "就當你所做的一切真的會帶來改變那樣去行動，因為它確實會。",
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
      quote: "不要等鐵熱了才揮鎚，而要在揮鎚中把它打熱。",
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

async function requestQuoteTranslation(apiKey, models, systemPrompt, fallback) {
  for (const model of models) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: JSON.stringify(fallback),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Quote translation error:", model, response.status, errorText);

      if (response.status === 400 || response.status === 404 || response.status === 403) {
        continue;
      }

      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return extractJson(content);
  }

  return null;
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

  const curated = curatedQuoteTranslations[lang]?.[selected.quote];

  if (curated) {
    return new Response(JSON.stringify(curated), {
      headers: jsonHeaders,
    });
  }

  if (lang === "en" || !env.GROQ_API_KEY) {
    return new Response(JSON.stringify(fallback), {
      headers: jsonHeaders,
    });
  }

  try {
    const models = [
      env.DAILY_QUOTE_MODEL,
      env.TRANSLATE_MODEL,
      env.GROQ_MODEL,
      ...MODEL_FALLBACKS,
    ].filter(Boolean);

    const parsed = await requestQuoteTranslation(
      env.GROQ_API_KEY,
      models,
      `
Translate this daily quote card into ${languageName}.
Make it sound natural, elegant, and literary to native speakers.
Keep the author's personal name unchanged.
Translate the label "Daily quote".
Translate the source title only if there is a natural widely used translation; otherwise keep it unchanged.
If there is a widely cited polished translation of the quote in the target language, prefer that version over a literal rendering.
For Chinese output, avoid stiff textbook wording and prefer concise, refined phrasing.

Return only valid JSON:
{
  "label": "...",
  "quote": "...",
  "author": "...",
  "source": "..."
}
`,
      fallback,
    );

    if (!parsed) {
      return new Response(JSON.stringify(fallback), {
        headers: jsonHeaders,
      });
    }

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
