# 基本工作协议

正式源码只在工作区根目录 `personal-homepage/` 维护。代理约定见根目录 `AGENTS.md`，模块使用方式见各自 `README.md`。

## 1. 修改边界

- **所有说明文档使用中文。** 路径、代码标识、命令、网址和专有名称保留原文。
- **所有网页呈现内容使用英文。** 包括正文、导航、按钮、弹窗、提示、空状态、图片署名、页面标题与描述、替代文本和无障碍标签；署名页同样遵守。
- 全站普通信息保持常规字形、适中字号、简洁学术风与宇宙主题，只使用用户提供的真实资料。2026-10-25批准的Life拍立得黄色标题、照片标签与白色语录使用局部手写字体；只从Life本地目录加载并保留SIL OFL 1.1原版权/许可，不扩散到全站，不请求远程字体。
- 按功能维护 `modules/<功能>/`，结构、样式、行为、内容、资源和说明放在同一模块；详情子模块独立贡献数据，不集中到一个总内容文件。
- 当前学术栏目为 Experience、Publications、Notes、Projects；生活栏目为 Moments、Travels、Creations、Relationship。Experience 学术日志与 Moments 生活文章分别维护，没有用户资料时保持空数组，不编造内容。
- Publications 再分 Internal note、arXiv、Published，各目录独立 `data.js` 与中文 README；分类目录及 `/internal-note`、`/arxiv`、`/published` 子路由使用既有自定义详情接口，不建立另一套弹窗。仅登记用户提供并核对的论文资料；当前内部材料和已发表分类为空。
- ORCID 在 About 与 Contact 同步显示，BESIII 官方链接在 Projects；arXiv:2610.11981 展示官方题名、2026-10-08 日期及 BESIII Collaboration 署名。不据此推断个人贡献、合作组角色或正式发表状态。
- 模块不直接读取其他模块内部；通过声明清单和注册接口使用共享服务。`shared/` 仅承载实际跨模块复用能力，不能堆放单模块业务。
- `modules/author/` 以无 HTML 根节点的 `services` 提供统一会话、表单与独立发布器；`modules/article-photos/` 独立提供图片规范、处理、选图、图库与混合 ZIP，`modules/article-documents/` 独立提供 PDF 规范、选择与阅读链接。加载顺序为照片、PDF、作者，再加载栏目数据。集合数据、读者和实际文件仍由各自模块负责，Relationship 不接入公开附件。
- 胶水只负责声明、接入和启动，隔离单模块初始化异常；具体模块行为留在模块内，不让一个模块故障阻断其他模块启动。
- 粒子背景独立作为 `modules/particle-background/` 服务，胶水只挂载公共根节点及状态；参数、局部规则、鼠标输入、Canvas 层级、暂停和清理不放回胶水或栏目。只绘制模块声明的纯黑区域，图片及公开排除区域保持干净。当前 About / Academic / Life 为黑区，Academic保留分隔/漫画场景，Life使用各张照片的拍立得白边堆叠，已取消整区白框与滚动漂移；Home 用户提供的黑白雨景与 Contact 用户夜景各自维护独立图片。调整时同步验证前景可读性、手机数量、DPR、减少动态效果、详情与失效回退。
- 修改前读取相关源码和说明，保留用户未提交的改动。新增框架、依赖或跨模块接口须对应具体需求。
- 根 `index.html`、`credits.html` 是生成产物，修改源片段或模板后显式装配，禁止手改生成页面。保持相对资源路径、普通脚本和直接文件打开能力。
- CSS 与静态 JS 由装配器添加内容 SHA256 前 12 位 `?v=`；`liveScripts` 必须属于本模块 `scripts`，当前仅两份在线数据 `entries.js` / `posts.js` 保留原 URL。直接发布文章无需重装 HTML；图片仍使用原路径，不把内容版本机制写成热更新，也不改变作者权限与发布流程。

## 2. Git 开始与同步

`origin` 的获取地址为 `https://github.com/PaulLi07/personal-homepage.git`，推送地址为 `git@github.com:PaulLi07/personal-homepage.git`，`main` 跟踪 `origin/main`。当前电脑已验证 SSH 推送；`git push origin main` 会使用已配置的推送地址，浏览器内的作者令牌不参与本地 Git 操作。换电脑后需自行建立对应 Git 身份，远端地址中不得加入令牌。

```sh
git status --short --branch
git fetch origin
git log --oneline --left-right main...origin/main
```

工作区干净且本地可快进时在 `main` 执行 `git pull --ff-only`。仓库设置为 `pull.ff=only`、`push.default=simple`、`fetch.prune=true`；不通过普通拉取自动产生合并提交。

有未提交改动、远端变化或分歧时先检查并保留双方内容，再同步，不硬重置、丢弃用户改动或强制推送。小任务可在 `main` 本地提交；跨模块或较大设计调整使用任务分支：

```sh
git switch -c feat/short-topic
```

通过检查与实测后整合到本地 `main`。

**当前发布约定（2026-10-14）：**用户已确认当前效果并要求更新到 GitHub，允许将已验证的功能分支快进整合到 `main` 并推送；此前 2026-10-11 暂不合并和推送的约定结束。保留 `feat/emergent-particle-background` 与所有回退分支；`backup/pre-emergence-2026-10-11` 保留 `93bf256`，`backup/pre-publish-2026-10-14` 保留发布前远端 `3c8c364`，仓库外另有 157 文件的旧包。此次发布授权不代表后续维护自动推送。回退前先完整保存未提交及所需忽略文件，再切回旧分支；不硬重置、强制推送或删目录回退。本轮栏目布局前另存 `backup/pre-section-layout-2026-10-11`（`3a2677c`）及 166 文件旧包 `../outputs/personal-homepage-pre-section-layout-2026-10-11.zip`，可仅回退这次分区与图片变化。临时关闭及后续已部署版本的回退见 [专门指南](PARTICLE-BACKGROUND.md)。

缓存与导航修复之前另存 `backup/pre-preview-fixes-2026-10-11`（`14f5bf6`），其他备份继续保留。选择回退点时先保存当前改动，核对需要恢复的版本范围。

## 3. 模块扩展与说明

模块指可独立维护的页面分区、详情栏目或功能。新增模块、扩展功能或改变接口，都必须随代码交付对应的简洁中文说明；纯文字纠错不属于模块扩展。

1. 新模块在自己的目录建立 `README.md`，记录用途、入口、文件职责、数据与共享接口、修改方法。详情子模块也保留就近说明，无需复制整段源码。
2. 在 `docs/modules/<模块标识>.md` 链接模块 README 并记录兼容性测试，使用 [模板](modules/TEMPLATE.md)，在 [目录](modules/README.md) 登记。详情标识使用 `academic-experience` 等简短小写名称。
3. 扩展已有模块时更新就近说明和测试记录；没有对应说明的先补建。框架边界和清单变化同步 `docs/ARCHITECTURE.md`，重要变化同步 `CHANGELOG.md`。
4. 公开详情通过 `registerDetail` 注册；自定义详情通过 `registerDetailView(group, key, { render })` 注册，接收 `{ host, route, signal, navigate }` 并可返回清理函数。页面模块仍使用 `registerSection` 和初始化传入的 `{ root, details, reducedMotion }`。
5. `registerData` / `getData` 只登记数据，模块维护自己的 getter、校验和业务。单模块能力留在模块中，胶水只传视图注册表与共享服务；接口变化注明使用者并回归。
6. 修改完成后运行 `npm run assemble`，再检查及实测。源码、生成页面、模块说明和测试记录一起提交，不留到以后补写。

### 独立项目与实验地图

集成其他目录的项目时，必须把运行和日常维护所需的源码、数据、图片及说明复制到主页所属模块，不使用符号链接、绝对本机路径或外部工作目录的服务。原项目可能被用户移除；不得把“本机当前可访问”当成部署依赖已经闭合。

实验地图各自的完整HTML在 `app/site.json` 所属模块的 `standalonePages` 登记，保持页面相对路径；新增地图同时更新地图集登记、生成元数据和顶栏，并补中文说明、英文页面及实际测试记录。先运行本地数据生成检查及资源闭合工具，再验证HTTP子路径、桌面/手机、筛选、档案与返回。使用独立复制副本验证原目录不可见时仍能运行；不要为测试而移动或删除用户原目录。

地图使用 ES Module 和本地数据请求，必须通过HTTP预览，不以 `file://` 打开结果作为地图验收。具体生成、只读检查和新增地图步骤统一见[地图集说明](../modules/academic/projects/experiment-atlas/README.md)。

## 4. 兼容性测试

**每次模块扩展必须实际测试兼容性。** 布局或交互修改也适用。`npm run check` 只读检查生成物、脚本语法、资源和注册关系，不能验证浏览器布局与交互；仅修改说明文档时执行静态和文档检查即可。

| 范围 | 最低检查内容 |
|---|---|
| 桌面与手机布局 | 至少一个可用浏览器实测桌面及手机视口，检查文字、图片、导航、弹窗及横向溢出；例如 1440、390、320 像素宽，记录实际尺寸与浏览器版本 |
| 浏览器覆盖 | 优先实测可用的 Chromium、Gecko、WebKit；目标包括 Chrome / Edge、Firefox、Safari；未运行环境明确标注 |
| 操作方式 | 鼠标、Tab / Enter / Escape、焦点恢复；触屏相关功能另测触摸或模拟，并注明模拟或真机 |
| 导航与发布方式 | 模块入口、详情直达、刷新、前进 / 后退与关闭；正常动画下点击导航并等滚动稳定，确认固定栏未遮标题、白框或首行；检查子路径与文件打开，hash 或居中可见不足以证明点击后布局正确 |
| 状态与动画 | 按功能测试空数据、图片加载和减少动态效果；无相关状态时写明不适用原因 |
| 既有模块 | 回归受共享样式、脚本、注册、模板或装配变化影响的功能；装配变化还需检查首页与署名页 |

记录日期、浏览器版本、视口、检查项、结果、问题与复测。模拟手机视口不能称为真机测试，静态检查不能称为浏览器兼容性证据，单一内核不能称为跨浏览器测试通过。未运行的环境写“未测试”，交付摘要注明限制；发现故障后修复并复测，再完成扩展。

必须检查用户实际打开的预览标签。常驻服务器不会热更新文档；源码修改、装配完成后刷新该标签，确认新版图片、结构、样式以及带 `?v=` 的静态资源，不能用新建测试标签替代旧标签刷新。窄屏导航包含用户实际 431×767 视口及受影响的更窄布局，在正常动画后比对固定栏底部和目标内容边界。共享 `--navigation-height` 为桌面 76px、≤760 为 104px；Academic 与 Life 在该值之上额外增加 16px 锚点空间。2026-10-23 设计与实际预览范围见 [本轮记录](COMPATIBILITY.md#apple-design-2026-10-23)。

### 可重复测试工具

`scripts/test-compatibility.cjs`、`scripts/test-features.cjs`、`scripts/test-author-log.cjs` 分别提供 `npm run test:compat`、`npm run test:features`、`npm run test:author`。先装配并执行普通检查，再按改动范围运行；它们不会自动装配，也不会安装工具或下载浏览器。维护环境需预先提供 Playwright 及 Chromium、Firefox、WebKit，可通过 `HOMEPAGE_PLAYWRIGHT_MODULE` 指定已有模块路径。测试依赖不参与网站运行，普通 `check` 保持离线、只读且不需要测试工具。

浏览器脚本自启临时 HTTP 服务，验证仓库子路径，不依赖常驻 `preview`。基础案例覆盖三个内核、1440×900 / 390×844 / 320×780 视口、详情入口、键盘、历史、资源、动画、文件打开和署名页返回。功能案例覆盖读者嵌套路由与 Relationship 解锁 / 清理；统一作者案例覆盖密码拒绝、两栏会话复用、GitHub 身份或权限错误、发布冲突、最新 SHA、集合隔离、退出、加密连接缓存、刷新重验与篡改拒绝。文章、密码、密文、令牌与 GitHub 响应均为临时夹具，远端写入全部拦截。窄屏模拟不等于真机，GitHub API 模拟通过不等于真实账号发布成功。

报告写入被忽略且不交付的 `artifacts/compatibility-results.json`、`feature-results.json`、`author-log-results.json`。核对本次命令退出结果与报告日期，将相关证据和限制写入 `docs/modules/`；旧报告存在不代表本轮通过。新增模块或改变数据、路由和接口时同步补测试案例，自动检查之外仍按任务范围检查实际视觉布局，不能套用旧模块结果。

`npm run test:security` 无需 Playwright，用内存随机夹具验证算法往返、独立 Web Crypto 互通、篡改拒绝、格式边界及注册解析；它不配置真实口令，不请求网络，不修改正式密文。`npm run relationship:check` 只读检查 `encrypted.js` 格式，默认空值合法。2026-10-10 的本次结果见 [兼容性记录](COMPATIBILITY.md)；格式通过不代表真实私密资料、打包排除或线上环境已经验证。

`npm run test:author-security` 离线验证统一会话、密码派生、缓存加密 / 篡改、取消、401 与请求边界；只用随机密码及模拟 GitHub。它与真实页面 `test:author` 分开，不能以离线通过替代浏览器焦点、表单和双集合发布测试。

`npm run test:photos` 验证旧记录零附件兼容、9 张 / 18 MiB 照片边界、输入格式和尺寸、JPEG 输出、英文 alt / 纯文本 caption、受控路径、预览排序删除、关闭取消与原比例图库；还需覆盖 PDF 3 份 / 30 MiB、每份 10 MiB、英文标题、原字节与基本头尾检查、阅读链接及混合 ZIP。发布测试覆盖零附件 Contents、任意附件同版 head / tree / 数据读取、文件和数据的一次提交、已有照片和 PDF 保留、分支冲突及未更新 `main` 时不显示文章。使用临时文件和模拟 GitHub，不上传示例资料；报告为 `artifacts/photo-results.json`，对应证据由本轮验证后登记。

`npm run test:academic-profile` 验证 Publications 三分类点击、直达、刷新、返回、空状态与安全文本，核对 arXiv 题名、元信息及 Abstract / PDF 外链，同时检查 About / Contact ORCID、Projects BESIII 和窄屏布局。既有历史测试记录保持原样，本轮附件 297 流程与学术资料 72 流程在三内核/三视口通过，证据见对应模块记录；后续修改仍须重新实测。

## 5. 装配、检查与提交

```sh
npm run assemble
npm run check
git diff --check
git diff
# 示例：仅暂存本次任务文件，包含最新生成页面
git add modules/about index.html docs/modules/about.md
git commit -m "feat: 扩展个人简介"
git status --short --branch
```

- `assemble` 写入根页面；`check` 只读，生成物过期时失败，不自动改文件。
- `preview` 与 `package` 先装配，再预览或打包；打包前仍需完成本任务检查与实测。
- 常驻 `preview` 不自动重载浏览器；装配后刷新用户实际标签并核对页面与计算样式，再报告用户可见结果。
- 提交使用 `feat:`、`fix:`、`style:`、`docs:`、`chore:` 加简短描述，一个提交围绕一个目的，保留无关改动。
- 暂存前核对中文文档、英文网页、模块说明、实测记录与生成物；系统文件、缓存、ZIP 和 Git 元数据不属于网站源码。
- `.private/` 拒绝跟踪、打包和公开部署，不得使用强制暂存绕过忽略规则；密码、PAT 和私密明文不进入源码、日志或聊天。
- 公共封面和占位素材变更同步英文替代文本、来源说明、署名页及素材清单；文章照片和 PDF 留在自己的记录目录，维护英文 alt / caption 与附件标题，保留其他已发布文件。

## 6. 发布与交付

普通维护完成本地修改、检查、实测与提交，交付摘要说明变更、验证和提交状态。仅在用户明确请求发布或推送时更新远端。

2026-10-14 的粒子版本曾按第 2 节明确授权发布；2026-10-23 设计改版目前只做本地更新。后续发布仍以用户具体要求为准。发布前重新获取远端并核对文章与附件差异，非强制推送；推送后检查 Pages 部署状态及线上资源版本。下面保留的是历史测试记录，本次滚动修正结果见 [粒子记录](modules/particle-background.md)。2026-10-11 缓存与导航修复已于 16:33–16:37 回归通过：基础三内核九环境及正常 Life 导航 24 项、作者 144 流程、粒子 255 流程 / 12234 断言；生产源码未被测试修改，外部请求与真实写入为 0。16:04、201 / 237 和离线 227 均为此前版本历史；照片 / PDF 专门矩阵及离线核心未重跑。环境、截图、人工负载与未覆盖项见 [粒子记录](modules/particle-background.md)，后续改动须重新测试。

**手动上传：**运行 `npm run package`，解压 `../outputs/personal-homepage-source.zip`，将解压后 `personal-homepage/` 内部文件和目录上传到仓库根目录。保留生成的 `index.html`、`credits.html`、模块和共享资源以及 `.nojekyll`；服务器无需重新装配。

手动上传当前版本时，远端旧的 `css/`、`js/`、`assets/` 目录及 `modules/academic/research/`、`modules/life/places/`、`modules/life/notes/`、`modules/life/outside/` 需随迁移删除；后四项分别由 experience / travels / creations / relationship 替代。它们已从正式源码移除，通过 Git 推送相应提交会同步删除；上传新增文件不会自动清理旧目录。先核对远端内容并保留用户新增资料及 Git 历史，再按迁移范围处理。

本次布局移除的三个旧文件为 `modules/academic/images/background.jpg`、`modules/life/images/background.jpg`、`modules/contact/images/background.jpg`。手动上传新内容不会删除它们；确认远端仍为旧背景文件后再清理，不删除四栏目各自的 `images/cover.jpg` 或用户新附件。

**Git 推送：**按授权范围核对远端最新状态和待发布提交，再执行：

```sh
git push origin main
```

不要将身份令牌写入远端 URL、配置或仓库。部署后检查线上首页、学术详情、生活栏目、博客阅读、关系空间未配置或锁定状态、署名页与手机布局。手动上传过更新后先 `git fetch origin`，比较再同步，保持一份正式源码。

### 统一作者与两栏发布

1. 先完整部署新版本的生成页面、作者服务、模块脚本、样式及资源，再使用 `#academic/experience/author` 或 `#life/moments/author`；仅上传数据文件不能让旧版网站获得新工作台。
2. 统一作者密码只以随机盐与 PBKDF2-SHA256 600000 次派生校验值保存在配置；不把用户原密码写入源码、文档、日志或聊天。输入密码后才显示编辑器；首次使用再连接 GitHub PAT。更改密码使用 `npm run author:password` 的本地隐藏输入与确认，随后完整部署；旧连接缓存需重新建立。
3. 用户已选择在线发布并记住加密连接的流程；首次连接时勾选 remember。工作台核验 `PaulLi07`、仓库所有者与写权限，真实仓库授权仍由 GitHub 执行。未选择记住时只保留会话内存，选择后仅加密缓存进当前浏览器 localStorage；明文密码与令牌不进入持久存储、URL、Cookie、历史或源码。
4. 会话可跨两栏与详情关闭保持。Sign out 清内存并锁定两处，保存的加密连接可保留；Forget 删除缓存及当前连接。刷新 / 页面离开清内存；刷新后须输入密码解密缓存，再 GET `/user` 与仓库重验，损坏或失效时重新连接。请求返回 401 时保持解锁和草稿，清连接后重新连接 GitHub；缓存删除失败须如实提示。
5. Experience 在 `entries.js` 登记英文日志，增加学术类型与可选 HTTPS 参考；Moments 在 `posts.js` 登记英文生活文章。两集合独立，标识稳定，`author` 保留。可选 `photos: [{ src, alt, caption? }]` 最多 9 张，路径为当前文章的 `images/posts/<id>/<24hex>-<1..9>.jpg`；可选 `attachments: [{ src, title, size }]` 最多 3 份，路径为 `documents/posts/<id>/<24hex>-<1..3>.pdf`。禁止外链、跨文与路径穿越，保留旧结构及已有合法附件；远端只解析纯 JSON，不执行脚本或注入 HTML。
6. 原图接受 JPEG、PNG、WebP，每张最多 10 MiB；浏览器重绘移除元数据，输出长边最多 1920 像素、每张最多 2 MiB、合计最多 18 MiB 的 JPEG。填写非空英文 alt（最多 300 字符）与可选英文 caption（最多 600 字符）。PDF 每份最多 10 MiB、合计最多 30 MiB，英文 title 非空且最多 160 字符、size 与原字节数一致；保留原字节和元数据，只做大小与头尾基本检查，不进行完整解析或扫描。读者使用 Open PDF / Download PDF 链接，不内嵌 iframe。处理完成后方可发布或下载。
7. 编辑器只管表单；`author/publisher.js` 独立解析、合并与发布。用户点击 `Publish to GitHub` 后，零附件保持 Contents GET / PUT 与 SHA 校验；有任意照片或 PDF 就 GET `main` head 及对应 commit 的 tree SHA，并以 `?ref=head` 读取同版数据，POST 附件与数据 blobs / tree / commit（`parents: [head]`），最后 PATCH `main` 且 `force: false`。附件与数据同次可见提交，冲突保留草稿，不强制覆盖；未更新 `main` 的 Git 对象不会作为网页文章出现。会话绑定同次 head、基树、blob、受控 tree、commit 与 main 更新，失败、取消、新 head 或授权失效后清理；每份 blob 最多 10 MiB，tree 最多 13 项，照片与 PDF 各自一个批次标识且只能属于同一文章。已有 Contents 读写 PAT 可继续使用，无需重新授权。
8. `Download update` 零附件下载数据 JS，有任意附件下载包含数据与新照片 / PDF、保留仓库相对目录的 ZIP，文件负载最多 52 MiB。解压后上传内部内容至仓库根，禁止仅上传 ZIP；先核对远端最新记录，保留既有文件。下载与普通手动上传都没有自动 SHA 冲突保护。
9. Pages 更新后检查列表、正文、全部照片、PDF 打开 / 下载及直达链接。下一次本地维护或打包前先 `git fetch origin`，核对后以 `git pull --ff-only` 同步；有分歧则保留双方内容，避免旧包覆盖在线更新的记录或文件。本轮附件与学术结果见各自模块记录，历史作者证据见 [author 记录](modules/author.md)。

### Relationship 本地配置

默认 `encrypted.js` 登记 `null`，没有初始口令。用户准备只含英文 `title` 与 `body` 的明文 JSON，放在项目外，或已忽略且未跟踪的 `.private/`，在自己的交互终端运行：

```sh
node scripts/relationship.cjs --input /项目外/relationship.json
npm run relationship:check
```

工具隐藏输入并确认至少 12 字符的独立口令，使用 AES-GCM 256 位与 PBKDF2-SHA256 600000 次生成 `encrypted.js`。不从聊天、参数或源码读取明文密码；公开部署只允许密文与通用介绍，`.private/`、明文备份和私密照片不上传。随后装配、检查、实测并按发布授权更新网站。浏览器解锁需要可用 Web Crypto；关闭、切换或主动锁定后清理明文。

## 7. 常用入口

| 操作 | 命令 / 文件 |
|---|---|
| 改功能 | 对应 `modules/<功能>/README.md` 及同目录源码 |
| 改详情 | 对应学术 / 生活子模块的 `content.js` |
| 两栏数据 / 作者入口 | Experience 的 `entries.js` 与 `/author`；Moments 的 `posts.js` 与 `/author` |
| 本地生成 Relationship 密文 | `node scripts/relationship.cjs --input /项目外/relationship.json` |
| 改模块声明或外壳 | `app/site.json`、`app/*.template.html` |
| 装配 / 只读检查 | `npm run assemble` / `npm run check` |
| 可选浏览器兼容性测试 | `npm run test:compat`；工具来源可用 `HOMEPAGE_PLAYWRIGHT_MODULE` 指定 |
| 可选功能集成测试 | `npm run test:features`；GitHub API 全部模拟，真实远端写入为 0 |
| 统一作者与学术日志测试 | `npm run test:author`；随机密码及双集合夹具，GitHub 全模拟 |
| 照片 / PDF 与附件发布测试 | `npm run test:photos`；临时文件与 GitHub 全模拟，真实远端写入为 0 |
| Life拍立得离线回归 | `npm run test:life-stack`；输入顺序、焦点、有限层级与生命周期，不代替浏览器视觉/触摸验证 |
| 学术资料及论文分类测试 | `npm run test:academic-profile`；分类路由、元信息、资料外链与兼容性 |
| 离线作者会话 / 更改作者密码 | `npm run test:author-security` / `npm run author:password`（本地交互，不使用命令参数传密码） |
| 离线加密算法 / 正式密文格式 | `npm run test:security` / `npm run relationship:check` |
| 本地预览 | `npm run preview`，默认端口 8767 |
| 替换图片 | 对应模块 `images/` 与图片来源文档 |
| 模块说明 / 测试 | 模块内 `README.md` / `docs/modules/<标识>.md` |
| 查看远端 / 待发布 | `git remote -v` / `git log --oneline origin/main..HEAD` |

### 人物动作库回归

扩展Academic人物动作时运行 `npm run test:walker-actions`（纯素材、随机导演、连续性与30分钟模拟时钟）和 `npm run test:walker-lifecycle`（内存DOM/时钟的暂停、恢复、缩放、卸载），并用 `npm run test:academic-scene` 回归现有入口。离线结果不代表浏览器观感；仍须实测桌面/窄屏、动作衔接、人物/草地基线、详情/离屏暂停和恢复。未运行的原生系统偏好或品牌内核应如实记录。

## 2026-10-23：可读性与公式维护

辅助文字原则上不小于12px，按模块适度调整，正文/标题层级保持；公式的上下标不受全局最小字号覆盖。公开论文采用必填纯文本 `title` 与可选 `titleTex`，后者只通过[本地数学服务](../shared/math/README.md)排版，新增公式需运行 `npm run test:math` 并实测窄屏换行。Academic图片下方图注/进度区透明，仅照片本身排除粒子；播放按钮已移除，自动轮播及条件暂停继续保留。人物默认60px，调整时核对路径、动作与草地基线。本轮分支 `feat/readability-and-math`，回退点 `backup/pre-readability-math-2026-10-23`（`555de1d`），未授权推送。

## About相册维护（2026-10-23）

相册照片与计时参数在 `modules/about/gallery/photos.js`，新增照片归该模块images并维护英文alt/署名、尺寸、焦点和SHA12；首张同步片段静态回退。用户原人像保留原字节，仅生成单独网页缩放副本。图内底部显示半透明序号，两侧显示箭头，不在图片下另设控制条；图下个人说明直接编辑About片段。每次扩展运行 `npm run test:about-gallery`、装配及检查，实测小屏控件不重叠、手动/自动切换、暂停/恢复、图片排除粒子及普通导航。分支 `feat/about-photo-gallery`，回退 `backup/pre-about-gallery-2026-10-23`（`6cf69f5`），未授权推送。

## 全宽组合维护（2026-10-23）

About的Gallery与右侧资料共同全宽，不能误改为Gallery独占整行；图片区直角左贴边，资料和说明按局部inset留白。Academic全宽场景保持路牌受控尺寸、图片贴右、草地贯穿及共同脚底基线。调整各自样式，不改全局gutter影响其他模块。必须实际核对901/1024/1440与超宽布局、小屏控件/说明、图窗边缘焦点、粒子边界和真实导航。回退点 `073d6b3`，分支 `style/edge-to-edge-sections`，未授权推送。

用户后续纠正以上外观：桌面About采用2.5%空白／65%照片／30%资料／2.5%空白，照片降低高度、资料与其齐高；Academic照片保留真实16:9和760px宽上限，右侧加入独立漫画叶树。不得再将相册贴边或用高度上限把Academic图窗拉成横条。新装饰归Academic自己的探索模块，声明无障碍装饰和粒子排除；检查树根/人物脚底、草地共同基线及小屏入口遮挡。回退 `2dcad80`，分支 `style/balanced-about-academic`，仅本地维护。

2026-10-24最新Academic修正取代上述760px/叶树规则：图窗扩大到中右部、最大1280px，右下为透明的三株漫画椰子树，路牌稍右移。用户要求透明装饰空隙透出粒子，采用本模块CSS背景SVG＋既有前景合成，不能给导航/树外层添加整矩形排除，也不能改回会被自动排除的树img；照片与实体草地仍排除。实际观察或截图差分须核对空隙有运动、静态照片采样不受影响，并回归手机文字、接地、入口/焦点。回退 `4d84c60`，分支 `style/academic-coconut-palms`，只在本地维护。

同日后续高度纠正覆盖矮椰林/1280px方案：长树干接地、整组树冠高于照片，照片缩为中间尺寸（1440视口约846px）。桌面/窄屏使用不同原生长干SVG，不能纵向拉伸树冠；通过y1647/y2927根基线及保守y453最低叶尖校验，树根=草地top＋26，叶尖在照片顶部之上。窄屏文案换行也会影响共同地面，修改后必须重新量测。透明粒子规则保留，回退 `c9848a9`、分支 `style/academic-tall-palms`，仅本地维护。

2026-10-24最新紧凑构图取代上一轮整排树冠留白与超长手机树：两份原生SVG统一720×1120、根y1107，三冠高低交叠、聚根交干，桌面图片左移，≤760px照片在上而漫画造景在下；≥1800px主体收拢至居中1800px范围，草地/分隔仍全宽。允许叶片在照片后自然交叠，不再强迫全部最低叶尖高于照片；透明层级、英文页面与中文说明原则保持。CSS素材引用须同步内容版本，装配后刷新原预览核实；接口与胶水不变。分支 `style/academic-compact-grove`，回退 `b156e06`，实际验证见[最新记录](COMPATIBILITY.md#compact-grove-2026-10-24)。

## Life 拍立得维护（2026-10-25）

配置、输入控制、构图和本地字体归 `modules/life/stack/`；父 `module.js` 仅注册分区并挂载/清理。更换入口文字同步配置、片段静态回退与英文无障碍标签；封面仍在所属栏目维护，语录在父片段。不要重建旧整区白框、滚动漂移或手机错落双列，不把Moments博客、作者发布及Relationship密码移入照片堆。全站普通字体保持，Life局部花体按[字体说明](../modules/life/stack/fonts/README.md)保留本地WOFF2、原版权和SIL OFL 1.1许可。

改动后运行 `npm run test:life-stack`、装配、只读检查和差异检查。离线输入测试不能证明叠层可触达或触摸已兼容，仍需刷新用户原预览，实际验证四卡在不同层级下均有外露入口、hover/focus切换、长标题、鼠标单击与触摸两步、Enter/Space、四个原详情、历史/焦点、减少动态效果、无横向溢出及照片/纸边粒子排除。仅调整手机视口不能称为触摸或真机测试；证据按实际范围写入Life记录。

分支 `feat/life-polaroid-stack`，改动前 `0783998` 由 `backup/pre-life-polaroids-2026-10-25` 保留。回退先保存当前工作与用户未提交的人像，不硬重置或覆盖图片；完成本地验证/提交不等于自动推送，发布仍以用户具体授权为准。
