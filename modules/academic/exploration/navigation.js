/* 路牌与图窗入口：触摸直接打开，鼠标与键盘另外提供预览。 */
(function () {
  "use strict";
  const api = window.Homepage.academicExploration;

  api.createNavigation = function ({ root, details, gallery }) {
    const listeners = [];
    const buttons = Array.from(root.querySelectorAll("[data-academic]"));
    const images = Array.from(root.querySelectorAll("[data-preview]"));
    const action = root.querySelector("[data-scene-open]");
    let destroyed = false;
    let focused = null;
    let hoveredRow = null;

    function listen(target, type, handler) {
      target.addEventListener(type, handler);
      listeners.push(() => target.removeEventListener(type, handler));
    }

    function open(key, trigger) {
      if (destroyed || !key || !details.getItem("academic", key)) return;
      gallery.select(key);
      const image = images.find(item => item.dataset.preview === key);
      const box = image?.getBoundingClientRect();
      const visibleSource = box && box.width > 0 && box.height > 0
        && box.bottom > 0 && box.right > 0
        && box.top < window.innerHeight && box.left < window.innerWidth;
      details.open("academic", key, {
        trigger,
        // 手机路牌可能已滚出上方图窗；离屏图片不作为弹窗飞入的起点。
        source: visibleSource ? image : undefined
      });
    }

    function bindPreviewHold(button, reason, key) {
      listen(button, "pointerenter", event => {
        if (event.pointerType === "touch") return;
        gallery.hold(reason + "-pointer", true);
        if (key) {
          hoveredRow = { button, key };
          // 键盘正在操作路牌或图窗时，鼠标经过其他行不能换掉其目标。
          if (!focused?.matches(":focus-visible")) gallery.select(key);
        }
      });
      const releasePointer = event => {
        if (event.pointerType === "touch") return;
        if (key && hoveredRow?.button !== button) return;
        if (key) hoveredRow = null;
        gallery.hold(reason + "-pointer", false);
      };
      listen(button, "pointerleave", releasePointer);
      listen(button, "pointercancel", releasePointer);
      listen(button, "focus", () => {
        focused = button;
        gallery.hold(reason + "-focus", true);
        if (key) gallery.select(key);
      });
      listen(button, "focusout", event => {
        if (button.contains(event.relatedTarget) || focused !== button) return;
        focused = null;
        gallery.hold(reason + "-focus", false);
        if (hoveredRow) gallery.select(hoveredRow.key);
      });
    }

    buttons.forEach(button => {
      const key = button.dataset.academic;
      bindPreviewHold(button, "nav", key);
      listen(button, "click", () => open(key, button));
    });
    if (action) {
      bindPreviewHold(action, "image");
      listen(action, "click", () => open(gallery.getKey(), action));
    }

    return function destroy() {
      if (destroyed) return;
      destroyed = true;
      focused = null;
      hoveredRow = null;
      listeners.splice(0).forEach(remove => remove());
      ["nav-pointer", "nav-focus", "image-pointer", "image-focus"]
        .forEach(reason => gallery.hold(reason, false));
    };
  };
})();
