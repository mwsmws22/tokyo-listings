import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  account,
  session,
  user,
  verification,
} from "@tokyo-listings/db";
import { db } from "./db.ts";
import { createMailer } from "./email.ts";
import { createLogger } from "./logger.ts";

const logger = createLogger();
const mailer = createMailer(logger);

function requireAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET is required in production");
  }
  return "dev-only-better-auth-secret-min-32-chars-long!";
}

const baseURL =
  process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL,
  secret: requireAuthSecret(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user: u, url }) => {
      void mailer
        .send({
          to: u.email,
          subject: "Reset your Tokyo Listings password",
          text: `Open this link to reset your password (expires soon):\n${url}\n`,
        })
        .catch((err: unknown) => {
          logger.error({ err }, "password reset email failed");
        });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user: u, url }) => {
      void mailer
        .send({
          to: u.email,
          subject: "Verify your Tokyo Listings email",
          text: `Verify your email by opening:\n${url}\n`,
        })
        .catch((err: unknown) => {
          logger.error({ err }, "verification email failed");
        });
    },
  },
  trustedOrigins: [baseURL],
});
