# 学术日志与经历详情测试记录

## 2026-10-10：学术日志与统一作者集成

- 就近说明：[模块 README](../../modules/academic/experience/README.md)；入口为列表、`/<slug>` 正文和 `/author` 作者工作台。
- 实际环境：Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5；各测 1440×900、390×844、320×780，HTTP `/personal-homepage/` 子路径。手机宽度为视口模拟，未测真机。
- 命令：`npm run test:compat`、`npm run test:features`、`npm run test:author`；报告为忽略的 `artifacts/compatibility-results.json`、`feature-results.json`、`author-log-results.json`。
- 正式 `entries.js` 为空，测试只替换 HTTP 响应；没有编造或发布学术经历。测试 GitHub 请求全部拦截，真实远端写入为 0。

| 检查项 | 结果 | 实际证据 |
|---|---|---|
| 学术列表与阅读 | 通过 | 空列表、日期倒序、四种类型、正文及换行、安全文字呈现；日志与生活文章独立 |
| 路由与焦点 | 通过 | 直接记录链接、刷新、未找到状态、返回列表标题焦点；基础脚本回归历史、键盘与关闭落点 |
| HTTPS 参考链接 | 通过 | 可选引用显示、英文链接文本、新标签页的 `noopener noreferrer`；字段规范化拒绝不安全协议 |
| 统一密码与连接 | 通过 | 两栏共享登录，密码后可编辑，首次 GitHub 连接、无效身份及权限拒绝、退出锁定 |
| 独立集合发布 | 通过 | 类型与参考字段保留，只 PUT 当前集合和 main；409 保草稿，重试读取新 SHA 并保留远端记录 |
| 加密缓存与生命周期 | 通过 | 关闭后会话保持、刷新密码恢复和重验、篡改拒绝、Forget 清连接；详情卸载清理视图 |
| 布局与回归 | 通过 | 三内核及三宽度无横向溢出；正常与减少动态效果、首页、署名与其他栏目回归 |

视觉核对已查看 Chromium 桌面列表及 390 像素编辑器截图；保持常规字体，细线分条与日期 / 类型突出学术日志。未覆盖真实 GitHub 授权、分支保护、线上新部署、外部引用实际可达性、手机真机和历史或品牌浏览器版本。DOM / 存储检查不证明堆内存物理擦除。

## 静态经历详情的历史记录

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
