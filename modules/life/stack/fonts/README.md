# Life 本地手写字体

用于拍立得入口的亮黄色花体标题、白色纸边上的黑色手写栏目字幕及照片堆下方的白色生活语录，仅在 Life 使用，不改变全站字体。资源于 2026-10-25 从 Google Fonts 官方分发下载，保留原始 WOFF2 字节；网页只引用本地相对路径，不访问 Google Fonts。

| 文件 | 字体与用途 | 样式 / 字重 | 字节数 |
|---|---|---|---:|
| `kaushan-script-latin.woff2` | Kaushan Script；黄色笔刷花体标题 | normal / 400 | 34,748 |
| `caveat-latin.woff2` | Caveat；白色纸边上的黑色手写栏目字幕、白色手写生活语录 | normal / 400 | 48,836 |

两份为官方 Latin 子集，适用于当前英文入口与语录；不含中文或所有语言字符。后续增加其他语言时应核对字符覆盖，不把系统字体回退误认为已包含。建议在所属样式中使用独立字体族别名、`font-display: swap` 与通用 `cursive` 回退；Kaushan Script 没有粗体文件，避免以额外粗体合成破坏笔触。

## 官方来源与许可

- [官方 CSS 分发声明](https://fonts.googleapis.com/css2?family=Caveat:wght@400&family=Kaushan+Script&display=swap)提供下面两个原始 WOFF2 地址。
- Kaushan Script：[原始 WOFF2](https://fonts.gstatic.com/s/kaushanscript/v19/vm8vdRfvXFLG3OLnsO15WYS5DG74wNI.woff2)、[官方字体元信息](https://raw.githubusercontent.com/google/fonts/main/ofl/kaushanscript/METADATA.pb)、[官方许可原文](https://raw.githubusercontent.com/google/fonts/main/ofl/kaushanscript/OFL.txt)。设计者 Impallari Type；版权署名为 Pablo Impallari、Igino Marini，保留字体名 Kaushan Script。完整原许可保存在 `Kaushan-Script-OFL.txt`。
- Caveat：[原始 WOFF2](https://fonts.gstatic.com/s/caveat/v23/WnznHAc5bAfYB2QRah7pcpNvOx-pjfJ9eIWpYQ.woff2)、[官方字体元信息](https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/METADATA.pb)、[官方许可原文](https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/OFL.txt)。设计者 Impallari Type；版权为 The Caveat Project Authors。完整原许可保存在 `Caveat-OFL.txt`。

两款均使用 SIL Open Font License 1.1，允许随网站嵌入和再分发，需同时保留版权及许可；不得单独出售字体。第三方许可文件按原文保留，中文说明不替代许可条款。

原许可含上游行尾空格；`.gitattributes` 仅对这两份许可保留原字节并豁免行尾空格检查，不改写许可。

## 完整性与维护

下载后核对 WOFF2 文件头 `wOF2`、许可标识及文件 SHA256。当前哈希如下：

| 文件 | SHA256 |
|---|---|
| `kaushan-script-latin.woff2` | `addcc80ddcc170ff8c97140ab37ac380ac4e6d0b8fd14e5d107b4cb87ffd778f` |
| `caveat-latin.woff2` | `d0b7b931b8980049327e8f8f9ac264617c8200b8422d62e886473d3d9527bad3` |
| `Kaushan-Script-OFL.txt` | `3336bf5d4e7eedba48ecb831f37bf676e901c39f2e6a422cceadd9d2ffa55be8` |
| `Caveat-OFL.txt` | `1f9d81d094273d82f3898a1ee8b598a717d050ecbf5ff7bede105b704880157b` |

更新字体时同步来源、许可、字节数与哈希；若下载地址变化，不以旧哈希证明新文件。字体显示与标题溢出见[模块测试记录](../../../../docs/modules/life.md)；字体加载失败回退本轮未专门实测。本资源下载检查本身不等同于浏览器兼容性通过。
