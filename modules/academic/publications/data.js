/* 三个分类各自登记数据；纯文本题名保底，可选 titleTex 只交给共享安全数学接口。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const ids = ["internal-note", "arxiv", "published"];
  const text = (value, limit) => typeof value === "string" && Boolean(value.trim()) && value.length <= limit;
  function link(value) {
    if (!text(value, 2000) || value !== value.trim()) return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
    } catch (_) { return false; }
  }
  function entriesFor(entries) {
    if (!Array.isArray(entries) || entries.length > 500) throw new Error("Invalid publication records.");
    const seen = new Set();
    return entries.map(entry => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)
        || typeof entry.id !== "string" || entry.id.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)
        || seen.has(entry.id) || !text(entry.title, 800) || !text(entry.authors, 300)
        || (entry.titleTex !== undefined && !text(entry.titleTex, 1600))
        || typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
        || !Number.isFinite(Date.parse(entry.date)) || new Date(entry.date).toISOString().slice(0, 10) !== entry.date
        || !text(entry.identifier, 150) || !link(entry.abstractUrl)
        || (entry.pdfUrl !== undefined && !link(entry.pdfUrl))) {
        throw new Error("Invalid publication metadata.");
      }
      seen.add(entry.id);
      return {id: entry.id, title: entry.title.trim(), authors: entry.authors.trim(), date: entry.date,
        ...(entry.titleTex === undefined ? {} : {titleTex: entry.titleTex.trim()}),
        identifier: entry.identifier.trim(), abstractUrl: entry.abstractUrl,
        ...(entry.pdfUrl === undefined ? {} : {pdfUrl: entry.pdfUrl})};
    });
  }
  api.registerPublicationCategory = category => {
    if (!category || !ids.includes(category.id) || !text(category.label, 100)
      || !text(category.description, 600) || !text(category.emptyTitle, 160) || !text(category.emptyMessage, 600)) {
      throw new Error("Invalid publication category.");
    }
    const key = "publications." + category.id;
    if (api.getData(key)) throw new Error("Duplicate publication category.");
    api.registerData(key, {id: category.id, label: category.label.trim(), description: category.description.trim(),
      emptyTitle: category.emptyTitle.trim(), emptyMessage: category.emptyMessage.trim(), entries: entriesFor(category.entries)});
  };
  api.getPublicationCategories = () => ids.map(id => {
    const category = api.getData("publications." + id);
    if (!category) throw new Error("Publication categories are unavailable.");
    return {...category, entries: entriesFor(category.entries)};
  });
})();
