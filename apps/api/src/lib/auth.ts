import { account, session, user, verification } from "@tokyo-listings/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { createMailer } from "./email";
import { createLogger } from "./logger";

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

const baseURL = process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

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
      const subject = "Reset your Tokyo Listings password";
      const text = [
        "Hi,",
        "",
        "We received a request to reset the password for your Tokyo Listings account.",
        "Open the link below (it expires soon):",
        "",
        url,
        "",
        "If you did not request this, you can ignore this email.",
        "",
        "— Tokyo Listings",
      ].join("\n");
      const html = `<p>Hi,</p><p>We received a request to reset the password for your Tokyo Listings account.</p><p><a href="${url}">Reset your password</a> (expires soon).</p><p>If you did not request this, you can ignore this email.</p><p>— Tokyo Listings</p>`;
      void mailer
        .send({
          to: u.email,
          subject,
          text,
          html,
        })
        .catch((err: unknown) => {
          logger.error({ err }, "password reset email failed");
        });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user: u, url }) => {
      const subject = "Verify your Tokyo Listings email";
      const text = [
        "Hi,",
        "",
        "Please confirm your email address for Tokyo Listings by opening the link below (it expires soon):",
        "",
        url,
        "",
        "— Tokyo Listings",
      ].join("\n");
      const html = `<p>Hi,</p><p>Please confirm your email address for Tokyo Listings.</p><p><a href="${url}">Verify your email</a> (expires soon).</p><p>— Tokyo Listings</p>`;
      void mailer
        .send({
          to: u.email,
          subject,
          text,
          html,
        })
        .catch((err: unknown) => {
          logger.error({ err }, "verification email failed");
        });
    },
  },
  trustedOrigins: [baseURL],
});
