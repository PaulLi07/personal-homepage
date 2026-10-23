# 学术概览模块

提供 Experience、Publications、Notes、Projects 的路牌场景、图窗入口与精选论文。入口为 `#academic`，详情仍是 `#academic/<栏目>`，不改变日志、论文分类或作者功能。

## 文件与边界

- `section.html`：分隔线、标题、四行路牌、图窗、地面与人物挂载点。网页文案全部英文。
- `styles.css`：概览外壳、标题、精选论文与导航留白。
- `module.js`：初始化接线；场景位于独立的 [exploration/](exploration/README.md)，不再在入口中混合轮播、动画与论文业务。
- 四个详情子目录分别维护自己的内容、数据、封面和中文说明；图窗直接引用各自封面，不新建重复图片目录。

## 当前布局与行为

桌面路牌占内容宽30%，插在左侧地面上；顶部约落在右侧横向图片中部至下半部。手机宽度≤760px时图片在上，路牌与地面在下，不硬缩30%比例。保持直角、常规字体和纯黑背景；取代此前四张正方形入口。地面与线描人物使用 SVG/CSS，无图片生成或新外部依赖。

图窗默认每5秒循环四栏。悬停或聚焦路牌显示对应图片，点击进入详情；图窗悬停/聚焦锁定当前目标，点击进入当前栏。键盘焦点优先于其他行悬停。离开后重新等待完整周期；手动暂停、页面隐藏、场景离屏、详情打开及减少动态效果各自控制暂停，彼此不覆盖。减少动态效果停轮播和人物，保留手动入口。

## 公开接口与维护

- 通过 `details.getItem()` 获取栏目标题和说明，以 `details.open()` 打开详情；`details.onSelect()` 同步图窗并在销毁时退订。不读取其他模块私有DOM或数据文件。
- 精选论文经 `Homepage.getPublicationCategories()` 取arXiv首条，否则首个非空分类首条；缺失、抛错或全空则隐藏。保留分类深链、修饰键点击及焦点/滚动恢复。
- 根声明 `data-particle-surface="black"`，外壳 `data-particle-foreground`；图窗、路牌、立柱、人物路径、地面及论文横栏由本模块显式排除粒子。新增SVG或CSS背景图同样要声明排除，不能依赖粒子服务猜测。
- 调轮播/步速编辑 `exploration/config.js`；布局编辑 `exploration/scene.css`；换封面编辑对应子目录。声明顺序在 `app/site.json`。两份在线文章数据的 `liveScripts` 规则保持。
- 修改源文件后 `npm run assemble`、`npm run check`、`npm run test:academic-scene`，刷新实际预览并检查桌面/手机、轮播、键盘、详情和导航落点。根页面为生成物，禁止手改。

本轮分支 `feat/academic-exploration-scene`；回退点 `backup/pre-academic-scene-2026-10-23` 指向 `ed981de`。用户已有未提交人像保留原字节，不能因回退样式覆盖。实测与限制见 [记录](../../docs/modules/academic.md#academic-scene-2026-10-23)，尚未推送。
