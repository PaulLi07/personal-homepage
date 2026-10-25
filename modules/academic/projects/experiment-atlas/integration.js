/* 接入共用Projects详情；地图页面保持原生链接与浏览器历史。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerDetailView("academic", "projects", {
    render({host, signal}) {
      return api.createProjectsView({
        maps: api.getExperimentMaps,
        content: () => api.getContent().academic?.projects
      }).render({host, signal});
    }
  });
})();
