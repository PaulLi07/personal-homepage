# Physicists项目

入口为 `#academic/projects/physicists`，从Projects项目目录选择进入。当前仅按站主要求建立独立项目，页面显示名称、准备中状态及简短占位说明；人物资料和具体功能尚未提供，不添加虚构内容或预设未来结构。

- `view.js`：提供 `Homepage.createPhysicistsView().render({host, signal})`，仅维护传入宿主中的内容，返回幂等清理函数；取消或重复渲染时移除所属内容。
- `integration.js`：通过 `registerAcademicProject(descriptor, view)` 登记名称、描述、状态和视图。清单须先加载父注册接口，再加载本项目视图与接线。
- `styles.css`：局部普通字号、中性面板和窄屏边距，不修改其他项目或共享详情。

返回Projects、历史与焦点交由父目录及共享详情处理，本模块不另建返回按钮、登录或发布功能，也不需要图片和外部服务。后续收到具体要求后在本目录扩展，同步简洁中文说明、英文页面及实际兼容性记录。

本次项目入口、直达、返回及桌面/手机验证由主维护流程登记在[测试记录](../../../../docs/modules/academic-projects-physicists.md)，未测试环境不得沿用其他模块结论。
