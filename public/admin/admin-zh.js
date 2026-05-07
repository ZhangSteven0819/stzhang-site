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

  function fixPreviewIframe() {
    // Fix preview iframe background and styles
    const fixPreview = () => {
      document.querySelectorAll("iframe").forEach(iframe => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc && doc.body) {
            // Apply dark theme to preview iframe
            doc.body.style.backgroundColor = "#0d0f0f";
            doc.body.style.color = "#f0eeeb";
            doc.body.style.fontFamily = '"Newsreader", "Noto Serif SC", Georgia, serif';
            doc.body.style.margin = "0";
            doc.body.style.padding = "48px 24px";
            
            // Style headings
            doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
              h.style.color = '#f0eeeb';
              h.style.fontWeight = '400';
            });
            
            // Style paragraphs
            doc.querySelectorAll('p').forEach(p => {
              p.style.color = '#f0eeeb';
              p.style.lineHeight = '1.8';
              p.style.fontSize = '18px';
            });
            
            // Style links
            doc.querySelectorAll('a').forEach(a => {
              a.style.color = '#f0eeeb';
            });
            
            // Style code
            doc.querySelectorAll('code, pre').forEach(code => {
              code.style.backgroundColor = '#141615';
              code.style.color = '#f0eeeb';
              code.style.padding = '2px 6px';
              code.style.borderRadius = '4px';
            });
            
            // Style blockquotes
            doc.querySelectorAll('blockquote').forEach(bq => {
              bq.style.borderLeft = '3px solid #2b302e';
              bq.style.paddingLeft = '20px';
              bq.style.color = '#aaa6a1';
            });
          }
        } catch (e) {
          // Cross-origin iframe, skip
        }
      });
    };

    // Run on DOM changes
    const iframeObserver = new MutationObserver(() => {
      window.requestAnimationFrame(fixPreview);
    });
    
    document.addEventListener("DOMContentLoaded", () => {
      fixPreview();
      iframeObserver.observe(document.body, { childList: true, subtree: true });
    });
    
    // Also run periodically as backup
    setInterval(fixPreview, 1500);
  }

  document.addEventListener("DOMContentLoaded", () => {
    translatePage();
    fixPreviewIframe();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
})();
