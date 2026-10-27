/* 物理地图作为一个独立项目登记，数量取自本项目公开地图接口。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerAcademicProject({
    id: "physics-maps",
    title: "Physics Maps",
    description: "Explore physics experiments through interactive world maps.",
    summary: () => {
      const count = api.getExperimentMaps().length;
      return count + (count === 1 ? " map" : " maps");
    }
  }, {
    renderEntry({host, signal, navigate}) {
      return api.createPhysicsMapsEntry().render({host, signal, navigate});
    },
    render({host, signal}) {
      return api.createExperimentAtlasView({maps: api.getExperimentMaps}).render({host, signal});
    }
  });
})();
