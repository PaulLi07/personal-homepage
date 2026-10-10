# 统一作者服务

Moments 与 Experience 共用作者登录和 GitHub 连接。作者密码用于解锁工作台；首次发布仍需用户在自己浏览器输入具备目标仓库 Contents 读写权限的 GitHub PAT。关闭详情或切换栏目保持当前会话，主动 `Sign out` 或页面离开时清除内存凭据。

## 文件与接口

- `config.js`：登记 `Homepage.authorConfig`，仅含版本、600000 次迭代、16 字节盐、32 字节校验值及固定仓库身份；不含密码和令牌。
- `session.js`：提供共享单例 `Homepage.authorSession`，不操作栏目 DOM，也不自行发布文章。
- `editor.js`：`createAuthorEditor({ collection, onPublished, onCancel })` 创建共用表单；只接受 Moments 或 Experience 的固定集合契约，调用照片服务与发布器，管理草稿和状态。
- `publisher.js`：`createAuthorPublisher(collection)` 独立解析远端纯 JSON 登记、归一化、合并与发布；返回 `sourceFor`、`merge`、`publish`。
- `styles.css`：工作台布局、表单与连接状态样式；实际文章、经历数据仍由其所属模块维护。
- `modules/article-photos/`：独立照片规范、重绘、选图、图库与 ZIP 服务，作者通过 `Homepage.articlePhotos` 接入，不在编辑器复制这些实现。

`authorSession` 的 `isUnlocked()`、`isConnected()` 返回当前状态；`unlock(password, { signal })`、`connect(token, { remember, signal })` 与 `request(path, { method, body, signal })` 返回 Promise。`signOut()` 清除内存密钥、连接与解锁状态，保留用户选择保存的密文；`forgetConnection()` 删除密文和当前令牌，保留工作台解锁状态。

`subscribe(callback)` 立即通知一次，返回取消订阅函数。回调接收 `{ unlocked, connected, remembered, restoreError, event? }`；状态不包含凭据。成功解锁完成缓存恢复与身份重验后统一通知，缓存损坏或连接失效时保持已解锁、未连接，提示重新连接。视图卸载只取消自己的订阅与请求，不退出共享会话。解锁、连接、退出、忘记连接通过代次和 AbortController 阻止取消后的异步结果重新激活会话。

已连接请求返回 HTTP 401 时清除内存令牌并取消其他挂起请求，保留解锁与加密缓存，通知 `connection-expired`；编辑器应保留草稿并重新显示连接表单。忘记连接时若浏览器拒绝删除存储，状态保留 `remembered: true` 并返回 `restoreError`，界面不能声称删除成功。

口令维护工具为 `tools/configure.py`，交互终端运行 `npm run author:password`，隐藏输入并确认新口令后只写随机盐和校验值。修改后装配、检查并上传，旧浏览器连接需清除后重新连接。

`createAuthorEditor({ collection, onPublished, onCancel })` 接收当前集合的标识、发布文件路径、登记函数、getter、规范化函数与可选扩展字段，返回可卸载的 `render({ host, signal })`。编辑器只允许 Experience 与 Moments 的两条固定路径；订阅连接变化不重建草稿，离开时清输入与视图，不退出共享会话。

`createAuthorPublisher(collection).publish(entry, { files, signal, onProgress })` 接收规范记录及处理后的 `[{ path, bytes }]`，返回合并后的集合记录；`sourceFor` 和 `merge` 也用于手动下载。表单不解释 Git 对象流程，发布器不操作编辑器 DOM；照片服务不访问凭据或发布 GitHub。

## 密码与浏览器连接

作者校验使用 PBKDF2-SHA256 600000 次派生 256 位校验值，逐字节固定长度比较。明文密码不写文件、URL、日志、localStorage 或 sessionStorage，也不保留于共享会话。公开校验值允许离线尝试密码，配置时应使用足够强且独立的口令。

勾选 `Remember encrypted connection in this browser` 后，仅在当前浏览器的单一 localStorage 项 `personal-homepage:author-connection:v1` 保存令牌密文。密钥采用独立域的 PBKDF2-SHA256 600000 次派生，再导入不可导出的 HKDF 主密钥；每次保存使用新的 16 字节随机盐，通过 HKDF-SHA256 派生不可导出的 AES-GCM 256 位密钥，并使用新的 12 字节 IV。公开密码校验值不作为令牌密钥。密文用固定域与仓库身份作为附加认证数据；刷新后仍须输入作者密码，解密后再次请求 GitHub 校验身份与权限。未选择记住浏览器时删除先前缓存，只保留本次内存连接。

令牌加密缓存属于作者的浏览器，不进入公开仓库或源码包。相同源下恶意脚本、被控制的浏览器或弱密码会损害这个边界；静态前端密码门不能替代 GitHub 的真实服务端权限。Relationship 的私密正文采用自己的独立加密口令，不由作者登录密码自动解锁。

## GitHub 请求边界

连接前通过闭包内请求验证 `/user` 的账号为 `PaulLi07`，目标仓库所有者相符且 `permissions.push === true`。只有成功解锁且已验证连接的会话可以使用公开 `request()`；真正的令牌有效性和写权限由 GitHub 每次请求校验。

无图流程允许 GET 当前用户、固定仓库及以下两个 Contents 文件，读取 `main`；PUT 必须提供当前 SHA、Base64 内容、提交说明和 `branch: "main"`。带图流程额外允许固定仓库的 `main` ref 与指定 commit 读取（从中取得 tree SHA）、按 head SHA 读取对应数据，以及受控的 blobs / trees / commits 创建与 main ref 更新。tree 写入限定当前集合数据文件及所属 `images/posts/` 目录；禁止任意 URL、其他仓库或分支、删除及强制更新。

- `modules/life/moments/posts.js`
- `modules/academic/experience/entries.js`

界面必须由用户主动点击发布才写 GitHub。无图保持 Contents GET / PUT；带图先取得 `main` head 与对应 commit 中的 tree SHA，按 `?ref=head` 读取同版数据，再 POST 照片及数据 blobs、`base_tree` 的 tree、`parents: [head]` 的 commit，最后 PATCH `main` 且 `force: false`。照片与数据在同一次可见提交出现；并发冲突保留草稿，未更新 main 的 Git 对象不会作为网页文章出现。原 Contents 读写 PAT 可继续使用，无需重新授权。

会话按同一次发布绑定 head、基树、本次上传的 blob、新树与新 commit。请求不能指定外部基树、未上传的 blob、其他树或 commit；仅验证 SHA 格式和 `force: false` 无法限制文件范围。失败、取消、重新获取 head 或授权失效时丢弃旧流程状态，重试重新读取版本。

发布器保留已有记录及合法附图，远端只做 JSON 解析和白名单归一化，正文与图片说明不作为 HTML。退出或取消不能撤销 GitHub 已接受的提交，不确定结果先核对仓库再重试；会话服务只管身份、请求与凭据生命周期。

## 公开照片与手动下载

每篇最多 6 张 JPEG、PNG、WebP，输入每张最多 10 MiB。照片服务解码、重绘移除原文件元数据，输出长边最多 1920 像素、每张最多 2 MiB、总计最多 8 MiB 的 JPEG。填写非空英文 alt（最多 300 字符）与可选英文 caption（最多 600 字符），规范路径为当前文章的 `images/posts/<id>/<24位小写十六进制标识>-<1..6>.jpg`。选图组件处理预览、排序、删除与关闭清理，私密 Relationship 不接入。

`Download update` 按当前页面记录合并草稿，无图仍导出集合 JS；有图调用独立照片服务生成数据及新照片 ZIP，内部目录相对仓库根。解压内部内容到仓库根，不上传 ZIP 本身。下载不查询远端，也没有 SHA 冲突保护，手动上传前核对最新数据并保留其他文章与图片。

## 维护与测试

配置来源、编辑器入口和脚本顺序由项目清单管理。修改会话接口时同时回归 Moments 与 Experience 的登录、连接、关闭后复用、刷新恢复、退出、忘记连接、请求取消和远端版本冲突。测试只使用随机临时密码、模拟令牌及拦截的 GitHub 响应，不调用真实远端写入 API；实际浏览器结果登记在 `docs/modules/`，不能用静态或离线算法检查代替兼容性实测。

运行 `npm run test:author-security` 或 `node scripts/test-author-session.cjs` 可重复作者会话离线回归；脚本按自身路径读取 `session.js`，也可在其他目录用脚本绝对路径启动，不读取正式密码配置或真实令牌，不写正式文件或浏览器存储，也不访问网络。

2026-10-10 已在 Node.js v25.8.0 用真实 Web Crypto、内存存储与模拟 fetch 完成 21 项离线回归，覆盖独立解密互通、随机盐与 IV、错误身份及权限、缓存篡改、刷新恢复、请求白名单、退出与取消防迟到激活、存储失败回退、401 后保留解锁与重新连接、删除缓存失败状态；真实 GitHub 写入为 0。浏览器兼容性与编辑器接入由本轮对应实测记录说明，此算法结果不替代页面测试。

本轮已重新运行上述 21 项会话回归及原作者页面 144 流程并通过；新增 `npm run test:photos` 在三内核、三视口通过 207 流程，单独验证照片处理、ZIP、带图发布、事务请求边界、冲突、取消与原文字流程。具体环境及未覆盖项见 [作者记录](../../docs/modules/author.md) 和 [照片记录](../../docs/modules/article-photos.md)，不把模拟发布视为真实上线。
