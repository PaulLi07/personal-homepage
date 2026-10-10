# 个人主页维护约定

工作区根目录的 `personal-homepage/` 是正式源码目录，后续网站维护在这里进行。`outputs/personal-homepage` 是兼容链接；其他解压目录及旧 HTML 文件属于历史副本。

开始前阅读 `README.md`、`docs/ARCHITECTURE.md`、`docs/WORKFLOW.md` 和受影响模块内的 `README.md`。

## 语言与模块要求

- **所有说明文档必须使用中文。** 覆盖 README、维护约定、框架、协议、模块说明、素材说明和变更记录；路径、代码标识、命令、网址及专有名称保留原文。
- **所有网页呈现内容必须使用英文。** 包括正文、导航、标题、按钮、弹窗、提示、空状态、图片署名、页面标题与描述、替代文本及无障碍标签。`credits.html` 同样遵守。
- **每次扩展模块必须同步简洁说明并实际测试兼容性。** 模块内 `README.md` 说明用途、入口、文件、接口与维护方法；`docs/modules/<模块标识>.md` 链接该说明并记录测试，不重复长篇文档。新模块及首次扩展的旧模块均需登记在 `docs/modules/README.md`。
- 说明与实际测试记录随功能一起交付；未运行的环境明确写“未测试”，不能以静态检查代替浏览器实测。

## 已确认资料与设计偏好

- 姓名：Yuhong Li；学校：Nankai University（南开大学）；身份：研究生；领域：理论物理。
- 邮箱：2310408@mail.nankai.edu.cn；GitHub：PaulLi07。
- 仓库：<https://github.com/PaulLi07/personal-homepage>。
- 网站：<https://paulli07.github.io/personal-homepage/>。
- 研究课题、论文、成果和个人故事目前仍有占位内容，使用用户提供的事实，不得编造。
- 采用简洁学术风与宇宙主题，保持优雅、艺术感和克制；使用常规字体和适中标题，用户拒绝窄体超大展示文字。
- 保留参考网站 <https://swarajsingh-portfolio-25.pages.dev/> 的全屏摄影首屏、分栏简介、学术缩略图与详情、散落生活照片和联系区框架。
- 导航为 About、Academic、Life、Contact；学术包括 Experience、Publications、Notes、Projects；生活包括 Moments、Travels、Creations、Relationship。用户本次栏目命名优先于旧版 Research / Places / Little things / Outside。
- 使用下载的占位图，直到用户替换或要求寻找其他网络图片；未经用户改变偏好，不生成替换图片。

## 功能边界与文件职责

- `modules/home/`、`about/`、`academic/`、`life/`、`contact/`、`credits/` 按用户理解的功能组织源码；不再把全部功能分散到统一的 HTML、CSS、JS 文件中。
- 主模块保存自己的 `section.html`（署名页使用 `page.html`）、`styles.css`、按需的 `module.js`、`images/` 与 `README.md`。
- 学术和生活详情子模块各自保存 `content.js`、`images/cover.jpg` 和 `README.md`；不要将其数据重新集中到一个大文件。Moments 的文章、作者工作台与 Relationship 的加密行为留在各自目录。
- `app/site.json` 声明模块与装配顺序；`app/index.template.html`、`app/credits.template.html` 保存页面外壳；`app/main.js` 只负责装配后的初始化。
- `shared/` 仅保存真正跨模块的基础样式、导航、详情弹窗、过渡、进入动画及注册接口，不能成为杂物目录。只有多个功能实际复用且接口清楚的能力才放入共享层；入口与使用者记录在 `shared/README.md`。
- `shared/runtime.js` 提供单一 `window.Homepage` 注册入口；模块通过 `registerSection({ id, init?, detailGroup? })`、`registerDetail(group, key, data)` 贡献功能。自定义详情通过 `registerDetailView(group, key, { render })` 注册；`render({ host, route, signal, navigate })` 只操作传入容器，可返回清理函数。
- `registerData(key, value)` / `getData(key)` 只提供命名空间数据登记；文章校验、模块数据 getter、作者认证和解密业务仍在所属模块。`app/main.js` 只把视图注册表传给详情服务，为分区初始化传入 `{ root, details, reducedMotion }`，不解释博客或加密内容。
- 模块不直接读取其他模块内部文件、选择器或数据；通过清单、注册接口或明确的共享服务连接。模块图片独立保存，哪怕内容暂时相同，也应能单独替换。
- 根目录 `index.html`、`credits.html` 是生成产物，禁止手改；修改源模块或模板后运行 `npm run assemble` 并一并提交生成页面。
- 保留普通脚本、相对资源路径和无外部运行时依赖；生成页面可直接以文件方式打开，上传后无需服务器构建。

## Moments 与作者发布

- `modules/life/moments/posts.js` 只登记 JSON 文章数组，使用 `Homepage.registerBlogPosts([...])`；不执行任意远端脚本，不把正文作为 HTML 注入。没有真实文章时保持空数组。
- 列表为 `#life/moments`，正文为 `#life/moments/<slug>`，作者工作台为 `#life/moments/author`；`author` 为保留标识。
- 本次推荐默认使用 GitHub PAT 作者工作台。认证检查登录账号 `PaulLi07`、目标仓库所有者及仓库写权限；界面入口或前端身份判断不能替代 GitHub 的真实授权。
- PAT 只保存在当前工作台的内存中，关闭、切换详情或退出时丢弃；不写入源码、URL、日志、浏览器持久存储或聊天。不要代用户收集令牌。
- 用户在浏览器主动点击 `Publish` 后，工作台通过 GitHub Contents API 的 PUT 更新主分支 `modules/life/moments/posts.js`，并保留远端版本校验；普通维护不能自动发布文章。
- 首次使用工作台前先完整部署包含新脚本、样式与生成页面的版本。浏览器发布后，本地维护先获取远端新提交并处理差异。

## Relationship 的私密边界

- 公开 `content.js` 仅含通用介绍；默认 `encrypted.js` 登记 `null`，没有预设密码和私密明文。
- 本地工具 `scripts/relationship.cjs` 使用 AES-GCM 256 位和 PBKDF2-SHA256 600000 次派生密钥。用户只在自己的交互终端输入并确认至少 12 字符的独立口令；不得通过聊天、参数或源码明文收集密码。
- 明文 JSON 放在项目外，或已被忽略且未被 Git 跟踪的 `.private/`；该目录拒绝跟踪、打包与公开部署，不得强制暂存或手动上传。公开仓库只保存生成密文和通用封面。
- 解锁内容仅在当前详情生命周期呈现，切换、关闭或主动锁定时清理。私密照片、明文备份和密码不能成为普通公开模块资源。

## 验证与交付

先装配，再运行 `npm run check` 和 `git diff --check`。`check` 只读验证，不应悄悄修复过期生成物。模块扩展、布局与交互修改必须实测桌面、手机视口及受影响的导航、详情、键盘和减少动态效果行为。

按工作协议在模块测试记录中写明日期、浏览器版本、视口、模拟或真机、结果、问题与未覆盖项。已发现故障须修复并复测；没有运行的环境不能写为通过，也不能把一种内核的测试称为跨浏览器测试通过。

基础兼容性使用 `npm run test:compat`；博客、模拟作者发布与加密视图使用 `npm run test:features`；加密算法使用 `npm run test:security`，正式密文格式使用 `npm run relationship:check`。按改动范围运行对应案例，测试数据与 GitHub 模拟不能替代真实部署或凭据验证。2026-10-10 的实测范围与限制见 [兼容性记录](docs/COMPATIBILITY.md)，后续修改仍需重新验证。

## Git 与发布协议

- 仓库根目录为本目录，`origin` 为上述 HTTPS 仓库，`main` 跟踪 `origin/main`。
- 开始先检查状态；同步或发布前获取远端，检查未提交用户改动和远端差异。保留远端历史，使用快进拉取，不硬重置用户文件或强制推送共享历史。
- 小范围任务可在 `main` 本地提交；跨模块或较大功能使用任务分支，检查后整合到本地 `main`。
- 本地提交属于已授权维护，只暂存本任务文件；提交说明采用 `feat:`、`fix:`、`style:`、`docs:`、`chore:` 加简短描述，保留无关改动。
- 框架或流程变化同步文档；模块扩展同步就近说明与测试记录，重要变化写入 `CHANGELOG.md`。
- 普通维护完成本地修改和提交；只有用户请求发布或推送时更新远端，不因长期维护自行创建定时任务。
- `npm run preview` 与 `npm run package` 先装配；源码包在仓库外生成 `outputs/personal-homepage-source.zip`，排除系统文件、Git 元数据、缓存和旧压缩包。
- 上传包的内部内容到远端仓库根目录，保留生成页面和模块资源。用户明确请求发布或推送时执行已授权发布，不重复索要许可。

用户提出新的长期维护要求时，同步记录在这里。
