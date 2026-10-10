# 学术概览模块

提供 Experience、Publications、Notes、Projects 的缩略图、悬停或聚焦预览与详情入口。

- 入口：`#academic`；详情为 `#academic/<栏目>`。
- 文件：`section.html` 保存预览与按钮，`styles.css` 管布局，`module.js` 管本区交互，`images/background.jpg` 为独立背景。四个详情子目录各保存内容、封面和说明。
- 接口与边界：注册 `academic` 分区，初始化只查询传入的 `root`；通过 `details.open("academic", key, { trigger, source })` 打开详情，通过 `details.onSelect("academic", callback)` 同步预览。子模块用 `registerDetail` 注册自己的数据。
- 维护：改经历、论文、笔记或项目编辑对应子目录；新增栏目同时声明脚本、补父区按钮与预览并调整列布局。背景可独立替换，不影响首页。
- 验证：[兼容性测试记录](../../docs/modules/academic.md)；改动后关注四栏目预览、打开与切换、直达/关闭/历史、键盘与焦点恢复。

本说明使用中文；片段和数据中的网页文字使用英文。修改源文件后装配，不手改根目录生成页面。
