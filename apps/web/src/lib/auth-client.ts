import { createAuthClient } from "better-auth/react";

function resolveAuthClientBaseURL(): string {
  const configuredURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
  if (configuredURL) {
    return configuredURL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

/** Public web origin (where `/api/*` is rewritten to the API). */
const baseURL = resolveAuthClientBaseURL();

export const authClient = createAuthClient({
  baseURL,
});
