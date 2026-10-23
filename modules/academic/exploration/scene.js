/* 场景胶水只连接独立图窗、路牌与人物，不解释栏目数据。 */
(function () {
  "use strict";
  const api = window.Homepage.academicExploration;
  api.mountScene = function ({ root, details, reducedMotion }) {
    const gallery = api.createGallery({ root, details, config: api.config, reducedMotion });
    const releaseNavigation = api.createNavigation({ root, details, gallery });
    const walker = api.mountWalker({ root, config: api.config, reducedMotion });
    const unsubscribe = details.onSelect("academic", gallery.select);
    let destroyed = false;
    return function destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubscribe();
      releaseNavigation();
      gallery.destroy();
      walker.destroy();
    };
  };
})();
