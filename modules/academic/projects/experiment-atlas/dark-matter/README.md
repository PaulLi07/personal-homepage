# 暗物质实验世界地图

本目录是主页中的独立英文地图模块，公开入口为 `index.html`。网页、JavaScript、样式、SVG地图、完整英文档案、实验图片与维护工具全部保存在本目录内。删除初次迁移来源目录不影响网页运行或本地索引维护；不要建立符号链接或重新读取外部档案。

## 文件与边界

- `index.html`：英文页面；`js/` 分别负责目录数据、地图、筛选、档案和历史导航。
- `reference.css`、`styles.css`、`viewer.css` 与 `assets/`：原地图设计和原生地图素材。
- `archive/<id>/record.json`：唯一完整英文档案，按需加载；其图片只归同一档案的 `images/`。
- `data/catalog-schema.json`：英文类别、技术、地区、状态、统计口径与资料更新日期。
- `data/catalog.json`：由档案生成的浏览摘要，不复制完整正文。
- `data/geography-notes.json`：原有地理处理理由与计数，本地重建时同步计数；审计说明不作为网页正文显示。
- `data/import-manifest.json`：初次迁入来源的相对路径、源记录SHA256、源图像SHA256及网页图像SHA256；是出处记录，不是运行时路径表。
- `tools/build_data.py`：只读取本目录记录与图像，重建或检查索引；Python 3.9+标准库即可。
- `tests/`：已迁移为本地图相对路径的原检索、数据与导航回归。

页面需要普通HTTP/HTTPS静态服务加载独立JSON；通过主页本地预览或GitHub Pages打开。直接双击HTML会显示英文说明。无CDN、在线地图、远程字体或本机专用服务依赖。官方项目、论文与图片出处链接仍为外部参考链接，点击后访问相应来源。

## 日常维护

修改 `archive/<id>/record.json` 的英文正文和引用后运行：

```sh
python3 tools/build_data.py
python3 tools/build_data.py --check
node --test tests/*.test.mjs
```

目录日期 `data/catalog-schema.json` 的 `updated` 表示资料更新日期；仅迁移或重新部署不能冒充科学内容更新。档案中的 `status.as_of` 保留其证据日期，与目录更新时间不同。

增加实验时新建 `archive/<小写id>/record.json` 和所需图片。保持既有结构、英文文案、来源、图注与复用说明，并设置 `map_navigation.regions` 和 `map_navigation.technology_groups`。这些是明确审核过的导航归组，不根据合作机构总部或未经确认的经纬度自动推断。新类别或地区先登记到 `data/catalog-schema.json`；欧洲按该文件的成员集去重，不能把俄罗斯与格陵兰自动合并入欧洲。

修改图片时，`media.local_path` 相对于本档案，`media.sha256` 必须是当前网页文件的SHA256，宽高和MIME同步。存在衍生网页文件时保留 `source_sha256`、原尺寸、图注、作者、来源和复用说明；不能拿源文件hash冒作网页hash。新增图片同样应生成适当网页尺寸，并记录出处。

## 初次迁入与素材

2026-10-25迁入 297 份完整英文档案和 297 张本地代表图片；档案实际资料日期仍为2026-10-23。图片合计 48,945,186 字节，其中 107 张输出为长边不超过1920px的高质量WebP，其余保留原字节。源记录的科学内容、数值、URL、引用、图注、署名与复用说明逐项比较无差异；只新增独立导航字段和必要的网页图片元数据。

原目录中的本机启动器、后台服务、研究PDF、旧备份和验收截图不参与网页运行，未搬入。科学档案的 `sources`、`media.source_url`、`media.original_url`、`media.credit`、`media.reuse_status` 完整保留；本地保存和重新编码不授予原图片额外版权。地图原素材与相关代码复制保存，未冒称重新绘制或重新收集。

## 本轮实际检查

- 2026-10-25：`python3 tools/build_data.py --check` 及 Node 原回归迁移后通过，共 15 项测试。
- 所有记录与图像路径在本目录内，当前图像SHA256与文件字节匹配；原始科学内容比较无差异。
- 这些是本地数据与离线交互检查，不能代替真实浏览器兼容性；桌面、手机预览及未覆盖范围统一登记于主页 `docs/modules/academic-projects.md`。

说明文档使用中文，全部网页可见内容及完整科学档案正文使用英文。

`data/search-aliases.json` 只保存原地图非显示的中文检索词，继续支持既有中文搜索；不会作为英文网页正文显示，也不会复制到完整英文科学档案。新增英文检索内容自动来自档案，中文检索词可按需要单独维护。

`tools/build_data.py` 同时生成 `assets/preview.svg`：直接复用原地图177国几何，按当前档案国家计数着色，有数据国家使用蓝色（中微子）或紫灰（暗物质），零数据为灰色，边线为深石墨色。缩略图不单独编辑；修改记录后重建即可同步，不改变交互地图本身。
