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

## 文案规则

网站页面上显示给使用者看的文字，应当使用面向学生的表达。避免在页面文案中出现 JSON、Netlify Blobs、接口、云端存储、文件路径等实现细节。管理页面只需要说明这是教师使用的入口，学生不能访问或修改内容。
