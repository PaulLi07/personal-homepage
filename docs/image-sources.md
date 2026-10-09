# 图片来源与替换说明

当前图片均为下载的占位图，不是个人照片或 AI 生成图片。下列路径均相对于网站根目录。

| `assets/images/` 中的文件 | 使用位置 | 来源与署名 | 建议替换内容 |
| --- | --- | --- | --- |
| `hero-carina.jpg` | 首页背景；学术区背景 | [宇宙悬崖（Cosmic Cliffs）](https://images.nasa.gov/details/carina_nebula)，NASA / ESA / CSA / STScI | 宽幅宇宙图片，约 1920 × 1100 或更大 |
| `about-placeholder.jpg` | 简介区图片 | [山间湖泊](https://unsplash.com/photos/a-lake-with-trees-and-mountains-in-the-background-8fVmVlnrN5k)，Ivan Rohovchenko / Unsplash | 个人肖像、校园照片或个人拍摄的风景 |
| `research-placeholder.jpg` | 研究缩略图、预览与详情 | 同一张 Cosmic Cliffs 图片；独立文件，便于单独替换 | 研究相关图片或示意图 |
| `publications-placeholder.jpg` | 论文成果区；联系区背景 | [仙女座星系（Andromeda Galaxy）](https://images.nasa.gov/details/PIA04921)，NASA/JPL/California Institute of Technology | 论文插图或其他宽幅图片 |
| `notes-placeholder.jpg` | 笔记缩略图、预览与详情 | [创生之柱（Pillars of Creation）](https://images.nasa.gov/details/GSFC_20171208_Archive_e000842)，NASA / ESA / Hubble Heritage Team (STScI/AURA) | 笔记本、黑板或学习场景图片 |
| `projects-placeholder.jpg` | 项目缩略图、预览与详情 | [地出（Earthrise）](https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/)，NASA / Bill Anders | 项目插图或截图 |
| `life-moments.jpg` | 生活片段图库（Moments） | 同一张 Ivan Rohovchenko 照片；独立文件，便于单独替换 | 个人回忆照片 |
| `life-places.jpg` | 地点图库（Places） | [海岸悬崖](https://unsplash.com/photos/rocky-cliffs-meet-the-oceans-frothy-waves-YRu3lLu4n-k)，Benjamin Chambon / Unsplash | 旅行照片 |
| `life-notes.jpg` | 日常细节（Little things）；生活区背景 | [Kalen Emsley](https://unsplash.com/@kalenemsley) / Unsplash；准确的图片下载 URL 见下载清单 | 日常细节照片 |
| `life-outside.jpg` | 户外图库（Outside） | [海岸线](https://unsplash.com/fr/photos/un-plan-deau-pres-dune-falaise-rocheuse-tbTUtOJMs_0)，Tomáš Malík / Unsplash | 个人户外照片 |

用同名 JPG 文件替换图片即可更新所有引用位置。若更改扩展名，需同时更新 `index.html` 和 `js/content.js` 中的路径。图片容器使用 `object-fit: cover`；若人物照片需要调整裁切位置，可修改 `css/styles.css` 中的 `object-position`。

替换占位图时，还需更新 `index.html`、`js/content.js` 和 `credits.html` 中的替代文本、署名、来源链接与占位说明。这些网页呈现内容必须使用英文；仍在使用的下载图片应保留署名。

使用规则参考：[NASA 图片与媒体指南](https://www.nasa.gov/nasa-brand-center/images-and-media/)与 [Unsplash 授权说明](https://unsplash.com/license)。实际下载使用的直接 URL 保存在 `download-manifest.json`。
