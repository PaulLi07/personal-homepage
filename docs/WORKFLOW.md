# 基本工作协议

## 1. 修改前

读AGENTS、框架及模块README；检查git status。所有说明中文、所有网页呈现英文。功能按模块独立维护，小型胶水接线；新增/扩展同步就近说明和模块兼容性记录。

大更新先建任务分支和更新前备份。本次refactor/project-data-maintenance；backup/pre-maintenance-databases-2026-10-27保存2d8dcda。About用户原人像保持原字节，不暂存或重置。备份分支不包含未提交文件，回退前须另存工作区和所需忽略目录。

同步/发布前fetch检查远端；只快进，不强推、不硬重置。作者在线发布可能更新main，不能用旧源码覆盖。没有发布请求时只本地维护与提交。

## 2. 修改与数据维护

页面编辑模块源码；根HTML与人物site是生成物，不直接改。需要的外部项目源码必须完整复制到模块，不能依赖原工作目录。

Physics Maps规范数据在各地图archive/*/record.json及data维护定义；Physicists人物在en/data/physicists.json，原始成果和补丁在data/breakthrough。只编辑规范JSON，再显式运行本项目原生成器与数据库重建。数据库不是编辑主库，不独立手改两份资料。

```sh
npm run data:init                  # 初次创建
npm run data:check                 # 日常只读核验
python3 scripts/data.py rebuild physics-maps
python3 scripts/data.py rebuild physicists
npm run build:physicists
npm run assemble
npm run check
```

地图每份生成器的build_data.py、总metadata和shell各自有--check模式，详见模块README。先完成规范校验再生成；派生科学计算继续沿用原Node顺序，不以SQL改写。数据库schema修改新增迁移，不改已经应用的迁移；迁移前自动备份、事务回滚。操作和灾备见[数据维护](DATA-MAINTENANCE.md)。

作者/附件/Relationship的安全边界遵守AGENTS及各模块README。测试仅用随机临时密码/资料和模拟API，不读取真实凭据，不执行真实发布；.private/不进入任何公共数据工具。

## 3. 验证

每次修改按影响范围运行测试；npm run check只读，过期产物须显式assemble。工具分类后保留原npm命令兼容，见[scripts说明](../scripts/README.md)。

本轮数据维护运行数据库真实导入、约束、源版本、媒体SHA、只读SQL拒写、迁移失败回滚、备份恢复、原字节导出与独立副本重建。Physicists英文单语清理必须核对英文显示、既有领域筛选集合、人物/事件顺序和数值曲线不变。

布局/交互/数据更新后预览桌面和手机，刷新用户实际标签；检查入口、筛选、档案、历史和返回。正常导航须等待动画结束，核对固定栏不遮挡。模拟手机不是真机，一种内核不算跨浏览器通过；未测范围如实记录。

架构维护先记录运行文件路径/哈希基线。除明确批准的Physicists英文单语迁移之外，网页运行文件须字节不变。随机粒子/轮播对照固定状态下DOM/尺寸和截图，不以任意截图逐像素相等代替资源核验。

```sh
npm run test:data-maintenance
npm run test:physicists
npm run test:projects-directory
npm run check
git diff --check
```

## 4. 提交、打包与回退

只暂存本任务文件，保留用户原人像等无关改动；采用feat:/fix:/style:/docs:/chore:提交。验收后快进整合本地main。只有用户明确要求上传/推送才git push origin main。

源码包与发布包分开，均保留原运行路径；具体命令见README。数据库/WAL/SHM/备份/锁、.private/、Git元数据、缓存与证据不进包。旧默认ZIP和旧预览先归档，不删除回退历史。源码包独立解压后应能重建两库和网页；发布包上传内部文件，无服务器构建。

回退先完整保存当前未提交文件及需要的忽略文件，然后切换备份分支；数据库可从同一源码快照重建或用一致性备份恢复。恢复旧库若源版本不符须报告过期，不把它冒称最新。此前已发布版本的远端回退需另行获得发布授权，不能强推。

历史设计、旧测试矩阵及旧分支记录在[历史目录](history/pre-maintenance-2026-10-27/README.md)。以下链接保留用于查找旧记录，不作为现行规则。

## 旧链接索引

以下锚点仅保留历史链接；现行要求以上文及模块README为准。

<a id="1-修改边界"></a>

[1. 修改边界](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#1-修改边界)

<a id="2-git-开始与同步"></a>

[2. Git 开始与同步](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#2-git-开始与同步)

<a id="3-模块扩展与说明"></a>

[3. 模块扩展与说明](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#3-模块扩展与说明)

<a id="项目目录入口"></a>

[项目目录入口](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#项目目录入口)

<a id="独立项目与实验地图"></a>

[独立项目与实验地图](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#独立项目与实验地图)

<a id="4-兼容性测试"></a>

[4. 兼容性测试](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#4-兼容性测试)

<a id="可重复测试工具"></a>

[可重复测试工具](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#可重复测试工具)

<a id="5-装配检查与提交"></a>

[5. 装配、检查与提交](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#5-装配检查与提交)

<a id="6-发布与交付"></a>

[6. 发布与交付](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#6-发布与交付)

<a id="统一作者与两栏发布"></a>

[统一作者与两栏发布](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#统一作者与两栏发布)

<a id="relationship-本地配置"></a>

[Relationship 本地配置](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#relationship-本地配置)

<a id="7-常用入口"></a>

[7. 常用入口](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#7-常用入口)

<a id="人物动作库回归"></a>

[人物动作库回归](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#人物动作库回归)

<a id="2026-10-23可读性与公式维护"></a>

[2026-10-23：可读性与公式维护](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#2026-10-23可读性与公式维护)

<a id="about相册维护2026-10-23"></a>

[About相册维护（2026-10-23）](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#about相册维护2026-10-23)

<a id="全宽组合维护2026-10-23"></a>

[全宽组合维护（2026-10-23）](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#全宽组合维护2026-10-23)

<a id="life-拍立得维护2026-10-25"></a>

[Life 拍立得维护（2026-10-25）](history/pre-maintenance-2026-10-27/docs__WORKFLOW.md#life-拍立得维护2026-10-25)
