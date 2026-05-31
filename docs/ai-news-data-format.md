# 每周 AI 新闻数据格式

自动化任务更新 `data/ai-news.json`。网站首页会读取 `featured: true` 的新闻作为首页精选；如果没有标记，则使用日期最新的一条。

```json
{
  "generatedAt": "2026-05-31T00:00:00+08:00",
  "featuredId": "news-id",
  "items": [
    {
      "id": "news-id",
      "title": "新闻标题",
      "date": "2026-05-31",
      "source": "来源名称",
      "sourceUrl": "https://example.com/news",
      "links": [
        {
          "label": "官网原文",
          "url": "https://example.com/news"
        },
        {
          "label": "媒体解读",
          "url": "https://example.com/media-report"
        }
      ],
      "summary": "100 字以内中文摘要。",
      "classroomAngle": "适合课堂讨论或导入的关联点。",
      "tags": ["AI", "教育", "伦理"],
      "featured": true
    }
  ]
}
```

更新建议：

- 优先选择可靠来源，保留原始链接，不转载全文。
- 面向初中生时，优先使用国内主流媒体、教育主管部门、学校/科研机构和权威科普平台的报道；国际专业网站作为补充对照。
- 每周建议 60% 以上新闻来自国内来源，例如人民网、新华网、央视网、光明网、中国新闻网、中国网信网、教育部、学校官网等。
- `sourceUrl` 保留官网或最权威来源；`links` 可同时放官网、主流媒体报道、面向学生更易读的背景解读。
- 每周保留 3-6 条即可，避免页面信息过载。
- 面向初中信息科技课堂改写摘要，强调概念、应用、风险或讨论问题。
- 首页只展示一条最重要新闻，其他新闻留在“每周 AI 新闻”页面。
