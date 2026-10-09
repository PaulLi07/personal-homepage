# 共享能力

本目录只保存多个功能实际使用的能力。单模块内容、样式、图片与业务行为留在自己的模块；新增共享能力需写清接口、使用者并回归相关功能，不能把本目录作为杂物存放处。

| 文件或目录 | 入口与职责 | 使用者 |
|---|---|---|
| `runtime.js` | `Homepage.registerSection`、`registerDetail` 及注册查询 | 所有首页分区、学术与生活详情、胶水 |
| `base.css`、`favicon.svg` | 基础变量、常规字体、基础控件与图标 | 首页及署名页 |
| `navigation/` | `view.html`、`styles.css`；`createNavigation({ root, sections })` | 首页各公共分区 |
| `details/` | `view.html`、`styles.css`；`createDetails({ dialog, content, groups, transitions })` | 学术与生活详情 |
| `transitions/` | `styles.css`；`createTransitions(reducedMotion)` | 首页开场与共用详情 |
| `reveal.js` | `initReveals(roots)`，管理传入根节点内的进入动画 | 各分区及胶水 |

仅使用单一 `window.Homepage` 接口。胶水负责创建共享服务和传入公共节点；模块使用 `{ root, details, reducedMotion }`，在自己的根节点内查询，通过 `details.open`、`onSelect`、`getItem` 使用登记内容。导航和进入动画只接收公共根节点，不能读取模块的私有内容结构。

修改共享注册、选择器或服务行为时同步 [框架概要](../docs/ARCHITECTURE.md)，回归首页、学术、生活和相关署名页面，在受影响模块的测试记录中写明证据。共享层说明中文，所有呈现给网页访客的文字英文。
