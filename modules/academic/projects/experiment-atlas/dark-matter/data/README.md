# 地图数据维护

`catalog-schema.json` 保存英文导航元数据，`catalog.json` 是 `tools/build_data.py` 从本地图 `archive/*/record.json` 生成的轻量索引。完整正文与图片按需读取，不合入HTML。

所有索引路径相对于本地图的 `index.html`；`record_path` 与 `english_record_path` 指向同一个本地英文记录。档案中 `media.local_path` 相对于该 `record.json`，不相对于索引或主页根目录。

`map_navigation` 保存已审定的地区与技术归组。变更科学内容或归组后重建索引，再执行 `--check` 和回归测试；目录更新时间不能覆盖档案状态证据日期。`geography-notes.json` 保留逐项地理说明与汇总；`import-manifest.json` 保存迁入时原文件hash和网页衍生文件hash，原路径只作出处审计，不在运行时解析。详细步骤见上级README。

`data/search-aliases.json` 只保存原地图非显示的中文检索词，继续支持既有中文搜索；不会作为英文网页正文显示，也不会复制到完整英文科学档案。新增英文检索内容自动来自档案，中文检索词可按需要单独维护。

`tools/build_data.py` 同时生成 `assets/preview.svg`：直接复用原地图177国几何，按当前档案国家计数着色，有数据国家使用蓝色（中微子）或紫灰（暗物质），零数据为灰色，边线为深石墨色。缩略图不单独编辑；修改记录后重建即可同步，不改变交互地图本身。
