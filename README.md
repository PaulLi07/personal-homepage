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
npm run test:security
npm run relationship:check
```

Playwright 位于项目外时，可用 `HOMEPAGE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright npm run test:compat` 指定模块路径。它是可选测试工具，网站运行、普通检查、预览和打包不依赖它；`npm run check` 不安装依赖或下载浏览器。

两个浏览器脚本自行启动临时服务器，在 `/personal-homepage/` 下验证页面，无需常驻预览。`test:compat` 检查布局、资源、导航、详情、键盘、历史、动画和文件打开；`test:features` 使用临时文章与密文、完全模拟 GitHub API，验证博客、作者发布流程和解锁生命周期。报告分别为 `artifacts/compatibility-results.json` 与 `artifacts/feature-results.json`；该目录被忽略且不用于源码交付。`test:security` 离线验证加密算法，`relationship:check` 只读检查正式密文登记文件。

2026-10-10 两套浏览器测试均在三个内核、三个视口通过，功能测试共 81 个流程，加密算法 9 项通过；GitHub 真实写入为 0。实际环境和限制见 [兼容性实测](docs/COMPATIBILITY.md)。模拟视口不等于手机真机，模拟发布不等于真实账号或线上部署验证。

## 功能入口

| 目录 | 负责内容 |
|---|---|
| `modules/home/` | 首屏介绍与宇宙背景 |
| `modules/about/` | 个人简介与资料 |
| `modules/academic/` | Experience、Publications、Notes、Projects；对应 `experience/`、`publications/`、`notes/`、`projects/` |
| `modules/life/` | Moments 博客、Travels 旅行、Creations 创作、Relationship 加密空间；各自保存内容、行为和资源 |
| `modules/contact/` | 联系方式、背景与年份 |
| `modules/credits/` | 图片署名独立页面 |
| `shared/` | 真正跨模块使用的基础样式、导航、详情弹窗、过渡与注册接口 |
| `app/` | 页面模板、模块清单和初始化胶水 |
| `scripts/` | 装配、检查、预览和打包工具 |
| `docs/` | 框架、协议、素材来源及模块测试记录 |

先打开对应功能目录的 `README.md`，再修改同目录源码。学术与普通生活栏目编辑 `content.js`；Moments 文章维护 `posts.js`；Relationship 只由本地工具生成密文。没有真实资料时保留空条目。不要手改根目录 `index.html`、`credits.html`，它们会被装配覆盖。

## Moments 博客与作者工作台

访客从 `#life/moments` 查看文章列表，从 `#life/moments/<slug>` 阅读正文。`#life/moments/author` 是作者工作台；`author` 不能用作文章标识。文章数据是 `posts.js` 中登记的 JSON 数组，正文按普通英文文本显示。

本次推荐默认通过 GitHub PAT 使用作者工作台。先完整部署新版本，再在网页作者入口输入具有目标仓库写权限的令牌；工作台核验 `PaulLi07` 身份、仓库所有者与权限。真正的写入授权由 GitHub 执行，访客看到作者按钮不代表能发布。

令牌只存当前工作台内存，关闭或退出即丢弃，不进入源码或浏览器持久存储。用户点击 `Publish` 后才通过 GitHub Contents API 的 PUT 更新主分支 `modules/life/moments/posts.js`，触发后续 Pages 更新。在线发文后，本地维护或打包前先 `git fetch origin`，核对改动后以 `git pull --ff-only` 同步；存在分歧时先保留并整合双方内容，避免旧源码包覆盖新文章。细节见 [Moments 说明](modules/life/moments/README.md)。

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
