# 本地数据库维护设施

本目录只提供跨项目复用的事务、迁移、备份与只读查询；项目自己的数据模型、导入映射和校验归各自 `database/`。网页不加载这里的代码，也不连接 SQLite。所有说明使用中文，项目网页内容使用英文。

## 资料与目录边界

- 各项目规范 JSON 是唯一可编辑资料源。先改规范源，再运行原网站生成器和测试，最后重建维护库；禁止在 SQLite 和 JSON 两处分别编辑同一资料。
- 默认数据库：`.maintenance/databases/physics-maps.sqlite`、`.maintenance/databases/physicists.sqlite`。
- 默认备份：`.maintenance/backups/<项目标识>/<UTC时间>-<随机后缀>.sqlite`；并行写操作锁放 `.maintenance/locks/`。
- 实际数据库、日志、备份和锁必须被 Git、源码打包器和静态发布打包器排除。`maintenance/` 中的源代码、测试以及项目 SQL 迁移需要随完整源码保存。
- 图片保留在原模块目录，数据库只登记路径、哈希和许可等元信息，不存图片 BLOB。`source_documents.content` 保存规范 JSON 的原始字节，便于无损审计和导出。
- 数据库的导入时间和维护迁移时间不替代科学资料的 `as_of`、评审时间或历史事件日期。

## 日常命令

在仓库根目录执行；需要 Python 3.10+ 标准库，SQLite须支持JSON校验和外键；入口会实际检测能力并明确报错。不需要安装 Python 包、数据库服务器或网页服务。

```sh
python3 scripts/data.py init all
python3 scripts/data.py check all
python3 scripts/data.py stats all
python3 scripts/data.py query physics-maps --sql 'SELECT map_id, COUNT(*) FROM experiments GROUP BY map_id'
python3 scripts/data.py query physicists --sql 'SELECT COUNT(*) FROM people'
python3 scripts/data.py rebuild all
```

| 操作 | 行为 |
|---|---|
| `init` | 不存在则新建；已存在则只读校验，不悄悄覆盖过期库 |
| `rebuild` | 保存旧库一致性备份，在临时库导入并校验全部规范源，成功后原子替换 |
| `check` | 只读检查结构版本、SQLite完整性、外键、原字节哈希、业务表指纹、源文件新鲜度和项目专有规则；异常时退出码为1 |
| `stats` | 只读输出表数量和项目摘要；了解数据是否最新仍须运行 `check` |
| `query` | 单项目只读 SELECT/WITH；限制最多10000行，默认200行，拒绝写入、附加数据库、加载扩展和多语句 |
| `migrate` | 迁移前备份；一个事务应用尚未执行的SQL；失败回滚，不自动重写规范JSON |
| `backup` | 使用SQLite备份API创建一致性副本，不直接复制可能活跃的WAL文件 |
| `restore` | 验证项目、结构、外键和源字节后恢复；先备份当前库，返回恢复后的当前资料校验结果 |
| `export` | 将保存的规范源原字节导出至尚不存在的新目录，拒绝覆盖当前规范源 |
| `diagnose` | 只读输出SQLite版本、数据库路径、检查与摘要，不自动修复 |

`init/rebuild/check/stats/migrate/backup/diagnose` 可选择 `all`。`query/restore/export` 必须选择一个项目。

## 备份、恢复与源字节核对

```sh
python3 scripts/data.py backup physics-maps
python3 scripts/data.py restore physics-maps --input /absolute/path/to/backup.sqlite
python3 scripts/data.py check physics-maps
python3 scripts/data.py export physics-maps --output /absolute/path/to/new-audit-directory
```

`restore` 成功代表备份成功恢复，不代表资料与当前规范源相同。若恢复的是旧数据，结果中的 `current_check.ok` 为 `false`、`stale` 为 `true`；必须进一步判断是回退规范源版本还是重新 `rebuild`，不能以恢复命令退出成功代替资料检查通过。结构不匹配或已被修改的迁移不能恢复到当前源码；应使用对应Git版本或先明确设计迁移。

结构升级需要新增 `database/migrations/NNN_说明.sql`，不能修改已应用的SQL。引擎校验迁移哈希与顺序，迁移失败保留原数据并提供事先备份。损坏数据库不会被普通 `rebuild` 静默覆盖；先检查备份与诊断结果，保留损坏文件证据后再明确恢复。

需要隔离演练时使用 `--database-dir /absolute/path/to/disposable/databases`。这改变数据库与相邻备份目录的位置，不改变项目规范源的读取路径。

## 项目适配器契约

`modules/academic/projects/<模块>/database/adapter.py` 提供：

| 接口 | 用途 |
|---|---|
| `PROJECT_ID` | `physics-maps` 或 `physicists`，写入版本记录以拒绝跨项目误恢复 |
| `ROOT` | 项目模块根目录，所有保存的源路径相对于此目录 |
| `MIGRATIONS` | 项目SQL迁移目录，文件名 `NNN_*.sql` |
| `source_files()` | 全部规范源文件的路径列表，不包含重复文件或项目外依赖 |
| `populate(conn)` | 向已建表、已捕获源字节的事务连接写入规范化关系；返回摘要字典 |
| `validate(conn)` | 只读检查项目语义、关联、媒体哈希等，返回错误字符串列表 |
| `summary(conn)` | 返回可JSON序列化的项目摘要，不写数据库 |

公共表包括 `schema_migrations`、`dataset_versions`、`source_documents`、`validation_runs`。项目可引用 `source_documents(path)` 外键；导入顺序保证原始字节先于项目记录写入。`media_assets` 等业务表由项目迁移管理，公共设施不读取具体业务字段。

`schema_migrations.version` 为 `base:001` 或 `project:001_initial` 等字符串。当前库的成功导入与迁移写入 `validation_runs`；失败事务整体回滚，错误由命令结果报告，不在失败库里留下半成品“成功”记录。所有写连接显式开启外键。

## 测试

```sh
python3 -m unittest discover -s maintenance/tests -v
```

测试只创建临时规范源和SQLite文件，覆盖实际唯一键/外键、事务回滚、迁移前备份、备份恢复、旧库过期提示、源字节损坏、原样导出、写入/ATTACH/扩展拒绝、查询限制、源文件导入中变化和并发锁。项目适配器还需各自测试，桌面与手机网页回归由本轮模块记录另行登记。
