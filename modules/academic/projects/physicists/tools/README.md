# Physicists 维护工具

本目录维护 Physicists 的轻量摘要生成与离线资源检查；页面与资料由同项目的 `archive/` 自行管理，不读取原 HEP 工程。

从主页仓库根目录运行：

```sh
python3 modules/academic/projects/physicists/archive/scripts/build_website.py
node --test modules/academic/projects/physicists/archive/website/tests/*.test.cjs
python3 modules/academic/projects/physicists/tools/verify_portable.py
```

`verify_portable.py` 核对人物与成果统计、英文资料、时间轴全覆盖、图像 SHA256 与原有许可提示、页面脚本/样式的本地路径、返回主页层级，以及符号链接和本机工作目录依赖。图片只保存一份，由 `archive/portraits/` 提供；独立页面从 `archive/website/site/` 引用它。

- `--import-snapshot`：核对原始导入历史及已登记的英文迁移。当前728份资料/图片仍按原哈希核对；9份转换后的规范JSON按 `archive/data/english-transition.json` 核对前后哈希；4份已退役中文数据核对原哈希与删除状态。以后主动更新资料时应另记版本依据，不能重写原导入历史。
- `--rebuild-in-copy`：复制本模块到临时目录，提供最小的主页返回目标，然后仅用副本运行构建、全部离线测试和资源核对。完成后清理副本；不移动、删除或修改原 HEP 工程。此项验证可迁移构建，不代表操作系统层面阻止读取原目录。

离线测试保留原项目的人物检索、成果计分、历史年代、时间轴与滚动映射案例，并检查当前独立入口、英文初始界面、人物完整资料、721 张图片及原有署名/许可。首次导入实测为96项，英文单版本迁移后扩为99项；后续改动应重新运行，不把该数字当作永久结论。真实浏览器兼容性由模块测试记录单独登记。

`refresh_metadata.py`从本模块人物数据和生成报告更新 `metadata.js`；加 `--check`只读核对，不更新文件。在主页根目录用 `npm run build:physicists`顺序重建档案并更新摘要；交付前再装配主页。

导入快照检查覆盖原人物/成果JSON与图片及明确登记的英文迁移；维护Markdown按主页协议使用中文，不要求其字节等于原英文说明。原始文件SHA256仍在导入清单保留。数据库适配器和操作命令见[关系库说明](../database/README.md)。
