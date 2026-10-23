# 模块说明与测试目录

源码按功能组织，就近的 `modules/<功能>/README.md` 说明用途、入口、接口与维护方法；本目录保存模块索引及兼容性测试记录，链接就近说明，避免重复。

每次扩展模块同步两者，使用 [测试模板](TEMPLATE.md)，遵守 [工作协议](../WORKFLOW.md)。文档正文中文，网页文字英文；模块文件名使用简短的小写英文标识。

本轮 Apple 风格设计、逐模块实际预览和限制见 [2026-10-23 记录](../COMPATIBILITY.md#apple-design-2026-10-23)；维护约定见 [设计说明](../DESIGN-APPLE.md)。以下旧矩阵保留为历史，不能代替本轮验证。

Academic最新路牌、悬浮图窗与步行场景见 [模块说明](../../modules/academic/exploration/README.md)，本次验证见 [专项记录](academic.md#academic-scene-2026-10-23)，不沿用前一轮结果。

## 主模块

| 模块 | 就近说明 | 测试记录 |
|---|---|---|
| 首页 | [home](../../modules/home/README.md) | [home.md](home.md) |
| 简介 | [about](../../modules/about/README.md) | [about.md](about.md) |
| 学术概览 | [academic](../../modules/academic/README.md) | [academic.md](academic.md) |
| 生活概览 | [life](../../modules/life/README.md) | [life.md](life.md) |
| 联系 | [contact](../../modules/contact/README.md) | [contact.md](contact.md) |
| 图片署名 | [credits](../../modules/credits/README.md) | [credits.md](credits.md) |

## 共用功能服务

| 服务 | 就近说明 | 测试记录 |
|---|---|---|
| 统一作者登录与编辑器 | [author](../../modules/author/README.md) | [author.md](author.md) |
| 文章照片 | [article-photos](../../modules/article-photos/README.md) | [article-photos.md](article-photos.md) |
| 文章 PDF 附件 | [article-documents](../../modules/article-documents/README.md) | [article-documents.md](article-documents.md) |
| 主页面粒子背景 | [particle-background](../../modules/particle-background/README.md) | [particle-background.md](particle-background.md) |

作者、照片与 PDF 三项服务按用户要求由 Experience 与 Moments 共同使用，无 HTML 根节点；数据集合、照片和 PDF 文件与读者视图保持各自独立。会话、加密连接缓存、照片和双集合发布的实际测试范围见各自专门记录。

粒子背景服务面向主页面公开的纯黑区域，不承载文章或作者业务，参数、模拟、Canvas 与暂停 / 清理独立维护。2026-10-11 缓存版本与 Life 导航遮挡修复后，16:33 的基础 9 环境及新增正常导航 24 场景、16:34 的作者 144 流程、16:37 的粒子 **255 流程 / 12234 断言**均通过；当前环境、性能与范围见 [粒子记录](particle-background.md)。核心未改，离线 227 条和完整照片 / PDF 矩阵本轮未重测，保留历史证据。功能分支保留，维护与回退见 [专门指南](../PARTICLE-BACKGROUND.md)，下方其他功能结论也保留为各自历史。

## 详情子模块

| 分组 / 栏目 | 就近说明 | 测试记录 |
|---|---|---|
| academic / 学术经历 | [experience](../../modules/academic/experience/README.md) | [academic-experience.md](academic-experience.md) |
| academic / 论文成果 | [publications](../../modules/academic/publications/README.md) | [academic-publications.md](academic-publications.md) |
| publications / Internal note | [internal-note](../../modules/academic/publications/internal-note/README.md) | [分类测试](academic-publications-internal-note.md) |
| publications / arXiv | [arxiv](../../modules/academic/publications/arxiv/README.md) | [分类测试](academic-publications-arxiv.md) |
| publications / Published | [published](../../modules/academic/publications/published/README.md) | [分类测试](academic-publications-published.md) |
| academic / 学术笔记 | [notes](../../modules/academic/notes/README.md) | [academic-notes.md](academic-notes.md) |
| academic / 项目 | [projects](../../modules/academic/projects/README.md) | [academic-projects.md](academic-projects.md) |
| life / Moments 博客 | [moments](../../modules/life/moments/README.md) | [life-moments.md](life-moments.md) |
| life / 旅行 | [travels](../../modules/life/travels/README.md) | [life-travels.md](life-travels.md) |
| life / 创作 | [creations](../../modules/life/creations/README.md) | [life-creations.md](life-creations.md) |
| life / 关系空间 | [relationship](../../modules/life/relationship/README.md) | [life-relationship.md](life-relationship.md) |

2026-10-10 当前栏目与自定义详情已完成三内核、三个视口实测；基础回归、81 个功能流程、9 项算法及打包排除证据见 [实测总记录](../COMPATIBILITY.md)，其中保留 2026-10-09 重构历史。GitHub API 全模拟，真实写入为 0；手机真机、品牌版本与线上部署未测。子模块可引用父分组中明确列出本栏目的逐项证据，不能用笼统“父模块通过”覆盖未测栏目；后续扩展仍需重新验证。

本轮九图/PDF 测试 297 流程与学术分类/ORCID/BESIII 测试 72 流程均已在同样九环境实测通过，结果分别见 [附件](article-photos.md)、[PDF](article-documents.md) 和 [Publications](academic-publications.md)。
