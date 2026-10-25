# Life 拍立得照片堆

只负责四个生活入口的选中、层级、花体标题和打开动作；不解释Moments文章、作者权限、Relationship密码或其他详情业务。

| 文件 | 职责 |
|---|---|
| `config.js` | `Homepage.lifeStack.config`；默认入口与各入口英文标题/可选说明 |
| `controller.js` | 鼠标、键盘、触摸/笔输入，有限层级、动态偏好与清理 |
| `styles.css` | 拍立得纸边、固定坐标/转角、手机浅堆叠、黄色标题和局部字体 |
| `fonts/` | 本地Kaushan Script / Caveat WOFF2、中文来源说明及SIL OFL 1.1原许可 |

父 `section.html` 保留静态按钮与英文标题回退；父 `styles.css` 管黑底、标题和生活语录；父 `module.js` 只注册分区并挂载/清理。`app/site.json` 按配置→控制器→父胶水加载普通脚本，不增加框架、远程请求或共享层业务。

## 接口与输入

- `Homepage.lifeStack.mount({ root, details, reducedMotion, config? })` 返回 `{ destroy }`。`root` 为 `[data-life-stack]`；入口为 `button[data-life]`，内部 `img` 作为详情过渡源；英文动态标题/可选说明节点为 `[data-life-title]` / `[data-life-description]`。
- 仅调用公开 `details.open("life", key, { trigger, source })`；原四栏目路由、别名、弹窗、历史及焦点恢复由详情服务管理。
- 默认Moments置顶。鼠标经过立即选中，离开保留；只改变1–4层级与纸面微抬，不交换照片底座、不自动循环、不随滚动漂移。四张都要保留外露入口。
- Tab聚焦置顶，原生Enter/Space或辅助技术点击直接进入。键盘焦点优先于其它卡片的鼠标经过；失焦或指针按下后允许鼠标接管。
- 触摸/笔先点下层照片只置顶，再点正面进入；当前正面可一次轻点进入。输入类型来自事件，不以视口宽度推断；必须保持 `pointerenter→pointerdown→focusin→click` 顺序下的首次轻点规则。
- 减少动态效果直接切换层级，取消纸面抬升与标题过渡。无时钟、滚动监听或网络请求；重复挂载先清理旧实例。`destroy()` 可重复调用，移除局部/全局监听并恢复初始属性、文字、层级与样式；父胶水保留往返缓存实例，真正离页才销毁。

## 样式与维护

照片图像为3:2、白色直角纸边。黄色标题使用本地Kaushan Script，照片标签与白色语录使用本地Caveat；全站其它信息保持正常系统字体。两字体只用于Life，`font-display: swap`并有系统手写字体回退；许可与来源见[字体说明](fonts/README.md)，随网站分发必须保留原版权和OFL文件。

构图集中在本模块CSS的 `--card-x` / `--card-y` / `--card-turn`，标题落点为 `--title-x` / `--title-y` / `--title-turn`，黄色为 `--life-yellow`。手机采用浅堆叠并扩大左下Moments露边，不能以旧错落双列规则覆盖；改动坐标后重新检查每一种前后层级下四卡是否可触达。标题不接收指针，最长的Relationship需要单独核对溢出。

每个照片按钮含白边使用 `data-particle-exclude`，照片堆整体与黑色间隙透明，父模块以公开前景属性承接粒子层级；不读取或更改粒子服务私有实现。更换封面仍在所属栏目目录维护，修改配置标题同步HTML静态回退与英文无障碍名称。

## 验证与回退

`npm run test:life-stack` 进行离线输入顺序、焦点优先、有限层级、详情参数、销毁/重挂载及往返缓存回归；本次离线15流程、101断言通过。它不验证实际叠层命中、字体绘制、手机触摸或浏览器兼容性。装配并检查后必须刷新原预览，实测四卡可触达、标题、四详情、键盘、减少动态效果和粒子边界；本轮完整实测由[Life记录](../../../docs/modules/life.md)登记。

任务分支 `feat/life-polaroid-stack`；备份 `backup/pre-life-polaroids-2026-10-25` 指向 `0783998`。恢复前保留当前工作及用户未提交图片，不硬重置或强制推送；本次只在本地维护。
