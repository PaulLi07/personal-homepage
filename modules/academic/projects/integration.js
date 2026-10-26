/* Projects父层只连接目录、子项目和共用详情导航。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerDetailView("academic", "projects", {
    render({host, route, signal, navigate}) {
      return api.createProjectsView({
        projects: api.getAcademicProjects,
        viewFor: api.getAcademicProjectView,
        content: () => api.getContent().academic?.projects,
        onNavigate: navigate
      }).render({host, route, signal});
    }
  });
})();
