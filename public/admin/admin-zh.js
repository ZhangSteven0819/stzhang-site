(() => {
  const translations = new Map([
    ["Login with GitHub", "使用 GitHub 登录"],
    ["Go back to site", "返回网站"],
    ["Content", "内容"],
    ["Workflow", "工作流"],
    ["Media", "媒体库"],
    ["Quick add", "快速新建"],
    ["Search", "搜索"],
    ["New Page", "新建文章"],
    ["New Pages", "新建文章"],
    ["Pages", "文章"],
    ["Page", "文章"],
    ["Publish", "发布"],
    ["Save", "保存"],
    ["Delete", "删除"],
    ["Cancel", "取消"],
    ["Back", "返回"],
    ["Edit", "编辑"],
    ["Preview", "预览"],
    ["Upload", "上传"],
    ["Choose an image", "选择图片"],
    ["Choose image", "选择图片"],
    ["Remove", "移除"],
    ["Insert", "插入"],
    ["Close", "关闭"],
    ["Draft", "草稿"],
    ["In review", "审核中"],
    ["Ready", "待发布"],
    ["Published", "已发布"],
    ["Unpublished", "未发布"],
    ["Updated", "已更新"],
    ["Created", "已创建"],
    ["Loading...", "加载中..."],
  ]);

  const selector = [
    "a",
    "button",
    "label",
    "span",
    "p",
    "h1",
    "h2",
    "h3",
    "[role='button']",
    "[aria-label]",
  ].join(",");

  function translateText(value) {
    const normalized = value.replace(/\s+/g, " ").trim();
    return translations.get(normalized);
  }

  function translateElement(element) {
    const translated = translateText(element.textContent || "");

    if (translated && element.childNodes.length === 1) {
      element.textContent = translated;
    }

    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) {
      const translatedLabel = translateText(ariaLabel);
      if (translatedLabel) {
        element.setAttribute("aria-label", translatedLabel);
      }
    }
  }

  function parseColor(value) {
    const match = value.match(/rgba?\(([^)]+)\)/);

    if (!match) return null;

    const [r, g, b, a = "1"] = match[1]
      .split(",")
      .map((part) => Number(part.trim()));

    return { r, g, b, a };
  }

  function isLightBackground(value) {
    const color = parseColor(value);

    if (!color || color.a === 0) return false;

    return (color.r + color.g + color.b) / 3 > 180;
  }

  function markAdminSurfaces() {
    const root = document.getElementById("nc-root");

    if (!root) return;

    root
      .querySelectorAll(
        "input, textarea, select, [contenteditable='true'], [role='textbox'], .CodeMirror, .cm-editor, .editor-toolbar, .editor-preview, [data-slate-editor='true']"
      )
      .forEach((element) => {
        element.classList.add("st-admin-control");
      });

    root.querySelectorAll("*").forEach((element) => {
      const style = window.getComputedStyle(element);

      if (isLightBackground(style.backgroundColor)) {
        element.classList.add("st-admin-light-surface");
      }

      const text = (element.textContent || "").replace(/\s+/g, " ").trim();

      if (text.length > 120) return;

      if (/封面图|选择图片|URL|上传/.test(text)) {
        element.classList.add("st-admin-image");
        element.parentElement?.classList.add("st-admin-image");
      }

      if (/发布日期|现在|清除|\d{4}\/\d{2}\/\d{2}/.test(text)) {
        element.classList.add("st-admin-date");
        element.parentElement?.classList.add("st-admin-date");
      }

      if (/富文本|Markdown|正文/.test(text)) {
        element.classList.add("st-admin-markdown-mode");
        element.parentElement?.classList.add("st-admin-markdown-mode");
      }
    });

    root
      .querySelectorAll(".editor-toolbar, [class*='Toolbar']")
      .forEach((element) => {
        const text = element.textContent || "";

        if (/富文本|Markdown|正文|B|I/.test(text)) {
          element.classList.add("st-admin-editor-toolbar");
        }
      });
  }

  function translatePage() {
    document.documentElement.lang = "zh-CN";
    document.querySelectorAll(selector).forEach(translateElement);
    markAdminSurfaces();
  }

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(translatePage);
  });

  function setupMobileSidebar() {
    const root = document.getElementById("nc-root");
    if (!root) return;

    // Create hamburger menu button for mobile
    const hamburger = document.createElement("button");
    hamburger.className = "st-admin-hamburger";
    hamburger.innerHTML = "☰";
    hamburger.setAttribute("aria-label", "打开菜单");
    hamburger.style.cssText = `
      position: fixed !important;
      top: 12px !important;
      left: 16px !important;
      z-index: 1001 !important;
      width: 44px !important;
      height: 44px !important;
      border: 1px solid var(--st-admin-border) !important;
      border-radius: 8px !important;
      background: var(--st-admin-panel) !important;
      color: var(--st-admin-text) !important;
      font-size: 20px !important;
      cursor: pointer !important;
      display: none !important;
    `;

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "st-admin-overlay";
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0,0,0,0.5) !important;
      z-index: 999 !important;
      display: none !important;
    `;

    document.body.appendChild(hamburger);
    document.body.appendChild(overlay);

    let isMobile = window.innerWidth <= 768;

    function updateLayout() {
      isMobile = window.innerWidth <= 768;

      if (isMobile) {
        hamburger.style.display = "flex !important";
        hamburger.style.alignItems = "center";
        hamburger.style.justifyContent = "center";
        overlay.style.display = "block !important";
      } else {
        hamburger.style.display = "none !important";
        overlay.style.display = "none !important";
        closeSidebar();
      }
    }

    function openSidebar() {
      root.querySelectorAll("aside, nav, [class*='Sidebar'], [class*='CollectionContainer']").forEach(sidebar => {
        sidebar.classList.add("open");
      });
      overlay.style.display = "block !important";
    }

    function closeSidebar() {
      root.querySelectorAll("aside, nav, [class*='Sidebar'], [class*='CollectionContainer']").forEach(sidebar => {
        sidebar.classList.remove("open");
      });
      overlay.style.display = "none !important";
    }

    hamburger.addEventListener("click", () => {
      const isOpen = root.querySelector("aside.open, [class*='Sidebar'].open");
      if (isOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay.addEventListener("click", closeSidebar);

    // Close sidebar when clicking a link on mobile
    root.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        if (isMobile) {
          closeSidebar();
        }
      });
    });

    window.addEventListener("resize", updateLayout);
    updateLayout();
  }

  function fixPreviewIframe() {
    // Fix preview iframe background
    const fixPreview = () => {
      document.querySelectorAll("iframe").forEach(iframe => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            doc.body.style.backgroundColor = "#141615";
            doc.body.style.color = "#f0eeeb";
          }
        } catch (e) {
          // Cross-origin iframe, skip
        }
      });
    };

    // Run periodically
    setInterval(fixPreview, 2000);
    document.addEventListener("DOMContentLoaded", fixPreview);
  }

  document.addEventListener("DOMContentLoaded", () => {
    translatePage();
    setupMobileSidebar();
    fixPreviewIframe();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
})();
