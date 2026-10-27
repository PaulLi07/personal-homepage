# Physicists项目

入口为 `Academic → Projects`目录中的Physicists图文卡片，沿用Isaac Newton、Marie Curie、Albert Einstein三张照片，点击直接打开完整Physics Pioneers档案，不再经过中间介绍页。独立页面保留时间轴、人物检索、领域筛选、人物档案、成果与年度记录，返回链接直接回到Projects目录。旧 `#academic/projects/physicists`仅为既有书签保留兼容视图。

## 源码与接口

- `archive/`：完整可独立维护的副本，含721位人物、691条成果、721份图片、前端源码、来源与许可信息、构建器及测试，见[源码说明](archive/README.md)。原项目现名为 `Web_Pioneers`，只在首次复制时读取；日常运行和构建均不再访问原工作目录。
- `view.js`、`styles.css`：轻量入口；`Homepage.createPhysicistsView({archive?}).render({host, signal, entryOnly?})`仅管理传入宿主，返回幂等清理函数。目录接入使用 `entryOnly: true`，通过父目录的公共入口工厂绘制图文卡片；默认模式保留旧路由的兼容外壳。摘要从公开数据接口读取，错误时保留英文提示。
- `integration.js`：通过 `registerAcademicProject()`登记本项目及 `renderEntry({host, signal, navigate})`目录入口，摘要人数从本模块数据动态读取；入口是指向完整档案的原生链接，父Projects不读取人物内部结构。
- `metadata.js`：由本地人物与成果构建报告生成的轻量摘要。主页只加载摘要与三张预览图；完整人物与成果脚本仅在档案页面加载，不嵌入iframe。
- `tools/refresh_metadata.py`：更新或只读核对摘要。`tools/verify_portable.py`：核对资源与图像散列，支持独立副本重建，见[工具说明](tools/README.md)。

## 更新方法

在主页仓库根目录运行，无需额外安装库：

```sh
npm run build:physicists       # 本地重建独立页面，并更新主页摘要
npm run test:physicists        # 核心测试、资源闭合、摘要一致性
npm run test:projects-directory
npm run assemble
npm run check
```

改人物资料：只编辑 `archive/en/data/physicists.json`；改成果：编辑 `archive/data/breakthrough/`；改独立页面：编辑 `archive/website/src/`。`archive/website/site/`是生成物，不直接修改。人物稳定ID、日期、来源和图片SHA256须一致，不静默联网补图，不篡改图像作者、许可及未确认授权提示。

所有维护说明使用中文，网页与规范资料仅维护英文，不再保留中文人物/成果副本。图像原作者、版权及来源元数据仍按原记录保留。英文方法帮助位于 `archive/website/src/help/`，属于网页呈现内容。日常维护以主页内副本为准，原项目的改动不会自动同步。

完整页面与重定向入口在 `app/site.json` 的 `standalonePages` 声明。交付时保留整个 `physicists/`；图片由 `archive/portraits/`唯一持有，不能只上传 `website/site/`。兼容性、独立构建及回退证据见[本轮记录](../../../../docs/modules/academic-projects-physicists.md#physicists-import-2026-10-27)。

2026-10-27入口上移后的卡片、一步进入、返回和手机排版需按[本次记录](../../../../docs/modules/academic-projects.md#project-cards-2026-10-27)重新验证；上次导入测试仅保留为对应历史。

## 本地数据库

[database/](database/README.md)保存独立SQL结构、适配器和测试。人物、原始成果、补丁、来源及图片索引可重建到主页 `.maintenance/databases/physicists.sqlite`；规范JSON仍是唯一资料源，数据库不参与网页加载或科学数值计算。更新JSON后运行 `python3 scripts/data.py rebuild physicists`，交付前运行 `python3 scripts/data.py check physicists`。英文迁移追溯见 `archive/data/english-transition.json`；原导入清单保留历史。
