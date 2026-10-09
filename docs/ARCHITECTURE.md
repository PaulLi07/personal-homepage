# 项目框架概要

这是无构建步骤的纯静态网站：浏览器直接读取 HTML、CSS、普通 JavaScript 和本地图片。
正式源码位于工作区根目录 `personal-homepage/`，GitHub Pages 从仓库根目录提供文件。
所有网页呈现内容使用英文；所有说明文档使用中文。文件路径、命令、代码标识、网址和专有名称保留原文。

## 文件职责

| 文件 / 目录 | 职责 |
|---|---|
| `index.html` | 首页、About、Academic、Life、Contact，以及共用详情弹窗的 HTML 骨架 |
| `credits.html` | 独立图片来源页；只加载样式，不加载首页脚本 |
| `css/styles.css` | 色彩变量、所有布局、响应式样式、动画状态和减少动态效果规则 |
| `js/content.js` | 学术栏目和生活相册的详情数据 |
| `js/transitions.js` | 开场五栏揭幕与打开详情时的动画 |
| `js/gallery.js` | 缩略图预览、详情渲染、弹窗、哈希路由与焦点恢复 |
| `js/main.js` | 启动开场、年份、导航状态、滚动隐藏、生活照片漂移和进入动画 |
| `assets/images/` | 随源码交付的本地占位图片 |
| `assets/favicon.svg` | 网站图标 |
| `docs/` | 框架、素材来源、下载清单和参考网站分析；`modules/` 保存扩展模块说明与兼容性测试记录 |
| `scripts/`, `package.json` | 本地检查、预览和打包命令；不参与网页运行 |
| `AGENTS.md`, `CHANGELOG.md` | 代理维护约定与重要变更记录 |
| `.nojekyll` | 让 GitHub Pages 按静态文件提供内容 |

## 加载顺序与接口

`index.html` 用 `defer` 按以下顺序加载脚本；执行时 HTML 已解析，顺序必须保留：

1. `content.js`：建立 `window.HOMEPAGE_CONTENT`。
2. `transitions.js`：建立 `window.HomepageTransitions = { start, openDetail }`。
3. `gallery.js`：读取数据与动画接口，绑定按钮并处理当前详情链接。
4. `main.js`：调用 `start()`，绑定首页导航和滚动行为。

后三个脚本使用立即执行函数隔离内部变量；只有上面两个对象作为全局接口。
`start()` 为异步开场函数；`main.js` 调用后继续初始化，不等待动画结束。
开场有 1600 毫秒的移除兜底，不等待全部图片；减少动态效果时跳过开场与详情动画。
`openDetail(dialog, sourceRect)` 接收已经打开的弹窗及可选的来源图片位置。

## 内容数据

`HOMEPAGE_CONTENT` 目前包含两个分组，每个对象键也是详情链接中的栏目标识：

- `academic`：`research`、`publications`、`notes`、`projects`。
- `life`：`moments`、`places`、`notes`、`outside`。

各栏目共用以下字段：

| 字段 | 用途 |
|---|---|
| `title`, `label`, `kicker`, `subtitle` | 详情标题、切换按钮文字、栏目编号与简短介绍 |
| `image`, `imageAlt`, `credit`, `source` | 本地图片路径、替代文本、署名与来源链接 |
| `description` | 段落字符串数组 |
| `facts` | 可选的 `{ label, value }` 数组，渲染为资料列表 |
| `listTitle`, `emptyMessage`, `entries` | 条目区标题、空状态文字与内容数组 |
| `link` | 可选的 `{ label, url }`，渲染详情底部链接 |

每个 `entries` 条目格式为 `{ title, meta, description, url }`；后三个字段可省略。
`description` 和 `entries` 必须保持数组；没有真实内容时使用 `entries: []`。
文字通过 `textContent` 写入页面，不解析 HTML；条目链接在新标签页打开。
首页简介、邮箱、缩略图和照片按钮仍写在 `index.html`，不会从数据文件自动生成。

## 导航与详情路由

首页锚点为 `#home`、`#about`、`#academic`、`#life`、`#contact`。
详情格式为 `#academic/research` 或 `#life/moments`；直接访问也能打开对应弹窗。
路由匹配仅接受 `academic` / `life` 两组和小写英文字母组成的栏目键。
点击栏目用 `history.pushState` 新增详情状态；弹窗内切换栏目用 `replaceState` 替换。
`hashchange`、`popstate` 均调用路由处理；无效详情链接关闭弹窗。
从页面打开后关闭会后退并恢复按钮焦点；直接详情链接关闭后定位到所属分区。
原生 `<dialog>` 提供模态行为，关闭按钮和 Escape 走同一逻辑；打开时禁止背景滚动。

## 扩展与修改位置

- 增加论文、笔记或故事：只补充对应栏目的 `entries`，必要时修改介绍与空状态文字。
- 增加学术栏目：在 `content.js` 加对象，同时在 `index.html` 加对应 `data-preview` 图片和 `data-academic` 按钮。
- 增加生活相册：在数据中加对象，同时添加 `data-life` 按钮和图片；需为新照片编写位置与手机布局。
- 现有分组内的弹窗切换按钮会自动按数据对象顺序生成；首页按钮与预览不会自动生成。
- 增加首页分区：修改导航、`section[id]` 和样式；导航当前区域判断会扫描所有 `main section[id]`。
- 增加第三种详情分组：还需修改 `gallery.js` 的路由正则、按钮选择器与分组识别逻辑。
- 替换图片：同步检查 HTML 与数据中的路径、替代文本、占位说明、`credits.html` 和素材文档。
- 调整身份资料：检查 `index.html` 的所有出现位置及 `gallery.js` 的页面标题，不只修改数据文件。
- 每次扩展模块：按 [模块模板](modules/TEMPLATE.md) 新建或更新对应中文说明，在 [模块目录](modules/README.md) 登记，并记录兼容性测试结果；具体要求见 [工作协议](WORKFLOW.md)。

## 维护约束与检查点

保留相对资源路径，例如 `assets/images/...`；勿改为从 `/` 开始的站点根路径。
保持 HTML、样式、脚本、图片分离；当前无 npm 依赖、打包器、服务器端接口或外部运行时。
`gallery.js` 依赖详情区域的固定 ID；`main.js` 依赖 `.navbar`、`#life` 和 `#current-year`。
修改选择器或加载顺序时须检查所有使用处；增加第五个学术栏目时须调整当前四列缩略图布局。
提交前运行 `npm run check` 与 `git diff --check`；模块扩展、布局或交互改动还须实际测试桌面、手机、键盘和详情直达链接，并记录浏览器兼容性。静态检查不能替代浏览器测试。
工作协议以根目录 `AGENTS.md` 为准；素材替换参考 `docs/image-sources.md`。
