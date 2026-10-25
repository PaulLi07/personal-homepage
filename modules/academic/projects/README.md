# 项目详情

展示实验地图集、用户提供的科研合作组及代码链接。不推断用户的合作组角色、研究课题或具体贡献。

- 入口：`#academic/projects`，从Academic路牌或图窗进入，也支持直达与刷新。
- `content.js`：登记栏目英文外壳、简介、封面、原 BESIII Collaboration 条目与 GitHub 链接。封面仍是 NASA / Bill Anders 的 Apollo 8 Earthrise，英文替代文本、署名和原始来源保持。
- `images/cover.jpg`：本栏目封面，供详情和Academic概览引用。
- [experiment-atlas/](experiment-atlas/README.md)：自定义详情视图、独立地图登记、入口样式和各地图的完整发布副本。桌面两列/手机单列地图卡片，上方为 Experiment Atlas，下方为 Research collaborations。
- 数据接口：继续使用 `Homepage.registerDetail("academic", "projects", data)`；目录胶水经公开 `getContent()` 获取当前栏目条目，不重复硬编码 BESIII 数据。合作组使用用户原始网址 `http://bes3.ihep.ac.cn/`，页面只显示名称和官方网站说明；GitHub 仍为 `https://github.com/PaulLi07`。
- 视图接口：地图集以 `registerDetailView("academic", "projects", view)` 接入既有详情生命周期；共享服务管理栏目切换、关闭、历史与焦点，地图入口保留普通同标签链接。
- 地图边界：每张地图独立维护，所需源码、数据、完整英文档案和图片全部位于当前个人主页，运行与日常重建不需要原 `/Users/paulli/coding/HEP/Web` 的文件与服务。当前中微子252条、暗物质297条，共549条记录及549张代表图片。
- 统计与缩略图：各地图的标准库 `tools/build_data.py` 从本地档案生成目录及177国几何计数预览 `assets/preview.svg`；地图集的 `tools/refresh_metadata.py` 汇总入口数量与日期，`tools/sync_shell.py` 从同一registry生成独立页面顶栏，不另写地图名单。
- 扩展：新地图登记到 `experiment-atlas/registry.js` 和 `app/site.json` 中Academic的 `standalonePages`，再更新元数据、导航、装配和兼容性记录。完整命令及边界见[地图集说明](experiment-atlas/README.md)。

维护时同步英文页面资料、中文说明、装配清单和[Projects记录](../../../docs/modules/academic-projects.md)。地图集的本轮测试证据、环境及未覆盖范围统一见[接入记录](../../../docs/modules/experiment-atlas.md)，既有 BESIII 测试不能代替新功能验证。具体地图筛选、档案、图片、独立链接与来源说明由各地图说明维护。

本说明中文，所有网页呈现数据英文。未提供的项目资料保持缺省，不编造。
