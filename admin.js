const DATASETS = {
  news: {
    title: "每周 AI 新闻",
    help: "编辑新闻条目、首页主推和学生思考问题。",
    staticPath: "data/ai-news.json",
    apiPath: "/api/content/news",
  },
  resources: {
    title: "资源库",
    help: "上传 PDF、课件、压缩包和程序文件，也可以整理给学生看的资源说明。",
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
const resourceUpload = document.querySelector("#resource-upload");
const resourceTitle = document.querySelector("#resource-title");
const resourceCategory = document.querySelector("#resource-category");
const resourceDescription = document.querySelector("#resource-description");
const resourceFile = document.querySelector("#resource-file");

let activeKey = "news";

function setStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = `admin-status ${type}`.trim();
}

function getToken() {
  return sessionStorage.getItem("courseAdminToken") || tokenInput.value.trim();
}

function formatBytes(bytes = 0) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function fileExtension(filename = "") {
  const name = String(filename);
  const index = name.lastIndexOf(".");
  return index > -1 ? name.slice(index + 1).toUpperCase() : "文件";
}

function setDatasetUi(key) {
  const dataset = DATASETS[key];
  activeKey = key;
  title.textContent = dataset.title;
  help.textContent = dataset.help;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.key === key));
  resourceUpload.hidden = key !== "resources";
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
    const result = await persistDataset(dataset, data, token);
    source.textContent = "最新内容";
    setStatus(`已保存，网站内容已更新。${result.updatedAt ? `更新时间：${result.updatedAt}` : ""}`, "success");
  } catch (error) {
    setStatus(`保存失败：${error.message}`, "error");
  }
}

async function persistDataset(dataset, data, token) {
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
  return result;
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

async function uploadResource() {
  if (activeKey !== "resources") return;

  const token = getToken();
  if (!token) {
    setStatus("请先输入管理密码。", "error");
    tokenInput.focus();
    return;
  }

  const file = resourceFile.files?.[0];
  if (!file) {
    setStatus("请先选择一个文件。", "error");
    resourceFile.focus();
    return;
  }

  const name = resourceTitle.value.trim() || file.name;
  const category = resourceCategory.value.trim() || "学习资源";
  const description = resourceDescription.value.trim() || "点击打开学习资源。";

  const formData = new FormData();
  formData.set("file", file);
  setStatus("正在上传资源...");

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "上传失败");

    const current = parseEditor() || { categories: [], items: [] };
    const categories = Array.isArray(current.categories) ? current.categories : [];
    const items = Array.isArray(current.items) ? current.items : [];
    if (!categories.includes(category)) categories.push(category);

    items.unshift({
      id: `resource-${Date.now()}`,
      title: name,
      description,
      category,
      type: fileExtension(result.filename || file.name),
      url: result.url,
      storageKey: result.key,
      filename: result.filename,
      size: result.size || file.size,
      sizeLabel: formatBytes(result.size || file.size),
      contentType: result.contentType || file.type || "application/octet-stream",
      tags: [category],
      createdAt: new Date().toISOString(),
    });

    const nextData = { ...current, categories, items };
    editor.value = JSON.stringify(nextData, null, 2);
    setStatus("资源已上传，正在保存到资源库...");
    const saved = await persistDataset(DATASETS.resources, nextData, token);
    source.textContent = "最新内容";
    resourceTitle.value = "";
    resourceDescription.value = "";
    resourceFile.value = "";
    setStatus(`资源已上传并保存，学生现在可以下载。${saved.updatedAt ? `更新时间：${saved.updatedAt}` : ""}`, "success");
  } catch (error) {
    setStatus(`上传或保存失败：${error.message}`, "error");
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
document.querySelector("#upload-resource").addEventListener("click", uploadResource);

tokenInput.value = sessionStorage.getItem("courseAdminToken") || "";
loadDataset(activeKey);
