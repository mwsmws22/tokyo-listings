import {
  buildBrowserLikeHeaders,
  DEFAULT_SCRAPE_USER_AGENT,
  DEFAULT_SCRAPE_USER_AGENT_FIREFOX,
  type BrowserHeaderProfile,
} from "./browserHeaders";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export { DEFAULT_SCRAPE_USER_AGENT } from "./browserHeaders";

export type FetchListingHtmlResult = {
  html: string;
  finalUrl: string;
  status: number;
};

export class FetchListingHtmlError extends Error {
  readonly code: "timeout" | "too_large" | "http_error" | "network" | "not_html";
  readonly debugCaptureId?: string;

  constructor(
    message: string,
    code: "timeout" | "too_large" | "http_error" | "network" | "not_html",
    options?: { debugCaptureId?: string },
  ) {
    super(message);
    this.name = "FetchListingHtmlError";
    this.code = code;
    this.debugCaptureId = options?.debugCaptureId;
  }
}

/** Subset of `fetch` sufficient for tests (mocks need not implement every lib.dom property). */
export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export type FetchListingHtmlOptions = {
  url: string;
  timeoutMs: number;
  maxBodyBytes: number;
  fetchImpl?: FetchLike;
  userAgent?: string;
  headerProfile?: BrowserHeaderProfile;
  acceptLanguage?: string;
  /**
   * Extra full fetch attempts after retriable HTTP failures (202/403/429/503).
   * Default 0. Set via `SCRAPE_FETCH_RETRIES` for flaky WAF or rate limits.
   */
  retries?: number;
  /** Base delay before each retry; small jitter is added. Default 1000 ms. */
  retryDelayMs?: number;
};

const SCRAPE_DEBUG_OUTPUT_DIR = path.resolve(process.cwd(), "output/scrape-debug");
const SCRAPE_DEBUG_MAX_FILES = 200;

function isSupportedScrapeDebugHost(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname === "www.athome.co.jp" ||
      hostname === "athome.co.jp" ||
      hostname === "www.suumo.jp" ||
      hostname === "suumo.jp" ||
      hostname === "www.homes.co.jp" ||
      hostname === "homes.co.jp"
    );
  } catch {
    return false;
  }
}

type DebugCaptureInput = {
  url: string;
  finalUrl?: string;
  portal?: "athome" | "suumo" | "lifull_homes";
  status?: number;
  errorCode: "timeout" | "too_large" | "http_error" | "network" | "not_html";
  message: string;
  contentType?: string;
  responseHeaders?: Record<string, string>;
  html?: string;
};

async function pruneScrapeDebugDirectory(maxFiles: number): Promise<void> {
  const entries = await readdir(SCRAPE_DEBUG_OUTPUT_DIR).catch(() => []);
  if (entries.length <= maxFiles) {
    return;
  }
  const details = await Promise.all(
    entries.map(async (name) => {
      const filePath = path.join(SCRAPE_DEBUG_OUTPUT_DIR, name);
      const s = await stat(filePath);
      return { filePath, mtimeMs: s.mtimeMs };
    }),
  );
  details.sort((a, b) => a.mtimeMs - b.mtimeMs);
  const toDelete = details.slice(0, Math.max(0, details.length - maxFiles));
  await Promise.all(toDelete.map((entry) => rm(entry.filePath, { force: true })));
}

async function writeFetchDebugCapture(input: DebugCaptureInput): Promise<string | undefined> {
  if (!isSupportedScrapeDebugHost(input.url)) {
    return undefined;
  }
  const captureId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const htmlFilePath = path.join(SCRAPE_DEBUG_OUTPUT_DIR, `${captureId}.html`);
  const jsonFilePath = path.join(SCRAPE_DEBUG_OUTPUT_DIR, `${captureId}.json`);
  const payload = {
    captureId,
    url: input.url,
    finalUrl: input.finalUrl ?? null,
    portal: input.portal ?? null,
    status: input.status ?? null,
    contentType: input.contentType ?? null,
    responseHeaders: input.responseHeaders ?? {},
    errorCode: input.errorCode,
    message: input.message,
    timestamp: new Date().toISOString(),
  };
  try {
    await mkdir(SCRAPE_DEBUG_OUTPUT_DIR, { recursive: true });
    await writeFile(jsonFilePath, JSON.stringify(payload, null, 2), "utf-8");
    if (input.html) {
      await writeFile(htmlFilePath, input.html, "utf-8");
    }
    await pruneScrapeDebugDirectory(SCRAPE_DEBUG_MAX_FILES);
    return captureId;
  } catch {
    return undefined;
  }
}

function isRetriableHttpErrorMessage(message: string): boolean {
  return /\bHTTP (202|403|429|503)\b/.test(message);
}

function retryDelayWithJitter(baseMs: number): number {
  const jitter = Math.floor(Math.random() * 400);
  return baseMs + jitter;
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchListingHtmlOnce(
  options: FetchListingHtmlOptions & { userAgent: string },
): Promise<FetchListingHtmlResult> {
  const fetchFn: FetchLike = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const res = await fetchFn(options.url, {
      signal: controller.signal,
      headers: buildBrowserLikeHeaders(
        options.url,
        options.userAgent,
        options.headerProfile,
        options.acceptLanguage,
      ),
      redirect: "follow",
    });

    const buf = await res.arrayBuffer();
    if (buf.byteLength > options.maxBodyBytes) {
      throw new FetchListingHtmlError("Response body exceeds configured maximum size", "too_large");
    }

    const html = new TextDecoder("utf-8").decode(buf);
    const responseHeaders = {
      "content-type": res.headers.get("content-type") ?? "",
      server: res.headers.get("server") ?? "",
      "cf-ray": res.headers.get("cf-ray") ?? "",
      "x-cache": res.headers.get("x-cache") ?? "",
    };

    // Many CDNs/WAFs return 202 with a challenge or empty shell; `fetch` still treats that as `ok`.
    if (res.status !== 200) {
      const debugCaptureId = await writeFetchDebugCapture({
        url: options.url,
        finalUrl: res.url,
        status: res.status,
        errorCode: "http_error",
        message: `HTTP ${res.status}`,
        contentType: res.headers.get("content-type") ?? "",
        responseHeaders,
        html,
      });
      const hint =
        res.status === 202
          ? " — server returned a challenge or placeholder page, not the listing HTML (often bot protection)"
          : "";
      throw new FetchListingHtmlError(`HTTP ${res.status}${hint}`, "http_error", {
        debugCaptureId,
      });
    }

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      const debugCaptureId = await writeFetchDebugCapture({
        url: options.url,
        finalUrl: res.url,
        status: res.status,
        errorCode: "not_html",
        message: `Unexpected content type: ${ct}`,
        contentType: ct,
        responseHeaders,
        html,
      });
      throw new FetchListingHtmlError(`Unexpected content type: ${ct}`, "not_html", { debugCaptureId });
    }

    return {
      html,
      finalUrl: res.url,
      status: res.status,
    };
  } catch (e) {
    if (e instanceof FetchListingHtmlError) {
      throw e;
    }
    if (e instanceof Error && e.name === "AbortError") {
      throw new FetchListingHtmlError("Request timed out", "timeout");
    }
    if (e instanceof Error) {
      throw new FetchListingHtmlError(e.message, "network");
    }
    throw new FetchListingHtmlError("Unknown fetch error", "network");
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchListingHtml(options: FetchListingHtmlOptions): Promise<FetchListingHtmlResult> {
  const pinnedUserAgent = options.userAgent;
  const profile = options.headerProfile ?? "auto";
  const maxAttempts = 1 + Math.max(0, options.retries ?? 0);
  const baseDelay = Math.max(0, options.retryDelayMs ?? 1000);

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await sleep(retryDelayWithJitter(baseDelay));
    }
    try {
      const alternate = attempt % 2 === 1;
      const useFirefox = profile === "auto" && !pinnedUserAgent && alternate;
      const attemptUserAgent = pinnedUserAgent
        ? pinnedUserAgent
        : useFirefox
          ? DEFAULT_SCRAPE_USER_AGENT_FIREFOX
          : DEFAULT_SCRAPE_USER_AGENT;
      const attemptProfile: BrowserHeaderProfile =
        profile === "auto" ? (useFirefox ? "firefox" : "chrome") : profile;
      return await fetchListingHtmlOnce({
        ...options,
        userAgent: attemptUserAgent,
        headerProfile: attemptProfile,
      });
    } catch (e) {
      lastError = e;
      const canRetry =
        e instanceof FetchListingHtmlError &&
        e.code === "http_error" &&
        isRetriableHttpErrorMessage(e.message) &&
        attempt < maxAttempts - 1;
      if (!canRetry) {
        throw e;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new FetchListingHtmlError("HTTP request failed", "http_error");
}
