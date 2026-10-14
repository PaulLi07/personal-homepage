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

网站运行时只读取普通 HTML、CSS、JavaScript 和本地资源，无外部运行时依赖。装配只在维护时进行；上传包已包含生成页面，GitHub Pages 无需构建。也可直接在浏览器中打开生成的 `index.html`；模块不依赖运行时请求 HTML 片段。

常驻 `preview` 没有热更新。修改并装配后，必须刷新用户实际打开的预览标签，确认新版图片、结构、样式和资源 URL。装配为 CSS 与静态 JS 加入内容 SHA256 前 12 位的 `?v=`；两份在线文章数据 `entries.js` / `posts.js` 由清单 `liveScripts` 保持原 URL，直接发布文章无需重装 HTML。图片仍用原路径，需核对实际显示。

检查导航时按正常动画点击各栏目，等待滚动及固定导航栏稳定，确认目标标题与边框没有被遮挡；元素居中可见或 hash 正确不能替代实际点击后的布局检查。

## 可重复兼容性测试

维护环境已安装 Playwright 及其 Chromium、Firefox、WebKit 浏览器时，在装配与检查后执行：

```sh
npm run assemble
npm run check
npm run test:compat
npm run test:features
npm run test:author
npm run test:photos
npm run test:academic-profile
npm run test:author-security
npm run test:security
npm run relationship:check
```

Playwright 位于项目外时，可用 `HOMEPAGE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright npm run test:compat` 指定模块路径。它是可选测试工具，网站运行、普通检查、预览和打包不依赖它；`npm run check` 不安装依赖或下载浏览器。

浏览器脚本自行启动临时服务器，在 `/personal-homepage/` 下验证页面，无需常驻预览。`test:compat` 检查布局、资源、导航、详情、键盘、历史、动画和文件打开；`test:features` 检查博客与加密视图；`test:author` 用随机密码、临时文章与完全模拟的 GitHub API，检查统一作者、加密连接缓存及两栏独立发布。报告分别为 `artifacts/compatibility-results.json`、`feature-results.json`、`author-log-results.json`；该目录被忽略且不用于源码交付。`test:author-security` 离线验证作者会话与缓存，`test:security` 验证 Relationship 算法，`relationship:check` 只读检查正式密文登记文件。

2026-10-10 统一作者与学术日志在三个内核、三个视口通过，共 144 个流程；离线作者会话 21 项通过，真实 GitHub 写入为 0，正式配置与两栏数据文件保持不变。环境及范围见 [author 记录](docs/modules/author.md)，基础与 Relationship 证据见 [兼容性实测](docs/COMPATIBILITY.md)。模拟视口不等于手机真机，模拟发布不等于真实账号或线上部署验证。

`test:photos` 验证照片、PDF、混合 ZIP、Git 请求边界与两栏附件发布；报告为 `artifacts/photo-results.json`。`test:academic-profile` 验证 Publications 三分类、论文元信息及 ORCID / BESIII 链接。实际证据见对应模块记录；既有测试历史保持原样，本轮照片/PDF 297 流程与学术资料 72 流程在三内核、三视口全部通过，原作者 144、旧功能 81 与离线会话 21 项回归通过；详见 [附件记录](docs/modules/article-photos.md)、[PDF 记录](docs/modules/article-documents.md) 和 [Publications 记录](docs/modules/academic-publications.md)。模拟接口不能代替线上实测。

## 功能入口

| 目录 | 负责内容 |
|---|---|
| `modules/home/` | 首屏介绍与宇宙背景 |
| `modules/about/` | 个人简介与资料 |
| `modules/academic/` | Experience、Publications、Notes、Projects；对应 `experience/`、`publications/`、`notes/`、`projects/` |
| `modules/life/` | Moments 博客、Travels 旅行、Creations 创作、Relationship 加密空间；各自保存内容、行为和资源 |
| `modules/author/` | Experience 与 Moments 共用的密码登录、GitHub 连接、表单编辑和独立发布器 |
| `modules/article-photos/` | 无首页分区的照片服务：数据规范、处理、选图、图库及 ZIP；照片文件仍归各文章 |
| `modules/article-documents/` | 两栏 PDF 附件规范、选择及 Open / Download 链接；原文件仍归各文章 |
| `modules/particle-background/` | 仅纯黑区域的微小白色实心点：局部运动、鼠标扰动、Canvas、配置与性能预算，无图片或运行时依赖 |
| `modules/contact/` | 联系方式、背景与年份 |
| `modules/credits/` | 图片署名独立页面 |
| `shared/` | 真正跨模块使用的基础样式、导航、详情弹窗、过渡与注册接口 |
| `app/` | 页面模板、模块清单和初始化胶水 |
| `scripts/` | 装配、检查、预览和打包工具 |
| `docs/` | 框架、协议、素材来源及模块测试记录 |

先打开对应功能目录的 `README.md`，再修改同目录源码。公开介绍与普通栏目编辑 `content.js`；Publications 各分类独立维护 `data.js`；Experience 学术日志维护 `entries.js`，Moments 文章维护 `posts.js`；Relationship 只由本地工具生成密文。没有真实资料时保留空条目。不要手改根目录 `index.html`、`credits.html`，它们会被装配覆盖。

## 学术日志、生活博客与统一作者入口

Experience 的 `#academic/experience` 展示学术日志，支持 Research / Learning / Seminar / Milestone 分类与可选 HTTPS 参考链接；Moments 的 `#life/moments` 展示生活文章。两栏各以 `/<slug>` 阅读正文、`/author` 进入工作台，数据分别在 `entries.js` 和 `posts.js`，正文为普通英文文本，可附最多 9 张公开照片及 3 份 PDF。`author` 不能用作文章标识。

先完整部署新版本。在任一作者入口输入统一作者密码，首次使用再连接具有目标仓库写权限的 GitHub PAT，并勾选记住加密连接；此后在同一浏览器只需密码恢复与权限重验。工作台核验 `PaulLi07`、仓库所有者与写权限，GitHub 执行真正授权。源码只保留随机盐与密码派生校验值，不保留原密码；更改密码使用 `npm run author:password` 在本地终端交互输入，随后完整部署新配置。

默认令牌只存当前页面会话内存；主动勾选记住连接后，才以密码派生密钥加密保存在当前浏览器。两栏及详情关闭共享已登录会话；`Sign out`、刷新或离开页面清内存。刷新后先输入密码解开缓存，再重新验证 GitHub 身份和权限；`Forget saved connection` 删除缓存。明文密码与令牌不进入源码、持久存储、URL、Cookie、历史或日志。

连接失效返回 401 时保留已解锁工作台和草稿，重新连接 GitHub 后再发布。浏览器缓存损坏或无权限时不会自动连接；忘记连接的存储删除失败会如实提示。

点击 `Publish to GitHub` 才更新 `main`。零附件文章保持 Contents GET / PUT；包含任意照片或 PDF 时，由独立发布器把文件与当前集合数据放入同一次 Git 提交，再以非强制方式更新 `main`。发布前读取同一 head 的远端记录与基树，保留已有文章、照片及 PDF；冲突保留草稿，两栏互不改写。会话将 head、基树、本次 blob、tree、commit 与 main 更新绑定，同次 tree 最多 13 项，每份 blob 最多 10 MiB；照片与 PDF 分别使用自己的批次标识。原有 Contents 读写 PAT 可继续使用，无需重新授权。

`Download update` 零附件时导出数据 JS，有任意附件时导出包含数据与新文件、保留仓库相对目录的 ZIP，文件负载最多 52 MiB。解压后把内部内容放到仓库根目录，不把 ZIP 本身上传网站；手动上传前核对远端最新数据并保留已有照片和 PDF。在线发布后，本地维护或打包前先 `git fetch origin`，核对改动后以 `git pull --ff-only` 同步，避免旧源码包覆盖新文章和文件。接口见 [作者模块](modules/author/README.md)，读者细节见 [Experience](modules/academic/experience/README.md) 与 [Moments](modules/life/moments/README.md)。

## 公开文章附图

每篇最多选择 9 张 JPEG、PNG 或 WebP，原图每张不超过 10 MiB。浏览器重绘移除原文件元数据，统一输出长边不超过 1920 像素的 JPEG；每张最多 2 MiB，处理后合计最多 18 MiB。每张填写非空英文 alt（最多 300 字符），可添加英文 caption（最多 600 字符）；阅读时在正文后按原比例显示。

可选数据字段为 `photos: [{ src, alt, caption? }]`。文件保存在当前栏目自己的 `images/posts/<文章 id>/<24位小写十六进制标识>-<1..9>.jpg`，不接受外链、跨栏目或跨文章引用。照片处理、选图、画廊与 ZIP 属于 [照片服务](modules/article-photos/README.md)，表单与发布器通过接口调用；旧的无图记录保持兼容。

## PDF 附件

两栏可选 `attachments: [{ src, title, size }]`，最多 3 份 PDF，每份最多 10 MiB、合计最多 30 MiB。英文标题非空且最多 160 字符，size 记录原文件字节数；文件位于当前集合的 `documents/posts/<文章 id>/<24hex>-<1..3>.pdf`，不接受外链、跨文或跨集合路径。

[PDF 服务](modules/article-documents/README.md)在照片之后、作者之前加载，负责规范、选择及阅读链接。PDF 保留原字节和元数据，只检查大小与头尾标识，不做完整解析或安全扫描；读者通过 Open PDF / Download PDF 使用新标签页和下载链接，不内嵌 iframe。旧记录省略附件字段时兼容。Relationship 不接入公开照片或 PDF；正式两栏文章数组仍为空，直到用户提供内容。

## 学术资料与论文分类

About 与 Contact 展示用户提供的 [ORCID](https://orcid.org/0009-0005-6858-4000)，Projects 包含 [BESIII Collaboration](http://bes3.ihep.ac.cn/) 官方链接。

[Publications](modules/academic/publications/README.md) 的 `#academic/publications` 是分类目录，子路由为 `/internal-note`、`/arxiv`、`/published`；各分类独立保存 `data.js` 和中文说明。当前 arXiv 收录用户指定的 [2610.11981](https://arxiv.org/abs/2610.11981)，题名、2026-10-08 日期及 BESIII Collaboration 署名已经官方页面核实；Internal note 和 Published 保持空数组。页面不推断用户贡献、合作组角色或正式发表状态，Abstract / PDF 保留原始外链。

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

## 2026-10-11 粒子背景分支

粒子功能在 `feat/emergent-particle-background` 开发；用户于 2026-10-14 确认效果并授权整合到 `main`、更新 GitHub。保留功能分支和各回退点；发布前远端另存 `backup/pre-publish-2026-10-14`（`3c8c364`）。加入粒子之前的版本由 `backup/pre-emergence-2026-10-11` 保留在 `93bf256`，157 文件的旧静态源码包为 `../outputs/personal-homepage-pre-emergence-2026-10-11.zip`。

本轮栏目布局之前另有 `backup/pre-section-layout-2026-10-11`（`3a2677c`）与 166 文件旧包 `../outputs/personal-homepage-pre-section-layout-2026-10-11.zip`，保留此前仅 About 的黑色粒子版本。回退前先保存当前改动，再按所需版本选择备份；两组备份均保留。

缓存与固定导航修复之前的回退点为 `backup/pre-preview-fixes-2026-10-11`（`14f5bf6`），前述备份继续保留。后续普通维护仍在用户请求发布时推送。

粒子按用户最新要求呈现为微小、密集、清晰的白色实心圆点，不使用模糊光晕。仅在 `data-particle-surface="black"` 标记的纯黑背景矩形内绘制，当前为 About、Academic、Life 各自的 `#000` 背景；图片背景区域不绘粒子，标记区域内的图片也排除。默认半径为 `0.4`–`0.85` CSS 像素，透明度为 `0.85`。

Academic 与 Life 去掉整区背景图，分别采用学术细线和白色细框、克制叠层相框。Home 使用 Ivan Rohovchenko / Unsplash 的山水图，独立保存于自己的 `hero.jpg`；Contact 使用用户提供的原始 `background.png`，原作者与来源尚未确认。图片由各模块维护，署名见 [素材清单](docs/image-sources.md)，首页和联系区不绘粒子。

局部规则和流场形成尘埃流及涡旋；参数集中在模块 `config.js`，手机限数、像素比上限、慢帧降级、后台 / 详情暂停及减少动态效果由服务负责，可临时 `configure({ enabled: false })` 关闭。艺术性运动不等于严格物理仿真。2026-10-11 最终回归于北京时间 16:33–16:37 完成：基础三内核九环境及正常 Life 导航的 24 项检查、作者 144 流程、粒子 255 流程 / 12234 断言通过，生产源码未被测试修改，外部请求与真实写入为 0。16:04 记录和此前 237 / 8088 保留为历史；照片 / PDF 专门矩阵及离线核心未重跑，227 条离线断言仍仅为此前证据。参数、接口、截图范围、实测限制和回退步骤见 [粒子维护指南](docs/PARTICLE-BACKGROUND.md)与[测试记录](docs/modules/particle-background.md)。

## 维护文档

- [框架概要](docs/ARCHITECTURE.md)：模块边界、装配、注册接口与扩展位置。
- [工作协议](docs/WORKFLOW.md)：Git、模块说明、测试、提交和发布流程。
- [模块目录](docs/modules/README.md)与[记录模板](docs/modules/TEMPLATE.md)：模块索引和兼容性测试证据。
- [兼容性实测](docs/COMPATIBILITY.md)：2026-10-10 新栏目及独立功能的实测环境、范围与限制，保留此前重构记录。
- [维护约定](AGENTS.md)与[变更记录](CHANGELOG.md)：后续工作规则与重要变化。
- [图片替换清单](docs/image-sources.md)与[参考分析](docs/reference-analysis.md)：素材来源及设计框架依据。
- [粒子背景维护与回退](docs/PARTICLE-BACKGROUND.md)：配置、生命周期、性能统计、功能分支与旧版恢复。

## Git 与发布

本地 `main` 跟踪 `origin/main`。日常流程为：检查状态 → 核对远端 → 修改模块 → 装配 → 检查与实测 → 本地提交 → 按发布请求更新远端。

默认只完成本地维护和提交，普通维护不自动推送。手动上传时将打包后文件夹的内部内容放到仓库根目录，使生成的 `index.html` 位于最外层，同时上传 `modules/`、`shared/` 等资源目录。ZIP 不包含 `.git`。

Pages 发布约定为 `main` / `/(root)`，保留根目录 `.nojekyll`，使用相对路径兼容 `/personal-homepage/`。更新部署分支会触发 Pages 部署。
