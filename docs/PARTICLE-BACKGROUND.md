# 粒子背景维护与回退

功能源码位于 [粒子模块](../modules/particle-background/README.md)，独立注册为 `services`，覆盖主页面而不改变栏目内容。局部邻域规则参考 [Craig Reynolds 的 Boids 说明](https://www.red3d.com/cwr/boids/)中分离、对齐与聚集的思路；实际实现采用网格聚合与平滑 curl 流场，并非精确复现 Boids 或严格物理模型。画面变化来自局部速度与密度反馈、流场及鼠标扰动，不只是独立随机漂移。

## 参数

默认值集中于 `modules/particle-background/config.js`。尺寸、视口和鼠标坐标使用 CSS 像素，速度使用 CSS 像素/秒；内部模拟时间使用秒。

| 键 | 默认值 | 允许范围及用途 |
|---|---|---|
| `enabled` | `true` | 布尔值；整体开关 |
| `count` | `4800` | 整数 0–12000；1440×900 参考视口的数量预算 |
| `mobileCount` | `1400` | 整数 0–4000；窄屏或粗指针设备的数量上限 |
| `averageSpeed` | `22` | 0–160；平均运动速度参数 |
| `minSize` / `maxSize` | `0.32` / `1.15` | 各 0.15–3，最小值不大于最大值；粒子尺寸 |
| `opacity` | `0.6` | 0–1；整体透明度 |
| `interactionRadius` | `170` | 20–450；鼠标扰动范围 |
| `interactionStrength` | `1` | 0–5；鼠标旋转及排斥强度 |
| `alignment` | `0.7` | 0–3；局部速度对齐权重 |
| `cohesion` | `0.18` | 0–3；局部聚集权重 |
| `separation` | `0.6` | 0–3；密集区分离权重 |
| `flowScale` | `190` | 50–800；平滑流场空间尺度 |
| `turbulence` | `0.65` | 0–3；流场扰动强度 |
| `fps` | `45` | 15–60；绘制频率上限，不是实际帧率保证 |
| `maxPixelRatio` | `1.5` | 1–2；Canvas 像素比上限 |
| `adaptiveQuality` | `true` | 布尔值；持续慢帧时减少数量 |

实际数量按视口面积缩放：桌面最多 12000；宽度不大于 760 或粗指针设备再受 `mobileCount` 限制，`count: 0` 明确禁用粒子数量。不要将 `count` 参数直接当作每个设备的实际数量。

自适应质量累积慢帧后仅降低数量，最低保留当前视口预算的 55%；它不承诺特定硬件的帧率。重新配置会恢复完整预算，再重新评估；关闭自适应可用于比较，不宜据一次桌面表现提高手机预算。

## 调整与诊断

控制台可临时调整，没有前台参数面板，也不写入浏览器持久存储：

```js
Homepage.particleBackground.configure({ count: 3600, mobileCount: 1000 });
Homepage.particleBackground.getConfig();
Homepage.particleBackground.getStats();
Homepage.particleBackground.configure({ enabled: false });
```

`configure()` 返回冻结的完整配置，非法补丁在生效前抛出英文错误。需要永久调整时修改源码默认值，执行 `npm run assemble` 与 `npm run check`，再验证桌面、窄屏、键盘、鼠标、详情、减少动态效果和文件打开。生成的 `index.html` 禁止手改。

`getStats()` 返回诊断快照，不包含文章、作者会话或凭据。主要字段：

| 字段 | 含义 |
|---|---|
| `requestedCount` / `count` | 当前视口完整预算 / 当前模拟数量 |
| `frameCount` / `running` | 已完成动画帧 / 当前是否安排动画 |
| `width` / `height` / `pixelRatio` | CSS 视口尺寸及实际 Canvas 像素比 |
| `meanSpeed` / `maxSpeed` / `finite` | 速度统计及数值是否有限 |
| `stepMs` / `frameMs` | 最近模拟耗时 / 平滑后的模拟与绘制耗时，不能直接换算为屏幕实际帧率 |
| `pointerActive` / `reducedMotion` | 鼠标扰动状态 / 当前减少动态效果偏好 |
| `adaptiveLevel` / `status` | 数量预算系数 / 当前生命周期状态 |

`status` 为 `unsupported`、`disabled`、`reduced`、`paused`、`running` 或 `disposed`。后台或手动暂停保留画面，详情打开时暂停并隐藏画面；减少动态效果静态显示。Canvas 无法使用或绘制失败则停用效果。控制器的 `resume()` 仍遵守后台、详情及减少动态效果限制。

## 分支与回退

2026-10-11 的基线为 `93bf256`：`main` 与 `backup/pre-emergence-2026-10-11` 保留该版本；新功能在 `feat/emergent-particle-background` 开发。本次交付仍保留功能分支，不整合 `main`、不推送。旧源码包 `../outputs/personal-homepage-pre-emergence-2026-10-11.zip` 包含基线的 157 个文件，可恢复旧静态网站，但不含 Git 元数据或被忽略的私密资料。

按需要选择回退方式：

1. 临时关掉效果：调用 `configure({ enabled: false })`，刷新后恢复默认。长期关掉：将源码 `enabled` 改为 `false` 后装配、检查；无需删除模块或历史。
2. 回到本地旧版本：先检查并保存当前所有未提交改动。可在功能分支提交，或使用 `git stash push --include-untracked` 保存已跟踪及未跟踪文件；仍需单独保留所需的忽略文件，并确认保存完整。之后才运行 `git switch main` 或 `git switch backup/pre-emergence-2026-10-11`，再检查、装配和预览。切回功能分支后按保存方式恢复，处理差异，不丢弃其他维护工作。
3. 从旧包恢复：解压到独立目录，核对英文页面和资源后预览；用户要求部署旧网站时再上传包内文件。不要用旧包直接覆盖当前源码或用户新增资料。ZIP 不会自动清理远端新增文件，必要清理应另行核对范围。
4. 将来已发布后回退：在部署分支创建明确的 `git revert <功能提交>` 回退提交，保留后续文章、附件和其他改动，再检查、实测及按授权发布。若涉及多个提交，先核对提交范围与冲突；不使用硬重置、强制切换、强制推送或删目录替代回退。

旧测试属于旧版本证据；本轮粒子的实际环境、性能观测和未覆盖项见 [测试记录](modules/particle-background.md)，本轮已通过 201 个浏览器流程与 227 条离线断言。模拟视口不代表手机真机，测试机器的耗时不代表所有设备。
