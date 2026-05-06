(() => {
  const content = document.getElementById("article-content");
  const progressBar = document.getElementById("reading-progress-bar");
  const readingTimeEl = document.getElementById("reading-time");
  const toc = document.getElementById("article-toc");
  const tocList = document.getElementById("article-toc-list");

  if (!content) return;

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function calculateReadingTime() {
    if (!readingTimeEl) return;

    const text = content.textContent || "";
    const latinWords = text.match(/\b[\w’'-]+\b/g) || [];
    const cjkChars = text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || [];

    const estimatedWords = latinWords.length + Math.ceil(cjkChars.length / 2);
    const minutes = Math.max(1, Math.ceil(estimatedWords / 220));

    readingTimeEl.textContent = `${minutes} min read`;
  }

  function setupProgress() {
    if (!progressBar) return;

    const update = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function setupToc() {
    if (!toc || !tocList) return;

    const headings = Array.from(content.querySelectorAll("h2, h3")).filter((heading) =>
      heading.textContent?.trim()
    );

    if (headings.length < 3) {
      toc.classList.remove("visible");
      return;
    }

    const usedIds = new Set();

    headings.forEach((heading) => {
      const baseId = slugify(heading.textContent || "section") || "section";
      let id = baseId;
      let index = 2;

      while (usedIds.has(id) || document.getElementById(id)) {
        id = `${baseId}-${index}`;
        index += 1;
      }

      usedIds.add(id);
      heading.id = heading.id || id;

      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent || "";
      link.className = heading.tagName.toLowerCase() === "h3" ? "depth-3" : "depth-2";
      link.dataset.target = heading.id;

      tocList.appendChild(link);
    });

    toc.classList.add("visible");

    const links = Array.from(tocList.querySelectorAll("a"));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        links.forEach((link) => {
          link.classList.toggle("active", link.dataset.target === visible.target.id);
        });
      },
      {
        rootMargin: "-15% 0px -70% 0px",
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    headings.forEach((heading) => observer.observe(heading));
  }

  calculateReadingTime();
  setupProgress();
  setupToc();
})();