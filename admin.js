const DATASETS = {
  news: {
    title: "每周 AI 新闻",
    help: "编辑新闻条目、首页主推和学生思考问题。",
    staticPath: "data/ai-news.json",
    apiPath: "/api/content/news",
  },
  resources: {
    title: "资源库",
    help: "整理资源分类和资源条目。文件上传功能以后再加。",
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
  setStatus("正在读取内容...");
  source.textContent = "读取中";

  try {
    const data = await fetchJson(dataset.apiPath);
    editor.value = JSON.stringify(data, null, 2);
    source.textContent = "最新内容";
    setStatus("已读取最新内容。");
  } catch {
    try {
      const data = await fetchJson(dataset.staticPath);
      editor.value = JSON.stringify(data, null, 2);
      source.textContent = "默认内容";
      setStatus("已读取默认内容。保存后会更新网站。");
    } catch {
      editor.value = "";
      source.textContent = "读取失败";
      setStatus("读取失败，请稍后再试。", "error");
    }
  }
}

function parseEditor() {
  try {
    return JSON.parse(editor.value);
  } catch {
    setStatus("内容格式不正确，请检查括号、引号和逗号。", "error");
    return null;
  }
}

async function saveDataset() {
  const token = getToken();
  if (!token) {
    setStatus("请先输入管理密码。", "error");
    tokenInput.focus();
    return;
  }

  const data = parseEditor();
  if (!data) return;

  const dataset = DATASETS[activeKey];
  setStatus("正在保存内容...");

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

    source.textContent = "最新内容";
    setStatus(`已保存，网站内容已更新。${result.updatedAt ? `更新时间：${result.updatedAt}` : ""}`, "success");
  } catch (error) {
    setStatus(`保存失败：${error.message}`, "error");
  }
}

async function resetCloudData() {
  const token = getToken();
  if (!token) {
    setStatus("请先输入管理密码。", "error");
    tokenInput.focus();
    return;
  }

  const ok = window.confirm("确认把这类内容恢复为默认状态吗？");
  if (!ok) return;

  const dataset = DATASETS[activeKey];
  setStatus("正在恢复默认内容...");

  try {
    const response = await fetch(dataset.apiPath, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "删除失败");
    setStatus("已恢复默认内容，正在重新读取。", "success");
    await loadDataset(activeKey);
  } catch (error) {
    setStatus(`删除失败：${error.message}`, "error");
  }
}

function formatJson() {
  const data = parseEditor();
  if (!data) return;
  editor.value = JSON.stringify(data, null, 2);
  setStatus("内容格式已整理。");
}

function rememberTokenForSession() {
  const token = tokenInput.value.trim();
  if (!token) {
    setStatus("请输入管理密码。", "error");
    tokenInput.focus();
    return;
  }
  sessionStorage.setItem("courseAdminToken", token);
  setStatus("管理密码已在本次会话中记住。", "success");
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
