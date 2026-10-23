# 简介照片相册

相册只负责 About 照片清单与图内轮播，不读取 Academic、Life 或作者模块内部状态。外层资料和无标题说明仍由 `../section.html` 与 `../styles.css` 维护。

## 文件与接口

- `photos.js`：公开冻结配置 `Homepage.aboutGallery.config`；`intervalMs` 默认 `6000`，`photos` 顺序即播放顺序。每项含 `id`、仓库相对 `src`、英文 `alt`、原图 `width/height`、裁切焦点 `position`、英文 `credit` 和 `placeholder`。
- `gallery.js`：`Homepage.aboutGallery.mount({ root, reducedMotion, config? })` 返回 `{ destroy() }`。`root` 是照片框 `[data-about-gallery]`；配置缺省读取上述公开清单。父模块只负责调用；控制器自身管理页面离开和往返缓存清理。
- `styles.css`：相册直角画幅（优先3:2、最高680px）、淡入、两侧箭头及图内底部半透明序号/播放按钮；照片下方不另设控件条。
- `images/`：相册自己的照片副本/展示衍生图。用户原始 `../images/portrait.jpg` 保留原字节，不直接压缩覆盖；来源及缓存键同步维护在素材清单。

HTML 保留第一张静态 `[data-gallery-fallback]`，即使脚本缺失仍能显示图片。容器使用 `[data-gallery-slides]`，控制器追加其余 `img.about-gallery__slide`；`is-active` 表示当前图。两侧按钮为 `[data-gallery-prev]` / `[data-gallery-next]`，播放按钮为 `[data-gallery-toggle]`，均在静态 HTML 中默认隐藏，至少两张图解码可用后才启用。`[data-gallery-index]` 表示可用/待加载照片中的序号；坏图从总数中排除。`[data-gallery-announcement]` 只朗读手动切换，避免自动轮播持续播报。`[data-gallery-credit]` 保留 `credits.html` 链接并更新当前图的英文无障碍署名。

## 行为与维护

- 一次仅有一个六秒定时器；切换和恢复后重新等待完整周期。图片完成加载与解码后才切入；加载失败或解码拒绝会跳过。仅剩一张可用图时隐藏箭头/播放控件，全部失败时保留原静态节点与替代文字。
- 悬停、焦点在相册内、触摸手势进行中、离屏、后台、公开详情 URL、BFCache 暂存均暂停。手动暂停独立保留，移出鼠标不会误恢复；明确点击 Play 会即时放开当下的悬停/焦点暂停，下一次进入或焦点移动重新启用这些约束，仍不能绕过离屏/后台/详情/减少动态效果。
- 减少动态效果时关闭自动轮播并隐藏播放按钮，仍可用箭头、左右键和水平触摸翻页。触摸监听不取消默认事件，配合 CSS `touch-action: pan-y` 保留纵向滚动；垂直或过短手势不切图。
- 详情暂停只识别公开 `#academic/...` / `#life/...` URL；关闭事件后的微任务重新核对 URL，不读取共享弹窗私有 DOM。
- 同一根节点重挂载先清理旧实例；`destroy()` 幂等，清理定时器、观察器、监听、追加图片并还原静态首图和控件。真正离开页面时销毁；BFCache 恢复则保留当前图并完整重新计时。迟到解码及排队微任务不能复活已销毁实例。
- 图片 `src` 只接受 `modules/about/` 内的相对 JPEG/PNG/WebP 路径及可选 `?v=` 缓存键，拒绝协议、跨目录和 `..`；文字用安全属性/`textContent` 写入，不解释 HTML。替换图片时同步英文 `alt`、尺寸、焦点、署名及内容散列缓存键。
- 根节点只公开 `data-gallery-state="playing|held|paused|reduced"` 和零基 `data-gallery-index` 供诊断；外层照片框保持 `data-particle-exclude`，周围黑色留白继续显示粒子。

## 验证

执行 `node scripts/test-about-gallery.cjs`（根命令登记后可用 `npm run test:about-gallery`）。离线夹具覆盖单定时器、循环/手动重计时、延迟解码/坏图、暂停原因、明确 Play、动态偏好旧监听、键盘/手势、可见性降级、BFCache、真正离开、重挂载/清理与安全输入；不读取浏览器真实资料或凭据。

浏览器桌面、手机模拟视口、粒子裁剪、导航定位与真实图片效果由父任务实际预览，环境、结果和未覆盖范围写入 [About 测试记录](../../../docs/modules/about.md)。离线 DOM 测试不能代替真实浏览器布局、真机触摸或其他内核验证。
