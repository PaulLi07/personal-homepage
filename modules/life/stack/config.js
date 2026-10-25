/* 生活照片堆只维护入口呈现；博客、旅行和加密内容继续由各栏目管理。 */
(function () {
  "use strict";
  const api = window.Homepage.lifeStack = window.Homepage.lifeStack || {};
  api.config = Object.freeze({
    defaultKey: "moments",
    entries: Object.freeze([
      Object.freeze({ key: "moments", title: "Moments", description: "Small moments, collected along the way." }),
      Object.freeze({ key: "travels", title: "Travels", description: "Places, journeys, and a change of perspective." }),
      Object.freeze({ key: "creations", title: "Creations", description: "Things made with curiosity and care." }),
      Object.freeze({ key: "relationship", title: "Relationship", description: "A private corner for meaningful connections." })
    ])
  });
})();
