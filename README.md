# Yuhong Li 个人主页

南开大学研究生的全英文静态个人主页。正式源码为本目录；网站为 <https://paulli07.github.io/personal-homepage/>，仓库为 <https://github.com/PaulLi07/personal-homepage>。

## 开始维护

需要Node.js 18+、Python 3.10+及自带SQLite，无需npm install。普通网页不需要服务器数据库。

```sh
npm run assemble       # 装配根HTML
npm run check          # 只读检查源码、生成物、资源与登记
npm run preview        # http://127.0.0.1:8767/
npm run data:init      # 初始化两个本地维护数据库
npm run data:check     # 校验库、源版本、关系与媒体
npm run package       # 完整源码包
npm run package:publish # 静态发布包
```

按功能到modules/中修改，先读该模块README。根index.html、credits.html与人物website/site为生成发布文件，不手工改。预览无热更新，装配后刷新实际标签。地图须HTTP预览；主页支持文件打开。

## 结构与内容入口

| 目录 | 负责内容 |
|---|---|
| app/ | 模块清单、模板与初始化胶水 |
| modules/home、about、academic、life、contact、credits | 各分区自身代码/图片/资料 |
| modules/academic/projects/experiment-atlas/ | Physics Maps：中微子252份、暗物质297份档案；地图/图片/规范JSON/工具/database独立 |
| modules/academic/projects/physicists/ | Physicists：721位人物、691条成果；纯英文资料、图片、构建与database独立 |
| modules/author、article-photos、article-documents、particle-background | 独立共用功能服务 |
| shared/ | 注册、导航、详情、过渡、基础样式及本地公式排版 |
| maintenance/ | 本地SQLite通用事务/迁移/备份/只读查询，不进入网页 |
| scripts/tools、scripts/tests | 维护工具与回归测试；原scripts入口保留兼容 |
| docs/、docs/history/ | 当前协议/模块记录与历史归档分开 |

Projects两张对齐卡片分别进入Physics Maps目录和完整Physicists档案，不经过额外人物介绍页；资料和图片已全部复制到主页内，不依赖原HEP项目。

个人信息编辑位置、论文/Internal note、Experience与Moments发布仍在所属模块。公开文章最多9张照片及3份PDF；统一密码解锁与浏览器内加密GitHub连接见[发布说明](docs/BLOG-PUBLISHING.md)。Relationship仅保存独立加密内容，不把私密资料放公开数据集。

## 数据与交付

规范JSON是唯一资料源，两个SQLite库是本地可重建的查询/验证副本；实际库和备份仅在.maintenance/，不提交/打包/上传。日常命令、更新顺序、只读SQL、备份与恢复见[数据维护](docs/DATA-MAINTENANCE.md)。

完整源码包保留独立重建所需资料、schema、工具和发布产物；静态发布包只保留运行资源，内部路径完全相同。旧预览、旧源码包和历史说明已归档，outputs/personal-homepage兼容链接保留。

维护先读[AGENTS](AGENTS.md)、[框架](docs/ARCHITECTURE.md)、[协议](docs/WORKFLOW.md)。模块说明/兼容性记录在[目录](docs/modules/README.md)，本轮验收见[维护记录](docs/modules/project-data-maintenance.md)。未明确请求发布时只本地提交，不自动推送。

旧设计演变、测试数字和回退记录见[历史说明](docs/history/pre-maintenance-2026-10-27/README.md)，不能作为本轮通过证据。

## 旧链接索引

以下锚点仅保留历史链接；现行要求以上文及模块README为准。

<a id="架构维护前的历史说明"></a>

[架构维护前的历史说明](docs/history/pre-maintenance-2026-10-27/README.md#架构维护前的历史说明)
