/* 精选索引只接入 Publications 的公开资料与共用详情服务。 */
(function () {
  "use strict";
  window.Homepage.academicExploration.mountFeaturedPublication = function ({ root, details }) {
    const link = root.querySelector("#academic-featured-publication");
    const title = root.querySelector("#academic-publication-title");
    const metadata = root.querySelector("#academic-publication-meta");
    if (!link || !title || !metadata) return;
    link.hidden = true;
    try {
      const categories = window.Homepage.getPublicationCategories?.();
      if (!Array.isArray(categories)) return;
      const category = categories.find(item => item.id === "arxiv" && item.entries.length)
        || categories.find(item => item.entries.length);
      if (!category) return;
      const entry = category.entries[0];
      title.textContent = entry.title;
      if (entry.titleTex) window.Homepage.math?.renderText(title, entry.titleTex, {fallback: entry.title});
      metadata.textContent = entry.identifier + " · " + entry.authors;
      link.href = "#academic/publications/" + category.id;
      link.addEventListener("click", event => {
        if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        details.open("academic", "publications", { trigger: link, route: category.id });
      });
      link.hidden = false;
    } catch (_) { /* 分类不可用时隐藏精选链接，不影响四个栏目入口。 */ }
  };
})();
