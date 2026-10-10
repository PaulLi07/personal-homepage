# 学术经历详情测试记录

- 就近说明：[模块 README](../../modules/academic/experience/README.md)；入口：`#academic/experience`。
- 测试日期：2026-10-10（北京时间）；改动范围：Research 改为 Experience、路径与已知资料占位。
- 实际环境：chromium 151.0.7922.34、firefox 153.0、webkit 26.5；各测 1440×900、390×844、320×780。
- 环境路径：临时 HTTP 服务的 `/personal-homepage/`；基础报告为 `artifacts/compatibility-results.json`，报告不随源码交付。

## 兼容性测试

| 检查项 | 结果 | 实际证据 |
|---|---|---|
| 入口、封面与空经历列表 | 通过 | 三内核、三视口从 experience 按钮打开，英文标题、图片加载与空条目状态正常；未添加虚构经历 |
| 详情直达与刷新 | 通过 | `#academic/experience` 直达、刷新、关闭落到 `#academic`；旧 `#academic/research` 自动规范到新地址 |
| 键盘、焦点与历史 | 通过 | Enter 打开、Tab / Shift+Tab 留在弹窗；Escape 返回入口焦点；切到 Publications 后的前进 / 后退正常 |
| 布局与资源 | 通过 | 三内核、三视口无详情横向溢出；站点相对资源路径正常，共享动画与减少动态效果回归通过 |

父组的具体案例见 [academic](academic.md)，环境、命令与限制见 [实测总记录](../COMPATIBILITY.md)。本轮结果来自当前 Experience，而非旧 Research 的历史记录。

未覆盖项：手机真机、品牌或历史浏览器版本、线上新部署、外部链接实际跳转；本栏目未单独以文件方式打开，文件冒烟范围是共用 Moments 详情。窄屏为视口 / 触摸模拟。
