# 个人主页维护约定

工作区根目录的 `personal-homepage/` 是正式源码目录，后续网站维护在这里进行。`outputs/personal-homepage` 是兼容链接；其他解压目录及旧 HTML 文件属于历史副本。

开始前阅读 `README.md`、`docs/ARCHITECTURE.md`、`docs/WORKFLOW.md` 和受影响模块内的 `README.md`。

## 语言与模块要求

- **所有说明文档必须使用中文。** 覆盖 README、维护约定、框架、协议、模块说明、素材说明和变更记录；路径、代码标识、命令、网址及专有名称保留原文。
- **所有网页呈现内容必须使用英文。** 包括正文、导航、标题、按钮、弹窗、提示、空状态、图片署名、页面标题与描述、替代文本及无障碍标签。`credits.html` 同样遵守。
- **每次扩展模块必须同步简洁说明并实际测试兼容性。** 模块内 `README.md` 说明用途、入口、文件、接口与维护方法；`docs/modules/<模块标识>.md` 链接该说明并记录测试，不重复长篇文档。新模块及首次扩展的旧模块均需登记在 `docs/modules/README.md`。
- 说明与实际测试记录随功能一起交付；未运行的环境明确写“未测试”，不能以静态检查代替浏览器实测。

## 已确认资料与设计偏好

- 姓名：Yuhong Li；学校：Nankai University（南开大学）；身份：研究生；领域：理论物理。
- 邮箱：2310408@mail.nankai.edu.cn；GitHub：PaulLi07。
- 用户提供的 ORCID：<https://orcid.org/0009-0005-6858-4000>，在 About 和 Contact 同步展示；Projects 展示 BESIII Collaboration 官方链接 <http://bes3.ihep.ac.cn/>，不推断个人角色或贡献。
- 用户指定论文 arXiv:2610.11981，官方元信息已核对为 2026-10-08 提交、BESIII Collaboration 署名；只展示核实的题名、日期及 Abstract / PDF 链接，不推断个人主导角色或正式发表状态。
- 仓库：<https://github.com/PaulLi07/personal-homepage>。
- 网站：<https://paulli07.github.io/personal-homepage/>。
- 研究课题、论文、成果和个人故事目前仍有占位内容，使用用户提供的事实，不得编造。
- 采用简洁学术风与宇宙主题，保持优雅、艺术感和克制；使用常规字体和适中标题，用户拒绝窄体超大展示文字。
- 粒子必须微小、密集、清晰，呈白色实心圆点；禁止模糊光晕、渐变精灵或模糊滤镜。只在公开标记的纯黑背景区域显示，不能覆盖图片背景或区域内图片。当前 About、Academic、Life 各自用 `data-particle-surface="black"` 声明纯黑 `#000` 背景；Academic 与 Life 不再使用整区背景图。粒径参数表示 CSS 像素半径，默认 `0.4`–`0.85`，透明度 `0.85`。
- 用户于 2026-10-14 澄清：粒子须随滚轮引起的页面滚动同向、等距移动，不能固定在屏幕；不是整层随鼠标指针移动。取消上一轮误解产生的鼠标视差及参数，保留原局部搅动。Canvas 仅作视口绘制窗口，粒子按文档坐标减去实际 `scrollX/Y` 后绘制，周期补齐视口，不为整页创建巨大画布；模拟与绘制使用相同滚动偏移。减少动态效果只停自主运动，滚动仍更新粒子和图片遮罩。必须隔离自主漂移，实测滚轮上下、返回原位、键盘滚动及照片零覆盖。
- About 与 Academic 之间使用白色横线和中央小菱形分隔，由 Academic 自己管理装饰。用户于 2026-10-13 要求加粗白色边线：Academic 主线 3px、次线和图片框 2px；Life 保留错落照片，主框和照片边框 3px、偏移副框 2px，通过明暗区分叠层。保持简洁，不让装饰遮挡内容。
- Home 继续独立使用 `modules/home/images/hero.jpg` 原山水图，署名为 Ivan Rohovchenko / Unsplash；不再要求与 About 图片相同。About 的 `modules/about/images/portrait.jpg` 已由用户替换为 6240×4160 户外人像，本轮保留原字节；只按观察描述图片，不推断人物身份、拍摄地点、摄影者或来源。Contact 使用用户提供的原始 PNG，独立保存为 `modules/contact/images/background.png`；只注明用户提供、原作者与来源尚未确认，不能称为用户亲自拍摄。Home 与 Contact 均保留图片背景，不声明黑色粒子表面。
- 2026-10-23 用户批准 Apple 风格优化：保留摄影首屏、宇宙粒子、学术四栏目与生活照片叠层，使用系统字体、正常字形、适中标题、石墨灰面板、克制磨砂和清楚的主次按钮；不引入窄体巨字或无层次的大块黑色。视觉令牌与模块边界见 [设计约定](docs/DESIGN-APPLE.md)，本轮实际验证统一链接 [兼容性记录](docs/COMPATIBILITY.md#apple-design-2026-10-23)，不得沿用旧测试结论。
- 同日后续批准仅精修 Academic：参考 NASA Science 的专题层次，四入口整卡 `1:1`、`0px` 圆角，图片、标题说明内嵌，桌面四列、≤900px 两列；大预览也改直角，仅覆盖本区旧圆角约定。保留纯黑粒子表面、前景与图片 `data-particle-exclude`。上部标题/说明从 `details.getItem()` 读取，序号随栏目切换；精选论文仅从公开 `getPublicationCategories()` 取 arXiv 首条，否则首个非空分类首条，不复制资料，缺失、抛错或全空则隐藏。实际验证见 [Academic 本轮记录](docs/modules/academic.md#academic-science-2026-10-23)，其他板块规则不变。
- 2026-10-23 后续用户批准 Academic 改为学术探索场景，取代前述四正方形卡片：桌面左侧30%四行直角路牌接地，顶部在右侧大图中部至下半部；地面小人用SVG/CSS缓慢行走，图窗自动循环四栏，悬停/聚焦/详情/离屏暂停，支持手机与减少动态效果。场景按配置、轮播、导航、人物、精选索引和胶水独立放在 `modules/academic/exploration/`，父入口只接线，不读取其他模块私有实现；继续遵守中文文档/英文页面及实测协议。回退点 `backup/pre-academic-scene-2026-10-23`（`ed981de`），任务分支 `feat/academic-exploration-scene`，本轮未授权推送。
- 同日后续用户要求路牌与道路呈现独立的立体黑白漫画风，允许与周围Apple风格不同。四块箭头木牌用黑白纸面、墨线、侧板排线、螺钉和立柱；地面改为漫画草地及土层，沿用人物行走和四栏预览/路由。样式及原生SVG归 `academic/exploration/`；外层排除粒子，手机裁取草地图局部，脚底/立柱/地表按共同基线对齐。回退 `backup/pre-academic-comic-2026-10-23`（`7e4425c`），分支 `style/academic-comic-signpost`，未授权推送。
- 后续人物动作更新：外壳40×46px，六种日常动作（walk/idle/look/think/stretch/wave）加turn连接片段，动作素材/导演/骨架独立归 `academic/exploration/character/`，上级walker只管挂载、活跃时钟和清理。通过共同站姿、五次缓动、整数步态及先停稳再转身保证衔接；条件加权、不连续重复、最多两段静态后行走。离屏/后台/详情/动态偏好暂停冻结相位，恢复不补算时间。参数集中 `config.walker`；新增动作须同步素材、导演登记、配置、中文说明及连续性测试。回退 `backup/pre-walker-actions-2026-10-23`（`453a346`），分支 `feat/walker-action-library`，未授权推送。
- 2026-10-23可读性精修：Academic图窗仅图片声明粒子排除，下方图注和进度透明并透出粒子；移除Pause/Play控件，保留自动轮播及条件暂停。人物当前外壳高60px、宽约52.17px，骨架内部坐标仍40:46；手机需保持路径空间与草地基线。辅助文字原则上至少12px，保留正文/标题层级及数学上下标原生缩放。Publications与精选题名用可选 `titleTex` 调用本地共享KaTeX，必填纯文本 `title` 用于失败回退；不把普通文章作为HTML解析。回退 `backup/pre-readability-math-2026-10-23`（`555de1d`），本轮未请求推送。
- 2026-10-23用户批准About横向Gallery：3:2固定画幅、桌面左约60%右资料、图下无标题个人说明；≤900px为照片→资料→说明。用户最新要求序号 `1 / 03` 半透明放图片内底部，左右箭头在图片两侧，不另占图下控件条。Gallery照片/配置、行为、样式独立归 `modules/about/gallery/`；6秒淡入、手动/键盘/滑动及独立暂停原因，系统减少动态效果关闭自动播放。框内显式排除粒子，图下说明透明。保留未提交原人像原字节，另存去元数据的1920×1280网页副本；两个已有风景占位副本在About独立维护并保留来源。分支 `feat/about-photo-gallery`，回退 `backup/pre-about-gallery-2026-10-23`（`6cf69f5`），未授权推送。
- 2026-10-23用户澄清并批准全宽布局：About不是Gallery独占整行，而是Gallery左62.5%＋基本信息右37.5%整组铺满可用宽度；相册左贴边、0圆角横向，右侧资料文字24–32px内边距，无标题说明仍图下左列。≤900px单列，手机相册贴边、文字18–20px。Academic分隔/草地全宽、预览靠右到边，路牌实际280–360px受控；标题/图注/论文保留24–32px（手机18–20px）。本次仅模块局部宽度变量，不改全局gutter或其他分区。回退 `backup/pre-edge-layout-2026-10-23`（`073d6b3`），任务分支 `style/edge-to-edge-sections`，未授权推送。
- 2026-10-23后续用户纠正比例：About桌面从左到右明确为2.5%空白、65%照片、30%基本信息、2.5%空白；取消照片左贴边，降低照片高度，放大姓名与资料层级，使照片和信息区上下对齐。≤900px维持单列与18–28px安全边距。Academic图片恢复真正16:9并限制最大宽度760px，左路牌、中央图片、右黑白漫画叶树平衡构图；树根接原草地基线，树干略向左倾、冠向右上展开，不遮挡入口。此条覆盖前一条的比例、贴边与照片拉长规则；模块独立维护，不改全局gutter。分支 `style/balanced-about-academic`，回退 `backup/pre-balanced-composition-2026-10-23`（`2dcad80`），未授权推送。
- 2026-10-24用户进一步明确Academic要椰子树：改为三株错落交叠的黑白漫画椰林（羽状叶、果串、环纹曲干），路牌向右移、正常16:9图片扩大到中右部分，最大1280px。路牌与椰林背景须透明，取消其外层整矩形排除；透明SVG用CSS背景与既有前景层合成，实体木板/墨线遮粒子，空隙透出粒子。这是用户指定的透明装饰例外，覆盖此前SVG/CSS背景一律排除及独立叶树轨道规则；照片和实体草地仍排除，粒子服务接口不变。仅Academic局部修改，About比例保留。分支 `style/academic-coconut-palms`，回退 `backup/pre-academic-palms-2026-10-24`（`4d84c60`），未请求推送。
- 同日最新高度纠正：椰树必须从地面长到图片上方，完整树冠（含最低叶尖）位于构图顶部，不能作为图片下缘矮装饰。图片适度缩小、介于旧约701px和上一版983px之间，1440视口约846px宽。桌面/窄屏原生SVG分别720×1660/720×2940，重画加长树干而不拉伸叶冠；照片留白、树宽与根基线联动。透明底、粒子、右移路牌保留，图片和文字置于树前。分支 `style/academic-tall-palms`，回退 `backup/pre-tall-palms-2026-10-24`（`c9848a9`），未请求推送。
- 2026-10-24最新构图纠正覆盖上一条超长树与整排树冠留白：三株椰树聚根交干、树冠高低交叠，缩短树干，取消最低叶尖决定整行照片留白。桌面图片左移（1440约x343、宽792px），主冠在右上自然高出图片，部分叶片允许在照片后交叠；不再强迫所有叶尖高于照片。≤760px改照片在上、路牌与紧凑椰林在下，避免手机超长树；≥1800px将主体收拢到居中1800px范围，分隔/草地仍全宽。两SVG统一720×1120、根y1107，保留透明前景与真实16:9，更新SVG引用版本避免旧图缓存。分支 `style/academic-compact-grove`，回退 `backup/pre-compact-grove-2026-10-24`（`b156e06`），未请求推送。
- 保留参考网站 <https://swarajsingh-portfolio-25.pages.dev/> 的全屏摄影首屏、分栏简介、学术缩略图与详情、散落生活照片和联系区框架。
- 导航为 About、Academic、Life、Contact；学术包括 Experience、Publications、Notes、Projects；生活包括 Moments、Travels、Creations、Relationship。用户本次栏目命名优先于旧版 Research / Places / Little things / Outside。
- 使用下载的占位图，直到用户替换或要求寻找其他网络图片；未经用户改变偏好，不生成替换图片。

## 功能边界与文件职责

- `modules/home/`、`about/`、`academic/`、`life/`、`contact/`、`credits/` 按用户理解的功能组织源码；不再把全部功能分散到统一的 HTML、CSS、JS 文件中。
- 主模块保存自己的 `section.html`（署名页使用 `page.html`）、`styles.css`、按需的 `module.js`、`images/` 与 `README.md`。
- 学术和生活详情子模块各自保存 `content.js`、`images/cover.jpg` 和 `README.md`；不要将其数据重新集中到一个大文件。Experience 学术日志与 Moments 文章分别保存自己的数据、读者视图和接入行为；Relationship 的加密行为留在自己的目录。
- 用户已要求统一作者登录与编辑能力，允许独立的 `modules/author/` 服务模块被 Experience 和 Moments 共同使用。它管理作者会话、GitHub 连接、通用编辑器与独立发布器，不合并两栏的数据或读者界面；不需要 HTML 根节点或 `registerSection`。
- 两栏文章照片共用独立的 `modules/article-photos/` 服务，负责照片规范、处理、选择预览、阅读图组及下载 ZIP；图片实体仍保存在所属栏目的 `images/posts/<文章标识>/`，不建立集中照片目录。`modules/author/publisher.js` 处理数据合并与 GitHub 提交，编辑器只连接表单与这些服务。
- 两栏 PDF 附件由独立的 `modules/article-documents/` 服务负责规范、选择及阅读链接，实体归当前集合的 `documents/posts/<文章标识>/`。装配顺序为照片服务、PDF 服务、作者服务，再加载分区数据；PDF 不进入照片处理逻辑。
- 粒子背景独立放在 `modules/particle-background/`，以清单 `services` 加载自己的配置、模拟、绘制与样式，不占导航分区，不放进 `shared/` 或具体栏目。胶水只向 `mount()` 传主页面根节点、动态偏好与详情根节点；运动、输入、暂停和清理留在服务内。无图片、凭据、网络或第三方运行时依赖，艺术性局部规则不能宣称严格物理仿真。
- 可绘区域由模块公开的 `data-particle-surface="black"` 界定；模块自身保证背景纯黑，服务核验声明区域自身的计算样式、读取视口矩形并排除其中 `img` 及公开 `data-particle-exclude` 矩形，不扫描其他模块私有结构来推断可绘范围。前景使用 `data-particle-foreground`；样式、图片、滚动及 CSS 过渡结束后刷新遮罩，静态重绘不推进模拟。直接使用 Canvas `arc` 填充白色实心点，不使用 sprite、渐变或 blur；读者和作者详情均继续暂停并隐藏粒子。
- 纯黑区域中的 CSS 背景图片容器、SVG、视频等非 `img` 视觉内容必须由所属模块声明 `data-particle-exclude`；服务不自动识别它们。`data-particle-foreground` 设置普通容器为相对定位，绝对或粘性定位组件用外层容器接入。扩展必须验证相关边界，不将现有 `img` 案例说成任意图片自动识别。
- Publications 使用自定义详情视图；`internal-note/`、`arxiv/`、`published/` 各自保存 `data.js` 和中文 README，通过 `registerPublicationCategory` 独立登记。分类目录及子路由沿用共用弹窗、历史和焦点，不集中成一份论文数据。
- `app/site.json` 声明模块与装配顺序；`app/index.template.html`、`app/credits.template.html` 保存页面外壳；`app/main.js` 只负责装配后的初始化。
- `shared/` 仅保存真正跨模块的基础样式、导航、详情弹窗、过渡、进入动画及注册接口，不能成为杂物目录。只有多个功能实际复用且接口清楚的能力才放入共享层；入口与使用者记录在 `shared/README.md`。
- `shared/runtime.js` 提供单一 `window.Homepage` 注册入口；模块通过 `registerSection({ id, init?, detailGroup? })`、`registerDetail(group, key, data)` 贡献功能。自定义详情通过 `registerDetailView(group, key, { render })` 注册；`render({ host, route, signal, navigate })` 只操作传入容器，可返回清理函数。
- 共用 `details.open(group, key, { trigger, source, route = null })` 可选子路由只接受 `^[a-z0-9]+(?:-[a-z0-9]+)*$` 且目标须已登记自定义视图；旧调用默认 `null`。Academic 精选链接通过公开接口传 `trigger` 与分类路由，关闭恢复焦点及滚动位置；修饰键点击保留原 `href`，不由 Academic 读共享弹窗 DOM 或另建路由系统。
- `registerData(key, value)` / `getData(key)` 只提供命名空间数据登记；文章校验、模块数据 getter、统一作者认证与解密业务仍在所属功能模块。`app/main.js` 只把视图注册表传给详情服务，为分区初始化传入 `{ root, details, reducedMotion }`，不解释日志、博客、作者权限或加密内容。
- 模块不直接读取其他模块内部文件、选择器或数据；通过清单、注册接口或明确的共享服务连接。模块图片独立保存，哪怕内容暂时相同，也应能单独替换。
- 根目录 `index.html`、`credits.html` 是生成产物，禁止手改；修改源模块或模板后运行 `npm run assemble` 并一并提交生成页面。
- 装配为全部 CSS 和静态 JS 的引用增加内容 SHA256 前 12 位的 `?v=` 版本。`app/site.json` 中 `liveScripts` 必须是所属模块 `scripts` 的子集，当前仅声明 Experience 的 `entries.js` 和 Moments 的 `posts.js`，保持原 URL，让在线直接发布数据无需重新装配 HTML。图片仍使用所属模块路径，作者业务不因此改变；About 人像在片段中额外使用内容 SHA256 前 12 位 `?v=` 刷新旧图缓存，换图时同步该值，不能误认为装配器已自动版本化所有图片；版本串不含凭据。
- 保留普通脚本、相对资源路径和无外部运行时依赖；生成页面可直接以文件方式打开，上传后无需服务器构建。

## Experience、Moments 与统一作者入口

- `modules/life/moments/posts.js` 只登记 JSON 文章数组，使用 `Homepage.registerBlogPosts([...])`；不执行任意远端脚本，不把正文作为 HTML 注入。没有真实文章时保持空数组。
- `modules/academic/experience/entries.js` 独立登记学术日志数组，使用 `Homepage.registerAcademicLogs([...])`；类型为 Research / Learning / Seminar / Milestone，可选参考链接仅允许绝对 HTTPS 地址。不编造日志或将生活文章写入此集合。
- 两栏分别使用 `#academic/experience` 与 `#life/moments` 列表、`/<slug>` 正文、`/author` 作者工作台；`author` 为保留标识。未登录仅显示密码入口，编辑器由统一作者服务提供。
- 作者配置只保存随机盐与 PBKDF2-SHA256 600000 次派生的密码校验值，不保存或记录用户原密码。首次输入作者密码进入编辑器，再连接 GitHub PAT；真正写权限仍由 GitHub 执行，必须核验 `PaulLi07`、仓库所有者和写权限。
- 用户已选择在线发布并记住加密连接的使用方式；首次连接时主动勾选 remember，才用密码派生密钥加密 PAT 并保存在当前浏览器 `localStorage`。未勾选时只在会话内存保留。不得保存明文密码或 PAT，也不把它们写入源码、URL、Cookie、历史、日志或聊天。
- 当前页面的解锁和连接可跨两栏及详情关闭保持，直到 `Sign out`、刷新或页面离开；退出清内存但可保留加密连接，`Forget saved connection` 删除加密缓存与当前连接。刷新后必须再次输入密码才能恢复缓存，且重新 GET `/user` 与仓库验证身份和权限；篡改或失效缓存不得自动连接。
- GitHub 请求收到 401 时清当前连接并保留解锁与草稿，重新连接后再发布；忘记缓存失败应如实提示，不得声称已删除。
- 用户主动点击 `Publish to GitHub` 后才写入 GitHub。无照片且无 PDF 的文章保留 Contents GET / PUT；只要有任意附件，就基于当前 `main` 提交创建附件与数据 blobs、基于原树创建新树、创建单父提交，再以 `force: false` 更新 `main`，使附件与文章同时出现在一次提交中。先合并同一提交的远端记录，保留已有照片和 PDF；冲突保留草稿，两集合不得互写，禁止强制更新分支或删除历史。
- 会话请求必须将 head、基树、上传的 blob、受控新树、新 commit 与分支更新绑定到同一次发布；不能接受任意外部树或提交 SHA。失败、取消、新 head、退出或授权失效须清理发布上下文，重试从最新 head 开始。
- Git blob 每份最多 10 MiB；tree 最多 13 项，即当前集合数据文件、9 张照片和 3 份 PDF。路径只允许同一集合、同一文章；照片与 PDF 分别使用自己的批次标识，不允许跨文章混用。
- 每篇最多 9 张 JPEG / PNG / WebP 原图，每张不超过 10 MiB。浏览器重绘为长边不超过 1920 的 JPEG，去除原图元数据；输出每张不超过 2 MiB、合计不超过 18 MiB。`photos: [{ src, alt, caption? }]` 的英文 alt 必填且最多 300 字符，caption 可选且最多 600 字符；路径为当前集合的 `images/posts/<id>/<24hex>-<1..9>.jpg`。
- `attachments: [{ src, title, size }]` 最多 3 份 PDF，每份最多 10 MiB、合计最多 30 MiB；英文标题非空且最多 160 字符，size 与原字节大小一致。路径为当前集合的 `documents/posts/<id>/<24hex>-<1..3>.pdf`；只做大小及头尾基本检查，保留原字节和元数据，不进行完整 PDF 解析或扫描。读者使用 Open PDF / Download PDF 链接，不内嵌 iframe。
- `Download update` 无附件时导出当前集合的纯 JSON 登记 JS；有任意照片或 PDF 时下载含数据与附件的 ZIP，文件负载最多 52 MiB，路径相对于仓库根。两者均不发布、不读取最新远端；手动上传须解压、核对远端并保留已有记录及文件。关闭、退出或切换时清理预览 URL、附件字节引用和内存草稿。公开文章附件不接入 Relationship 私密内容。
- 首次使用工作台前先完整部署包含新脚本、样式与生成页面的版本。浏览器发布后，本地维护先获取远端新提交并处理差异。

## Relationship 的私密边界

- 公开 `content.js` 仅含通用介绍；默认 `encrypted.js` 登记 `null`，没有预设密码和私密明文。
- 本地工具 `scripts/relationship.cjs` 使用 AES-GCM 256 位和 PBKDF2-SHA256 600000 次派生密钥。用户只在自己的交互终端输入并确认至少 12 字符的独立口令；不得通过聊天、参数或源码明文收集密码。
- 明文 JSON 放在项目外，或已被忽略且未被 Git 跟踪的 `.private/`；该目录拒绝跟踪、打包与公开部署，不得强制暂存或手动上传。公开仓库只保存生成密文和通用封面。
- 解锁内容仅在当前详情生命周期呈现，切换、关闭或主动锁定时清理。私密照片、明文备份和密码不能成为普通公开模块资源。

## 验证与交付

先装配，再运行 `npm run check` 和 `git diff --check`。`check` 只读验证，不应悄悄修复过期生成物。模块扩展、布局与交互修改必须实测桌面、手机视口及受影响的导航、详情、键盘和减少动态效果行为。

常驻预览没有热更新。修改并装配后必须刷新用户实际打开的预览标签，核对新版图片、结构、资源 URL 和计算样式，不能只验证新建测试标签或磁盘文件。普通导航点击须在正常动画下等待滚动和导航栏状态稳定，检查固定栏是否遮住目标标题、白框及首行内容；元素居中时可见或 hash 正确不能替代这项检查。导航公开 `--navigation-height`（桌面 76px、宽度 ≤760 时 104px）；共用分区锚点按此留白，Home 为 0，Academic 与 Life 再加 16px，避免顶部分隔与相框挤近导航。

按工作协议在模块测试记录中写明日期、浏览器版本、视口、模拟或真机、结果、问题与未覆盖项。已发现故障须修复并复测；没有运行的环境不能写为通过，也不能把一种内核的测试称为跨浏览器测试通过。

基础兼容性使用 `npm run test:compat`；博客与加密视图使用 `npm run test:features`；统一作者、加密连接缓存和双集合发布使用 `npm run test:author`；离线作者会话使用 `npm run test:author-security`；Relationship 算法使用 `npm run test:security`，正式密文格式使用 `npm run relationship:check`。作者密码配置工具为 `npm run author:password`，只在本地终端交互输入，测试不使用真实配置密码。按改动范围运行对应案例，测试数据与 GitHub 模拟不能替代真实部署或凭据验证。共用证据见 [兼容性记录](docs/COMPATIBILITY.md)，统一作者记录见 [author](docs/modules/author.md)，后续修改仍需重新验证。

照片及 PDF 扩展运行 `npm run test:photos`，实际测试照片处理、9 张与 18 MiB 边界、PDF 原字节与基本检查、3 份与 30 MiB 边界、顺序、英文描述、阅读链接、混合 ZIP、同提交发布、冲突与请求白名单，并回归零附件 Contents 发布。`npm run test:academic-profile` 验证 Publications 三分类、题名元信息、导航与外链，以及 About / Contact ORCID 和 Projects BESIII。只用临时附件及模拟 GitHub，不读取浏览器真实凭据，不替用户发表测试文章；旧测试记录不替代本轮结果。

粒子背景扩展使用 `npm run test:particle-simulation` 验证离线配置、局部规则、指针作用与数值边界，再使用 `npm run test:particles` 实测三内核、三视口、正常与减少动态效果、鼠标与触摸、配置、层级、暂停恢复、DPR、文件打开、失效回退及卸载。慢帧降级使用明确标注的人工负载，不能作为真实性能；诊断中的运动偏好按原生 change 事件维护。报告写入被忽略的 `artifacts/particle-results.json`，结果及限制同步 [粒子记录](docs/modules/particle-background.md)。

## Git 与发布协议

- 仓库根目录为本目录，`origin` 使用上述 HTTPS 地址获取，推送地址为 `git@github.com:PaulLi07/personal-homepage.git`，`main` 跟踪 `origin/main`。当前电脑已验证 SSH 推送；普通 `git push origin main` 使用该推送地址，不在配置中保存令牌。
- 开始先检查状态；同步或发布前获取远端，检查未提交用户改动和远端差异。保留远端历史，使用快进拉取，不硬重置用户文件或强制推送共享历史。
- 小范围任务可在 `main` 本地提交；跨模块或较大功能使用任务分支，检查后整合到本地 `main`。
- 2026-10-23 Apple 风格改版在 `feat/apple-homepage-design` 进行，原点为 `28880ba`，改版前回退分支为 `backup/pre-apple-design-2026-10-23`。用户已有的人像图片独立保留，不能因回退样式而用旧山水图覆盖；回退方法与图片备份见 [设计约定](docs/DESIGN-APPLE.md)。本轮尚未推送，当前设计授权不等于远端发布授权。
- 后续 Academic 专题精修分支为 `feat/academic-science-directory`，回退分支 `backup/pre-academic-science-2026-10-23` 指向 `c7cdd07`；尚未推送，保留前一轮分支及人像保护约定。
- **2026-10-14 发布授权：**用户确认当前效果并明确要求更新到 GitHub，允许将已验证的 `feat/emergent-particle-background` 快进整合到 `main` 并推送，取代 2026-10-11 暂不合并和推送的阶段约定。此次授权仅适用于当前版本，后续普通维护仍按发布请求推送。保留功能分支、`backup/pre-emergence-2026-10-11`（`93bf256`）及其他历史备份；发布前的远端版本另存 `backup/pre-publish-2026-10-14`（`3c8c364`）。先保存未提交改动再切回旧分支，不硬重置或强制覆盖。接口、参数与回退步骤见 [粒子维护指南](docs/PARTICLE-BACKGROUND.md)，本轮新功能须有独立实测记录，不能沿用旧通过结论。
- 本轮栏目布局之前的可回退点为 `backup/pre-section-layout-2026-10-11`（`3a2677c`），对应 166 文件旧包 `../outputs/personal-homepage-pre-section-layout-2026-10-11.zip`；它保留此前仅 About 为黑色粒子表面的版本。更早的 `93bf256` 由原备份保留；选择回退点时核对版本范围，不丢弃后续内容。
- 缓存与导航修复之前另有 `backup/pre-preview-fixes-2026-10-11`（`14f5bf6`）；此前 16:04 的 255 流程 / 12234 断言保留为历史。最终回归于 16:33–16:37 完成：基础九环境及正常 Life 导航 24 项、作者 144 流程、粒子 255 流程 / 12234 断言通过，生产源码未被测试修改、外部请求与真实写入为 0；详见 [粒子记录](docs/modules/particle-background.md)。照片 / PDF 专门矩阵及离线核心未重跑。当时仅本地交付；当前发布授权见上条。
- 本地提交属于已授权维护，只暂存本任务文件；提交说明采用 `feat:`、`fix:`、`style:`、`docs:`、`chore:` 加简短描述，保留无关改动。
- 框架或流程变化同步文档；模块扩展同步就近说明与测试记录，重要变化写入 `CHANGELOG.md`。
- 普通维护完成本地修改和提交；只有用户请求发布或推送时更新远端，不因长期维护自行创建定时任务。
- `npm run preview` 与 `npm run package` 先装配；源码包在仓库外生成 `outputs/personal-homepage-source.zip`，排除系统文件、Git 元数据、缓存和旧压缩包。
- 上传包的内部内容到远端仓库根目录，保留生成页面和模块资源。用户明确请求发布或推送时执行已授权发布，不重复索要许可。

用户提出新的长期维护要求时，同步记录在这里。
