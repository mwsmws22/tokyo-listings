import { createAuthClient } from "better-auth/react";

/** Public web origin (where `/api/*` is rewritten to the API). Must match `BETTER_AUTH_URL` on the server. */
const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
});
