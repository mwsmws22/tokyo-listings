import type { Hono } from "hono";
import { auth } from "../lib/auth.ts";

export function registerAuthRoutes(app: Hono) {
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
}
