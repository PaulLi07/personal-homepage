# 参考网站源码分析

参考网站：<https://swarajsingh-portfolio-25.pages.dev/>

2026-10-08 已读取完整 HTML（39,444 字节）、编译后的样式表 `assets/index-BYyCr5JF.css`（12,800 字节）与 JavaScript 包 `assets/index-CFzbJSSm.js`（176,959 字节），并分离应用代码与库代码进行检查。下载的分析副本存放在上传文件夹之外。

## 原站框架

| 原站结构 | 源码中的行为 | 本站适配 |
| --- | --- | --- |
| 固定导航栏 | 左侧为姓名与年份；右侧为四个分区与简历按钮；向下滚动时隐藏；悬停时重复文字滚动 | 姓名、About、Academic、Life、Contact 与邮箱链接；保留相同导航行为 |
| 加载画面 | 问候语、图片加载计数器与五条等宽竖向色带 | 简短问候与五条色带；限制启动等待时间，避免图片导致无限等待 |
| `.page1`、`.landing-div` | 首屏与简介共用全屏背景；底部左侧为标题，右侧为简短简介 | NASA 背景、学术身份与双栏首屏 |
| `#about`、`.mainAbout` | 图片约占 65%，简介约占 32%，底部列出个人信息 | 风景占位图、真实学生资料与个人信息 |
| `.page2`、`#projects` | 全屏背景、底部四张缩略图；右侧大图在悬停时通过水平裁切展开 | Experience、Publications、Notes、Projects；保留预览布局 |
| `.projects-overlay` | 固定全屏详情；左侧 44% 为标题与图片，右侧 56% 为描述与补充信息；使用幕帘与图片过渡 | 同样分栏的原生无障碍对话框，含详情导航、描述、信息与可编辑条目 |
| `.page3`、`#cover` | 四张错落照片围绕中央 Recognition 标题 | Moments、Travels、Creations、Relationship 四个生活入口，保留错落照片布局 |
| `.page4`、`#contact` | 全屏背景、三栏联系方式；底部为姓名与致谢标记 | 邮箱、GitHub、单位、姓名与致谢文字 |

## 样式与运行方式

原站使用 Tailwind CSS 4.1.14、GSAP 3.13.0、ScrollTrigger、ScrollSmoother、SplitText、ScrollTo 与 Flip。标题字体为 Staatliches 与 Stint Ultra Condensed；配色为深苔绿 `#242A23` 与冰蓝 `#C5E0F1`。

按用户要求，本站使用常规系统字体与适中字号，不保留窄体展示字体。深色底调整为冷调炭灰，保留冰蓝点缀与全屏照片结构。

布局与交互按功能放入 `modules/`，各模块分别维护 HTML 片段、CSS、JavaScript、图片和简洁说明；真正复用的导航、详情与过渡放入 `shared/`。本地装配将片段生成根页面，上传后无需服务器构建，运行时仍使用 CSS、原生 Web Animations 与 IntersectionObserver，不依赖第三方运行库。支持键盘导航、Escape 关闭详情、浏览器返回、相对资源路径与减少动态效果偏好。原站简历、奖项、项目文案和个人照片已替换为相应学术分区及明确标识的占位内容。

2026-10-10 新增的 Moments 博客、GitHub PAT 作者工作台与 Relationship 加密空间属于本站独立扩展，不是参考站的功能。它们通过自定义详情视图接入公共外壳，业务与私有数据仍在各自模块；三内核、三个视口的本次实测及 GitHub 模拟范围见 [兼容性记录](COMPATIBILITY.md)。
