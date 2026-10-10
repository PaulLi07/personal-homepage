# Published 分类测试记录

- 就近说明：[分类 README](../../modules/academic/publications/published/README.md)。
- 入口：`#academic/publications/published`；数据仅在分类自己的 `data.js`。
- 兼容性测试：2026-10-10 北京时间 16:17，Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5 各在 1440×900、390×844、320×780 通过。

`npm run test:academic-profile` 共 72 流程（8/环境），逐分类验证入口、直达、刷新、前进后退、返回分类目录、键盘和焦点、英文呈现与无水平溢出。Internal note 与 Published 空状态实际通过；arXiv 的真实题名、合作组署名、日期、Abstract/PDF 链接属性实际核对。坏 URL/日期与纯文本元信息另测通过。报告为 `artifacts/academic-profile-results.json`，正式源码未被测试改写。

完整证据见 [Publications 记录](academic-publications.md)。外部链接只核对目标/属性；测试拦截外网，未测真实点击后的网站及 PDF 阅读器、手机真机、品牌历史版本或线上部署。
