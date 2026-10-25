# 独立英文实验档案

每个 `<id>/record.json` 保存一个实验或项目系列的完整英文记录及引用，对应图片归其自己的 `images/`。网页只在打开档案时读取该JSON。

修改该唯一英文记录后，在本地图根目录执行 `python3 tools/build_data.py`，再执行 `python3 tools/build_data.py --check` 和 `node --test tests/*.test.mjs`。不要修改生成索引以代替修改档案，不要重新依赖初次迁入来源目录。详见上级README。
