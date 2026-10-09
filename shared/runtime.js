/* 模块仅注册自己的入口和内容；胶水脚本负责初始化和传递共享服务。 */
(function () {
  "use strict";
  const sections = new Map();
  const content = Object.create(null);
  const validId = value => typeof value === "string" && /^[a-z]+$/.test(value);

  window.Homepage = {
    registerSection(module) {
      if (!module || !validId(module.id) || sections.has(module.id)) {
        throw new Error("Invalid or duplicate section registration.");
      }
      sections.set(module.id, module);
    },
    registerDetail(group, key, item) {
      if (!validId(group) || !validId(key)) throw new Error("Invalid detail registration.");
      if (!content[group]) content[group] = Object.create(null);
      if (content[group][key]) throw new Error("Duplicate detail registration.");
      content[group][key] = item;
    },
    getSections() { return Array.from(sections.values()); },
    getContent() { return content; }
  };
})();
