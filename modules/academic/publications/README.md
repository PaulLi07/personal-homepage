# 论文成果模块

按 Internal note、arXiv、Published 三个分类展示学术材料，采用常规文字、细分隔线及独立分类入口。

- 入口：`#academic/publications` 为分类目录；`/internal-note`、`/arxiv`、`/published` 为对应子路由，支持直达、刷新及返回目录。Internal note先展示课题组目录，BESIII为 `/internal-note-besiii`；保留现有单slug共享路由，不使用多层斜杠尾段。
- `content.js` 保存栏目外壳与封面；`data.js` 校验并登记分类，提供 `registerPublicationCategory(category)` / `getPublicationCategories()`。
- `internal-note/data.js`保存分类外壳，`internal-note/groups.js`校验分组，`internal-note/besiii/data.js`保存BESIII记录，独立view/styles负责分组阅读；arxiv/data.js与published/data.js保持原论文契约。各目录README说明维护边界。
- `view.js` 的 `createPublicationsView({ categories, onNavigate })` 只操作传入容器；`integration.js` 通过 `registerDetailView("academic", "publications", view)` 接入共享弹窗；`styles.css` 仅包含本模块样式。
- 分类字段为 `{ id, label, description, emptyTitle, emptyMessage, entries }`。条目为 `{ id, title, authors, date, identifier, abstractUrl, pdfUrl?, titleTex? }`，日期使用 `YYYY-MM-DD`，外链仅允许无账号信息的 HTTPS 地址。
- 题名保留纯文本 `title`，可选 `titleTex` 使用英文与 `\(...\)` 行内公式混排，经[共享数学服务](../../../shared/math/README.md)调用本地KaTeX；变量斜体、上下标、横线按LaTeX显示，失败时恢复纯文本。署名与其他元信息仍为文本，不执行任意HTML。Abstract 和 PDF 在新标签页打开，使用 `noopener noreferrer`；PDF 沿用外部浏览器阅读能力，不下载论文到公开仓库，也不接入 Experience / Moments 的本地 PDF 附件服务。
- 关闭或切换时使用传入 `signal` 清理按钮事件；分类导航沿用共享历史和焦点管理，不建立第二套弹窗。

当前只有用户指定的 arXiv:2610.11981，已核对[官方条目](https://arxiv.org/abs/2610.11981)的题名、2026-10-08 提交日期、BESIII Collaboration 署名及 PDF 地址。不推断用户在论文中的角色或贡献。Internal note现含BESIII的bam1027、bam1089，两篇作者由用户另行指定；Published仍为空。内部材料没有提供日期，因此采用独立条目契约，不为适配论文格式捏造日期。

增加真实条目时修改所属分类的 `data.js`，保持白名单格式。新增分类还需更新父模块允许标识、装配清单与相应说明。替换封面同步英文替代文本、署名与父区入口；联系背景为独立副本。

本说明中文，网页内容英文。执行 `npm run test:academic-profile` 验证三分类点击、深链、刷新、返回、键盘、英文空状态、安全文本及实际论文外链；本轮三内核/三视口共 72 流程通过，具体环境、分类覆盖和未测项见[模块记录](../../../docs/modules/academic-publications.md)，未来扩展仍须重新实测。

## 2026-10-23 视觉调整

分类目录改用中性石墨色卡片和适度圆角；分类、日期、作者与外链统一文字层级。最大阅读宽度 700px，外链及返回入口保持至少 44px 的可操作高度；三分类数据、论文信息和外链契约不变。

2026-10-23 在 Codex 应用内浏览器的 1440×900 视口逐一查看 Publications 三分类，并在 320×780 检查 arXiv 长题名排版；工具未提供内核及精确版本，窄屏为模拟视口。其他内核、真机、原生减少动态偏好和外站目标访问未测试，详见[本轮 Publications 测试记录](../../../docs/modules/academic-publications.md)。

2026-10-23公式、辅助字号及窄屏换行更新的实际证据见[统一记录](../../../docs/COMPATIBILITY.md#readability-math-2026-10-23)，历史测试不替代本轮。

## Internal note课题组扩展（2026-10-26）

Publications视图遇到 `internal-note` 或 `internal-note-<组id>` 时委托本模块内部材料视图，目录计数从 `getInternalNoteGroups()` 的全部组汇总，不把内部记录塞进arXiv论文数组。其他分类及Academic精选入口保持原接口。新组按独立目录登记并加入装配清单；简介逐段使用共享数学服务，网页不把内容作为HTML解释。

维护与字段见[内部材料说明](internal-note/README.md)，本轮环境、离线测试、浏览器证据及限制见[分组记录](../../../docs/modules/academic-publications-internal-note.md#internal-note-groups-2026-10-26)。`npm run test:internal-notes` 为不联网的真实KaTeX及内存DOM回归；`test:academic-profile`已适配新结构，本轮仅做语法检查，不能沿用旧72流程声称新功能跨浏览器通过。
