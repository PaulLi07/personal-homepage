/* 博客只渲染传入的模块容器，路由与作者入口交由胶水回调处理。 */
"use strict";
window.Homepage.createBlogView = function ({ posts, onNavigate, onAuthorRequested } = {}) {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const formatter = new Intl.DateTimeFormat("en", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
  });
  let activeRender = null;

  function parsedDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value + "T00:00:00Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  }

  function availablePosts() {
    try {
      const source = typeof posts === "function" ? posts() : posts;
      if (!Array.isArray(source)) return [];
      const seen = new Set();
      return source.filter(post => {
        if (!post || typeof post !== "object" || typeof post.id !== "string" || !slugPattern.test(post.id) || post.id === "author"
          || typeof post.title !== "string" || !post.title.trim() || !parsedDate(post.date)
          || typeof post.excerpt !== "string" || typeof post.body !== "string"
          || typeof post.author !== "string" || !post.author.trim() || seen.has(post.id)) return false;
        seen.add(post.id);
        return true;
      }).map(post => ({ ...post })).sort((left, right) => right.date.localeCompare(left.date));
    } catch {
      return null;
    }
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(text, className, action, signal) {
    const node = element("button", className, text);
    node.type = "button";
    node.addEventListener("click", action, { signal });
    return node;
  }

  function postMeta(post) {
    const meta = element("p", "moments-blog__meta");
    const time = element("time", "", formatter.format(parsedDate(post.date)));
    time.dateTime = post.date;
    meta.append(time, element("span", "", "By " + post.author));
    return meta;
  }

  function stateMessage(title, description) {
    const state = element("div", "moments-blog__state");
    state.append(element("h4", "", title), element("p", "", description));
    return state;
  }

  return {
    render({ host, route = null, signal } = {}) {
      if (!host || typeof host.replaceChildren !== "function") throw new TypeError("A blog host is required.");
      if (activeRender) activeRender.abort();
      if (signal && signal.aborted) return;
      const controller = new AbortController();
      activeRender = controller;
      if (signal) {
        const abort = () => controller.abort();
        signal.addEventListener("abort", abort, { once: true });
        controller.signal.addEventListener("abort", () => signal.removeEventListener("abort", abort), { once: true });
      }
      const renderSignal = controller.signal;
      const navigate = slug => {
        if (typeof onNavigate === "function") onNavigate(slug);
      };
      const section = element("section", "moments-blog");
      section.setAttribute("aria-label", "Moments blog");
      const header = element("header", "moments-blog__header");
      const heading = element("div", "");
      const journalTitle = element("h3", "", "Journal");
      journalTitle.tabIndex = -1;
      heading.append(element("p", "moments-blog__eyebrow", "Life · Personal writing"), journalTitle);
      header.append(heading);
      if (typeof onAuthorRequested === "function") {
        const author = button("Author sign in", "moments-blog__button moments-blog__author", () => onAuthorRequested(), renderSignal);
        author.setAttribute("data-blog-author", "");
        header.append(author);
      }
      section.append(header);
      const items = availablePosts();
      if (items === null) {
        section.dataset.blogView = "unavailable";
        section.append(stateMessage("Posts are unavailable", "Please try again in a moment."));
      } else if (route !== null && route !== "") {
        const post = typeof route === "string" && slugPattern.test(route) ? items.find(item => item.id === route) : null;
        section.dataset.blogView = post ? "article" : "not-found";
        section.append(button("← All posts", "moments-blog__back", () => navigate(null), renderSignal));
        if (!post) section.append(stateMessage("Post not found", "This post may have moved or has not been published."));
        else {
          const article = element("article", "moments-blog__article");
          const title = element("h4", "moments-blog__title", post.title);
          title.tabIndex = -1;
          title.setAttribute("data-view-heading", "");
          article.append(title, postMeta(post));
          const body = element("div", "moments-blog__body");
          body.textContent = post.body.replace(/\r\n?/g, "\n");
          article.append(body);
          section.append(article);
        }
      } else {
        section.dataset.blogView = "list";
        if (!items.length) section.append(stateMessage("No posts yet", "New writing will appear here when it is published."));
        else {
          const list = element("div", "moments-blog__list");
          items.forEach(post => {
            const card = element("article", "moments-blog__card");
            card.append(element("h4", "", post.title), postMeta(post), element("p", "moments-blog__excerpt", post.excerpt));
            const read = button("Read post →", "moments-blog__button", () => navigate(post.id), renderSignal);
            read.setAttribute("aria-label", "Read " + post.title);
            card.append(read);
            list.append(card);
          });
          section.append(list);
        }
      }
      if (!section.querySelector("[data-view-heading]")) journalTitle.setAttribute("data-view-heading", "");
      host.replaceChildren(section);
    }
  };
};
