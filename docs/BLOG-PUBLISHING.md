# 博客维护与发布说明

访客从生活区的 `Moments` 进入文章列表。文章使用英文，采用普通文本和换行；未提供真实文章时保持空列表，不能把开发测试文章发布出去。

## 入口与职责

| 入口或文件 | 用途 |
|---|---|
| `#life/moments` | 访客文章列表 |
| `#life/moments/<slug>` | 单篇文章的稳定链接 |
| `#life/moments/author` | GitHub 作者验证和新文章编辑入口 |
| `modules/life/moments/posts.js` | 静态已发布文章，调用 `Homepage.registerBlogPosts([...])` |
| `modules/life/moments/blog.js`、`blog.css` | 访客列表和阅读界面；不管理登录、凭据或网络发布 |
| `modules/life/moments/author.js`、`author.css` | 作者验证、编辑与 GitHub 发布 |
| `modules/life/moments/data.js`、`integration.js` | 文章格式验证、模块自有数据和读写界面的连接 |

作者工作区和胶水负责编辑、路由与发布结果反馈。访客界面通过文章 getter 获取最新公开数据，不直接依赖作者模块内部；进入作者入口由明确回调完成。

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

## 网页内发布

1. **先上传并部署本次完整源码。** 远端 `main` 必须有新版本的 `modules/life/moments/posts.js`；旧网站没有这个文件时，作者入口会拒绝发布。
2. 在 [GitHub 令牌创建页](https://github.com/settings/personal-access-tokens/new) 创建 fine-grained personal access token：资源所有者选 `PaulLi07`；仓库范围仅选 `personal-homepage`；仓库权限 `Contents` 设为 `Read and write`，设置合适有效期。不需赋予账户管理等额外权限。操作步骤见 [GitHub 官方说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)。
3. 打开网站 `Moments`，点击 `Author sign in`，在密码输入框粘贴令牌并点击 `Verify author`。输入马上清空；网页调用 GitHub `/user` 确认账号为 `PaulLi07`，并核对仓库所有者及写权限。验证成功后才出现编辑器。
4. 填写英文标题、稳定地址、日期、摘要和正文，点击 `Publish to GitHub`。此按钮会真正向远端 `main` 提交公开文章；不只是保存到本机。草稿只在当前界面内，离开或刷新会丢失，长文章建议先在本地写好。
5. 成功后跳到文章页，显示已提交 GitHub、线上部署可能稍后更新的提示。等 GitHub Pages 部署完成再在新窗口确认公开页面。

写入使用 [GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)。每次发布先重新读取远端文章数组和当前 `sha`，保留已有文章；若地址重复则拒绝，若并发导致 `409` 则保留编辑器供重试，不强行覆盖。远端文件只能是约定的 JSON 数组注册，不能执行远端 JavaScript。当前只支持新增文章；改正文、改日期或删除文章通过本地源码维护。

令牌只在作者视图闭包内存中，不写入源码、浏览器本地存储或网址；关闭、切换栏目、退出和成功发布都会丢弃。编辑器限制为已验证的作者，最终写入授权由 GitHub 仓库权限执行，访客无法匿名写入。拥有仓库权限的其他 GitHub 协作者仍可直接通过 GitHub 修改仓库；如需严格独占写入，请由作者管理仓库协作者权限。

发布若显示网络结果不确定，先查看 GitHub 提交和文章地址再重试，避免重复操作。网页发布后维护本地项目时，先获取并快进同步远端文章，再进行本地编辑；不要用旧 ZIP 或本地空数组覆盖已经在线发表的 `posts.js`。

浏览器集成验证使用模拟 GitHub 响应，不使用真实令牌、提交文章或触发线上部署。未实测真实账户权限、分支保护和部署设置；是否允许实际发布仍取决于作者的 GitHub 配置。

模块接口见 [Moments 说明](../modules/life/moments/README.md)，通用提交和发布流程见 [工作协议](WORKFLOW.md)。
