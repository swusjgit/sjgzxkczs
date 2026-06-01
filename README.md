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

教师在管理页进入“资源库”，可以上传 PDF、课件、压缩包或程序文件。上传后资源会先加入编辑区，确认无误后点击“保存内容”，学生即可在资源库中下载。

上传文件通过 Netlify Blobs 存储，前台只展示资源名称、说明、文件名、大小和下载入口。

## 文案规则

网站页面上显示给使用者看的文字，应当使用面向学生的表达。避免在页面文案中出现 JSON、Netlify Blobs、接口、云端存储、文件路径等实现细节。管理页面只需要说明这是教师使用的入口，学生不能访问或修改内容。
