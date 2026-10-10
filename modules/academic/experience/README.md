# 学术日志

Experience 以 `Academic log` 展示英文学术记录，按日期和类型组织列表、正文、可选附图及参考链接。仅确认南开大学研究生、理论物理领域；没有用户提供的真实记录时保持空数组，不编造时间、职务、奖项或成果，也不添加测试图片记录。

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

不读取其他业务模块内部、不复制作者认证实现、不创建第二套弹窗。样式使用 `academic-log` 前缀，渲染仅操作传入 `host`。

## 数据约定

每条记录为 `{ id, title, date, excerpt, body, author, kind, reference?, photos? }`。

- `id`：小写字母或数字、单个连字符分段，最长 80 字符；`author` 为保留地址，不能作为记录标识。
- `title`、`excerpt`、`body`：非空英文字符串，长度分别不超过 160、600、50000 字符。正文是保留换行的普通文本，不解析 HTML 或 Markdown。
- `date`：有效的 `YYYY-MM-DD` 日期，列表按日期倒序，界面显示英文长日期。
- `author`：`Yuhong Li`。`kind` 为 `Research`、`Learning`、`Seminar`、`Milestone` 之一。
- `reference`：可省略的绝对 HTTPS 链接；空字符串在归一化时删除。网页在新标签页打开，设置 `noopener noreferrer`。
- `photos`：可省略或使用空数组，最多 6 张；每张仅保留 `{ src, alt, caption? }`。`alt` 是非空英文替代文本，最多 300 字符；可选英文说明 `caption` 最多 600 字符，以普通文本呈现。
- 附图 `src` 必须是 `modules/academic/experience/images/posts/<当前记录 id>/<24 位小写十六进制标识>-<1 至 6>.jpg`。只允许本栏目、当前记录的本地图片，不接受外链、其他记录或栏目、路径穿越。
- 数组最多 500 条，不允许重复标识；未知字段不会进入下一次登记或发布。

`validateAcademicLogs(entries)` 合法时返回原数组，非法时抛错；`normalizeAcademicLogs(entries)` 返回只含允许字段的新数组；`registerAcademicLogs(entries)` 登记规范数据；`getAcademicLogs()` 读取当前公开记录。存在 `photos` 时通过独立服务 `Homepage.articlePhotos.normalize(photos, "experience", entry.id)` 规范字段与路径；未提供时不新增此字段，既有纯文字记录保持兼容。数据契约属于本模块，共享注册器不解释记录内容。

## 视图与作者接口

`createAcademicLogView({ entries, onNavigate, onAuthorRequested })` 返回 `{ render({ host, route, signal }) }`。`entries` 接受数组或同步 getter；`route` 为记录标识或 `null`，`onNavigate(slug | null)` 请求阅读或返回列表，`onAuthorRequested()` 请求作者入口。未提供作者回调则不显示作者按钮。

主要标题带 `data-view-heading` 与 `tabindex="-1"`，由详情胶水恢复路由焦点。`signal` 管理所属详情生命周期；重复渲染会取消上一轮按钮监听。正文、摘要、日期、类型和标题全部以文字渲染，参考地址经过校验后才交给链接元素。

单篇正文之后调用 `Homepage.articlePhotos.renderGallery()` 呈现附图，并传入集合标识、当前记录标识与生命周期信号。照片保持原比例、延迟加载并异步解码，替代文本和说明均为英文；图库服务负责样式、加载失败提示与监听清理，本栏目不复制图片处理实现。无附图时不增加图片区。

作者路由调用 `createAuthorEditor({ collection, onPublished, onCancel })`，声明登记函数 `registerAcademicLogs`、发布路径 `modules/academic/experience/entries.js`、本模块归一化函数，以及类型选择和可选参考链接字段；认证、会话、权限与 GitHub 发布由统一作者服务提供。成功后登记新数据并进入对应记录，取消返回列表，不直接查询作者服务内部 DOM。

## 维护与验证

补充真实记录优先使用作者工作区；直接维护源码时更新 `entries.js`，保持标识稳定。替换封面需同步 `content.js` 的英文替代文本、署名、父区入口及素材说明。修改后装配、检查并实测，在 [测试记录](../../../docs/modules/academic-experience.md) 写明实际环境和未覆盖项。

附图后续维护继续回归旧记录无图兼容、张数限制、英文说明、路径、加载、原比例布局、键盘与关闭清理。2026-10-10 的 `test:photos` 在三内核三视口通过，共 207 个流程；实际范围见 [照片记录](../../../docs/modules/article-photos.md)，不能复用此前文字测试代替未来验证。正式 `entries.js` 仍为空数组，测试记录与图片不进入公开资料。

2026-10-10 已完成 Chromium、Firefox、WebKit 的桌面与两个手机宽度模拟测试，覆盖日志阅读、参考链接、统一登录、双集合模拟发布及生命周期，详见模块测试记录。测试使用临时数据并完全拦截 GitHub；真实授权与线上部署未测试。
