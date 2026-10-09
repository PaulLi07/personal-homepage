/* 导航只读取胶水层传入的公共分区根节点，不读取模块内部实现。 */
"use strict";
window.Homepage.createNavigation = function ({ root, sections }) {
  let lastScroll = window.scrollY;
  let scheduled = false;
  let anchorUntil = 0;
  const links = Array.from(root.querySelectorAll('.navlinks a[href^="#"]'));

  function onScroll() {
    const current = window.scrollY;
    root.classList.toggle("is-scrolled", current > 50);
    if (current < 140 || Date.now() < anchorUntil) root.classList.remove("is-hidden");
    else if (Math.abs(current - lastScroll) > 5) root.classList.toggle("is-hidden", current > lastScroll);
    lastScroll = current;
    let active = "home";
    for (const section of sections) {
      if (section.getBoundingClientRect().top < window.innerHeight * .38) active = section.id;
    }
    links.forEach(link => {
      if (link.getAttribute("href") === "#" + active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    scheduled = false;
  }

  window.addEventListener("scroll", () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  document.addEventListener("click", event => {
    if (event.target.closest('a[href^="#"]')) {
      anchorUntil = Date.now() + 1400;
      root.classList.remove("is-hidden");
    }
  });
  onScroll();
};
