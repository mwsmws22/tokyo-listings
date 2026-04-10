import {
  buildBrowserLikeHeaders,
  DEFAULT_SCRAPE_USER_AGENT,
  DEFAULT_SCRAPE_USER_AGENT_FIREFOX,
  type BrowserHeaderProfile,
} from "./browserHeaders";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export { DEFAULT_SCRAPE_USER_AGENT } from "./browserHeaders";

export type FetchListingHtmlResult = {
  html: string;
  finalUrl: string;
  status: number;
};

export class FetchListingHtmlError extends Error {
  readonly code: "timeout" | "too_large" | "http_error" | "network" | "not_html";

  constructor(
    message: string,
    code: "timeout" | "too_large" | "http_error" | "network" | "not_html",
  ) {
    super(message);
    this.name = "FetchListingHtmlError";
    this.code = code;
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

async function dumpHomes202HtmlForDebug(url: string, html: string): Promise<void> {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return;
  }
  if (hostname !== "www.homes.co.jp" && hostname !== "homes.co.jp") {
    return;
  }

  const ts = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const fileName = `homes-202-${ts}.html`;
  const outputDirs = [
    "/home/smbuser/mws-server/tokyo-listings/output",
    "/app/output",
    path.resolve(process.cwd(), "output"),
  ];
  for (const outputDir of outputDirs) {
    const filePath = path.join(outputDir, fileName);
    try {
      await mkdir(outputDir, { recursive: true });
      await writeFile(filePath, html, "utf-8");
      return;
    } catch {
      // Temporary best-effort debug path; keep scraper behavior unchanged on write failures.
    }
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

    // Many CDNs/WAFs return 202 with a challenge or empty shell; `fetch` still treats that as `ok`.
    if (res.status !== 200) {
      if (res.status === 202) {
        await dumpHomes202HtmlForDebug(options.url, html);
      }
      const hint =
        res.status === 202
          ? " — server returned a challenge or placeholder page, not the listing HTML (often bot protection)"
          : "";
      throw new FetchListingHtmlError(`HTTP ${res.status}${hint}`, "http_error");
    }

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      throw new FetchListingHtmlError(`Unexpected content type: ${ct}`, "not_html");
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
