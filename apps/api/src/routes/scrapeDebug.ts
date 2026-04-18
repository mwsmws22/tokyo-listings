import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Hono } from "hono";

const SCRAPE_DEBUG_DIR = path.resolve(process.cwd(), "output/scrape-debug");

function isScrapeDebugEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

function resolveCapturePath(fileName: string): string | null {
  if (!/^[a-z0-9-]+\.(html|json)$/i.test(fileName)) {
    return null;
  }
  const resolved = path.resolve(SCRAPE_DEBUG_DIR, fileName);
  if (!resolved.startsWith(SCRAPE_DEBUG_DIR)) {
    return null;
  }
  return resolved;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderJsonViewerHtml(file: string, body: string): string {
  const title = `Scrape Debug JSON - ${file}`;
  const escaped = escapeHtml(body);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        padding: 16px;
        background: #191724;
        color: #e0def4;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      }
      h1 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #9ccfd8;
        font-weight: 600;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.45;
        font-size: 12px;
        background: #1f1d2e;
        border: 1px solid #403d52;
        border-radius: 8px;
        padding: 12px;
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(file)}</h1>
    <pre>${escaped}</pre>
  </body>
</html>`;
}

export function registerScrapeDebugRoutes(app: Hono) {
  app.get("/api/scrape-debug/:file", async (c) => {
    if (!isScrapeDebugEnabled()) {
      return c.json({ error: "Not found" }, 404);
    }

    const file = c.req.param("file");
    const filePath = resolveCapturePath(file);
    if (!filePath) {
      return c.json({ error: "Invalid debug capture path" }, 400);
    }

    try {
      const body = await readFile(filePath, "utf-8");
      const isJson = file.endsWith(".json");
      const viewMode = c.req.query("view") === "1";
      if (isJson && viewMode) {
        return c.html(renderJsonViewerHtml(file, body), 200, {
          "cache-control": "no-store",
        });
      }
      const contentType = isJson ? "application/json; charset=utf-8" : "text/html; charset=utf-8";
      return c.body(body, 200, {
        "content-type": contentType,
        "cache-control": "no-store",
      });
    } catch {
      return c.json({ error: "Debug capture not found" }, 404);
    }
  });
}
