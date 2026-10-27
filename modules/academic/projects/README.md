# 项目目录

入口 `#academic/projects` 从Academic路牌或图窗进入，也支持直达与刷新。目录直接展示Physics Maps与Physicists两张同范式的图文入口：桌面图片在左、说明在右，手机上下排列；标题、统计与入口位置对齐。底部只保留GitHub链接，不再展示BESIII Collaboration或空的Research collaborations区。

| 项目 | 点击行为与职责 |
|---|---|
| [Physics Maps](experiment-atlas/README.md) | 进入 `#academic/projects/physics-maps`，再选择中微子或暗物质地图；项目预览使用这两张地图的本地缩略图 |
| [Physicists](physicists/README.md) | 直接打开 `physicists/archive/website/site/index.html` 完整档案；沿用Isaac Newton、Marie Curie、Albert Einstein三张照片，不再先进入中间介绍页 |

## 文件与接口

- `content.js`：登记Projects英文外壳、简介、Earthrise封面与GitHub链接，不添加未经确认的个人研究角色。
- `registry.js`：提供 `registerAcademicProject(descriptor, view)`、`getAcademicProjects()` 和 `getAcademicProjectView(id)`。描述字段为 `{id, title, description, summary}`；`summary`可为字符串或返回字符串的函数。视图提供 `render({host, signal})`，可选 `renderEntry({host, signal, navigate})`贡献目录入口；元信息读取结果冻结，单项目统计异常不阻断其他入口。
- `entry.js`：公开 `createAcademicProjectEntry()`，提供两项目实际共用的图文卡片结构和本地链接行为；通用布局归父目录样式，图片和统计仍由所属项目传入。
- `view.js`、`styles.css`：管理项目目录、入口宿主、GitHub链接、子项目宿主与返回。`createProjectsView({projects, viewFor, content, onNavigate}).render({host, route, signal})`通过公开视图委托入口和内容，不读取人物或地图的私有数据。每个入口与子视图按取消信号清理；单入口故障保留可读回退。
- `integration.js`：使用 `registerDetailView("academic", "projects", view)`接入共享详情，通过公开内容与项目接口接线。
- 各项目的 `integration.js`登记元信息、内容视图和入口渲染器。清单先加载父注册接口与公共入口工厂，再加载各项目，最后加载父视图；图片、数据、模块局部样式和说明仍归所属项目。

地图项目继续使用单slug子路由及All projects返回；完整Physicists页面的返回链接直接回到Projects目录。旧 `#academic/projects/physicists`仅为既有书签保留兼容视图，正常入口不再经过。共享详情继续管理栏目切换、关闭、浏览器历史和焦点；不创建第二套弹窗。

## 扩展与维护

新增项目在 `projects/`下建立独立目录、视图、接线和中文README，通过项目注册接口登记。在 `app/site.json`加入脚本与样式，保持加载顺序，再登记模块说明及实测。需要图文入口时实现 `renderEntry()`并调用公共入口工厂；来源图片、统计与点击目标由项目自身提供，不把全部项目内容集中到父目录。

新增Physics Maps内部地图仍在 `experiment-atlas/`维护地图登记、独立页面清单、生成元数据和顶栏。目录统计从所属getter计算，不手写第二份数字，也不把项目内地图提升为父目录的平级项目。新增人物、成果或档案图片见[人物项目说明](physicists/README.md)。

全部维护说明中文、网页呈现英文。更新后装配并检查两项目入口、Physicists一步打开与返回、Maps两地图、原生链接/键盘、修改键点击、直达/刷新、历史、桌面/手机及失败清理。BESIII的删除仅限Projects入口，不改变Publications、Internal note或科学引用。

本次布局、验证与未覆盖范围统一见[项目卡片记录](../../../docs/modules/academic-projects.md#project-cards-2026-10-27)。既有地图资源及人物完整副本继续由主页独立维护；[原项目目录记录](../../../docs/modules/academic-projects.md#project-directory-2026-10-27)与[人物导入记录](../../../docs/modules/academic-projects-physicists.md#physicists-import-2026-10-27)保留为历史，不代替本次实测。
