# 基本工作协议

正式源码只在工作区根目录 `personal-homepage/` 维护。代理约定见根目录 `AGENTS.md`，模块使用方式见各自 `README.md`。

## 1. 修改边界

- **所有说明文档使用中文。** 路径、代码标识、命令、网址和专有名称保留原文。
- **所有网页呈现内容使用英文。** 包括正文、导航、按钮、弹窗、提示、空状态、图片署名、页面标题与描述、替代文本和无障碍标签；署名页同样遵守。
- 页面保持常规字形、适中字号、简洁学术风与宇宙主题，只使用用户提供的真实资料。
- 按功能维护 `modules/<功能>/`，结构、样式、行为、内容、资源和说明放在同一模块；详情子模块独立贡献数据，不集中到一个总内容文件。
- 模块不直接读取其他模块内部；通过声明清单和注册接口使用共享服务。`shared/` 仅承载实际跨模块复用能力，不能堆放单模块业务。
- 胶水只负责声明、接入和启动，隔离单模块初始化异常；具体模块行为留在模块内，不让一个模块故障阻断其他模块启动。
- 修改前读取相关源码和说明，保留用户未提交的改动。新增框架、依赖或跨模块接口须对应具体需求。
- 根 `index.html`、`credits.html` 是生成产物，修改源片段或模板后显式装配，禁止手改生成页面。保持相对资源路径、普通脚本和直接文件打开能力。

## 2. Git 开始与同步

`origin` 为 `https://github.com/PaulLi07/personal-homepage.git`，`main` 跟踪 `origin/main`。

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
2. 在 `docs/modules/<模块标识>.md` 链接模块 README 并记录兼容性测试，使用 [模板](modules/TEMPLATE.md)，在 [目录](modules/README.md) 登记。详情标识使用 `academic-research` 等简短小写名称。
3. 扩展已有模块时更新就近说明和测试记录；没有对应说明的先补建。框架边界和清单变化同步 `docs/ARCHITECTURE.md`，重要变化同步 `CHANGELOG.md`。
4. 详情模块通过 `registerDetail(group, key, data)` 注册；页面模块通过 `registerSection({ id, init? })` 登记，并使用初始化传入的 `{ root, details, reducedMotion }`。
5. 单模块能力留在模块中；只有多个模块实际复用且接口明确时才加入共享层。接口变化注明使用者并回归。
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

`scripts/test-compatibility.cjs` 提供 `npm run test:compat`。先装配并执行普通检查，再运行该命令；它不会自动装配，也不会安装工具或下载浏览器。维护环境需预先提供 Playwright 及 Chromium、Firefox、WebKit，可通过 `HOMEPAGE_PLAYWRIGHT_MODULE` 指定已有模块路径。测试依赖不参与网站运行，普通 `check` 保持离线、只读且不需要测试工具。

脚本自启临时 HTTP 服务，验证仓库子路径，不依赖常驻 `preview`。现有案例覆盖三个内核、1440×900 / 390×844 / 320×780 视口、八个详情入口与直达、空状态、键盘和焦点、历史、资源、正常及减少动态效果、直接文件打开和署名页返回。窄屏使用视口或触摸模拟，不能称为真机；内核版本不能代替 Chrome、Edge、Safari 各品牌和版本的测试。

报告写入被忽略的 `artifacts/compatibility-results.json`。核对本次命令退出结果与报告日期，将相关证据和限制写入 `docs/modules/`；旧报告存在不代表本轮通过。新增模块或改变数据、路由和接口时同步补测试案例，自动检查之外仍按任务范围检查实际视觉布局，不能套用旧模块结果。

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
- 资源修改同步英文替代文本、占位说明、署名页及 `docs/image-sources.md`、`docs/download-manifest.json`。

## 6. 发布与交付

普通维护完成本地修改、检查、实测与提交，交付摘要说明变更、验证和提交状态。仅在用户明确请求发布或推送时更新远端。

**手动上传：**运行 `npm run package`，解压 `../outputs/personal-homepage-source.zip`，将解压后 `personal-homepage/` 内部文件和目录上传到仓库根目录。保留生成的 `index.html`、`credits.html`、模块和共享资源以及 `.nojekyll`；服务器无需重新装配。

本次功能模块迁移还需在远端同步删除旧的 `css/`、`js/`、`assets/` 目录；它们已从本地移除，内容改由模块与共享目录维护。通过 Git 推送本次提交会同步这些删除；仅上传新增文件不会清理远端旧目录，手动上传时需一并处理。

**Git 推送：**按授权范围核对远端最新状态和待发布提交，再执行：

```sh
git push origin main
```

不要将身份令牌写入远端 URL、配置或仓库。部署后检查线上首页、学术详情、生活照片、署名页与手机布局。手动上传过更新后先 `git fetch origin`，比较再同步，保持一份正式源码。

## 7. 常用入口

| 操作 | 命令 / 文件 |
|---|---|
| 改功能 | 对应 `modules/<功能>/README.md` 及同目录源码 |
| 改详情 | 对应学术 / 生活子模块的 `content.js` |
| 改模块声明或外壳 | `app/site.json`、`app/*.template.html` |
| 装配 / 只读检查 | `npm run assemble` / `npm run check` |
| 可选浏览器兼容性测试 | `npm run test:compat`；工具来源可用 `HOMEPAGE_PLAYWRIGHT_MODULE` 指定 |
| 本地预览 | `npm run preview`，默认端口 8767 |
| 替换图片 | 对应模块 `images/` 与图片来源文档 |
| 模块说明 / 测试 | 模块内 `README.md` / `docs/modules/<标识>.md` |
| 查看远端 / 待发布 | `git remote -v` / `git log --oneline origin/main..HEAD` |
