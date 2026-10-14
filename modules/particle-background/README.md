# 粒子背景

仅为主页面公开标记的纯黑区域提供微小、密集、清晰的白色实心圆点、局部涡旋与鼠标扰动，禁止模糊光晕。粒子锚定文档坐标，随页面上下滚动同向等距移动；鼠标只在附近产生局部搅动。局部网格汇总邻域速度和密度，再结合平滑 curl 流场形成群体运动；这是艺术性运动模型，不是严格物理仿真。没有图片、网络请求、凭据或第三方运行时依赖，网页原有英文内容由原模块维护。

## 文件与接入

| 文件 | 职责 |
|---|---|
| `config.js` | 默认参数、边界校验、视口数量预算 |
| `simulation.js` | 粒子状态、局部规则、流场与数值统计 |
| `background.js` | 白色实心圆点、页面滚动定位、屏幕遮罩与输入、暂停、降级与清理 |
| `styles.css` | Canvas 与公开粒子表面的前景层级；纯黑背景归声明该表面的模块 |

在 `app/site.json` 的 `services` 中声明样式及按上述顺序排列的三个脚本。`app/main.js` 只调用 `Homepage.particleBackground.mount({ root, reducedMotion, dialog })`，不承载模拟或绘制逻辑。服务不登记页面分区；`credits.html` 不加载它。

## 公共接口

- `mount({ root, reducedMotion, dialog, config? })`：接收主页面 `#main`、减少动态效果的 `MediaQueryList` 和详情 `#detail-dialog`，返回控制器；重新挂载先卸载旧实例。
- 服务及控制器提供 `configure(patch)`、`getConfig()`、`getStats()`、`dispose()`；控制器另有 `pause()` 与 `resume()`。配置拒绝未知键、非有限值、越界值以及 `minSize > maxSize`，数量要求整数。
- Canvas 使用 `.particle-background__canvas`，作为当前视口的绘制窗口、`aria-hidden` 且不接收指针事件；粒子本身使用文档坐标，不锚定屏幕。只在 `#main` 内公开 `data-particle-surface="black"` 区域的可见矩形中绘制，并排除其内 `img` 矩形；当前 About、Academic、Life 各自声明该属性并设置 `#000`。Academic / Life 的细线与相框由自己的模块维护；Home 与 Contact 保留图片背景、不绘粒子。`has-particle-background` 不代表全页面都可以绘制。
- 声明的黑色区域还须通过纯黑、不透明、无背景图的计算样式校验；公共 `data-particle-foreground` 管前景，`data-particle-exclude` 可由导航或其他遮挡区域声明。服务不使用具体栏目的内部类名；图片外包矩形保守多留一像素。
- 只自动识别区域里的 `img`；CSS 背景图片容器、SVG、视频等其他视觉内容须由所属模块声明 `data-particle-exclude`。前景属性会设置 `position: relative`，绝对或粘性定位组件请用普通外层容器接入。
- 直接使用 Canvas `arc` 填白，不使用 sprite、渐变或 blur；`minSize` / `maxSize` 表示 CSS 像素半径，默认 `0.4` / `0.85`，`opacity` 默认 `0.85`。不要添加光晕或把公开标记附到图片背景上。
- 后台标签页和打开的详情暂停绘制；详情同时隐藏 Canvas。减少动态效果时保留静态画面；滚动、公开区域样式变化、图片加载及 CSS 过渡结束仍刷新裁剪与图片排除，补绘按帧合并且不推动模拟。Canvas 不可用或绘制失败时退回原页面，不阻断导航与内容。
- 鼠标监听为被动监听，不要求按键拖动、不夺取点击和滚动，也不对触摸输入施加扰动。卸载取消动画并清理监听器、观察器、Canvas 与模拟状态。
- 页面每滚动 1 CSS 像素，粒子相对屏幕同向移动 1 CSS 像素；直接读取实际 `scrollX/Y`，不拦截滚轮，也不延迟或平滑滚动偏移。滚轮、键盘、触摸滚动、锚点及历史恢复共用这条路径；减少动态效果和手动暂停时仍同步页面位置，不推进模拟。
- 视口大小的 Canvas 保持固定，但只充当绘制窗口。粒子周期坐标减去页面滚动量后绘制，并按视口边缘回绕补齐，不分配整页高的画布。黑区 / 图片遮罩仍取当前屏幕矩形；`simulation.step()` 的 `offsetX/Y` 传入负滚动量，局部搅动对准可见粒子。
- `getStats().scrollX/Y` 是最近绘制采用的页面滚动量，`meanSpeed` 只统计自主模拟。2026-10-14 按用户澄清移除了上一轮误加的整层鼠标视差、`parallaxDistance` / `parallaxResponse` 配置及 `parallaxX/Y` 统计；不再提供它们作为调整接口。

## 维护与验证

运行 `npm run test:particle-simulation` 验证配置与模拟核心，`npm run test:particles` 实测浏览器行为。后者使用维护环境的 Playwright，自启临时子路径服务器，报告和截图保存于忽略的 `artifacts/`；不访问真实作者凭据或外部网络，也不改变正式文章。

调整默认值只改 `config.js`，随后装配、检查并实测。临时调试可在控制台调用 `Homepage.particleBackground.configure({ enabled: false })`；刷新会恢复源码默认值。参数、统计及保存改动后的分支回退见 [维护指南](../../docs/PARTICLE-BACKGROUND.md)。

本轮保留 `feat/emergent-particle-background`，不整合 `main`、不推送；本次滚动修正前的回退点为 `backup/pre-scroll-follow-2026-10-14`（`a7f81d1`），更早的备份继续保留。最新测试范围、结果与未覆盖项见 [模块测试记录](../../docs/modules/particle-background.md)，不要将历史报告当作本次验证。
