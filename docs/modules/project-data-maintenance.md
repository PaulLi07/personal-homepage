# 项目架构与数据库维护兼容性记录

就近说明：[通用引擎](../../maintenance/README.md)、[Maps数据库](../../modules/academic/projects/experiment-atlas/database/README.md)、[Physicists数据库](../../modules/academic/projects/physicists/database/README.md)。操作入口见[指南](../DATA-MAINTENANCE.md)。

<a id="project-data-maintenance-2026-10-27"></a>

## 2026-10-27 本轮范围

任务分支refactor/project-data-maintenance，回退backup/pre-maintenance-databases-2026-10-27，基线2d8dcda。用户已有原人像SHA256保持cc79adfc8573183f58116111bd72326688404b3306a9c07ad4d05b732de66635，未随任务提交。

新增本地SQLite结构/迁移/适配器/查询/备份/恢复，规范JSON仍为唯一编辑源。维护文档分离当前概要与历史，工具/测试分类且保留旧命令，旧输出完整归档，区分源码包和发布包。没有引入网页API、数据库连接、编辑界面或设计变化。

Physicists按用户补充改为英文单语。9份规范输入去除中文翻译、4份zh版本退役；原导入清单未改写，迁移单独记录。原英文人物值、九类筛选ID集合、事件顺序、721导航、2626年度值及Node浮点计算结果一致；总分2828.000000000002、峰值44.00218360071301。

## 本地数据与测试结果

环境：macOS26.2 arm64、Python3.14.3、SQLite3.51.2、Node.js25.8.0；实际版本与详细日志存artifacts/architecture-maintenance-2026-10-27/。所有测试本地执行，无真实GitHub写入、无凭据读取。

| 验证 | 结果 |
|---|---|
| 公共数据库事务/迁移/备份恢复/只读查询/损坏/并发锁 | 17项通过 |
| Maps真实适配器、复合ID/地区/关系/媒体SHA | 10项通过；549记录、549本地图，38跨图重复不合并 |
| Physicists适配器、历史日期/原始成果/补丁/逻辑篡改 | 9项通过；721人物、691事件、440补丁、721图片 |
| 分发隔离、静态资源闭合、兼容入口 | 5项通过 |
| 人物原核心及英文迁移语义 | 99项通过 |
| 两库真实init/check | 通过，560＋13份规范源，不过期 |
| Maps两份build_data/metadata/shell --check及资源闭合 | 通过，1681本地引用、549图片 |
| 既有11组离线命令的分类路径回归 | 通过；security包装器跳过测试已修复并实际重跑9项 |
| assemble、check、git diff --check | 通过；最后交付前再次核对 |

Maps完整规范源导出560份逐字节相同；两库完整资料备份/恢复及573份源导出演练另存recovery-drill.json。业务表被改但FK合法的损坏备份也会被拒绝，拒绝前后原库SHA相同。库、备份、WAL/SHM和锁均被忽略及打包排除。

## 网页兼容性与零视觉变化

浏览器：本任务内嵌浏览器，工具不提供内核具体版本，未冒称多内核测试。桌面1440×1000；手机模拟390×844与320×780，非真机。

- 2031份发布文件路径集合相同，2021份逐字节相同；10份受控差异只涉及Physicists英文数据/兼容脚本/英文方法说明和生成报告。全部HTML、CSS、图片、字体及非人物网页脚本/地图资料字节不变。
- Projects桌面两卡672.125×384.28125，390视口两卡339×486.1875，与基线文字/尺寸完全一致；320视口269×513.1875，页面无横向溢出。
- 实际点击Maps→两地图→档案→返回，Physicists一步打开→英文检索Einstein→人物详情/本地图片→返回Projects；领域筛选Particles显示178人。
- 中微子Europe＋Solar显示6条；暗物质Europe＋Direct＋Noble-liquid显示7条；手机地图横向滚动区域保留，档案图片实际加载。桌面/手机截图已查看。
- 两独立项目页面警告/错误日志为空。手机人物侧栏按原设计隐藏，未因此改界面。随机粒子/轮播不做任意截图逐像素比较。

未覆盖：Firefox/WebKit等独立内核、手机真机、线上部署、真实作者发布与外部学术链接认证；这些不写通过。未修改作者/Relationship业务或访问私密内容。

## 独立源码与发布包

完整源码包2261文件、静态发布包2031文件，均检查无SQLite/备份/私密目录/Git/证据。源码包独立解压后运行assemble、build:physicists、两库init/check、两地图build_data --check和整站check全部通过；重建后的2031发布文件与当前源码逐字节相同。

发布包单独解压，以http://127.0.0.1:8768/personal-homepage/模拟GitHub仓库前缀：Projects→Physicists→Einstein照片与返回、Maps→中微子→Borexino档案及图片均正常；警告/错误为空。两图2196动态档案/图片引用、721人物图片及两份方法帮助均在发布集合。临时预览已关闭，用户8767预览保留。

旧默认源码包和24项旧预览/HTML/解压副本原字节移动到outputs/history/pre-maintenance-2026-10-27，原位置/文件数/字节量/树SHA保存在清单；同名源码兼容链接、两份明确命名的回退ZIP、Git历史分支及其他独立项目输出保留。

本轮只本地维护提交并快进main，不推送GitHub。源码包和发布包在outputs/生成；修改后的维护记录同步重打源码包，不改变已验收的运行文件。
