import { getStore } from "@netlify/blobs";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function getAdminToken() {
  try {
    if (typeof Netlify !== "undefined" && Netlify.env?.get) {
      return Netlify.env.get("ADMIN_TOKEN") || "";
    }
  } catch {
    // Fall back below when the Netlify global is unavailable.
  }

  return globalThis.Netlify?.env?.get?.("ADMIN_TOKEN") || globalThis.process?.env?.ADMIN_TOKEN || "";
}

function requireAdmin(req) {
  const configuredToken = getAdminToken();
  if (!configuredToken) return json({ error: "Not configured", message: "管理密码暂未设置。" }, 503);

  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const token = bearerToken || req.headers.get("x-admin-token") || "";

  if (token !== configuredToken) return json({ error: "Unauthorized", message: "管理密码不正确。" }, 401);
  return null;
}

function safeFilename(name) {
  const cleaned = String(name || "resource")
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return cleaned || "resource";
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return json({ error: "No file", message: "请选择要上传的文件。" }, 400);
  }

  const key = `resource-${Date.now()}-${safeFilename(file.name)}`;
  const store = getStore({ name: "course-files", consistency: "strong" });
  const bytes = await file.arrayBuffer();
  const contentType = file.type || "application/octet-stream";

  await store.set(key, bytes, {
    metadata: {
      contentType,
      filename: file.name || key,
      uploadedAt: new Date().toISOString(),
    },
  });

  return json({
    ok: true,
    key,
    filename: file.name || key,
    contentType,
    size: file.size || bytes.byteLength,
    url: `/api/file/${encodeURIComponent(key)}`,
  });
};

export const config = {
  path: "/api/upload",
};
