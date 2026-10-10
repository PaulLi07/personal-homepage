# 模块说明与测试目录

源码按功能组织，就近的 `modules/<功能>/README.md` 说明用途、入口、接口与维护方法；本目录保存模块索引及兼容性测试记录，链接就近说明，避免重复。

每次扩展模块同步两者，使用 [测试模板](TEMPLATE.md)，遵守 [工作协议](../WORKFLOW.md)。文档正文中文，网页文字英文；模块文件名使用简短的小写英文标识。

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

该服务按用户要求由 Experience 与 Moments 共同使用，无 HTML 根节点；数据集合与读者视图保持各自独立。会话、加密连接缓存及双集合发布的实际测试范围见其专门记录。

## 详情子模块

| 分组 / 栏目 | 就近说明 | 测试记录 |
|---|---|---|
| academic / 学术经历 | [experience](../../modules/academic/experience/README.md) | [academic-experience.md](academic-experience.md) |
| academic / 论文成果 | [publications](../../modules/academic/publications/README.md) | [academic-publications.md](academic-publications.md) |
| academic / 学术笔记 | [notes](../../modules/academic/notes/README.md) | [academic-notes.md](academic-notes.md) |
| academic / 项目 | [projects](../../modules/academic/projects/README.md) | [academic-projects.md](academic-projects.md) |
| life / Moments 博客 | [moments](../../modules/life/moments/README.md) | [life-moments.md](life-moments.md) |
| life / 旅行 | [travels](../../modules/life/travels/README.md) | [life-travels.md](life-travels.md) |
| life / 创作 | [creations](../../modules/life/creations/README.md) | [life-creations.md](life-creations.md) |
| life / 关系空间 | [relationship](../../modules/life/relationship/README.md) | [life-relationship.md](life-relationship.md) |

2026-10-10 当前栏目与自定义详情已完成三内核、三个视口实测；基础回归、81 个功能流程、9 项算法及打包排除证据见 [实测总记录](../COMPATIBILITY.md)，其中保留 2026-10-09 重构历史。GitHub API 全模拟，真实写入为 0；手机真机、品牌版本与线上部署未测。子模块可引用父分组中明确列出本栏目的逐项证据，不能用笼统“父模块通过”覆盖未测栏目；后续扩展仍需重新验证。
