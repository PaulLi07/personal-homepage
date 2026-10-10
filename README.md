# Yuhong Li 个人主页

南开大学理论物理研究生的英文个人主页。按首页、简介、学术、生活、联系和素材署名等功能组织源码，各模块在自己的目录中保存结构、样式、脚本、内容、图片和中文说明。

- 网站：<https://paulli07.github.io/personal-homepage/>
- 远端：<https://github.com/PaulLi07/personal-homepage>
- 正式源码：工作区根目录的 `personal-homepage/`；`outputs/personal-homepage` 为兼容链接，其他解压副本属于历史快照。

## 快速开始

基础维护命令使用 Node.js 18+ 和 Python 3.9+，无需运行 `npm install`。

```sh
cd personal-homepage
npm run assemble    # 从模块源码生成根目录 index.html 和 credits.html
npm run check       # 只读检查：生成物是否最新、脚本语法、资源和注册关系
npm run preview     # 先装配再预览：http://127.0.0.1:8767/
npm run package     # 先装配再生成 ../outputs/personal-homepage-source.zip
```

网站运行时只读取普通 HTML、CSS、JavaScript 和本地图片，无外部运行时依赖。装配只在维护时进行；上传包已包含生成页面，GitHub Pages 无需构建。也可直接在浏览器中打开生成的 `index.html`；模块不依赖运行时请求 HTML 片段。

## 可重复兼容性测试

维护环境已安装 Playwright 及其 Chromium、Firefox、WebKit 浏览器时，在装配与检查后执行：

```sh
npm run assemble
npm run check
npm run test:compat
npm run test:features
npm run test:author
npm run test:author-security
npm run test:security
npm run relationship:check
```

Playwright 位于项目外时，可用 `HOMEPAGE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright npm run test:compat` 指定模块路径。它是可选测试工具，网站运行、普通检查、预览和打包不依赖它；`npm run check` 不安装依赖或下载浏览器。

浏览器脚本自行启动临时服务器，在 `/personal-homepage/` 下验证页面，无需常驻预览。`test:compat` 检查布局、资源、导航、详情、键盘、历史、动画和文件打开；`test:features` 检查博客与加密视图；`test:author` 用随机密码、临时文章与完全模拟的 GitHub API，检查统一作者、加密连接缓存及两栏独立发布。报告分别为 `artifacts/compatibility-results.json`、`feature-results.json`、`author-log-results.json`；该目录被忽略且不用于源码交付。`test:author-security` 离线验证作者会话与缓存，`test:security` 验证 Relationship 算法，`relationship:check` 只读检查正式密文登记文件。

2026-10-10 统一作者与学术日志在三个内核、三个视口通过，共 144 个流程；离线作者会话 21 项通过，真实 GitHub 写入为 0，正式配置与两栏数据文件保持不变。环境及范围见 [author 记录](docs/modules/author.md)，基础与 Relationship 证据见 [兼容性实测](docs/COMPATIBILITY.md)。模拟视口不等于手机真机，模拟发布不等于真实账号或线上部署验证。

## 功能入口

| 目录 | 负责内容 |
|---|---|
| `modules/home/` | 首屏介绍与宇宙背景 |
| `modules/about/` | 个人简介与资料 |
| `modules/academic/` | Experience、Publications、Notes、Projects；对应 `experience/`、`publications/`、`notes/`、`projects/` |
| `modules/life/` | Moments 博客、Travels 旅行、Creations 创作、Relationship 加密空间；各自保存内容、行为和资源 |
| `modules/author/` | Experience 与 Moments 共同使用的密码登录、GitHub 连接和编辑器服务 |
| `modules/contact/` | 联系方式、背景与年份 |
| `modules/credits/` | 图片署名独立页面 |
| `shared/` | 真正跨模块使用的基础样式、导航、详情弹窗、过渡与注册接口 |
| `app/` | 页面模板、模块清单和初始化胶水 |
| `scripts/` | 装配、检查、预览和打包工具 |
| `docs/` | 框架、协议、素材来源及模块测试记录 |

先打开对应功能目录的 `README.md`，再修改同目录源码。公开介绍与普通栏目编辑 `content.js`；Experience 学术日志维护 `entries.js`，Moments 文章维护 `posts.js`；Relationship 只由本地工具生成密文。没有真实资料时保留空条目。不要手改根目录 `index.html`、`credits.html`，它们会被装配覆盖。

## 学术日志、生活博客与统一作者入口

Experience 的 `#academic/experience` 展示学术日志，支持 Research / Learning / Seminar / Milestone 分类与可选 HTTPS 参考链接；Moments 的 `#life/moments` 展示生活文章。两栏各以 `/<slug>` 阅读正文、`/author` 进入工作台，数据分别在 `entries.js` 和 `posts.js`，正文均为普通英文文本。`author` 不能用作文章标识。

先完整部署新版本。在任一作者入口输入统一作者密码，首次使用再连接具有目标仓库写权限的 GitHub PAT，并勾选记住加密连接；此后在同一浏览器只需密码恢复与权限重验。工作台核验 `PaulLi07`、仓库所有者与写权限，GitHub 执行真正授权。源码只保留随机盐与密码派生校验值，不保留原密码；更改密码使用 `npm run author:password` 在本地终端交互输入，随后完整部署新配置。

默认令牌只存当前页面会话内存；主动勾选记住连接后，才以密码派生密钥加密保存在当前浏览器。两栏及详情关闭共享已登录会话；`Sign out`、刷新或离开页面清内存。刷新后先输入密码解开缓存，再重新验证 GitHub 身份和权限；`Forget saved connection` 删除缓存。明文密码与令牌不进入源码、持久存储、URL、Cookie、历史或日志。

连接失效返回 401 时保留已解锁工作台和草稿，重新连接 GitHub 后再发布。浏览器缓存损坏或无权限时不会自动连接；忘记连接的存储删除失败会如实提示。

点击 `Publish to GitHub` 才更新 `main` 中当前栏目的数据文件，发布前重读 SHA、保留远端文章，冲突不覆盖草稿；`Download update` 可只导出数据文件自行上传。两栏互不改写。在线发布后，本地维护或打包前先 `git fetch origin`，核对改动后以 `git pull --ff-only` 同步；存在分歧时保留并整合双方内容，避免旧源码包覆盖新文章。接口见 [作者模块](modules/author/README.md)，读者细节见 [Experience](modules/academic/experience/README.md) 与 [Moments](modules/life/moments/README.md)。

## Relationship 加密空间

默认 `modules/life/relationship/encrypted.js` 为 `null`，未配置内容或初始密码。公开介绍和封面不含私人资料。用户在本地交互终端运行：

```sh
node scripts/relationship.cjs --input /项目外/relationship.json
npm run relationship:check
```

输入 JSON 只含英文 `title` 和 `body`；工具隐藏输入并确认至少 12 字符的口令，使用 AES-GCM 256 位与 PBKDF2-SHA256 600000 次生成密文。密码不要发到聊天、写入源码或作为命令参数。

明文放在项目外，或已忽略且未跟踪的 `.private/`。`.private/` 不得进入 Git、源码包或公开部署；只上传生成的密文，完成检查和实测后再发布。解锁内容在关闭、切换或主动锁定后清理。细节见 [Relationship 说明](modules/life/relationship/README.md)。

## 固定维护要求

- 所有说明文档使用中文；文件路径、命令、代码标识、网址和专有名称保留原文。
- 所有网页呈现内容使用英文，包括页面标题、提示、替代文本和无障碍标签。
- 每次模块扩展同步模块内的简洁 `README.md`，在 `docs/modules/` 登记对应测试记录，并完成实际兼容性测试。
- 模块维护自己的资源；通过声明的共享服务交互，不直接读取其他模块内部。共享目录只接收已被多个模块使用的能力。

## 维护文档

- [框架概要](docs/ARCHITECTURE.md)：模块边界、装配、注册接口与扩展位置。
- [工作协议](docs/WORKFLOW.md)：Git、模块说明、测试、提交和发布流程。
- [模块目录](docs/modules/README.md)与[记录模板](docs/modules/TEMPLATE.md)：模块索引和兼容性测试证据。
- [兼容性实测](docs/COMPATIBILITY.md)：2026-10-10 新栏目及独立功能的实测环境、范围与限制，保留此前重构记录。
- [维护约定](AGENTS.md)与[变更记录](CHANGELOG.md)：后续工作规则与重要变化。
- [图片替换清单](docs/image-sources.md)与[参考分析](docs/reference-analysis.md)：素材来源及设计框架依据。

## Git 与发布

本地 `main` 跟踪 `origin/main`。日常流程为：检查状态 → 核对远端 → 修改模块 → 装配 → 检查与实测 → 本地提交 → 按发布请求更新远端。

默认只完成本地维护和提交，普通维护不自动推送。手动上传时将打包后文件夹的内部内容放到仓库根目录，使生成的 `index.html` 位于最外层，同时上传 `modules/`、`shared/` 等资源目录。ZIP 不包含 `.git`。

Pages 发布约定为 `main` / `/(root)`，保留根目录 `.nojekyll`，使用相对路径兼容 `/personal-homepage/`。更新部署分支会触发 Pages 部署。
