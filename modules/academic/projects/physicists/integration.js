/* 项目登记只连接本地摘要和入口，不将整份档案加载进主页。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerAcademicProject({
    id: "physicists",
    title: "Physicists",
    description: "Explore the people and milestones that have shaped physics through an interactive historical archive.",
    summary() {
      const count = api.getData("physicists:archive")?.peopleCount;
      return Number.isSafeInteger(count) && count > 0 ? count.toLocaleString("en") + " physicists" : "";
    }
  }, {
    renderEntry({host, signal}) {
      return api.createPhysicistsView().render({host, signal, entryOnly: true});
    },
    render({host, signal}) {
      return api.createPhysicistsView().render({host, signal});
    }
  });
})();
