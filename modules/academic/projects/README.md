# 项目目录

入口 `#academic/projects` 从Academic路牌或图窗进入，也支持直达与刷新。目录先列出独立项目，再单独展示科研合作组和GitHub链接，避免把项目内的地图与项目本身放在同一级。

| 项目 | 入口与职责 |
|---|---|
| [Physics Maps](experiment-atlas/README.md) | `#academic/projects/physics-maps`；目前包含中微子和暗物质两张地图，使用原 `experiment-atlas/` 源码目录 |
| [Physicists](physicists/README.md) | `#academic/projects/physicists`；按用户要求先建立独立占位项目，具体资料和功能以后补充 |

## 文件与接口

- `content.js`：登记Projects英文外壳、简介、Earthrise封面、原BESIII条目及GitHub链接，不推断个人研究角色或贡献。
- `registry.js`：提供 `registerAcademicProject(descriptor, view)`、`getAcademicProjects()` 和 `getAcademicProjectView(id)`。描述字段为 `{ id, title, description, summary }`；`summary`可为字符串或返回字符串的函数，视图提供 `render({host, signal})`。元信息读取结果冻结，单项目统计异常不阻断其他入口。
- `view.js`、`styles.css`：管理项目目录、独立合作组区、子项目宿主和返回入口；只操作所属容器。`createProjectsView({projects, viewFor, content, onNavigate}).render({host, route, signal})`在目录与项目之间委托，不解释地图或Physicists内部内容。
- `integration.js`：使用 `registerDetailView("academic", "projects", view)`接入共享详情，通过公开 `getContent()`读取BESIII和GitHub资料，通过项目注册接口读取子项目。
- 各项目自己的 `integration.js`登记元信息和所属视图。清单先加载父注册接口，再加载各项目及其登记，最后加载父视图和接线；样式、数据、图片和说明仍归项目自己的目录。

父目录使用现有单slug路由，选中项目后提供All projects返回按钮；共享详情继续管理栏目切换、关闭、浏览器历史与焦点。不建立第二套弹窗。BESIII原网址为 `http://bes3.ihep.ac.cn/`，GitHub为 `https://github.com/PaulLi07`，两者不冒充新的独立项目。

## 两类扩展

**增加新项目：**在 `projects/`下建立独立目录、视图、接线及中文README，通过 `registerAcademicProject()`登记；在 `app/site.json`加入脚本和样式，保持加载顺序，再登记模块说明与实际测试。项目资料尚未提供时保留简短英文占位，不编造人物、功能或成果。

**增加Physics Maps内部地图：**仍在 `experiment-atlas/`维护，登记本项目 `registry.js`、Academic的 `standalonePages`，再生成元数据和独立页面顶栏。项目目录中的地图数量从 `getExperimentMaps()`自动计算，不新增顶层项目，也不手写另一份统计。完整数据重建和检查命令见[地图说明](experiment-atlas/README.md)。

## 维护与验证

全部说明中文，网页内容英文。修改后装配并检查项目目录、Physics Maps两地图、Physicists占位、返回、直达/刷新、历史、键盘、桌面/手机与BESIII/GitHub；共享或子项目异常须有可读回退，卸载清理只处理所属内容。

本轮2026-10-27结构、实际验证和未覆盖项统一见[Projects记录](../../../docs/modules/academic-projects.md#project-directory-2026-10-27)。地图的既有549份档案和549张图片未搬动，运行与日常维护仍不依赖原HEP Web；地图具体交互和来源历史见[地图集接入记录](../../../docs/modules/experiment-atlas.md)。旧BESIII测试或旧地图测试不能代替本次目录扩展实测。
