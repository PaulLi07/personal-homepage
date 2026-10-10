# 学术概览模块测试记录

- 就近说明：[模块 README](../../modules/academic/README.md)。
- 测试日期：2026-10-10（北京时间）；改动范围：Experience 改名、模块路径与共享详情回归。
- 实际环境：chromium 151.0.7922.34、firefox 153.0、webkit 26.5；各测 1440×900、390×844、320×780。
- 发布路径：临时 HTTP 服务的 `/personal-homepage/`；命令与原始报告说明见 [实测总记录](../COMPATIBILITY.md)。

## 兼容性测试

| 检查项 | 结果 | 实际证据与范围 |
|---|---|---|
| 当前四栏目 | 通过 | experience / publications / notes / projects 逐项打开、封面与空条目、Escape 关闭与入口焦点恢复 |
| 概览预览与布局 | 通过 | Notes 聚焦更新预览，桌面 Projects 悬停更新预览；三内核、三视口图片及英文文字、无水平溢出 |
| 详情路由 | 通过 | 四栏目直达、刷新及关闭落到 `#academic`；旧 `#academic/research` 规范为 `#academic/experience` |
| 键盘与历史 | 通过 | Experience 用 Enter 打开、Tab / Shift+Tab 留在弹窗；切到 Publications、前进 / 后退通过 |
| 共享行为 | 通过 | 正常与减少动态效果；三内核直接文件打开 Moments 的共用服务冒烟测试 |
| 初始化隔离 | 通过 | 注入 life 初始化故障后，contact 初始化与 academic 详情及关闭服务继续工作 |

`npm run check` 的生成物、语法、资源与注册检查通过，静态证据与上述浏览器实测分开。2026-10-09 的旧栏目重构证据保留在总记录历史章节，不用于替代本轮回归。

未覆盖项：手机真机、品牌及历史版本浏览器、线上新部署、外部链接实际跳转。Chromium / WebKit 窄屏含触摸模拟，Firefox 窄屏为视口与鼠标键盘模拟；文件打开仅验证 Moments，共享服务通过不代表学术栏目逐项文件测试。
