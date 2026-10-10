# 文章 PDF 附件服务

Experience 与 Moments 共用附件校验、作者选择列表和读者下载入口。PDF 文件仍保存在所属集合的 `documents/posts/<文章标识>/`，不建立集中附件目录。服务不读取作者凭据、不调用 GitHub、不自行发布文件，不内嵌或执行 PDF。

## 文件与 API

- `documents.js`：普通脚本，提供 `Homepage.articleDocuments`。
- `styles.css`：只影响 `article-documents` 与 `article-document-picker` 前缀组件。
- 项目清单在作者和两集合数据模块前加载服务；作者编辑器、发布器与读者通过公开 API 接入。

| 接口 | 职责 |
|---|---|
| `normalize(attachments, collectionId, entryId)` | 验证数组并复制 `src`、`title`、`size`；省略时返回空数组 |
| `pathFor(collectionId, entryId, batchId, index)` | 验证参数并生成仓库相对路径；集合为 `moments` 或 `experience`，序号为 1–3 |
| `validateBytes(bytes)` | 合法返回同一 Uint8Array，非法抛英文错误；供准备与发布共用 |
| `prepare(file, { signal })` | 验证原 PDF，返回 `{ bytes: Uint8Array, blob: Blob }`，不修改原字节 |
| `createPicker({ host, collectionId, signal?, onChange? })` | 选择组件，返回 `getAttachments(entryId)`、`getFiles(entryId)`、`isPreparing()`、`setDisabled(bool)`、`dispose()` |
| `renderAttachments(host, attachments, { collectionId, entryId, signal? })` | 在文章末尾追加受控链接列表并返回清理函数 |

附件数组最多 3 项，格式为 `{ src, title, size }`。标题非空、最多 160 字符，编辑提示使用英文；字节大小为正整数，每份最多 10 MiB，合计最多 30 MiB。未知字段被剥除，标题仅通过文本节点呈现。旧文章省略 `attachments` 时兼容为空附件。

路径仅允许 `modules/life/moments/documents/posts/<entryId>/<24位小写hex>-<1..3>.pdf` 或 Experience 对应的 `modules/academic/experience/` 路径。拒绝重复、跨集合、跨文章、绝对 URL、路径遍历、查询参数和片段。文章标识沿用小写字母、数字、单连字符分段规则，最多 80 字符，`author` 保留。

## 文件处理与边界

输入 MIME 必须为 `application/pdf`。`validateBytes` 检查正长度与 10 MiB 上限，头部为 `%PDF-1.x` 或 `%PDF-2.x` 并跟随空白，尾部为 `%%EOF`，允许尾随 ASCII 空白。校验不解析 PDF 对象、交叉引用表、脚本、链接或加密结构，**不等于完整 PDF 语法验证或安全扫描**。发布服务复用相同字节检查，并另行验证字段大小与上传字节一致。

PDF 原文件字节和元数据完整保留，与照片重绘去元数据的行为不同。作者应自行确认文件内容和元数据适合公开。组件只显示 Document 序号、文件大小、英文标题输入和排序删除按钮，不创建 iframe、canvas 或 PDF 预览 object URL，也不自动打开或请求 PDF。

读者看到 PDF 标识、大小、`Open PDF` 和 `Download PDF`。两链接来自经过验证的路径并使用 `noopener noreferrer`；打开链接进入新标签，下载链接提供受控文件名。它们不依赖外部 PDF 查看器库。标题默认 `Document N`，用户可以改为更清楚的英文名称。

## 生命周期与下载接入

组件 `onChange` 接收 `{ count, preparing, totalBytes }`，在准备开始/完成及标题、顺序、删除变化时通知作者。处理期间 getter 抛错，发布和下载需禁用；`setDisabled` 同时控制选文件、标题和按钮。file input 不设 `name`，全部按钮为 `type="button"`，可放在统一作者表单。排序或删除后恢复到对应按钮或邻近控件，首次渲染不抢焦点。

一次选择任一 PDF 失败时整批回滚，保留此前附件。`getAttachments` 与 `getFiles` 同序，后者返回 `[{ path, bytes }]`；字节由组件持有，调用方不能修改，读取完成后再销毁。关闭、切换、退出或 AbortSignal 调用 `dispose()`，取消监听和读取、清空标题与字节引用并移除组件。

混合文件的 ZIP 由 `Homepage.articlePhotos.downloadBundle` 接收照片、PDF 与当前集合数据；PDF 原字节直接保存，仓库相对路径不变。本服务不读取照片模块内部，不管理发布事务或合并其他集合。

## 测试

2026-10-10 独立组件已在 Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5 的 1440×900、390×844、320×780 模拟视口实测通过：PDF 原字节与 Blob 相同、MIME/头尾/大小拒绝、读取前及读取中取消、字段白名单与受控路径、3 项接受/4 项整批拒绝、合法与损坏混选回滚并保留旧附件、默认及必填标题、排序删除的键盘焦点、禁用和销毁、无内嵌阅读器及自动请求、两个受控链接、纯文本标题与窄屏无水平溢出。照片与 PDF 组件同页时也完成了 9 张照片选择和生命周期验证。

Chromium 桌面另测恰好 10 MiB 原 PDF 字节保留与 3 项合计 30 MiB 边界通过；这些大文件边界未在另外两内核重复。完整页面及混合 ZIP/模拟发布由集成测试验证；未测试手机真机、品牌浏览器其他版本、完整 PDF 安全扫描或真实附件发布。测试只使用临时夹具，不读取真实作者密码、令牌、附件或浏览器数据，不执行真实远端写入。
