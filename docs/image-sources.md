# 图片来源与替换说明

当前图片均为下载的占位图，不是个人照片或 AI 生成图片。各功能维护自己的图片，共 13 个文件（含独立背景副本）；下列路径相对于网站根目录。

| 模块中的文件 | 使用位置 | 来源与署名 | 建议替换内容 |
|---|---|---|---|
| `modules/home/images/hero.jpg` | 首屏背景 | [宇宙悬崖（Cosmic Cliffs）](https://images.nasa.gov/details/carina_nebula)，NASA / ESA / CSA / STScI | 宽幅宇宙图片，约 1920 × 1100 或更大 |
| `modules/about/images/portrait.jpg` | 简介图片 | [山间湖泊](https://unsplash.com/photos/a-lake-with-trees-and-mountains-in-the-background-8fVmVlnrN5k)，Ivan Rohovchenko / Unsplash | 个人肖像、校园照片或个人风景 |
| `modules/academic/experience/images/cover.jpg` | 学术经历缩略图、预览与详情 | 同一张 Cosmic Cliffs；NASA / ESA / CSA / STScI，独立文件 | 学术经历相关图片或示意图 |
| `modules/academic/publications/images/cover.jpg` | 论文缩略图、预览与详情 | [仙女座星系（Andromeda Galaxy）](https://images.nasa.gov/details/PIA04921)，NASA/JPL/California Institute of Technology | 论文插图或宽幅图片 |
| `modules/academic/notes/images/cover.jpg` | 笔记缩略图、预览与详情 | [创生之柱（Pillars of Creation）](https://images.nasa.gov/details/GSFC_20171208_Archive_e000842)，NASA / ESA / Hubble Heritage Team (STScI/AURA) | 笔记本、黑板或学习图片 |
| `modules/academic/projects/images/cover.jpg` | 项目缩略图、预览与详情 | [地出（Earthrise）](https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/)，NASA / Bill Anders | 项目插图或截图 |
| `modules/life/moments/images/cover.jpg` | 生活片段图库（Moments） | 同一张山间湖泊；Ivan Rohovchenko / Unsplash，独立文件 | 个人回忆照片 |
| `modules/life/travels/images/cover.jpg` | 旅行图库（Travels） | [海岸悬崖](https://unsplash.com/photos/rocky-cliffs-meet-the-oceans-frothy-waves-YRu3lLu4n-k)，Benjamin Chambon / Unsplash | 可公开的旅行照片 |
| `modules/life/creations/images/cover.jpg` | 创作栏目（Creations） | [Kalen Emsley](https://unsplash.com/@kalenemsley) / Unsplash；直接下载 URL 见清单 | 可公开的创作或作品封面 |
| `modules/life/relationship/images/cover.jpg` | 关系空间（Relationship）的公开封面 | [海岸线](https://unsplash.com/fr/photos/un-plan-deau-pres-dune-falaise-rocheuse-tbTUtOJMs_0)，Tomáš Malík / Unsplash | 仅使用可公开的封面；私密图片不能作为普通资源上传 |
| `modules/academic/images/background.jpg` | 学术区独立背景副本 | 同一张 Cosmic Cliffs；NASA / ESA / CSA / STScI | 可独立替换的宽幅学术背景 |
| `modules/contact/images/background.jpg` | 联系区独立背景副本 | 同一张 Andromeda Galaxy；NASA/JPL/California Institute of Technology | 可独立替换的宽幅联系背景 |
| `modules/life/images/background.jpg` | 生活区独立背景副本 | 同一张湖泊照片；Kalen Emsley / Unsplash | 可独立替换的宽幅生活背景 |

## 替换方法

同名 JPG 可直接替换；文件扩展名变化时，更新所属模块的 `section.html` 与相关 `content.js` 路径。图片使用 `object-fit: cover`，裁切位置在所属模块 `styles.css` 中调整。学术、生活与联系背景均独立保存；替换详情封面不会同步改变这些背景。

同步更新模块中的英文替代文本、署名、来源链接和占位说明，以及 `modules/credits/page.html`、本清单和 `download-manifest.json`。仍使用的下载图片保留署名。最后运行 `npm run assemble` 更新根页面，不手改生成的 `index.html` 或 `credits.html`。

使用规则参考：[NASA 图片与媒体指南](https://www.nasa.gov/nasa-brand-center/images-and-media/)与 [Unsplash 授权说明](https://unsplash.com/license)。原始下载 URL 保存在 [下载清单](download-manifest.json)；独立副本共享来源 URL，不代表新增下载或个人照片。
