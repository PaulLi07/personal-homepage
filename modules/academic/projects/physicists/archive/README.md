# Physicists档案源码副本

本目录是主页内独立维护的物理学先驱档案。2026-10-27从站主的 `Web_Pioneers` 项目复制所需前端、规范人物数据、成果数据、图片及构建工具；原项目后来移动或删除，不影响本目录运行与重建。复制来源、原修订与原文件SHA256见 `import-manifest.json`。原工作目录只用于这次导入，日常命令不访问它。

## 文件边界

- `website/src/`：唯一前端源码，界面固定英文；`index.template` 在构建时输出为 `website/site/index.html`，避免主页检查器把未装配模板当作网页；`help/method.en.md` 是网页读者可打开的英文方法内容，不属于中文维护文档。
- `en/data/physicists.json`：唯一规范人物记录，仅维护英文；不保留中文副本。路径继续沿用，避免无必要的资源迁移。
- `portraits/`：721份本地图片唯一副本；网页通过 `../../portraits/<文件名>` 使用同模块资源，不另建重复图片集合。图片种类、来源、原作者、许可与待确认授权说明保留在人物数据中。
- `data/breakthrough/`：具名成果、日期、编辑评估、配置和科学审计源数据。不要直接改生成账本。
- `scripts/build_website.py`：Python标准库加Node.js重建前端与两份运行时数据脚本；先验证721人物、721图片及成果账本，成功后原子替换 `website/site/`。结果不依赖当前时钟。
- `scripts/build_breakthrough.cjs`、`scripts/lib/`：成果预算、年份与导航推导；只从本目录读源数据。
- `website/site/`：可上传的生成页面与数据。运行时不需Python、Node、服务端或网络取图；完整运行边界仍是本目录（图片位于本目录的 `portraits/`）。
- `website/tests/`：随源码保留并针对主页路径适配的离线核心测试；浏览器结果由主页模块记录维护。
- `docs/physics-breakthrough-index.zh.md`：中文科学计算及维护说明。

## 本地重建与检查

在本目录执行（Python 3.9+、Node.js 18+，无需安装第三方依赖）：

```sh
python3 scripts/build_website.py
node --test website/tests/*.test.cjs
```

返回主页根目录后，再运行 `npm run assemble`、`npm run check` 及本模块兼容性测试。打开主页的 `Academic → Projects → Physicists` 进入完整档案；也可直接打开本目录 `index.html`。预览可在主页运行 `npm run preview`，保留网站路径前缀后测试入口、返回、搜索、领域筛选、时间轴、人物档案与方法弹窗。

只调整成果时可执行 `node scripts/build_breakthrough.cjs`，但交付前仍运行完整构建。人物更新时保持英文JSON的稳定ID、顺序、日期、图片哈希及来源一致，并复核已审定领域和导航元数据；构建器会拒绝不一致记录。增加图片后同步该记录，不从网络静默补图。未确认再发布授权的62份图片保留原提示，不把其描述为已确认可自由使用。

导入不包含原 `.git`、联网采集器、研究网页/PDF缓存、预览截图或本机配置；它们不是本地构建及网页运行所需源码。迁移后的日常编辑以本目录为准，避免重复维护原目录并期待自动同步。

2026-10-27英文单版本迁移记录在 `data/english-transition.json`；已移除中文源目录及运行载荷，人物英文文字、日期、顺序、领域归属、科学曲线和导航保留原语义。`browse_domains`、`navigation_fields`、`navigation_year_clues`及`navigation_source_urls`是从已审定旧输入提取的英文标识和数值，不是额外译本。对应[本地关系库](../database/README.md)独立维护原始成果与补丁，不替换本构建器。
