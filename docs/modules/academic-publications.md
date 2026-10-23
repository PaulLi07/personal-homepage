# 论文成果详情测试记录

## 2026-10-23：LaTeX题名与字号

可选titleTex通过[本地KaTeX封装](../../shared/math/README.md)在详情和Academic精选入口共用，纯文本title保留。1440×1000检查数学斜体、上下标、反粒子横线及字体加载；320×780论文题名宽/滚动宽均269px、两公式正常换行且无错误；820×1180回归三分类、目录返回及Notes/Projects切换。离线数学93断言通过。环境、截图和未测试项见[统一记录](../COMPATIBILITY.md#readability-math-2026-10-23)，本轮未请求发布。


## 2026-10-23：Apple 风格更新

桌面逐一检查三分类、分类返回与arXiv记录；390×844目录、320×780长题名和两列栏目页签正常。原外链地址保留，未访问外部站点。

环境为 macOS / Codex 应用内浏览器（工具未提供内核及精确版本），手机和平板均为视口模拟。范围与未覆盖项见 [本轮统一记录](../COMPATIBILITY.md#apple-design-2026-10-23)；历史三内核结论不替代本次结果。

- 就近说明：[模块 README](../../modules/academic/publications/README.md)。
- 入口：`#academic/publications`。
- 测试时间：2026-10-09 15:40（北京时间）；改动标识：功能模块重构。
- 环境：chromium 151.0.7922.34、firefox 153.0、webkit 26.5；1440×900、390×844、320×780。

## 兼容性测试

| 检查项 | 结果 | 实际证据 |
|---|---|---|
| 父区入口、封面与空状态 | 通过 | 三内核及三个视口逐项打开本栏目；图片正常 |
| 直达、刷新、关闭 | 通过 | HTTP 子路径逐栏目直达并刷新；关闭回所属分区 |
| 键盘与焦点 | 通过 | 各视口 Escape 关闭后恢复本栏目入口焦点；共用 Tab / Shift+Tab 与历史测试见父组 |
| 视觉布局 | 通过 | Chromium 三个视口的本栏目详情对照无布局或样式退化；三内核无弹窗水平溢出 |

父组记录：[academic](academic.md)；完整环境和共用服务证据见 [实测总记录](../COMPATIBILITY.md)。静态检查通过，不代替浏览器验证。

未覆盖项：手机真机、品牌或历史版本浏览器、线上新部署。直接文件打开只单独验证共用 moments 详情，其余本栏目直达在 HTTP 子路径验证；外部来源链接未实际跳转。

## 2026-10-10：Publications 分类与真实资料

`npm run test:academic-profile` 在 Chromium 151.0.7922.34、Firefox 153.0、WebKit 26.5 ×1440×900、390×844、320×780 通过，共 72 流程（8/环境）。日期为北京时间 16:17，测试路径 `/personal-homepage/`，报告 `artifacts/academic-profile-results.json`。

Internal note、arXiv、Published 逐分类点击、直达、刷新、前进后退、返回目录、空状态、Tab/Enter/Escape 与焦点恢复均通过。arXiv 真实题名、合作组署名、日期、Abstract 和 PDF 目标/新标签属性核对，元信息按纯文本显示、危险 URL 与无效日期拒绝；九环境无水平溢出，所有网页文字英文。ORCID 在 About/Contact 中一致，BESIII 在 Projects 中作为合作组链接，均实际核对。没有添加虚构作者角色或研究成果。

论文信息来源为 [arXiv 官方记录](https://arxiv.org/abs/2610.11981)，ORCID 与 BESIII 链接由用户提供。查看了 Chromium 桌面目录及手机 arXiv 截图，标题/署名/日期/两链接正常。截图为 `artifacts/screenshots/academic-{1440,390}-{directory,arxiv}.png`。

测试全程拦截外网，外部网络请求和真实远端写入均为 0；源码保持原字节。未验证外部网站点击后的实时内容、手机真机、品牌/历史浏览器或线上新部署。Publications 分类数据与维护说明见其各自目录，未来扩展仍须重新测试。
