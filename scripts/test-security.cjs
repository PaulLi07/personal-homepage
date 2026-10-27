// 兼容原测试路径；实现按测试职责归类。
module.exports = require("./tests/test-security.cjs");
if (require.main === module) module.exports.main().catch(error => {
  console.error("加密算法回归失败：" + error.message);
  process.exitCode = 1;
});
