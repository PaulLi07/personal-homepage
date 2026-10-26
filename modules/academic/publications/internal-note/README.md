# 内部材料课题组目录

入口为 `#academic/publications/internal-note`，先选择课题组，再阅读对应材料。`data.js` 只登记Publications分类外壳，`groups.js` 维护独立数据接口，各课题组自己的目录保存条目和中文说明；不把内部材料混入arXiv或Published数据。

## 数据与接口

- `Homepage.registerInternalNoteGroup(group)`：登记课题组，字段为 `{ id, label, description, entries }`。课题组标识不重复，资料全为英文。
- `Homepage.getInternalNoteGroups()`：读取并重新校验所有组，返回包含条目及简介段落的深复制；调用者修改结果不改变已登记资料。
- 条目字段为 `{ id, identifier, title, titleTex?, authors, summary, url }`，没有用户提供的日期时不生成日期。`summary`为1–20个 `{ text, tex? }` 段落：纯文本作为回退，可选 `tex` 使用 `\(...\)` 行内公式调用共享数学接口。
- 标识最多64字符，只用小写字母、数字及单连字符；每组最多500条。题名最多800字符、LaTeX题名1600、作者300、编号150；简介每段纯文本最多5000、LaTeX混排最多2400字符。外链必须为无账号信息的绝对HTTPS地址，拒绝空白与控制字符。
- 未知字段丢弃，组内重复条目标识拒绝；不同课题组可独立使用相同条目标识。每次读取重验，失效数据由视图显示英文不可用提示。

## 新增课题组

1. 新建独立目录及 `data.js`、中文 `README.md`，调用登记接口；资料来源由用户提供或经确认，不编造编号、作者、日期及贡献。
2. 在 `app/site.json` 中将新组脚本放在 `groups.js` 之后、视图接入之前。
3. 保持资料按组存放，检查组目录、详情、计数、返回、深链、键盘、公式、手机排版和既有arXiv/Published行为。

当前BESIII登记见[课题组说明](besiii/README.md)。本文中文、网页英文；本轮实际验证及未覆盖项由[Internal note记录](../../../../docs/modules/academic-publications-internal-note.md)统一记录，旧版空列表结论只作历史。

## 文档链接边界

主页仅展示站主指定的标题、作者、简介和合作组内部链接，不下载、复制或内嵌DocDB PDF，也不收集合作组登录凭据。内部链接的访问权限仍由合作组网站执行；当前主页上的元信息和简介为公开静态内容，不能把分组导航当成访问控制。

## 视图与本轮验证

`view.js`提供 `createInternalNotesView({groups, onNavigate}).render({host, route, signal})`，只读写传入宿主；返回幂等清理函数，切换或取消时撤销事件并移除所属内容。`styles.css`仅使用局部类名，长公式必要时在段内滚动，不撑宽详情。课题组目录为 `internal-note`，选中BESIII为 `internal-note-besiii`；两级返回沿用父导航、历史及焦点管理。

装配顺序为分类外壳、`groups.js`、各组`data.js`、内部视图，随后父Publications视图和接线；CSS在父样式之后。运行 `npm run test:internal-notes`、`npm run test:math`，再装配检查并实看桌面/手机、深链/刷新/返回、公式与链接。新增组同步登记 `docs/modules/` 和对应测试；BESIII记录见[专门登记](../../../../docs/modules/academic-publications-internal-note-besiii.md)。
