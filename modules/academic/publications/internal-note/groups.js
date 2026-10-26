/* 内部材料按课题组独立登记；只保存公开展示的元信息与HTTPS外链。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const key = "publications.internal-note.groups";
  const object = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const text = (value, limit) => typeof value === "string" && Boolean(value.trim()) && value.length <= limit;
  const id = value => typeof value === "string" && value.length <= 64 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  function link(value) {
    if (!text(value, 2000) || value !== value.trim() || !value.startsWith("https://") || /[\u0000-\u0020\u007f]/.test(value)) return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
    } catch (_) { return false; }
  }
  function summaryFor(summary) {
    if (!Array.isArray(summary) || !summary.length || summary.length > 20) throw new Error("Invalid internal note summary.");
    return summary.map(paragraph => {
      if (!object(paragraph) || !text(paragraph.text, 5000)
        || (paragraph.tex !== undefined && !text(paragraph.tex, 2400))) throw new Error("Invalid internal note summary.");
      return {text: paragraph.text.trim(), ...(paragraph.tex === undefined ? {} : {tex: paragraph.tex.trim()})};
    });
  }
  function entriesFor(entries) {
    if (!Array.isArray(entries) || entries.length > 500) throw new Error("Invalid internal note records.");
    const seen = new Set();
    return entries.map(entry => {
      if (!object(entry) || !id(entry.id) || seen.has(entry.id) || !text(entry.identifier, 150)
        || !text(entry.title, 800) || !text(entry.authors, 300) || !link(entry.url)
        || (entry.titleTex !== undefined && !text(entry.titleTex, 1600))) throw new Error("Invalid internal note metadata.");
      seen.add(entry.id);
      return {id: entry.id, identifier: entry.identifier.trim(), title: entry.title.trim(),
        ...(entry.titleTex === undefined ? {} : {titleTex: entry.titleTex.trim()}),
        authors: entry.authors.trim(), summary: summaryFor(entry.summary), url: entry.url};
    });
  }
  function groupsFor(groups) {
    if (groups === undefined) return [];
    if (!Array.isArray(groups)) throw new Error("Internal note groups are unavailable.");
    const seen = new Set();
    return groups.map(group => {
      if (!object(group) || !id(group.id) || seen.has(group.id) || !text(group.label, 100)
        || !text(group.description, 600)) throw new Error("Invalid internal note group.");
      seen.add(group.id);
      return {id: group.id, label: group.label.trim(), description: group.description.trim(), entries: entriesFor(group.entries)};
    });
  }
  api.registerInternalNoteGroup = group => {
    const groups = groupsFor(api.getData(key));
    const candidate = groupsFor([group])[0];
    if (groups.some(item => item.id === candidate.id)) throw new Error("Duplicate internal note group.");
    api.registerData(key, [...groups, candidate]);
  };
  api.getInternalNoteGroups = () => groupsFor(api.getData(key));
})();
