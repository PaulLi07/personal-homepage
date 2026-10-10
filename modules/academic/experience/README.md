# 学术日志

Experience 以 `Academic log` 展示英文学术记录，按日期和类型组织列表、正文及可选参考链接。仅确认南开大学研究生、理论物理领域；没有用户提供的真实记录时保持空数组，不编造时间、职务、奖项或成果。

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

不读取其他业务模块内部、不复制作者认证实现、不创建第二套弹窗。样式使用 `academic-log` 前缀，渲染仅操作传入 `host`。

## 数据约定

每条记录为 `{ id, title, date, excerpt, body, author, kind, reference? }`。

- `id`：小写字母或数字、单个连字符分段，最长 80 字符；`author` 为保留地址，不能作为记录标识。
- `title`、`excerpt`、`body`：非空英文字符串，长度分别不超过 160、600、50000 字符。正文是保留换行的普通文本，不解析 HTML 或 Markdown。
- `date`：有效的 `YYYY-MM-DD` 日期，列表按日期倒序，界面显示英文长日期。
- `author`：`Yuhong Li`。`kind` 为 `Research`、`Learning`、`Seminar`、`Milestone` 之一。
- `reference`：可省略的绝对 HTTPS 链接；空字符串在归一化时删除。网页在新标签页打开，设置 `noopener noreferrer`。
- 数组最多 500 条，不允许重复标识；未知字段不会进入下一次登记或发布。

`validateAcademicLogs(entries)` 检查约定；`normalizeAcademicLogs(entries)` 返回只含允许字段的新数组；`registerAcademicLogs(entries)` 登记规范数据；`getAcademicLogs()` 读取当前公开记录。数据契约属于本模块，共享注册器不解释记录内容。

## 视图与作者接口

`createAcademicLogView({ entries, onNavigate, onAuthorRequested })` 返回 `{ render({ host, route, signal }) }`。`entries` 接受数组或同步 getter；`route` 为记录标识或 `null`，`onNavigate(slug | null)` 请求阅读或返回列表，`onAuthorRequested()` 请求作者入口。未提供作者回调则不显示作者按钮。

主要标题带 `data-view-heading` 与 `tabindex="-1"`，由详情胶水恢复路由焦点。`signal` 管理所属详情生命周期；重复渲染会取消上一轮按钮监听。正文、摘要、日期、类型和标题全部以文字渲染，参考地址经过校验后才交给链接元素。

作者路由调用 `createAuthorEditor({ collection, onPublished, onCancel })`，声明登记函数 `registerAcademicLogs`、发布路径 `modules/academic/experience/entries.js`、本模块归一化函数，以及类型选择和可选参考链接字段；认证、会话、权限与 GitHub 发布由统一作者服务提供。成功后登记新数据并进入对应记录，取消返回列表，不直接查询作者服务内部 DOM。

## 维护与验证

补充真实记录优先使用作者工作区；直接维护源码时更新 `entries.js`，保持标识稳定。替换封面需同步 `content.js` 的英文替代文本、署名、父区入口及素材说明。修改后装配、检查并实测，在 [测试记录](../../../docs/modules/academic-experience.md) 写明实际环境和未覆盖项。

2026-10-10 已完成 Chromium、Firefox、WebKit 的桌面与两个手机宽度模拟测试，覆盖日志阅读、参考链接、统一登录、双集合模拟发布及生命周期，详见模块测试记录。测试使用临时数据并完全拦截 GitHub；真实授权与线上部署未测试。
