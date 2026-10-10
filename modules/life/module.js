window.Homepage.registerSection({
  id: "life",
  detailGroup: { id: "life", label: "Life sections", descriptionTitle: "The story", aliases: {places: "travels", notes: "creations", outside: "relationship"} },
  init({ root, details, reducedMotion }) {
    const photographs = Array.from(root.querySelectorAll("[data-life]"));
    photographs.forEach(button => {
      button.addEventListener("click", () => {
        details.open("life", button.dataset.life, { trigger: button, source: button.querySelector("img") });
      });
    });
    let scheduled = false;
    function onScroll() {
      if (!reducedMotion.matches) {
        const bounds = root.getBoundingClientRect();
        if (bounds.bottom > 0 && bounds.top < window.innerHeight) {
          const distance = bounds.top + bounds.height / 2 - window.innerHeight / 2;
          photographs.forEach((photo, index) => {
            const drift = Math.max(-28, Math.min(28, -distance * (.045 + index * .014)));
            photo.style.setProperty("--drift", drift.toFixed(1) + "px");
          });
        }
      } else photographs.forEach(photo => photo.style.removeProperty("--drift"));
      scheduled = false;
    }
    window.addEventListener("scroll", () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    reducedMotion.addEventListener("change", onScroll);
    onScroll();
  }
});
