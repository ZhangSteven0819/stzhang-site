type Frontmatter = {
  title?: string;
  description?: string;
  publishDate?: string | Date;
  tags?: string[] | string;
  draft?: boolean;
};

type MarkdownPage = {
  frontmatter?: Frontmatter;
  url?: string;
};

export type Post = {
  title: string;
  description: string;
  publishDate: string;
  tags: string[];
  url: string;
};

const modules = import.meta.glob<MarkdownPage>("../pages/*.md", {
  eager: true,
});

function normalizeDate(value: string | Date | undefined) {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function normalizeTags(value: string[] | string | undefined) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function fallbackTitleFromPath(path: string) {
  const fileName = path.split("/").pop()?.replace(/\.md$/, "") || "Untitled";

  return fileName
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getPosts(): Post[] {
  return Object.entries(modules)
    .map(([path, page]) => {
      const frontmatter = page.frontmatter || {};
      const publishDate = normalizeDate(frontmatter.publishDate);

      return {
        title: frontmatter.title || fallbackTitleFromPath(path),
        description:
          frontmatter.description ||
          "A short note on AI, technology, products, or building on the internet.",
        publishDate,
        tags: normalizeTags(frontmatter.tags),
        url: page.url || `/${path.split("/").pop()?.replace(/\.md$/, "")}`,
        draft: frontmatter.draft === true,
      };
    })
    .filter((post) => !post.draft)
    .sort((a, b) => {
      const aTime = a.publishDate ? new Date(a.publishDate).getTime() : 0;
      const bTime = b.publishDate ? new Date(b.publishDate).getTime() : 0;

      return bTime - aTime;
    })
    .map(({ draft, ...post }) => post);
}

export function formatMonthYear(value: string) {
  if (!value) return "Undated";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatFullDate(value: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}