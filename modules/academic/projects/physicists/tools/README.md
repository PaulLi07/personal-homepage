# Physicists 维护工具

本目录维护 Physicists 的轻量摘要生成与离线资源检查；页面与资料由同项目的 `archive/` 自行管理，不读取原 HEP 工程。

从主页仓库根目录运行：

```sh
python3 modules/academic/projects/physicists/archive/scripts/build_website.py
node --test modules/academic/projects/physicists/archive/website/tests/*.test.cjs
python3 modules/academic/projects/physicists/tools/verify_portable.py
```

`verify_portable.py` 核对人物与成果统计、英文资料、时间轴全覆盖、图像 SHA256 与原有许可提示、页面脚本/样式的本地路径、返回主页层级，以及符号链接和本机工作目录依赖。图片只保存一份，由 `archive/portraits/` 提供；独立页面从 `archive/website/site/` 引用它。

- `--import-snapshot`：额外核对首次导入清单中 741 份未改动的资料、成果源记录和图片。以后主动更新资料时，这项旧快照核对可能失效，应保留导入历史并另记更新依据；普通资源检查不强制新资料等于旧快照。
- `--rebuild-in-copy`：复制本模块到临时目录，提供最小的主页返回目标，然后仅用副本运行构建、全部离线测试和资源核对。完成后清理副本；不移动、删除或修改原 HEP 工程。此项验证可迁移构建，不代表操作系统层面阻止读取原目录。

离线测试保留原项目的人物检索、成果计分、历史年代、时间轴与滚动映射案例，并检查当前独立入口、英文初始界面、人物完整资料、721 张图片及原有署名/许可。首次导入实测为 96 项全部通过；后续改动应重新运行，不把该数字当作永久结论。真实浏览器兼容性由模块测试记录单独登记。

`refresh_metadata.py`从本模块人物数据和生成报告更新 `metadata.js`；加 `--check`只读核对，不更新文件。在主页根目录用 `npm run build:physicists`顺序重建档案并更新摘要；交付前再装配主页。

导入快照检查只覆盖未本地化的人物/成果JSON与图片（本次741份）；维护Markdown已按主页协议翻译为中文，因此不要求其字节等于原英文说明。原始文件SHA256仍在导入清单中保留，可追溯复制来源。
