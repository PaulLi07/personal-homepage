window.Homepage.registerSection({
  id: "academic",
  detailGroup: { id: "academic", label: "Academic sections", descriptionTitle: "Overview" },
  init({ root, details }) {
    const buttons = Array.from(root.querySelectorAll("[data-academic]"));
    const previews = Array.from(root.querySelectorAll("[data-preview]"));
    const label = root.querySelector("#preview-label");
    function selectPreview(key) {
      const item = details.getItem("academic", key);
      if (!item) return;
      previews.forEach(image => {
        image.classList.toggle("is-active", image.dataset.preview === key);
        image.setAttribute("aria-hidden", String(image.dataset.preview !== key));
      });
      buttons.forEach(button => button.classList.toggle("is-selected", button.dataset.academic === key));
      label.textContent = item.label;
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
  }
});
