# Physicists 本地关系库

本模块以 `archive/en/data/physicists.json` 和 `archive/data/breakthrough/*.json` 为唯一规范资料源，只维护英文人物与成果。SQLite是可重建的本地维护索引，不是网页运行依赖，也不允许与JSON分别编辑。维护说明继续使用中文，原始图像作者、文件名、版权与来源元数据保留原文。

## 文件与边界

- `adapter.py`：公开 `PROJECT_ID`、`ROOT`、`MIGRATIONS`、`source_files()`、`populate(connection)`、`validate(connection)`、`summary(connection)`；只从本模块读取资料和图片，交给公共维护引擎事务导入。
- `migrations/`：按编号追加SQL迁移，已执行迁移不可改写。版本与备份由主页 `maintenance/` 维护引擎处理。
- `tests/`：真实语料、关系约束、原字节往返、历史日期、补丁顺序及篡改检出测试。
- 实际数据库在主页 `.maintenance/databases/physicists.sqlite`，一致性备份在 `.maintenance/backups/`，均不提交、不打包、不上传。复制源码后可重新建立。

统计中的科学评审日期从库内 `source_documents` 快照读取，恢复旧库时不会误用当前文件系统的新审查日期。数据库保存721人物、691条原始成果及440条补丁，图片仅登记相对路径、SHA256、种类、署名与许可，不存BLOB。完整JSON载荷保留尚未提炼成列的字段；公共 `source_documents` 另存规范JSON的原始字节、大小与SHA256，可无损导出到新目录。

## 关系与科学语义

`people`、`person_fields`维护人物及已审定领域；`events_raw`、`event_people`和`event_represented_people`维护原始成果及人物关系；`event_patches`按来源补丁→评估补丁→编辑补丁分为1/2/3阶段，保留各文件数组顺序；`patch_people`维护补丁中的人物引用。`sources`及三类来源关联表保留完整引用和顺序；`media_assets`登记唯一图片副本。

出生负年份、近似/区间精度、不详死亡状态和原日期模型按原文/JSON保存，禁止用SQL日期函数重定年。不得把已合并的运行成果重新当原记录导入；数据库不重新计算科学分数、浮点年度值或导航。原Node构建器仍按既有顺序完成科学推导。

## 常用命令

在主页根目录运行：

```sh
python3 scripts/data.py init physicists
python3 scripts/data.py check physicists
python3 scripts/data.py stats physicists
python3 scripts/data.py query physicists --sql "SELECT id,name,sort_year FROM people ORDER BY ordinal LIMIT 10"
python3 scripts/data.py backup physicists
python3 -m unittest discover -s modules/academic/projects/physicists/database/tests -p 'test_*.py'
```

修改规范JSON后先运行既有 `npm run build:physicists` / `npm run test:physicists`，再运行 `python3 scripts/data.py rebuild physicists` 更新派生索引。`check`会拒绝过期资料；重建在暂存库校验成功后替换。迁移、导出、恢复等参数见 `python3 scripts/data.py --help` 和对应子命令帮助；导出仅写新目录，不覆盖规范资料。

## 英文迁移与后续编辑

`archive/data/english-transition.json`记录2026-10-27移除中文副本、源哈希及迁移前英文语义摘要，原 `import-manifest.json`保持不变。`browse_domains`、`navigation_fields`、`navigation_year_clues`与`navigation_source_urls`从已审定旧版提取为英文标识和数值，避免删去翻译后悄悄改变筛选和导航。它们不是新科研事实；更新人物领域、贡献或史料时需同时复核这些编辑元数据。

现有英文语义回归对照迁移基线。今后主动增加/修改科学资料时，应单独记录新的审查依据和变更版本，再更新对应语义回归预期；不能为让测试通过而盲目重录基线。旧审计Markdown描述其历史阶段，不能替代本轮检查。
