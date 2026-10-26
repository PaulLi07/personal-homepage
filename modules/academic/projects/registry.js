/* 项目独立登记元信息与视图；父目录通过公开接口读取，不解释具体项目。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const projects = new Map();
  const text = (value, limit) => typeof value === "string" && Boolean(value.trim()) && value.length <= limit;
  api.registerAcademicProject = function (descriptor, view) {
    if (!descriptor || typeof descriptor.id !== "string" || descriptor.id.length > 64
      || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(descriptor.id)
      || !text(descriptor.title, 120) || !text(descriptor.description, 600)
      || !(typeof descriptor.summary === "function" || text(descriptor.summary, 120))
      || !view || typeof view.render !== "function") throw new Error("Invalid academic project.");
    if (projects.has(descriptor.id)) throw new Error("Duplicate academic project.");
    projects.set(descriptor.id, {
      id: descriptor.id, title: descriptor.title.trim(), description: descriptor.description.trim(),
      summary: descriptor.summary,
      view: Object.freeze({render: options => view.render(options)})
    });
  };
  api.getAcademicProjects = function () {
    return Object.freeze(Array.from(projects.values(), project => {
      let summary = "";
      try {
        const value = typeof project.summary === "function" ? project.summary() : project.summary;
        if (text(value, 120)) summary = value.trim();
      } catch (_) { /* 单项目统计缺失不阻断其他项目入口。 */ }
      return Object.freeze({id: project.id, title: project.title, description: project.description, summary});
    }));
  };
  api.getAcademicProjectView = id => projects.get(id)?.view || null;
})();
