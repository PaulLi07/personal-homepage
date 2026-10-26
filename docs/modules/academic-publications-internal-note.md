# Internal note 分类测试记录

<a id="internal-note-groups-2026-10-26"></a>
## 2026-10-26：课题组目录与BESIII两篇记录

Internal note由空列表扩展为课题组目录，当前BESIII含bam1027与bam1089。元信息、简介和指定DocDB链接归 `internal-note/besiii/data.js`；通用组注册/校验和视图独立维护，Publications只委托现有单slug路由并汇总数量。`internal-note`为组目录，`internal-note-besiii`为本组，保留arXiv与Published格式，不捏造日期。两篇作者顺序均按用户要求，不改arXiv合作组署名。bam1027简介按[arXiv同一研究](https://arxiv.org/abs/2610.11981)的科学结果整理，bam1089保留用户提供的全部12组分支比、误差、显著性及质量增强结论；公式分段使用本地KaTeX与纯文本回退。

### 本轮实际验证

- `npm run test:internal-notes`：9流程、125断言，真实KaTeX与内存DOM；核对两条作者/链接和无日期契约、数值、52处公式、注册深复制/校验、空/未知/异常分组、文本回退、导航回调、取消及幂等清理，以及父目录2条计数/原分类委托。
- `npm run test:math`：7流程、93断言；`npm run test:about-gallery`：17流程、149断言。合计367条离线断言通过；离线夹具不替代浏览器。
- macOS / Codex应用内浏览器，工具未提供精确版本或独立内核。实际检查1440×1000桌面、390×844与320×780手机模拟：组目录1组/2条，BESIII2篇、作者及原始链接对应，52处公式显示、数学错误节点0，整页及详情横向溢出0。320全部9段简介宽269px，各段本次也无横向溢出；样式保留必要时局部滚动。
- 实际点击Publications→Internal note→BESIII、返回课题组/所有分类，Enter选择、Escape关闭、深链刷新、浏览器后退/前进与焦点检查通过。刷新焦点在关闭按钮，组切换焦点在本视图标题。未知组返回英文提示，可用Enter回组目录；arXiv仍1条，Published为空，切换后无旧内部条目残留。
- 使用临时HTTP服务的 `/personal-homepage/` 前缀实际打开BESIII直达页：新脚本均从此前缀加载，2条与52处公式正常，回课题组正确；临时服务随后停止，正式8767预览保留。装配后已刷新正式本地标签，最终警告/错误日志为空。

`npm run assemble`、`npm run check`、`git diff --check`通过。旧 `test:academic-profile`已适配组目录、BESIII、深链及Projects新选择器，本轮仅语法检查，未执行其完整浏览器矩阵；旧72流程不计入本轮通过数字。

截图及JSON报告保存于被忽略的 `artifacts/internal-notes-2026-10-26/`：`groups-desktop-prefix.png`、`besiii-desktop-final.png`、`besiii-mobile-320.png`、`bam1089-mobile-390.png`及 `internal-notes.json`、`math.json`、`about-gallery.json`。链接仅核对原始URL及 `_blank` / `noopener noreferrer` 属性，未访问、下载或认证DocDB内部PDF，未读取凭据。

未测试独立Chrome/Firefox/Safari、真机/真实触摸、原生减少动态偏好、文件打开及线上部署；本次本地维护未请求推送。分支 `feat/internal-note-groups`，回退 `backup/pre-internal-note-groups-2026-10-26`（`19a6246`）。以下为空列表版本历史。

## 2026-10-23：Apple 风格更新

桌面实际点击Internal note分类及返回，英文空状态正常；窄屏仅共用目录和arXiv条目实测，未单独测试此空分类。

环境为 macOS / Codex 应用内浏览器（工具未提供内核及精确版本），手机和平板均为视口模拟。范围与未覆盖项见 [本轮统一记录](../COMPATIBILITY.md#apple-design-2026-10-23)；历史三内核结论不替代本次结果。

- 就近说明：[分类 README](../../modules/academic/publications/internal-note/README.md)。
- 入口：`#academic/publications/internal-note`；数据仅在分类自己的 `data.js`。
- 兼容性测试：2026-10-10 北京时间 16:17，Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5 各在 1440×900、390×844、320×780 通过。

`npm run test:academic-profile` 共 72 流程（8/环境），逐分类验证入口、直达、刷新、前进后退、返回分类目录、键盘和焦点、英文呈现与无水平溢出。Internal note 与 Published 空状态实际通过；arXiv 的真实题名、合作组署名、日期、Abstract/PDF 链接属性实际核对。坏 URL/日期与纯文本元信息另测通过。报告为 `artifacts/academic-profile-results.json`，正式源码未被测试改写。

完整证据见 [Publications 记录](academic-publications.md)。外部链接只核对目标/属性；测试拦截外网，未测真实点击后的网站及 PDF 阅读器、手机真机、品牌历史版本或线上部署。
