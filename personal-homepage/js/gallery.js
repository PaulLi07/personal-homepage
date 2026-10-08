/* Academic previews, full-screen details, and the Life photo collection.
   Hash routes work on GitHub Pages and when index.html is opened locally. */
(function () {
  "use strict";
  const content = window.HOMEPAGE_CONTENT;
  const dialog = document.getElementById("detail-dialog");
  const closeButton = document.getElementById("close-detail");
  let returnFocus = null;
  let baseHash = "#academic";
  let openedFromPage = false;

  function text(id, value) { document.getElementById(id).textContent = value || ""; }

  function selectPreview(key) {
    if (!content.academic[key]) return;
    document.querySelectorAll("[data-preview]").forEach(image => {
      image.classList.toggle("is-active", image.dataset.preview === key);
      image.setAttribute("aria-hidden", String(image.dataset.preview !== key));
    });
    document.querySelectorAll("[data-academic]").forEach(button => {
      button.classList.toggle("is-selected", button.dataset.academic === key);
    });
    text("preview-label", content.academic[key].label);
  }

  function populate(group, key) {
    const item = content[group][key];
    text("detail-title", item.title);
    text("detail-kicker", item.kicker);
    text("detail-subtitle", item.subtitle);
    const image = document.getElementById("detail-image");
    image.src = item.image;
    image.alt = item.imageAlt;
    const credit = document.getElementById("detail-credit");
    credit.textContent = item.credit + " ↗";
    credit.href = item.source;

    const tabs = document.getElementById("detail-tabs");
    tabs.replaceChildren();
    tabs.setAttribute("aria-label", group === "academic" ? "Academic sections" : "Life galleries");
    Object.entries(content[group]).forEach(([id, entry]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = entry.label;
      if (id === key) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        history.replaceState(history.state, "", "#" + group + "/" + id);
        populate(group, id);
        if (group === "academic") selectPreview(id);
        // The selected button was replaced: restore keyboard focus to its successor.
        tabs.querySelector('[aria-current="page"]').focus({ preventScroll: true });
      });
      tabs.append(button);
    });

    text("detail-description-title", group === "academic" ? "Overview" : "The story");
    const description = document.getElementById("detail-description");
    description.replaceChildren();
    item.description.forEach(paragraph => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      description.append(p);
    });
    const facts = document.getElementById("detail-facts");
    facts.replaceChildren();
    facts.hidden = !item.facts || item.facts.length === 0;
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
    const entries = document.getElementById("detail-entries");
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
    const link = document.getElementById("detail-link");
    link.hidden = !item.link;
    if (item.link) {
      link.href = item.link.url;
      link.textContent = item.link.label;
    }
    dialog.scrollTop = 0;
    document.title = item.label + " · Yuhong Li";
  }

  function show(group, key, sourceRect) {
    if (!content[group] || !content[group][key]) return;
    const wasOpen = dialog.open;
    populate(group, key);
    if (group === "academic") selectPreview(key);
    if (!wasOpen) {
      dialog.showModal();
      document.body.classList.add("modal-open");
      closeButton.focus({ preventScroll: true });
      window.HomepageTransitions.openDetail(dialog, sourceRect);
    }
  }

  function hide() {
    if (!dialog.open) return;
    dialog.close();
    document.body.classList.remove("modal-open");
    document.title = "Yuhong Li · Theoretical Physics";
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  function close() {
    hide();
    if (openedFromPage && history.state && history.state.homepageDetail) {
      history.back();
    } else {
      history.replaceState(null, "", baseHash);
      // A direct detail link has no saved position on the main page.
      const section = document.getElementById(baseHash.slice(1));
      if (section) section.scrollIntoView({ behavior: "auto" });
    }
    openedFromPage = false;
  }

  function route() {
    const match = location.hash.match(/^#(academic|life)\/([a-z]+)$/);
    if (match && content[match[1]][match[2]]) {
      baseHash = "#" + match[1];
      show(match[1], match[2]);
    } else hide();
  }

  document.querySelectorAll("[data-academic], [data-life]").forEach(button => {
    const group = button.dataset.academic ? "academic" : "life";
    const key = button.dataset[group];
    if (group === "academic") {
      button.addEventListener("pointerenter", () => selectPreview(key));
      button.addEventListener("focus", () => selectPreview(key));
    }
    button.addEventListener("click", () => {
      returnFocus = button;
      baseHash = location.hash || "#" + group;
      openedFromPage = true;
      const sourceImage = group === "academic" && window.innerWidth > 760
        ? document.querySelector('[data-preview="' + key + '"]') : button.querySelector("img");
      const sourceRect = sourceImage.getBoundingClientRect();
      history.pushState({ homepageDetail: true }, "", "#" + group + "/" + key);
      show(group, key, sourceRect);
    });
  });
  closeButton.addEventListener("click", close);
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);
  route();
})();
