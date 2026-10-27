# Physics Maps 本地维护数据库

本目录只管理数据库结构、导入和校验。网页仍使用各地图原有的英文档案和生成目录，不连接 SQLite，不改变界面、公开路径、排序、筛选或地图计算。

## 资料边界

- 唯一可编辑资料仍为各地图本地 JSON；`archive/<id>/record.json` 保存完整英文档案。修改后先用原 `tools/build_data.py` 更新网页索引，再重建维护库。不要直接编辑数据库后期待网页同步。
- `adapter.py` 公开 `PROJECT_ID`、`ROOT`、`MIGRATIONS`、`source_files()`、`populate(conn)`、`validate(conn)` 和 `summary(conn)`，上层维护引擎只通过该接口协调。
- `migrations/001_initial.sql` 定义地图、实验、地区及聚合成员、类别、技术、地点、来源、引用、关联和媒体表。完整规范记录同时保存在 `payload_json`；共用引擎的 `source_documents` 保存原 JSON 字节、相对路径和 SHA256，避免尚未独立建列的科学字段丢失。
- 规范输入快照包括档案、分类、地图标签、地理维护说明、显式搜索别名（若有）、导入出处和几何 JSON；排除自动生成的 `data/catalog.json`。地理说明同时含维护文字和生成统计，因此原样登记，不另造一份可编辑说明。
- 主键始终包含 `map_id`。当前两图有 38 个重复档案标识，它们分别保留为独立记录，不按名称或标识合并。
- 地区、Europe 聚合成员、UNSITED、多地点、类别和技术顺序直接取已有资料，不按经纬度重新推断。内部 `source_ids` 逐个建立外键；同图关联建真正外键，未收录的关联保留为 `external-reference`，不伪造本地实验。
- 图片保持原目录和字节，数据库只保存路径、SHA256、大小及署名/许可完整载荷。没有本地图片的合法外链媒体同样保留，不能与本地图片总数混算。

## 命令与维护

从个人主页根目录运行（仅需 Python 标准库）：

```sh
python3 scripts/data.py init physics-maps
python3 scripts/data.py rebuild physics-maps
python3 scripts/data.py check physics-maps
python3 scripts/data.py stats physics-maps
python3 scripts/data.py query physics-maps --sql "SELECT map_id, count(*) FROM experiments GROUP BY map_id"
python3 -m unittest discover -s modules/academic/projects/experiment-atlas/database -p 'test_*.py'
```

数据库位于被忽略的 `.maintenance/databases/physics-maps.sqlite`，不进入 Git、源码包或静态发布包。备份、恢复、迁移与原字节导出统一使用 `scripts/data.py`，具体参数以 `--help` 和根维护说明为准。导出是审计快照，不能跳过人工核对覆盖规范源。独立复制整个主页源码即可重建，日常维护不读取原 HEP Web 目录。

当前基数为两图 549 份档案（中微子 252、暗物质 297）、549 份本地图片、841 份媒体记录、1359 条来源和 4724 条内部来源引用。未来增加地图或资料后以实际源数据重新计算，不能为满足旧统计删除新资料。

## 验证范围

`test_adapter.py` 对真实规范资料运行导入、完整载荷逐字段对照、复合身份、聚合成员、外链关联、唯一键、外键、数据库载荷/索引篡改和临时图片坏哈希/越界路径测试。测试只修改内存库和临时文件，不修改网站资料。共用维护引擎另外负责数据库完整性、源文件新鲜度、迁移事务、备份与恢复；浏览器兼容性由项目本轮统一记录，离线测试不代替网页实测。
