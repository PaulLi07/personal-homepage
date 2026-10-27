# 项目框架概要

网站按功能模块组织，在本地装配静态页面。此次架构维护保留页面布局、公开URL、图片及交互；数据库仅用于本地维护，浏览器不连接SQLite。

## 当前目录

```text
app/                               清单、模板、初始化胶水
modules/
  home/ about/ contact/ credits/   分区自身资源
  academic/
    exploration/                   路牌、图窗、人物、椰林
    experience/ publications/ notes/
    projects/                      项目登记、共用入口工厂、目录视图
      experiment-atlas/            Physics Maps（保留公开历史目录名）
        neutrino/ dark-matter/     各自页面/代码/档案/图片/数据/工具
        database/                  本项目SQL迁移、导入适配器、测试
      physicists/                  人物入口、完整独立档案
        archive/
          en/data/                 唯一英文人物规范数据
          data/breakthrough/       原始成果、分层补丁、计算配置
          portraits/               唯一721份人物图片
          website/src/             前端维护源码
          website/site/            可直接部署的生成页面/JS/数据
          scripts/                 本项目构建及科学计算
        database/                  本项目SQL迁移、导入适配器、测试
  life/stack/ moments/ travels/ creations/ relationship/
  author/ article-photos/ article-documents/ particle-background/
shared/                            真正跨模块复用的运行能力
maintenance/                       通用本地SQLite引擎、CLI、测试
scripts/tools/ scripts/tests/       维护工具与测试实现
scripts/*.py|*.mjs|*.cjs            原命令兼容入口、小型协调器
docs/                              当前说明/模块记录
docs/history/                      旧说明与测试快照
.maintenance/                      本地库/备份/锁（忽略、不交付）
artifacts/                         本轮证据（忽略、不交付）
index.html credits.html            已跟踪的生成发布页面
```

## 运行边界

app/site.json是装配顺序和独立页面清单的唯一入口。shared提供注册/导航/详情/过渡/公式能力，服务先于分区，app/main.js最后接线。普通脚本defer加载，不运行时请求HTML片段。CSS和静态JS附内容哈希；Experience与Moments在线数据通过liveScripts保持原URL。

各模块维护自己的片段、行为、样式、图片和README，不把业务挪进shared或app。详情通过registerDetail/registerDetailView公开接入；自定义视图接收host/route/signal/navigate并返回清理函数。

Projects通过registerAcademicProject登记独立项目；可选renderEntry调用父目录公共入口工厂，来源图片、统计和目标仍归子项目。两个子项目无需互相读取私有数据。Physicists一步打开独立页面；Maps进入目录选择两图。既有相对路径和返回路径不变。

根HTML由scripts/tools/assemble.py生成。人物site由本模块build_website.py生成，数值仍交原Node生成器。地图archive记录是规范源，catalog/preview是衍生产物。生成产物必须随源码保留，以支持直接上传Pages。

## 本地数据维护层

规范JSON → 项目适配器 → 本地SQLite；网页仍使用原静态发布产物。数据库不是第二资料源，也不参与网页编辑或作者凭据。公共引擎只管理源快照、版本、事务迁移、备份、只读查询及诊断；具体领域表、关系和检查归各项目database/。

两库分别为physics-maps.sqlite和physicists.sqlite。保留源文件原字节/路径/SHA、完整JSON载荷、源顺序，另建关系表；图片保留模块文件，仅登记引用和哈希。Maps不合并跨图重复ID；人物原事件与补丁分层，SQL不重算曲线。Physicists仅英文，已审定领域与日期线索转为英文元数据保留语义。

迁移schema和适配器进入Git，库二进制/备份不进入Git、源码包或发布包。独立源码副本能重建两个库与网页，不读取原HEP工作目录。接口和操作见[维护指南](DATA-MAINTENANCE.md)。

## 工具、历史与打包

scripts/tests保存回归实现，scripts/tools保存装配/检查/打包/私密工具；原路径保留薄包装以兼容npm与外部调用，不复制实现。数据入口scripts/data.py只装载两项目适配器。

源码包包含维护资料和可部署页面；发布包按运行范围保留相同相对路径，排除规范人物维护副本、工具、测试、数据库和内部文档。地图档案JSON本身是运行请求资源，必须进入发布包，不能按JSON扩展名一刀切。

此前长篇演变与测试文字在[历史归档](history/pre-maintenance-2026-10-27/README.md)。历史目录名experiment-atlas/archive与重复占位素材保留，避免改公开路径或破坏模块独立性。

## 旧链接索引

以下锚点仅保留历史链接；现行要求以上文及模块README为准。

<a id="目录与边界"></a>

[目录与边界](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#目录与边界)

<a id="装配与运行"></a>

[装配与运行](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#装配与运行)

<a id="实验地图集2026-10-25"></a>

[实验地图集（2026-10-25）](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#实验地图集2026-10-25)

<a id="projects图文入口2026-10-27后续"></a>

[Projects图文入口（2026-10-27后续）](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#projects图文入口2026-10-27后续)

<a id="physicists独立档案2026-10-27"></a>

[Physicists独立档案（2026-10-27）](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#physicists独立档案2026-10-27)

<a id="2026-10-23-视觉维护入口"></a>

[2026-10-23 视觉维护入口](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#2026-10-23-视觉维护入口)

<a id="life-拍立得入口2026-10-25"></a>

[Life 拍立得入口（2026-10-25）](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#life-拍立得入口2026-10-25)

<a id="注册接口与共享服务"></a>

[注册接口与共享服务](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#注册接口与共享服务)

<a id="粒子背景服务"></a>

[粒子背景服务](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#粒子背景服务)

<a id="详情数据"></a>

[详情数据](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#详情数据)

<a id="路由与扩展"></a>

[路由与扩展](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#路由与扩展)

<a id="2026-10-23-漫画造景维护"></a>

[2026-10-23 漫画造景维护](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#2026-10-23-漫画造景维护)

<a id="人物动作库与独立时间轴"></a>

[人物动作库与独立时间轴](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#人物动作库与独立时间轴)

<a id="本地数学排版服务2026-10-23"></a>

[本地数学排版服务（2026-10-23）](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#本地数学排版服务2026-10-23)

<a id="about相册2026-10-23"></a>

[About相册（2026-10-23）](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#about相册2026-10-23)

<a id="分区全宽布局2026-10-23"></a>

[分区全宽布局（2026-10-23）](history/pre-maintenance-2026-10-27/docs__ARCHITECTURE.md#分区全宽布局2026-10-23)
