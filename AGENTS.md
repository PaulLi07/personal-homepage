# 个人主页维护约定

正式源码为当前 personal-homepage/；outputs/personal-homepage 是兼容链接，其他解压目录不是工作副本。开始先读本文件、[框架](docs/ARCHITECTURE.md)、[工作协议](docs/WORKFLOW.md)及受影响模块README。

## 语言与模块

- **所有说明文档用中文，所有网页呈现内容用英文。** 包括README、协议、维护/测试记录，以及网页提示、署名、alt和ARIA；专有名称、代码、命令和原始版权声明保留原文。
- 每次扩展模块，更新就近简洁README与 docs/modules/ 兼容性记录，并在[模块目录](docs/modules/README.md)登记。未实测环境写未测试，不复用历史通过结论。
- 按人类理解和使用的功能划分，各模块独立保存代码、数据、图片、工具和说明；公开接口加小型胶水接线。不按文件类型集中业务，不读其他模块私有实现。
- 确认资料：Yuhong Li，Nankai University研究生；High energy physics、Theory beyond the Standard Model；2310408@mail.nankai.edu.cn；GitHub PaulLi07；ORCID 0009-0005-6858-4000。不编造科研角色、成果、经历或故事。

## 运行与设计边界

- app/site.json 声明装配顺序，app/main.js只接线。修改源码后运行 npm run assemble，提交生成的根index.html、credits.html，不手改产物。
- 保留相对路径和静态Pages部署；主页支持文件打开，实验地图ES Module须用HTTP。独立页面须在清单登记。CSS/静态JS按内容哈希版本化；两份在线文章数据通过liveScripts保持原URL。
- 保持深色、常规字形、适中标题的Apple风格；Life黄色手写涂鸦与Academic黑白漫画为已批准例外。当前模块源码/README优先，历史设计不自动恢复。
- 粒子微小密集、白色实心、清晰不发光，只显示在显式纯黑区；随页面滚动同向等距移动，保留局部指针搅动。照片不覆盖，路牌/椰林透明空隙透出粒子。
- Home当前使用站主提供的hero-dragon.jpg，Contact使用站主提供的background.png，不推断图中身份、地点、摄影者。About原人像 modules/about/images/portrait.jpg 是用户已有未提交文件，保持原字节，不暂存/回退/覆盖；网页使用相册衍生图。
- About桌面5%空白、65%照片、25%信息、5%空白，说明横跨两列；Academic当前椰林/图窗/60px人物、Life拍立得构图由各模块维护，不因架构维护改视觉。
- Projects直接展示两项目对齐入口；Physicists一步进入档案并返回Projects，旧中间路由仅兼容书签。BESIII删除仅限Projects入口，论文/Internal note/科学引用保留。
- 预览无热更新，装配后刷新用户实际标签。正常点击导航等待动画稳定，检查固定栏不遮挡标题；hash正确不足以验收。

## 两项目数据维护

- 项目源码、数据、图片必须全部留在所属模块；日常维护不能依赖原HEP Web、符号链接或项目外服务。
- **规范JSON是唯一可编辑资料源；SQLite是可重建的本地维护库。** 各项目database/保存结构/迁移/适配器；maintenance/管理通用事务/备份；scripts/data.py只协调。数据库不接入网页，不建立双向独立编辑源。
- Physicists只维护英文资料与运行内容，不维护中文副本；中文说明仍遵守全站协议。保留英文内容、人物/事件顺序、生卒精度、已审定领域、补丁顺序和科学计算结果。
- Maps主键为(map_id, experiment_id)，不合并跨图同ID。Europe/UNSITED/多地点、分类/技术、来源顺序按规范资料，不由SQL推断。
- 原始成果和三层补丁分别保存，来源补丁→评估→编辑补丁的顺序保持；SQL不替代原Node数值计算，不重复套补丁。
- 实际数据库/备份/锁/日志全部在忽略的.maintenance/，Git/源码包/发布包排除；图片不放BLOB，仅登记路径/哈希/许可。迁移前一致性备份，失败事务回滚，恢复后核对版本及过期状态。详见[维护说明](docs/DATA-MAINTENANCE.md)。

## 作者、附件与私密边界

- Experience与Moments各维护独立集合/schema/路径，共用author服务；author是保留slug，正文不作为HTML执行。
- 只保存随机盐与PBKDF2-SHA256 600000次校验，不保存明文密码/PAT。主动选择记住后才加密保存PAT；刷新必须密码解锁并重验身份/所有者/写权限。退出清内存，Forget清缓存，401保留草稿并清失效连接。
- 只有用户主动点击Publish才写GitHub；零附件走Contents，有附件则以同一head/tree原子创建数据与附件提交，非强制更新main。冲突保留草稿，不能跨集合写入。测试用随机夹具和模拟API，不能使用真实凭据或发布测试文章。
- 每篇最多9张照片：原图每张≤10MiB，去元数据重绘最长边1920的JPEG，每张≤2MiB/合计≤18MiB，英文alt必填。PDF最多3份、每份≤10MiB/合计≤30MiB，英文标题必填、原字节保留。路径限同集合文章，tree最多13项，下载负载≤52MiB。完整协议见[作者说明](modules/author/README.md)与附件模块README。
- Relationship只保存通用封面/密文，不接公开附件；AES-GCM256、PBKDF2 600000次，独立至少12字符口令只在用户终端交互输入。.private/与外部明文不得读取/跟踪/打包/发布或强制暂存；关闭/切换/锁定清解密内容。详见[私密空间](modules/life/relationship/README.md)。

## 检查、Git与交付

- 开始检查状态并保留用户改动；大更新建任务和备份分支。本轮refactor/project-data-maintenance，回退backup/pre-maintenance-databases-2026-10-27（2d8dcda），其他历史备份保留。
- 先assemble，再check、相关测试和git diff --check；check只读。界面/数据/接口变更实测桌面/手机，记录日期、浏览器、模拟视口、结果和未覆盖项；单内核不冒称跨浏览器。
- 架构维护以运行路径/资源哈希不变验收；本轮唯一受控例外是用户要求的Physicists英文单语迁移，英文语义/筛选/排序/数值必须相同。随机粒子和轮播不用任意截图逐像素一致作为唯一证据。
- 仅暂存本任务文件，本地提交后快进整合main；**只有用户要求发布/推送才更新远端**。同步/发布先fetch并检查差异，只快进，不硬重置用户文件或强推。作者在线发布后先同步，避免旧包覆盖文章。
- origin获取HTTPS、推送SSH，main跟踪origin/main。源码包含维护工具/迁移/规范资料，发布包仅运行文件且路径不变；均排除Git、系统文件、缓存、.private/、.maintenance/。上传解压内部文件，不上传ZIP本身。
- 框架变化同步文档，重要更新记CHANGELOG。旧设计/分支/测试移至[历史归档](docs/history/pre-maintenance-2026-10-27/README.md)，不再堆进现行协议。

## 旧链接索引

以下锚点仅保留历史链接；现行要求以上文及模块README为准。

<a id="语言与模块要求"></a>

[语言与模块要求](docs/history/pre-maintenance-2026-10-27/AGENTS.snapshot.md#语言与模块要求)

<a id="已确认资料与设计偏好"></a>

[已确认资料与设计偏好](docs/history/pre-maintenance-2026-10-27/AGENTS.snapshot.md#已确认资料与设计偏好)

<a id="功能边界与文件职责"></a>

[功能边界与文件职责](docs/history/pre-maintenance-2026-10-27/AGENTS.snapshot.md#功能边界与文件职责)

<a id="experiencemoments-与统一作者入口"></a>

[Experience、Moments 与统一作者入口](docs/history/pre-maintenance-2026-10-27/AGENTS.snapshot.md#experiencemoments-与统一作者入口)

<a id="relationship-的私密边界"></a>

[Relationship 的私密边界](docs/history/pre-maintenance-2026-10-27/AGENTS.snapshot.md#relationship-的私密边界)

<a id="验证与交付"></a>

[验证与交付](docs/history/pre-maintenance-2026-10-27/AGENTS.snapshot.md#验证与交付)

<a id="git-与发布协议"></a>

[Git 与发布协议](docs/history/pre-maintenance-2026-10-27/AGENTS.snapshot.md#git-与发布协议)
