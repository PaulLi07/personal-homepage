# 学术概览模块

提供 Experience、Publications、Notes、Projects 的缩略图、悬停或聚焦预览与详情入口。

- 入口：`#academic`；详情为 `#academic/<栏目>`。
- 文件：`section.html` 保存预览与按钮，`styles.css` 管纯黑背景、细线版式与布局，`module.js` 管本区交互。四个详情子目录各保存内容、封面和说明；原整区背景已从当前目录移除，历史保留在 Git 与回退包。
- 接口与边界：注册 `academic` 分区，初始化只查询传入的 `root`；通过 `details.open("academic", key, { trigger, source })` 打开详情，通过 `details.onSelect("academic", callback)` 同步预览。子模块用 `registerDetail` 注册自己的数据。
- 粒子接入：根节点以 `data-particle-surface="black"` 声明 `#000`；普通外层 `.academic-shell` 使用 `data-particle-foreground`，原绝对定位预览不改变定位方式。预览图组和缩略图声明 `data-particle-exclude`；标题与栏目以细线分隔，模块不复制粒子逻辑。
- 维护：改经历、论文、笔记或项目编辑对应子目录；新增栏目同时声明脚本、补父区按钮与预览并调整列布局。新增 CSS 背景图片、SVG 等视觉内容需显式排除；不重新启用整区图片背景。
- 验证：[兼容性测试记录](../../docs/modules/academic.md)；改动后关注四栏目预览、打开与切换、直达/关闭/历史、键盘与焦点恢复，以及黑区白点、图片零覆盖和手机无横向溢出。本轮完整页面实测由对应记录登记，不能沿用此前图片背景的结论。

本说明使用中文；片段和数据中的网页文字使用英文。修改源文件后装配，不手改根目录生成页面。
