# 文章 PDF 附件兼容性测试记录

- 就近说明：[模块 README](../../modules/article-documents/README.md)。
- 使用者：Experience 与 Moments 的数据、读者、统一编辑器及发布器；服务不占首页分区。
- 日期：2026-10-10；布局为 Playwright 模拟视口，真实 API 写入 0。

## 浏览器与结果

Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5 各在 1440×900、390×844、320×780 实测通过。完整页面命令 `npm run test:photos`，33 流程/环境、合计 297；PDF-only 和照片/PDF 混合发布逐集合验证，具体证据见 [照片与附件发布记录](article-photos.md)。

独立组件在相同九环境验证原字节及 Blob、MIME/头尾/超限拒绝、读取前/中止、字段白名单、受控路径、3/4 项边界、损坏混批回滚、默认与必填标题、键盘排序删除焦点、禁用销毁、纯文本阅读链接和窄屏无水平溢出。未自动请求 PDF、没有 iframe；链接为新标签打开与受控文件名下载。

Chromium 桌面另验恰好 10 MiB PDF 的原字节保留、三份合计 30 MiB、混合 ZIP 内容恰好 52 MiB 接受及超 1 字节拒绝，并独立以 Python 核对 ZIP CRC；大文件边界未在另两内核重复。完整页面实际核对两集合 PDF 字段和新 blob 原字节、ZIP CRC/路径、旧附件保留、失败/401 草稿、事务和取消。

已查看 `artifacts/screenshots/photos-1440-pdf-reader.png` 与 `photos-390-pdf-picker.png`，英文标题、大小、排序删除及打开下载控件正常。正式配置、文章、密文保持原字节；临时图片、PDF 和凭据不写入源码、不打包。

未测试：手机真机、品牌/历史浏览器、线上附件发布和真实浏览器 PDF 阅读器的渲染。仅验证基本边界，不宣称完整 PDF 格式有效或已安全扫描；PDF 原字节与元数据保留。

## 发布 API 大文件离线边界

2026-10-10 北京时间 16:25，Node.js v25.8.0（macOS arm64）读取当前会话源码，以随机密码、真实 Web Crypto、内存存储和模拟 fetch 完成 8 项独立断言。Experience/Moments 分别取得合法 head/base 后，恰好 10 MiB 的 Base64 blob 到达模拟接口并逐字节解码一致，没有正则或栈错误；10 MiB+1 字节在 fetch 前拒绝；本次 10 MiB blob 作为受控 PDF 新树条目通过，同一大 blob 改用 JPG 路径在 fetch 前拒绝。共 12 次模拟请求，真实网络和写入 0，源码未改。报告 `artifacts/author-blob-boundary-results.json` 不交付；该结果不增加 297 个浏览器流程或原离线会话 21 项的计数。
