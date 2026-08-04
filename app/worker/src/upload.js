// Replaces base44.integrations.Core.UploadFile({ file }) -> { file_url }.
// Stores the file in the R2 bucket bound as env.UPLOADS, and serves it back
// through this same Worker at /files/:key (so no R2 public-bucket domain is needed).
export async function handleUpload(request, env) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const safeName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${crypto.randomUUID()}-${safeName}`;

  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  const fileUrl = `${env.API_URL}/files/${key}`;
  return Response.json({ file_url: fileUrl });
}

export async function serveFile(request, env, key) {
  const obj = await env.UPLOADS.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}
