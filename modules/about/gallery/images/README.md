# 简介相册素材

本目录由 About 相册独立维护，不在运行时引用 Life 模块的图片路径。清单见上一级 `photos.js`；全部网页替代文本与署名使用英文。

| 文件 | 来源与用途 | 尺寸 / 字节数 | SHA256 |
|---|---|---|---|
| `portrait-landscape.jpg` | 用户现有人像的网页缩放副本，首张正式照片；仅标注用户提供，不推断摄影者、地点或被摄者身份 | 1920×1280 / 301619 | `d691bc4f4de12394682e4a3972e3ec33c9458856d2167a9b83b3d5a58f78d630` |
| `misty-lake.jpg` | 已下载 `modules/life/creations/images/cover.jpg` 的原字节副本；[Kalen Emsley / Unsplash](https://unsplash.com/@kalenemsley)，作为待替换占位图 | 1000×667 / 139023 | `8d99643f647d50b85583d527d9d1fcdc1e67f2928394c3f266c395cb02433dd4` |
| `coastal-cliffs.jpg` | 已下载 `modules/life/travels/images/cover.jpg` 的原字节副本；[Benjamin Chambon / Unsplash](https://unsplash.com/photos/rocky-cliffs-meet-the-oceans-frothy-waves-YRu3lLu4n-k)，作为待替换占位图 | 1000×1500 / 465326 | `6911ece43399f09900c96af5f2f3e174c92889a5d61db22ed7627f7eea5e443e` |

## 人像原图保护

- 原图仍在 `modules/about/images/portrait.JPG`（现有仓库登记名为 `portrait.jpg`），6240×4160、9570445 字节；本次不改名、不覆盖、不暂存原图。
- 原图 SHA256 保持 `cc79adfc8573183f58116111bd72326688404b3306a9c07ad4d05b732de66635`。
- 首图仅按原始 3:2 构图等比缩小至 1920×1280，JPEG 质量设置为 86；没有生成、补画或修改画面。缩放副本移除 EXIF、XMP、IPTC 与注释等元数据，保留 ICC 色彩配置；原图保持原字节。
- 两张风景没有再次下载或重编码，保持已有素材副本的原字节。海岸源图为竖幅，清单使用 `position: "50% 50%"` 在相册横框内展示中部海湾；原文件不裁切。

## 后续换图

1. 在本目录替换或添加确认可公开的图片，横向构图优先；不要直接上传含隐私元数据的个人原图。
2. 同步 `photos.js` 的 `src`、实际 `width` / `height`、英文 `alt`、`credit`、`placeholder` 和可选裁切位置。
3. 用 `shasum -a 256` 重新计算图片散列，`src` 的 `?v=` 使用 SHA256 前 12 位。首张变更还需同步 About 片段中的静态回退图片。
4. 更新本表、全站素材来源与英文署名页，再装配并实测桌面、手机画幅及粒子排除边界。

2026-10-23 本次素材检查：人工查看三张照片；首图实际输出为 1920×1280，检查了 JPEG 元数据段，原图散列与两张占位副本散列均核对一致。浏览器交互与兼容性结果由 About 模块的本轮记录统一登记；上述文件检查不替代浏览器实测。
