# 信息科技课程助手

重庆八中两江数据谷中学校信息科技课程助手网站。

## 后台数据同步

网站前台会优先读取 Netlify Functions 接口：

- `/api/content/news`
- `/api/content/resources`
- `/api/content/works`
- `/api/content/tools`

如果云端还没有数据，会自动回退到本地 `data/*.json` 文件。

管理页入口：

- `/admin.html`
- `/admin`

写入云端数据需要在 Netlify 环境变量中配置 `ADMIN_TOKEN`。管理页输入该令牌后，可以把 JSON 数据保存到 Netlify Blobs。

## 资源上传

教师在管理页进入“资源库”，可以上传 PDF、课件、压缩包或程序文件。上传成功后会自动保存到资源库，学生即可在资源库中下载。

上传文件通过 Netlify Blobs 存储，前台只展示资源名称、说明、文件名、大小和下载入口。

## 发布流程

Netlify 已绑定 GitHub 仓库，后续发布以 GitHub 为唯一入口：

1. 在本地完成修改并通过检查。
2. 提交到 Git。
3. 推送到 `main` 分支。
4. Netlify 自动从 GitHub 拉取最新代码并部署线上网站。

除非 Netlify 自动部署失败，平时不再手动运行 Netlify 部署命令。这样可以避免“先推 GitHub、再手动传 Netlify”的重复流程，也能让线上版本和 GitHub 仓库保持一致。

### Netlify 暂时不可用时

如果 Netlify 因额度、服务状态或其他原因暂时无法访问，仍然先把所有网站改动提交并推送到 GitHub。GitHub 仓库作为当前网站的唯一可信版本来源。

GitHub Pages 作为备用访问方案，仓库已加入 GitHub Pages 自动发布工作流。启用 GitHub Pages 后，备用地址为：

- `https://swusjgit.github.io/sjgzxkczs/`

Netlify 恢复后，继续由 Netlify 从 GitHub `main` 分支自动拉取最新版本。

## 文案规则

网站页面上显示给使用者看的文字，应当使用面向学生的表达。避免在页面文案中出现 JSON、Netlify Blobs、接口、云端存储、文件路径等实现细节。管理页面只需要说明这是教师使用的入口，学生不能访问或修改内容。
