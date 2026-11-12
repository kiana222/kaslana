# 个人网站 · Hugo

这是原个人网站的 Hugo 版本。网站仍为七个栏目的滚动单页，PPT 保持独立入口；资料文字、主题、音乐、证书轮播和打印样式沿用原站。

## 本地预览

在此电脑上双击 `预览网站.cmd`，看到服务启动后打开：

<http://localhost:1313/kaslana/>

修改数据或模板后，Hugo 会重新生成预览。关闭命令窗口可停止服务。

本机使用 `.local/hugo.exe`，版本为 **0.169.0**。`.local/` 只保存本机工具，不上传仓库。换电脑后安装同版本 Hugo，或将经安全检查的官方便携版放到 `.local/hugo.exe`；启动脚本也支持 PATH 中的 `hugo`。

双击 `构建网站.cmd` 可生成 `public/`。`public/` 是构建产物，后续维护应修改源码，并通过 Hugo 预览；直接双击源码模板或生成的 HTML 不能代替本地预览。

## 内容在哪修改

| 文件 | 内容 |
| --- | --- |
| `data/profile.yaml` | 姓名、头像、联系方式、显示的更新时间 |
| `data/about.yaml` | 个人定位、统计数字、标签 |
| `data/education.yaml` | 学校、专业、教育时间 |
| `data/skills.yaml` | 技能卡片和程度 |
| `data/experience.yaml` | 校园任职、任职时间、职责 |
| `data/practice.yaml` | 实践项目、说明、作品按钮与预览图 |
| `data/honors.yaml` | 荣誉名称及所属阶段 |
| `data/interests.yaml` | 兴趣标签、游戏信息、自创游戏面板 |
| `data/sections.yaml` | 导航、栏目标题、导语、栏目顺序 |
| `data/media.yaml` | 证书文件、证书说明、音乐列表 |

YAML 缩进用空格。普通字段直接改文字；以 `_html` 结尾的字段保留了原站高亮等少量 HTML，修改其中的文字时保留标签结构。列表中的 `class`、标签 `id` 是现有样式和交互的连接点，日常更新资料时保持它们原样。

页面显示的“数据更新时间”由 `data/profile.yaml` 的 `updated` 控制，修改资料时手动更新；构建不会自动把它改成系统日期。

自创游戏在实践按钮和兴趣面板各展示一次，更换地址时同步修改 `data/practice.yaml` 与 `data/interests.yaml`。

## 资源和页面结构

```text
data/                       可编辑的个人资料
layouts/home.html           首页框架
layouts/_partials/          栏目模板和公共标题
assets/css/site.css         原站样式
assets/js/site.js           原站交互，保留普通脚本及全局音乐函数
static/                     原图片、音乐、作品预览图及 PPT
content/_index.md           Hugo 首页入口
hugo.toml                   网站地址与 Hugo 配置
.github/workflows/hugo.yaml 自动构建和部署
```

`static/` 中的文件会按原相对路径复制到生成的网站。独立 PPT 入口仍为 `ppt/index.html`。

新增证书时，把图片放进 `static/`，再更新 `data/media.yaml` 的 `certFiles` 和 `certMeta`。新增音乐同样放入 `static/`，更新 `songs` 中的名称与路径。

## GitHub Pages 发布

发布目标：<https://kiana222.github.io/kaslana/>，仓库：<https://github.com/kiana222/kaslana>。

1. 将此目录的源码同步到仓库 **main 分支根目录**。确保包含 `.github/`、`data/`、`layouts/`、`assets/`、`static/`、`content/`、`hugo.toml` 和 `.hugo-version`。
2. 不上传 `.local/`、`public/`、`resources/` 和 `.hugo_build.lock`；已在 `.gitignore` 中排除。
3. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
4. 推送 main 分支后，工作流自动构建并部署。也可在 Actions 中手动运行 **Build and deploy Hugo**。
5. 等待构建和部署两项任务成功，再查看线上网址。

首次迁移时，原仓库根目录的 `index.html` 及平铺资源已经改由 Hugo 模板与 `static/` 管理。建议同步清理仓库里的旧根文件，避免维护两份。通过网页上传新文件不会自动删除旧文件；旧文件不参与这份工作流的构建，后续应以本目录中的 Hugo 源码为准。

工作流使用固定 Hugo 版本和官方 Linux 包校验值，官方 Actions 也固定到已核实的提交。以后升级 Hugo 时，同步更新 `.hugo-version`、本机工具、工作流的 `HUGO_VERSION` 和对应 `HUGO_SHA256`，并重新构建验证。

如果更换仓库路径或域名，更新 `hugo.toml` 中的 `baseURL`。GitHub Actions 构建时会采用 Pages 配置返回的实际发布地址。

## 参考

- [Hugo 项目结构](https://gohugo.io/getting-started/directory-structure/)
- [Hugo 数据文件](https://gohugo.io/functions/hugo/data/)
- [Hugo 部署到 GitHub Pages](https://gohugo.io/host-and-deploy/deploy-to-github-pages/)
