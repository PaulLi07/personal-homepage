/* 为多个模块提供相同的进入视口揭示效果，不依赖某个模块的选择器。 */
window.Homepage.initReveals = function (roots) {
  const elements = roots.flatMap(root => Array.from(root.querySelectorAll("[data-reveal]")));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    elements.forEach(element => observer.observe(element));
  } else elements.forEach(element => element.classList.add("is-visible"));
};
