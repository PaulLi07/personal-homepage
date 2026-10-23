# arXiv 分类

入口为 `#academic/publications/arxiv`。`data.js` 独立保存分类说明与预印本元信息，通过 `Homepage.registerPublicationCategory` 登记，条目格式见[父模块说明](../README.md)。

当前包含用户提供的 [arXiv:2610.11981](https://arxiv.org/abs/2610.11981)，官方页面元信息核对日期为 2026-10-10：提交于 2026-10-08，合作组署名为 BESIII Collaboration；全文链接为 <https://arxiv.org/pdf/2610.11981>。题名保留 Unicode 纯文本回退，并用可选 `titleTex` 交给本地KaTeX排版粒子变量、上下标与反粒子横线；没有新增摘要、完整作者名单或个人贡献声明。

增加论文时核对官方题名、作者或合作组、日期与链接，只登记真实资料。预印本不自动归入 Published；正式发表信息由用户确认后单独维护。

Abstract / PDF 使用外部 arXiv 原始链接，不属于两栏 `attachments`，不在本模块复制论文文件或内嵌 iframe。

说明中文、网页英文。运行 `npm run test:academic-profile` 实测题名换行、元信息、Abstract/PDF 外链、分类导航、直达和窄屏布局，结果由[Publications 记录](../../../../docs/modules/academic-publications.md)统一登记；本轮三内核/三视口、共 72 流程通过，具体分类覆盖见统一记录；不把外链属性核对视为已访问外站。
