# 项目框架概要

网站按功能组织源码，在本地将 HTML 片段装配成完整静态页面。浏览器读取普通 HTML、CSS、JavaScript 和本地资源，运行时无构建、无框架依赖、无需请求片段；生成的根页面支持直接文件打开和 GitHub Pages 仓库子路径。实验地图是独立静态页面，使用 ES Module 和本地数据请求，须由 HTTP 服务或 Pages 访问。

所有说明文档使用中文，所有网页呈现内容使用英文；路径、命令、代码标识、网址和专有名称保留原文。

## 目录与边界

```text
app/                       模块清单、页面外壳与初始化胶水
modules/
  home/                    首屏
  about/                   简介
  academic/                学术概览
    experience/ notes/
    projects/              项目登记、父目录视图、共用图文入口与接线
      physicists/          独立人物档案入口、完整源码、数据、图片和构建
      experiment-atlas/    Physics Maps项目、地图登记、顶栏与本地维护工具
        neutrino/ dark-matter/  各自页面、代码、数据、档案与图片
    publications/          论文分类目录与视图
      internal-note/       课题组注册、独立视图与besiii/记录
      arxiv/ published/    各自的数据与说明
  life/                    生活概览
    stack/                 拍立得入口配置、交互、样式与本地手写字体
    moments/ travels/ creations/ relationship/
  contact/                 联系
  credits/                 独立素材署名页
  author/                  两栏共用的密码登录、GitHub 连接、编辑器与发布器
  article-photos/          照片规范、处理、选图、图库与 ZIP 服务
  article-documents/       PDF 附件规范、选择及 Open / Download 链接
  particle-background/    主页面粒子配置、局部模拟、Canvas 与生命周期
shared/                    基础样式、导航、详情弹窗、过渡与注册接口
scripts/                   本地装配、检查、预览与打包
docs/                      框架、协议、素材及测试记录
index.html, credits.html   装配生成的发布页面
```

主模块在自己的目录保存 `section.html`、`styles.css`、按需的 `module.js`、`images/` 和 `README.md`；署名模块使用 `page.html`。详情子模块保存 `content.js`、封面和说明；Experience 日志、Moments 博客、Publications 分类与 Relationship 解密行为留在各自模块。统一会话、表单和发布器归 author，照片能力归 article-photos，PDF 能力归 article-documents；公开附件文件仍留在所属文章。无行为的模块无需空脚本，无图片的模块无需空图片目录。

`modules/author/`、`modules/article-photos/` 与 `modules/article-documents/` 是共用功能服务，不占首页分区，无 HTML 根节点且不调用 `registerSection`。`app/site.json` 的 `services` 声明各自 `id`、`folder`、`styles`、`scripts`；依次装配照片、PDF、作者配置 / 会话 / 发布器 / 编辑器，均在共享基础之后、分区脚本之前。Experience 与 Moments 各自维护读者、集合 schema 和文件路径，通过公开接口接入。

2026-10-11 新增 `particle-background` 服务，独立保存 `config.js`、`simulation.js`、`background.js` 与 `styles.css`，按此脚本顺序通过同一清单装配。它不需要 HTML 片段、图片或第三方依赖，也不与文章、附件、凭据共享业务数据；`app/main.js` 只负责挂载，具体配置、模拟、输入与生命周期均在服务内。

`shared/` 只接收有实际跨模块复用需求的能力。模块不直接读取其他模块的内部实现；共享接口变化需回归所有使用者，单模块业务应留在该模块内。相同占位图片在不同主模块分别保存，便于独立替换。

主页面固定素材使用13个图片文件（不含实验地图档案）：10个下载占位图（含About相册独立副本）、2个用户提供图片的JPEG资源（Home原字节与About相册缩放副本）和1个用户提供的PNG。Home 的 `images/hero-dragon.jpg` 为站主提供的 `1342979.jpeg` 原字节副本，3840×2160 JPEG、1,860,297字节；片段与预载共同引用新路径以避开旧图缓存。只描述人物与龙、雾气、飞鸟的幻想插画，只注明站主提供、原作者和来源未确认，不推断角色身份或地点；旧 `hero-rain.jpg` 从当前源码移除，雨景、舷窗地球与山水旧版保留在Git历史。About 的 `images/portrait.jpg` 已由用户独立替换为 6240×4160 户外人像，本轮不改其原字节，不推断身份、地点、摄影者或来源。两模块不再要求图片同源或字节一致。Contact 独立使用保留原图的 `images/background.png`，只知用户提供，原作者与来源待确认。Academic 和 Life 不使用整区背景图，分别由自己的样式提供纯黑背景；Academic保留分隔与漫画场景，Life使用独立的白边拍立得照片堆而非整区白框；各自子栏目封面保持独立。公开文章附图仍随记录新增，另存各自 `images/posts/<id>/`，不替换公共封面。固定素材与当前归属见 [图片清单](image-sources.md)。

## 装配与运行

| 文件 | 职责 |
|---|---|
| `app/site.json` | `sharedStyles`、`afterStyles`、`sharedScripts`、`services` 与分区的 `view`、`styles`、`scripts`、可选的 `preloadImages` 声明装配顺序；`standalonePages` 声明模块内完整独立页面供路径检查，不嵌入主页；`liveScripts` 声明本模块需保持原 URL 的数据脚本子集，路径相对于站点根 |
| `app/index.template.html` | 首页文档外壳与装配位置 |
| `app/credits.template.html` | 素材署名页外壳与装配位置 |
| `app/main.js` | 取得共享服务并初始化注册模块；不放具体模块内容 |
| `scripts/assemble.py` | 读取清单与模板，嵌入片段，输出根页面；CSS 与静态 JS 引用附内容 SHA256 前 12 位版本，`liveScripts` 保持原 URL |
| `scripts/test-compatibility.cjs` | 可选浏览器实测工具，自启临时子路径服务器；不参与网站运行、装配或普通检查 |
| `scripts/test-features.cjs` | 可选博客、模拟作者发布和加密视图测试；临时夹具通过请求拦截提供，不发布真实文章 |
| `scripts/test-author-log.cjs` | 用随机作者密码、临时双集合与模拟 GitHub 验证统一会话、加密缓存和独立发布 |
| `scripts/test-photos.cjs` | 临时照片与 PDF、混合 ZIP、同次提交与 Git 请求边界；真实写入全部拦截 |
| `scripts/test-academic-profile.cjs` | 三分类导航、论文元信息与外链、ORCID及Projects入口 |
| `scripts/test-life-stack.cjs` | 离线拍立得输入、有限层级、详情参数与生命周期回归，不代替浏览器视觉及触摸测试 |
| `scripts/test-particle-simulation.cjs` | 离线粒子参数、局部规则、指针与数值边界；不需要浏览器依赖 |
| `scripts/test-particles.cjs` | 三内核粒子绘制、层级、输入、暂停恢复、性能预算与失效回退 |
| `scripts/test-security.cjs`、`scripts/relationship.cjs` | 离线算法回归与本地密文生成 / 格式检查；不参与网页运行 |
| `index.html`、`credits.html` | 生成产物，供本地文件打开、预览与直接上传；禁止手改 |
| `shared/favicon.svg` | 跨页面网站图标 |
| `shared/base.css`、`shared/runtime.js` | 基础样式与统一注册入口 |
| `shared/reveal.js` | `initReveals(roots)`，观察传入公共根节点内的进入动画元素 |
| `shared/navigation/` | `view.html`、`styles.css`、`navigation.js`，提供跨模块导航 |
| `shared/details/` | `view.html`、`styles.css`、`dialog.js`，提供共用详情弹窗 |
| `shared/transitions/` | `styles.css`、`transitions.js`，提供共用开场与详情过渡 |
| `modules/article-photos/photos.js`、`styles.css` | 照片 schema、受控路径、解码重绘、选图、画廊与 ZIP；不读作者凭据或执行 GitHub 发布 |
| `modules/article-documents/documents.js`、`styles.css` | PDF schema、受控路径、基本字节检查、选择与 Open / Download 链接；保留原字节，不执行发布 |
| `modules/particle-background/` | 独立配置与校验、网格局部规则和 curl 流场、Canvas 绘制与暂停 / 降级 / 清理；胶水只挂载 |
| `modules/author/session.js` | 作者密码与连接生命周期，以及受限 GitHub 请求 |
| `modules/author/publisher.js` | `createAuthorPublisher(collection)`，解析、归一化、合并与当前集合发布 |
| `modules/author/editor.js` | 表单、草稿和状态；调用照片与发布服务，不承载 Git 提交流程 |

`npm run assemble` 写入生成页面。`npm run check` 只读检查生成物是否与源码一致及语法、资源、注册关系；若生成物过期，先显式装配。`npm run preview`、`npm run package` 先装配。提交时同时保留模块源码与最新生成页面；上传包无需在 GitHub 服务器重新装配。

装配工具使用 Python 3.9+。`sections` 中连续模块若声明同一个 `container`，装配器把它们包入共同容器；当前 home 与 about 使用 `container: "page1"`，保持连续背景。模板通过 `{{sections}}` 装配分区；新增分区只需清单和导航，不需要新增模板占位；停用分区时同步导航及其他公开入口。图片预载随模块清单声明，模板不绑定具体模块图片。

主页面脚本使用普通 `defer` 标签。`sharedScripts` 依次加载注册接口、过渡、详情与导航；随后按 `services` 加载照片、PDF 能力及作者配置 / 会话 / 发布器 / 编辑器，再按 `sections` 加载详情数据与模块脚本，最后执行 `app/main.js`。`sharedStyles` 在功能样式前，`afterStyles` 在功能样式后，署名页只引用基础与本页样式、不加载首页脚本。主页面顺序以 `app/site.json` 为准，不使用运行时模板请求或 ES Module 导入，保留文件打开方式。地图独立页面使用自己的 ES Module，资源路径以各地图目录为基准，不进入主页脚本清单。

装配生成 `path?v=<内容 SHA256 前 12 位>`，内容变化后 CSS / 静态 JS 使用新 URL。`liveScripts` 必须是模块 `scripts` 的子集，当前仅 Experience 的 `modules/academic/experience/entries.js` 与 Moments 的 `modules/life/moments/posts.js` 保留原 URL，在线直接发布只更新数据即可，无需重新装配 HTML；作者业务不改变。图片引用及预载仍归所属模块；About 人像片段手动附加内容 SHA256 前 12 位 `?v=` 避免旧图缓存，换图同步更新，此例不代表所有图片已经自动版本化。版本串不包含凭据。

预览服务器没有热更新；已打开的标签仍持有旧文档，必须在装配后刷新用户实际标签，再核对资源 URL、图片、DOM 和计算样式。固定导航公开 `--navigation-height`：桌面 76px、宽度 ≤760 时 104px。基础层以该变量设置分区锚点留白，Home 为 0；Academic 与 Life 各在自己的模块以 `calc(var(--navigation-height, 76px) + 16px)` 留出额外分隔空间，不读取导航内部结构。扩展栏目需在正常动画的实际导航点击后验证标题及边框，不能只检查居中可见或 hash。

## 实验地图集（2026-10-25）

`academic/projects/`的registry/view/integration管理项目登记、父目录与入口/子项目生命周期，通过 `registerDetailView`接入共享详情。各项目用 `registerAcademicProject(descriptor, view)`登记，元信息经冻结getter读取，视图经独立getter委托；可选 `renderEntry({host, signal, navigate})`提供本模块的目录入口，项目摘要从所属模块动态计算。父目录的 `entry.js`提供共用图文卡片工厂，不持有人物或地图资料。Physics Maps位于experiment-atlas，Physicists位于physicists，父目录不读项目内部实现。`academic/projects/experiment-atlas/`仅维护本项目地图目录、元数据和独立地图顶栏，不再负责父Projects视图。每图独立保存HTML/CSS/JS、`data/catalog.json`、`archive/<id>/record.json`及相应图片，不读取其他工作目录，不使用符号链接或本机后台服务。地图之间只用原生链接切换，不共用检索状态。

`registry.js` 是入口标题/路径的唯一登记；`refresh_metadata.py` 从本地索引生成统计，`sync_shell.py` 从登记生成两图顶栏。每图 `tools/build_data.py` 从自己的英文档案重建索引及计数缩略图，`verify_portable.py` 检查资源路径闭合。日常维护全部在主页内完成；再次导入外源属于单独明确操作，不能成为构建依赖。

清单 `standalonePages` 仅声明完整独立页面；`scripts/check.mjs` 按各自HTML目录检查其资源、重复ID和锚点，其他装配片段仍按站点根解析。地图目录随普通静态文件打包上传，Pages无需额外后台。维护步骤见[地图集说明](../modules/academic/projects/experiment-atlas/README.md)，本轮独立副本及桌面/手机证据见[记录](modules/experiment-atlas.md)。

## Projects图文入口（2026-10-27后续）

目录的两张入口共用 `projects/entry.js`结构与父级样式，图片、描述、统计和目的地由所属项目提供；父视图只挂载入口并处理清理、故障回退及目录导航。Physicists的 `renderEntry()`复用既有人物照片卡片并省略中间介绍外壳，原生链接直接打开完整档案；Physics Maps的 `entry.js`使用本项目两张地图缩略图，点击进入地图目录。二者不交换私有数据或图片。

完整人物页面的返回链接指向 `#academic/projects`；旧 `/physicists`仅为历史书签保留兼容视图。目录不再渲染BESIII Collaboration或空合作组区，只保留GitHub链接。入口修改不改变地图、人物、论文或Internal note数据。实际布局与兼容性见[本次记录](modules/academic-projects.md#project-cards-2026-10-27)。

## Physicists独立档案（2026-10-27）

`academic/projects/physicists/`以轻量view/integration和生成的metadata接入父项目目录；完整应用留在同目录 `archive/`，不合并进主页脚本、不使用iframe。完整前端源码在 `archive/website/src/`，维护模板名为 `index.template`，本地构建映射为 `archive/website/site/index.html`。人物规范数据、具名成果、科学计算与测试均归本目录；721份图片只保存于 `archive/portraits/`，生成页面以相对路径读取。此完整模块是最小交付单位。

`npm run build:physicists`先重建独立页面与数据，再从本地产物更新主页摘要；普通装配不暗中重建科学资料。`npm run test:physicists`只读核对核心与资源，`verify_portable.py --rebuild-in-copy`验证异地副本可重建。原HEP工程只用于本次复制；不需要其源码、Git、采集缓存、服务或本机配置。网页固定英文，中文校对数据与中文维护方法保留；英文网页帮助属于读者呈现内容。详细入口、来源与实测见[模块说明](../modules/academic/projects/physicists/README.md)及[本轮记录](modules/academic-projects-physicists.md#physicists-import-2026-10-27)。

## 2026-10-23 视觉维护入口

Apple 风格优化保留原生 HTML、CSS、普通脚本及现有注册接口，不新增框架或运行时远程字体依赖；Life拍立得局部手写字体使用随源码保存并附许可的本地WOFF2。共享层维护中性色令牌、系统字体、按钮、紧凑导航与详情阅读外壳；各模块继续维护自己的图片构图、内容分组和响应式布局。About / Academic / Life 保持纯黑粒子表面，石墨灰内容卡片不改变公开粒子接口；Home / Contact 保留独立图片背景。

后续样式维护见 [设计约定](DESIGN-APPLE.md)。前一轮 Apple 改版分支为 `feat/apple-homepage-design`，备份 `backup/pre-apple-design-2026-10-23` 指向 `28880ba`，验证见 [Apple 兼容性记录](COMPATIBILITY.md#apple-design-2026-10-23)。随后 Academic 专题精修使用 `feat/academic-science-directory`，备份 `backup/pre-academic-science-2026-10-23` 指向 `c7cdd07`，尚未推送；本轮证据见 [Academic 记录](modules/academic.md#academic-science-2026-10-23)。

Academic 概览现由 `modules/academic/exploration/` 独立管理探索场景，替代此前四正方形卡片。配置、轮播、路牌导航、人物、精选索引分别维护，`scene.js`连接工厂及详情订阅，父 `module.js` 仅挂载。清单声明CSS/普通脚本顺序，无新增服务、框架或运行时网络依赖。桌面30%左下路牌与右侧大图错位，手机上下排列；地面/人物为SVG与CSS，显式声明粒子排除。参数与接口见 [场景说明](../modules/academic/exploration/README.md)，验证见 [当前记录](modules/academic.md#academic-scene-2026-10-23)。任务分支 `feat/academic-exploration-scene`，回退 `backup/pre-academic-scene-2026-10-23`（`ed981de`）。

栏目标题、说明仍经 `details.getItem()`读取，精选论文仍经公开 `getPublicationCategories()`读取，不复制子模块资料。人物与轮播分别响应可见性和减少动态效果；详情状态仅从公开URL与原生事件同步。原作者、附件与论文分类接口保持。

## Life 拍立得入口（2026-10-25）

`modules/life/stack/` 独立维护四入口配置、固定位置/转角、输入选择与本地字体，父 `module.js` 只注册分区并传入 `{ root, details, reducedMotion }`。脚本由清单按配置→控制器→父胶水装配；控制器通过既有 `details.open("life", key, { trigger, source })` 打开栏目，Moments博客/作者和Relationship加密模块均不改。

当前Life取消整区白色主框/副框与滚动漂移，桌面、手机均为轻微不规则的横向白边拍立得堆。鼠标悬停或键盘聚焦置顶，黄色花体标题同步；触摸/笔首点下层选中、再点正面进入。标题不拦截指针，各卡保留外露入口；仅照片及纸边排除粒子，间隙和下方语录区透明。全站正常字体不变，Life局部的Kaushan Script / Caveat按SIL OFL 1.1随资源保留原版权/许可，见[字体说明](../modules/life/stack/fonts/README.md)。

模块接口及维护见[照片堆说明](../modules/life/stack/README.md)，离线回归为 `npm run test:life-stack`，实测另在[Life记录](modules/life.md)登记。任务分支 `feat/life-polaroid-stack`；`backup/pre-life-polaroids-2026-10-25` 保留 `0783998`，只做本地维护。旧整区相框、漂移及手机错落双列描述属于此前版本历史，不能作为当前布局要求。

## 注册接口与共享服务

`shared/runtime.js` 提供单一全局入口 `window.Homepage`：

- `registerSection({ id, init?, detailGroup? })`：登记页面分区；可选初始化函数只处理本模块功能。详情分组模块声明 `detailGroup: { id, label, descriptionTitle }`，由胶水传给详情服务。
- `registerDetail(group, key, data)`：登记公开介绍与普通详情数据，例如 `academic` / `experience`。
- `registerDetailView(group, key, { render })`：为已有栏目登记自定义详情视图，供日志、博客、Publications 分类及 Relationship 加密空间复用同一个弹窗外壳。
- `registerData(key, value)` / `getData(key)`：保存模块命名空间的数据；具体格式、校验与 getter 仍由模块负责，例如 `getBlogPosts()` 和 `getEncryptedRelationship()`。

`app/main.js` 为初始化函数传入 `{ root, details, reducedMotion }`：`root` 是本模块 DOM 根节点，`details` 是共用详情服务，`reducedMotion` 是减少动态效果的 `MediaQueryList`，通过 `.matches` 判断并监听偏好变化。模块应在自己的 `root` 内查询元素，使用 `details.open(group, key, { trigger, source, route = null })` 打开详情，使用 `details.onSelect(group, callback)` 响应所属分组的切换，使用 `details.getItem(group, key)` 读取已注册详情，不查询其他模块 DOM。可选 `route` 必须匹配 `^[a-z0-9]+(?:-[a-z0-9]+)*$` 且目标已注册自定义视图，非法值在修改历史前拒绝；旧调用默认 `null`。Academic 精选链接传入 `trigger` 和分类路由，使关闭恢复焦点与进入前滚动位置，修饰键点击保留原 `href`。

胶水使用 `createDetails({ dialog, content, views, groups, transitions })` 创建详情服务，`views` 为注册表，`groups` 来自分区的 `detailGroup`。胶水只传递这些接口，不解释文章、作者权限或加密数据；共享服务负责弹窗、历史与焦点恢复。

自定义 `render({ host, route, signal, navigate })` 只操作自己的 `host`。`route` 是栏目后的尾段，如文章标识或 `author`；`navigate(null)` 返回栏目根，`navigate(slug)` 进入正文。关闭、切换或重新渲染时由生命周期清理事件、DOM 与异步结果；`render` 可返回幂等的清理函数（允许重复调用）。Relationship 明文随详情清理；统一作者会话按独立生命周期管理，不能因关闭一栏使另一栏退出。

导航入口为 `createNavigation({ root, sections })`，只接收导航和公共分区根节点；过渡入口为 `createTransitions(reducedMotion)`。胶水调用 `initReveals(roots)` 启动共享进入动画，观察逻辑留在 `shared/reveal.js`，不放回胶水层。胶水逐模块隔离初始化异常，不阻断其他模块和共享服务启动。共享入口和使用边界见 [共享层说明](../shared/README.md)。

注册接口替代旧的 `window.HOMEPAGE_CONTENT` 和 `window.HomepageTransitions` 全局。详情由子模块独立贡献，父模块负责自己的概览与入口；不跨目录读取其他模块内部数据。

### 粒子背景服务

`Homepage.particleBackground.mount({ root, reducedMotion, dialog, config? })` 接收 `#main`、动态偏好的 `MediaQueryList` 与 `#detail-dialog`，返回控制器；重挂先卸载旧实例。公共服务及控制器均提供 `configure()`、`getConfig()`、`getStats()`、`dispose()`，控制器另提供 `pause()` / `resume()`。模拟和渲染不访问其他模块内部，只利用传入的公共根节点及状态。

Canvas 固定当前视口，`aria-hidden`、不接收指针事件；绘制范围只取 `#main` 内公开 `data-particle-surface="black"` 区域的可见矩形，并排除其中 `img` 矩形。当前 About、Academic、Life 各自声明该属性并由本模块设置纯黑 `#000` 背景；Home 与 Contact 保留图片背景且不绘粒子。细线、相框及内容归各栏目自己的样式，不写进粒子服务。这个属性是明确的公共边界，服务不扫描模块私有结构来推断范围。声明后校验区域自身的纯黑、不透明与无背景图样式；`data-particle-foreground` 声明前景、`data-particle-exclude` 声明额外遮挡，当前导航使用后者。裁剪采用可见外包矩形，滚动、公开区域样式变化、图片加载及 CSS 过渡结束刷新遮罩；静态补绘不推进模拟，卸载时清理观察器和补绘任务。

渲染直接使用 Canvas `arc` 填充白色实心圆点，不使用 sprite、渐变或 blur。用户要求粒子微小、密集、清晰，默认半径 `0.4`–`0.85` CSS 像素，透明度 `0.85`；前景图片、文字、链接及按钮保持可读。后台和所有详情暂停，读者与作者详情均隐藏 Canvas；减少动态效果保留静态图，Canvas 不可用退回原页面。数量按面积及手机上限调整，像素比有上限，慢帧可自适应减量，不能将目标频率当作硬件帧率保证。参数与诊断字段见 [维护指南](PARTICLE-BACKGROUND.md)；这是艺术性网格规则与 curl 流场，不宣称严格物理精度。

历史阶段曾留在功能分支、不整合主分支、不推送。2026-10-11 最终回归于北京时间 16:33–16:37 完成，覆盖缓存与导航修复：基础三内核九环境、正常 Life 导航 24 项、作者 144 流程、粒子 255 流程 / 12234 断言均通过；生产源码未被测试修改，外部请求与真实写入为 0。16:04 及更早结果为历史；照片 / PDF 专门矩阵、离线核心本轮未重跑，227 条离线断言仍属此前证据。范围与限制见 [测试记录](modules/particle-background.md)。

## 详情数据

学术为 Experience / Publications / Notes / Projects，目录为 `academic/{experience,publications,notes,projects}`；生活为 Moments / Travels / Creations / Relationship，目录为 `life/{moments,travels,creations,relationship}`。各模块的 `content.js` 注册公开介绍：

| 字段 | 用途 |
|---|---|
| `title`、`label`、`kicker`、`subtitle` | 详情标题、切换文字、编号与简介 |
| `image`、`imageAlt`、`credit`、`source` | 图片路径、英文替代文本、署名及来源 |
| `description` | 英文段落字符串数组 |
| `facts` | 可选的 `{ label, value }` 资料数组 |
| `listTitle`、`emptyMessage`、`entries` | 条目区标题、空状态及内容数组 |
| `link` | 可选的 `{ label, url }` 底部链接 |

条目格式为 `{ title, meta, description, url }`，后三个字段可省略；`description`、`entries` 保持数组，没有真实内容则使用 `entries: []`。共用详情按文本渲染内容，不解析条目中的 HTML。

Moments 的 `posts.js` 使用 `Homepage.registerBlogPosts(JSON数组)` 登记文章，格式为 `{ id, title, date, excerpt, body, author, photos?, attachments? }`；正文为英文纯文本，作者为 Yuhong Li，文章标识 `author` 保留给工作台。`data.js` 管文章校验与 getter，`integration.js` 将读者与作者视图接入注册接口。

Experience 的 `entries.js` 使用 `Homepage.registerAcademicLogs(JSON数组)` 登记独立学术日志，增加 `kind` 与可选 `reference`。类型限定 Research / Learning / Seminar / Milestone，参考链接仅绝对 HTTPS；`data.js` 提供校验、规范化与 `getAcademicLogs()`，命名空间为 `experience.entries`。日志读者与接入行为留在 Experience，不读取 Moments 内部。

两集合可选 `photos: [{ src, alt, caption? }]`，最多 9 张，英文替代文本非空且最多 300 字符，可选说明最多 600 字符。`Homepage.articlePhotos.normalize(photos, collectionId, entryId)` 剥除未知字段并限制为当前栏目、当前文章的 `images/posts/<id>/<24位小写十六进制标识>-<1..9>.jpg`。无 `photos` 的旧记录保持原结构；有图时读者在正文后调用 `renderGallery()` 并传入标识与信号，图库负责原比例、延迟加载、异步解码、纯文本说明及监听清理。

照片服务还提供 `prepare()`、`createPicker()` 与 `downloadBundle()`。JPEG、PNG、WebP 输入每张最多 10 MiB；浏览器重绘移除元数据，输出长边最多 1920 像素、每张最多 2 MiB、合计最多 18 MiB 的 JPEG。组件处理预览、英文 alt、可选 caption、排序删除和取消；混合 ZIP 复用 `downloadBundle()`，文件负载最多 52 MiB，保留仓库相对路径，无外部运行时依赖。

两集合还可选 `attachments: [{ src, title, size }]`，最多 3 份 PDF，每份最多 10 MiB、合计最多 30 MiB。英文标题非空且最多 160 字符，size 为原字节数；路径仅为当前集合和文章的 `documents/posts/<id>/<24hex>-<1..3>.pdf`。`Homepage.articleDocuments` 提供 `normalize()`、`pathFor()`、`validateBytes()`、`prepare()`、`createPicker()` 与 `renderAttachments(host, attachments, { collectionId, entryId, signal })`。PDF 保留原字节和元数据，只检查大小、头部与尾部标识，不做完整 PDF 解析或扫描；读者在正文后看到 Open PDF / Download PDF 链接，不创建 iframe。作者与读者只用公开接口，Relationship 不接入照片或 PDF 服务。

Publications 的 `content.js` 保存外壳，`data.js` 提供 `registerPublicationCategory()` / `getPublicationCategories()`；`internal-note/`、`arxiv/`、`published/` 各自保存分类 `data.js` 与中文 README。条目白名单为 `{ id, title, authors, date, identifier, abstractUrl, pdfUrl? }`，题名与元信息按文本呈现，外链仅 HTTPS。`view.js` 提供独立分类目录与条目，`integration.js` 接入同一详情弹窗。当前只有官方元信息已核实的 arXiv:2610.11981，日期为 2026-10-08、署名为 BESIII Collaboration；另外两分类为空，不推断个人贡献或发表状态。

About与Contact显示用户提供的ORCID链接。Projects已按用户要求移除BESIII Collaboration入口，不据此删除Publications、Internal note或科学引用中的合作组资料；资料仍在各自模块显式维护，不跨目录读内部源码，也不推断合作组角色。Publications 的外部 arXiv PDF 链接不使用两栏受控附件路径。

`modules/author/config.js` 只保存随机盐、PBKDF2-SHA256 600000 次派生校验值及 owner / repo，不保存原密码。`Homepage.authorSession` 提供 `isUnlocked`、`isConnected`、`unlock`、`connect`、`signOut`、`forgetConnection`、`request`、`subscribe`；订阅状态包含 `unlocked`、`connected`、`remembered`、`restoreError`。首次密码登录后连接 GitHub PAT，核验 `PaulLi07`、仓库所有者与 push 权限，真正的授权由 GitHub 执行。

解锁 / 连接在当前页面跨两栏和关闭详情保持；Sign out 清会话内存，刷新或页面离开清内存。只有用户选择 remember，才将 PAT 加密保存在当前浏览器 localStorage；缓存用独立密码派生材料与随机盐 / IV，公开校验值不能直接解开它。刷新先输入密码解密缓存，再重新 GET `/user` 与仓库验证；篡改或失效仅留下未连接状态，Forget 删除缓存与当前连接。

当前 GitHub 请求收到 401 时，服务清连接、取消同代请求，保留已解锁工作台与草稿；编辑器显示重新连接入口。会话订阅仅在解锁状态改变时重建表单，避免连接状态变化丢失草稿；缓存删除失败不显示成功。

`Homepage.createAuthorPublisher(collection)` 返回 `sourceFor`、`merge`、`publish`，独立负责远端纯 JSON 登记解析、归一化、已有记录及照片 / PDF 保留与发布。`createAuthorEditor()` 只处理当前集合表单、草稿和状态；用户主动点击 `Publish to GitHub` 后调用发布器，两集合不互写。

零附件发布保持 Contents GET / PUT 和当前 SHA 校验。只要有任意照片或 PDF，就先 GET `main` head 及对应 commit，取得该提交中的 tree SHA，再以 `?ref=head` 读取同版集合；POST 文件和数据 blobs、带 `base_tree` 的 tree、`parents: [head]` 的 commit，最后 PATCH `main` 且 `force: false`。附件与数据在同一次可见 Git 提交出现；并发冲突保留草稿，未更新 `main` 的 Git 对象不会作为网页文章出现。会话限制固定仓库、分支、数据文件及受控附件写入；blob 每份最多 10 MiB，tree 最多 13 项（数据 1、照片 9、PDF 3），照片与 PDF 各用独立批次标识且必须属于同一文章。真正授权仍由 GitHub 的 Contents 读写权限执行，原 PAT 不需重新授权。

会话另外保存单次发布上下文，把取得的 head / 基树、本次上传 blob、受控新树、新 commit 和分支更新绑定起来；外部 SHA 不能绕过路径限制。重新获取 head、请求失败、视图取消、退出或授权失效都会清理旧上下文，重新发布重新读取版本。

`Download update` 基于当前页面数据，零附件下载当前集合 JS，有任意附件通过照片服务的 ZIP 工具下载数据与新照片 / PDF，文件负载最多 52 MiB；解压内部内容到仓库根，不能上传 ZIP 本身。手动更新前核对远端最新记录、图片和 PDF。以上行为与普通本地源码维护分开。

Relationship 的公开介绍保持空条目；`encrypted.js` 默认登记 `null`，配置后只存密文。`data.js`、`security.js` 和 `integration.js` 归本模块，解密与密码界面不进入共享服务。工具使用 AES-GCM 256 位与 PBKDF2-SHA256 600000 次，用户在本地设置至少 12 字符的口令；明文只允许位于项目外或未跟踪的 `.private/`，后者禁止跟踪、打包与公开部署。

## 路由与扩展

首页锚点保持 `#home`、`#about`、`#academic`、`#life`、`#contact`；普通详情如 `#life/travels`。Experience 与 Moments 各使用栏目根列表、`/<slug>` 正文、`/author` 工作台；如 `#academic/experience/author`、`#life/moments/author`。共用服务管理嵌套路由、刷新、历史、关闭与焦点恢复，不承载模块业务。旧详情链接 research → experience、places → travels、life/notes → creations、outside → relationship 通过分组 aliases 规范到新地址，避免既有书签失效。

Publications 使用 `#academic/publications` 分类目录与 `/internal-note`、`/arxiv`、`/published` 子路由；分类切换与返回通过共享 `navigate()` 实现，支持直达、刷新、历史及英文空状态。

- 添加论文：编辑 Publications 对应分类的 `data.js`，核对原始记录并维护该分类说明；普通栏目条目编辑所属 `content.js`。学术日志维护 `entries.js`，生活文章维护 `posts.js`，两者可分别通过统一作者工作台更新；私密内容只通过本地工具更新 `encrypted.js`。
- 增加详情子模块：建立其目录、内容、图片和说明，声明脚本；在父模块自己的片段中增加入口，调整父模块布局。
- 增加首页模块：建立独立片段、样式、按需脚本和资源，登记 `app/site.json` 与导航；使用注册接口初始化，不将功能逻辑写入 `app/main.js`。
- 增加详情分组或共享能力：说明需求与接口，回归共用详情、导航及使用者，不能仅为单模块方便扩大共享层。
- 调整资料或替换图片：先在对应模块修改，再同步其他展示相同资料的模块、署名页和图片清单；这是显式维护，模块之间不直接读取内部源码。
- 每次扩展维护模块内 `README.md` 及 `docs/modules/<标识>.md`，记录实测证据并在索引登记。

保留相对路径，不以 `/` 开头引用资源。提交前装配并检查，再按 [工作协议](WORKFLOW.md) 实测桌面、手机、键盘、详情路由、子路径和减少动态效果；静态检查不能替代浏览器测试。

`npm run test:compat`、`npm run test:features`、`npm run test:author`、`npm run test:photos` 与 `npm run test:academic-profile` 使用维护环境已有的 Playwright 和三个测试内核，支持 `HOMEPAGE_PLAYWRIGHT_MODULE` 指定模块位置。它们检查已装配页面，报告写入忽略且不交付的 `artifacts/`；实际证据与限制记录在模块文档。`npm run test:author-security` 离线验证作者会话和加密缓存，`npm run test:security` 验证 Relationship 算法，`npm run relationship:check` 检查正式密文格式。测试工具不是网页依赖，基础维护不自动安装它。模块扩展同步补案例，具体范围见工作协议。

此前自定义详情与加密空间的证据见 [兼容性记录](COMPATIBILITY.md)；本次统一作者、加密连接缓存和学术日志的证据见 [author 记录](modules/author.md)。新增生命周期与路由仍须验证清理、焦点、历史和异步取消；模拟 GitHub 请求不能替代真实授权和部署验证。

既有测试历史保留。本轮 9 张照片、PDF 与混合 Git 提交须重新实测数量及大小边界、英文描述、原比例图库、PDF 原字节与阅读链接、旧记录保留、ZIP 路径与内容、单次可见提交、分支冲突及关闭取消；学术分类还需目录、深链、刷新、键盘、历史与实际资料外链验证。本轮附件 297 流程、学术资料 72 流程在三内核/三视口通过；原作者 144、旧功能 81 和离线会话 21 项回归通过。环境、具体覆盖和限制见对应模块记录；九张每张最多 2 MiB 自然受 18 MiB 总量约束，PDF 大文件 10/30 MiB 边界只在独立 Chromium 桌面实测。

## 2026-10-23 漫画造景维护

Academic场景新增独立 `exploration/comic.css` 和原生 `sign-plank.svg` / `grass.svg`，分别维护路牌纸面/立体侧板及漫画草地，按清单加载；`scene.css`仅保留空间布局与共同接地基线，轮播、导航、人物脚本及公共接口保持。资产不放入共享素材目录，完整导航和草地区域通过公开属性排除粒子。测试见 [漫画记录](modules/academic.md#academic-comic-2026-10-23)。

## 人物动作库与独立时间轴

Academic探索场景的 `character/` 保存 `clips.js`（素材/关节采样）、`director.js`（加权抽取/位移/衔接）和 `figure.js`（SVG渲染）；上级 `walker.js` 只连接工厂、活跃时钟和生命周期。素材/导演不访问DOM；渲染器不决定动作或位置。清单依次装配素材、导演、骨架和挂载器，保留普通脚本/文件打开结构。`config.walker`集中调尺寸、速度、时长与权重。详情暂停只用公开URL与原生事件，不新增共享层业务。接口与验证见 [动作库说明](../modules/academic/exploration/character/README.md)。

## 本地数学排版服务（2026-10-23）

`shared/math/` 由清单首个service装配KaTeX 0.19.0、本地WOFF2字体、封装及局部样式，在runtime之后、论文数据和消费者之前加载；Publications及Academic精选共用 `Homepage.math.renderText(host, source, {fallback})`。条目可选 `titleTex` 与必填纯文本 `title` 并存，英文文本节点与显式行内LaTeX分别处理。固定不信任扩展指令、限制展开与尺寸，错误恢复纯文本；不扫描页面或改变作者编辑/发布流程。参见[接口及来源](../shared/math/README.md)、[实测](modules/math.md)。

## About相册（2026-10-23）

2026-10-25最新桌面比例为5%留白／65%照片／25%资料／5%留白，覆盖此前2.5%／65%／30%／2.5%外观约定。组合由About父样式维护，901–1100px按资料内容分配行高并让相册伸展齐高；≤900px继续单列。相册轮播接口、素材及胶水不变，实测见[最新记录](modules/about.md#about-ratio-2026-10-25)。

`modules/about/gallery/` 独立维护照片清单、轮播、图内浮层样式与本地素材；About入口只传root与动态偏好，不读取其他图库私有实现。父CSS仅组合照片、资料与无标题说明，图片画幅内显式排除粒子。相册照片由photos.js集中列出，首图另在HTML提供静态回退；修改首图同步两处并运行回归。用户原图保留，网页使用去元数据的缩放副本；素材与验证见[模块说明](../modules/about/README.md)。

## 分区全宽布局（2026-10-23）

About只在自己的styles.css/gallery/styles.css以局部 `--about-inset` 组织Gallery＋右侧资料的全宽组合；Academic在自己的styles.css/exploration样式以 `--academic-inset` 展开图窗、路牌与全幅草地。媒体铺开、文字限安全边距和阅读行宽；不改变shared/base.css的全局gutter、不改胶水或数据接口。图片/地面仍由所属模块声明粒子排除。当前验证见[About](modules/about.md#edge-layout-2026-10-23)与[Academic](modules/academic.md#edge-layout-2026-10-23)。

后续比例反馈由各模块局部修正：About采用2.5%／65%／30%／2.5%的外侧留白、图片和资料组合；Academic恢复16:9中栏图窗，新增本模块 `exploration/tree.svg` 和既有comic样式中的静态叶树，右侧与路牌形成平衡。树在片段中作为无交互装饰声明粒子排除，不新增注册接口、脚本、共享服务或清单项。资料、轮播、人物动作及胶水保持原职责。验证见[本轮记录](COMPATIBILITY.md#balanced-composition-2026-10-23)。

2026-10-24按最新反馈将叶树替换为本模块原创 `exploration/coconut-palms.svg`，旧tree.svg移除；Academic两轨道扩大中右图片，椰林绝对定位在右下。路牌/椰林采用透明CSS背景及已有前景层合成，取消整块矩形排除，让图形空隙中的粒子可见。仅照片、实体草地等实心区域继续排除，无粒子服务或胶水代码变更。这个明确透明装饰例外由所属模块承担造景与验证，不能把它推广为任意透明img自动识别。见[本次实测](COMPATIBILITY.md#coconut-palms-2026-10-24)。

后续高度修正仍只归Academic探索模块：原生桌面高椰林720×1660，新增窄屏 `coconut-palms-mobile.svg` 720×2940，仅延长曲干、叶冠比例相同；CSS按宽度和原生根基线推导地面与照片留白，确保最低叶尖高于照片。图窗缩至中间尺度，图片/文字高于装饰层；没有新JS、共享接口或清单变化。见[最新验证](COMPATIBILITY.md#tall-palms-2026-10-24)。

2026-10-24最新紧凑构图取代上一轮整排树冠留白与超长手机树：两份原生SVG统一720×1120、根y1107，三冠高低交叠、聚根交干，桌面图片左移，≤760px照片在上而漫画造景在下；≥1800px主体收拢至居中1800px范围，草地/分隔仍全宽。允许叶片在照片后自然交叠，不再强迫全部最低叶尖高于照片；透明层级、英文页面与中文说明原则保持。CSS素材引用须同步内容版本，装配后刷新原预览核实；接口与胶水不变。分支 `style/academic-compact-grove`，回退 `b156e06`，实际验证见[最新记录](COMPATIBILITY.md#compact-grove-2026-10-24)。

2026-10-26内部材料分组：`internal-note/groups.js`提供登记及深复制getter，各组独立数据，`internal-note/view.js`管理所属DOM和清理，父Publications视图只委托路由并从公开getter汇总计数。组路由沿用单slug `internal-note-<id>`，共享详情、作者及博客接口不变。具体扩展见[说明](../modules/academic/publications/internal-note/README.md)。
