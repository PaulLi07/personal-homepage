/* 公开配置只存密文；此接口不提供绕过口令的解锁状态。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerEncryptedRelationship = payload => api.registerData("relationship.encrypted", payload);
  api.getEncryptedRelationship = () => api.getData("relationship.encrypted");
})();
