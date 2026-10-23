# 本地行内公式排版

用于显式包含公式的公开学术题名；Publications 与 Academic 精选入口共用。普通英文、作者资料、文章正文仍按文本处理，不扫描整页，不接入作者发布或私密内容。

## 文件和装配

- `vendor/katex.min.js`：官方 KaTeX **0.19.0** 的 UMD 浏览器包，原字节保留。
- `vendor/katex.min.css`、`vendor/fonts/`：同版本样式及全部20份 WOFF2 字体；只删除 CSS 的 WOFF、TTF 后备引用，字体保持相邻相对路径。无 CDN 或外部运行时请求。
- `vendor/LICENSE`：发行包原始 MIT 许可证，保留原文。
- `render.js`：安全混排接口，不在加载时操作 DOM。
- `styles.css`：仅调整显式公式宿主的字号、字距和行内折行，不改变其他文字。

清单样式先加载 `vendor/katex.min.css`，再加载 `styles.css`；脚本在 `shared/runtime.js` 后、使用者之前依次加载 `vendor/katex.min.js`、`render.js`。本地文件打开和 GitHub Pages 子目录均使用相对路径。

## 公开接口

```js
Homepage.math.renderText(host, entry.titleTex, {fallback: entry.title});
```

传入宿主 DOM 节点、英文与 `\(...\)` 行内 LaTeX 混排字符串，以及纯文本回退。成功渲染至少一处公式时返回 `true`，其他情况返回 `false`。可多次调用同一宿主，整体替换内容；没有后台订阅或清理流程。

Publications 条目可选字段 `titleTex` 最多1600字符；原有必填 `title` 不变，作为无库、无效公式等情况的可读回退。保留纯文本题名可兼容旧数据和既有检索。示例：

```js
{
  title: "A measurement of χcJ decays",
  titleTex: "A measurement of \\(\\chi_{cJ}\\) decays"
}
```

只让公式部分进入 LaTeX；正文仍为文本节点。变量按数学斜体、希腊大写及 `\mathrm{...}` 按正常数学字形，上下标和反粒子横线由排版器处理。KaTeX 行内模式在最外层关系符号及二元运算符后允许换行，窄屏不将整段长题名锁成不可换行块。

## 边界与维护

固定 `trust:false`、`strict:"error"`、`throwOnError:true`，每次使用独立宏对象，并限制源长度、公式尺寸和宏展开次数。拒绝链接、外图和 HTML 扩展指令；不把文本或错误消息赋给 `innerHTML`。公式通过 KaTeX 的 DOM API 生成 HTML 与辅助 MathML，失败时整个宿主恢复纯文本，不展示红色错误源码或解析日志。

来源核对于2026-10-23：官方[浏览器安装](https://katex.org/docs/browser.html)、[选项](https://katex.org/docs/options.html)、[安全说明](https://katex.org/docs/security.html)。发行包下载自 <https://registry.npmjs.org/katex/-/katex-0.19.0.tgz>，已核对 npm 元数据的 SHA512 完整性：

```text
sha512-v6Tznz3zJ7u3niRCoDTsumM2+HA2XXcCu+WAacCeHD2z3p9A9Ks987o5FzfTGBN0e8A0vjEgIDvLbICrXpdw/Q==
```

更新时从官方发行包成组替换 JS、CSS、字体及许可证，重新完成 WOFF2 引用裁剪、`node scripts/test-math.cjs`、装配、检查和桌面/窄屏浏览器实测。离线测试包含真实 KaTeX 排版结果、上下标/横线/数学斜体、宏隔离、安全回退、可选数据字段及两处公开使用者；不能代替浏览器字体加载与实际视觉验证。

浏览器兼容性记录由本轮主任务统一登记；未实际测试的环境不能标记通过。本文中文，公式周围的网页文本、替代内容保持英文。
