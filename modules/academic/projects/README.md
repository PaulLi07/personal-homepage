# 项目详情

展示用户提供的真实科研合作、项目、代码或相关材料。当前添加 BESIII Collaboration 官方链接，不推断用户的合作组角色、研究分析或具体贡献。

- 入口：`#academic/projects`，也可从父区照片或缩略图进入。
- 文件：`content.js` 保存英文项目简介、链接与 `entries`；`images/cover.jpg` 保存本栏目封面。BESIII 使用用户提供的原始网址 `http://bes3.ihep.ac.cn/`，页面只显示合作组名称与官方网站说明。
- 接口：通过 `Homepage.registerDetail("academic", "projects", data)` 独立注册；渲染、切换、路由与关闭由共用详情服务负责。
- 维护：添加真实条目时保持数组格式；替换封面需同步英文替代文本、署名和父区入口。受影响位置：父区项目缩略图与预览。
- 边界：不读取兄弟模块内部，不在本文件实现另一套弹窗。
- 验证：[测试记录](../../../docs/modules/academic-projects.md)；本轮运行 `npm run test:academic-profile` 检查 BESIII 条目及原始外链，并回归入口、切换、直达、图片与窄屏。本轮 `test:academic-profile` 三内核/三视口、共 72 流程通过，具体环境和未覆盖项见所链测试记录；外链目标和属性已核对，测试不访问外站。

本说明中文，所有网页呈现数据英文。未提供的项目资料保持缺省，不编造。
