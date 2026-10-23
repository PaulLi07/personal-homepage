# 学术探索场景

Academic自己的表现子模块：路牌、悬浮图窗、地面和步行人物。只通过父模块挂载，不另注册分区或共用服务。

| 文件 | 职责 |
|---|---|
| `config.js` | `intervalMs`轮播间隔、`walkDurationMs`人物往返周期、`stepDurationMs`步态周期，均为毫秒 |
| `gallery.js` | 图窗选择、四栏循环、独立暂停原因、视口/页面可见及动态偏好 |
| `navigation.js` | 路牌和图窗的鼠标、触摸、焦点、点击入口 |
| `walker.js`、`walker.css` | 创建线描SVG、往返与步态、暂停和清理 |
| `walker.svg` | 无脚本的静态人物回退 |
| `featured.js` | 通过Publications公开getter展示已有精选论文 |
| `scene.js` | 连接图窗、导航、人物与详情订阅，提供清理函数 |
| `scene.css` | 图窗/路牌高低关系、控件与响应式布局 |
| `comic.css`、`sign-plank.svg` | 黑白漫画路牌、侧板排线、纸面、立柱与选中/焦点样式 |
| `grass.svg` | 原创SVG草簇、地表排线与土层；手机裁取局部而非压缩整幅 |

`Homepage.academicExploration`仅作为Academic自己的命名空间；按上述配置、工厂、胶水顺序由清单加载。`mountScene({root,details,reducedMotion})`只接收父级传入的场景节点、公开详情服务和MediaQueryList，返回幂等清理函数；调用时释放详情订阅、导航监听、定时器、观察器和人物。正常页面卸载清理；往返缓存保留实例。

`createGallery()`提供 `select(key)`、`hold(reason,active)`、`getKey()`、`destroy()`；导航只调用这些接口，不操作轮播内部状态。`mountWalker()`独立返回 `destroy()`，不依赖轮播脚本。场景内的公开 `data-scene-*` 属性连接结构；`data-academic` / `data-preview` 保留既有四栏键。

轮播每次使用一个定时器，恢复后完整等待间隔，避免后台积压。鼠标/键盘暂停互相独立，触摸不留下hover状态。图窗已离屏时不将其作为详情过渡起点，避免手机详情从屏幕外飞入。图窗不设 `aria-live`，避免自动轮播反复朗读；播放/暂停按钮有英文说明。详情暂停只读公开URL，通过focus、history和原生close信号同步，不读取共用弹窗内部节点。

布局在 `.academic-scene` 集中定义 `--sign-width`（桌面30%）、`--pole-height` 和 `--ground-line-offset`。步行路径宽度及位置由父场景控制，人物内部尺寸32×38px。减少动态效果由CSS与脚本共同停止；人物为装饰、隐藏于辅助技术，不承担点击。

验证命令 `npm run test:academic-scene` 是Node VM离线行为验证，不能替代浏览器。真实预览见 [Academic测试记录](../../../docs/modules/academic.md#academic-scene-2026-10-23)。说明用中文，网页内容用英文。

## 黑白漫画造景

路牌采用四块轻微错落的箭头木牌，SVG内绘正面墨线、螺钉、纸面微痕及斜线侧板；厚度位于按钮自身框内，不裁切按钮或焦点框。选中项只反相装饰底图和文字，不改变其他区的蓝色强调。完整导航外层声明粒子排除，防止细小白点覆盖侧板和立柱。

地面资产为1280×96 SVG，地表基线位于y≈26，因此脚底/立柱共同使用 `--ground-line-offset:70px`（96−26）。草地在场景内部占96px高，不覆盖精选论文；手机将草图至少保持700px宽并裁取局部，避免草簇压缩成栅栏。调画幅或基线时须同时核对脚底、立柱与草地位置。所有SVG为本站代码绘制，无位图生成、外部字体或新运行时依赖。

实测见 [漫画本轮记录](../../../docs/modules/academic.md#academic-comic-2026-10-23)。回退点 `backup/pre-academic-comic-2026-10-23`（`7e4425c`），任务分支 `style/academic-comic-signpost`。未请求发布时只在本地维护。
