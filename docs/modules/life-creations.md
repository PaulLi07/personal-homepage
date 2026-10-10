# 创作详情测试记录

- 就近说明：[模块 README](../../modules/life/creations/README.md)；入口：`#life/creations`。
- 测试日期：2026-10-10（北京时间）；改动范围：生活 Notes 改为 Creations、路径与创作占位说明。
- 实际环境：chromium 151.0.7922.34、firefox 153.0、webkit 26.5；各测 1440×900、390×844、320×780。
- 环境路径：临时 HTTP 服务的 `/personal-homepage/`；基础报告为 `artifacts/compatibility-results.json`，报告不随源码交付。

## 兼容性测试

| 检查项 | 结果 | 实际证据 |
|---|---|---|
| 入口、占位封面与空作品列表 | 通过 | 当前 creations 按钮逐环境打开，英文标题、图片加载与空作品状态正常 |
| 详情直达与刷新 | 通过 | `#life/creations` 直达、刷新、关闭落到 `#life`；旧 `#life/notes` 自动规范到新地址 |
| 键盘与焦点 | 通过 | Escape 关闭恢复 creations 入口焦点；共用 Tab / Shift+Tab 与历史案例在 Experience / Publications 实测 |
| 布局与资源 | 通过 | 三内核、三视口无详情横向溢出、相对图片路径正常；共用正常 / 减少动态效果回归通过 |

父组逐项证据见 [life](life.md)，环境、命令与范围见 [实测总记录](../COMPATIBILITY.md)。栏目仍等待用户提供公开创作，不把旧 Notes 的历史结果当作本轮证据。

未覆盖项：手机真机、品牌或历史浏览器版本、线上新部署、外部链接实际跳转；文件打开只验证共用 Moments 服务，本栏目在 HTTP 子路径验证。窄屏为视口 / 触摸模拟。
