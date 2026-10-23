# 简介模块

入口 `#about`：横向照片相册、右侧基本资料和照片下方无标题个人说明。桌面左侧约60%，相册3:2；≤900px改为照片→资料→个人说明。纯黑背景与粒子风格保持。

## 文件与边界

- `section.html`：首张静态照片、图内控件、真实资料及可编辑的英文个人说明；无脚本时保留首张和全部资料。
- `styles.css`：整体布局、资料列表、说明与手机适配；相册视觉单独交给 `gallery/styles.css`。
- `module.js`：只把相册节点和动态偏好传给 `Homepage.aboutGallery.mount()`。
- [gallery/](gallery/README.md)：本模块独立的照片清单、轮播行为、样式和素材，不读取Academic轮播的私有实现。
- `images/portrait.JPG` 是用户原始人像（Git登记名为portrait.jpg），本次保留原字节；网页使用 `gallery/images/portrait-landscape.jpg` 缩放副本。

## 外观与交互

相册无图下控制条：左右箭头浮在图片两侧，序号 `1 / 03` 以半透明小浮层放在图片底部中间；来源链接和小型暂停图标也在画幅内。每6秒淡入切图，支持手动切换、键盘和水平滑动，悬停/聚焦、离屏、后台、详情与减少动态效果各自控制暂停。单图或加载失败保留可读回退。

右侧只展示已提供的姓名、研究生身份、南开大学、理论物理、邮箱及ORCID；资料变更时同时核对首页/Contact重复信息。个人说明直接编辑片段的 `.about-statement`，不加标题、不编造具体经历。

根节点声明 `data-particle-surface="black"`，标题与内容声明 `data-particle-foreground`；整个照片框显式 `data-particle-exclude`，图片与浮层保持干净，周围空白及说明区域透明。

## 维护与验证

照片及速度修改 `gallery/photos.js`，每张维护路径、英文alt、尺寸、裁切焦点、署名与占位标记。新增文件放本模块相册内，换图后同步内容SHA12缓存键、英文署名页和来源说明；首张同时更新片段静态回退。素材与原图保护见 [说明](gallery/images/README.md)。

装配后运行 `npm run check`、`npm run test:about-gallery` 和 `git diff --check`，刷新用户原预览标签，检查桌面/手机、真实导航落点、图内控件位置、相册比例、人物裁切、长邮箱、粒子排除、计时与键盘。离线夹具不能替代浏览器实测。

本轮分支 `feat/about-photo-gallery`，回退 `backup/pre-about-gallery-2026-10-23`（`6cf69f5`），未授权推送。实际结果及未测试项见 [本轮记录](../../docs/modules/about.md#about-gallery-2026-10-23)。说明中文，网页全部英文，生成页面禁止手改。
