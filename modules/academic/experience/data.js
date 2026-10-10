/* 学术日志的数据约定归属于 Experience；共享层只提供命名空间登记。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const key = "experience.entries";
  const kinds = new Set(["Research", "Learning", "Seminar", "Milestone"]);
  const nonempty = value => typeof value === "string" && value.trim().length > 0;

  function validReference(value) {
    if (value === undefined || value === "") return true;
    if (typeof value !== "string" || value !== value.trim() || !/^https:\/\//i.test(value)) return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname);
    } catch { return false; }
  }

  api.validateAcademicLogs = function (entries) {
    if (!Array.isArray(entries) || entries.length > 500) throw new Error("Invalid academic log data.");
    const ids = new Set();
    for (const entry of entries) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.id !== "string"
        || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || entry.id === "author" || ids.has(entry.id)) {
        throw new Error("Invalid or duplicate entry address.");
      }
      ids.add(entry.id);
      if (typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
        || !Number.isFinite(Date.parse(entry.date)) || new Date(entry.date).toISOString().slice(0, 10) !== entry.date) {
        throw new Error("Invalid entry date.");
      }
      for (const field of ["title", "excerpt", "body"]) {
        if (!nonempty(entry[field])) throw new Error("An entry needs a title, excerpt and body.");
      }
      if (entry.title.length > 160 || entry.excerpt.length > 600 || entry.body.length > 50000
        || entry.id.length > 80 || entry.author !== "Yuhong Li") throw new Error("Invalid entry content or author.");
      if (!kinds.has(entry.kind)) throw new Error("Choose a valid academic entry type.");
      if (!validReference(entry.reference)) throw new Error("A reference link must use HTTPS.");
    }
    return entries;
  };
  api.normalizeAcademicLogs = entries => {
    api.validateAcademicLogs(entries);
    return entries.map(({id, title, date, excerpt, body, author, kind, reference}) => ({
      id, title, date, excerpt, body, author, kind, ...(reference ? {reference} : {})
    }));
  };
  api.registerAcademicLogs = entries => api.registerData(key, api.normalizeAcademicLogs(entries));
  api.getAcademicLogs = () => api.getData(key) || [];
})();
