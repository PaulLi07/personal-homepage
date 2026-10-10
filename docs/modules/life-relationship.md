# 关系空间详情测试记录

- 就近说明：[模块 README](../../modules/life/relationship/README.md)；入口：`#life/relationship`。
- 测试日期：2026-10-10（北京时间）；改动范围：Relationship 独立加密视图及关闭生命周期。
- 实际环境：chromium 151.0.7922.34、firefox 153.0、webkit 26.5；各测 1440×900、390×844、320×780。
- 环境路径：临时 HTTP 服务的 `/personal-homepage/`；基础与功能报告分别为 `artifacts/compatibility-results.json`、`artifacts/feature-results.json`，不随源码交付。
- 正式状态：`encrypted.js` 仍登记 `null`，没有实际私密内容或初始密码；解密测试用 HTTP 响应替换提供临时密文，未修改正式文件。

## 兼容性测试

| 检查项 | 结果 | 实际证据 |
|---|---|---|
| 未配置状态、资源与路由 | 通过 | 默认空密文显示英文未配置提示；封面加载、按钮打开、直达 / 刷新 / 关闭落点正常，旧 `#life/outside` 规范到 `#life/relationship` |
| 输入与真实解密 | 通过 | 原生 Tab 到达口令框；空口令为英文提示，错误口令拒绝并清空输入；临时正确口令实际解密，正文按纯文本显示且标签不执行 |
| 锁定与生命周期 | 通过 | 主动 Lock、切到 Travels 后重入、关闭后重开均需重新解锁；Escape 关闭恢复入口焦点 |
| DOM 与存储清理 | 通过 | 锁定、切换及关闭后临时私密正文不在 DOM；口令不进入 URL、Cookie、历史或持久存储，localStorage / sessionStorage 保持为空 |
| 三视口布局与共享服务 | 通过 | 九个环境无详情横向溢出；共用正常 / 减少动态效果、键盘与历史回归通过 |
| 离线算法与格式 | 通过 | `npm run test:security` 的 9 项算法 / 边界回归、`npm run relationship:check` 的正式空密文格式检查通过 |
| 私密目录打包排除 | 通过 | Git 工作区与无 Git 解压目录两种源码包均排除临时 `.private/`、`.git/`、`artifacts/`、`node_modules/`；完整性和解压后检查通过，夹具已清理 |

父组证据见 [life](life.md)，算法、打包与环境概要见 [实测总记录](../COMPATIBILITY.md)。口令与密文夹具只用于本轮测试，没有设置用户密码或发布真实私密内容。

未覆盖项：手机真机、品牌或历史版本浏览器、线上部署、用户真实密文和口令；文件打开未单独实测此栏目的解密。DOM / 存储断言不证明浏览器堆内存或密码管理器的物理清除。窄屏为视口 / 触摸模拟。
