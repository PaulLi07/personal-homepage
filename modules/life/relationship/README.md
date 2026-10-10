# Relationship 私密空间

入口为 `#life/relationship`。公开的照片、标题与来源仅说明入口；真正正文必须先在本地加密，浏览器取得口令后才解密展示。**当前 `encrypted.js` 注册 `null`，尚未配置私密内容或口令。** 页面显示英文未配置提示，不用普通 `entries` 作为替代正文。

## 文件与接口

| 文件 | 职责 |
|---|---|
| `content.js`、`images/cover.jpg` | 公开入口资料与占位封面；不得存私密经历或图片 |
| `encrypted.js` | 只注册 `null` 或版本化密文，由本地工具更新 |
| `security.js`、`security.css` | 英文密码表单、解密、正文展示、手动锁定与卸载清理 |
| `data.js`、`integration.js` | 密文 getter 和与共享弹窗的连接 |
| `../../../scripts/relationship.cjs` | 本地交互加密及密文格式检查，无第三方依赖 |

通过 `Homepage.registerDetail("life", "relationship", data)` 登记公开资料；密文通过 `registerEncryptedRelationship(payload)` 登记。`createRelationshipView({ payload: getter })` 返回 `render({ host, route, signal })`；共享详情传入宿主与取消信号，返回值为清理函数。切换或关闭时取消信号，移除正文和口令输入；重新进入需再次解锁。模块不读取兄弟模块内部。

## 本地配置

1. 在项目外保存 JSON，或使用被 Git 忽略的根 `.private/`；对象仅含英文字符串 `title` 与 `body`。标题非空且最多 300 字符，整个正文最多 1 MiB。不要把明文放进公开模块目录或普通内容文件。
2. 在本地交互终端运行：

   ```sh
   node scripts/relationship.cjs --input /项目外/private.json
   ```

3. 隐藏输入并确认独立的长随机口令，至少 12 字符。工具不从命令参数、环境变量或管道读取口令，避免口令进入命令历史。只更新 `encrypted.js`，不保存口令。
4. 执行 `node scripts/relationship.cjs --check`，再装配、检查和实际测试正确口令、错误口令、锁定、关闭与返回。`--check` 仅检查密文结构，不能证明口令正确。
5. 上传网站时只提交密文，不上传 `.private/` 或项目外明文。封面属于公开资源，需要保密的图片不能作为普通图片上传。

忘记口令无法从密文恢复。修改口令或正文时，用原始本地明文重新运行工具，再发布新的密文；保留自己的安全备份。

## 加密边界与验证

格式为 `{ version: 1, iterations, salt, iv, ciphertext }`，二进制字段使用 Base64。口令经 PBKDF2-SHA256 的 600000 轮派生为 AES-GCM-256 密钥，每次生成随机 16 字节盐和 12 字节 IV，使用 128 位认证标签与固定版本关联数据。算法参数依据 [PBKDF2 文档](https://developer.mozilla.org/en-US/docs/Web/API/Pbkdf2Params)和 [AES-GCM 文档](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams)。

公开访问者可以下载密文并尝试离线猜口令，因此口令强度仍然重要。解锁信息不写入 `localStorage`、`sessionStorage` 或文件，明文只在当前视图内暂时展示；锁定会移除 DOM 与持有引用，但 JavaScript 不能保证彻底擦除浏览器内存。不能防止已知口令的访问者保存已解密内容，也不能隐藏入口或公开封面。

本地临时测试已验证加密往返、Node/WebCrypto 互通、错误口令、篡改拒绝、格式与输入路径约束；未提交任何测试明文。浏览器布局、键盘、异步取消及各内核验证记录见 [兼容性测试](../../../docs/modules/life-relationship.md)，按实际结果填写，不用本地算法测试代替浏览器验证。
