const DATA_PATHS = {
  tools: "data/tools.json",
  news: "data/ai-news.json",
  resources: "data/resources.json",
  works: "data/works.json",
};

const FALLBACK_DATA = {
  tools: { tools: [] },
  news: { generatedAt: "", featuredId: "", items: [] },
  resources: { categories: [], items: [] },
  works: { items: [] },
};

const state = {
  tools: [],
  news: [],
  resources: { categories: [], items: [] },
  works: [],
};

const app = document.querySelector("#app");

const iconMap = {
  tools: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m14.7 6.3 3 3"/><path d="M8 16 18.5 5.5a2.1 2.1 0 0 1 3 3L11 19l-4 1 1-4Z"/><path d="m2 22 5-5"/><path d="m5 19 3 3"/></svg>`,
  resources: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A3.5 3.5 0 0 1 17.5 20h-11A3.5 3.5 0 0 1 3 16.5Z"/></svg>`,
  works: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 17 4.2-4.2a1.5 1.5 0 0 1 2.1 0L14 15.5l1.3-1.3a1.5 1.5 0 0 1 2.1 0L20 17"/></svg>`,
  news: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M14 3v5h5"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>`,
  tree: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="9" y="3" width="6" height="5" rx="1.2"/><rect x="3" y="16" width="6" height="5" rx="1.2"/><rect x="15" y="16" width="6" height="5" rx="1.2"/><path d="M12 8v4"/><path d="M6 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>`,
  puzzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h7v7h-7z"/></svg>`,
  game: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M8 3v18"/><path d="M16 3v18"/><path d="M3 8h18"/><path d="M3 16h18"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>`,
};

async function loadJson(key) {
  try {
    const response = await fetch(DATA_PATHS[key], { cache: "no-store" });
    if (!response.ok) throw new Error(`Cannot load ${DATA_PATHS[key]}`);
    return await response.json();
  } catch (error) {
    console.warn(error);
    return FALLBACK_DATA[key];
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeHref(value = "#") {
  const href = String(value || "#");
  if (
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("素材/")
  ) {
    return escapeHtml(href);
  }
  return "#";
}

function getRoute() {
  return window.location.hash.replace(/^#\/?/, "") || "home";
}

function setActiveNav(route) {
  document.querySelectorAll("[data-nav]").forEach((item) => {
    item.classList.toggle("active", item.dataset.nav === route);
  });
}

function formatDate(dateString) {
  if (!dateString) return "待更新";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return escapeHtml(dateString);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function tagsTemplate(tags = []) {
  return `
    <div class="tag-list">
      ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function getNewsLinks(item) {
  const links = Array.isArray(item.links) ? item.links.filter((link) => link?.url) : [];
  if (links.length) return links;
  return item.sourceUrl ? [{ label: item.source || "查看来源", url: item.sourceUrl }] : [];
}

function renderNewsLinks(item, options = {}) {
  const links = getNewsLinks(item);
  if (!links.length) return "";
  const primaryClass = options.featured ? "blue" : "ghost";

  return `
    <div class="card-actions news-actions">
      ${links.map((link, index) => {
        const href = safeHref(link.url);
        const label = escapeHtml(link.label || (index === 0 ? "查看来源" : "延伸阅读"));
        const className = index === 0 ? primaryClass : "ghost";
        const external = String(link.url || "").startsWith("http") ? 'target="_blank" rel="noreferrer"' : "";
        return `<a class="button ${className}" href="${href}" ${external}>${label}</a>`;
      }).join("")}
    </div>
  `;
}

function getFeaturedNews() {
  const featured = state.news.find((item) => item.featured);
  if (featured) return featured;
  return [...state.news].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

function quickCard({ route, icon, title, description }) {
  return `
    <a class="quick-card" href="#/${route}">
      <span class="icon-tile ${icon}">${iconMap[icon]}</span>
      <span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
      </span>
      <span class="quick-arrow" aria-hidden="true">→</span>
    </a>
  `;
}

function renderHome() {
  const featuredNews = getFeaturedNews();
  const featuredTool = state.tools.find((tool) => tool.featured) || state.tools[0];

  return `
    <div class="page-stack">
      <section class="hero">
        <div class="hero-copy">
          <h1>欢迎来到 <strong>信息科技课程助手</strong></h1>
          <p>把课堂工具、学习资源、学生作品和每周 AI 新闻集中在一起，让每一次信息科技课都更清晰、更好用。</p>
          <div class="hero-actions">
            <a class="button primary" href="#/tools">进入课堂工具</a>
            <a class="button ghost" href="#/ai-news">查看每周 AI 新闻</a>
          </div>
        </div>
        <div class="hero-panel" aria-label="信息科技课堂示意图">
          <div class="hero-visual">
            <div class="code-window">
              <div class="window-top"><span></span><span></span><span></span></div>
              <div class="window-body">
                <div class="code-line short"></div>
                <div class="code-line"></div>
                <div class="code-line mid"></div>
                <div class="code-line short"></div>
              </div>
            </div>
            <div class="node-demo">
              <div>AI 三要素</div>
              <div>数据</div>
              <div>算法</div>
              <div>算力</div>
            </div>
          </div>
        </div>
      </section>

      <section class="quick-grid" aria-label="主要入口">
        ${quickCard({
          route: "tools",
          icon: "tools",
          title: "课堂工具",
          description: "决策树、启发式搜索、井字棋 AI 等课堂可用工具。",
        })}
        ${quickCard({
          route: "resources",
          icon: "resources",
          title: "资源库",
          description: "先预留课件、素材包、任务单和示例文件入口。",
        })}
        ${quickCard({
          route: "works",
          icon: "works",
          title: "学生作品",
          description: "展示课堂成果，沉淀优秀项目与创意表达。",
        })}
        ${quickCard({
          route: "ai-news",
          icon: "news",
          title: "每周 AI 新闻",
          description: "自动汇总适合课堂导入的 AI 动态和讨论点。",
        })}
      </section>

      <section class="home-main">
        <article class="panel">
          <div class="panel-header">
            <h2>本周 AI 新闻精选</h2>
            <a class="text-link" href="#/ai-news">查看全部 →</a>
          </div>
          ${featuredNews ? renderFeaturedNews(featuredNews) : renderNoNews()}
        </article>

        ${featuredTool ? renderToolSpotlight(featuredTool) : ""}
      </section>
    </div>
  `;
}

function renderFeaturedNews(item) {
  return `
    <div class="featured-news">
      <div class="news-illustration" aria-hidden="true"><strong>AI</strong></div>
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <div class="meta-row">
          <span>${formatDate(item.date)}</span>
          <span>${escapeHtml(item.source || "来源待补充")}</span>
        </div>
        ${tagsTemplate(item.tags)}
        ${renderNewsLinks(item, { featured: true })}
      </div>
    </div>
  `;
}

function renderNoNews() {
  return `
    <div class="featured-news">
      <div class="news-illustration" aria-hidden="true"><strong>AI</strong></div>
      <div>
        <h3>每周 AI 新闻等待自动更新</h3>
        <p>自动化确认后，这里会展示本周最适合课堂导入的一条 AI 新闻。</p>
        <div class="card-actions">
          <a class="button blue" href="#/ai-news">查看页面结构</a>
        </div>
      </div>
    </div>
  `;
}

function renderToolSpotlight(tool) {
  return `
    <article class="panel tool-spotlight">
      <div class="tool-spotlight-head">
        <div>
          <h3>${escapeHtml(tool.title)}</h3>
          <p>${escapeHtml(tool.description)}</p>
        </div>
        <a class="button primary" href="${safeHref(tool.href)}" target="_blank" rel="noreferrer">开始绘制</a>
      </div>
      <div class="decision-preview" aria-hidden="true">
        <div class="tree-mini">
          <div class="tree-node root">是否需要分类判断？</div>
          <div class="tree-branches">
            <div class="tree-node">画出条件</div>
            <div class="tree-node">连接分支</div>
            <div class="tree-node">得到结论</div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderToolsPage() {
  return `
    <div class="page-stack">
      <section class="section-title">
        <div>
          <h1>课堂工具</h1>
          <p>这里放置可直接用于课堂演示、学生探究和项目学习的小工具。已自动识别素材文件夹中的 HTML 工具。</p>
        </div>
      </section>
      <section class="tool-grid">
        ${state.tools.map(renderToolCard).join("")}
      </section>
    </div>
  `;
}

function renderToolCard(tool) {
  const icon = iconMap[tool.icon] || iconMap.tools;
  const statusChip = tool.statusLabel
    ? `<span class="status-chip ${tool.status === "planned" ? "planned" : ""}">${escapeHtml(tool.statusLabel)}</span>`
    : "";

  return `
    <article class="tool-card ${tool.featured ? "featured" : ""}">
      <div class="card-top">
        <span class="card-icon">${icon}</span>
        ${statusChip}
      </div>
      <h3>${escapeHtml(tool.title)}</h3>
      <p>${escapeHtml(tool.description)}</p>
      <div class="tool-tags">
        ${(tool.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="tool-path">${escapeHtml(tool.href)}</div>
      <div class="tool-actions">
        <a class="button primary" href="${safeHref(tool.href)}" target="_blank" rel="noreferrer">${escapeHtml(tool.cta || "打开工具")}</a>
      </div>
    </article>
  `;
}

function renderResourcesPage() {
  const categories = state.resources.categories?.length
    ? state.resources.categories
    : ["课件", "素材包", "课堂任务单", "示例文件", "拓展阅读", "软件指南"];

  return `
    <div class="page-stack">
      <section class="section-title">
        <div>
          <h1>资源库</h1>
          <p>这一页先保留为空状态，不接后端。以后可以把课件、素材包、任务单和示例文件逐步整理进来。</p>
        </div>
      </section>
      <section class="resource-frame">
        <div class="empty-visual" aria-hidden="true">
          <div class="folder-stack">
            <div class="folder-row">课件</div>
            <div class="folder-row">任务单</div>
            <div class="folder-row">素材包</div>
          </div>
        </div>
        <div class="resource-copy">
          <h2>资源库建设中</h2>
          <p>当前版本先把页面和分类结构搭好。等你把资源放到素材文件夹或后续接入后端后，可以按年级、主题、类型和关键词检索。</p>
          <div class="resource-categories">
            ${categories.map((category) => `<span>${escapeHtml(category)}</span>`).join("")}
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderWorksPage() {
  const works = state.works;
  return `
    <div class="page-stack">
      <section class="section-title">
        <div>
          <h1>学生作品展示</h1>
          <p>用于展示课堂项目、算法小作品、网页作品和 AI 创意应用。当前先放展示规范，等有作品素材后再生成作品卡片。</p>
        </div>
      </section>
      ${
        works.length
          ? `<section class="work-grid">${works.map(renderWorkCard).join("")}</section>`
          : renderWorksEmpty()
      }
      <section class="split-note">
        <article class="note-card">
          <h3>建议展示信息</h3>
          <p>作品名、班级、作品说明、技术关键词、课堂主题、作品图片或访问链接。为了保护隐私，可以不展示学生真实姓名。</p>
        </article>
        <article class="note-card">
          <h3>推荐作品类型</h3>
          <p>Scratch 创意编程、Python 小项目、网页设计、数据可视化、AI 应用设计、网络安全情境作品。</p>
        </article>
      </section>
    </div>
  `;
}

function renderWorksEmpty() {
  return `
    <section class="work-grid">
      ${["网页作品", "算法项目", "AI 创意应用"].map(
        (title) => `
          <article class="work-card">
            <div class="work-placeholder">${escapeHtml(title.slice(0, 2))}</div>
            <h3>${escapeHtml(title)}</h3>
            <p>作品征集中。后续可以从素材文件夹读取图片、说明和链接，形成正式展示卡片。</p>
          </article>
        `,
      ).join("")}
    </section>
  `;
}

function renderWorkCard(work) {
  return `
    <article class="work-card">
      <div class="work-placeholder">${escapeHtml(work.title.slice(0, 2))}</div>
      <h3>${escapeHtml(work.title)}</h3>
      <p>${escapeHtml(work.description)}</p>
      ${tagsTemplate(work.tags)}
    </article>
  `;
}

function renderAiNewsPage() {
  const news = state.news;
  return `
    <div class="page-stack">
      <section class="section-title">
        <div>
          <h1>每周 AI 新闻</h1>
          <p>每周汇总适合初中生阅读和讨论的 AI 动态，保留来源链接、学生提示和主题标签。</p>
        </div>
      </section>
      ${
        news.length
          ? `<section class="news-grid">${news.map(renderNewsCard).join("")}</section>`
          : renderAiNewsEmpty()
      }
      <section class="panel">
        <div class="panel-header">
          <h2>自动化更新规范</h2>
        </div>
        <ul class="guide-list" style="padding: 0 26px 26px;">
          <li><span>1</span><div>每周检索过去 7 天 AI 新闻，优先选择教育应用、生成式 AI、AI 安全与伦理、重要模型与工具动态。</div></li>
          <li><span>2</span><div>写入 <code>data/ai-news.json</code>，每条包含标题、日期、来源、链接、摘要、学生提示和标签。</div></li>
          <li><span>3</span><div>将最重要的一条标记为 <code>featured: true</code>，首页会自动展示。</div></li>
        </ul>
      </section>
    </div>
  `;
}

function renderNewsCard(item) {
  return `
    <article class="news-card ${item.featured ? "featured" : ""}">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <div class="student-tip"><strong>提示：</strong>${escapeHtml(item.studentTip || "待补充")}</div>
      <div class="news-source">
        ${formatDate(item.date)} · ${escapeHtml(item.source || "来源待补充")}
      </div>
      ${tagsTemplate(item.tags)}
      ${renderNewsLinks(item, { featured: item.featured })}
    </article>
  `;
}

function renderAiNewsEmpty() {
  return `
    <section class="resource-frame">
      <div class="empty-visual" aria-hidden="true">
        <div class="folder-stack">
          <div class="folder-row">搜索新闻</div>
          <div class="folder-row">整理学生提示</div>
          <div class="folder-row">同步首页精选</div>
        </div>
      </div>
      <div class="resource-copy">
        <h2>等待第一次自动化更新</h2>
        <p>自动化启用后，这里会出现每周 AI 新闻列表。当前页面结构已经准备好，后续只需要更新数据文件。</p>
      </div>
    </section>
  `;
}

function renderNotFound() {
  return `
    <section class="error-state">
      <div>
        <h1>页面没有找到</h1>
        <p>这个入口暂时不存在，先回到信息科技课程助手首页吧。</p>
        <p><a class="button primary" href="#/home">返回首页</a></p>
      </div>
    </section>
  `;
}

function render() {
  const route = getRoute();
  setActiveNav(route);
  const pages = {
    home: renderHome,
    tools: renderToolsPage,
    resources: renderResourcesPage,
    works: renderWorksPage,
    "ai-news": renderAiNewsPage,
  };

  app.innerHTML = pages[route] ? pages[route]() : renderNotFound();
  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

async function init() {
  const [tools, news, resources, works] = await Promise.all([
    loadJson("tools"),
    loadJson("news"),
    loadJson("resources"),
    loadJson("works"),
  ]);

  state.tools = tools.tools || [];
  state.news = news.items || [];
  state.resources = resources || { categories: [], items: [] };
  state.works = works.items || [];

  render();
}

window.addEventListener("hashchange", render);
init();
