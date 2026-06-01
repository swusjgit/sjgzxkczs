const DATASETS = {
  news: {
    title: "每周 AI 新闻",
    help: "编辑新闻条目、首页主推和学生思考问题。",
    staticPath: "data/ai-news.json",
    apiPath: "/api/content/news",
  },
  resources: {
    title: "资源库",
    help: "维护资源分类和资源条目。第一版先保存结构化数据，文件上传后续再加。",
    staticPath: "data/resources.json",
    apiPath: "/api/content/resources",
  },
  works: {
    title: "学生作品",
    help: "维护作品标题、说明、标签和展示信息。",
    staticPath: "data/works.json",
    apiPath: "/api/content/works",
  },
  tools: {
    title: "课堂工具",
    help: "维护课堂工具名称、说明、标签和访问路径。",
    staticPath: "data/tools.json",
    apiPath: "/api/content/tools",
  },
};

const editor = document.querySelector("#json-editor");
const title = document.querySelector("#dataset-title");
const help = document.querySelector("#dataset-help");
const source = document.querySelector("#dataset-source");
const statusBox = document.querySelector("#admin-status");
const tokenInput = document.querySelector("#admin-token");
const tabs = document.querySelectorAll("[data-key]");

let activeKey = "news";

function setStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = `admin-status ${type}`.trim();
}

function getToken() {
  return sessionStorage.getItem("courseAdminToken") || tokenInput.value.trim();
}

function setDatasetUi(key) {
  const dataset = DATASETS[key];
  activeKey = key;
  title.textContent = dataset.title;
  help.textContent = dataset.help;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.key === key));
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("application/json")) {
    throw new Error(`Cannot load ${path}`);
  }
  return response.json();
}

async function loadDataset(key = activeKey) {
  const dataset = DATASETS[key];
  setDatasetUi(key);
  setStatus("正在加载数据...");
  source.textContent = "加载中";

  try {
    const data = await fetchJson(dataset.apiPath);
    editor.value = JSON.stringify(data, null, 2);
    source.textContent = "云端数据";
    setStatus("已加载云端数据。");
  } catch {
    try {
      const data = await fetchJson(dataset.staticPath);
      editor.value = JSON.stringify(data, null, 2);
      source.textContent = "本地默认";
      setStatus("云端暂无数据，已加载本地默认文件。保存后会写入云端。");
    } catch (error) {
      editor.value = "";
      source.textContent = "加载失败";
      setStatus(`加载失败：${error.message}`, "error");
    }
  }
}

function parseEditor() {
  try {
    return JSON.parse(editor.value);
  } catch (error) {
    setStatus(`JSON 格式错误：${error.message}`, "error");
    return null;
  }
}

async function saveDataset() {
  const token = getToken();
  if (!token) {
    setStatus("请先输入管理令牌。", "error");
    tokenInput.focus();
    return;
  }

  const data = parseEditor();
  if (!data) return;

  const dataset = DATASETS[activeKey];
  setStatus("正在保存到云端...");

  try {
    const response = await fetch(dataset.apiPath, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "保存失败");

    source.textContent = "云端数据";
    setStatus(`已保存到云端：${result.updatedAt || "刚刚"}`, "success");
  } catch (error) {
    setStatus(`保存失败：${error.message}`, "error");
  }
}

async function resetCloudData() {
  const token = getToken();
  if (!token) {
    setStatus("请先输入管理令牌。", "error");
    tokenInput.focus();
    return;
  }

  const ok = window.confirm("确认删除这类云端数据，恢复使用本地默认文件吗？");
  if (!ok) return;

  const dataset = DATASETS[activeKey];
  setStatus("正在删除云端覆盖数据...");

  try {
    const response = await fetch(dataset.apiPath, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "删除失败");
    setStatus("云端覆盖数据已删除，正在重新加载本地默认文件。", "success");
    await loadDataset(activeKey);
  } catch (error) {
    setStatus(`删除失败：${error.message}`, "error");
  }
}

function formatJson() {
  const data = parseEditor();
  if (!data) return;
  editor.value = JSON.stringify(data, null, 2);
  setStatus("JSON 已格式化。");
}

function rememberTokenForSession() {
  const token = tokenInput.value.trim();
  if (!token) {
    setStatus("请输入管理令牌。", "error");
    tokenInput.focus();
    return;
  }
  sessionStorage.setItem("courseAdminToken", token);
  setStatus("管理令牌已在本次会话中记住。", "success");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => loadDataset(tab.dataset.key));
});

document.querySelector("#reload-data").addEventListener("click", () => loadDataset(activeKey));
document.querySelector("#format-json").addEventListener("click", formatJson);
document.querySelector("#save-data").addEventListener("click", saveDataset);
document.querySelector("#reset-cloud").addEventListener("click", resetCloudData);
document.querySelector("#remember-token").addEventListener("click", rememberTokenForSession);

tokenInput.value = sessionStorage.getItem("courseAdminToken") || "";
loadDataset(activeKey);
