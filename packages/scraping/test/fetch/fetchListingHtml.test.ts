import { describe, expect, test } from "vitest";
import {
  DEFAULT_SCRAPE_USER_AGENT,
  DEFAULT_SCRAPE_USER_AGENT_FIREFOX,
} from "../../src/fetch/browserHeaders";
import { FetchListingHtmlError, fetchListingHtml } from "../../src/fetch/fetchListingHtml";

function mockResponse(init: {
  status: number;
  body: string;
  contentType?: string;
}): Response {
  return new Response(init.body, {
    status: init.status,
    headers: {
      "content-type": init.contentType ?? "text/html; charset=utf-8",
    },
  });
}

describe("fetchListingHtml", () => {
  test("rejects HTTP 202 even when body looks like HTML (e.g. AWS WAF shell)", async () => {
    const fetchImpl: typeof fetch = async () =>
      mockResponse({
        status: 202,
        body: "<!DOCTYPE html><html><title>x</title></html>",
      });

    let caught: unknown;
    try {
      await fetchListingHtml({
        url: "https://example.com/",
        timeoutMs: 5000,
        maxBodyBytes: 1_000_000,
        fetchImpl,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(FetchListingHtmlError);
    expect((caught as FetchListingHtmlError).code).toBe("http_error");
    expect((caught as FetchListingHtmlError).message).toContain("HTTP 202");
  });

  test("accepts HTTP 200 with text/html", async () => {
    const fetchImpl: typeof fetch = async () =>
      mockResponse({
        status: 200,
        body: "<!DOCTYPE html><html></html>",
      });

    const out = await fetchListingHtml({
      url: "https://example.com/",
      timeoutMs: 5000,
      maxBodyBytes: 1_000_000,
      fetchImpl,
    });

    expect(out.status).toBe(200);
    expect(out.html).toContain("<!DOCTYPE html>");
  });

  test("retries once on HTTP 202 then succeeds on 200", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      if (calls === 1) {
        return mockResponse({
          status: 202,
          body: "<!DOCTYPE html><html></html>",
        });
      }
      return mockResponse({
        status: 200,
        body: "<!DOCTYPE html><html><title>ok</title></html>",
      });
    };

    const out = await fetchListingHtml({
      url: "https://example.com/",
      timeoutMs: 5000,
      maxBodyBytes: 1_000_000,
      fetchImpl,
      retries: 1,
      retryDelayMs: 1,
    });

    expect(calls).toBe(2);
    expect(out.status).toBe(200);
    expect(out.html).toContain("ok");
  });

  test("auto profile alternates UA fingerprint on retry (Chrome -> Firefox)", async () => {
    const userAgents: string[] = [];
    let calls = 0;
    const fetchImpl: typeof fetch = async (_input, init) => {
      calls += 1;
      const h = init?.headers as Record<string, string>;
      userAgents.push(h["User-Agent"]);
      if (calls === 1) {
        return mockResponse({
          status: 202,
          body: "<!DOCTYPE html><html></html>",
        });
      }
      return mockResponse({
        status: 200,
        body: "<!DOCTYPE html><html>ok</html>",
      });
    };

    await fetchListingHtml({
      url: "https://example.com/",
      timeoutMs: 5000,
      maxBodyBytes: 1_000_000,
      fetchImpl,
      retries: 1,
      retryDelayMs: 1,
      headerProfile: "auto",
    });

    expect(userAgents[0]).toBe(DEFAULT_SCRAPE_USER_AGENT);
    expect(userAgents[1]).toBe(DEFAULT_SCRAPE_USER_AGENT_FIREFOX);
  });
});
