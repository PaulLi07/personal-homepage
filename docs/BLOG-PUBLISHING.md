# 作者登录与日志发布说明

访客从生活区的 `Moments` 阅读博客，从学术区的 `Experience` 阅读学术日志。两者使用统一作者密码登录、GitHub 连接和编辑器，文章数组与阅读界面分别归各栏目。网页内容均为英文普通文本；未提供真实内容时保持空列表。

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
| `modules/author/` | 统一密码验证、可选加密 GitHub 连接缓存、编辑和发布 |
| `modules/life/moments/data.js`、`integration.js` | 文章格式验证、模块自有数据和读写界面的连接 |

作者服务负责密码登录、连接和编辑器；各栏目胶水负责路由与本栏目发布结果反馈。访客界面通过文章 getter 获取最新公开数据，不直接依赖作者模块内部；进入作者入口由明确回调完成。

## 一篇文章的数据

每篇文章使用 `{ id, title, date, excerpt, body, author }`。

| 字段 | 填写规则 |
|---|---|
| `id` | 稳定的小写字母或数字标识，分段使用单个连字符；例如 `reading-notes`。`author` 是保留入口，不可用作文章标识 |
| `title` | 英文标题，不为空 |
| `date` | 有效的 `YYYY-MM-DD` 日期，界面显示英文长日期 |
| `excerpt` | 英文摘要字符串，供文章列表显示 |
| `body` | 英文普通文本，以换行组织段落；不解析 HTML 或 Markdown |
| `author` | `Yuhong Li` |

文章按日期从新到旧显示。标题、作者、摘要和正文均作为文字插入网页，正文中的标签不会执行。渲染层过滤无效日期、重复标识或不完整字段，以防界面中断；发布层仍应独立验证数据与作者权限。

## 本地静态维护

1. 根据真实文章更新 `posts.js` 的注册数组，保持全部网页文字英文。没有文章时保留空数组。
2. 修改后运行 `npm run assemble`、`npm run check` 和 `git diff --check`。
3. 实测列表、正文、直接文章链接、刷新与前进后退；检查手机布局、键盘和已有生活栏目的回归，在 [模块记录](modules/life-moments.md) 填写实际证据。
4. 按工作协议完成本地提交。只有用户要求发布或推送时才更新远端；手动上传使用 `npm run package` 的源码包内部内容。
5. 网站部署后核对公开文章和链接。修改已发布文章时尽量保留 `id`，避免既有链接失效。

浏览器中看见编辑后的草稿不等于文章已发布。只有发布成功并确认公开数据更新后，才将其视为线上文章。

## 网页内发布与统一登录

1. **先上传并部署本次完整源码。** 远端 `main` 必须有新版模块和 `posts.js`、`entries.js` 数据；只更新数据文件不能替换旧登录入口。通过 Git 推送会删除旧 `moments/author.js`、`author.css`；手动上传时清理这两个已迁移文件，保留其他用户资料。
2. 打开 Moments 或 Experience，点击 `Author sign in`，输入作者密码并点击 `Sign in`。两个入口共用同一会话；切换栏目、返回列表或关闭详情保持登录，主动 `Sign out` 才退出。作者密码只在公开配置留下随机盐和派生校验值，不保存明文。
3. 首次在线发布，在 [GitHub 令牌创建页](https://github.com/settings/personal-access-tokens/new) 创建 fine-grained personal access token：资源所有者 `PaulLi07`，仓库仅选 `personal-homepage`，权限 `Contents` 为 `Read and write`，设置合适有效期。步骤见 [GitHub 官方说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)。令牌只在作者自己的浏览器输入，不放聊天、源码或文件。
4. 在工作台的 `Publishing connection` 输入令牌；勾选 `Remember encrypted connection in this browser`，点击 `Connect GitHub`。网页核验 GitHub 账号、仓库所有者与写权限；连接以密码派生密钥加密保存在当前浏览器。此后刷新先输入作者密码，缓存解密后再自动重验 GitHub；换浏览器、网站地址、缓存清除或授权失效时需再次连接。
5. 填写英文标题、稳定地址、日期、摘要和正文。Experience 另有 `Research`、`Learning`、`Seminar`、`Milestone` 类型及可选 HTTPS 参考链接，呈现为学术日志。点击 `Publish to GitHub` 后更新对应集合的远端 `main` 文件；成功跳到文章页，保持作者会话，待 Pages 部署后在新窗口确认公开页面。
6. 如需手动上传，密码解锁后点击 `Download update`，把下载文件放入对应模块目录再上传；这一步不会自动提交 GitHub。下载使用当前页面的公开记录，先确认网站已部署最新数据，以免旧列表覆盖在线新增文章。

草稿仅存在当前工作台内存，切换、关闭或刷新会丢失，长文先另存本地。密码登录只解锁编辑入口，真实发文权限仍由 GitHub 校验；未连接时可以写草稿和下载更新。

写入使用 [GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)。每次发布先重新读取远端文章数组和当前 `sha`，保留已有文章；若地址重复则拒绝，若并发导致 `409` 则保留编辑器供重试，不强行覆盖。远端文件只能是约定的 JSON 数组注册，不能执行远端 JavaScript。两个集合分别使用自己的规范化函数和数据文件，只支持新增文章；改正文、改日期或删除文章通过本地源码维护。

未勾选记住连接时令牌只存当前页面内存；勾选后只在当前浏览器保存 AES-GCM 密文，使用独立 PBKDF2 与 HKDF 派生密钥，公开校验值不能解密令牌。刷新、离开页面和 `Sign out` 清内存，退出保留加密缓存；`Forget saved connection` 删除缓存和当前连接。密码或令牌明文不进入源码、持久存储、URL、Cookie 或日志。加密缓存不上传 GitHub，不与 Relationship 的独立私密口令共享。

如以后修改作者密码，在交互终端运行 `npm run author:password`，两次隐藏输入后生成新的随机盐与校验值；随后装配、检查并上传。修改配置会使旧浏览器授权缓存无法解密，需清除并重新连接。仅前端密码不能替代服务端权限；仓库作者与写权限检查仍由 GitHub 执行。

发布若显示网络结果不确定，先查看 GitHub 提交和文章地址再重试，避免重复操作。网页发布后维护本地项目时，先获取并快进同步远端文章，再进行本地编辑；不要用旧 ZIP 或本地空数组覆盖已经在线发表的 `posts.js` 或 `entries.js`。

自动化浏览器集成验证使用模拟 GitHub 响应，不使用真实令牌、提交文章或触发线上部署。正式上线与真实账户首次连接的证据另行记录如下；实际发文仍受 GitHub 授权和仓库规则约束。

## 2026-10-10 上线与首次连接

完整源码 `48aad34` 已通过 SSH 推送，`main` 与 `origin/main` 一致。线上首页、署名页、全部 34 个 JS 和 14 个 CSS 文件及抽样 5 张图片，共 55 个 HTTP 资源与本地字节一致，确认本次完整版本已部署。

用户本人创建 fine-grained PAT 并在 Chrome（macOS 桌面，未单独记录版本）正式网站的 `#academic/experience/author` 输入，工作台显示 `Connected as PaulLi07. Your encrypted connection is saved in this browser.`。在同一页面切换到 `#life/moments/author` 再返回 Experience，均保持已解锁、已连接和已保存状态；真实账号、仓库所有者与 push 权限已通过应用 GET 验证，加密保存与双栏目共享会话已实测。令牌创建和输入由用户操作，记录不包含密码、PAT 或缓存密文。

本次没有发送真实 Contents PUT 或创建测试文章；真实凭据下刷新后的密码恢复、分支保护下写入尚未实测。更多环境与模拟流程见 [作者服务测试记录](modules/author.md)。

统一登录与编辑器见 [作者模块说明](../modules/author/README.md)，学术日志字段见 [Experience 说明](../modules/academic/experience/README.md)。博客模块接口见 [Moments 说明](../modules/life/moments/README.md)，通用提交和发布流程见 [工作协议](WORKFLOW.md)。
