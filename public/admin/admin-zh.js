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

  function translatePage() {
    document.documentElement.lang = "zh-CN";
    document.querySelectorAll(selector).forEach(translateElement);
  }

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(translatePage);
  });

  document.addEventListener("DOMContentLoaded", () => {
    translatePage();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
})();
