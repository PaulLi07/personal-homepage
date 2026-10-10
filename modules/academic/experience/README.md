# 学术日志

Experience 以 `Academic log` 展示英文学术记录，按日期和类型组织列表、正文、可选照片、PDF 附件及参考链接。仅确认南开大学研究生、理论物理领域；没有用户提供的真实记录时保持空数组，不编造时间、职务、奖项或成果，也不添加测试文章或附件。

## 文件与入口

| 文件或地址 | 职责 |
|---|---|
| `#academic/experience` | 学术日志列表，亦可从父区 Experience 缩略图进入 |
| `#academic/experience/<slug>` | 单篇记录的稳定阅读地址 |
| `#academic/experience/author` | 本栏目作者工作区，调用统一作者服务 |
| `content.js` | 已确认身份、公开栏目介绍和封面，通过 `registerDetail` 注册；普通详情条目数组仍为空 |
| `data.js` | 数据校验、白名单归一化和 `experience.entries` 命名空间登记 |
| `entries.js` | `Homepage.registerAcademicLogs([...])` 登记已发布英文学术记录；当前为空数组 |
| `log.js`、`log.css` | 本模块列表、正文、未找到状态及独立样式 |
| `integration.js` | 在 `academic/experience` 接入自定义视图，连接路由和统一作者服务 |
| `images/cover.jpg` | 本栏目可独立替换的封面 |
| `images/posts/<slug>/` | 该篇公开记录的附图，仅在提供真实照片时创建 |
| `documents/posts/<slug>/` | 该篇公开记录的 PDF，仅在提供真实附件时创建 |

不读取其他业务模块内部、不复制作者认证实现、不创建第二套弹窗。样式使用 `academic-log` 前缀，渲染仅操作传入 `host`。

## 数据约定

每条记录为 `{ id, title, date, excerpt, body, author, kind, reference?, photos?, attachments? }`。

- `id`：小写字母或数字、单个连字符分段，最长 80 字符；`author` 为保留地址，不能作为记录标识。
- `title`、`excerpt`、`body`：非空英文字符串，长度分别不超过 160、600、50000 字符。正文是保留换行的普通文本，不解析 HTML 或 Markdown。
- `date`：有效的 `YYYY-MM-DD` 日期，列表按日期倒序，界面显示英文长日期。
- `author`：`Yuhong Li`。`kind` 为 `Research`、`Learning`、`Seminar`、`Milestone` 之一。
- `reference`：可省略的绝对 HTTPS 链接；空字符串在归一化时删除。网页在新标签页打开，设置 `noopener noreferrer`。
- `photos`：可省略或使用空数组，最多 9 张；每张仅保留 `{ src, alt, caption? }`。`alt` 是非空英文替代文本，最多 300 字符；可选英文说明 `caption` 最多 600 字符，以普通文本呈现。
- 附图 `src` 必须是 `modules/academic/experience/images/posts/<当前记录 id>/<24 位小写十六进制标识>-<1 至 9>.jpg`。只允许本栏目、当前记录的本地图片，不接受外链、其他记录或栏目、路径穿越。
- `attachments`：可省略或使用空数组，最多 3 份 PDF；每份仅保留 `{ src, title, size }`。英文 title 非空且最多 160 字符，size 为原文件字节数的正整数，每份最多 10 MiB、合计最多 30 MiB。
- PDF `src` 必须是 `modules/academic/experience/documents/posts/<当前记录 id>/<24 位小写十六进制标识>-<1 至 3>.pdf`，同样禁止外链、跨文、跨栏目及路径穿越。
- 数组最多 500 条，不允许重复标识；未知字段不会进入下一次登记或发布。

`validateAcademicLogs(entries)` 合法时返回原数组，非法时抛错；`normalizeAcademicLogs(entries)` 返回只含允许字段的新数组；`registerAcademicLogs(entries)` 登记规范数据；`getAcademicLogs()` 读取当前公开记录。存在 `photos` 时调用 `Homepage.articlePhotos.normalize(photos, "experience", entry.id)`，存在 `attachments` 时调用 `Homepage.articleDocuments.normalize(attachments, "experience", entry.id)`。未提供的可选字段不新增，既有纯文字记录及合法附件保持兼容。数据契约属于本模块，共享注册器不解释记录内容。

选图服务接收 JPEG / PNG / WebP，每张原图最多 10 MiB，重绘去除原文件元数据并输出长边最多 1920 像素的 JPEG，每张最多 2 MiB、合计最多 18 MiB。PDF 服务保留原字节和元数据，仅做大小与头尾基本检查，不进行完整解析或安全扫描。在线集合登记文件最多 900000 字节；两个服务及其边界分别见 [照片记录](../../../docs/modules/article-photos.md) 和 [PDF 记录](../../../docs/modules/article-documents.md)。

## 视图与作者接口

`createAcademicLogView({ entries, onNavigate, onAuthorRequested })` 返回 `{ render({ host, route, signal }) }`。`entries` 接受数组或同步 getter；`route` 为记录标识或 `null`，`onNavigate(slug | null)` 请求阅读或返回列表，`onAuthorRequested()` 请求作者入口。未提供作者回调则不显示作者按钮。

主要标题带 `data-view-heading` 与 `tabindex="-1"`，由详情胶水恢复路由焦点。`signal` 管理所属详情生命周期；重复渲染会取消上一轮按钮监听。正文、摘要、日期、类型和标题全部以文字渲染，参考地址经过校验后才交给链接元素。

单篇正文之后调用 `Homepage.articlePhotos.renderGallery()` 呈现附图，再调用 `Homepage.articleDocuments.renderAttachments()` 呈现 PDF；均传入 `{ collectionId: "experience", entryId, signal }`。照片保持原比例、延迟加载并异步解码，替代文本和说明均为英文。PDF 只提供标题、大小及 Open PDF / Download PDF 受控链接，新标签页链接设置 `noopener noreferrer`，不自动加载 PDF、不内嵌 iframe。各服务负责样式与清理，本栏目不复制处理实现；未提供附件时不增加对应区块。

作者路由调用 `createAuthorEditor({ collection, onPublished, onCancel })`，声明登记函数 `registerAcademicLogs`、发布路径 `modules/academic/experience/entries.js`、本模块归一化函数，以及类型选择和可选参考链接字段；认证、会话、权限与 GitHub 发布由统一作者服务提供。成功后登记新数据并进入对应记录，取消返回列表，不直接查询作者服务内部 DOM。

编辑器通过照片和 PDF 服务各自的 `createPicker()` 接入选择、英文描述、排序、删除与清理。零附件保持 Contents 发布及登记 JS 下载；有任意照片或 PDF 时，文件与数据以同一次非强制 Git 提交发布，手动下载改为文件负载最多 52 MiB 的 ZIP。发布先合并同版远端记录，保留既有文章及附件；冲突保留草稿。事务白名单、10 MiB blob 与最多 13 项 tree 由 [统一作者服务](../../author/README.md) 管理。公开附件不接入 Relationship。

## 维护与验证

补充真实记录优先使用作者工作区；直接维护源码时更新 `entries.js`，保持标识稳定。替换封面需同步 `content.js` 的英文替代文本、署名、父区入口及素材说明。修改后装配、检查并实测，在 [测试记录](../../../docs/modules/academic-experience.md) 写明实际环境和未覆盖项。

2026-10-10 本轮 `test:photos` 已通过 297 个流程，覆盖旧记录零附件兼容、9 张照片、PDF 的选择与原字节、英文描述、受控路径、阅读、排序删除及键盘、关闭清理、混合 ZIP、两集合模拟附件发布与事务冲突。原作者页面 144 流程、`test:features` 81 流程及离线作者会话 21 项也重新运行并通过。此前 207 流程是最多 6 张照片版本的历史记录，不能替代本轮 9 图及 PDF 实测。

浏览器为 Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5，各使用 1440×900、390×844、320×780 视口；手机真机及其他浏览器版本未测试。测试只用临时记录与附件、模拟 GitHub，不执行真实发布，不替代线上部署验证。正式 `entries.js` 仍为空数组，测试资料不进入公开内容。详细范围及未覆盖项见本模块、照片、PDF 和统一作者的测试记录，后续变更仍须重新实测。
