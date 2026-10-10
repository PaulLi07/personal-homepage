# 生活片段与博客

`Moments` 保存个人生活文章及可选照片、PDF 附件，访客从 `#life/moments` 查看列表，从 `#life/moments/<slug>` 阅读文章；封面目前使用风景占位图。没有用户文章时显示英文空状态，不创建示例文章或测试附件。

## 文件与边界

| 文件 | 职责 |
|---|---|
| `content.js` | 栏目介绍、封面、英文替代文本与素材来源，通过 `registerDetail` 注册 |
| `posts.js` | 已发布英文文章，以 `Homepage.registerBlogPosts([...])` 注册；当前为空数组 |
| `blog.js` | 博客列表、文章与未找到状态的独立渲染工厂 |
| `blog.css` | 本模块博客样式，选择器统一使用 `moments-blog` 前缀 |
| `data.js` | 文章字段验证及自有数据 getter |
| `modules/author/` | 通过公开接口共用密码登录、GitHub 连接和编辑器；不归 Moments 私有 |
| `integration.js` | 连接共享详情服务与读者、作者视图，响应路由和卸载 |
| `images/cover.jpg` | 本栏目可独立替换的封面 |
| `images/posts/<slug>/` | 当前文章的公开附图，仅在提供真实照片时创建 |
| `documents/posts/<slug>/` | 当前文章的公开 PDF，仅在提供真实附件时创建 |

模块只操作传入的 `host`，不读取兄弟模块内部，不创建另一套弹窗，不直接修改浏览器路由。路由、详情外壳和作者认证由胶水与对应服务提供。

## 渲染接口

`Homepage.createBlogView({ posts, onNavigate, onAuthorRequested })` 返回 `{ render({ host, route, signal }) }`。

- `posts`：文章数组或同步返回文章数组的函数；每次渲染重新读取，便于发布后更新。
- `onNavigate(slug | null)`：进入文章或返回列表；胶水负责更新 `#life/moments/<slug>` 并再次渲染。
- `onAuthorRequested()`：请求作者入口；未传回调时不显示 `Author sign in` 按钮。按钮带有 `data-blog-author` 标记。
- `host`：本模块自己的 DOM 容器。`route` 为文章标识或 `null`，空字符串也按列表处理。
- `signal`：所属详情生命周期的 `AbortSignal`。关闭或切换栏目时取消监听；连续渲染还会自动取消上一轮按钮监听。

正文、标题、摘要及作者均通过 `textContent` 写入。正文保留换行，不解释 HTML 或 Markdown。列表按日期倒序显示；无效标识显示英文返回入口；数据读取异常显示暂不可用状态。

单篇正文后通过独立服务 `Homepage.articlePhotos.renderGallery()` 展示附图，再通过 `Homepage.articleDocuments.renderAttachments()` 展示 PDF；均传入 `{ collectionId: "moments", entryId, signal }`。照片保持原比例、延迟加载、异步解码，英文说明按纯文本呈现。PDF 只显示标题、大小及 Open PDF / Download PDF 受控链接，新标签页链接设置 `noopener noreferrer`，不自动加载文件、不内嵌 iframe。各服务负责样式、提示及清理；无附件时不增加对应区块，列表不额外添加缩略图。

## 文章数据与维护

每篇文章格式为 `{ id, title, date, excerpt, body, author, photos?, attachments? }`，所有网页文字使用英文；`author` 为 `Yuhong Li`。`id` 使用小写字母、数字和单个连字符分段，例如 `first-post`；`author` 保留给作者入口，不能作为文章标识。日期为有效的 `YYYY-MM-DD`，界面以英文长日期显示。标题、摘要和正文均非空；标题最多 160 字符，地址最多 80 字符，摘要最多 600 字符，正文最多 50000 字符；文章数组最多 500 篇，在线发布文件另有 900000 字节上限。正文用普通文本和换行分段。

可选 `photos` 省略或使用空数组，最多 9 张；每张只保留 `{ src, alt, caption? }`。`alt` 必须是非空英文替代文本，最多 300 字符；可选英文说明 `caption` 最多 600 字符。`src` 只接受 `modules/life/moments/images/posts/<当前文章 id>/<24 位小写十六进制标识>-<1 至 9>.jpg`，禁止外链、其他文章或栏目以及路径穿越。

照片服务接收 JPEG / PNG / WebP，每张原图最多 10 MiB，重绘去除原文件元数据并输出长边最多 1920 像素的 JPEG，每张最多 2 MiB、合计最多 18 MiB。

可选 `attachments` 省略或使用空数组，最多 3 份 PDF；每份只保留 `{ src, title, size }`。英文 title 非空且最多 160 字符，size 是原文件字节数的正整数，每份最多 10 MiB、合计最多 30 MiB。`src` 只接受 `modules/life/moments/documents/posts/<当前文章 id>/<24 位小写十六进制标识>-<1 至 3>.pdf`，同样禁止外链、跨文、跨栏目及路径穿越。PDF 服务保留原字节和元数据，仅做大小与头尾基本检查，不进行完整解析或安全扫描。

`validateBlogPosts(posts)` 合法时返回原数组，非法时抛错；`normalizeBlogPosts(posts)` 返回白名单字段的新数组。存在 `photos` 时调用 `Homepage.articlePhotos.normalize(photos, "moments", post.id)`，存在 `attachments` 时调用 `Homepage.articleDocuments.normalize(attachments, "moments", post.id)`。未提供的可选字段不新增，保持纯文字旧文章及已有合法附件兼容；未知字段不会进入下一次登记或发布。

文章由作者工作区提交到远端 `posts.js`；如直接维护源码，仅填入用户提供的真实文章。标识应保持稳定，避免既有文章链接失效。渲染层防止无效日期、重复标识或缺失字段中断界面；发布端还应验证数据，不能把渲染过滤视为认证或发布权限检查。

替换封面时同步 `content.js` 的英文替代文本与来源，以及父区入口和素材署名。结构或接口改变时同步模块测试记录和框架说明。

## 验证

[测试记录](../../../docs/modules/life-moments.md)记录实际浏览器、视口、结果及未覆盖项。统一作者入口调用 `Homepage.createAuthorEditor({ collection, onPublished, onCancel })`，集合契约仅声明本模块的 `posts.js`、`registerBlogPosts`、getter 与规范化函数。密码登录、加密连接缓存与发布实现统一归 `modules/author/`；关闭栏目只卸载视图，`Sign out` 才退出共享登录。密码解锁后可编辑；首次在线发布须连接 GitHub，勾选记住连接后以后同浏览器只需密码。

编辑器通过照片和 PDF 服务各自的 `createPicker()` 提供选择、英文描述、排序、删除与生命周期清理。零附件保持 Contents 发布及登记 JS 下载；有任意照片或 PDF 时，文件与数据同次非强制 Git 提交发布，手动下载改为文件负载最多 52 MiB 的 ZIP。发布先合并同版远端记录并保留既有文章、照片和 PDF，冲突保留草稿；同事务白名单、每份最多 10 MiB 的 Git blob、最多 13 项 tree 由 [统一作者服务](../../author/README.md) 管理。公开附件不接入 Relationship。

集成后需检查空列表、真实文章列表和正文、文章直达、刷新及前进后退、无效标识、返回列表、键盘和焦点、手机窄屏、减少动态效果、异常数据与作者入口。

2026-10-10 本轮 `test:photos` 已通过 297 个流程，覆盖旧文零附件兼容、9 张照片、PDF 选择与原字节、英文描述、受控路径、阅读、排序删除及键盘、关闭清理、混合 ZIP、两集合模拟附件发布与事务冲突。原作者页面 144 流程、`test:features` 81 流程及离线作者会话 21 项均重新运行并通过。此前 207 流程属于最多 6 张照片版本的历史测试，不能作为本轮 9 图及 PDF 的结论；详细范围见 [照片记录](../../../docs/modules/article-photos.md)、[PDF 记录](../../../docs/modules/article-documents.md) 和 [作者记录](../../../docs/modules/author.md)。

本轮浏览器为 Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5，各使用 1440×900、390×844、320×780 视口；手机宽度为模拟，未测试手机真机或其他浏览器版本。测试使用临时数据并完全拦截 GitHub，真实写入为 0，不替代真实发布或线上部署验证。正式 `posts.js` 仍为空数组，测试文章与附件不得进入公开资料；后续变更仍须重新实测。

文章维护与发布步骤见 [博客发布说明](../../../docs/BLOG-PUBLISHING.md)。
