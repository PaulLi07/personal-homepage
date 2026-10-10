# 兼容性与功能实测

本文件保存可随源码交付的中文实测概要；原始 JSON、截图和临时产物位于被忽略的 `artifacts/`，不进入源码包。后续扩展应更新对应模块记录和案例，重新验证当前版本。

## 2026-10-10：栏目更新、博客与加密空间

测试日期：2026-10-10（北京时间）。改动范围：Experience / Travels / Creations / Relationship 栏目更新、Moments 博客与作者工作台、自定义详情生命周期。基础与功能脚本均在 `/personal-homepage/` 子路径下运行。

### 环境与结果

| 实测内核 | 版本 | 视口 | 基础兼容性 | 功能集成 |
|---|---|---|---|---|
| chromium | 151.0.7922.34 | 1440×900、390×844、320×780 | 通过 | 通过 |
| firefox | 153.0 | 1440×900、390×844、320×780 | 通过 | 通过 |
| webkit | 26.5 | 1440×900、390×844、320×780 | 通过 | 通过 |

`npm run test:compat` 的证据为 `artifacts/compatibility-results.json`；`npm run test:features` 的证据为 `artifacts/feature-results.json`，九个环境各完成九个功能流程，共 81 个通过。维护环境使用已有 Playwright，不增加网页运行依赖。`npm run check` 与 `npm run relationship:check` 的静态 / 格式检查通过，与浏览器证据分开记录。

### 基础回归覆盖

- 首页、四分区导航与当前状态、联系方式、动态年份、英文文字、图片加载及三视口无横向溢出；署名页与返回。
- 学术 experience / publications / notes / projects，生活 moments / travels / creations / relationship 逐项打开；封面与空状态、Escape 关闭、入口焦点恢复、直达、刷新及关闭落点通过。
- Experience 的 Enter 打开、Tab / Shift+Tab 循环与 Publications 切换，前进 / 后退；旧 `#academic/research` / `#life/places` / `#life/notes` / `#life/outside` 链接规范到新栏目通过。
- 三内核正常与减少动态效果、直接文件打开 Moments 及关闭、单模块初始化故障隔离通过；生活初始化抛异常后，联系模块和学术详情仍运行。
- 正式 `posts.js` 为空文章列表；正式 `encrypted.js` 仍登记 `null`，Relationship 正确显示未配置状态，没有预设口令或私密明文。

### 新功能集成覆盖

| 功能 | 实测证据与结果 |
|---|---|
| 博客阅读与路由 | 临时文章列表按日期排序、正文换行与纯文本、返回标题焦点、文章直达 / 刷新 / 前进后退、未找到状态通过；正文中的标签不执行 |
| 作者身份与输入 | 原生 Tab 到达令牌输入；空令牌、无效草稿使用英文提示且不发发布请求；非作者与无推送权限的模拟账号被拒绝 |
| 发布冲突与成功 | 模拟冲突不覆盖远端并保留草稿；成功路径重新读取 SHA、保留已有文章并展示新正文；目标为 `main` 的 `modules/life/moments/posts.js` |
| 作者退出与关闭 | 退出、切栏目、关闭后清除工作台 DOM 与凭据输入；重新进入需再次验证，浏览器持久存储保持为空 |
| Relationship 解锁 | HTTP 响应提供临时真实密文；原生 Tab 输入、空口令英文提示、错误口令拒绝并清空输入、正确口令解密和纯文本显示通过 |
| Relationship 再锁定 | 主动 Lock、切栏目后重入、关闭后重开均上锁；锁定后私密正文不在 DOM，口令不进入存储或路由 |
| 页面滚动与关闭 | 手动滚动后打开、关闭详情恢复原位置与入口焦点通过 |

文章、口令和令牌均为临时随机或测试数据，文章与密文仅替换 HTTP 响应，未改正式文件。所有 GitHub 请求由模拟接口处理，每个环境记录两次模拟 PUT，**真实远端写入合计为 0**；没有使用真实 PAT、发布真实文章或验证 GitHub Pages 新部署。

### 离线算法与交付检查

`npm run test:security` 共 9 项通过：真实加密往返、独立 Web Crypto 互通、随机盐 / IV、错误口令拒绝、密文及派生参数篡改拒绝、格式 / Base64 边界、明文及短口令校验、纯 JSON 注册解析与注入拒绝、正式密文文件保持不变。算法使用 AES-GCM 256 位与 PBKDF2-SHA256 600000 次，测试只使用内存夹具。

源码包排除已分别在 Git 工作区与无 Git 的解压目录实测：临时 `.private/` 夹具、`.git/`、`artifacts/`、`node_modules/` 均不进入 ZIP；压缩包完整性和解压后的 `node scripts/check.mjs` 通过。临时目录与夹具已清理；该结果不代表私密资料已经配置或线上发布。

### 实际限制

桌面为鼠标与键盘；窄屏为视口模拟，基础脚本在 Chromium / WebKit 另用触摸模拟。未测试手机真机、Chrome / Edge / Safari 品牌版本或历史版本、新版本线上部署、真实 GitHub 凭据与远端写入、外部站点实际可达性。DOM 与存储清理断言不证明浏览器堆内存或密码管理器的物理清除。直接文件打开只逐内核验证 Moments 共用详情服务，其他栏目逐项验证使用 HTTP 子路径。

## 2026-10-09：功能模块重构历史记录

测试时间：2026-10-09 15:40（北京时间）。改动标识：本次功能模块重构，开发分支 `refactor/feature-modules`；具体源码以相应 Git 提交为准。

### 环境与结论

| 实测内核 | 版本 | 视口 | 结果 |
|---|---|---|---|
| chromium | 151.0.7922.34 | 1440×900、390×844、320×780 | 通过 |
| firefox | 153.0 | 1440×900、390×844、320×780 | 通过 |
| webkit | 26.5 | 1440×900、390×844、320×780 | 通过 |

通过命令：`npm run check`、`git diff --check`、`npm run test:compat`。浏览器脚本为 `scripts/test-compatibility.cjs`，使用维护环境已有 Playwright；当时报告位于忽略的 `artifacts/compatibility-results.json`，该路径现已更新为 2026-10-10 报告，本节保留此前实测概要。

### 实际覆盖

- 导航四个分区及当前状态、首页两个入口、姓名返回首页。
- 所有分区的图片加载、英文文字与三个视口的横向溢出；联系方式和动态年份。
- 学术 research / publications / notes / projects、生活 moments / places / notes / outside 逐栏目打开、图片、空状态、Escape 关闭与入口焦点恢复。
- 详情切换、键盘 Enter、Tab / Shift+Tab、浏览器后退与前进；每个栏目的直达链接、刷新及关闭落点。
- `/personal-homepage/` 子路径、署名页布局与返回；三个内核直接文件打开 `#life/moments` 及关闭。
- 三个内核正常开场/详情过渡、减少动态效果及运行时切换偏好。
- 三个内核故障注入：生活模块初始化抛异常后，联系模块仍初始化，学术详情及关闭服务继续运行。

Chromium 视觉对照覆盖三个视口的首页各分区、全部八个详情及连续背景的九个滚动状态，公共节点布局与样式一致。修复了手机关闭按钮字号覆盖；署名页补充独立背景用途产生的窄屏换行属于内容更新。截图与对照报告保留在本地 `artifacts/visual-regression/`，不随源码包上传。

测试中修复 WebKit 的 Tab 焦点循环问题，以及导航后关闭详情时历史切换覆盖按钮焦点的问题；上述交互已复测通过。

### 未覆盖项

手机为视口模拟，Chromium / WebKit 另测触摸模拟；Firefox 窄屏测试鼠标与键盘。没有手机真机、各品牌 Chrome / Edge / Safari、历史版本、外部站点可达性或 GitHub Pages 新版本上线后的测试。头部与静态资料的视觉对照主要使用 Chromium；不宣称全平台兼容。

后续扩展必须更新相关模块记录和测试案例，重新实测；本记录不能代替未来版本验证。
