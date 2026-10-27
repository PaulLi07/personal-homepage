# 本地维护工具

这里不放网页业务。tools/保存装配、只读检查、打包和Relationship本地工具；tests/保存现有回归实现。根目录原文件是薄包装，旧npm命令、直接调用和require接口继续兼容。data.py只选择两项目适配器并交给maintenance/公共引擎。

| 入口 | 职责 |
|---|---|
| assemble.py | 从模块源码生成根HTML，--check只读 |
| check.mjs | 验证生成物、语法、资源与模块登记，不自动修复 |
| package.py | 默认完整源码；--mode publish仅运行文件 |
| relationship.cjs | 本地交互加密及--check；不改变私密边界 |
| data.py | 两项目SQLite初始化/重建/迁移/备份/恢复/校验/只读查询 |
| tests/test-*.cjs | 原有离线或可选浏览器回归；npm命令保持 |
| tests/test-maintenance-layout.py | 两类包的排除/运行资源闭合与维护路径校验 |

全套现有命令见package.json；数据库测试用npm run test:data-maintenance。浏览器测试需要对应浏览器工具，运行环境不满足时不得写通过。本轮桌面/手机证据单独登记，不沿用旧报告。所有证据写忽略的artifacts/；依赖、数据库、私密内容都不随工具打包。
