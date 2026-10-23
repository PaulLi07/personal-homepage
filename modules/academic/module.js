window.Homepage.registerSection({
  id: "academic",
  detailGroup: { id: "academic", label: "Academic sections", descriptionTitle: "Overview", aliases: {research: "experience"} },
  init({ root, details }) {
    const buttons = Array.from(root.querySelectorAll("[data-academic]"));
    const previews = Array.from(root.querySelectorAll("[data-preview]"));
    const label = root.querySelector("#preview-label");
    const focusTitle = root.querySelector("#academic-focus-title");
    const focusDescription = root.querySelector("#academic-focus-description");
    const previewIndex = root.querySelector("#academic-preview-index");
    function selectPreview(key) {
      const item = details.getItem("academic", key);
      if (!item) return;
      previews.forEach(image => {
        image.classList.toggle("is-active", image.dataset.preview === key);
        image.setAttribute("aria-hidden", String(image.dataset.preview !== key));
      });
      buttons.forEach(button => button.classList.toggle("is-selected", button.dataset.academic === key));
      label.textContent = item.label;
      if (focusTitle) focusTitle.textContent = item.label;
      if (focusDescription) focusDescription.textContent = item.subtitle;
      const index = buttons.findIndex(button => button.dataset.academic === key);
      if (previewIndex && index >= 0) {
        previewIndex.textContent = String(index + 1).padStart(2, "0") + " / " + String(buttons.length).padStart(2, "0");
      }
    }

    // 仅通过 Publications 的公开 getter 读取已校验数据，不读取其文件或私有 DOM。
    function showFeaturedPublication() {
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
        metadata.textContent = entry.identifier + " · " + entry.authors;
        link.href = "#academic/publications/" + category.id;
        link.addEventListener("click", event => {
          if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          event.preventDefault();
          details.open("academic", "publications", { trigger: link, route: category.id });
        });
        link.hidden = false;
      } catch (_) { /* 分类不可用时隐藏精选链接，不影响四个栏目入口。 */ }
    }

    details.onSelect("academic", selectPreview);
    buttons.forEach(button => {
      const key = button.dataset.academic;
      button.addEventListener("pointerenter", () => selectPreview(key));
      button.addEventListener("focus", () => selectPreview(key));
      button.addEventListener("click", () => {
        const source = window.innerWidth > 760
          ? previews.find(image => image.dataset.preview === key) : button.querySelector("img");
        details.open("academic", key, { trigger: button, source });
      });
    });
    selectPreview("experience");
    showFeaturedPublication();
  }
});
