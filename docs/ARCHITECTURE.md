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
    research/ publications/ notes/ projects/
  life/                    生活概览
    moments/ places/ notes/ outside/
  contact/                 联系
  credits/                 独立素材署名页
shared/                    基础样式、导航、详情弹窗、过渡与注册接口
scripts/                   本地装配、检查、预览与打包
docs/                      框架、协议、素材及测试记录
index.html, credits.html   装配生成的发布页面
```

主模块在自己的目录保存 `section.html`、`styles.css`、按需的 `module.js`、`images/` 和 `README.md`；署名模块使用 `page.html`。详情子模块保存 `content.js`、`images/cover.jpg` 与 `README.md`。无行为的模块无需空脚本，无图片的模块无需空图片目录。

`shared/` 只接收有实际跨模块复用需求的能力。模块不直接读取其他模块的内部实现；共享接口变化需回归所有使用者，单模块业务应留在该模块内。相同占位图片在不同主模块分别保存，便于独立替换。

目前模块图片共 13 个文件。学术、生活和联系区各自使用 `images/background.jpg`，与详情封面独立；替换子模块封面不会联动改变父区背景。来源与副本关系见 [图片清单](image-sources.md)。

## 装配与运行

| 文件 | 职责 |
|---|---|
| `app/site.json` | `sharedStyles`、`afterStyles`、`sharedScripts` 与各模块的 `view`、`styles`、`scripts`、可选的 `preloadImages` 声明装配顺序，路径相对于站点根 |
| `app/index.template.html` | 首页文档外壳与装配位置 |
| `app/credits.template.html` | 素材署名页外壳与装配位置 |
| `app/main.js` | 取得共享服务并初始化注册模块；不放具体模块内容 |
| `scripts/assemble.py` | 读取清单与模板，嵌入 HTML 片段，输出根页面并引用对应 CSS / JS |
| `scripts/test-compatibility.cjs` | 可选浏览器实测工具，自启临时子路径服务器；不参与网站运行、装配或普通检查 |
| `index.html`、`credits.html` | 生成产物，供本地文件打开、预览与直接上传；禁止手改 |
| `shared/favicon.svg` | 跨页面网站图标 |
| `shared/base.css`、`shared/runtime.js` | 基础样式与统一注册入口 |
| `shared/reveal.js` | `initReveals(roots)`，观察传入公共根节点内的进入动画元素 |
| `shared/navigation/` | `view.html`、`styles.css`、`navigation.js`，提供跨模块导航 |
| `shared/details/` | `view.html`、`styles.css`、`dialog.js`，提供共用详情弹窗 |
| `shared/transitions/` | `styles.css`、`transitions.js`，提供共用开场与详情过渡 |

`npm run assemble` 写入生成页面。`npm run check` 只读检查生成物是否与源码一致及语法、资源、注册关系；若生成物过期，先显式装配。`npm run preview`、`npm run package` 先装配。提交时同时保留模块源码与最新生成页面；上传包无需在 GitHub 服务器重新装配。

装配工具使用 Python 3.9+。`sections` 中连续模块若声明同一个 `container`，装配器把它们包入共同容器；当前 home 与 about 使用 `container: "page1"`，保持连续背景。模板通过 `{{sections}}` 装配分区；新增分区只需清单和导航，不需要新增模板占位；停用分区时同步导航及其他公开入口。图片预载随模块清单声明，模板不绑定具体模块图片。

脚本使用普通 `defer` 标签。`sharedScripts` 依次加载注册接口、过渡、详情与导航；随后按 `sections` 顺序加载详情数据与模块脚本，最后执行 `app/main.js`。`sharedStyles` 在模块样式前，`afterStyles` 在模块样式后，署名页只引用基础与本页样式、不加载首页脚本。顺序以 `app/site.json` 为准，不使用运行时模板请求或 ES Module 导入，保留文件打开方式。

## 注册接口与共享服务

`shared/runtime.js` 提供单一全局入口 `window.Homepage`：

- `registerSection({ id, init?, detailGroup? })`：登记页面分区；可选初始化函数只处理本模块功能。详情分组模块声明 `detailGroup: { id, label, descriptionTitle }`，由胶水传给详情服务。
- `registerDetail(group, key, data)`：登记一条详情；`group` 与 `key` 对应路由，例如 `academic` / `research`。

`app/main.js` 为初始化函数传入 `{ root, details, reducedMotion }`：`root` 是本模块 DOM 根节点，`details` 是共用详情服务，`reducedMotion` 是减少动态效果的 `MediaQueryList`，通过 `.matches` 判断并监听偏好变化。模块应在自己的 `root` 内查询元素，使用 `details.open(group, key, { trigger, source })` 打开详情，使用 `details.onSelect(group, callback)` 响应所属分组的切换，使用 `details.getItem(group, key)` 读取已注册详情，不查询其他模块 DOM。

胶水使用 `createDetails({ dialog, content, groups, transitions })` 创建共用详情控制器，`groups` 来自注册分区的 `detailGroup`，控制器负责弹窗、历史与焦点恢复；共享导航管理页面导航，过渡服务管理共用动画。创建函数保存在统一 `Homepage` 接口内，模块通过传入服务使用控制器，而非自行创建重复弹窗。

导航入口为 `createNavigation({ root, sections })`，只接收导航和公共分区根节点；过渡入口为 `createTransitions(reducedMotion)`。胶水调用 `initReveals(roots)` 启动共享进入动画，观察逻辑留在 `shared/reveal.js`，不放回胶水层。胶水逐模块隔离初始化异常，不阻断其他模块和共享服务启动。共享入口和使用边界见 [共享层说明](../shared/README.md)。

注册接口替代旧的 `window.HOMEPAGE_CONTENT` 和 `window.HomepageTransitions` 全局。详情由子模块独立贡献，父模块负责自己的概览与入口；不跨目录读取其他模块内部数据。

## 详情数据

学术详情为 `academic/{research,publications,notes,projects}/content.js`，生活详情为 `life/{moments,places,notes,outside}/content.js`，路径均位于 `modules/` 下。各文件注册自己的数据：

| 字段 | 用途 |
|---|---|
| `title`、`label`、`kicker`、`subtitle` | 详情标题、切换文字、编号与简介 |
| `image`、`imageAlt`、`credit`、`source` | 图片路径、英文替代文本、署名及来源 |
| `description` | 英文段落字符串数组 |
| `facts` | 可选的 `{ label, value }` 资料数组 |
| `listTitle`、`emptyMessage`、`entries` | 条目区标题、空状态及内容数组 |
| `link` | 可选的 `{ label, url }` 底部链接 |

条目格式为 `{ title, meta, description, url }`，后三个字段可省略；`description`、`entries` 保持数组，没有真实内容则使用 `entries: []`。共用详情按文本渲染内容，不解析条目中的 HTML。

## 路由与扩展

首页锚点保持 `#home`、`#about`、`#academic`、`#life`、`#contact`；详情保持 `#academic/research`、`#life/moments` 等格式。共用详情服务管理打开、切换、关闭、刷新直达、前进与后退；原生 `<dialog>` 提供模态与键盘基础行为，关闭后恢复焦点。

- 添加论文、笔记或故事：编辑对应子模块 `content.js`，同步该模块说明与测试记录。
- 增加详情子模块：建立其目录、内容、图片和说明，声明脚本；在父模块自己的片段中增加入口，调整父模块布局。
- 增加首页模块：建立独立片段、样式、按需脚本和资源，登记 `app/site.json` 与导航；使用注册接口初始化，不将功能逻辑写入 `app/main.js`。
- 增加详情分组或共享能力：说明需求与接口，回归共用详情、导航及使用者，不能仅为单模块方便扩大共享层。
- 调整资料或替换图片：先在对应模块修改，再同步其他展示相同资料的模块、署名页和图片清单；这是显式维护，模块之间不直接读取内部源码。
- 每次扩展维护模块内 `README.md` 及 `docs/modules/<标识>.md`，记录实测证据并在索引登记。

保留相对路径，不以 `/` 开头引用资源。提交前装配并检查，再按 [工作协议](WORKFLOW.md) 实测桌面、手机、键盘、详情路由、子路径和减少动态效果；静态检查不能替代浏览器测试。

`npm run test:compat` 使用维护环境已有的 Playwright 和三个测试内核，支持 `HOMEPAGE_PLAYWRIGHT_MODULE` 指定模块位置。它检查已装配页面，报告写入忽略的 `artifacts/compatibility-results.json`；实际证据与限制记录在模块文档。测试工具不是网页依赖，基础维护不自动安装它。模块扩展同步补案例，具体范围见工作协议。
