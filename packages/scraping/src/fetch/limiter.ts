import type { ScrapeEnv } from "../core/env";

type Release = () => void;

function createSemaphore(maxConcurrent: number): {
  acquire: () => Promise<void>;
  release: Release;
} {
  let available = maxConcurrent;
  const waiters: (() => void)[] = [];

  return {
    acquire(): Promise<void> {
      if (available > 0) {
        available -= 1;
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        waiters.push(resolve);
      });
    },
    release(): void {
      const next = waiters.shift();
      if (next) {
        next();
      } else {
        available += 1;
      }
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Limits total concurrent fetches, limits concurrent requests per hostname, and enforces
 * a minimum gap between the end of one request to a host and the start of the next to that host.
 */
export function createFetchLimiter(
  env: Pick<ScrapeEnv, "globalMaxConcurrent" | "perHostMinIntervalMs" | "perHostMaxInFlight">,
): {
  run<T>(hostname: string, fn: () => Promise<T>): Promise<T>;
} {
  const globalSem = createSemaphore(env.globalMaxConcurrent);
  const hostSemaphores = new Map<string, ReturnType<typeof createSemaphore>>();
  const lastEndByHost = new Map<string, number>();

  function hostSem(host: string) {
    let s = hostSemaphores.get(host);
    if (!s) {
      s = createSemaphore(env.perHostMaxInFlight);
      hostSemaphores.set(host, s);
    }
    return s;
  }

  return {
    async run<T>(hostname: string, fn: () => Promise<T>): Promise<T> {
      await globalSem.acquire();
      await hostSem(hostname).acquire();
      try {
        const lastEnd = lastEndByHost.get(hostname) ?? 0;
        const waitMs = Math.max(0, lastEnd + env.perHostMinIntervalMs - Date.now());
        if (waitMs > 0) {
          await sleep(waitMs);
        }
        try {
          return await fn();
        } finally {
          lastEndByHost.set(hostname, Date.now());
        }
      } finally {
        hostSem(hostname).release();
        globalSem.release();
      }
    },
  };
}
