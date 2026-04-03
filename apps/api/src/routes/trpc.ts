import { trpcServer } from "@hono/trpc-server";
import type { Hono } from "hono";
import { createTRPCContext } from "../trpc/context";
import { appRouter } from "../trpc/router";

export function registerTrpc(app: Hono) {
  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (opts) => createTRPCContext({ req: opts.req }),
    }),
  );
}
