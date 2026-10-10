# 生活概览模块

展示散落照片与 Moments、Travels、Creations、Relationship 四个生活栏目的入口。

- 入口：`#life`；详情为 `#life/<栏目>`。
- 文件：`section.html` 保存照片按钮，`styles.css` 管位置与手机布局，`module.js` 管本区点击及照片漂移，`images/background.jpg` 保存独立背景。四个子目录各自维护内容与封面。
- 接口与边界：注册 `life` 分区，初始化接收 `{ root, details, reducedMotion }`；通过详情服务打开栏目，只查询本区元素。减少动态效果时应停止照片漂移。
- 扩展：Moments 独立保存博客数据、读者视图与作者发布；Relationship 独立保存密文和解锁逻辑。公开封面不受访问密码保护；私密内容不能放在通用 content.js 或 images/ 中。
- 维护：改故事与照片编辑对应子目录；增加栏目时补本区入口和样式，并声明内容脚本。背景可单独替换，修改 creations 封面不影响本区背景。
- 验证：[兼容性测试记录](../../docs/modules/life.md)；改动后关注四栏目入口、散落布局、手机照片点击、详情与减少动态效果。

本说明使用中文；片段和数据中的网页文字使用英文。修改源文件后装配，不手改根目录生成页面。
