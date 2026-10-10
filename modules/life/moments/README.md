# 生活片段与博客

`Moments` 保存个人生活文章及可选附图，访客从 `#life/moments` 查看列表，从 `#life/moments/<slug>` 阅读文章；封面目前使用风景占位图。没有用户文章时显示英文空状态，不创建示例文章或测试图片记录。

## 文件与边界

| 文件 | 职责 |
|---|---|
| `content.js` | 栏目介绍、封面、英文替代文本与素材来源，通过 `registerDetail` 注册 |
| `posts.js` | 已发布英文文章，以 `Homepage.registerBlogPosts([...])` 注册；当前为空数组 |
| `blog.js` | 博客列表、文章与未找到状态的独立渲染工厂 |
| `blog.css` | 本模块博客样式，选择器统一使用 `moments-blog` 前缀 |
| `data.js` | 文章字段验证及自有数据 getter |
| `modules/author/` | 通过公开接口共用密码登录、GitHub 连接和编辑器；不归 Moments 私有 |
| `integration.js` | 连接共享详情服务与读者、作者视图，响应路由和卸载 |
| `images/cover.jpg` | 本栏目可独立替换的封面 |
| `images/posts/<slug>/` | 当前文章的公开附图，仅在提供真实照片时创建 |

模块只操作传入的 `host`，不读取兄弟模块内部，不创建另一套弹窗，不直接修改浏览器路由。路由、详情外壳和作者认证由胶水与对应服务提供。

## 渲染接口

`Homepage.createBlogView({ posts, onNavigate, onAuthorRequested })` 返回 `{ render({ host, route, signal }) }`。

- `posts`：文章数组或同步返回文章数组的函数；每次渲染重新读取，便于发布后更新。
- `onNavigate(slug | null)`：进入文章或返回列表；胶水负责更新 `#life/moments/<slug>` 并再次渲染。
- `onAuthorRequested()`：请求作者入口；未传回调时不显示 `Author sign in` 按钮。按钮带有 `data-blog-author` 标记。
- `host`：本模块自己的 DOM 容器。`route` 为文章标识或 `null`，空字符串也按列表处理。
- `signal`：所属详情生命周期的 `AbortSignal`。关闭或切换栏目时取消监听；连续渲染还会自动取消上一轮按钮监听。

正文、标题、摘要及作者均通过 `textContent` 写入。正文保留换行，不解释 HTML 或 Markdown。列表按日期倒序显示；无效标识显示英文返回入口；数据读取异常显示暂不可用状态。

单篇正文后通过独立服务 `Homepage.articlePhotos.renderGallery()` 展示附图，传入集合标识、当前文章标识和生命周期信号；照片保持原比例、延迟加载、异步解码，英文说明按纯文本呈现。图库的样式、失败提示及监听清理由服务负责；无附图时不增加图片区，列表不额外添加缩略图。

## 文章数据与维护

每篇文章格式为 `{ id, title, date, excerpt, body, author, photos? }`，所有网页文字使用英文；`author` 为 `Yuhong Li`。`id` 使用小写字母、数字和单个连字符分段，例如 `first-post`；`author` 保留给作者入口，不能作为文章标识。日期为有效的 `YYYY-MM-DD`，界面以英文长日期显示。标题、摘要和正文均非空；标题最多 160 字符，地址最多 80 字符，摘要最多 600 字符，正文最多 50000 字符；文章数组最多 500 篇，在线发布文件另有 900000 字节上限。正文用普通文本和换行分段。

可选 `photos` 省略或使用空数组，最多 6 张；每张只保留 `{ src, alt, caption? }`。`alt` 必须是非空英文替代文本，最多 300 字符；可选英文说明 `caption` 最多 600 字符。`src` 只接受 `modules/life/moments/images/posts/<当前文章 id>/<24 位小写十六进制标识>-<1 至 6>.jpg`，禁止外链、其他文章或栏目以及路径穿越。

`validateBlogPosts(posts)` 合法时返回原数组，非法时抛错；`normalizeBlogPosts(posts)` 返回白名单字段的新数组。存在 `photos` 时调用 `Homepage.articlePhotos.normalize(photos, "moments", post.id)` 校验并归一化，不存在时不新增字段，保持纯文字旧文章兼容。

文章由作者工作区提交到远端 `posts.js`；如直接维护源码，仅填入用户提供的真实文章。标识应保持稳定，避免既有文章链接失效。渲染层防止无效日期、重复标识或缺失字段中断界面；发布端还应验证数据，不能把渲染过滤视为认证或发布权限检查。

替换封面时同步 `content.js` 的英文替代文本与来源，以及父区入口和素材署名。结构或接口改变时同步模块测试记录和框架说明。

## 验证

[测试记录](../../../docs/modules/life-moments.md)记录实际浏览器、视口、结果及未覆盖项。统一作者入口调用 `Homepage.createAuthorEditor({ collection, onPublished, onCancel })`，集合契约仅声明本模块的 `posts.js`、`registerBlogPosts`、getter 与规范化函数。密码登录、加密连接缓存与发布实现统一归 `modules/author/`；关闭栏目只卸载视图，`Sign out` 才退出共享登录。密码解锁后可编辑；首次在线发布须连接 GitHub，勾选记住连接后以后同浏览器只需密码。

集成后需检查空列表、真实文章列表和正文、文章直达、刷新及前进后退、无效标识、返回列表、键盘和焦点、手机窄屏、减少动态效果、异常数据与作者入口。

附图后续维护继续回归无图旧文、张数限制、英文说明、路径、加载、手机原比例布局和关闭清理。2026-10-10 的 `test:photos` 在三内核三视口通过，共 207 个流程；实际范围见 [照片记录](../../../docs/modules/article-photos.md)，此前文字结果不能替代未来附图验证。正式 `posts.js` 仍为空数组，测试图片和文章不得进入公开资料。

2026-10-10 已在 Chromium、Firefox、WebKit 的桌面及两个手机宽度完成独立工厂和完整页面集成测试，覆盖列表、正文、嵌套路由、键盘、焦点、身份拒绝、模拟发布冲突与成功、视图卸载和纯文本安全。真实 GitHub 令牌与线上部署未测试，详见测试记录。模块工厂支持传入临时测试数据；测试完成后不得将测试文章写入正式 `posts.js`。

文章维护与发布步骤见 [博客发布说明](../../../docs/BLOG-PUBLISHING.md)。
