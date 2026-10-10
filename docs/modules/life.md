# 生活概览模块测试记录

- 就近说明：[模块 README](../../modules/life/README.md)。
- 测试日期：2026-10-10（北京时间）；改动范围：Moments 博客、Travels / Creations 改名、Relationship 加密空间。
- 实际环境：chromium 151.0.7922.34、firefox 153.0、webkit 26.5；各测 1440×900、390×844、320×780。
- 发布路径：临时 HTTP 服务的 `/personal-homepage/`；命令与报告说明见 [实测总记录](../COMPATIBILITY.md)。

## 兼容性测试

| 检查项 | 结果 | 实际证据与范围 |
|---|---|---|
| 当前四栏目 | 通过 | moments / travels / creations / relationship 逐项打开、封面、Escape 关闭及入口焦点恢复；正式博客为空，关系空间显示未配置 |
| 路由与布局 | 通过 | 四栏目直达、刷新、关闭落到 `#life`；旧 `#life/places` / `#life/notes` / `#life/outside` 规范到新栏目；三内核三视口无水平溢出、图片与英文文字正常 |
| Moments 独立视图 | 通过 | 临时文章阅读、嵌套路由、标题焦点、模拟作者权限 / 冲突 / 发布、工作台清理；详见 [Moments 记录](life-moments.md) |
| Relationship 独立视图 | 通过 | 临时密文真实解密、错误口令、原生 Tab 输入、主动锁定、切换 / 关闭后上锁、DOM 与存储清理；详见 [Relationship 记录](life-relationship.md) |
| 共享行为 | 通过 | 正常与减少动态效果；三个内核直接文件打开空 Moments；手动滚动后关闭恢复位置与焦点 |
| 初始化隔离 | 通过 | life 初始化故障不阻断 contact 初始化及 academic 详情；没有宣称故障后的 life 仍完整初始化 |

两个浏览器脚本各覆盖九个环境；功能脚本共 81 个通过流程，GitHub API 全模拟，真实写入合计 0。临时文章与密文仅替换 HTTP 响应，正式文章和密文登记文件不变；默认 `encrypted.js` 仍为 `null`。静态检查与浏览器证据分别记录，历史结果见总记录 2026-10-09 章节。

未覆盖项：真实 PAT 与 GitHub 发布、线上新部署、手机真机、品牌或历史版本浏览器、外部链接实际跳转。基础脚本窄屏在 Chromium / WebKit 用触摸模拟，Firefox 用视口与鼠标键盘；文件打开只验证空 Moments，未验证文件方式下的真实发布或解密。
