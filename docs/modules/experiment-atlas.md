# 实验地图集接入记录

维护入口：[地图集说明](../../modules/academic/projects/experiment-atlas/README.md)。本板块归 Academic → Projects，地图在各自独立页面运行，所需源码、目录数据、档案和图片全部保存在主页源码内。原 HEP 目录不属于部署或运行依赖。

## 2026-10-25：首次接入

本次纳入英文中微子和暗物质地图，分别归 `neutrino/` 与 `dark-matter/`。后续新增地图遵循同一登记、独立资源与简洁中文说明约定；所有页面文字、提示、图注及无障碍标签使用英文。

### 独立性检查

从主页源码根目录运行：

```sh
python3 modules/academic/projects/experiment-atlas/tools/verify_portable.py
python3 modules/academic/projects/experiment-atlas/tools/verify_portable.py --json
```

工具只读取主页内的发布文件，不访问网络或原 HEP 源目录。它检查目录条目数量、两类档案路径及实际 JSON、档案标识、各条本地图片、HTML/CSS/JavaScript 静态资源引用、符号链接与本机地址。官方论文、合作组和图片来源外链可保留；运行时的脚本、样式、地图及档案资源必须使用本站相对路径。动态档案与图片地址按目录逐条检查，不能用静态扫描替代页面交互测试。

本轮最终实际运行结果为退出码 `0`：两张地图合计 `549` 条目录、`549` 份档案和 `549` 张本地图片（中微子 `252`，暗物质 `297`）；读取 `551` 份 JSON，解析 `1681` 项本地引用，扫描 `595` 份运行文件，识别 `6` 处 fetch 调用，错误列表为空。检查没有访问原 HEP 目录或网络。后续增加或修改地图后需重新运行，文件数量是本次快照，不是固定验收阈值。

迁移后的两套 Node 测试在独立复制副本内运行，合计 `51` 项（`36 + 15`）通过；两张地图各自的 `tools/build_data.py --check` 均通过。它们验证本地数据和现有逻辑，不替代以下浏览器预览，也不代表资料内容或图片复用许可审核。

### 浏览器实测

环境为 macOS 的 Codex 内嵌浏览器，工具未暴露独立浏览器内核或版本；本轮覆盖 `1440×1100` 桌面、`390×844` 和 `320×780` 手机模拟视口。三种视口页面横向溢出均为 `0`；地图内部保留约 `880px` 最小绘图宽度，可在自己的区域内横向平移，不计为页面溢出。

- Projects：桌面两列、手机单列，地图条数显示为中微子 `252`、暗物质 `297`；卡片可进入独立地图页。正式主页补查切换Notes时地图卡片清理为0、返回Projects恢复2张，保留BESIII与GitHub入口；最终新预览标签警告/错误日志为空。原标签因预览服务中断停在网络错误页，服务恢复后用同一应用内浏览器的新标签复核正式目录，不把错误页计为通过。
- 中微子地图：Europe 显示 `90` 项；叠加 Reactor 与 Scintillator 后为 `12` 项，再切 China 后为 `4` 项且欧洲轮廓隐藏。JUNO 本地档案和宽 `500px` 的代表图加载成功，图片放大形成双层对话框，Escape 可逐层关闭；实验深链刷新及浏览器前进、后退通过。
- 暗物质地图：总数 `297`；Europe、Direct 与 Noble liquid 组合为 `7` 项，切 USA 后为 `3` 项且欧洲轮廓隐藏。LZ 本地档案及宽 `1536px` 的图片、放大和深链刷新通过；`/` 搜索入口、Future `76` 项以及 XENON 搜索 `11` 项已核对。
- 手机模拟视口：`390px` 宽时中微子 China 显示 `17` 项，JUNO 档案对话框宽约 `357px`；`320px` 宽时 Austria `0` 项空状态、Future `68` 项及 Enter 激活入口卡片通过。

### 独立副本与子路径

将完整主页复制到临时目录 `personal-homepage/`，通过端口 `8768`、`/personal-homepage/` 前缀提供预览。此服务只暴露复制副本，原 HEP Web 目录不在服务可见范围内。实测 XENON 的本地 WEBP 图片加载、档案 JSON 下载链接指向副本中的本站资源，返回 Projects 的路径正确。该验证说明拷贝版本在 Pages 类似子路径下无需原目录运行；没有删除或改动用户原 HEP 目录。

只检查了 JSON 下载链接及目标路径，未核实操作系统中的实际下载文件。浏览器测试与静态检查相互补充，不把路径检查写成全部下载行为已经验证。

### 截图证据与限制

截图及 `portable-static.json`、`isolated-tests.txt` 保存在被忽略的 `artifacts/experiment-atlas-2026-10-25/`，不作为公开源码部署：

- `projects-desktop.png`、`projects-final-desktop.png`、`projects-mobile-390.png`：Projects 桌面与手机入口。
- `dark-matter-desktop.png`：暗物质地图桌面。
- `neutrino-mobile-390.png`、`neutrino-mobile-320.png`：中微子地图两种手机模拟视口。
- `juno-mobile-390.png`：JUNO 手机档案。
- `isolated-copy-xenon-mobile.png`：独立复制副本、子路径下的 XENON 档案。

本轮未进行独立 Chrome / Firefox / Safari、手机真机、真实触摸、线上 Pages 部署或外部参考链接可用性测试，也未重新进行科学资料审核或图片复用许可确认。视口模拟不等于真机，复制副本的本地通过不等于线上发布已完成。后续维护需按实际改动重新验证，不沿用本轮数字。
