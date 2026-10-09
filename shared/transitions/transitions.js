/* 共用过渡服务采用原生动画；减少动态效果时跳过动画。 */
window.Homepage.createTransitions = function (reducedMotion) {
  "use strict";
  const settled = animation => animation.finished.catch(() => {});

  function columns(parent, className) {
    const curtain = document.createElement("div");
    curtain.className = className;
    curtain.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 5; i++) {
      const column = document.createElement("div");
      column.className = "colordiv";
      curtain.append(column);
    }
    parent.append(curtain);
    return curtain;
  }

  async function revealColumns(curtain, duration) {
    if (reducedMotion.matches || !Element.prototype.animate) {
      curtain.remove();
      return;
    }
    await Promise.all(Array.from(curtain.children)
      .filter(child => child.classList.contains("colordiv"))
      .map((column, i) => settled(column.animate([
        { transform: "translateY(0)" }, { transform: "translateY(-105%)" }
      ], { duration, delay: i * 55, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" }))));
    curtain.remove();
  }

  async function start() {
    document.documentElement.classList.add("js-enabled");
    if (reducedMotion.matches) {
      document.documentElement.classList.add("is-ready");
      return;
    }
    const loader = columns(document.body, "loader");
    const greeting = document.createElement("p");
    greeting.className = "loader-label";
    greeting.textContent = "Welcome.";
    const small = document.createElement("small");
    small.textContent = "YUHONG LI · A PERSONAL SPACE";
    greeting.append(small);
    loader.append(greeting);
    // 不等待全部图片，慢速或失效图片不能阻塞页面。
    const failSafe = window.setTimeout(() => {
      loader.remove();
      document.documentElement.classList.add("is-ready");
    }, 1600);
    try {
      if (greeting.animate) {
        await settled(greeting.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 220, delay: 160, fill: "forwards"
        }));
      }
      document.documentElement.classList.add("is-ready");
      await revealColumns(loader, 600);
    } finally {
      window.clearTimeout(failSafe);
      loader.remove();
      document.documentElement.classList.add("is-ready");
    }
  }

  function openDetail(dialog, sourceRect) {
    if (reducedMotion.matches || !Element.prototype.animate) return;
    const curtain = columns(dialog, "transition-columns");
    revealColumns(curtain, 530);
    const image = dialog.querySelector("#detail-image");
    const target = image.getBoundingClientRect();
    if (sourceRect && sourceRect.width && target.width) {
      const dx = sourceRect.left + sourceRect.width / 2 - target.left - target.width / 2;
      const dy = sourceRect.top + sourceRect.height / 2 - target.top - target.height / 2;
      image.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${sourceRect.width / target.width}, ${sourceRect.height / target.height})`, opacity: .6 },
        { transform: "translate(0,0) scale(1)", opacity: 1 }
      ], { duration: 780, delay: 160, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
    dialog.querySelector(".right-part").animate([
      { opacity: 0, transform: "translateY(24px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration: 650, delay: 170, easing: "ease-out" });
  }

  return { start, openDetail };
};
