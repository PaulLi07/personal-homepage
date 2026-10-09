# Yuhong Li 个人主页

南开大学理论物理研究生的英文个人主页。采用 HTML、CSS、原生 JavaScript 和本地图片，浏览器直接运行，无框架依赖和构建步骤。

- 网站：<https://paulli07.github.io/personal-homepage/>
- 远端：<https://github.com/PaulLi07/personal-homepage>
- 正式源码：当前工作区根目录的 `personal-homepage/`。`outputs/personal-homepage` 为兼容链接，其他解压副本属于历史快照。

## 快速开始

维护命令使用 Node.js 18+ 和 Python 3；无需运行 `npm install`。

```sh
cd personal-homepage
npm run check       # 脚本语法、资源、内容数据与栏目映射检查
npm run preview     # 本地预览：http://127.0.0.1:8767/
npm run package     # 源码 ZIP：../outputs/personal-homepage-source.zip
```

已有本地预览服务时，直接访问预览地址即可。HTML 也可直接在浏览器中打开；上述命令只用于维护，不是网站运行依赖。

## 项目入口

| 文件 / 目录 | 修改内容 |
|---|---|
| `index.html` | 首页结构、身份资料、导航和栏目入口 |
| `credits.html` | 图片来源页 |
| `css/styles.css` | 常规字体、宇宙主题、布局、响应式样式 |
| `js/content.js` | Research、Publications、Notes、Projects 与 Life 相册数据 |
| `js/gallery.js` | 预览、详情弹窗、路由和焦点恢复 |
| `js/transitions.js`, `js/main.js` | 动画、导航和滚动行为 |
| `assets/` | 图片、图标和后续可下载材料 |
| `scripts/` | 检查和打包工具，不参与网页运行 |
| `docs/` | 框架、工作协议、图片来源和参考分析 |

新增论文、笔记、项目或故事，优先编辑 `js/content.js` 的 `entries`。没有真实资料的栏目保留空数组。替换图片时同步更新路径、替代文本、占位说明和署名。

## 固定维护要求

- 所有说明文档使用中文；文件路径、命令、代码标识、网址和专有名称保留原文。
- 所有网页呈现内容使用英文，包括页面标题、提示、图片替代文本和无障碍标签。
- 每次扩展模块都要在 `docs/modules/` 新建或更新对应的简洁中文说明，并完成兼容性测试；在说明中记录实际环境、结果和未覆盖项。

## 维护文档

- [框架概要](docs/ARCHITECTURE.md)：加载顺序、数据结构、路由和功能扩展入口。
- [工作协议](docs/WORKFLOW.md)：Git、检查、提交和发布流程。
- [模块说明目录](docs/modules/README.md)与[模块模板](docs/modules/TEMPLATE.md)：扩展说明及兼容性测试记录。
- [AGENTS.md](AGENTS.md)：后续代理维护时必须遵守的项目约定。
- [CHANGELOG.md](CHANGELOG.md)：重要变更记录。
- [图片替换清单](docs/image-sources.md)：占位素材对应位置及来源。
- [参考站源码分析](docs/reference-analysis.md)：现有页面框架的来源和映射。

## Git 与发布

本地 `main` 跟踪 `origin/main`，远端使用上面的 GitHub 仓库。日常流程为：检查状态 → 同步远端 → 修改 → 检查与预览 → 本地提交 → 按发布请求更新远端。

默认只完成本地维护和提交；发布时可以由你上传文件，也可以明确要求推送 Git。将文件上传到仓库根目录，使 `index.html` 位于最外层；ZIP 中不包含 `.git` 历史。

GitHub Pages 发布约定为 `main` / `/(root)`。`.nojekyll` 保留在仓库根目录；资源路径使用相对路径，以兼容 `/personal-homepage/`。更新远端部署分支会触发 Pages 部署，因此普通维护不自动推送。
