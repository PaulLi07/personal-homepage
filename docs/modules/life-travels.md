# 旅行详情测试记录

- 就近说明：[模块 README](../../modules/life/travels/README.md)；入口：`#life/travels`。
- 测试日期：2026-10-10（北京时间）；改动范围：Places 改为 Travels、路径与旅行占位说明。
- 实际环境：chromium 151.0.7922.34、firefox 153.0、webkit 26.5；各测 1440×900、390×844、320×780。
- 环境路径：临时 HTTP 服务的 `/personal-homepage/`；基础报告为 `artifacts/compatibility-results.json`，报告不随源码交付。

## 兼容性测试

| 检查项 | 结果 | 实际证据 |
|---|---|---|
| 入口、占位封面与空旅行列表 | 通过 | 当前 travels 按钮逐环境打开，英文标题、图片加载与空状态正常 |
| 详情直达与刷新 | 通过 | `#life/travels` 直达、刷新、关闭落到 `#life`；旧 `#life/places` 自动规范到新地址 |
| 关闭、焦点与切换 | 通过 | Escape 关闭恢复 travels 入口焦点；功能夹具从已解锁 Relationship 切到 Travels，再返回时需重新解锁 |
| 布局与共享服务 | 通过 | 三内核、三视口无详情横向溢出、相对资源正常；共用 Tab / Shift+Tab 与历史案例在 Experience / Publications 实测 |

父组逐项证据见 [life](life.md)，环境、命令与范围见 [实测总记录](../COMPATIBILITY.md)。栏目仍为待用户补充的公开占位内容，不把旧 Places 的历史结果当作本轮证据。

未覆盖项：手机真机、品牌或历史浏览器版本、线上新部署、外部链接实际跳转；文件打开只验证共用 Moments 服务，本栏目在 HTTP 子路径验证。窄屏为视口 / 触摸模拟。
