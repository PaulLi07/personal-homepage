# 学术概览模块

提供 Experience、Publications、Notes、Projects 的路牌场景、图窗入口与精选论文。入口为 `#academic`，详情仍是 `#academic/<栏目>`，不改变日志、论文分类或作者功能。

## 文件与边界

- `section.html`：分隔线、标题、四行路牌、图窗、地面与人物挂载点。网页文案全部英文。
- `styles.css`：概览外壳、标题、精选论文与导航留白。
- `module.js`：初始化接线；场景位于独立的 [exploration/](exploration/README.md)，不再在入口中混合轮播、动画与论文业务。
- 四个详情子目录分别维护自己的内容、数据、封面和中文说明；图窗直接引用各自封面，不新建重复图片目录。
- Projects的[项目目录](projects/README.md)先展示Physics Maps和Physicists，再在Physics Maps子项目内展示独立地图入口，中微子与暗物质地图的源码、档案、数据、图片及重建工具均归其子目录，不依赖原HEP工作目录；不把地图交互逻辑并入Academic场景。

## 当前布局与行为

当前采用紧凑构图：桌面左下路牌、中部左移16:9图窗、右侧三冠交叠椰林，取消整排顶部留白和超长树干。1440视口图窗约x355、792×445.5px，场景高约728px；≥1800px把主体收拢到居中的1800px范围，地面和分隔仍全宽。≤760px照片占内容全宽，路牌与椰林在下方共同接地；手机不强迫树冠高于照片。两SVG均720×1120，图窗和文字在树前、背景透明、粒子规则保持。维护参数和素材版本见[场景说明](exploration/README.md)，实际验证见[最新记录](../../docs/modules/academic.md#compact-grove-2026-10-24)。

图窗默认每5秒循环四栏。悬停或聚焦路牌显示对应图片，点击进入详情；图窗悬停/聚焦锁定当前目标，点击进入当前栏。键盘焦点优先于其他行悬停。离开后重新等待完整周期；页面隐藏、场景离屏、详情打开及减少动态效果各自控制暂停，彼此不覆盖。减少动态效果停轮播和人物，保留手动入口。

## 公开接口与维护

- 通过 `details.getItem()` 获取栏目标题和说明，以 `details.open()` 打开详情；`details.onSelect()` 同步图窗并在销毁时退订。不读取其他模块私有DOM或数据文件。
- 精选论文经 `Homepage.getPublicationCategories()` 取arXiv首条，否则首个非空分类首条；缺失、抛错或全空则隐藏。保留分类深链、修饰键点击及焦点/滚动恢复。
- 根声明 `data-particle-surface="black"`，外壳 `data-particle-foreground`；照片框、地面及论文横栏显式排除粒子。路牌、立柱和椰林使用透明前景合成，不对整块导航、树或人物路径做矩形排除：真实木板/墨线遮住白点，空隙透出粒子。椰林必须用透明SVG的CSS背景，不能换回会被自动整框排除的img。图注继续透明，不修改粒子服务的全局识别规则。
- 调轮播/步速编辑 `exploration/config.js`；布局编辑 `exploration/scene.css`；换封面编辑对应子目录。声明顺序在 `app/site.json`。两份在线文章数据的 `liveScripts` 规则保持。
- 修改源文件后 `npm run assemble`、`npm run check`、`npm run test:academic-scene`，刷新实际预览并检查桌面/手机、轮播、键盘、详情和导航落点。根页面为生成物，禁止手改。

本轮分支 `feat/academic-exploration-scene`；回退点 `backup/pre-academic-scene-2026-10-23` 指向 `ed981de`。用户已有未提交人像保留原字节，不能因回退样式覆盖。实测与限制见 [记录](../../docs/modules/academic.md#academic-scene-2026-10-23)，尚未推送。

2026-10-23后续路牌优化仅影响导航与地面造景：独立 `comic.css` / `sign-plank.svg` / `grass.svg` 维护纸面、侧板厚度、排线、草簇和土层；原轮播、入口及人物业务不变。说明及调参见场景README，验证见 [本轮记录](../../docs/modules/academic.md#academic-comic-2026-10-23)。

同日进一步将人物略放大为40×46px，新增独立动作素材/导演/骨架及加权随机衔接；外壳仍由场景挂载，原导航、路牌、草地和图窗行为保持。调参、扩展与验证见 [人物动作库](exploration/character/README.md) 及 [本轮记录](../../docs/modules/academic.md#walker-actions-2026-10-23)。

2026-10-23后续精修：图注透明透出粒子，移除播放/暂停按钮但保留自动轮播及所有条件暂停；辅助文字适度放大，人物外壳高60px。精选论文与Publications共用[本地公式排版](../../shared/math/README.md)，保留纯文本回退。当前验证见[记录](../../docs/modules/academic.md#readability-math-2026-10-23)。

## 2026-10-23：全幅场景

外壳横向不再使用全局gutter，分隔线、场景与草地铺满可用宽度，图窗延伸到右边缘。文字使用局部 `--academic-inset`（桌面24–32px，手机18–20px）；路牌实际宽度280–360px，不随超宽屏无限放大。图窗最高560px、焦点内描边，图注继续透明透出粒子；轮播、动作、资料与路由不变。草地采用同一SVG原比例横向接续，避免拉长草簇。回退 `backup/pre-edge-layout-2026-10-23`（`073d6b3`），本轮仅本地更新；实际证据见[记录](../../docs/modules/academic.md#edge-layout-2026-10-23)。


## 2026-10-23：构图比例修正与叶树

本次按用户反馈取代上一轮“图窗延伸贴右”规则：图片恢复正常16:9，由三段构图中的中栏控制宽度，取消560px限高；右侧增加原创 `exploration/tree.svg`，与路牌保持黑白纸面、墨线和排线。树为无交互装饰，通过 `aria-hidden`、空alt与 `pointer-events:none` 隔离辅助技术和入口操作，并声明粒子排除。地面继续横向贯穿，路牌、树根与60px人物共享同一基线。相关脚本、轮播、透明图注、详情路由不变。实际预览和兼容性由主维护流程记录；本说明不把静态检查当作实测。

分支 `style/balanced-about-academic`，回退 `backup/pre-balanced-composition-2026-10-23`（`2dcad80`）；本次实测见[记录](../../docs/modules/academic.md#balanced-composition-2026-10-23)，未请求推送。

## 2026-10-24：椰子树与透明造景

当前规则取代上一轮宽叶树与760px图窗：三株椰林独立归 `exploration/coconut-palms.svg`，旧tree.svg已移除；路牌与树外层透明，前景合成显示空隙粒子。布局和树宽集中在scene/comic样式，脚本与详情接口不变。回退 `backup/pre-academic-palms-2026-10-24`（`4d84c60`），分支 `style/academic-coconut-palms`；实测见[记录](../../docs/modules/academic.md#coconut-palms-2026-10-24)，未授权推送。

同日用户进一步纠正高度：树冠必须高于图片，图片适度缩小，取代上一轮下缘矮椰林。两份SVG分别重新加长原生树干，CSS联动树宽、根基线和照片上方留白；不能用整图纵向拉伸替代。回退 `backup/pre-tall-palms-2026-10-24`（`c9848a9`），分支 `style/academic-tall-palms`；验证见[记录](../../docs/modules/academic.md#tall-palms-2026-10-24)。

2026-10-25小幅右移：图片与椰林通过本模块 `--scene-shift` 一同移动8–16px，保留原尺寸和SVG；≤760px偏移为0以保留完整相框。路牌杆与对应底部空间增加12px，根部仍接地。回退 `612895b`，本次验证见[记录](../../docs/modules/academic.md#front-layout-2026-10-25)。

## 2026-10-25：Projects实验地图集

Projects新增Experiment Atlas目录，桌面两列直角卡片、手机单列，保留下方BESIII Collaboration与GitHub链接。卡片进入各地图独立全宽页面，公共顶栏可返回Projects或切换地图；原Academic路牌、图窗、人物、粒子及其他详情的接口不变。

中微子252条、暗物质297条，549份完整英文档案及549张代表图片全部保存在个人主页。每张地图独立重建索引与 `assets/preview.svg`，地图登记、入口统计和顶栏经公开接口及小型胶水连接。新增地图同时登记 `projects/experiment-atlas/registry.js` 和 `app/site.json` 的Academic `standalonePages`；日常维护无需原Web目录。命令、资源边界及新增流程见[地图集README](projects/experiment-atlas/README.md)，本轮兼容性和未覆盖项统一见[接入记录](../../docs/modules/experiment-atlas.md)。

2026-10-27：Projects项目层级与地图返回路径已更新，Physicists目前仅占位，具体内容以后提供；目录/子项目独立说明和实际验证见[Projects记录](../../docs/modules/academic-projects.md#project-directory-2026-10-27)。上述2026-10-25地图直接入口描述保留为历史。
