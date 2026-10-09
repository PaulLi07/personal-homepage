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

## 详情子模块

| 分组 / 栏目 | 就近说明 | 测试记录 |
|---|---|---|
| academic / 研究 | [research](../../modules/academic/research/README.md) | [academic-research.md](academic-research.md) |
| academic / 论文成果 | [publications](../../modules/academic/publications/README.md) | [academic-publications.md](academic-publications.md) |
| academic / 学术笔记 | [notes](../../modules/academic/notes/README.md) | [academic-notes.md](academic-notes.md) |
| academic / 项目 | [projects](../../modules/academic/projects/README.md) | [academic-projects.md](academic-projects.md) |
| life / 生活片段 | [moments](../../modules/life/moments/README.md) | [life-moments.md](life-moments.md) |
| life / 地点 | [places](../../modules/life/places/README.md) | [life-places.md](life-places.md) |
| life / 日常细节 | [notes](../../modules/life/notes/README.md) | [life-notes.md](life-notes.md) |
| life / 户外 | [outside](../../modules/life/outside/README.md) | [life-outside.md](life-outside.md) |

本次模块化重构已完成三内核、三个视口的实际验证，证据见 [实测总记录](../COMPATIBILITY.md) 及各模块记录。后续扩展重新实测，没有运行的浏览器或设备保留“未测试”。子模块可引用父分组中明确列出本栏目的逐项证据，不能用一个笼统“父模块通过”覆盖未测栏目。
