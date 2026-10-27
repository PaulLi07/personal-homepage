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

## 项目与维护

Projects直接提供Physics Maps与Physicists两张对齐图文入口。Maps包含中微子/暗物质两图；Physicists一步打开完整人物档案并返回Projects。BESIII Collaboration入口已移除，论文与Internal note保留。两项目源码、图片、规范数据及SQLite维护适配器全部在所属模块，不依赖原HEP目录。

[项目目录](projects/README.md)、[数据库维护](../../docs/DATA-MAINTENANCE.md)与[本轮记录](../../docs/modules/project-data-maintenance.md)。本次架构更新不改学术场景、字体、粒子、图片或交互；旧构图演变见[历史](../../docs/history/pre-maintenance-2026-10-27/modules__academic__README.md)。
