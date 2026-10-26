/* 项目登记与父目录接线；不假定后续人物资料或具体功能。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerAcademicProject({
    id: "physicists",
    title: "Physicists",
    description: "A new project, ready for future updates.",
    summary: "In preparation"
  }, {
    render({host, signal}) {
      return api.createPhysicistsView().render({host, signal});
    }
  });
})();
