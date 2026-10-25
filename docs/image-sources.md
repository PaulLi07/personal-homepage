# 图片来源与替换说明

当前网页使用13个固定图片文件：10个下载占位图（包括About的两张独立副本）和3个用户提供图片的网页资源（首屏背景JPEG、简介人像缩放JPEG与联系区原始PNG），没有为本轮生成图片。下载占位图不是个人活动或研究记录；用户提供图的原作者与来源尚未确认，不能据此称为用户亲自拍摄。各功能独立维护图片，下列路径相对于网站根目录；不包含后续文章新增的附件。

| 模块中的文件 | 使用位置 | 来源与署名 | 建议替换内容 |
|---|---|---|---|
| `modules/home/images/hero-earth-window.jpg` | 首屏背景 | 用户提供的 `2153815987793690624.heic`（实际为4928×3280的WebP），内容为透过舷窗看到地球云层；网站使用独立生成的2400像素宽JPEG，原文件不放入源码。摄影者与原始来源尚未确认 | 用户确认可公开的背景，补充确认的作者和原始来源 |
| `modules/about/gallery/images/portrait-landscape.jpg` | About相册首图 | 用户现有人像的1920×1280网页副本，301619字节；原6240×4160图片保留，副本移除隐私元数据；摄影者和来源尚未确认 | 横向个人照片，补充确认的署名 |
| `modules/about/gallery/images/misty-lake.jpg` | About相册占位第二张 | 已下载Creations雾湖的原字节独立副本，Kalen Emsley / Unsplash | 用户个人照片 |
| `modules/about/gallery/images/coastal-cliffs.jpg` | About相册占位第三张 | 已下载Travels海岸的原字节独立副本，Benjamin Chambon / Unsplash | 用户个人照片 |
| `modules/academic/experience/images/cover.jpg` | 学术经历缩略图、预览与详情 | 同一张 Cosmic Cliffs；NASA / ESA / CSA / STScI，独立文件 | 学术经历相关图片或示意图 |
| `modules/academic/publications/images/cover.jpg` | 论文缩略图、预览与详情 | [仙女座星系（Andromeda Galaxy）](https://images.nasa.gov/details/PIA04921)，NASA/JPL/California Institute of Technology | 论文插图或宽幅图片 |
| `modules/academic/notes/images/cover.jpg` | 笔记缩略图、预览与详情 | [创生之柱（Pillars of Creation）](https://images.nasa.gov/details/GSFC_20171208_Archive_e000842)，NASA / ESA / Hubble Heritage Team (STScI/AURA) | 笔记本、黑板或学习图片 |
| `modules/academic/projects/images/cover.jpg` | 项目缩略图、预览与详情 | [地出（Earthrise）](https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/)，NASA / Bill Anders | 项目插图或截图 |
| `modules/life/moments/images/cover.jpg` | 生活片段图库（Moments） | 同一张山间湖泊；Ivan Rohovchenko / Unsplash，独立文件 | 个人回忆照片 |
| `modules/life/travels/images/cover.jpg` | 旅行图库（Travels） | [海岸悬崖](https://unsplash.com/photos/rocky-cliffs-meet-the-oceans-frothy-waves-YRu3lLu4n-k)，Benjamin Chambon / Unsplash | 可公开的旅行照片 |
| `modules/life/creations/images/cover.jpg` | 创作栏目（Creations） | [Kalen Emsley](https://unsplash.com/@kalenemsley) / Unsplash；直接下载 URL 见清单 | 可公开的创作或作品封面 |
| `modules/life/relationship/images/cover.jpg` | 关系空间（Relationship）的公开封面 | [海岸线](https://unsplash.com/fr/photos/un-plan-deau-pres-dune-falaise-rocheuse-tbTUtOJMs_0)，Tomáš Malík / Unsplash | 仅使用可公开的封面；私密图片不能作为普通资源上传 |
| `modules/contact/images/background.png` | 联系区独立背景 | 用户提供，原字节复制的 PNG（3024 × 1964，7,070,826 字节），不裁剪或重新编码；原作者与来源尚未确认 | 用户确认可公开的联系背景；补充真实来源后再更新署名 |

Academic 与 Life 已移除整区背景图，改为各自的纯黑 `#000` 和公开粒子表面。其栏目封面与生活照片仍保留署名；纯黑背景及程序绘制的白点没有新增图片来源。Home 已独立替换为用户提供的舷窗地球图，Moments 保留原山间湖泊；About 为用户独立提供的人像，各自文件可独立替换，不通过其他模块路径读取。

此前 Home 从原 About 占位图原字节复制 633,840 字节的山水 JPEG，已由2026-10-25用户提供的舷窗地球图取代，原山水及来源保留在 Git 历史与 Moments 独立封面中。Contact 保留用户 PNG 原字节。旧 `modules/academic/images/background.jpg`、`modules/life/images/background.jpg`、`modules/contact/images/background.jpg` 已退出当前资源清单，旧来源保留在 Git 与回退包中；不删除仍用于 Experience、Publications、Creations 的同源封面。

## 替换方法

同名、同扩展名图片可直接替换；扩展名变化时，更新所属模块的 `section.html`、样式与相关 `content.js`、清单预载路径。图片裁切由所属模块 `styles.css` 维护。Contact 当前保留原 PNG，不将其转为 JPG 或推断署名；Home 与 About 的独立副本不会自动同步。Academic / Life 不再维护整区背景图，不通过替换栏目封面恢复背景。

同步更新模块中的英文替代文本、署名、来源链接和占位说明，以及 `modules/credits/page.html`、本清单和 `download-manifest.json`。仍使用的下载图片保留署名。最后运行 `npm run assemble` 更新根页面，不手改生成的 `index.html` 或 `credits.html`。

使用规则参考：[NASA 图片与媒体指南](https://www.nasa.gov/nasa-brand-center/images-and-media/)与 [Unsplash 授权说明](https://unsplash.com/license)，仅对应有明确来源的下载素材。原始下载 URL 保存在 [下载清单](download-manifest.json)；独立副本共享来源 URL，不代表新增下载或个人照片。清单的 Home、About 人像原图、网页人像副本和 Contact 项为 `null`，表示用户提供且没有已确认的下载 URL；详细来源状态以本表为准，不伪造链接。

2026-10-11 本轮素材替换、署名及黑色区域在 255 个流程 / 12234 条断言与基础兼容性回归中通过，外部请求和真实写入为 0；24 张截图中的桌面、手机关键画面已查看。当前范围与未覆盖项见 [粒子记录](modules/particle-background.md)，旧测试结论保留为历史。

2026-10-23相册素材由 [photos.js](../modules/about/gallery/photos.js) 独立维护，尺寸/散列及原图保护见[素材说明](../modules/about/gallery/images/README.md)。原 `modules/about/images/portrait.JPG`（Git登记portrait.jpg）未改名/覆盖/暂存，已退出网页直接引用；更新相册不改变Home和Life的独立图片。暂无用户新个人照片时，两张风景均明确为占位素材。
