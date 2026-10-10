# 作者登录与日志发布说明

访客从生活区的 `Moments` 阅读博客，从学术区的 `Experience` 阅读学术日志。两者使用统一作者密码登录、GitHub 连接和编辑器，文章数组与阅读界面分别归各栏目。网页文字为英文普通文本，可附公开照片与 PDF；未提供真实内容时保持空列表。

## 入口与职责

| 入口或文件 | 用途 |
|---|---|
| `#life/moments` | 访客文章列表 |
| `#life/moments/<slug>` | 单篇文章的稳定链接 |
| `#life/moments/author` | 统一作者登录和新博客编辑入口 |
| `#academic/experience/author` | 同一作者登录和学术日志编辑入口 |
| `modules/academic/experience/entries.js` | Experience 的独立英文日志数据 |
| `modules/life/moments/posts.js` | 静态已发布文章，调用 `Homepage.registerBlogPosts([...])` |
| `modules/life/moments/blog.js`、`blog.css` | 访客列表和阅读界面；不管理登录、凭据或网络发布 |
| `modules/author/session.js` | 统一密码验证、GitHub 身份校验及可选加密连接缓存 |
| `modules/author/editor.js` | 表单、草稿与状态；调用照片、PDF 服务及发布器，不自行解释 Git 提交 |
| `modules/author/publisher.js` | `createAuthorPublisher(collection)`，解析、合并及发布当前集合 |
| `modules/article-photos/` | 数据规范、原图处理、选图、阅读图库与 ZIP，不访问作者凭据或发布 GitHub |
| `modules/article-documents/` | PDF 基本文件校验、字段规范、选择排序及读者打开与下载入口 |
| `modules/life/moments/data.js`、`integration.js` | 文章格式验证、模块自有数据和读写界面的连接 |

各栏目胶水负责路由与本栏目发布结果反馈，读者通过 getter 获取公开数据。编辑器只处理表单；网络解析与发布归发布器，图片及 PDF 处理与呈现归各自服务，通过公开接口接入，不把全部实现放回编辑器。

## 一篇文章的数据

每篇文章使用 `{ id, title, date, excerpt, body, author, photos?, attachments? }`；Experience 另有学术类型和可选参考链接，详见该模块说明。

| 字段 | 填写规则 |
|---|---|
| `id` | 稳定的小写字母或数字标识，分段使用单个连字符；例如 `reading-notes`。`author` 是保留入口，不可用作文章标识 |
| `title` | 英文标题，不为空 |
| `date` | 有效的 `YYYY-MM-DD` 日期，界面显示英文长日期 |
| `excerpt` | 英文摘要字符串，供文章列表显示 |
| `body` | 英文普通文本，以换行组织段落；不解析 HTML 或 Markdown |
| `author` | `Yuhong Li` |
| `photos` | 可省略，或最多 9 个 `{ src, alt, caption? }`；英文替代文本非空且最多 300 字符，可选英文说明最多 600 字符 |
| `attachments` | 可省略，或最多 3 个 `{ src, title, size }`；英文标题非空且最多 160 字符，size 为实际字节数，每份最多 10 MiB、合计最多 30 MiB |

文章按日期从新到旧显示。标题、作者、摘要和正文均作为文字插入网页，正文中的标签不会执行。渲染层过滤无效日期、重复标识或不完整字段，以防界面中断；发布层仍应独立验证数据与作者权限。

照片路径只接受当前集合、当前文章的 `images/posts/<id>/<24位小写十六进制标识>-<1..9>.jpg`，完整前缀为 `modules/life/moments/` 或 `modules/academic/experience/`。禁止外链、跨文章引用与路径穿越；数据规范化保留原有合法照片与 PDF 并剥除未知字段。正文后图库保持原比例，使用延迟加载、异步解码和纯文本说明。

PDF 路径为当前集合的 `documents/posts/<id>/<24位小写十六进制标识>-<1..3>.pdf`，同样拒绝外链、跨文章、跨集合和路径穿越。输入 MIME 为 `application/pdf`，仅检查大小、版本头和结束标记，不等于完整格式解析或安全扫描；PDF 原字节和元数据保留，选择前自行确认适合公开。正文后显示英文标题、大小及 `Open PDF`、`Download PDF` 链接，不内嵌阅读器。

## 本地静态维护

1. 根据真实文章更新当前集合的注册数组，保持全部网页文字英文。没有文章时保留空数组；有照片或 PDF 时维护受控路径内的文件及英文描述，不删除其他已发布文章的附件。
2. 修改后运行 `npm run assemble`、`npm run check` 和 `git diff --check`。
3. 实测列表、正文、直接链接、刷新与历史；有附件时增加图库、PDF 链接、失败提示及手机布局检查，在所属 [Moments](modules/life-moments.md) 或 [Experience](modules/academic-experience.md) 记录填写实际证据。
4. 按工作协议完成本地提交。只有用户要求发布或推送时才更新远端；手动上传使用 `npm run package` 的源码包内部内容。
5. 网站部署后核对公开文章和链接。修改已发布文章时尽量保留 `id`，避免既有链接失效。

浏览器中看见编辑后的草稿不等于文章已发布。只有发布成功并确认公开数据更新后，才将其视为线上文章。

## 网页内发布与统一登录

1. **先上传并部署完整源码。** 包含照片、PDF 服务、独立发布器及生成页面；只更新数据文件不能给旧版网站增加附件。此前旧 `moments/author.js`、`author.css` 已迁入统一服务，手动上传时按迁移范围清理，保留其他用户资料。
2. 打开 Moments 或 Experience，点击 `Author sign in`，输入作者密码并点击 `Sign in`。两个入口共用同一会话；切换栏目、返回列表或关闭详情保持登录，主动 `Sign out` 才退出。作者密码只在公开配置留下随机盐和派生校验值，不保存明文。
3. 首次在线发布，在 [GitHub 令牌创建页](https://github.com/settings/personal-access-tokens/new) 创建 fine-grained personal access token：资源所有者 `PaulLi07`，仓库仅选 `personal-homepage`，权限 `Contents` 为 `Read and write`，设置合适有效期。已有该权限的连接可继续发布照片和 PDF，无需新增权限或重新授权。步骤见 [GitHub 官方说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)。令牌只在作者自己的浏览器输入，不放聊天、源码或文件。
4. 在工作台的 `Publishing connection` 输入令牌；勾选 `Remember encrypted connection in this browser`，点击 `Connect GitHub`。网页核验 GitHub 账号、仓库所有者与写权限；连接以密码派生密钥加密保存在当前浏览器。此后刷新先输入作者密码，缓存解密后再自动重验 GitHub；换浏览器、网站地址、缓存清除或授权失效时需再次连接。
5. 填写英文标题、稳定地址、日期、摘要和正文。Experience 另有 `Research`、`Learning`、`Seminar`、`Milestone` 类型及可选 HTTPS 参考链接。可选最多 9 张 JPEG、PNG、WebP，原图每张最多 10 MiB；浏览器重绘移除元数据，生成长边最多 1920 像素、每张最多 2 MiB、合计最多 18 MiB 的 JPEG。每张填写英文替代文本，可添加说明，支持排序与删除。`Add PDFs (optional)` 可另选最多 3 份 PDF，每份最多 10 MiB，填写英文标题，也支持排序、删除；默认标题为 `Document N`。处理完成后点击 `Publish to GitHub`，成功进入正文；待 Pages 部署后在新窗口核对文章及全部附件。
6. 手动更新可点击 `Download update`。没有附件时下载当前集合的数据 JS；有照片或 PDF 时下载含数据和新附件的 ZIP，内容总量上限 52 MiB，内部目录相对仓库根。解压后把内部内容放到仓库根目录，保留路径；不要上传 ZIP 文件本身。这一步不提交 GitHub，下载基于当前页面的记录，上传前核对远端最新数据和既有图片。

草稿仅存在当前工作台内存，切换、关闭或刷新会丢失，长文先另存本地。密码登录只解锁编辑入口，真实发文权限仍由 GitHub 校验；未连接时可以写草稿和下载更新。

没有附件的发布沿用 [GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)：GET 远端当前数据与 SHA，再 PUT 当前集合文件。有照片或 PDF 时发布读取 `main` 的 head 与该提交中的 tree SHA，并按 `?ref=head` 读取同一版本的数据；分别 POST 附件及数据 blob，POST 带 `base_tree` 的 tree，POST 以 `[head]` 为父节点的 commit，最后 PATCH `main` 且 `force: false`。附件和文章在同一次可见提交中出现，避免文章先上线而文件未齐。

会话将这些对象绑定到同一次发布，只接受本次取得的基树、上传的 blob、创建的树和 commit，失败或取消后重试从 head 重新开始。接口规则见 GitHub 的 [创建树](https://docs.github.com/en/rest/git/trees#create-a-tree) 与 [更新分支引用](https://docs.github.com/en/rest/git/refs#update-a-reference) 文档。

发布器解析约定的纯 JSON 登记，合并已有记录及照片、PDF，不执行远端 JavaScript。地址重复或分支并发更新时保留草稿、不强制覆盖。取消或失败可能已经创建 Git 对象，但在 `main` 未更新时不会作为网页文章出现；结果不确定先检查 GitHub 提交再重试。两集合不互写，只支持新增记录；修改或删除已发布内容通过本地源码维护。

未勾选记住连接时令牌只存当前页面内存；勾选后只在当前浏览器保存 AES-GCM 密文，使用独立 PBKDF2 与 HKDF 派生密钥，公开校验值不能解密令牌。刷新、离开页面和 `Sign out` 清内存，退出保留加密缓存；`Forget saved connection` 删除缓存和当前连接。密码或令牌明文不进入源码、持久存储、URL、Cookie 或日志。加密缓存不上传 GitHub，不与 Relationship 的独立私密口令共享。

如以后修改作者密码，在交互终端运行 `npm run author:password`，两次隐藏输入后生成新的随机盐与校验值；随后装配、检查并上传。修改配置会使旧浏览器授权缓存无法解密，需清除并重新连接。仅前端密码不能替代服务端权限；仓库作者与写权限检查仍由 GitHub 执行。

发布若显示网络结果不确定，先查看 GitHub 提交和文章地址再重试，避免重复操作。网页发布后维护本地项目时，先获取并快进同步远端文章，再进行本地编辑；不要用旧 ZIP 或本地空数组覆盖已经在线发表的 `posts.js` 或 `entries.js`。

自动化浏览器集成验证使用模拟 GitHub 响应，不使用真实令牌、提交文章或触发线上部署。正式上线与真实账户首次连接的证据另行记录如下；实际发文仍受 GitHub 授权和仓库规则约束。

## 2026-10-10 上线与首次连接

以下是附图功能加入前版本的历史证据；新增照片处理和带图发布链路的本轮实测见 [照片记录](modules/article-photos.md)。

完整源码 `48aad34` 已通过 SSH 推送，`main` 与 `origin/main` 一致。线上首页、署名页、全部 34 个 JS 和 14 个 CSS 文件及抽样 5 张图片，共 55 个 HTTP 资源与本地字节一致，确认本次完整版本已部署。

用户本人创建 fine-grained PAT 并在 Chrome（macOS 桌面，未单独记录版本）正式网站的 `#academic/experience/author` 输入，工作台显示 `Connected as PaulLi07. Your encrypted connection is saved in this browser.`。在同一页面切换到 `#life/moments/author` 再返回 Experience，均保持已解锁、已连接和已保存状态；真实账号、仓库所有者与 push 权限已通过应用 GET 验证，加密保存与双栏目共享会话已实测。令牌创建和输入由用户操作，记录不包含密码、PAT 或缓存密文。

本次没有发送真实 Contents PUT 或创建测试文章；真实凭据下刷新后的密码恢复、分支保护下写入尚未实测。更多环境与模拟流程见 [作者服务测试记录](modules/author.md)。

统一登录与编辑器见 [作者模块说明](../modules/author/README.md)，学术日志字段见 [Experience 说明](../modules/academic/experience/README.md)。博客模块接口见 [Moments 说明](../modules/life/moments/README.md)，通用提交和发布流程见 [工作协议](WORKFLOW.md)。

## 九图与 PDF 本轮验证

2026-10-10 北京时间 16:17，照片/PDF 集成测试在 Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5 的 1440×900、390×844、320×780 视口通过，共 297 流程。两集合的 PDF-only 与照片/PDF 混合 ZIP、同提交发布、旧附件保留和失败草稿均验证；真实远端写入为 0，未做线上附件发布。具体证据见 [附件记录](modules/article-photos.md) 与 [PDF 记录](modules/article-documents.md)。
