# 项目详情测试记录

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
