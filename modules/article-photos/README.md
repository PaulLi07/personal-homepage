# 文章照片服务

Experience 学术日志和 Moments 生活文章共用照片处理、作者选图和阅读画廊。实际图片仍保存于各自集合的 `images/posts/`，服务不读取作者凭据、不发布到 GitHub，也不访问兄弟模块内部。网页组件全部为英文；文章照片属于公开内容。

## 文件与接入

- `photos.js`：普通脚本，提供 `Homepage.articlePhotos`。
- `styles.css`：仅影响 `article-photos` 与 `article-photo-picker` 前缀组件。
- 服务由 `app/site.json` 登记，在作者与两个数据模块之前加载；编辑器、数据验证和读者通过下列 API 接入。

## API

| 接口 | 用途 |
|---|---|
| `normalize(photos, collectionId, entryId)` | 验证照片并复制允许字段；省略照片返回空数组，不修改原对象 |
| `pathFor(collectionId, entryId, batchId, index)` | 生成仓库根目录相对路径；集合为 `moments` 或 `experience` |
| `prepare(file, { signal })` | 本地解码和重绘，返回 `{ bytes: Uint8Array, blob: Blob, width, height }` |
| `renderGallery(host, photos, { collectionId, entryId?, signal? })` | 在文章容器内追加画廊，返回清理函数；省略标识时从首图路径推断并验证同文 |
| `createPicker({ host, collectionId, signal?, onChange? })` | 创建选图组件，返回 `getPhotos(entryId)`、`getFiles(entryId)`、`isPreparing()`、`setDisabled(bool)`、`dispose()` |
| `downloadBundle([{ path, bytes }], name)` | 下载不压缩的 ZIP，保留仓库相对路径并计算 CRC32；返回 Blob 供测试 |

照片数组至多 6 张，每项为 `{ src, alt, caption? }`。`alt` 非空、最长 300 字符，`caption` 可选、最长 600 字符；编辑时提示使用英文。额外字段被剥除，文字通过 `textContent` 或文本输入值处理，不解释 HTML。

路径仅允许 `modules/life/moments/images/posts/<entryId>/<24位小写hex>-<1..6>.jpg`，或 Experience 对应的 `modules/academic/experience/` 路径。同篇图片可以使用不同批次，但不允许重复路径、跨集合、跨文章、绝对地址、路径遍历、查询参数或片段。文章标识沿用小写字母、数字与连字符规则，最多 80 字符，`author` 保留。当前不支持手工 PNG/WebP 路径；这些格式只能作为上传输入，处理后统一生成 JPEG。

## 处理与生命周期

原图只接受 MIME 与文件头相符的 JPEG、PNG、WebP，每张最多 10 MiB。处理先解析尺寸并拒绝超过 4000 万像素的图片，再通过各浏览器原生图片解码和 canvas 重绘移除原文件元数据。部分浏览器编码器会重新加入 APP1/APP13，输出随后严格解析 JPEG 标记，明确剥除可承载 EXIF/XMP 的 APP1 与可承载 IPTC 的 APP13。ICC 色彩信息所在 APP2、压缩像素扫描及重启标记原样保留；支持多扫描，截断或非法段长度直接拒绝。返回的字节与 Blob 均由过滤后内容生成。

透明区域使用白底；输出长边最多 1920 像素，每张 JPEG 最多 2 MiB。选图组件额外限制输出合计最多 8 MiB，超限或某张失败时回滚本次选择，已选照片保留。

组件支持追加、预览、英文替代文本与可选说明、删除、上下排序。每个实例随机生成 12 字节批次标识，实际保存路径由当前文章标识和排列顺序确定。`getPhotos` 在处理尚未结束、文章标识无效或替代文本未填写时抛错；`getFiles` 同时验证并返回 `[{ path, bytes }]`。字节归组件持有，调用方不能修改；发布和下载期间禁用组件，完成读取后才销毁。

`onChange` 接收 `{ count, preparing, totalBytes }`，在开始处理、完成处理和编辑变化时通知作者组件；作者组件据此禁用发布、下载，并通过 `setDisabled` 控制忙碌状态。选图 input 不设 `name`，按钮均为 `type="button"`，可置于统一编辑器表单。没有配置作者权限或没有真实文章时不创建示例照片。

`AbortSignal` 取消处理与事件监听。关闭、切换或退出时调用 `dispose()`，释放全部预览 object URL、清空输入和字节引用；`prepare` 也会释放临时解码 URL 与 canvas。JPEG 已被重绘仍属于公开图片，使用前应自行确认画面内没有不希望公开的资料。

ZIP 使用标准 store 格式、UTF-8 标识及逐文件 CRC32，无第三方依赖。它拒绝绝对路径、隐藏目录、空路径段、重复路径和路径遍历；归档字节总量最多 16 MiB。把 ZIP 内容按内部路径放回仓库根目录，保留两集合独立。

## 验证

2026-10-10 独立服务已在 Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5 的 1440×900、390×844、320×780 模拟视口实测通过：JPEG/PNG/WebP 解码与 JPEG 输出、4000×1000 原图缩为 1920×480、MIME 不符与 10 MiB/4000 万像素拒绝、处理前和处理中取消、路径与字段白名单、替代文本、7 张拒绝、排序删除及键盘焦点、禁用状态、无水平溢出、画廊纯文字说明、ZIP 的准确路径/内容/CRC32，以及销毁后的字节清空和 URL 释放。ZIP 另用 Python 标准库读取并检查 CRC32。

8 MiB 总量另在 Chromium 桌面实测：5 张各 1958972 字节的处理结果触发超限，整批回滚、保留之前照片并释放全部新预览 URL。此高熵夹具未在另外两内核重复。

完整页面测试发现 WebKit canvas 编码器会新增 APP1/APP13；补充输出过滤后，三内核的 2400×1000 PNG→1920×800 JPEG 独立复测通过：APP1/APP13 不再存在，ICC APP2 保留，返回 Blob 与字节一致，过滤后图片可正常解码且以 FFD9 结束。三内核还实际拒绝截断、非法段长度与 EOI 后尾随数据；离线标记夹具验证多 SOS、FF00 转义、重启/TEM、ICC 与扫描字节不变。

完整页面另由 `npm run test:photos` 在三内核、三视口通过 207 个流程，包含各环境的 8 MiB 高熵回滚、图库实际加载、ZIP 和模拟 Git 原子发布，证据见 [照片记录](../../docs/modules/article-photos.md)；本文件的独立测试不能代替发布流程验证。未测试手机真机、品牌浏览器其他版本及真实照片发布。自动测试使用临时照片夹具，不访问真实作者凭据，也不创建正式文章或照片。
