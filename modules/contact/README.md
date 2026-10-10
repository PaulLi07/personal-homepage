# 联系模块

提供邮箱、GitHub、ORCID、学校资料、年份及署名页入口。

- 入口：`#contact`。
- 文件：`section.html` 保存联系区与页脚，`styles.css` 管布局，`module.js` 管年份更新，`images/background.jpg` 为独立星系背景。
- 接口与边界：注册 `contact` 分区，在初始化传入的 `root` 内更新年份；导航回顶使用共享导航，不读取其他模块。
- 维护：修改链接与资料编辑片段；ORCID 使用用户提供的 `https://orcid.org/0009-0005-6858-4000`，与 About 一并核对，外链采用新标签页及 `noopener noreferrer`。背景可单独替换，同步英文署名及素材说明。更新年份逻辑只处理本模块节点。
- 验证：[兼容性测试记录](../../docs/modules/contact.md)；本轮运行 `npm run test:academic-profile` 检查 ORCID 外链、键盘与手机布局，再回归邮箱、GitHub、署名页和回顶链接及动态年份。本轮 `test:academic-profile` 三内核/三视口、共 72 流程通过，具体环境和未覆盖项见所链测试记录；外链目标和属性已核对，测试不访问外站。

本说明使用中文；片段和数据中的网页文字使用英文。修改源文件后装配，不手改根目录生成页面。
