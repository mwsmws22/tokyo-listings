export const DEFAULT_SCRAPE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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
};

export async function fetchListingHtml(
  options: FetchListingHtmlOptions,
): Promise<FetchListingHtmlResult> {
  const fetchFn: FetchLike = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const res = await fetchFn(options.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": options.userAgent ?? DEFAULT_SCRAPE_USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const buf = await res.arrayBuffer();
    if (buf.byteLength > options.maxBodyBytes) {
      throw new FetchListingHtmlError("Response body exceeds configured maximum size", "too_large");
    }

    const html = new TextDecoder("utf-8").decode(buf);

    if (!res.ok) {
      throw new FetchListingHtmlError(`HTTP ${res.status}`, "http_error");
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
