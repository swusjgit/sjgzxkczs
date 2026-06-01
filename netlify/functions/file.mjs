import { getStore } from "@netlify/blobs";

function notFound() {
  return Response.json({ error: "Not found" }, { status: 404 });
}

export default async (req, context) => {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const key = context.params?.key ? decodeURIComponent(context.params.key) : "";
  if (!key) return notFound();

  const store = getStore({ name: "course-files", consistency: "strong" });
  const data = await store.get(key, { type: "arrayBuffer" });
  if (!data) return notFound();

  const metadata = (await store.getMetadata(key)) || {};
  const contentType = metadata.contentType || "application/octet-stream";
  const filename = metadata.filename || key;

  return new Response(data, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      "Content-Type": contentType,
    },
  });
};

export const config = {
  path: "/api/file/:key",
};
