# 项目详情测试记录

<a id="project-cards-2026-10-27"></a>
## 2026-10-27：两张图文入口与Physicists直达

将既有Physics Pioneers三张照片卡片移到Projects目录，作为Physicists的原生入口，一次点击直接打开完整档案；不再通过中间介绍页。Physics Maps使用同一结构及对齐的图文卡片，预览取本模块的中微子/暗物质缩略图，进入原两地图目录。移除BESIII入口及空合作组区域，保留GitHub；人物、地图、Publications和Internal note数据及图片保持独立且无差异。

项目注册视图新增可选 `renderEntry({host, signal, navigate})`，父目录管理独立入口宿主及取消清理；公共工厂 `createAcademicProjectEntry()`只维护实际共用的结构与导航行为，不读取人物或地图私有数据。完整人物档案的返回改为Projects；旧 `/physicists`仅兼容既有书签。

### 实际检查

- `npm run test:projects-directory`通过13流程、180断言：双原生入口、人物一步直达、地图普通/修饰键/中键行为、动态统计、安全文本、可选入口向后兼容、单入口失败隔离、重复挂载、取消与幂等清理。
- `npm run test:physicists`通过9文件、96项测试；人物档案本地重建成功，返回目标/相对层级及741份导入JSON和图片核对通过。元数据只读检查通过，科学数据和图片未变化。
- `test-academic-profile.cjs`的Projects断言已适配新入口、保留GitHub及移除BESIII，语法检查通过；未运行旧三内核浏览器矩阵，不将适配等同于矩阵通过。
- 主页装配、`npm run check`和 `git diff --check`通过。About原人像SHA256仍为 `cc79adfc8573183f58116111bd72326688404b3306a9c07ad4d05b732de66635`，保留用户未提交字节且不纳入本次提交。

### 浏览器实测

使用Codex内置浏览器IAB，工具未提供可确认的内核版本。2026-10-27以正常动画实际预览下列尺寸；手机为浏览器视口模拟，没有模拟原生触摸或使用手机真机。

| 视口 | 两卡片宽×高（CSS像素，约） | 结果 |
|---|---|---|
| 1440×1000 | 672.13×384.28 | 左图右文；同宽同高、文字列起点一致；两张地图和三张照片正常，整体无横向溢出 |
| 1024×900 | 487.63×370.28 | 两卡片同宽同高，图文换行正常，未出现越出视口的入口内容 |
| 390×844 | 339×486.19 | 图片在上、文字在下，图窗均224px，照片/地图与统计正常；无横向溢出 |
| 320×780 | 269×513.19 | 两卡片同宽同高，长人名及说明换行可读，入口子元素越界数为0 |

桌面和手机均从Projects点击Physicists一次后直接到完整档案H1，`← Projects`返回总目录并恢复两入口；地图入口Enter可进入两地图目录，252/297统计保留，All projects返回正常。浏览器后退/前进可恢复目录与地图子页。目录没有BESIII链接或Research collaborations区，GitHub仍是单独的正常外链。

临时 `/personal-homepage/` HTTP前缀下实际完成：目录→完整人物档案→Projects→Physics Maps；入口/返回保持仓库路径前缀，人物H1与两地图入口均可见。最终浏览器页面错误/警告为空。旧预览标签停留在已停止服务的连接错误页，重启8767后使用同一IAB中的新预览标签复测；此故障来自旧预览会话，不属于生产页面错误。

截图、离线测试输出与视口记录保存在被忽略的 `artifacts/project-cards-2026-10-27/`。本轮未验证其他内核/旧版本浏览器、手机真机与原生触摸、线上Pages发布，未重跑完整地图筛选矩阵；本轮未修改地图科学数据、几何或档案。没有读取凭据或向GitHub发表内容。

任务分支 `style/projects-visual-entries`，回退 `backup/pre-project-cards-2026-10-27`指向 `6a6fbd9`；本轮只保存本地提交，未推送。

<a id="project-directory-2026-10-27"></a>
## 2026-10-27：独立项目目录与Physicists占位

父Projects只展示Physics Maps与Physicists两个项目；进入Physics Maps后才显示中微子、暗物质两地图。Physicists仅有准备中状态及简短说明，等待用户提供具体内容；BESIII与GitHub保留在父目录独立的Research collaborations区。父目录、注册接口、子视图及各自样式分开维护，沿用共享详情单slug路由和焦点/历史；地图顶栏品牌和返回目标改为Physics Maps，原地图档案/科学数据/图片未变。

### 实际验证

- `npm run test:projects-directory`：8流程76断言，离线内存DOM验证注册冻结/动态地图数/非法和重复登记、父目录无地图、子页两图元数据、合作组隔离、Physicists占位、未知/故障项目回退、导航/取消/重复挂载与幂等清理。
- macOS / Codex应用内浏览器实看1440×1000、390×844、320×780；工具未提供引擎/精确版本，手机为模拟。父目录2项目且地图卡片0，Physics Maps两地图252/297计数，Physicists文案和状态正确；各检查视口整页与详情横向溢出0，手机地图单列分别339/269px。
- 两地图均实际进入并加载252/297目录，地图页切换和Physics Maps返回链接通过；返回后仍在地图子项目、两图可见且没有合作组混入。新项目Enter进入、直达刷新、All projects返回、浏览器后退/前进通过；未知项目有英文提示并可Enter返回目录。Escape关闭、从Academic路牌以Enter重开再关闭，焦点恢复到Projects入口。
- 临时 `/personal-homepage/` HTTP前缀下实际执行项目目录→Physics Maps→中微子地图→Physics Maps返回，最终路径保留仓库前缀，两图可见且无横向溢出。临时服务已停止，正式8767预览保留。Notes切换时项目DOM清理为0，返回Projects恢复2入口；最终浏览器警告/错误日志为空。
- `sync_shell.py --check`通过；`verify_portable.py --json`通过，549档案、549本地图片、1681项本地引用错误0。该工具只证明资源路径闭合，本轮未重跑旧51项地图逻辑测试或完整筛选/档案矩阵；已有科学数据无差异。

装配、只读检查与差异检查通过。截图/报告位于忽略目录 `artifacts/projects-directory-2026-10-27/`，含 `directory-desktop.png`、`directory-mobile-390.png`、`physics-maps-desktop.png`、`physics-maps-mobile-390.png`、`physicists-desktop.png`、`physicists-mobile-320.png`、`offline-tests.txt`和`portable-static.json`。未测试独立Chrome/Firefox/Safari、真机/真实触摸、原生减少动态偏好、file://与线上部署；单内核模拟不等于跨浏览器或真机。

分支 `feat/projects-directory`，回退 `backup/pre-project-directory-2026-10-27`（`9df31f1`）。保留用户未提交的人像文件，未请求推送。以下旧测试属于其对应历史阶段。

## 2026-10-25：Experiment Atlas接入

本轮Projects使用自定义详情视图，分为Experiment Atlas与Research collaborations：桌面两列、手机单列直角地图卡片，保留原BESIII合作组、GitHub和Earthrise封面资料。中微子与暗物质各有独立页面、返回入口、地图切换，以及完全保存在主页内的源码、数据、英文档案和图片；当前合计549条记录、549张代表图片，日常重建不需要原Web目录。

- 维护入口：[Projects说明](../../modules/academic/projects/README.md)、[地图集说明](../../modules/academic/projects/experiment-atlas/README.md)。
- **本轮实际测试环境、命令、浏览器证据与未覆盖范围统一记录于[实验地图集接入记录](experiment-atlas.md)**；本页保留历史证据，不据此宣称新地图功能已经通过。
- 后续扩展须重新检查Projects入口与响应式卡片、BESIII/GitHub目标、地图普通链接、共享详情切换/关闭，以及地图返回后的导航与焦点；地图筛选、档案、图片、深链和子路径覆盖在上述接入记录维护。
- 入口统计与预览由本地档案生成；新增地图同时维护registry、Academic `standalonePages`、元数据、导航、装配及兼容性记录。只读路径检查只能证明依赖闭合，不能代替浏览器、科学资料或图片复用许可审核。

## 2026-10-23：Apple 风格更新

桌面通过实际栏目页签打开，BESIII条目和GitHub链接正常；未访问外部站点，本轮未单独测试手机Projects。

环境为 macOS / Codex 应用内浏览器（工具未提供内核及精确版本），手机和平板均为视口模拟。范围与未覆盖项见 [本轮统一记录](../COMPATIBILITY.md#apple-design-2026-10-23)；历史三内核结论不替代本次结果。

- 就近说明：[模块 README](../../modules/academic/projects/README.md)。
- 入口：`#academic/projects`。
- 测试时间：2026-10-09 15:40（北京时间）；改动标识：功能模块重构。
- 环境：chromium 151.0.7922.34、firefox 153.0、webkit 26.5；1440×900、390×844、320×780。

## 兼容性测试

| 检查项 | 结果 | 实际证据 |
|---|---|---|
| 父区入口、封面与空状态 | 通过 | 三内核及三个视口逐项打开本栏目；鼠标悬停预览，图片正常 |
| 直达、刷新、关闭 | 通过 | HTTP 子路径逐栏目直达并刷新；关闭回所属分区 |
| 键盘与焦点 | 通过 | 各视口 Escape 关闭后恢复本栏目入口焦点；共用 Tab / Shift+Tab 与历史测试见父组 |
| 视觉布局 | 通过 | Chromium 三个视口的本栏目详情对照无布局或样式退化；三内核无弹窗水平溢出 |

父组记录：[academic](academic.md)；完整环境和共用服务证据见 [实测总记录](../COMPATIBILITY.md)。静态检查通过，不代替浏览器验证。

未覆盖项：手机真机、品牌或历史版本浏览器、线上新部署。直接文件打开只单独验证共用 moments 详情，其余本栏目直达在 HTTP 子路径验证；外部来源链接未实际跳转。

## 2026-10-10 资料更新兼容性

本轮实际核对Projects 的 BESIII 合作组条目，三个内核、三个视口的链接目标、英文标签和布局均通过；环境、72 流程及未覆盖项见 [Publications 本轮记录](academic-publications.md)。链接由用户确认，未推断合作角色；测试拦截外网，未测试点击后的外部站点与线上新部署。
