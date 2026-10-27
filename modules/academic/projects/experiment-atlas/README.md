# Physics Maps物理地图项目

本项目入口为Projects目录中的Physics Maps图文卡片，与Physicists入口采用同一结构和对齐方式。点击进入 `#academic/projects/physics-maps`，再选择其中的中微子或暗物质地图。两张地图通过普通链接进入各自独立页面，桌面两列直角卡片、手机单列；不是Projects的两个平级项目。

公开项目名为Physics Maps，源码继续保存在 `experiment-atlas/`，保留原地图路径与资源位置，不搬动既有档案。项目通过父目录的注册接口接入，沿用共享详情，不创建新弹窗或新路由机制。

完整网页、脚本、样式、地图几何、英文档案、图片及维护工具均已保存在当前个人主页源码中，运行和日常维护不需要原 `/Users/paulli/coding/HEP/Web`。首次接入共549条记录及549张代表图片，中微子252条、暗物质297条；目录资料日期保持2026-10-23，不把迁移日期作为科学内容更新时间。

## 目录入口职责

- `registry.js`：登记地图的 `id`、英文标题/简介、站点根相对入口与地图缩略图，公开 `Homepage.getExperimentMaps()`。返回数组与条目均冻结，方便后续增加地图。
- `metadata.js`：由 `tools/refresh_metadata.py` 读取各地图本地 `data/catalog.json` 生成，通过 `Homepage.getData("experiment-atlas:catalogs")` 提供各地图的 `recordCount` / `updated`；不是第二份手工统计表。缺少合法数量或日期时，入口隐去对应字段。
- `entry.js`：提供 `Homepage.createPhysicsMapsEntry()`及目录入口渲染，读取本项目公开地图getter，把两张本地地图缩略图和统计传给父目录公共入口工厂；普通点击进入地图目录，修改键点击保留原生链接行为。
- `view.js`：公开 `Homepage.createExperimentAtlasView({ maps })`，其 `render({ host, signal })`只修改传入宿主，返回幂等清理函数；只显示Physics Maps及本项目地图，不再管理Projects目录或科研合作组。地图链接保留原生导航。
- `integration.js`：通过 `registerAcademicProject(descriptor, view)`登记 `physics-maps`项目，名称为Physics Maps；通过可选 `renderEntry({host, signal, navigate})`贡献目录卡片，摘要动态计算 `getExperimentMaps().length`。父Projects接线管理共享详情和All projects返回，本项目不重复登记父详情。
- `styles.css`：只维护地图卡片与本项目局部样式；父项目目录与共用入口排版由上一级 `styles.css`维护，不改其他Academic栏目。
- `map-shell.css`：地图独立页面公共顶栏，品牌为Physics Maps，返回 `#academic/projects/physics-maps`，再由项目页返回总目录。地图切换使用原生链接，选中项为 `aria-current="page"`，手机两行；只限定顶栏类名，不改地图正文样式。
- `tools/sync_shell.py`：通过 Node VM 执行 `registry.js` 取得同一地图登记，自动计算页面返回与切换相对路径，幂等同步每张地图 `index.html` 中的顶栏和共享CSS引用；不维护第二份地图列表。
- `tools/verify_portable.py`：只读检查发布目录的资源和数据路径闭合，包括本地档案、图片、HTML/CSS/JS引用、符号链接及本机地址；不访问网络或外部源目录。
- `neutrino/`、`dark-matter/`：地图、目录数据、档案和资源的独立本地副本，各自的 README 负责具体地图维护方式。

各地图以 `archive/<id>/record.json` 为唯一完整英文档案，图片归同一档案目录。`tools/build_data.py` 只使用Python标准库和该地图的本地记录、图像、分类及原地图几何，重建 `data/catalog.json`、`data/geography-notes.json` 和 `assets/preview.svg`。入口缩略图引用后者：复用原地图177国几何并按档案国家计数着色，中微子为蓝色、暗物质为紫灰色，零数据国家为灰色。不要直接编辑缩略图，也不修改交互地图几何。

## 日常维护

以下命令均从个人主页仓库根目录执行。修改所属地图的英文档案、分类或图片后，重建该地图的数据，再更新入口统计与导航：

```sh
python3 modules/academic/projects/experiment-atlas/neutrino/tools/build_data.py
python3 modules/academic/projects/experiment-atlas/dark-matter/tools/build_data.py
python3 modules/academic/projects/experiment-atlas/tools/refresh_metadata.py
python3 modules/academic/projects/experiment-atlas/tools/sync_shell.py
npm run assemble
```

上述生成工具均支持只读 `--check`；`verify_portable.py` 默认即为只读。修改后核对生成物、资源和源码：

```sh
python3 modules/academic/projects/experiment-atlas/neutrino/tools/build_data.py --check
python3 modules/academic/projects/experiment-atlas/dark-matter/tools/build_data.py --check
python3 modules/academic/projects/experiment-atlas/tools/refresh_metadata.py --check
python3 modules/academic/projects/experiment-atlas/tools/sync_shell.py --check
python3 modules/academic/projects/experiment-atlas/tools/verify_portable.py
npm run check
git diff --check
```

顶栏工具仅维护各地图HTML中的 `atlas-nav:start/end` 与 `atlas-shell-css:start/end` 区块。页面顶栏生成后运行时无脚本依赖；地图正文和交互仍由所属子模块负责。浏览器通过普通HTTP/HTTPS静态服务加载本地JSON，使用主页预览或GitHub Pages打开；直接双击地图HTML只显示英文说明。

## 增加地图

1. 在此目录增加独立地图子目录，将页面、脚本、样式、数据、档案、图片和中文README一起保存，不得使用符号链接或依赖外部工作目录及服务。
2. 在 `registry.js` 登记英文标题/简介、入口与本地缩略图，在 `app/site.json` 的Academic分区 `standalonePages` 添加地图HTML。
3. 使用所属地图工具生成索引与预览，再运行 `refresh_metadata.py`、`sync_shell.py`、装配和全部相关只读检查。目录数据与统计必须来自当前个人主页中的记录。
4. 实际检查桌面/手机项目入口、地图切换、返回Physics Maps及Projects、筛选、档案阅读、图片、深链及子路径部署；同步[项目目录本轮记录](../../../../docs/modules/academic-projects.md#project-directory-2026-10-27)、[地图测试记录](../../../../docs/modules/experiment-atlas.md)和模块登记。

## 再次导入与来源

`tools/import_map_sources.py` 是保留的显式迁入工具，只有维护者再次明确执行并传入外部源目录时才读取该目录；它需要Pillow处理网页图片，且发现目标已有 `archive/` 即拒绝覆盖。现有档案应直接在本主页维护，不要为日常更新重新运行导入。日常重建和检查不需要Pillow或原Web目录。

迁入清单 `data/import-manifest.json` 保留相对来源、原记录及源图像SHA256和当前网页图像SHA256，仅供出处审计，不是运行时路径。档案中的科学内容、图注、署名、来源链接及复用说明保留；网页缩放和本地保存不授予图片额外版权。实际兼容性、独立性检查与未覆盖范围统一见[地图集接入记录](../../../../docs/modules/experiment-atlas.md)，静态检查不替代浏览器或科学资料审核。

## 项目层与地图层

新地图只进入本项目清单；新项目则在父 `projects/`下另建独立目录并使用项目注册接口，不在本地图registry中混入Physicists等其他项目。当前目录与地图返回路径的2026-10-27验证统一见[Projects本轮记录](../../../../docs/modules/academic-projects.md#project-directory-2026-10-27)，地图旧版本记录保留为历史。

2026-10-27目录卡片改为与Physicists一致的图文范式，未搬动地图、档案或图片；本轮入口和对齐效果的验证统一见[项目卡片记录](../../../../docs/modules/academic-projects.md#project-cards-2026-10-27)。
