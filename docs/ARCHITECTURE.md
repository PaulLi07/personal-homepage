# 项目框架概要

网站按功能组织源码，在本地将 HTML 片段装配成完整静态页面。浏览器读取普通 HTML、CSS、JavaScript 和本地图片，运行时无构建、无框架依赖、无需请求片段；生成的根页面支持直接文件打开和 GitHub Pages 仓库子路径。

所有说明文档使用中文，所有网页呈现内容使用英文；路径、命令、代码标识、网址和专有名称保留原文。

## 目录与边界

```text
app/                       模块清单、页面外壳与初始化胶水
modules/
  home/                    首屏
  about/                   简介
  academic/                学术概览
    experience/ publications/ notes/ projects/
  life/                    生活概览
    moments/ travels/ creations/ relationship/
  contact/                 联系
  credits/                 独立素材署名页
  author/                  两栏共用的密码登录、GitHub 连接与编辑器服务
shared/                    基础样式、导航、详情弹窗、过渡与注册接口
scripts/                   本地装配、检查、预览与打包
docs/                      框架、协议、素材及测试记录
index.html, credits.html   装配生成的发布页面
```

主模块在自己的目录保存 `section.html`、`styles.css`、按需的 `module.js`、`images/` 和 `README.md`；署名模块使用 `page.html`。详情子模块保存 `content.js`、封面和说明；Experience 日志、Moments 博客、Relationship 解密行为留在各自模块，统一会话与编辑器由 author 服务提供。无行为的模块无需空脚本，无图片的模块无需空图片目录。

`modules/author/` 是用户要求的共用功能服务，不占首页分区，无 HTML 根节点且不调用 `registerSection`。`app/site.json` 的 `services` 声明其 `id`、`folder`、`styles`、`scripts`；配置、会话与通用编辑器在共享基础之后、分区脚本之前装配。Experience 与 Moments 只接入服务，各自维护读者、数据 schema 和文件路径。

`shared/` 只接收有实际跨模块复用需求的能力。模块不直接读取其他模块的内部实现；共享接口变化需回归所有使用者，单模块业务应留在该模块内。相同占位图片在不同主模块分别保存，便于独立替换。

目前模块图片共 13 个文件。学术、生活和联系区各自使用 `images/background.jpg`，与详情封面独立；替换子模块封面不会联动改变父区背景。来源与副本关系见 [图片清单](image-sources.md)。

## 装配与运行

| 文件 | 职责 |
|---|---|
| `app/site.json` | `sharedStyles`、`afterStyles`、`sharedScripts`、`services` 与分区的 `view`、`styles`、`scripts`、可选的 `preloadImages` 声明装配顺序，路径相对于站点根 |
| `app/index.template.html` | 首页文档外壳与装配位置 |
| `app/credits.template.html` | 素材署名页外壳与装配位置 |
| `app/main.js` | 取得共享服务并初始化注册模块；不放具体模块内容 |
| `scripts/assemble.py` | 读取清单与模板，嵌入 HTML 片段，输出根页面并引用对应 CSS / JS |
| `scripts/test-compatibility.cjs` | 可选浏览器实测工具，自启临时子路径服务器；不参与网站运行、装配或普通检查 |
| `scripts/test-features.cjs` | 可选博客、模拟作者发布和加密视图测试；临时夹具通过请求拦截提供，不发布真实文章 |
| `scripts/test-author-log.cjs` | 用随机作者密码、临时双集合与模拟 GitHub 验证统一会话、加密缓存和独立发布 |
| `scripts/test-security.cjs`、`scripts/relationship.cjs` | 离线算法回归与本地密文生成 / 格式检查；不参与网页运行 |
| `index.html`、`credits.html` | 生成产物，供本地文件打开、预览与直接上传；禁止手改 |
| `shared/favicon.svg` | 跨页面网站图标 |
| `shared/base.css`、`shared/runtime.js` | 基础样式与统一注册入口 |
| `shared/reveal.js` | `initReveals(roots)`，观察传入公共根节点内的进入动画元素 |
| `shared/navigation/` | `view.html`、`styles.css`、`navigation.js`，提供跨模块导航 |
| `shared/details/` | `view.html`、`styles.css`、`dialog.js`，提供共用详情弹窗 |
| `shared/transitions/` | `styles.css`、`transitions.js`，提供共用开场与详情过渡 |

`npm run assemble` 写入生成页面。`npm run check` 只读检查生成物是否与源码一致及语法、资源、注册关系；若生成物过期，先显式装配。`npm run preview`、`npm run package` 先装配。提交时同时保留模块源码与最新生成页面；上传包无需在 GitHub 服务器重新装配。

装配工具使用 Python 3.9+。`sections` 中连续模块若声明同一个 `container`，装配器把它们包入共同容器；当前 home 与 about 使用 `container: "page1"`，保持连续背景。模板通过 `{{sections}}` 装配分区；新增分区只需清单和导航，不需要新增模板占位；停用分区时同步导航及其他公开入口。图片预载随模块清单声明，模板不绑定具体模块图片。

脚本使用普通 `defer` 标签。`sharedScripts` 依次加载注册接口、过渡、详情与导航；随后按 `services` 加载作者配置 / 会话 / 编辑器，再按 `sections` 加载详情数据与模块脚本，最后执行 `app/main.js`。`sharedStyles` 在功能样式前，`afterStyles` 在功能样式后，署名页只引用基础与本页样式、不加载首页脚本。顺序以 `app/site.json` 为准，不使用运行时模板请求或 ES Module 导入，保留文件打开方式。

## 注册接口与共享服务

`shared/runtime.js` 提供单一全局入口 `window.Homepage`：

- `registerSection({ id, init?, detailGroup? })`：登记页面分区；可选初始化函数只处理本模块功能。详情分组模块声明 `detailGroup: { id, label, descriptionTitle }`，由胶水传给详情服务。
- `registerDetail(group, key, data)`：登记公开介绍与普通详情数据，例如 `academic` / `experience`。
- `registerDetailView(group, key, { render })`：为已有栏目登记自定义详情视图，供 Moments 博客与 Relationship 加密空间复用同一个弹窗外壳。
- `registerData(key, value)` / `getData(key)`：保存模块命名空间的数据；具体格式、校验与 getter 仍由模块负责，例如 `getBlogPosts()` 和 `getEncryptedRelationship()`。

`app/main.js` 为初始化函数传入 `{ root, details, reducedMotion }`：`root` 是本模块 DOM 根节点，`details` 是共用详情服务，`reducedMotion` 是减少动态效果的 `MediaQueryList`，通过 `.matches` 判断并监听偏好变化。模块应在自己的 `root` 内查询元素，使用 `details.open(group, key, { trigger, source })` 打开详情，使用 `details.onSelect(group, callback)` 响应所属分组的切换，使用 `details.getItem(group, key)` 读取已注册详情，不查询其他模块 DOM。

胶水使用 `createDetails({ dialog, content, views, groups, transitions })` 创建详情服务，`views` 为注册表，`groups` 来自分区的 `detailGroup`。胶水只传递这些接口，不解释文章、作者权限或加密数据；共享服务负责弹窗、历史与焦点恢复。

自定义 `render({ host, route, signal, navigate })` 只操作自己的 `host`。`route` 是栏目后的尾段，如文章标识或 `author`；`navigate(null)` 返回栏目根，`navigate(slug)` 进入正文。关闭、切换或重新渲染时由生命周期清理事件、DOM 与异步结果；`render` 可返回幂等的清理函数（允许重复调用）。Relationship 明文随详情清理；统一作者会话按独立生命周期管理，不能因关闭一栏使另一栏退出。

导航入口为 `createNavigation({ root, sections })`，只接收导航和公共分区根节点；过渡入口为 `createTransitions(reducedMotion)`。胶水调用 `initReveals(roots)` 启动共享进入动画，观察逻辑留在 `shared/reveal.js`，不放回胶水层。胶水逐模块隔离初始化异常，不阻断其他模块和共享服务启动。共享入口和使用边界见 [共享层说明](../shared/README.md)。

注册接口替代旧的 `window.HOMEPAGE_CONTENT` 和 `window.HomepageTransitions` 全局。详情由子模块独立贡献，父模块负责自己的概览与入口；不跨目录读取其他模块内部数据。

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

Moments 的 `posts.js` 使用 `Homepage.registerBlogPosts(JSON数组)` 登记文章，格式为 `{ id, title, date, excerpt, body, author }`；正文为英文纯文本，作者为 Yuhong Li，文章标识 `author` 保留给工作台。`data.js` 管文章校验与 getter，`integration.js` 将读者与作者视图接入注册接口。

Experience 的 `entries.js` 使用 `Homepage.registerAcademicLogs(JSON数组)` 登记独立学术日志，增加 `kind` 与可选 `reference`。类型限定 Research / Learning / Seminar / Milestone，参考链接仅绝对 HTTPS；`data.js` 提供校验、规范化与 `getAcademicLogs()`，命名空间为 `experience.entries`。日志读者与接入行为留在 Experience，不读取 Moments 内部。

`modules/author/config.js` 只保存随机盐、PBKDF2-SHA256 600000 次派生校验值及 owner / repo，不保存原密码。`Homepage.authorSession` 提供 `isUnlocked`、`isConnected`、`unlock`、`connect`、`signOut`、`forgetConnection`、`request`、`subscribe`；订阅状态包含 `unlocked`、`connected`、`remembered`、`restoreError`。首次密码登录后连接 GitHub PAT，核验 `PaulLi07`、仓库所有者与 push 权限，真正的授权由 GitHub 执行。

解锁 / 连接在当前页面跨两栏和关闭详情保持；Sign out 清会话内存，刷新或页面离开清内存。只有用户选择 remember，才将 PAT 加密保存在当前浏览器 localStorage；缓存用独立密码派生材料与随机盐 / IV，公开校验值不能直接解开它。刷新先输入密码解密缓存，再重新 GET `/user` 与仓库验证；篡改或失效仅留下未连接状态，Forget 删除缓存与当前连接。

当前 GitHub 请求收到 401 时，服务清连接、取消同代请求，保留已解锁工作台与草稿；编辑器显示重新连接入口。会话订阅仅在解锁状态改变时重建表单，避免连接状态变化丢失草稿；缓存删除失败不显示成功。

通用编辑器接收当前集合的 schema、读写路径和 getter；用户主动点击 `Publish to GitHub`，才重读远端 SHA 并 PUT 到 `main` 的对应 `entries.js` 或 `posts.js`。冲突不覆盖、保留草稿，两集合不互写；远端登记文件严格解析 JSON 而不执行。`Download update` 只导出当前集合登记文件。以上行为与普通本地源码维护分开。

Relationship 的公开介绍保持空条目；`encrypted.js` 默认登记 `null`，配置后只存密文。`data.js`、`security.js` 和 `integration.js` 归本模块，解密与密码界面不进入共享服务。工具使用 AES-GCM 256 位与 PBKDF2-SHA256 600000 次，用户在本地设置至少 12 字符的口令；明文只允许位于项目外或未跟踪的 `.private/`，后者禁止跟踪、打包与公开部署。

## 路由与扩展

首页锚点保持 `#home`、`#about`、`#academic`、`#life`、`#contact`；普通详情如 `#life/travels`。Experience 与 Moments 各使用栏目根列表、`/<slug>` 正文、`/author` 工作台；如 `#academic/experience/author`、`#life/moments/author`。共用服务管理嵌套路由、刷新、历史、关闭与焦点恢复，不承载模块业务。旧详情链接 research → experience、places → travels、life/notes → creations、outside → relationship 通过分组 aliases 规范到新地址，避免既有书签失效。

- 添加论文或普通栏目条目：编辑对应子模块 `content.js`；学术日志维护 `entries.js`，生活文章维护 `posts.js`，两者可分别通过统一作者工作台更新；私密内容只通过本地工具更新 `encrypted.js`。
- 增加详情子模块：建立其目录、内容、图片和说明，声明脚本；在父模块自己的片段中增加入口，调整父模块布局。
- 增加首页模块：建立独立片段、样式、按需脚本和资源，登记 `app/site.json` 与导航；使用注册接口初始化，不将功能逻辑写入 `app/main.js`。
- 增加详情分组或共享能力：说明需求与接口，回归共用详情、导航及使用者，不能仅为单模块方便扩大共享层。
- 调整资料或替换图片：先在对应模块修改，再同步其他展示相同资料的模块、署名页和图片清单；这是显式维护，模块之间不直接读取内部源码。
- 每次扩展维护模块内 `README.md` 及 `docs/modules/<标识>.md`，记录实测证据并在索引登记。

保留相对路径，不以 `/` 开头引用资源。提交前装配并检查，再按 [工作协议](WORKFLOW.md) 实测桌面、手机、键盘、详情路由、子路径和减少动态效果；静态检查不能替代浏览器测试。

`npm run test:compat`、`npm run test:features`、`npm run test:author` 使用维护环境已有的 Playwright 和三个测试内核，支持 `HOMEPAGE_PLAYWRIGHT_MODULE` 指定模块位置。它们检查已装配页面，报告写入忽略且不交付的 `artifacts/`；实际证据与限制记录在模块文档。`npm run test:author-security` 离线验证作者会话和加密缓存，`npm run test:security` 验证 Relationship 算法，`npm run relationship:check` 检查正式密文格式。测试工具不是网页依赖，基础维护不自动安装它。模块扩展同步补案例，具体范围见工作协议。

此前自定义详情与加密空间的证据见 [兼容性记录](COMPATIBILITY.md)；本次统一作者、加密连接缓存和学术日志的证据见 [author 记录](modules/author.md)。新增生命周期与路由仍须验证清理、焦点、历史和异步取消；模拟 GitHub 请求不能替代真实授权和部署验证。
