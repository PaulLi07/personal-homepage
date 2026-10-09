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
```

Playwright 位于项目外时，可用 `HOMEPAGE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright npm run test:compat` 指定模块路径。它是可选测试工具，网站运行、普通检查、预览和打包不依赖它；`npm run check` 不安装依赖或下载浏览器。

测试脚本自行启动临时服务器，在 `/personal-homepage/` 下验证三个内核及 1440、390、320 像素视口、现有八个详情、键盘、历史、动画、资源和文件打开，无需常驻预览。报告为 `artifacts/compatibility-results.json`，不进入版本库；将实际结果与未覆盖项写入模块测试记录。模拟视口和测试内核不等于手机真机或各品牌浏览器实测。新增功能还需补相应案例和视觉检查。

## 功能入口

| 目录 | 负责内容 |
|---|---|
| `modules/home/` | 首屏介绍与宇宙背景 |
| `modules/about/` | 个人简介与资料 |
| `modules/academic/` | 学术概览；`research/`、`publications/`、`notes/`、`projects/` 各自保存详情与图片 |
| `modules/life/` | 生活照片；`moments/`、`places/`、`notes/`、`outside/` 各自保存相册详情与图片 |
| `modules/contact/` | 联系方式、背景与年份 |
| `modules/credits/` | 图片署名独立页面 |
| `shared/` | 真正跨模块使用的基础样式、导航、详情弹窗、过渡与注册接口 |
| `app/` | 页面模板、模块清单和初始化胶水 |
| `scripts/` | 装配、检查、预览和打包工具 |
| `docs/` | 框架、协议、素材来源及模块测试记录 |

先打开对应功能目录的 `README.md`，再修改同目录源码。添加论文、笔记或故事优先编辑对应子模块的 `content.js`；没有真实资料时保留空条目。不要手改根目录 `index.html`、`credits.html`，它们会被装配覆盖。

## 固定维护要求

- 所有说明文档使用中文；文件路径、命令、代码标识、网址和专有名称保留原文。
- 所有网页呈现内容使用英文，包括页面标题、提示、替代文本和无障碍标签。
- 每次模块扩展同步模块内的简洁 `README.md`，在 `docs/modules/` 登记对应测试记录，并完成实际兼容性测试。
- 模块维护自己的资源；通过声明的共享服务交互，不直接读取其他模块内部。共享目录只接收已被多个模块使用的能力。

## 维护文档

- [框架概要](docs/ARCHITECTURE.md)：模块边界、装配、注册接口与扩展位置。
- [工作协议](docs/WORKFLOW.md)：Git、模块说明、测试、提交和发布流程。
- [模块目录](docs/modules/README.md)与[记录模板](docs/modules/TEMPLATE.md)：模块索引和兼容性测试证据。
- [兼容性实测](docs/COMPATIBILITY.md)：本次重构的测试环境、范围和限制。
- [维护约定](AGENTS.md)与[变更记录](CHANGELOG.md)：后续工作规则与重要变化。
- [图片替换清单](docs/image-sources.md)与[参考分析](docs/reference-analysis.md)：素材来源及设计框架依据。

## Git 与发布

本地 `main` 跟踪 `origin/main`。日常流程为：检查状态 → 核对远端 → 修改模块 → 装配 → 检查与实测 → 本地提交 → 按发布请求更新远端。

默认只完成本地维护和提交，普通维护不自动推送。手动上传时将打包后文件夹的内部内容放到仓库根目录，使生成的 `index.html` 位于最外层，同时上传 `modules/`、`shared/` 等资源目录。ZIP 不包含 `.git`。

Pages 发布约定为 `main` / `/(root)`，保留根目录 `.nojekyll`，使用相对路径兼容 `/personal-homepage/`。更新部署分支会触发 Pages 部署。
