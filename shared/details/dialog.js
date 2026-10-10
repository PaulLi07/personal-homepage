/* 共用详情服务只管理弹窗和路由；首页预览与照片行为由各模块负责。 */
"use strict";
window.Homepage.createDetails = function ({ dialog, content, views = {}, groups, transitions }) {
  const closeButton = dialog.querySelector("#close-detail");
  const listeners = new Map();
  const pageTitle = document.title;
  let returnFocus = null;
  let baseHash = "#home";
  let openedFromPage = false;
  let selection = null;
  let pagePosition = null;
  let viewController = null;
  let disposeView = null;
  const element = id => dialog.querySelector("#" + id);
  const text = (id, value) => { element(id).textContent = value || ""; };
  const itemFor = (group, key) => content[group] && content[group][key];

  function notify(group, key, route) {
    selection = { group, key, route };
    (listeners.get(group) || []).forEach(callback => callback(key));
  }

  function clearView() {
    if (viewController) viewController.abort();
    viewController = null;
    if (typeof disposeView === "function") disposeView();
    disposeView = null;
    element("detail-custom").replaceChildren();
  }

  function populate(group, key, route = null) {
    clearView();
    const item = itemFor(group, key);
    const settings = groups[group];
    text("detail-title", item.title);
    text("detail-kicker", item.kicker);
    text("detail-subtitle", item.subtitle);
    const image = element("detail-image");
    image.src = item.image;
    image.alt = item.imageAlt;
    const credit = element("detail-credit");
    credit.textContent = item.credit + " ↗";
    credit.href = item.source;
    const tabs = element("detail-tabs");
    tabs.replaceChildren();
    tabs.setAttribute("aria-label", settings.label);
    Object.entries(content[group]).forEach(([id, entry]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = entry.label;
      if (id === key) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        history.replaceState(history.state, "", "#" + group + "/" + id);
        populate(group, id);
        tabs.querySelector('[aria-current="page"]').focus({ preventScroll: true });
      });
      tabs.append(button);
    });
    text("detail-description-title", settings.descriptionTitle);
    const description = element("detail-description");
    description.replaceChildren();
    item.description.forEach(paragraph => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      description.append(p);
    });
    const facts = element("detail-facts");
    facts.replaceChildren();
    facts.hidden = !item.facts || !item.facts.length;
    (item.facts || []).forEach(fact => {
      const wrapper = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = fact.label;
      dd.textContent = fact.value;
      wrapper.append(dt, dd);
      facts.append(wrapper);
    });
    text("detail-list-title", item.listTitle);
    const entries = element("detail-entries");
    entries.replaceChildren();
    if (!item.entries.length) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = item.emptyMessage;
      entries.append(p);
    }
    item.entries.forEach(entry => {
      const article = document.createElement("article");
      article.className = "detail-entry";
      const heading = document.createElement("h4");
      if (entry.url) {
        const a = document.createElement("a");
        a.href = entry.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = entry.title + " ↗";
        heading.append(a);
      } else heading.textContent = entry.title;
      article.append(heading);
      [entry.meta, entry.description].filter(Boolean).forEach(value => {
        const p = document.createElement("p");
        p.textContent = value;
        article.append(p);
      });
      entries.append(article);
    });
    const link = element("detail-link");
    link.hidden = !item.link;
    if (item.link) {
      link.href = item.link.url;
      link.textContent = item.link.label;
    }
    const custom = element("detail-custom");
    const view = views[group + "/" + key];
    dialog.classList.toggle("has-custom-view", Boolean(view));
    custom.hidden = !view;
    element("detail-description").parentElement.hidden = Boolean(view);
    element("detail-entries").parentElement.hidden = Boolean(view);
    if (view) {
      facts.hidden = true;
      link.hidden = true;
      viewController = new AbortController();
      try {
        disposeView = view.render({
          host: custom, route, signal: viewController.signal,
          navigate(child) {
            const hash = "#" + group + "/" + key + (child ? "/" + child : "");
            history.pushState({homepageDetail: true, baseHash}, "", hash);
            populate(group, key, child || null);
            custom.querySelector("[data-view-heading]")?.focus({preventScroll: true});
          }
        });
      } catch (error) {
        clearView();
        custom.textContent = "This section is temporarily unavailable. Please return to the page and try again.";
        console.error("Unable to render detail view: " + group + "/" + key, error);
      }
    }
    dialog.scrollTop = 0;
    document.title = item.label + " · Yuhong Li";
    notify(group, key, route);
  }

  function show(group, key, sourceRect, route = null) {
    if (!groups[group] || !itemFor(group, key)) return;
    const wasOpen = dialog.open;
    populate(group, key, route);
    if (!wasOpen) {
      dialog.showModal();
      document.body.classList.add("modal-open");
      closeButton.focus({ preventScroll: true });
      transitions.openDetail(dialog, sourceRect);
    }
  }

  function restoreFocus() {
    const target = returnFocus;
    returnFocus = null;
    if (target && target.isConnected) requestAnimationFrame(() => {
      if (!dialog.open && target.isConnected) target.focus({ preventScroll: true });
    });
  }

  function hide(restore = true) {
    clearView();
    if (dialog.open) {
      dialog.close();
      document.body.classList.remove("modal-open");
      document.title = pageTitle;
    }
    if (restore) restoreFocus();
    selection = null;
  }

  function close() {
    hide(false);
    // 博客内部允许多级路由；关闭应回到页面，不停留在上一篇文章或作者入口。
    if (openedFromPage && history.state && history.state.homepageDetail) {
      history.replaceState(null, "", baseHash);
      if (pagePosition) window.scrollTo({left: pagePosition.x, top: pagePosition.y, behavior: "instant"});
      else document.getElementById(baseHash.slice(1))?.scrollIntoView({behavior: "auto"});
      restoreFocus();
    }
    else {
      history.replaceState(null, "", baseHash);
      const section = document.getElementById(baseHash.slice(1));
      if (section) section.scrollIntoView({ behavior: "auto" });
      restoreFocus();
    }
    openedFromPage = false;
    pagePosition = null;
  }

  function route() {
    const match = location.hash.match(/^#([a-z]+)\/([a-z]+)(?:\/([a-z0-9]+(?:-[a-z0-9]+)*))?$/);
    if (match && groups[match[1]]) {
      const group = match[1];
      const key = groups[group].aliases?.[match[2]] || match[2];
      if (!itemFor(group, key) || (match[3] && !views[group + "/" + key])) { hide(); return; }
      if (key !== match[2]) history.replaceState(history.state, "", "#" + group + "/" + key + (match[3] ? "/" + match[3] : ""));
      openedFromPage = Boolean(history.state && history.state.homepageDetail);
      baseHash = openedFromPage ? history.state.baseHash || "#" + match[1] : "#" + match[1];
      if (dialog.open && selection?.group === group && selection?.key === key && selection?.route === (match[3] || null)) return;
      show(group, key, undefined, match[3] || null);
    } else hide();
  }

  return {
    getItem: itemFor,
    onSelect(group, callback) {
      if (!listeners.has(group)) listeners.set(group, new Set());
      listeners.get(group).add(callback);
      if (selection && selection.group === group) callback(selection.key);
      return () => listeners.get(group).delete(callback);
    },
    open(group, key, { trigger, source } = {}) {
      if (!groups[group] || !itemFor(group, key)) return;
      returnFocus = trigger || null;
      pagePosition = {x: window.scrollX, y: window.scrollY};
      baseHash = location.hash && !location.hash.includes("/") ? location.hash : "#" + group;
      openedFromPage = true;
      history.pushState({ homepageDetail: true, baseHash }, "", "#" + group + "/" + key);
      show(group, key, source && source.getBoundingClientRect());
    },
    start() {
      closeButton.addEventListener("click", close);
      dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
      // 某些系统键盘设置会跳过链接；统一弹窗内 Tab 顺序并保留焦点。
      dialog.addEventListener("keydown", event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          .filter(node => node.getClientRects().length && !node.closest("[hidden]"));
        if (!controls.length) return;
        event.preventDefault();
        const current = controls.indexOf(document.activeElement);
        const next = current < 0 ? (event.shiftKey ? controls.length - 1 : 0)
          : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
        controls[next].focus();
      });
      window.addEventListener("hashchange", route);
      window.addEventListener("popstate", route);
      route();
    }
  };
};
