// 保留原工具与 require 接口；不改变密码输入方式。
module.exports = require("./tools/relationship.cjs");
if (require.main === module) module.exports.main().catch(error => { console.error(error.message); process.exitCode = 1; });
