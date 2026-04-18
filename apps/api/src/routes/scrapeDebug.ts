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

function withRosePinePreviewTheme(html: string): string {
  const themeStyle = `<style id="scrape-diagnostics-rose-pine-theme">
html, body {
  background: #191724 !important;
  color: #e0def4 !important;
}
a { color: #9ccfd8 !important; }
input, textarea, select, button {
  background: #1f1d2e !important;
  color: #e0def4 !important;
  border-color: #403d52 !important;
}
table, th, td {
  border-color: #403d52 !important;
}
pre, code {
  background: #1f1d2e !important;
  color: #e0def4 !important;
}
</style>`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${themeStyle}`);
  }
  return `${themeStyle}${html}`;
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

function renderHtmlPreviewViewerHtml(file: string, body: string): string {
  const title = `Scrape Debug HTML - ${file}`;
  const escapedSrcDoc = escapeHtml(body);
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
      p {
        margin: 0 0 12px 0;
        color: #908caa;
        font-size: 12px;
      }
      .frameWrap {
        margin: 0;
        background: #1f1d2e;
        border: 1px solid #403d52;
        border-radius: 8px;
        overflow: hidden;
        height: calc(100vh - 110px);
        min-height: 420px;
      }
      iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        background: white;
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(file)} (preview)</h1>
    <p>Sandboxed iframe preview of captured HTML response.</p>
    <div class="frameWrap">
      <iframe sandbox srcdoc="${escapedSrcDoc}"></iframe>
    </div>
  </body>
</html>`;
}

function renderDiagnosticsPage(
  captureId: string,
  jsonBody: string,
  htmlBody: string,
): string {
  const escapedJson = escapeHtml(jsonBody);
  const escapedHtmlSrcDoc = escapeHtml(withRosePinePreviewTheme(htmlBody));
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Scrape diagnostics - ${escapeHtml(captureId)}</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        padding: 16px;
        background: #191724;
        color: #e0def4;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      }
      h1 { margin: 0 0 14px 0; font-size: 14px; color: #9ccfd8; }
      .stack { display: grid; grid-template-columns: 1fr; gap: 12px; }
      .panel { background: #1f1d2e; border: 1px solid #403d52; border-radius: 8px; overflow: hidden; }
      .panel h2 { margin: 0; padding: 8px 10px; font-size: 12px; color: #9ccfd8; border-bottom: 1px solid #403d52; }
      pre {
        margin: 0; padding: 10px; max-height: 38vh; overflow: auto;
        white-space: pre-wrap; word-break: break-word; line-height: 1.45; font-size: 12px;
      }
      iframe {
        display: block; width: 100%; height: 58vh; min-height: 420px;
        border: 0; background: #191724;
      }
    </style>
  </head>
  <body>
    <h1>Scrape diagnostics: ${escapeHtml(captureId)}</h1>
    <div class="stack">
      <section class="panel">
        <h2>Metadata JSON</h2>
        <pre>${escapedJson}</pre>
      </section>
      <section class="panel">
        <h2>HTML Preview</h2>
        <iframe sandbox srcdoc="${escapedHtmlSrcDoc}"></iframe>
      </section>
    </div>
  </body>
</html>`;
}

export function registerScrapeDebugRoutes(app: Hono) {
  app.get("/api/scrape-debug/:captureId/diagnostics", async (c) => {
    if (!isScrapeDebugEnabled()) {
      return c.json({ error: "Not found" }, 404);
    }
    const captureId = c.req.param("captureId");
    if (!/^[a-z0-9-]+$/i.test(captureId)) {
      return c.json({ error: "Invalid capture ID" }, 400);
    }
    const jsonFile = `${captureId}.json`;
    const htmlFile = `${captureId}.html`;
    const jsonPath = resolveCapturePath(jsonFile);
    const htmlPath = resolveCapturePath(htmlFile);
    if (!jsonPath || !htmlPath) {
      return c.json({ error: "Invalid debug capture path" }, 400);
    }
    try {
      const [jsonBody, htmlBody] = await Promise.all([
        readFile(jsonPath, "utf-8"),
        readFile(htmlPath, "utf-8"),
      ]);
      return c.html(
        renderDiagnosticsPage(captureId, jsonBody, htmlBody),
        200,
        {
          "cache-control": "no-store",
        },
      );
    } catch {
      return c.json({ error: "Debug capture not found" }, 404);
    }
  });

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
      const isHtml = file.endsWith(".html");
      const viewMode = c.req.query("view") === "1";
      if (isJson && viewMode) {
        return c.html(renderJsonViewerHtml(file, body), 200, {
          "cache-control": "no-store",
        });
      }
      if (isHtml && viewMode) {
        return c.html(renderHtmlPreviewViewerHtml(file, body), 200, {
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
