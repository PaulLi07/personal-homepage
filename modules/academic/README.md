# 学术概览模块

提供 Experience、Publications、Notes、Projects 的缩略图、悬停或聚焦预览与详情入口。

- 入口：`#academic`；详情为 `#academic/<栏目>`。
- 文件：`section.html` 保存分隔装饰、预览与按钮，`styles.css` 管纯黑背景、边线层次与布局，`module.js` 管本区交互。四个详情子目录各保存内容、封面和说明；原整区背景已从当前目录移除，历史保留在 Git 与回退包。
- 排版与边框：`.academic-shell` 使用正常网格流，桌面上方为标题与大图预览，下方为简介与四个栏目入口；手机依次呈现标题、大图、简介和双列入口，避免旧绝对定位造成的大段留空。`.academic-divider` 位于本区前景容器顶部，以 3px 白横线和中央空心菱形标记 About / Academic 的交界。纯装饰使用 `aria-hidden` 与 `pointer-events: none`，不进入导航或键盘顺序；沿用左右 `--gutter`，不读取 About 结构。标题主线 3px，下方分隔及预览/缩略图边框 2px，大图圆角 20px、缩略图圆角 16–18px；选中状态保留强调色。
- 锚点：`#academic` 用导航公开的 `--navigation-height` 加 16px 留白，兼容固定导航；没有读取导航私有节点。
- 接口与边界：注册 `academic` 分区，初始化只查询传入的 `root`；通过 `details.open("academic", key, { trigger, source })` 打开详情，通过 `details.onSelect("academic", callback)` 同步预览。子模块用 `registerDetail` 注册自己的数据。
- 粒子接入：根节点以 `data-particle-surface="black"` 声明 `#000`；普通外层 `.academic-shell` 使用 `data-particle-foreground`，分隔装饰处于同一前景层，预览进入正常网格流，前景与粒子排除接口保持。预览图组和缩略图声明 `data-particle-exclude`；模块不复制粒子逻辑。
- 缓存边界：清单的 `liveScripts` 声明 Experience `entries.js` 保持原 URL；其他脚本和样式装配为内容版本 URL。浏览器直接发布日志不要求重新生成整页，完整源码更新仍须装配并刷新实际预览。
- 维护：改经历、论文、笔记或项目编辑对应子目录；新增栏目同时声明脚本、补父区按钮与预览并调整列布局。新增 CSS 背景图片、SVG 等视觉内容需显式排除；不重新启用整区图片背景。
- 验证：[兼容性测试记录](../../docs/modules/academic.md)；改动后关注四栏目预览、打开与切换、直达/关闭/历史、键盘与焦点恢复，以及黑区白点、图片零覆盖和手机无横向溢出。本轮完整页面实测由对应记录登记，不能沿用此前图片背景的结论。

本说明使用中文；片段和数据中的网页文字使用英文。修改源文件后装配，不手改根目录生成页面。

## 2026-10-23 样式更新

依照已批准的 Apple 风格方案统一标题层次、留白、图片比例、圆角及轻微悬停；保留纯黑粒子表面、大图预览、四个入口与原路由。减少动态效果时停止本模块的图片过渡。没有变更子模块数据、作者认证、发布或附件接口。

2026-10-23 在 Codex 应用内浏览器预览 1440×900 学术区并逐一点击四个详情，另查看 390×844 学术区及详情；详情打开时观察到粒子 Canvas 为 display:none。工具未提供内核及精确版本，窄屏为模拟视口，未测其他内核、真机与原生减少动态偏好，详见[本轮 Academic 测试记录](../../docs/modules/academic.md)。
