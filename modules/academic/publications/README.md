# 论文成果模块

按 Internal note、arXiv、Published 三个分类展示学术材料，采用常规文字、细分隔线及独立分类入口。

- 入口：`#academic/publications` 为分类目录；`/internal-note`、`/arxiv`、`/published` 为对应子路由，支持直达、刷新及返回目录。
- `content.js` 保存栏目外壳与封面；`data.js` 校验并登记分类，提供 `registerPublicationCategory(category)` / `getPublicationCategories()`。
- `internal-note/data.js`、`arxiv/data.js`、`published/data.js` 各自保存英文分类说明与条目，各目录的 README 说明维护边界。
- `view.js` 的 `createPublicationsView({ categories, onNavigate })` 只操作传入容器；`integration.js` 通过 `registerDetailView("academic", "publications", view)` 接入共享弹窗；`styles.css` 仅包含本模块样式。
- 分类字段为 `{ id, label, description, emptyTitle, emptyMessage, entries }`。条目为 `{ id, title, authors, date, identifier, abstractUrl, pdfUrl? }`，日期使用 `YYYY-MM-DD`，外链仅允许无账号信息的 HTTPS 地址。
- 题名、合作组署名及其他元信息均按文本呈现，不执行 HTML 或 MathJax。Abstract 和 PDF 在新标签页打开，使用 `noopener noreferrer`；PDF 沿用外部浏览器阅读能力，不下载论文到公开仓库，也不接入 Experience / Moments 的本地 PDF 附件服务。
- 关闭或切换时使用传入 `signal` 清理按钮事件；分类导航沿用共享历史和焦点管理，不建立第二套弹窗。

当前只有用户指定的 arXiv:2610.11981，已核对[官方条目](https://arxiv.org/abs/2610.11981)的题名、2026-10-08 提交日期、BESIII Collaboration 署名及 PDF 地址。不推断用户在论文中的角色或贡献；Internal note 与 Published 保持空数组。

增加真实条目时修改所属分类的 `data.js`，保持白名单格式。新增分类还需更新父模块允许标识、装配清单与相应说明。替换封面同步英文替代文本、署名与父区入口；联系背景为独立副本。

本说明中文，网页内容英文。执行 `npm run test:academic-profile` 验证三分类点击、深链、刷新、返回、键盘、英文空状态、安全文本及实际论文外链；本轮三内核/三视口共 72 流程通过，具体环境、分类覆盖和未测项见[模块记录](../../../docs/modules/academic-publications.md)，未来扩展仍须重新实测。
