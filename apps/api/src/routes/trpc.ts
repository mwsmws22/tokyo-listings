import { trpcServer } from "@hono/trpc-server";
import type { Hono } from "hono";
import { createTRPCContext } from "../trpc/context.ts";
import { appRouter } from "../trpc/router.ts";

export function registerTrpc(app: Hono) {
  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (opts) => createTRPCContext({ req: opts.req }),
    }),
  );
}
