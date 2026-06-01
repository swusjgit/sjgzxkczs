import { getStore } from "@netlify/blobs";

const ALLOWED_KEYS = new Set(["tools", "news", "resources", "works"]);

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getKey(req, context) {
  const url = new URL(req.url);
  return context.params?.key || url.searchParams.get("key") || "";
}

function getAdminToken() {
  return globalThis.Netlify?.env?.get?.("ADMIN_TOKEN") || "";
}

function requireAdmin(req) {
  const configuredToken = getAdminToken();
  if (!configuredToken) {
    return json(
      {
        error: "ADMIN_TOKEN is not configured",
        message: "请先在 Netlify 环境变量中设置 ADMIN_TOKEN，写入接口才会开启。",
      },
      503,
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const token = bearerToken || req.headers.get("x-admin-token") || "";

  if (token !== configuredToken) {
    return json({ error: "Unauthorized", message: "管理令牌不正确。" }, 401);
  }

  return null;
}

function validateContent(key, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "数据必须是 JSON 对象。";
  }

  if (key === "tools" && !Array.isArray(data.tools)) return "tools 数据需要包含 tools 数组。";
  if (key === "news" && !Array.isArray(data.items)) return "news 数据需要包含 items 数组。";
  if (key === "resources" && (!Array.isArray(data.categories) || !Array.isArray(data.items))) {
    return "resources 数据需要包含 categories 数组和 items 数组。";
  }
  if (key === "works" && !Array.isArray(data.items)) return "works 数据需要包含 items 数组。";

  return "";
}

export default async (req, context) => {
  const key = getKey(req, context);
  if (!ALLOWED_KEYS.has(key)) {
    return json(
      {
        error: "Unknown content key",
        message: "只支持 tools、news、resources、works 四类内容。",
      },
      400,
    );
  }

  const store = getStore({ name: "course-content", consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(key, { type: "json" });
    if (!data) {
      return json({ error: "Not found", message: "云端暂时没有这类数据。" }, 404);
    }

    return json(data, 200);
  }

  if (req.method === "PUT") {
    const adminError = requireAdmin(req);
    if (adminError) return adminError;

    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON", message: "请求内容不是合法 JSON。" }, 400);
    }

    const validationError = validateContent(key, body);
    if (validationError) {
      return json({ error: "Invalid content", message: validationError }, 422);
    }

    const updatedAt = new Date().toISOString();
    await store.set(key, JSON.stringify(body), {
      metadata: { updatedAt, key },
    });

    return json({ ok: true, key, updatedAt });
  }

  if (req.method === "DELETE") {
    const adminError = requireAdmin(req);
    if (adminError) return adminError;

    await store.delete(key);
    return json({ ok: true, key, reset: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = {
  path: ["/api/content/:key", "/api/content"],
};
