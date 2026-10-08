# Yuhong Li — Personal Homepage

纯静态英文个人主页，可以直接上传到 GitHub Pages。无需安装依赖、无需构建。

## 固定源码与后续维护

这个 `personal-homepage` 文件夹直接位于工作区根目录，是后续维护的正式源码。以后新增论文、修改简介、替换照片、调整设计，都在这一份文件中完成。

维护约定保存在 `AGENTS.md`，包含页面风格、已确认的个人资料、文件职责和发布方式。之后可以直接提出修改要求，先修改本地源码并检查预览，再由你上传到 GitHub 更新网站。

`outputs/personal-homepage` 是指向此文件夹的兼容链接，旧的本地预览地址仍然可用。`outputs` 中其他解压副本或历史网页仅作为旧版本，不作为维护入口。源码 ZIP 是交付快照；有更新时应重新打包，或直接上传本文件夹内的最新文件。

## 文件结构

```text
personal-homepage/
├── AGENTS.md               后续维护约定
├── index.html              首页内容与页面结构
├── credits.html            图片来源页
├── css/
│   └── styles.css          所有布局、字体、响应式样式
├── js/
│   ├── content.js          学术条目、生活相册的文字与图片配置
│   ├── transitions.js      开场、五栏过渡、图片展开动画
│   ├── gallery.js          学术预览、全屏详情、相册与链接状态
│   └── main.js             导航、滚动、元素进入动画
├── assets/
│   ├── favicon.svg         站点小图标
│   └── images/             本地图片，可逐个替换
├── docs/
│   ├── image-sources.md    图片对应位置和来源
│   ├── reference-analysis.md  参考网站源码分析与框架映射
│   └── download-manifest.json 原始下载地址
└── .nojekyll               GitHub Pages 静态文件标记
```

## 上传到已有仓库

1. 打开 <https://github.com/PaulLi07/personal-homepage>，点击 **Add file → Upload files**。
2. 将这个文件夹**里面的文件和子文件夹**拖入上传区。不要上传 ZIP 本身，也不要把整个 `personal-homepage` 文件夹作为额外一层目录上传。`index.html` 必须位于仓库根目录。
3. 点击 **Commit changes**。如果仓库已有旧的 `index.html`，用新版覆盖；`css`、`js`、`assets`、`docs` 一起上传。
4. 打开 **Settings → Pages**：Source 选 **Deploy from a branch**，Branch 选 **main**，Folder 选 **/(root)**，保存。没有购买域名时，Custom domain 留空即可。
5. 部署完成后访问 <https://paulli07.github.io/personal-homepage/>。仓库名保持 `personal-homepage` 时，网址就是这个。

GitHub 网页上传隐藏文件不方便时，`.nojekyll` 可以在仓库中用 **Add file → Create new file** 单独创建。当前站点不使用下划线目录，缺少它也不会影响这些常规文件的访问。

## 在本地预览

直接双击 `index.html` 可以浏览。脚本使用普通的 `defer` 加载，不依赖模块服务或构建工具。

也可以在本目录运行：

```sh
python3 -m http.server 8767
```

然后访问 <http://127.0.0.1:8767/>。

## 以后修改

- **姓名、学校、简介、邮箱、首页文案**：编辑 `index.html`。邮箱在导航、简介和联系区都有出现，请一起更新。
- **研究、论文、笔记、项目**：编辑 `js/content.js` 中 `academic` 的对应对象。将真实条目加入 `entries` 数组；当前没有编造任何研究题目或论文。
- **生活相册与故事**：编辑 `js/content.js` 中的 `life`。条目结构与学术部分一致。
- **替换图片**：将新图片保存为 `assets/images/` 下的对应同名 JPG，即可替换所有使用位置。替换清单见 `docs/image-sources.md`。
- **更新图片说明和来源**：同时修改 `index.html` 中的 `alt`/图片说明、`js/content.js` 中的 `imageAlt`/`credit`/`source`，以及 `credits.html`。若不用占位图，请删除占位说明。
- **字体、颜色、间距**：编辑 `css/styles.css`。页面使用系统常规字体，不使用窄体字体。
- **增加可下载笔记**：可创建 `assets/files/` 并放入 PDF，然后在条目的 `url` 中填写 `assets/files/文件名.pdf`。

例如，将 Notes 的 `entries: []` 改为：

```js
entries: [
  {
    title: "Your actual note title",
    meta: "Study notes · 2026",
    description: "A short description of the note.",
    url: "assets/files/your-note.pdf"
  }
]
```

学术详情可以通过 `#academic/research`、`#academic/publications`、`#academic/notes`、`#academic/projects` 直接链接。生活相册使用 `#life/moments` 等链接。关闭详情后返回原页面；浏览器后退也可以关闭详情。

## 设计与素材

按用户提供的参考站点源码重建纵向页面框架：全屏背景首页、左右分栏简介、四个缩略图与大图预览、全屏详情、错落照片和联系区。字体按用户要求换为常规字形和适中的字号。

所有图片均为网上下载的 NASA 或 Unsplash 占位素材。此版本没有使用 AI 生成图片，图片已包含在源码目录中，运行时无需访问外部图片服务。
