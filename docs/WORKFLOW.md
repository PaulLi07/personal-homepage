# 基本工作协议

本文件说明日常工作流程；代理执行约定见根目录 `AGENTS.md`。正式源码只在工作区根目录 `personal-homepage/` 维护。

## 1. 修改边界

- 页面使用英文、常规字形和适中字号，保持简洁学术风与宇宙主题。
- HTML 管结构，CSS 管样式，`content.js` 管学术与相册数据；不把样式和脚本重新塞入 HTML。
- 保留根目录页面和相对资源路径，保持无需构建即可部署；新的框架、依赖和目录迁移应有具体需求。
- 只填入用户提供的真实资料；占位图片替换时同步替代文本、说明和来源。
- 修改已有文件前读取相关源码与文档；保留用户未提交的改动，按本次任务范围编辑。

## 2. Git 开始与同步

`origin` 为 `https://github.com/PaulLi07/personal-homepage.git`，`main` 跟踪 `origin/main`。

```sh
git status --short --branch
git fetch origin
git log --oneline --left-right main...origin/main
```

工作区干净且本地可以快进时，在 `main` 上执行 `git pull --ff-only`。本仓库已设置 `pull.ff=only`、`push.default=simple` 和 `fetch.prune=true`；不会通过普通 pull 自动产生合并提交。

如果存在未提交改动、远端新变化或分歧，先检查差异并保留双方内容，再处理同步。不要使用硬重置、丢弃工作区或强制推送来覆盖变化。

小范围内容、修正或文档更新可在 `main` 上本地提交。跨模块功能或较大设计调整使用任务分支：

```sh
git switch -c feat/short-topic
```

任务完成并通过检查后再合入本地 `main`。本次项目规范化属于初始化整理，记录为 `main` 上的本地提交。

## 3. 检查与提交

```sh
npm run check
git diff --check
git diff
# 示例：仅暂存本次任务涉及的文件
git add README.md docs/WORKFLOW.md
git commit -m "docs: clarify project workflow"
git status --short --branch
```

- 提交信息使用 `feat:`、`fix:`、`style:`、`docs:`、`chore:` 加简短说明。
- 每个提交围绕一个目的，暂存前确认文件范围；系统文件、缓存、ZIP 和 Git 元数据不属于网站源码。
- 内容和资源修改检查实际数据与链接；布局、交互修改另检查桌面与手机、键盘操作、Escape、详情直达链接和浏览器后退。
- 增加栏目、改变数据结构或工作流程时，更新框架概要与对应说明；重要变更记录在 `CHANGELOG.md`。

## 4. 发布与交付

普通维护完成本地检查和 Git 提交，交付变更摘要、验证结果、提交状态及需要用户补充的资料。只有明确请求发布或推送时才更新远端；本次绑定远端本身不代表发布。

**手动上传：**运行 `npm run package`，解压 `../outputs/personal-homepage-source.zip`，进入解压后的 `personal-homepage/`，将其内部文件与子目录上传到仓库根目录。`.nojekyll` 也是需要保留的根目录文件。

**Git 推送：**在发布请求的范围内，检查 `origin/main` 的最新状态、处理分歧并确认待发布提交，再执行：

```sh
git push origin main
```

推送可能需要用户现有的 GitHub 身份认证。不要将令牌写入远端 URL、配置文件或仓库。Pages 部署完成后，检查线上首页、学术详情、照片和手机布局。

如果通过 GitHub 网页上传了更新，之后先 `git fetch origin` 再比较并同步本地，防止本地与线上形成两份不同的源码。

## 5. 常用维护入口

| 操作 | 命令 / 文件 |
|---|---|
| 本地预览 | `npm run preview`，默认端口 8767 |
| 修改学术 / 生活内容 | `js/content.js`；增加首页入口时同步 HTML |
| 替换图片 | `assets/images/` 与 `docs/image-sources.md` |
| 项目检查 | `npm run check` |
| 打包到指定位置 | `python3 scripts/package.py --output /path/to/site.zip` |
| 查看远端绑定 | `git remote -v` |
| 查看待发布提交 | `git log --oneline origin/main..HEAD` |
