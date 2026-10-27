# 两项目数据维护指南

## 模型与位置

现在有专门的两个本地SQLite维护库；不需要数据库服务或网页账号。**规范JSON仍是唯一编辑源**，数据库用于关联查询、完整性审计和维护索引。网页继续加载既有静态文件，不请求SQLite/API，页面布局和公开路径不变。

| 项目 | 规范资料 | 本地数据库 |
|---|---|---|
| Physics Maps | 各地图archive/*/record.json、data中的分类/技术/地区/来源定义 | .maintenance/databases/physics-maps.sqlite |
| Physicists | archive/en/data/physicists.json、archive/data/breakthrough/*.json | .maintenance/databases/physicists.sqlite |

资料、图片、生成器、结构和适配器全部在各自项目内。规范数据与schema随Git和源码包保存；实际数据库、备份、锁、日志不进Git/源码包/发布包。复制完整源码后可独立重建，不依赖原HEP目录。人物只维护英文；说明仍中文，原始图像作者/版权等合法专有元数据保留原文。

## 日常更新

在主页根执行，需要Python 3.10+标准库与Node.js 18+：

```sh
npm run data:init
npm run data:check
npm run data:stats
```

修改规范资料后，先运行项目原生成器和测试，再重建对应库。Maps按[本模块说明](../modules/academic/projects/experiment-atlas/README.md)执行各build_data.py、metadata和shell；人物用npm run build:physicists与npm run test:physicists。最后：

```sh
python3 scripts/data.py rebuild physics-maps
python3 scripts/data.py rebuild physicists
npm run data:check
npm run assemble
npm run check
```

init对已存在库只校验，不覆盖；check发现资料过期或媒体哈希异常会失败，不自动掩盖。rebuild先备份旧库，暂存库完整导入/校验后才原子替换。不要直接用数据库软件编辑库；若需未来以数据库为编辑主库，必须另行设计单向导出与审查流程。

## 查询、备份与恢复

query只允许单条只读SELECT/WITH，默认最多200行；禁止UPDATE、ATTACH、PRAGMA、扩展加载和多语句。

```sh
python3 scripts/data.py query physics-maps --sql 'SELECT map_id, COUNT(*) AS total FROM experiments GROUP BY map_id'
python3 scripts/data.py query physicists --sql 'SELECT id,name,sort_year FROM people ORDER BY ordinal LIMIT 10'
python3 scripts/data.py backup all
python3 scripts/data.py diagnose all
python3 scripts/data.py export physics-maps --output /absolute/path/to/new-audit-directory
python3 scripts/data.py restore physics-maps --input /absolute/path/to/backup.sqlite
npm run data:check
```

备份采用SQLite一致性备份API，默认.maintenance/backups/项目/；不手拷可能活跃的WAL文件。恢复先检验项目/结构/源字节/业务表指纹、暂存复核并备份现库，然后替换；损坏或跨项目备份拒绝。恢复旧资料后会明确报告stale/current_check，必须把源码回退到对应版本或重新重建，不能把恢复成功当成资料最新。

export仅将保存的规范JSON原字节导出到**尚不存在的新目录**，用于审计；不能覆盖当前源。实际数据库不是唯一备份，Git中的规范源可重建它。

## 结构升级

各项目database/migrations/下追加NNN_说明.sql，不改已应用的迁移；用python3 scripts/data.py migrate 项目标识。公共引擎检查迁移顺序/哈希、迁移前备份，并在事务中应用；失败回滚。源码分支回退时对应重建/恢复数据库。

公共表保存schema_migrations、dataset_versions、source_documents、validation_runs。每份源保留原字节/路径/SHA和整体指纹；业务表另存完整JSON载荷和有序关系，媒体只存路径/哈希/来源/许可。

Maps的38个跨图重复标识分别保存，主键包含map_id；Europe、UNSITED和多地点不重新推断。人物公元前/近似/未知日期保留原模型，691原始成果与42→390→8补丁分层保存；曲线仍由原Node计算，不交SQL重算。

## 模块入口与验收

- [通用引擎/CLI契约](../maintenance/README.md)
- [Maps结构与校验](../modules/academic/projects/experiment-atlas/database/README.md)
- [Physicists结构与英文迁移](../modules/academic/projects/physicists/database/README.md)
- [本轮兼容性记录](modules/project-data-maintenance.md)

npm run test:data-maintenance覆盖真实导入、唯一键/FK、完整载荷、图片SHA、源过期、只读拒写、事务失败、损坏/逻辑损坏拒绝、备份恢复、原字节导出。项目网页仍需实际桌面/手机复查；本地测试不代表线上发布，本轮不自动推送。
