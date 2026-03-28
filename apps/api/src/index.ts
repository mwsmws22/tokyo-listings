import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createLogger } from "./lib/logger.ts";
import { registerAuthRoutes } from "./routes/auth.ts";
import { registerTrpc } from "./routes/trpc.ts";

const log = createLogger();

const webOrigin =
  process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

const app = new Hono();

app.onError((err, c) => {
  log.error({ err }, "unhandled request error");
  return c.json({ error: "Internal Server Error" }, 500);
});

app.use(
  "*",
  cors({
    origin: webOrigin,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

registerAuthRoutes(app);

registerTrpc(app);

const port = Number(process.env.PORT ?? "8787");

log.info({ port, webOrigin }, "api listening");

serve({
  fetch: app.fetch,
  port,
});
