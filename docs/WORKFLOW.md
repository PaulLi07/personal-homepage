# 基本工作协议

正式源码只在工作区根目录 `personal-homepage/` 维护。代理约定见根目录 `AGENTS.md`，模块使用方式见各自 `README.md`。

## 1. 修改边界

- **所有说明文档使用中文。** 路径、代码标识、命令、网址和专有名称保留原文。
- **所有网页呈现内容使用英文。** 包括正文、导航、按钮、弹窗、提示、空状态、图片署名、页面标题与描述、替代文本和无障碍标签；署名页同样遵守。
- 页面保持常规字形、适中字号、简洁学术风与宇宙主题，只使用用户提供的真实资料。
- 按功能维护 `modules/<功能>/`，结构、样式、行为、内容、资源和说明放在同一模块；详情子模块独立贡献数据，不集中到一个总内容文件。
- 当前学术栏目为 Experience、Publications、Notes、Projects；生活栏目为 Moments、Travels、Creations、Relationship。Experience 学术日志与 Moments 生活文章分别维护，没有用户资料时保持空数组，不编造内容。
- 模块不直接读取其他模块内部；通过声明清单和注册接口使用共享服务。`shared/` 仅承载实际跨模块复用能力，不能堆放单模块业务。
- 用户已要求统一作者登录，允许 `modules/author/` 以无 HTML 根节点的 `services` 模块提供两栏共用的会话与编辑器；集合 schema、数据和读者视图仍由各自模块负责。
- 胶水只负责声明、接入和启动，隔离单模块初始化异常；具体模块行为留在模块内，不让一个模块故障阻断其他模块启动。
- 修改前读取相关源码和说明，保留用户未提交的改动。新增框架、依赖或跨模块接口须对应具体需求。
- 根 `index.html`、`credits.html` 是生成产物，修改源片段或模板后显式装配，禁止手改生成页面。保持相对资源路径、普通脚本和直接文件打开能力。

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

## 3. 模块扩展与说明

模块指可独立维护的页面分区、详情栏目或功能。新增模块、扩展功能或改变接口，都必须随代码交付对应的简洁中文说明；纯文字纠错不属于模块扩展。

1. 新模块在自己的目录建立 `README.md`，记录用途、入口、文件职责、数据与共享接口、修改方法。详情子模块也保留就近说明，无需复制整段源码。
2. 在 `docs/modules/<模块标识>.md` 链接模块 README 并记录兼容性测试，使用 [模板](modules/TEMPLATE.md)，在 [目录](modules/README.md) 登记。详情标识使用 `academic-experience` 等简短小写名称。
3. 扩展已有模块时更新就近说明和测试记录；没有对应说明的先补建。框架边界和清单变化同步 `docs/ARCHITECTURE.md`，重要变化同步 `CHANGELOG.md`。
4. 公开详情通过 `registerDetail` 注册；自定义详情通过 `registerDetailView(group, key, { render })` 注册，接收 `{ host, route, signal, navigate }` 并可返回清理函数。页面模块仍使用 `registerSection` 和初始化传入的 `{ root, details, reducedMotion }`。
5. `registerData` / `getData` 只登记数据，模块维护自己的 getter、校验和业务。单模块能力留在模块中，胶水只传视图注册表与共享服务；接口变化注明使用者并回归。
6. 修改完成后运行 `npm run assemble`，再检查及实测。源码、生成页面、模块说明和测试记录一起提交，不留到以后补写。

## 4. 兼容性测试

**每次模块扩展必须实际测试兼容性。** 布局或交互修改也适用。`npm run check` 只读检查生成物、脚本语法、资源和注册关系，不能验证浏览器布局与交互；仅修改说明文档时执行静态和文档检查即可。

| 范围 | 最低检查内容 |
|---|---|
| 桌面与手机布局 | 至少一个可用浏览器实测桌面及手机视口，检查文字、图片、导航、弹窗及横向溢出；例如 1440、390、320 像素宽，记录实际尺寸与浏览器版本 |
| 浏览器覆盖 | 优先实测可用的 Chromium、Gecko、WebKit；目标包括 Chrome / Edge、Firefox、Safari；未运行环境明确标注 |
| 操作方式 | 鼠标、Tab / Enter / Escape、焦点恢复；触屏相关功能另测触摸或模拟，并注明模拟或真机 |
| 导航与发布方式 | 模块入口、详情直达、刷新、前进 / 后退与关闭；检查 `/personal-homepage/` 子路径及直接文件打开；资源与链接正确 |
| 状态与动画 | 按功能测试空数据、图片加载和减少动态效果；无相关状态时写明不适用原因 |
| 既有模块 | 回归受共享样式、脚本、注册、模板或装配变化影响的功能；装配变化还需检查首页与署名页 |

记录日期、浏览器版本、视口、检查项、结果、问题与复测。模拟手机视口不能称为真机测试，静态检查不能称为浏览器兼容性证据，单一内核不能称为跨浏览器测试通过。未运行的环境写“未测试”，交付摘要注明限制；发现故障后修复并复测，再完成扩展。

### 可重复测试工具

`scripts/test-compatibility.cjs`、`scripts/test-features.cjs`、`scripts/test-author-log.cjs` 分别提供 `npm run test:compat`、`npm run test:features`、`npm run test:author`。先装配并执行普通检查，再按改动范围运行；它们不会自动装配，也不会安装工具或下载浏览器。维护环境需预先提供 Playwright 及 Chromium、Firefox、WebKit，可通过 `HOMEPAGE_PLAYWRIGHT_MODULE` 指定已有模块路径。测试依赖不参与网站运行，普通 `check` 保持离线、只读且不需要测试工具。

浏览器脚本自启临时 HTTP 服务，验证仓库子路径，不依赖常驻 `preview`。基础案例覆盖三个内核、1440×900 / 390×844 / 320×780 视口、详情入口、键盘、历史、资源、动画、文件打开和署名页返回。功能案例覆盖读者嵌套路由与 Relationship 解锁 / 清理；统一作者案例覆盖密码拒绝、两栏会话复用、GitHub 身份或权限错误、发布冲突、最新 SHA、集合隔离、退出、加密连接缓存、刷新重验与篡改拒绝。文章、密码、密文、令牌与 GitHub 响应均为临时夹具，远端写入全部拦截。窄屏模拟不等于真机，GitHub API 模拟通过不等于真实账号发布成功。

报告写入被忽略且不交付的 `artifacts/compatibility-results.json`、`feature-results.json`、`author-log-results.json`。核对本次命令退出结果与报告日期，将相关证据和限制写入 `docs/modules/`；旧报告存在不代表本轮通过。新增模块或改变数据、路由和接口时同步补测试案例，自动检查之外仍按任务范围检查实际视觉布局，不能套用旧模块结果。

`npm run test:security` 无需 Playwright，用内存随机夹具验证算法往返、独立 Web Crypto 互通、篡改拒绝、格式边界及注册解析；它不配置真实口令，不请求网络，不修改正式密文。`npm run relationship:check` 只读检查 `encrypted.js` 格式，默认空值合法。2026-10-10 的本次结果见 [兼容性记录](COMPATIBILITY.md)；格式通过不代表真实私密资料、打包排除或线上环境已经验证。

`npm run test:author-security` 离线验证统一会话、密码派生、缓存加密 / 篡改、取消、401 与请求边界；只用随机密码及模拟 GitHub。它与真实页面 `test:author` 分开，不能以离线通过替代浏览器焦点、表单和双集合发布测试。

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
- 提交使用 `feat:`、`fix:`、`style:`、`docs:`、`chore:` 加简短描述，一个提交围绕一个目的，保留无关改动。
- 暂存前核对中文文档、英文网页、模块说明、实测记录与生成物；系统文件、缓存、ZIP 和 Git 元数据不属于网站源码。
- `.private/` 拒绝跟踪、打包和公开部署，不得使用强制暂存绕过忽略规则；密码、PAT 和私密明文不进入源码、日志或聊天。
- 资源修改同步英文替代文本、占位说明、署名页及 `docs/image-sources.md`、`docs/download-manifest.json`。

## 6. 发布与交付

普通维护完成本地修改、检查、实测与提交，交付摘要说明变更、验证和提交状态。仅在用户明确请求发布或推送时更新远端。

**手动上传：**运行 `npm run package`，解压 `../outputs/personal-homepage-source.zip`，将解压后 `personal-homepage/` 内部文件和目录上传到仓库根目录。保留生成的 `index.html`、`credits.html`、模块和共享资源以及 `.nojekyll`；服务器无需重新装配。

手动上传当前版本时，远端旧的 `css/`、`js/`、`assets/` 目录及 `modules/academic/research/`、`modules/life/places/`、`modules/life/notes/`、`modules/life/outside/` 需随迁移删除；后四项分别由 experience / travels / creations / relationship 替代。它们已从正式源码移除，通过 Git 推送相应提交会同步删除；上传新增文件不会自动清理旧目录。先核对远端内容并保留用户新增资料及 Git 历史，再按迁移范围处理。

**Git 推送：**按授权范围核对远端最新状态和待发布提交，再执行：

```sh
git push origin main
```

不要将身份令牌写入远端 URL、配置或仓库。部署后检查线上首页、学术详情、生活栏目、博客阅读、关系空间未配置或锁定状态、署名页与手机布局。手动上传过更新后先 `git fetch origin`，比较再同步，保持一份正式源码。

### 统一作者与两栏发布

1. 先完整部署新版本的生成页面、作者服务、模块脚本、样式及资源，再使用 `#academic/experience/author` 或 `#life/moments/author`；仅上传数据文件不能让旧版网站获得新工作台。
2. 统一作者密码只以随机盐与 PBKDF2-SHA256 600000 次派生校验值保存在配置；不把用户原密码写入源码、文档、日志或聊天。输入密码后才显示编辑器；首次使用再连接 GitHub PAT。更改密码使用 `npm run author:password` 的本地隐藏输入与确认，随后完整部署；旧连接缓存需重新建立。
3. 用户已选择在线发布并记住加密连接的流程；首次连接时勾选 remember。工作台核验 `PaulLi07`、仓库所有者与写权限，真实仓库授权仍由 GitHub 执行。未选择记住时只保留会话内存，选择后仅加密缓存进当前浏览器 localStorage；明文密码与令牌不进入持久存储、URL、Cookie、历史或源码。
4. 会话可跨两栏与详情关闭保持。Sign out 清内存并锁定两处，保存的加密连接可保留；Forget 删除缓存及当前连接。刷新 / 页面离开清内存；刷新后须输入密码解密缓存，再 GET `/user` 与仓库重验，损坏或失效时重新连接。请求返回 401 时保持解锁和草稿，清连接后重新授权；缓存删除失败须如实提示。
5. Experience 在 `entries.js` 登记英文日志，增加 Research / Learning / Seminar / Milestone 类型与可选 HTTPS 参考；Moments 在 `posts.js` 登记英文生活文章。两集合独立，标识稳定，`author` 保留；远端文件严格解析纯 JSON 登记，不能执行脚本或把正文当 HTML。
6. 用户点击 `Publish to GitHub` 才 PUT 到 `main` 的当前数据文件；每次先重读 SHA、保留远端内容，冲突不覆盖且保留草稿。`Download update` 只导出当前集合文件，手动上传同样遵守 Git 同步与资料保留规则。
7. Pages 更新后检查读者列表、正文及直达链接。下一次本地维护或打包前先 `git fetch origin`，核对改动后以 `git pull --ff-only` 同步；有分歧则保留并整合双方内容，避免旧 ZIP 覆盖在线更新的 `entries.js` 或 `posts.js`。作者服务接口与本次证据见 [author 记录](modules/author.md)。

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
| 离线作者会话 / 更改作者密码 | `npm run test:author-security` / `npm run author:password`（本地交互，不使用命令参数传密码） |
| 离线加密算法 / 正式密文格式 | `npm run test:security` / `npm run relationship:check` |
| 本地预览 | `npm run preview`，默认端口 8767 |
| 替换图片 | 对应模块 `images/` 与图片来源文档 |
| 模块说明 / 测试 | 模块内 `README.md` / `docs/modules/<标识>.md` |
| 查看远端 / 待发布 | `git remote -v` / `git log --oneline origin/main..HEAD` |
