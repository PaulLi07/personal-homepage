/* Experience 自己连接学术日志与统一作者服务；共享弹窗只管理路由和生命周期。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerDetailView("academic", "experience", {
    render({host, route, signal, navigate}) {
      if (route === "author") {
        return api.createAuthorEditor({
          collection: {
            id: "experience", label: "Experience", eyebrow: "Academic · Author workspace",
            editorTitle: "Write an academic log", noun: "entry", registration: "registerAcademicLogs",
            path: "modules/academic/experience/entries.js", getRecords: api.getAcademicLogs,
            normalize: api.normalizeAcademicLogs,
            fields: [
              {name: "kind", label: "Entry type", options: ["Research", "Learning", "Seminar", "Milestone"]},
              {name: "reference", label: "Reference link (optional)", type: "url", required: false}
            ]
          },
          onPublished(entry, entries) {
            api.registerAcademicLogs(entries);
            api.registerData("experience.lastPublished", entry.id);
            navigate(entry.id);
          },
          onCancel() { navigate(null); }
        }).render({host, signal});
      }
      const dispose = api.createAcademicLogView({
        entries: api.getAcademicLogs, onNavigate: navigate,
        onAuthorRequested() { navigate("author"); }
      }).render({host, route, signal});
      if (route && route === api.getData("experience.lastPublished")) {
        const notice = document.createElement("p");
        notice.className = "author-status";
        notice.setAttribute("role", "status");
        notice.textContent = "Published to GitHub. The live website may take a moment to update.";
        host.prepend(notice);
      }
      return dispose;
    }
  });
})();
