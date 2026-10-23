# 学术探索场景

Academic自己的表现子模块：路牌、悬浮图窗、地面和步行人物。只通过父模块挂载，不另注册分区或共用服务。

| 文件 | 职责 |
|---|---|
| `config.js` | `intervalMs`轮播间隔及独立 `walker` 尺寸/速度/动作权重配置 |
| `gallery.js` | 图窗选择、四栏循环、独立暂停原因、视口/页面可见及动态偏好 |
| `navigation.js` | 路牌和图窗的鼠标、触摸、焦点、点击入口 |
| `walker.js`、`walker.css` | 人物外壳与挂载、绘制节流、暂停恢复和清理 |
| `character/` | 独立动作素材、加权导演和SVG骨架，见就近README |
| `walker.svg` | 无脚本的静态人物回退 |
| `featured.js` | 通过Publications公开getter展示已有精选论文 |
| `scene.js` | 连接图窗、导航、人物与详情订阅，提供清理函数 |
| `scene.css` | 图窗/路牌高低关系、控件与响应式布局 |
| `comic.css`、`sign-plank.svg` | 黑白漫画路牌、侧板排线、纸面、立柱与选中/焦点样式 |
| `grass.svg` | 原创SVG草簇、地表排线与土层；手机裁取局部而非压缩整幅 |
| `coconut-palms.svg`、`coconut-palms-mobile.svg` | 桌面/窄屏原生高椰林：叶冠比例相同，分别加长曲干及环纹；纯装饰，透明CSS背景接入 |

`Homepage.academicExploration`仅作为Academic自己的命名空间；按上述配置、工厂、胶水顺序由清单加载。`mountScene({root,details,reducedMotion})`只接收父级传入的场景节点、公开详情服务和MediaQueryList，返回幂等清理函数；调用时释放详情订阅、导航监听、定时器、观察器和人物。正常页面卸载清理；往返缓存保留实例。

`createGallery()`提供 `select(key)`、`hold(reason,active)`、`getKey()`、`destroy()`；导航只调用这些接口，不操作轮播内部状态。`mountWalker()`独立返回 `destroy()`，不依赖轮播脚本。场景内的公开 `data-scene-*` 属性连接结构；`data-academic` / `data-preview` 保留既有四栏键。

轮播每次使用一个定时器，恢复后完整等待间隔，避免后台积压。鼠标/键盘暂停互相独立，触摸不留下hover状态。图窗已离屏时不将其作为详情过渡起点，避免手机详情从屏幕外飞入。图窗图片单独声明粒子排除；下方标题、说明和进度背景透明并允许粒子显示。图窗不设 `aria-live`，避免自动轮播反复朗读；无播放/暂停按钮，仅显示页序和四段进度装饰。详情暂停只读公开URL，通过focus、history和原生close信号同步，不读取共用弹窗内部节点。

布局变量集中于 `.academic-scene`：`--palm-width` 决定树宽，`--palm-root-height` 用原生根坐标推导共同地面，`--photo-top` 在最低叶尖下留空；`--sign-width`、`--pole-height` 与 `--ground-line-offset` 控制路牌接地。桌面照片宽取可用轨道减右侧树干空间与树宽×2.3的较小值，16:9不设限高，宽屏靠右平衡构图。窄屏改为75%左侧照片、右侧长树干、图下路牌；弹性顶部留白保证路牌脚不悬空。人物高60px，路径仍归父场景。修改文案或字号后须重新检查内容高度是否压低树冠。

验证命令 `npm run test:academic-scene` 是Node VM离线行为验证，不能替代浏览器。真实预览见 [Academic测试记录](../../../docs/modules/academic.md#academic-scene-2026-10-23)。说明用中文，网页内容用英文。

## 黑白漫画造景

路牌采用四块轻微错落的箭头木牌，SVG内绘正面墨线、螺钉、纸面微痕及斜线侧板；厚度位于按钮自身框内，不裁切按钮或焦点框。选中项只反相装饰底图和文字。按2026-10-24要求，导航/牌组/立柱/椰林外层不做整矩形粒子排除，透明空隙用既有前景层合成；真实木板和墨线保持可读。椰林使用CSS背景，不放img节点；照片框与实体草地继续显式排除。

地面资产为1280×96 SVG，地表基线位于y≈26，因此脚底/立柱共同使用 `--ground-line-offset:70px`（96−26）。草地在场景内部占96px高，不覆盖精选论文；当前通过同SVG的1280×96背景按原比例水平接续，宽屏不拉长，手机裁取局部；原img资源节点保留但隐藏，照片框和地面显式排除粒子。调画幅或基线时须同时核对脚底、立柱与草地位置。所有SVG为本站代码绘制，无位图生成、外部字体或新运行时依赖。

实测见 [漫画本轮记录](../../../docs/modules/academic.md#academic-comic-2026-10-23)。回退点 `backup/pre-academic-comic-2026-10-23`（`7e4425c`），任务分支 `style/academic-comic-signpost`。未请求发布时只在本地维护。

## 随机动作人物

人物采用 [独立动作库](character/README.md)：六种日常动作加转身连接片段，以共用站姿和五次缓动衔接；根位移与整数步态共同渐入/渐出。动作不连续重复，最多两段静态动作后继续行走，窄屏边缘也能随机停留。离屏/后台/详情/动态偏好暂停冻结动作进度，恢复不补算离开时间。动作、调度、SVG渲染、生命周期互不混合，参数在 `config.js` 的 `walker`。当前验证见 [记录](../../../docs/modules/academic.md#walker-actions-2026-10-23)。

全幅场景（2026-10-23后续）：标题、图注和精选行使用模块局部 `--academic-inset`，分隔/场景/地面本身无横向外边距；图窗贴右且最高560px。图片入口使用内嵌焦点边框，避免屏幕边缘裁断。模块行为及公开接口未改；本轮实际验证见[记录](../../../docs/modules/academic.md#edge-layout-2026-10-23)。


## 椰林与透明合成（2026-10-24）

当前高椰林使用桌面720×1660、窄屏720×2940两份原生SVG，根基线分别y1647/y2927，底部均留13px；三组叶冠几何和比例相同，只重新加长曲干与环纹。最低叶冠含描边约y452.15，校验保守用y453；不能只看冠心或容器顶部。CSS按画幅保持比例，bottom用13px对应的缩放补偿；树冠完整在照片上方，树根落草地。素材无背景矩形、整体树冠填充、滤镜、外部引用；`comic.css` 管透明、层级与接地，`scene.css` 管联动布局。树为 `aria-hidden` / `pointer-events:none` 装饰；图片/文字在树前，不遮入口与焦点，空白仍透出粒子。

检查时除了图片比例、320px文字和共同接地，还须确认没有祖先排除整块装饰、没有树img自动遮罩，并观察透明空隙中的粒子运动；不能仅看CSS背景色或无横向溢出。回退 `4d84c60`，分支 `style/academic-coconut-palms`，实际验证见[本轮记录](../../../docs/modules/academic.md#coconut-palms-2026-10-24)。

高树冠修正回退为 `c9848a9`、分支 `style/academic-tall-palms`。本次实际高度、最低叶尖间距、布局和兼容性见[最新记录](../../../docs/modules/academic.md#tall-palms-2026-10-24)。
