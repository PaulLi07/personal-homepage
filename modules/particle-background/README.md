# 粒子背景

为主页面提供克制的白色尘埃流、局部涡旋与鼠标扰动。局部网格汇总邻域速度和密度，再结合平滑 curl 流场形成群体运动；这是艺术性运动模型，不是严格物理仿真。没有图片、网络请求、凭据或第三方运行时依赖，网页原有英文内容由原模块维护。

## 文件与接入

| 文件 | 职责 |
|---|---|
| `config.js` | 默认参数、边界校验、视口数量预算 |
| `simulation.js` | 粒子状态、局部规则、流场与数值统计 |
| `background.js` | Canvas 绘制、鼠标输入、暂停、降级与清理 |
| `styles.css` | 主页面的背景、粒子和前景层级 |

在 `app/site.json` 的 `services` 中声明样式及按上述顺序排列的三个脚本。`app/main.js` 只调用 `Homepage.particleBackground.mount({ root, reducedMotion, dialog })`，不承载模拟或绘制逻辑。服务不登记页面分区；`credits.html` 不加载它。

## 公共接口

- `mount({ root, reducedMotion, dialog, config? })`：接收主页面 `#main`、减少动态效果的 `MediaQueryList` 和详情 `#detail-dialog`，返回控制器；重新挂载先卸载旧实例。
- 服务及控制器提供 `configure(patch)`、`getConfig()`、`getStats()`、`dispose()`；控制器另有 `pause()` 与 `resume()`。配置拒绝未知键、非有限值、越界值以及 `minSize > maxSize`，数量要求整数。
- Canvas 使用 `.particle-background__canvas`，固定到当前视口、`aria-hidden` 且不接收指针事件。`has-particle-background` 仅在效果可用且启用时建立背景图片、粒子、内容的层级；现有图片、文字、链接及按钮位于前景。
- 后台标签页和打开的详情暂停绘制；详情同时隐藏 Canvas。减少动态效果时保留静态画面。Canvas 不可用或绘制失败时退回原页面，不阻断导航与内容。
- 鼠标监听为被动监听，不要求按键拖动、不夺取点击和滚动，也不对触摸输入施加扰动。卸载取消动画并清理监听器、观察器、Canvas 与模拟状态。

## 维护与验证

运行 `npm run test:particle-simulation` 验证配置与模拟核心，`npm run test:particles` 实测浏览器行为。后者使用维护环境的 Playwright，自启临时子路径服务器，报告和截图保存于忽略的 `artifacts/`；不访问真实作者凭据或外部网络，也不改变正式文章。

调整默认值只改 `config.js`，随后装配、检查并实测。临时调试可在控制台调用 `Homepage.particleBackground.configure({ enabled: false })`；刷新会恢复源码默认值。参数、统计及保存改动后的分支回退见 [维护指南](../../docs/PARTICLE-BACKGROUND.md)。

本轮保留 `feat/emergent-particle-background`，不整合 `main`、不推送。本轮 201 个三内核浏览器流程与 227 条离线断言通过；环境、人工负载及未覆盖项统一记录在 [模块测试记录](../../docs/modules/particle-background.md)。
