/* 加密内容的生命周期完全由 Relationship 模块管理。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerDetailView("life", "relationship", {
    render(context) {
      return api.createRelationshipView({payload: api.getEncryptedRelationship}).render(context);
    }
  });
})();
