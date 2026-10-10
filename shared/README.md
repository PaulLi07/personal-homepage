# 共享能力

本目录只保存多个功能实际使用的能力。单模块内容、样式、图片与业务行为留在自己的模块；新增共享能力需写清接口、使用者并回归相关功能，不能把本目录作为杂物存放处。

| 文件或目录 | 入口与职责 | 使用者 |
|---|---|---|
| `runtime.js` | `registerSection`、`registerDetail`、`registerDetailView`、`registerData` / `getData` 及注册查询 | 分区、普通及自定义详情、胶水 |
| `base.css`、`favicon.svg` | 基础变量、常规字体、基础控件与图标 | 首页及署名页 |
| `navigation/` | `view.html`、`styles.css`；`createNavigation({ root, sections })` | 首页各公共分区 |
| `details/` | `view.html`、`styles.css`；`createDetails({ dialog, content, views, groups, transitions })` | 学术、旅行、创作、Moments 博客与 Relationship |
| `transitions/` | `styles.css`；`createTransitions(reducedMotion)` | 首页开场与共用详情 |
| `reveal.js` | `initReveals(roots)`，管理传入根节点内的进入动画 | 各分区及胶水 |

仅使用单一 `window.Homepage` 接口。胶水负责创建共享服务和传入公共节点；模块使用 `{ root, details, reducedMotion }`，在自己的根节点内查询，通过 `details.open`、`onSelect`、`getItem` 使用登记内容。导航和进入动画只接收公共根节点，不能读取模块的私有内容结构。

`registerDetailView(group, key, { render })` 为栏目登记自定义视图。服务提供 `{ host, route, signal, navigate }`，管理同一弹窗内的嵌套路由、历史与焦点；渲染器只操作自己的 `host`，可返回幂等清理函数（允许重复调用）。关闭、切换或重新渲染时终止所属生命周期，模块负责清除监听、异步结果及内存秘密。Moments 的列表、正文和作者入口使用 `#life/moments`、`#life/moments/<slug>`、`#life/moments/author`。

`registerData(key, value)` / `getData(key)` 只保存命名空间数据，模块定义自己的 getter 和格式校验。共享层不解释文章 JSON、GitHub PAT、身份或仓库授权、密码、AES-GCM 密文；这些业务分别属于 Moments 或 Relationship。胶水只传 `views`，不加入作者或解密逻辑，也不绑定模块内部图片。

当前栏目为 Experience / Publications / Notes / Projects 与 Moments / Travels / Creations / Relationship。2026-10-10 自定义详情、嵌套路由、焦点与关闭清理已在三个内核、三个视口实测，证据和模拟边界见 [兼容性记录](../docs/COMPATIBILITY.md)。共享服务修改仍须回归所有使用者。

修改共享注册、选择器或服务行为时同步 [框架概要](../docs/ARCHITECTURE.md)，回归首页、学术、生活和相关署名页面，在受影响模块的测试记录中写明证据。共享层说明中文，所有呈现给网页访客的文字英文。
