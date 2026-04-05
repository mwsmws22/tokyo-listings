import { describe, expect, test } from "bun:test";
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
});
