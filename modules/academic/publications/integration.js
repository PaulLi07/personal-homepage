/* Publications 的独立分类视图接入既有弹窗，不创建第二套路由。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerDetailView("academic", "publications", {
    render({host, route, signal, navigate}) {
      return api.createPublicationsView({categories: api.getPublicationCategories, onNavigate: navigate})
        .render({host, route, signal});
    }
  });
})();
