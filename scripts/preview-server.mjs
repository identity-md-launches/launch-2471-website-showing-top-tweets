import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

// A bounded, test-owned preview. Call close() in finally; no daemon is started.
export async function serveExport(extraRoutes = {}) {
  const root = resolve("dist");
  const server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      if (extraRoutes[path]) {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(extraRoutes[path]);
        return;
      }
      if (!path.startsWith("/preview/")) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      const filename = resolve(
        root,
        path.slice("/preview/".length) || "index.html",
      );
      if (!filename.startsWith(root + sep) && filename !== root)
        throw new Error("Outside export");
      if (!(await stat(filename)).isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        "Content-Type": `${mime[extname(filename)] || "application/octet-stream"}`,
        "Cache-Control": "no-store",
      });
      response.end(await readFile(filename));
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}/preview/`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
