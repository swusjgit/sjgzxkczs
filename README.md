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
