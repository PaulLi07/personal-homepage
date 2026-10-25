/* 拍立得堆：稳定位置、有限层级及指针/键盘输入，不读取详情模块内部实现。 */
(function () {
  "use strict";
  const api = window.Homepage.lifeStack = window.Homepage.lifeStack || {};
  const mounted = new WeakMap();

  api.mount = function ({ root, details, reducedMotion, config = api.config } = {}) {
    if (!root || typeof root.querySelectorAll !== "function") return { destroy() {} };
    mounted.get(root)?.destroy();
    const defaults = Array.isArray(api.config?.entries) ? api.config.entries : [];
    const entries = new Map(defaults.map(entry => [entry.key, { ...entry }]));
    if (Array.isArray(config?.entries)) config.entries.forEach(entry => {
      if (!entry || typeof entry.key !== "string" || !/^[a-z]+$/.test(entry.key)) return;
      const fallback = entries.get(entry.key);
      if (typeof entry.title !== "string" || !entry.title.trim()) return;
      entries.set(entry.key, {
        key: entry.key, title: entry.title.trim(),
        description: typeof entry.description === "string" ? entry.description : fallback?.description || ""
      });
    });
    const seen = new Set();
    const buttons = Array.from(root.querySelectorAll("[data-life]")).filter(button => {
      const key = button.dataset.life;
      if (!entries.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (!buttons.length) return { destroy() {} };
    const title = root.querySelector("[data-life-title]");
    const description = root.querySelector("[data-life-description]");
    const doc = root.ownerDocument || document;
    const preference = reducedMotion ?? (typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false });
    const listeners = [];
    const restorers = [];
    const order = buttons.slice();
    let selected = null;
    let focused = null;
    let modality = "keyboard";
    let press = null;
    let destroyed = false;

    function remember(node, names) {
      const saved = names.map(name => [name, node.getAttribute(name)]);
      restorers.push(() => saved.forEach(([name, value]) => {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
      }));
    }
    remember(root, ["data-selected", "data-reduced-motion"]);
    [title, description].filter(Boolean).forEach(node => {
      const previous = node.textContent;
      restorers.push(() => { node.textContent = previous; });
    });
    buttons.forEach(button => {
      remember(button, ["aria-pressed"]);
      const active = button.classList.contains("is-active");
      const value = button.style.getPropertyValue("--stack-order");
      const priority = button.style.getPropertyPriority("--stack-order");
      restorers.push(() => {
        button.classList.toggle("is-active", active);
        if (value) button.style.setProperty("--stack-order", value, priority);
        else button.style.removeProperty("--stack-order");
      });
    });
    function listen(target, type, handler, options) {
      if (!target?.addEventListener) return;
      target.addEventListener(type, handler, options);
      listeners.push(() => target.removeEventListener(type, handler, options));
    }
    function select(button) {
      if (destroyed || !buttons.includes(button)) return;
      selected = button;
      const index = order.indexOf(button);
      if (index !== order.length - 1) {
        order.splice(index, 1);
        order.push(button);
      }
      order.forEach((item, position) => item.style.setProperty("--stack-order", String(position + 1)));
      buttons.forEach(item => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      const entry = entries.get(button.dataset.life);
      root.dataset.selected = entry.key;
      if (title) title.textContent = entry.title;
      if (description) description.textContent = entry.description;
    }
    function keyboardOwnsSelection() {
      return focused && (focused === doc.activeElement || focused.contains(doc.activeElement));
    }
    function open(button) {
      if (destroyed || typeof details?.open !== "function") return;
      select(button);
      details.open("life", button.dataset.life, { trigger: button, source: button.querySelector("img") });
    }
    function syncPreference() {
      if (!destroyed) root.dataset.reducedMotion = String(typeof preference === "boolean" ? preference : Boolean(preference.matches));
    }
    listen(doc, "keydown", () => { modality = "keyboard"; press = null; }, true);
    listen(doc, "pointerdown", () => { modality = "pointer"; focused = null; press = null; }, true);

    buttons.forEach(button => {
      listen(button, "pointerenter", event => {
        // 触摸也会先触发 pointerenter；在 pointerdown 前选中会破坏首次轻点规则。
        if (event.pointerType && event.pointerType !== "mouse") return;
        if (!keyboardOwnsSelection()) select(button);
      });
      listen(button, "pointerdown", event => {
        if (event.button !== undefined && event.button !== 0) return;
        modality = "pointer";
        focused = null;
        press = { button, pointerType: event.pointerType || "mouse", wasActive: selected === button };
        select(button);
      });
      listen(button, "pointercancel", () => { press = null; });
      listen(button, "focusin", () => {
        focused = modality === "keyboard" ? button : null;
        select(button);
      });
      listen(button, "focusout", event => {
        if (focused === button && !button.contains(event.relatedTarget)) focused = null;
      });
      listen(button, "keydown", () => {
        modality = "keyboard";
        focused = button;
        press = null;
        select(button);
      });
      listen(button, "click", event => {
        const gesture = press?.button === button ? press : null;
        press = null;
        // 原生键盘/辅助技术 click 的 detail 为0，直接进入当前入口。
        if (event.detail === 0) { open(button); return; }
        const type = gesture?.pointerType || event.pointerType || "mouse";
        if ((type === "touch" || type === "pen") && gesture && !gesture.wasActive) {
          event.preventDefault();
          select(button);
          return;
        }
        open(button);
      });
    });

    if (typeof preference.addEventListener === "function") listen(preference, "change", syncPreference);
    else if (typeof preference.addListener === "function") {
      preference.addListener(syncPreference);
      listeners.push(() => preference.removeListener(syncPreference));
    }
    syncPreference();
    select(buttons.find(button => button.dataset.life === config?.defaultKey)
      || buttons.find(button => button.dataset.life === api.config?.defaultKey) || buttons[0]);

    const handle = {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        press = null;
        focused = null;
        listeners.splice(0).forEach(remove => remove());
        restorers.reverse().forEach(restore => restore());
        if (mounted.get(root) === handle) mounted.delete(root);
      }
    };
    mounted.set(root, handle);
    return handle;
  };
})();
