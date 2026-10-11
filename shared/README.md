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

`registerDetailView(group, key, { render })` 为栏目登记自定义视图。服务提供 `{ host, route, signal, navigate }`，管理同一弹窗内的嵌套路由、历史与焦点；渲染器只操作自己的 `host`，可返回幂等清理函数（允许重复调用）。关闭、切换或重新渲染时终止视图生命周期，模块清除监听、DOM、输入及异步结果。Experience 与 Moments 分别使用栏目根列表、`/<slug>` 正文、`/author` 工作台。

`registerData(key, value)` / `getData(key)` 只保存命名空间数据，模块定义自己的 getter 和格式校验。共享层不解释日志 / 文章 JSON、GitHub PAT、身份或仓库授权、密码、AES-GCM 密文；集合业务属于 Experience / Moments，作者会话和编辑器属于独立 `modules/author/` 服务，解密属于 Relationship。胶水只传 `views`，不加入业务或绑定模块内部图片。

按用户要求，统一作者服务通过清单 `services` 装配，提供 `Homepage.authorSession` 和通用编辑器，不占用页面根节点。当前页面会话跨两栏及详情关闭保持；Sign out、刷新或页面离开清内存，Forget 删除加密连接缓存。作者服务自行管理可选加密 localStorage 与刷新密码恢复 / GitHub 重验；共享弹窗只清理视图，不代它退出。Relationship 明文仍随关闭或切换清理。

当前栏目为 Experience / Publications / Notes / Projects 与 Moments / Travels / Creations / Relationship。2026-10-10 自定义详情、嵌套路由、焦点与关闭清理已在三个内核、三个视口实测，证据和模拟边界见 [兼容性记录](../docs/COMPATIBILITY.md)。共享服务修改仍须回归所有使用者。

本次统一作者与学术日志的接口、实际环境与结果见 [author 记录](../docs/modules/author.md)。测试采用随机临时密码、令牌、双集合与全模拟 GitHub，不使用用户真实秘密或执行远端写入。

导航在 `view.html` 声明公开 `data-particle-exclude`，使粒子服务保守避让它的可见外包矩形；共享导航不读取粒子状态或负责绘制。黑色区域与前景属性由对应模块声明，接口见 [粒子说明](../modules/particle-background/README.md)。涉及图片排除或导航位置时，须回归滚动、键盘焦点、手机布局和减少动态效果。

导航样式公开 `--navigation-height`：桌面 110px、宽度 ≤760 时 105px、≤400 时 122px，导航自身的最小高度使用同一值。Life 用此公共变量设置锚点滚动留白，不查询导航内部结构。修改高度或断点时须真实点击导航并检查标题与相框顶线，不以只检查 hash 或元素 `isVisible` 代替无遮挡验证。

常驻本地预览没有自动热更新。装配后须重新加载用户实际查看的标签，确认资源内容版本 URL 与当前布局；独立浏览器通过不能证明旧标签已经更新。2026-10-11 修正证据见 [兼容性记录](../docs/COMPATIBILITY.md)。

2026-10-11 缓存与导航修复已在三内核的 24 个正常导航场景和原三视口基础兼容性中通过；旧 431 像素 CSS 夹具可复现遮挡，修复后通过。粒子及作者装配回归亦通过，实际时间、范围与限制见 [粒子记录](../docs/modules/particle-background.md)及[兼容性总记录](../docs/COMPATIBILITY.md)。

修改共享注册、选择器或服务行为时同步 [框架概要](../docs/ARCHITECTURE.md)，回归首页、学术、生活和相关署名页面，在受影响模块的测试记录中写明证据。共享层说明中文，所有呈现给网页访客的文字英文。
