# 学术概览模块

提供 Experience、Publications、Notes、Projects 的专题目录、悬停或聚焦预览、详情入口与精选论文索引。

- 入口：`#academic`；详情为 `#academic/<栏目>`。
- 文件：`section.html` 保存分隔装饰、预览与按钮，`styles.css` 管纯黑背景、边线层次与布局，`module.js` 管本区交互。四个详情子目录各保存内容、封面和说明；原整区背景已从当前目录移除，历史保留在 Git 与回退包。
- 排版与边框：`.academic-shell` 使用正常网格流，上方为标题、简介、当前栏目说明与大图，下方为四个整卡 `1:1` 的直角正方形入口；图片、标题、说明及箭头内嵌卡片，桌面四列、宽度 ≤900px 时两列，手机上部改为单列。四卡和大预览均为 `0px` 圆角，覆盖此前本区的 Apple 圆角约定，其他模块不变。`.academic-divider` 以 3px 白横线和中央空心菱形标记 About / Academic 交界，预览与卡片边框为 2px；装饰不接收指针、不进入键盘顺序，沿用 `--gutter`，不读取 About 结构。
- 锚点：`#academic` 用导航公开的 `--navigation-height` 加 16px 留白，兼容固定导航；没有读取导航私有节点。
- 接口与边界：注册 `academic` 分区，初始化只查询传入的 `root`；通过 `details.open("academic", key, { trigger, source })` 打开详情，通过 `details.onSelect("academic", callback)` 同步预览。当前栏目标题、说明来自 `details.getItem()` 的 `label` / `subtitle`，序号按按钮顺序切换，初始为 Experience；说明预留两行高度，切换时不使下方卡片跳动；子模块用 `registerDetail` 登记数据。
- 精选论文：只调用公开 `Homepage.getPublicationCategories()`，优先 arXiv 首条，否则取首个非空分类的首条，以 `textContent` 呈现题名、标识与作者，不复制论文资料。getter 缺失、抛错或没有条目时隐藏横栏，四栏目仍可使用。普通点击以 `details.open("academic", "publications", { trigger: link, route: category.id })` 进入分类，关闭恢复链接焦点与原滚动位置；修饰键点击保留真实 `href`。子路由校验由共用详情服务负责。
- 粒子接入：根节点以 `data-particle-surface="black"` 声明 `#000`；普通外层 `.academic-shell` 使用 `data-particle-foreground`，分隔装饰处于同一前景层，预览进入正常网格流，前景与粒子排除接口保持。预览图组、缩略图和精选论文横栏声明 `data-particle-exclude`，保证照片和长公式题名干净可读；模块不复制粒子逻辑。
- 缓存边界：清单的 `liveScripts` 声明 Experience `entries.js` 保持原 URL；其他脚本和样式装配为内容版本 URL。浏览器直接发布日志不要求重新生成整页，完整源码更新仍须装配并刷新实际预览。
- 维护：改经历、论文、笔记或项目编辑对应子目录；新增栏目同时声明脚本、补父区按钮与预览并调整列布局。新增 CSS 背景图片、SVG 等视觉内容需显式排除；不重新启用整区图片背景。
- 验证：[兼容性测试记录](../../docs/modules/academic.md)；改动后关注四栏目预览、打开与切换、直达/关闭/历史、键盘与焦点恢复，以及黑区白点、图片零覆盖和手机无横向溢出。本轮完整页面实测由对应记录登记，不能沿用此前图片背景的结论。

本说明使用中文；片段和数据中的网页文字使用英文。修改源文件后装配，不手改根目录生成页面。

## 2026-10-23 前一轮 Apple 样式更新

依照已批准的 Apple 风格方案统一标题层次、留白、图片比例、圆角及轻微悬停；保留纯黑粒子表面、大图预览、四个入口与原路由。减少动态效果时停止本模块的图片过渡。没有变更子模块数据、作者认证、发布或附件接口。

2026-10-23 在 Codex 应用内浏览器预览 1440×900 学术区并逐一点击四个详情，另查看 390×844 学术区及详情；详情打开时观察到粒子 Canvas 为 display:none。工具未提供内核及精确版本，窄屏为模拟视口，未测其他内核、真机与原生减少动态偏好，详见[本轮 Academic 测试记录](../../docs/modules/academic.md)。

## 2026-10-23 专题目录精修

本轮仅精修 Academic 概览，参考 NASA Science 的专题层次；保留黑区、图片排除声明、原详情及作者功能。任务分支为 `feat/academic-science-directory`，回退分支 `backup/pre-academic-science-2026-10-23` 指向 `c7cdd07`，尚未推送。实际验证与未覆盖范围见[本轮记录](../../docs/modules/academic.md#academic-science-2026-10-23)，不沿用上一轮测试结论。
